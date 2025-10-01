import type { Settings } from '../types';

const SETTINGS_KEY = 'sms_receiver_settings';

const defaultSettings: Settings = {
    title: 'Free SMS Receiver',
    description: 'Receive SMS online for free. Select a number to get started.',
    theme: 'dark',
    footerText: `© ${new Date().getFullYear()} Free SMS Receiver. All rights reserved.`,
    footerLinks: [
        { text: 'About', url: '/about' },
        { text: 'Privacy Policy', url: '/privacy' },
        { text: 'Terms of Service', url: '/terms' },
    ],
    aboutPageContent: '## About Us\n\nWelcome to our Free SMS Receiver service! We provide temporary and disposable phone numbers to help you protect your privacy. Use our numbers for online verification, testing, or any other purpose without revealing your personal phone number.\n\nOur service is fast, free, and easy to use.',
    privacyPageContent: '## Privacy Policy\n\nYour privacy is important to us. We do not require any personal information to use our service. Messages are public and are automatically deleted after a certain period. Please do not use our service for sensitive information.',
    termsPageContent: '## Terms of Service\n\nBy using this service, you agree to not use it for any illegal activities. The service is provided "as is" without any warranties. We are not responsible for any misuse of the information provided on this site.',
    adsenseEnabled: false,
    headCode: '',
    ads: {
        homePageAd: '',
        numberPageTopAd: '',
        numberPageInFeedAd: '',
    },
    proxyUrl: '',
    twilioAccountSid: 'ACxxxxxxxxxxxxxxxxxxxxxxxxxxxxx',
    twilioAuthToken: '',
    signalwireSpaceUrl: '',
    signalwireProjectId: '',
    signalwireApiToken: '',
    adminUsername: 'admin',
    adminPassword: 'password',
    enableBlogSection: false,
    wordpressUrl: '',
    publicNumbers: [],
};

export const getSettings = (): Settings => {
    try {
        const storedSettings = localStorage.getItem(SETTINGS_KEY);
        if (storedSettings) {
            const parsed = JSON.parse(storedSettings);
            
            // Fix: Re-hydrate Date objects for phone numbers, which get stringified in localStorage.
            // This prevents crashes when sorting or formatting dates from cached settings.
            if (parsed.publicNumbers && Array.isArray(parsed.publicNumbers)) {
                parsed.publicNumbers = parsed.publicNumbers.map((num: any) => ({
                    ...num,
                    lastMessageAt: new Date(num.lastMessageAt),
                    createdAt: new Date(num.createdAt),
                }));
            }

            // Create a new object by layering defaults, then parsed data, then deep-merge specific complex objects
            const mergedSettings = { 
                ...defaultSettings, 
                ...parsed
            };
            // Now handle nested objects explicitly to prevent them from being overwritten completely
            mergedSettings.ads = {
                ...defaultSettings.ads,
                ...(parsed.ads || {})
            };
            mergedSettings.footerLinks = parsed.footerLinks || defaultSettings.footerLinks;
            // We've already processed publicNumbers, so we can just assign it
            mergedSettings.publicNumbers = parsed.publicNumbers || defaultSettings.publicNumbers;

            return mergedSettings;
        }
    } catch (error) {
        console.error("Failed to parse settings from localStorage", error);
    }
    return defaultSettings;
};

export const saveSettings = (settings: Settings): void => {
    try {
        localStorage.setItem(SETTINGS_KEY, JSON.stringify(settings));
        window.dispatchEvent(new CustomEvent('settingsChanged'));
    } catch (error) {
        console.error("Failed to save settings to localStorage", error);
    }
};

export const applyTheme = (theme: 'light' | 'dark'): void => {
    const root = document.documentElement;
    if (theme === 'light') {
        root.classList.remove('dark');
    } else {
        root.classList.add('dark');
    }
};