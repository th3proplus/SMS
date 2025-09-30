import type { PhoneNumber, SMSMessage, Settings, WebhookLog } from '../types';
import { getSettings } from './settingsService';

// --- CACHING HELPERS ---

const CACHE_KEY_NUMBERS = 'sms_receiver_numbers_cache';

/**
 * Retrieves cached phone numbers from localStorage.
 * @returns {PhoneNumber[]} An array of phone numbers, or an empty array if cache is empty/invalid.
 */
const getCachedNumbers = (): PhoneNumber[] => {
    try {
        const cachedData = localStorage.getItem(CACHE_KEY_NUMBERS);
        if (!cachedData) return [];
        
        const parsed = JSON.parse(cachedData) as any[];
        // Re-hydrate Date objects from their string representation in JSON
        return parsed.map(num => ({
            ...num,
            lastMessageAt: new Date(num.lastMessageAt),
            createdAt: new Date(num.createdAt),
        }));
    } catch (error) {
        console.error("Failed to read or parse cached numbers:", error);
        localStorage.removeItem(CACHE_KEY_NUMBERS); // Clear corrupted cache
        return [];
    }
};

/**
 * Saves a list of phone numbers to the localStorage cache.
 * @param {PhoneNumber[]} numbers The array of numbers to cache.
 */
const cacheNumbers = (numbers: PhoneNumber[]): void => {
    try {
        localStorage.setItem(CACHE_KEY_NUMBERS, JSON.stringify(numbers));
    } catch (error) {
        console.error("Failed to cache numbers:", error);
    }
};


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
// A proxy is required to bypass browser CORS restrictions. The default public proxy
// is unreliable. Users can specify their own in the settings for a permanent solution.
async function twilioFetch(endpoint: string, options: RequestInit = {}): Promise<any> {
    const { twilioAccountSid, twilioAuthToken, proxyUrl } = getSettings();
    
    if (!areTwilioCredentialsConfigured()) {
        throw new Error('Twilio credentials are not configured or are invalid.');
    }
    
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

    const proxyBase = proxyUrl.trim() || 'https://cors-anywhere.herokuapp.com';
    // Ensure there's no double slash if proxyUrl ends with one
    const finalProxyUrl = proxyBase.endsWith('/') ? proxyBase.slice(0, -1) : proxyBase;

    const response = await fetch(`${finalProxyUrl}/${url}`, { ...options, headers });

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
        console.warn('Twilio credentials not configured. Attempting to load numbers from cache.');
        return getCachedNumbers();
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
        
        cacheNumbers(numbersWithActivity); // Cache the fresh data on successful fetch
        return numbersWithActivity;

    } catch (error) {
        console.error("Failed to fetch owned numbers from Twilio, falling back to cache:", error);
        const cachedNumbers = getCachedNumbers();
        if (cachedNumbers.length > 0) {
            return cachedNumbers; // Return cached data on failure
        }
        // Only throw an error if the API fails AND the cache is empty
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