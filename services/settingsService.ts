import type { Settings } from '../types.ts';

const SETTINGS_KEY = 'sms_receiver_settings';

const defaultSettings: Settings = {
  title: 'SMS Receiver',
  description: 'Receive SMS online for free with our temporary and virtual phone numbers. Protect your privacy by using our disposable numbers for verification.',
  theme: 'light',
  headCode: '',
  twilioAccountSid: 'ACxxxxxxxxxxxxxxxxxxxxxxxxxxxxx',
  twilioAuthToken: '',
  signalwireSpaceUrl: '',
  signalwireProjectId: '',
  signalwireApiToken: '',
  proxyUrl: '',
  adminUsername: 'admin',
  adminPassword: 'password',
  publicNumbers: [],
  footerText: '© 2024 SMS Receiver. All rights reserved.',
  footerLinks: [
    { text: 'About', url: '/about' },
    { text: 'Privacy', url: '/privacy' },
    { text: 'Terms', url: '/terms' },
    { text: 'Blog', url: '/blog' },
  ],
  aboutPageContent: 'This is the about page. You can edit this content in the admin panel.',
  privacyPageContent: 'This is the privacy policy page. You can edit this content in the admin panel.',
  termsPageContent: 'This is the terms of service page. You can edit this content in the admin panel.',
  posts: [],
  adsenseEnabled: false,
  ads: {
    homePageAd: '',
    numberPageTopAd: '',
    numberPageInFeedAd: '',
  },
};

// Helper to deserialize dates
const reviver = (key: string, value: any) => {
    if (typeof value === 'string' && /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z$/.test(value)) {
        return new Date(value);
    }
    return value;
};


export const getSettings = (): Settings => {
    try {
        const storedSettings = localStorage.getItem(SETTINGS_KEY);
        if (storedSettings) {
            const parsed = JSON.parse(storedSettings, reviver);
            // Merge defaults with stored settings to handle new fields
            return { ...defaultSettings, ...parsed, ads: { ...defaultSettings.ads, ...parsed.ads } };
        }
    } catch (error) {
        console.error("Failed to parse settings from localStorage", error);
        localStorage.removeItem(SETTINGS_KEY);
    }
    return defaultSettings;
};

export const saveSettings = (settings: Settings): void => {
    try {
        const settingsString = JSON.stringify(settings);
        localStorage.setItem(SETTINGS_KEY, settingsString);
        window.dispatchEvent(new CustomEvent('settingsChanged'));
    } catch (error) {
        console.error("Failed to save settings to localStorage", error);
    }
};

export const applyTheme = (theme: 'light' | 'dark'): void => {
    const root = window.document.documentElement;
    if (theme === 'dark') {
        root.classList.add('dark');
    } else {
        root.classList.remove('dark');
    }
};
