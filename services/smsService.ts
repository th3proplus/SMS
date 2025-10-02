// FIX: Add .ts extension for module resolution
import type { PhoneNumber, SMSMessage } from '../types.ts';
import * as twilioService from './twilioService.ts';
import * as signalwireService from './signalwireService.ts';
// FIX: Add .ts extension for module resolution
import { getSettings } from './settingsService.ts';

export const getAvailableNumbers = async (): Promise<PhoneNumber[]> => {
    const settings = getSettings();
    const publicNumbersFromSettings = settings.publicNumbers || [];

    try {
        // Fetch live data from both providers concurrently
        const [twilioResult, signalwireResult] = await Promise.allSettled([
            twilioService.getOwnedNumbers(),
            signalwireService.getOwnedNumbers(),
        ]);

        let allLiveNumbers: PhoneNumber[] = [];
        if (twilioResult.status === 'fulfilled') {
            allLiveNumbers = allLiveNumbers.concat(twilioResult.value);
        } else {
            console.warn("Could not fetch numbers from Twilio", twilioResult.reason);
        }

        if (signalwireResult.status === 'fulfilled') {
            allLiveNumbers = allLiveNumbers.concat(signalwireResult.value);
        } else {
            console.warn("Could not fetch numbers from SignalWire", signalwireResult.reason);
        }

        const liveDataMap = new Map(allLiveNumbers.map(n => [n.id, n]));

        // Merge live data with settings data for public numbers
        const mergedNumbers = publicNumbersFromSettings.map(settingNumber => {
            const liveData = liveDataMap.get(settingNumber.id);
            if (liveData) {
                // Keep settings for display name/enabled status, but update activity.
                return {
                    ...liveData,
                    ...settingNumber,
                };
            }
            // If API failed for a provider, fallback to saved setting data.
            return settingNumber;
        });
        
        // Also include demo numbers
        return mergedNumbers.concat(twilioService.demoNumbers.filter(
             // Avoid duplicating demo numbers that might already be in public settings
            demoNum => !mergedNumbers.some(publicNum => publicNum.id === demoNum.id)
        ));

    } catch (error) {
        console.warn("Could not fetch any live number data, returning numbers from settings cache.", error);
        // On complete failure, return settings numbers and demo numbers.
        return publicNumbersFromSettings.concat(twilioService.demoNumbers.filter(
             demoNum => !publicNumbersFromSettings.some(publicNum => publicNum.id === demoNum.id)
        ));
    }
};

export const getMessages = (phoneNumber: string): Promise<SMSMessage[]> => {
    // Check demo messages first
    if (twilioService.demoMessages[phoneNumber]) {
        return Promise.resolve(twilioService.demoMessages[phoneNumber]);
    }
    
    // Find the number in settings to determine the provider
    const numberInfo = getSettings().publicNumbers.find(n => n.number === phoneNumber);

    if (!numberInfo) {
        // Fallback for numbers that might be accessed directly before settings are synced
        return twilioService.getMessagesForNumber(phoneNumber).catch(() => signalwireService.getMessagesForNumber(phoneNumber));
    }

    switch (numberInfo.provider) {
        case 'twilio':
            return twilioService.getMessagesForNumber(phoneNumber);
        case 'signalwire':
            return signalwireService.getMessagesForNumber(phoneNumber);
        default:
            throw new Error(`Unknown or unsupported provider for ${phoneNumber}: ${numberInfo.provider}`);
    }
};


export const getNumberByValue = async (numberValue: string): Promise<PhoneNumber | undefined> => {
     // Check demo numbers
    const demoNumber = twilioService.demoNumbers.find(n => n.number === numberValue);
    if (demoNumber) {
        return demoNumber;
    }

    // Check settings first for configured public numbers
    const settings = getSettings();
    const publicNumber = settings.publicNumbers.find(n => n.number === numberValue);
    if (publicNumber) {
        return publicNumber;
    }

    // As a fallback, query APIs directly
    try {
        const twilioNum = await twilioService.getNumberByValue(numberValue);
        if (twilioNum) return twilioNum;
    } catch (e) {
        console.warn(`Error checking Twilio for number ${numberValue}`, e);
    }
    
    try {
        const signalwireNum = await signalwireService.getNumberByValue(numberValue);
        if (signalwireNum) return signalwireNum;
    } catch (e) {
        console.warn(`Error checking SignalWire for number ${numberValue}`, e);
    }

    return undefined;
};
