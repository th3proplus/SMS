import type { Settings } from '../types';

const SETTINGS_KEY = 'sms_receiver_settings';

const defaultSettings: Settings = {
    title: 'Free SMS Receiver',
    description: 'Receive SMS online for free. Select a number to get started.',
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
            id: '1674950400000',
            title: 'The Ultimate Guide to Online Account Verification',
            slug: 'online-account-verification-guide',
            content: 'Signing up for a new online service often involves a verification step. But when should you use your real phone number, and when is a temporary one a better choice?\n\n## When to Use Your Real Number\n\n- **Primary Accounts**: For your primary email, banking, or government services, always use your real, secure phone number. These accounts are tied to your identity and require the highest level of security.\n- **Trusted Services**: Reputable companies with strong privacy policies that you plan to use long-term are generally safe for your real number.\n\n## When to Use a Temporary Number\n\n- **One-Time Sign-Ups**: Need to access content on a site you\'ll likely never visit again? A temporary number is perfect.\n- **Testing an App**: If you\'re trying out a new app or service and aren\'t sure you\'ll stick with it, protect your privacy by using a disposable number.\n- **Avoiding Marketing Lists**: Signing up for a discount or loyalty program can often lead to a flood of marketing texts. Use a temporary number to keep your personal line clean.\n\nBy being strategic about which number you provide, you can enjoy the benefits of online services while minimizing spam and protecting your personal information.',
            excerpt: 'Signing up for a new service? Our guide helps you decide when to use your real phone number and when a temporary one is the smarter, safer choice.',
            featuredImageUrl: 'https://images.unsplash.com/photo-1611926653458-0929221b27cf?q=80&w=1000&auto=format&fit=crop',
            isPublished: true,
            publishedAt: new Date('2023-01-29T00:00:00.000Z'),
            tags: ['Verification', 'Tips', 'Security'],
            metaTitle: 'The Guide to Online Account Verification | Free SMS Receiver',
            metaDescription: 'Learn the best practices for online account verification. Know when to use a temporary number to protect your privacy and avoid spam.'
        },
        {
            id: '1674345600000',
            title: 'What Are Virtual Phone Numbers and How Do They Work?',
            slug: 'what-are-virtual-phone-numbers',
            content: 'Virtual phone numbers, like the ones on our site, work without being tied to a specific physical device or SIM card. But how is that possible?\n\n### The Magic of the Cloud\n\nInstead of relying on traditional phone lines, virtual numbers operate over the internet using Voice over IP (VoIP) technology. Here\'s a simple breakdown:\n\n1.  **A Number in the Cloud**: When you select one of our numbers, you\'re choosing a number that exists on a cloud communications platform (like Twilio or SignalWire).\n2.  **Receiving the SMS**: When a service sends an SMS to that number, it\'s first received by the cloud platform.\n3.  **Forwarding via API**: The platform then uses an API to instantly forward the message content to our website.\n4.  **Displaying the Message**: Our application receives this data and displays it on the number\'s page for you to see in real-time.\n\nThis process is incredibly fast and allows a single number to be managed entirely through software, making it accessible from anywhere in the world through a web browser.',
            excerpt: 'Ever wondered how virtual numbers work without a SIM card? We break down the technology behind our free SMS receiver service.',
            featuredImageUrl: 'https://images.unsplash.com/photo-1523961131990-5ea7c61b2107?q=80&w=1000&auto=format&fit=crop',
            isPublished: true,
            publishedAt: new Date('2023-01-22T00:00:00.000Z'),
            tags: ['Technology', 'How To', 'Explanation'],
            metaTitle: 'How Virtual Phone Numbers Work | Tech Explained',
            metaDescription: 'A simple explanation of the technology behind virtual phone numbers and how they can receive SMS online without a physical SIM card.'
        },
        {
            id: '1673740800000',
            title: 'Securing Your Digital Footprint: Beyond Temporary Numbers',
            slug: 'securing-your-digital-footprint',
            content: 'Using a temporary number is an excellent first step in protecting your digital privacy, but it\'s part of a larger strategy. To truly secure your online presence, consider these additional tools and habits:\n\n### Use a Password Manager\nCreating strong, unique passwords for every site is the single most effective thing you can do for your security. A password manager makes this easy by generating and storing complex passwords for you.\n\n### Enable Two-Factor Authentication (2FA)\nWhenever possible, enable 2FA on your important accounts. This adds a second layer of security, typically a code from an authenticator app, making it much harder for unauthorized users to gain access even if they have your password.\n\n### Be Wary of Public Wi-Fi\nPublic Wi-Fi networks can be insecure. When using them, avoid logging into sensitive accounts. For better protection, use a Virtual Private Network (VPN) to encrypt your internet traffic and hide your activity from prying eyes.\n\nBy combining these practices, you create a robust defense for your digital life.',
            excerpt: 'While temporary numbers are great for sign-ups, true online security requires a multi-layered approach. Learn about other essential tools.',
            featuredImageUrl: 'https://images.unsplash.com/photo-1555949963-ff9fe0c870eb?q=80&w=1000&auto=format&fit=crop',
            isPublished: true,
            publishedAt: new Date('2023-01-15T00:00:00.000Z'),
            tags: ['Security', 'Privacy', 'Guide'],
            metaTitle: 'How to Secure Your Digital Footprint | Advanced Privacy Tips',
            metaDescription: 'Go beyond temporary phone numbers. Learn how to use password managers, two-factor authentication (2FA), and VPNs to secure your online life.'
        },
        {
            id: '1672531200000',
            title: 'How to Use Temporary Numbers for Online Privacy',
            slug: 'temporary-numbers-for-privacy',
            content: 'In an age where digital privacy is paramount, safeguarding your personal phone number has never been more crucial. Online services, from social media to e-commerce, often require phone verification, exposing your number to potential spam and security risks.\n\n## Why Use a Temporary Number?\n\n- **Avoid Spam**: Keep your primary inbox clean from marketing messages.\n- **Protect Identity**: Sign up for services without linking them to your real-world identity.\n- **Enhance Security**: Prevent SIM-swapping attacks by not exposing your real number.\n\nUsing our free SMS receiver service provides a simple and effective layer of protection. Simply choose a number from our list, use it for verification, and view the message instantly on our site. It\'s a straightforward way to maintain your privacy in a connected world.',
            excerpt: 'Learn the best practices for using temporary phone numbers to safeguard your personal information on various online platforms and services.',
            featuredImageUrl: 'https://images.unsplash.com/photo-1554224155-169544351720?q=80&w=1000&auto=format&fit=crop',
            isPublished: true,
            publishedAt: new Date('2023-01-01T00:00:00.000Z'),
            tags: ['Privacy', 'Security', 'Tips'],
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
            tags: ['How To', 'Guide'],
            metaTitle: 'Top 5 Reasons for a Free SMS Receiver',
            metaDescription: 'Explore the top benefits of using a free SMS receiving service, from online verification to enhanced privacy and security.'
        }
    ],
    customPages: [],
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
                    tags: post.tags || [], // Ensure tags array exists
                }));
            }

            if (parsed.customPages && Array.isArray(parsed.customPages)) {
                parsed.customPages = parsed.customPages.map((page: any) => ({
                    ...page,
                    createdAt: new Date(page.createdAt),
                    updatedAt: new Date(page.updatedAt),
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
            mergedSettings.customPages = parsed.customPages || defaultSettings.customPages;

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