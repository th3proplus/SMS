import type { PhoneNumber, SMSMessage } from '../types';
// Fix: Import getNumberByValue from twilioService to make it available for re-export.
import { getOwnedNumbers, getMessagesForNumber, getNumberByValue } from './twilioService';

export const getAvailableNumbers = (): Promise<PhoneNumber[]> => {
  // This now gets numbers from our mock Twilio service
  return getOwnedNumbers();
};

export const getMessages = (phoneNumber: string): Promise<SMSMessage[]> => {
  // This now gets messages from the central message store in the mock Twilio service
  return getMessagesForNumber(phoneNumber);
};

// Fix: Export getNumberByValue to make it available to other parts of the application.
export { getNumberByValue };
