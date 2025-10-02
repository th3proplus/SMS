import type { Settings } from '../types';

const SETTINGS_KEY = 'sms_receiver_settings';

const defaultSettings: Settings = {
    title: 'Free SMS Receiver',
    description: 'Receive SMS online for free. Select a number to get started.',
    theme: 'dark',
    footerText: `© ${new Date().getFullYear()} Free SMS Receiver. All rights reserved.`,
    footerLinks: [
        { text: 'Blog', url: '/blog' },
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
    publicNumbers: [],
    posts: [
        {
            id: '1672531200000',
            title: 'How to Use Temporary Numbers for Online Privacy',
            slug: 'temporary-numbers-for-privacy',
            content: 'In an age where digital privacy is paramount, safeguarding your personal phone number has never been more crucial. Online services, from social media to e-commerce, often require phone verification, exposing your number to potential spam and security risks.\n\n## Why Use a Temporary Number?\n\n- **Avoid Spam**: Keep your primary inbox clean from marketing messages.\n- **Protect Identity**: Sign up for services without linking them to your real-world identity.\n- **Enhance Security**: Prevent SIM-swapping attacks by not exposing your real number.\n\nUsing our free SMS receiver service provides a simple and effective layer of protection. Simply choose a number from our list, use it for verification, and view the message instantly on our site. It\'s a straightforward way to maintain your privacy in a connected world.',
            excerpt: 'Learn the best practices for using temporary phone numbers to safeguard your personal information on various online platforms and services.',
            featuredImageUrl: 'https://images.unsplash.com/photo-1554224155-169544351720?q=80&w=1000&auto=format&fit=crop',
            isPublished: true,
            publishedAt: new Date('2023-01-01T00:00:00.000Z'),
            metaTitle: 'Use Temporary Numbers for Privacy | Free SMS Receiver',
            metaDescription: 'Discover how temporary phone numbers can protect your privacy online. Our guide covers best practices and benefits.'
        },
        {
            id: '1673136000000',
            title: 'Top 5 Reasons to Use a Free SMS Receiver',
            slug: 'top-5-reasons-for-sms-receiver',
            content: 'Free SMS receiver services offer more than just a temporary number; they provide a valuable tool for modern internet users. Here are the top five reasons to incorporate one into your digital life:\n\n1. **Account Verification**: Easily verify accounts without using your personal number.\n2. **App Testing**: Developers can test SMS functionalities without managing SIM cards.\n3. **Global Access**: Access numbers from different countries to use international services.\n4. **Anonymity**: Engage with online communities without revealing personal details.\n5. **It\'s Free**: Protect your privacy without any cost.\n\nReady to get started? Browse our available numbers today!',
            excerpt: 'From avoiding spam to protecting your identity, discover the key benefits of using a free online SMS receiver for your verification needs.',
            featuredImageUrl: 'https://images.unsplash.com/photo-1604782206214-f535272a1b9f?q=80&w=1000&auto=format&fit=crop',
            isPublished: true,
            publishedAt: new Date('2023-01-08T00:00:00.000Z'),
            metaTitle: 'Top 5 Reasons for a Free SMS Receiver',
            metaDescription: 'Explore the top benefits of using a free SMS receiving service, from online verification to enhanced privacy and security.'
        }
    ]
};

export const getSettings = (): Settings => {
    try {
        const storedSettings = localStorage.getItem(SETTINGS_KEY);
        if (storedSettings) {
            const parsed = JSON.parse(storedSettings);
            
            if (parsed.publicNumbers && Array.isArray(parsed.publicNumbers)) {
                parsed.publicNumbers = parsed.publicNumbers.map((num: any) => ({
                    ...num,
                    lastMessageAt: new Date(num.lastMessageAt),
                    createdAt: new Date(num.createdAt),
                }));
            }

            if (parsed.posts && Array.isArray(parsed.posts)) {
                parsed.posts = parsed.posts.map((post: any) => ({
                    ...post,
                    publishedAt: new Date(post.publishedAt),
                }));
            }

            const mergedSettings = { 
                ...defaultSettings, 
                ...parsed
            };

            mergedSettings.ads = {
                ...defaultSettings.ads,
                ...(parsed.ads || {})
            };
            mergedSettings.footerLinks = parsed.footerLinks || defaultSettings.footerLinks;
            mergedSettings.publicNumbers = parsed.publicNumbers || defaultSettings.publicNumbers;
            mergedSettings.posts = parsed.posts || defaultSettings.posts;

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
