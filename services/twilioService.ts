import type { PhoneNumber, SMSMessage, Settings, WebhookLog } from '../types';
import { getSettings } from './settingsService';

// --- TWILIO API HELPERS ---

const API_BASE = 'https://api.twilio.com/2010-04-01';

/**
 * Checks if the Twilio credentials in settings are configured and not placeholders.
 * @returns {boolean} True if credentials seem valid, false otherwise.
 */
const areTwilioCredentialsConfigured = (): boolean => {
    const { twilioAccountSid, twilioAuthToken } = getSettings();
    return (
        twilioAccountSid &&
        twilioAccountSid.startsWith('AC') &&
        twilioAccountSid !== 'ACxxxxxxxxxxxxxxxxxxxxxxxxxxxxx' &&
        twilioAuthToken &&
        twilioAuthToken.trim().length > 0
    );
};

// This function performs the fetch call to the Twilio API with Basic Auth.
// WARNING: This is insecure on the client-side and is for demonstration purposes only.
//
// The public CORS proxy (cors-anywhere.herokuapp.com) used here is rate-limited and not
// suitable for production. It may require a one-time visit to its landing page to activate
// before use. For a real application, all API calls must be proxied through your own backend.
async function twilioFetch(endpoint: string, options: RequestInit = {}): Promise<any> {
    const { twilioAccountSid, twilioAuthToken } = getSettings();
    
    if (!areTwilioCredentialsConfigured()) {
        throw new Error('Twilio credentials are not configured or are invalid.');
    }
    
    // Using a CORS proxy for development. In production, this logic must be on a server.
    // Fix: Correctly append .json before query parameters.
    const queryIndex = endpoint.indexOf('?');
    let resource = endpoint;
    let queryString = '';

    if (queryIndex !== -1) {
        resource = endpoint.substring(0, queryIndex);
        queryString = endpoint.substring(queryIndex);
    }

    const url = `${API_BASE}/Accounts/${twilioAccountSid}/${resource}.json${queryString}`;

    const headers = new Headers(options.headers);
    headers.set('Authorization', 'Basic ' + btoa(`${twilioAccountSid}:${twilioAuthToken}`));

    const response = await fetch(`https://cors-anywhere.herokuapp.com/${url}`, { ...options, headers });

    if (!response.ok) {
        let errorMessage: string;
        // Read the response body as text first to avoid "body stream already read" errors.
        const errorText = await response.text();
        
        // Try to parse the text as JSON. Twilio errors are often JSON.
        try {
            const errorData = JSON.parse(errorText);
            console.error('Twilio API Error (JSON):', errorData);
            errorMessage = errorData.message || JSON.stringify(errorData);
        } catch (jsonError) {
            // If parsing fails, it's plain text or HTML (e.g., from the CORS proxy).
            console.error('Twilio API Error (Non-JSON):', errorText);
            if (errorText.includes('cors-anywhere') || errorText.includes('corsdemo')) {
                 errorMessage = 'The API proxy needs activation. This is a common step for the demo proxy used by this app. Please open the proxy activation page, request temporary access, and then come back and refresh.';
            } else {
                errorMessage = errorText.trim() || `API request failed with status ${response.status}`;
            }
        }
        
        throw new Error(errorMessage);
    }
    
    // For successful responses, we expect JSON.
    return response.json();
}

const regionNames = new Intl.DisplayNames(['en'], {type: 'region'});

// Maps a Twilio phone number resource to our PhoneNumber type
const mapTwilioNumberToPhoneNumber = (twilioNumber: any, numberSettings: Settings['numberSettings']): PhoneNumber => {
    const customSettings = numberSettings[twilioNumber.sid] || {};
    
    // Determine the final country code (override from settings > API)
    const finalCountryCode = customSettings.countryCode || twilioNumber.iso_country;

    // Determine the country name based on the final code
    let countryName = 'Unknown Country';
    if (finalCountryCode) {
        try {
            // Try to get a proper name from the code
            countryName = regionNames.of(finalCountryCode) || finalCountryCode;
        } catch (e) {
            // If the code is invalid (e.g., 'XX'), fallback to the code itself
            countryName = finalCountryCode;
        }
    }
    
    // Override country name with custom display name if it exists
    const finalCountryName = customSettings.country && customSettings.country.trim() !== '' 
        ? customSettings.country 
        : countryName;

    return {
        id: twilioNumber.sid,
        number: twilioNumber.phone_number,
        country: finalCountryName,
        countryCode: finalCountryCode, // Use the final, possibly overridden code
        lastMessageAt: new Date(0), // Default value, will be updated by getOwnedNumbers
        createdAt: new Date(twilioNumber.date_created),
        webhookUrl: twilioNumber.sms_url || '',
        enabled: customSettings.enabled ?? true, // Default to true if not set
    };
};

