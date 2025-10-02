export interface FooterLink {
  text: string;
  url: string;
}

export interface PhoneNumber {
  id: string;
  number: string;
  country: string;
  countryCode: string;
  lastMessageAt: Date;
  createdAt: Date;
  webhookUrl: string;
  enabled: boolean;
  provider: 'twilio' | 'signalwire' | 'demo';
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
    errorCode: string;
    message: string;
}

export interface BlogPost {
    id: string;
    title: string;
    slug: string;
    content: string;
    excerpt: string;
    featuredImageUrl: string;
    isPublished: boolean;
    publishedAt: Date;
    editorMode?: 'markdown' | 'html';
}

export interface Settings {
  title: string;
  description: string;
  theme: 'light' | 'dark';
  headCode: string;

  // Twilio
  twilioAccountSid: string;
  twilioAuthToken: string;

  // SignalWire
  signalwireSpaceUrl: string;
  signalwireProjectId: string;
  signalwireApiToken: string;
  
  // Proxy
  proxyUrl: string;

  // Admin
  adminUsername: string;
  adminPassword: string;

  // Public Numbers
  publicNumbers: PhoneNumber[];
  
  // Content
  footerText: string;
  footerLinks: FooterLink[];
  aboutPageContent: string;
  privacyPageContent: string;
  termsPageContent: string;
  
  // Blog
  posts: BlogPost[];

  // Ads
  adsenseEnabled: boolean;
  ads: {
    homePageAd: string;
    numberPageTopAd: string;
    numberPageInFeedAd: string;
  };
}