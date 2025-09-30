export interface PhoneNumber {
  id: string;
  number: string;
  country: string;
  countryCode: string;
  lastMessageAt: Date;
  createdAt: Date;
  webhookUrl: string;
  enabled: boolean;
}

export interface SMSMessage {
  id: string;
  from: string;
  body: string;
  receivedAt: Date;
}

export interface WebhookLog {
    id: string;
    timestamp: Date;
    logLevel: 'error' | 'warning' | 'notice';
    errorCode: string | null;
    message: string;
}

export interface FooterLink {
    text: string;
    url: string;
}

export interface Settings {
    title: string;
    description: string;
    theme: 'light' | 'dark';
    footerText: string;
    footerLinks: FooterLink[];
    aboutPageContent: string;
    privacyPageContent: string;
    termsPageContent: string;
    adsenseEnabled: boolean;
    headCode: string;
    ads: {
        homePageAd: string;
        numberPageTopAd: string;
        numberPageInFeedAd: string;
    };
    proxyUrl: string;
    twilioAccountSid: string;
    twilioAuthToken: string;
    adminUsername: string;
    adminPassword: string;
    publicNumbers: PhoneNumber[];
}