// Maps a Twilio message resource to our SMSMessage type
const mapTwilioMessageToSMSMessage = (twilioMessage: any): SMSMessage => {
    return {
        id: twilioMessage.sid,
        from: twilioMessage.from,
        body: twilioMessage.body,
        receivedAt: new Date(twilioMessage.date_sent),
    };
};

// Maps a Twilio Alert resource to our WebhookLog type
const mapTwilioAlertToWebhookLog = (twilioAlert: any): WebhookLog => {
    return {
        id: twilioAlert.sid,
        timestamp: new Date(twilioAlert.date_created),
        logLevel: twilioAlert.log_level,
        errorCode: twilioAlert.error_code,
        message: twilioAlert.alert_text,
    };
};


// --- SERVICE FUNCTIONS ---

// Simulates Twilio API: Get account config
export const getTwilioConfig = (): Promise<{
    accountSid: string;
    authToken: string;
    status: 'Connected' | 'Disconnected';
}> => {
     return new Promise(resolve => {
        const settings = getSettings();
        // Fix: Explicitly type `status` to match the Promise's return type. TypeScript was
        // inferring it as a generic `string`, causing a type mismatch.
        const status: 'Connected' | 'Disconnected' = areTwilioCredentialsConfigured() ? 'Connected' : 'Disconnected';
        const config = {
            accountSid: settings.twilioAccountSid,
            authToken: settings.twilioAuthToken ? '**********************************' : 'Not Set', // Obfuscate token for display
            status,
        };
        setTimeout(() => resolve(config), 300);
    });
};

export const getOwnedNumbers = async (): Promise<PhoneNumber[]> => {
    if (!areTwilioCredentialsConfigured()) {
        // Silently fail for the homepage to avoid showing a scary error on first load.
        // A message will appear on the homepage indicating no numbers were found.
        console.warn('Twilio credentials are not configured. Skipping fetch for owned numbers.');
        return [];
    }
    
    try {
        const { numberSettings } = getSettings();
        const data = await twilioFetch('IncomingPhoneNumbers');
        const twilioNumbers = data.incoming_phone_numbers || [];
        
        // Concurrently fetch the latest message for each number to determine last activity
        const numbersWithActivity = await Promise.all(
            twilioNumbers.map(async (twilioNumber: any) => {
                const number = mapTwilioNumberToPhoneNumber(twilioNumber, numberSettings);
                try {
                    const messageData = await twilioFetch(`Messages?To=${encodeURIComponent(number.number)}&PageSize=1`);
                    if (messageData.messages && messageData.messages.length > 0) {
                        number.lastMessageAt = new Date(messageData.messages[0].date_sent);
                    } else {
                        // If no messages, use an old date to sort it to the bottom
                        number.lastMessageAt = new Date(0); 
                    }
                } catch {
                    // On error fetching messages, also use an old date
                    number.lastMessageAt = new Date(0);
                }
                return number;
            })
        );
        return numbersWithActivity;

    } catch (error) {
        console.error("Failed to fetch owned numbers from Twilio:", error);
        throw error; 
    }
};

export const getNumberByValue = async (numberValue: string): Promise<PhoneNumber | undefined> => {
     try {
        const { numberSettings } = getSettings();
        const data = await twilioFetch(`IncomingPhoneNumbers?PhoneNumber=${encodeURIComponent(numberValue)}`);
        const twilioNumbers = data.incoming_phone_numbers || [];
        if (twilioNumbers.length > 0) {
            return mapTwilioNumberToPhoneNumber(twilioNumbers[0], numberSettings);
        }
        return undefined;
    } catch (error) {
        console.error(`Failed to fetch number ${numberValue} from Twilio:`, error);
        throw error;
    }
}

export const getMessagesForNumber = async (phoneNumber: string): Promise<SMSMessage[]> => {
    try {
        const data = await twilioFetch(`Messages?To=${encodeURIComponent(phoneNumber)}&PageSize=50`);
        const twilioMessages = data.messages || [];
        return twilioMessages.map(mapTwilioMessageToSMSMessage);
    } catch (error) {
        console.error(`Failed to fetch messages for ${phoneNumber} from Twilio:`, error);
        throw error;
    }
};

export const getWebhookLogs = async (): Promise<WebhookLog[]> => {
    if (!areTwilioCredentialsConfigured()) {
        // Throw error for admin panel to explicitly show the configuration issue.
        throw new Error('Twilio credentials are not configured or are invalid.');
    }
    try {
        const data = await twilioFetch('Alerts?PageSize=100');
        const twilioAlerts = data.alerts || [];
        return twilioAlerts.map(mapTwilioAlertToWebhookLog);
    } catch (error) {
        console.error("Failed to fetch webhook logs from Twilio:", error);
        throw error;
    }
};