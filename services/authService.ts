import { getSettings, saveSettings } from './settingsService';
import type { Settings } from '../types';

const AUTH_KEY = 'sms_receiver_auth';
const THIRTY_DAYS_IN_MS = 30 * 24 * 60 * 60 * 1000;

interface AuthData {
    isAuthenticated: boolean;
    expiresAt: number;
}


// Mock authentication logic
export const login = (username: string, password: string): Promise<boolean> => {
    return new Promise(resolve => {
        setTimeout(() => {
            const settings = getSettings();
            if (username === settings.adminUsername && password === settings.adminPassword) {
                const expirationTime = Date.now() + THIRTY_DAYS_IN_MS;
                const authData: AuthData = {
                    isAuthenticated: true,
                    expiresAt: expirationTime,
                };
                localStorage.setItem(AUTH_KEY, JSON.stringify(authData));
                resolve(true);
            } else {
                resolve(false);
            }
        }, 500); // Simulate network delay
    });
};

export const logout = (): void => {
    localStorage.removeItem(AUTH_KEY);
};

export const isAuthenticated = (): boolean => {
    try {
        const storedAuthData = localStorage.getItem(AUTH_KEY);
        if (!storedAuthData) {
            return false;
        }

        const authData: AuthData = JSON.parse(storedAuthData);
        
        if (authData.isAuthenticated && authData.expiresAt > Date.now()) {
            return true;
        } else {
            // Token has expired or is invalid, clear it
            localStorage.removeItem(AUTH_KEY);
            return false;
        }
    } catch (error) {
        console.error("Error parsing auth data from localStorage", error);
        // Clear potentially corrupted data
        localStorage.removeItem(AUTH_KEY);
        return false;
    }
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