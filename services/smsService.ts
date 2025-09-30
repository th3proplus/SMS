import type { PhoneNumber, SMSMessage } from '../types';
import { getOwnedNumbers, getMessagesForNumber, getNumberByValue } from './twilioService';
import { getSettings } from './settingsService';

export const getAvailableNumbers = async (): Promise<PhoneNumber[]> => {
    const settings = getSettings();
    const publicNumbersFromSettings = settings.publicNumbers || [];

    try {
        // Fetch live data from Twilio to get the latest activity
        const allLiveNumbers = await getOwnedNumbers();
        const liveDataMap = new Map(allLiveNumbers.map(n => [n.id, n]));

        // Merge live data with settings data
        const mergedNumbers = publicNumbersFromSettings.map(settingNumber => {
            const liveData = liveDataMap.get(settingNumber.id);
            if (liveData) {
                // If we have live data, use it for activity, but keep settings for display name/enabled status.
                // The order is important: properties from settingNumber will override liveData if they conflict.
                return {
                    ...liveData,
                    ...settingNumber,
                };
            }
            // If the API didn't return this number (e.g., temporary API error), fallback to just the saved setting data.
            return settingNumber;
        });

        return mergedNumbers;
    } catch (error) {
        console.warn("Could not fetch live number data from Twilio, returning numbers from settings cache.", error);
        // On API failure, return the numbers stored in settings as a fallback.
        return publicNumbersFromSettings;
    }
};

export const getMessages = (phoneNumber: string): Promise<SMSMessage[]> => {
  return getMessagesForNumber(phoneNumber);
};

export { getNumberByValue };