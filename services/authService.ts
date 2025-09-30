import { getSettings, saveSettings } from './settingsService';
import type { Settings } from '../types';

const AUTH_KEY = 'sms_receiver_auth';

// Mock authentication logic
export const login = (username: string, password: string): Promise<boolean> => {
    return new Promise(resolve => {
        setTimeout(() => {
            const settings = getSettings();
            if (username === settings.adminUsername && password === settings.adminPassword) {
                localStorage.setItem(AUTH_KEY, 'true');
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
    return localStorage.getItem(AUTH_KEY) === 'true';
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
