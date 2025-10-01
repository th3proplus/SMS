import { getSettings, saveSettings } from './settingsService';
import type { Settings } from '../types';

const AUTH_KEY = 'sms_receiver_auth';
const THIRTY_DAYS_IN_MS = 30 * 24 * 60 * 60 * 1000;

interface AuthData {
    isAuthenticated: boolean;
    expiresAt?: number; // Expiration is optional, for session-only auth
}

// Authentication logic
export const login = (username: string, password: string, rememberMe: boolean): Promise<boolean> => {
    return new Promise(resolve => {
        setTimeout(() => {
            const settings = getSettings();
            if (username === settings.adminUsername && password === settings.adminPassword) {
                // Clear any previous sessions from either storage
                logout(); 
                
                if (rememberMe) {
                    const expirationTime = Date.now() + THIRTY_DAYS_IN_MS;
                    const authData: AuthData = {
                        isAuthenticated: true,
                        expiresAt: expirationTime,
                    };
                    localStorage.setItem(AUTH_KEY, JSON.stringify(authData));
                } else {
                    const authData: AuthData = {
                        isAuthenticated: true,
                    };
                    sessionStorage.setItem(AUTH_KEY, JSON.stringify(authData));
                }
                resolve(true);
            } else {
                resolve(false);
            }
        }, 500); // Simulate network delay
    });
};

export const logout = (): void => {
    localStorage.removeItem(AUTH_KEY);
    sessionStorage.removeItem(AUTH_KEY);
};

export const isAuthenticated = (): boolean => {
    // 1. Check for a long-term session in localStorage
    try {
        const storedAuthData = localStorage.getItem(AUTH_KEY);
        if (storedAuthData) {
            const authData: AuthData = JSON.parse(storedAuthData);
            if (authData.isAuthenticated && authData.expiresAt && authData.expiresAt > Date.now()) {
                return true;
            } else {
                // Token has expired or is invalid, clear it
                localStorage.removeItem(AUTH_KEY);
            }
        }
    } catch (error) {
        console.error("Error parsing auth data from localStorage", error);
        localStorage.removeItem(AUTH_KEY);
    }

    // 2. If no long-term session, check for a short-term session in sessionStorage
    try {
        const sessionAuthData = sessionStorage.getItem(AUTH_KEY);
        if (sessionAuthData) {
            const authData: AuthData = JSON.parse(sessionAuthData);
            if (authData.isAuthenticated) {
                return true;
            }
        }
    } catch (error) {
        console.error("Error parsing auth data from sessionStorage", error);
        sessionStorage.removeItem(AUTH_KEY);
    }
    
    // 3. If no valid session found in either, user is not authenticated
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