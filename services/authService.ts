import { getSettings, saveSettings } from './settingsService';
import type { Settings } from '../types';

// Use simpler keys since we are storing an object now
const SESSION_AUTH_KEY = 'sms_receiver_auth_session';
const PERSISTENT_AUTH_KEY = 'sms_receiver_auth_persistent';

// Keep the same expiration duration
const THIRTY_DAYS_IN_MS = 30 * 24 * 60 * 60 * 1000;

// Define the shape of the data we'll store
interface AuthData {
    expiresAt: number;
}

export const login = (username: string, password: string, rememberMe: boolean): Promise<boolean> => {
    return new Promise(resolve => {
        setTimeout(() => {
            const settings = getSettings();
            if (username === settings.adminUsername && password === settings.adminPassword) {
                logout(); // Clear any previous sessions first

                const authData: AuthData = {
                    expiresAt: Date.now() + THIRTY_DAYS_IN_MS
                };
                
                try {
                    const dataString = JSON.stringify(authData);
                    if (rememberMe) {
                        localStorage.setItem(PERSISTENT_AUTH_KEY, dataString);
                    } else {
                        sessionStorage.setItem(SESSION_AUTH_KEY, dataString);
                    }
                } catch (e) {
                    console.error("Failed to save auth data:", e);
                    // If storage fails, we can't log in successfully.
                    resolve(false);
                    return;
                }
                
                resolve(true);
            } else {
                resolve(false);
            }
        }, 500); // Simulate network delay
    });
};

export const logout = (): void => {
    sessionStorage.removeItem(SESSION_AUTH_KEY);
    localStorage.removeItem(PERSISTENT_AUTH_KEY);
};

// Helper function to safely get and parse auth data from storage
const getAuthData = (storage: Storage): AuthData | null => {
    const key = storage === localStorage ? PERSISTENT_AUTH_KEY : SESSION_AUTH_KEY;
    try {
        const dataString = storage.getItem(key);
        if (dataString) {
            const data = JSON.parse(dataString) as AuthData;
            // Basic validation
            if (data && typeof data.expiresAt === 'number') {
                return data;
            }
        }
    } catch (e) {
        console.error("Failed to read or parse auth data, clearing corrupted key:", e);
        // Clear corrupted data
        storage.removeItem(key);
    }
    return null;
};


export const isAuthenticated = (): boolean => {
    // Check session storage first
    let authData = getAuthData(sessionStorage);
    if (authData && authData.expiresAt > Date.now()) {
        return true;
    }

    // Then check local storage
    authData = getAuthData(localStorage);
    if (authData && authData.expiresAt > Date.now()) {
        return true;
    }
    
    // If we reach here, the session is invalid or expired.
    return false;
};

export const updateCredentials = (username: string, password?: string): Promise<void> => {
    return new Promise(resolve => {
        const settings = getSettings();
        
        const newSettings: Settings = {
            ...settings,
            adminUsername: username,
            // Only update password if a new, non-empty one is provided.
            adminPassword: password ? password : settings.adminPassword,
        };
        saveSettings(newSettings);
        resolve();
    });
}