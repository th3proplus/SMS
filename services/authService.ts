// FIX: Add .ts extension for module resolution
import { getSettings, saveSettings } from './settingsService.ts';
// FIX: Add .ts extension for module resolution
import type { Settings } from '../types.ts';

// Using new key names to prevent conflicts with the old JSON-based token format during transition.
const PERSISTENT_AUTH_KEY = 'sms_receiver_auth_expires_at';
const SESSION_AUTH_KEY = 'sms_receiver_session_active';
const THIRTY_DAYS_IN_MS = 30 * 24 * 60 * 60 * 1000;

export const login = (username: string, password: string, rememberMe: boolean): Promise<boolean> => {
    return new Promise(resolve => {
        setTimeout(() => {
            const settings = getSettings();
            if (username === settings.adminUsername && password === settings.adminPassword) {
                logout(); // Clear any previous sessions first

                if (rememberMe) {
                    const expirationTime = Date.now() + THIRTY_DAYS_IN_MS;
                    localStorage.setItem(PERSISTENT_AUTH_KEY, expirationTime.toString());
                } else {
                    sessionStorage.setItem(SESSION_AUTH_KEY, 'true');
                }
                resolve(true);
            } else {
                resolve(false);
            }
        }, 500); // Simulate network delay
    });
};

export const logout = (): void => {
    localStorage.removeItem(PERSISTENT_AUTH_KEY);
    sessionStorage.removeItem(SESSION_AUTH_KEY);
};

export const isAuthenticated = (): boolean => {
    // 1. Check for a persistent token in localStorage
    const expirationTimestamp = localStorage.getItem(PERSISTENT_AUTH_KEY);
    if (expirationTimestamp) {
        const expirationTime = parseInt(expirationTimestamp, 10);
        // Check if it's a valid number and hasn't expired
        if (!isNaN(expirationTime) && expirationTime > Date.now()) {
            return true;
        } else {
            // Invalid or expired token, remove it for hygiene
            localStorage.removeItem(PERSISTENT_AUTH_KEY);
        }
    }

    // 2. Check for a session token in sessionStorage
    const sessionFlag = sessionStorage.getItem(SESSION_AUTH_KEY);
    if (sessionFlag === 'true') {
        return true;
    }

    // 3. Not authenticated if neither token is valid
    return false;
};

export const updateCredentials = (username: string, password: string): Promise<void> => {
    return new Promise(resolve => {
        const settings = getSettings();
        const newSettings: Settings = {
            ...settings,
            adminUsername: username,
            adminPassword: password,
        };
        saveSettings(newSettings);
        resolve();
    });
}
