import type { PhoneNumber, SMSMessage } from '../types';
import { getSettings } from './settingsService';

const areSignalWireCredentialsConfigured = (): boolean => {
    const { signalwireSpaceUrl, signalwireProjectId, signalwireApiToken } = getSettings();
    return !!(signalwireSpaceUrl && signalwireProjectId && signalwireApiToken);
};

async function signalwireFetch(endpoint: string, options: RequestInit = {}): Promise<any> {
    const { signalwireSpaceUrl, signalwireProjectId, signalwireApiToken, proxyUrl } = getSettings();

    if (!areSignalWireCredentialsConfigured()) {
        throw new Error('SignalWire credentials are not configured or are invalid.');
    }

    const cleanedSpaceUrl = signalwireSpaceUrl.replace(/^https?:\/\//, '').replace(/\/$/, '');
    const API_BASE = `https://${cleanedSpaceUrl}/api/laml/2010-04-01`;

    const url = `${API_BASE}/Accounts/${signalwireProjectId}/${endpoint}`;
    
    const headers = new Headers(options.headers);
    headers.set('Authorization', 'Basic ' + btoa(`${signalwireProjectId}:${signalwireApiToken}`));

    const proxyBase = proxyUrl.trim() || 'https://cors-anywhere.herokuapp.com';
    const finalProxyUrl = proxyBase.endsWith('/') ? proxyBase.slice(0, -1) : proxyBase;
    
    const response = await fetch(`${finalProxyUrl}/${url}`, { ...options, headers });
    
    const responseText = await response.text();

    if (!response.ok) {
        let errorMessage: string;
        try {
            const errorData = JSON.parse(responseText);
            errorMessage = errorData.message || JSON.stringify(errorData);
        } catch (jsonError) {
             if (responseText.includes('cors-anywhere') || responseText.includes('corsdemo')) {
                 errorMessage = 'The API proxy needs activation. Please open the proxy activation page, request temporary access, and then come back and refresh.';
            } else {
                errorMessage = responseText.trim() || `API request failed with status ${response.status}`;
            }
        }
        throw new Error(`SignalWire API Error: ${errorMessage}`);
    }
    
    // Gracefully handle empty or whitespace-only successful responses to prevent JSON parsing errors.
    if (!responseText.trim()) {
        if (endpoint.includes('IncomingPhoneNumbers.json')) {
            return { incoming_phone_numbers: [] };
        }
        if (endpoint.includes('Messages.json')) {
            return { messages: [] };
        }
        return {}; // Return empty object for other cases to prevent crashes.
    }

    try {
        return JSON.parse(responseText);
    } catch (e) {
        console.error("SignalWire API Error: Failed to parse successful response as JSON.", responseText, e);
        throw new Error("The SignalWire API returned an invalid format.");
    }
}

/**
 * Fetches all pages for a given SignalWire list resource.
 * @param initialEndpoint The starting endpoint (e.g., 'Messages.json').
 * @param resourceKey The key in the response object that holds the array of items (e.g., 'messages').
 * @returns A promise that resolves to an array of all items from all pages.
 */
const fetchAllSignalWirePages = async (initialEndpoint: string, resourceKey: string): Promise<any[]> => {
    const allItems: any[] = [];
    let endpoint: string | null = initialEndpoint;

    while (endpoint) {
        const data = await signalwireFetch(endpoint);
        allItems.push(...(data[resourceKey] || []));
        
        if (data.next_page_uri) {
            // next_page_uri is relative to the API base, e.g. /2010-04-01/Accounts/.../Resource.json?Page=1
            const path = data.next_page_uri;
            const accountsIndex = path.indexOf('/Accounts/');
            if (accountsIndex > -1) {
                const afterAccounts = path.substring(accountsIndex + '/Accounts/'.length);
                const firstSlashIndex = afterAccounts.indexOf('/');
                endpoint = firstSlashIndex > -1 ? afterAccounts.substring(firstSlashIndex + 1) : null;
            } else {
                endpoint = null;
            }
        } else {
            endpoint = null;
        }
    }
    return allItems;
};

const mapSignalWireNumberToPhoneNumber = (swNumber: any): PhoneNumber => {
    // SignalWire API for numbers doesn't provide ISO country code.
    // We can leave it blank and let the user set it in the admin panel.
    return {
        id: swNumber.sid, // They use SIDs too
        number: swNumber.phone_number,
        country: 'Unknown Country', // User can override this in admin
        countryCode: '', // User can set this
        lastMessageAt: new Date(0),
        createdAt: new Date(swNumber.date_created),
        webhookUrl: swNumber.sms_url || '',
        enabled: true,
        provider: 'signalwire',
    };
};

const mapSignalWireMessageToSMSMessage = (swMessage: any): SMSMessage => {
    return {
        id: swMessage.sid,
        from: swMessage.from,
        body: swMessage.body,
        receivedAt: new Date(swMessage.date_sent),
    };
};

export const getOwnedNumbers = async (): Promise<PhoneNumber[]> => {
    if (!areSignalWireCredentialsConfigured()) {
        return []; // Don't throw, just return empty so one provider being down doesn't kill the app
    }
    
    try {
        const swNumbers = await fetchAllSignalWirePages('IncomingPhoneNumbers.json', 'incoming_phone_numbers');
        
        const numbersWithActivity = await Promise.all(
            swNumbers.map(async (swNumber: any) => {
                const number = mapSignalWireNumberToPhoneNumber(swNumber);
                try {
                    const messageData = await signalwireFetch(`Messages.json?To=${encodeURIComponent(number.number)}&PageSize=1`);
                    if (messageData.messages && messageData.messages.length > 0) {
                        number.lastMessageAt = new Date(messageData.messages[0].date_sent);
                    }
                } catch {
                    number.lastMessageAt = new Date(0);
                }
                return number;
            })
        );
        return numbersWithActivity;
    } catch (error) {
        console.error("Failed to fetch owned numbers from SignalWire:", error);
        throw error;
    }
};

export const getNumberByValue = async (numberValue: string): Promise<PhoneNumber | undefined> => {
     if (!areSignalWireCredentialsConfigured()) {
        return undefined;
     }
     try {
        const data = await signalwireFetch(`IncomingPhoneNumbers.json?PhoneNumber=${encodeURIComponent(numberValue)}`);
        const swNumbers = data.incoming_phone_numbers || [];
        if (swNumbers.length > 0) {
            return mapSignalWireNumberToPhoneNumber(swNumbers[0]);
        }
        return undefined;
    } catch (error) {
        console.error(`Failed to fetch number ${numberValue} from SignalWire:`, error);
        throw error;
    }
}


export const getMessagesForNumber = async (phoneNumber: string): Promise<SMSMessage[]> => {
    if (!areSignalWireCredentialsConfigured()) {
        throw new Error('SignalWire credentials are not configured or are invalid.');
    }
    try {
        const swMessages = await fetchAllSignalWirePages(`Messages.json?To=${encodeURIComponent(phoneNumber)}&PageSize=50`, 'messages');
        return swMessages.map(mapSignalWireMessageToSMSMessage);
    } catch (error) {
        console.error(`Failed to fetch messages for ${phoneNumber} from SignalWire:`, error);
        throw error;
    }
};