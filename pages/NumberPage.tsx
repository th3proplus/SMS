import React, { useState, useEffect, useCallback } from 'react';
import type { PhoneNumber, SMSMessage, Settings } from '../types';
import { getMessages, getNumberByValue } from '../services/smsService';
import { getSettings } from '../services/settingsService';
import { updateMetadata } from '../services/seoService';
import Header from '../components/Header';
import MessageCard from '../components/MessageCard';
import Footer from '../components/Footer';
import AdsenseAd from '../components/AdsenseAd';
import { RefreshIcon } from '../components/icons/RefreshIcon';
import { ChevronLeftIcon } from '../components/icons/ChevronLeftIcon';
import { CopyIcon } from '../components/icons/CopyIcon';

interface NumberPageProps {
  phoneNumber: string;
}

const REFRESH_INTERVAL_SECONDS = 15;

const NumberPage: React.FC<NumberPageProps> = ({ phoneNumber }) => {
  const [numberDetails, setNumberDetails] = useState<PhoneNumber | null>(null);
  const [messages, setMessages] = useState<SMSMessage[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [settings, setSettings] = useState<Settings>(getSettings());
  const [isCopied, setIsCopied] = useState(false);
  const [countdown, setCountdown] = useState(REFRESH_INTERVAL_SECONDS);

  const fetchMessages = useCallback(async (showLoader: boolean = true) => {
    if (showLoader) setIsLoading(true);
    setError(null);
    try {
      const messagesData = await getMessages(phoneNumber);
      setMessages(messagesData.sort((a, b) => b.receivedAt.getTime() - a.receivedAt.getTime()));
    } catch (err: any) {
      setError(err.message || 'Failed to fetch messages.');
      console.error(err);
    } finally {
      if (showLoader) setIsLoading(false);
    }
  }, [phoneNumber]);
  
  useEffect(() => {
    if (numberDetails) {
        updateMetadata({
            title: `Messages for ${numberDetails.number} - ${settings.title}`,
            description: `View incoming SMS messages for the free virtual phone number ${numberDetails.number}. Use this temporary number for online verification and protect your privacy.`,
            path: `/number/${encodeURIComponent(numberDetails.number)}`,
        });
    }
  }, [numberDetails, settings.title]);

  useEffect(() => {
    const fetchNumberDetails = async () => {
        try {
            const details = await getNumberByValue(phoneNumber);
            if (details) {
                setNumberDetails(details);
            } else {
                setError(`Phone number ${phoneNumber} not found.`);
            }
        } catch (err: any) {
            setError(err.message || 'Failed to fetch number details.');
            console.error(err);
        }
    };

    const handleSettingsChange = () => {
        setSettings(getSettings());
    }
    window.addEventListener('settingsChanged', handleSettingsChange);
    
    fetchNumberDetails();
    fetchMessages(true);

    return () => {
        window.removeEventListener('settingsChanged', handleSettingsChange);
    };

  }, [phoneNumber, fetchMessages]);

  // Auto-refresh messages with countdown
  useEffect(() => {
    const timer = setInterval(() => {
        setCountdown(prev => {
            if (prev <= 1) {
                fetchMessages(false);
                return REFRESH_INTERVAL_SECONDS;
            }
            return prev - 1;
        });
    }, 1000);
    return () => clearInterval(timer);
  }, [fetchMessages]);

  const handleCopyNumber = () => {
    if (!numberDetails) return;
    navigator.clipboard.writeText(numberDetails.number).then(() => {
        setIsCopied(true);
        setTimeout(() => setIsCopied(false), 2000);
    });
  };

  const handleManualRefresh = () => {
    if (isLoading) return;
    setCountdown(REFRESH_INTERVAL_SECONDS);
    fetchMessages(true);
  };

  const renderContent = () => {
    if (isLoading) {
      return (
        <div className="flex-grow flex items-center justify-center p-4">
            <div className="flex flex-col items-center gap-4">
                <RefreshIcon className="w-10 h-10 text-teal-500 dark:text-teal-400 animate-spin" />
                <p className="text-slate-500 dark:text-slate-400">Fetching messages...</p>
            </div>
        </div>
      );
    }
    
    if (error) {
         return (
            <div className="flex-grow flex items-center justify-center p-4">
                <div className="text-center p-10">
                     <p className="font-semibold text-red-500 mb-2">Could not load messages</p>
                     <p className="text-sm text-slate-500 dark:text-slate-400 mb-4">{error}</p>
                     {error.includes('credentials') && (
                         <p className="text-sm text-slate-500 dark:text-slate-400">
                             Please configure your Twilio Account SID and Auth Token in the <a href="/login" className="text-teal-500 hover:underline font-semibold">Admin Panel</a>.
                         </p>
                     )}
                </div>
            </div>
         );
    }

    if (messages.length === 0) {
      return (
        <div className="flex-grow flex items-center justify-center p-4">
          <div className="text-center">
            <h3 className="text-xl font-semibold text-slate-700 dark:text-slate-300">No Messages Yet</h3>
            <p className="text-slate-500 dark:text-slate-400 mt-2">Send an SMS to {numberDetails?.number} to see it here.</p>
          </div>
        </div>
      );
    }
    
    const messageElements: React.ReactNode[] = [];
    messages.forEach((message, index) => {
        messageElements.push(<MessageCard key={message.id} message={message} />);
        // Insert an ad after the 3rd message
        if (index === 2) {
            messageElements.push(
                <div key="ad-feed" className="my-2 p-2 bg-slate-100 dark:bg-slate-900/50 rounded-lg">
                    <AdsenseAd adKey="numberPageInFeedAd" />
                </div>
            );
        }
    });

    return (
      <div className="p-4 space-y-4 overflow-y-auto">
        {messageElements}
      </div>
    );
  };

  return (
    <div className="flex flex-col min-h-screen">
        <Header title={settings.title} description={settings.description} />
        <main className="flex-grow container mx-auto p-4 md:p-6 flex flex-col">
            <div className="flex-shrink-0 flex items-center justify-between mb-4">
                <a
                    href="/"
                    className="flex items-center gap-2 px-4 py-2 bg-slate-200 dark:bg-slate-700 hover:bg-slate-300 dark:hover:bg-slate-600 text-slate-700 dark:text-slate-200 rounded-md transition-colors"
                    >
                    <ChevronLeftIcon className="w-5 h-5" />
                    Back to All Numbers
                </a>
                <button
                    onClick={handleManualRefresh}
                    disabled={isLoading}
                    className="flex items-center gap-2 px-4 py-2 bg-slate-200 dark:bg-slate-700 hover:bg-slate-300 dark:hover:bg-slate-600 disabled:bg-slate-300 dark:disabled:bg-slate-800 disabled:cursor-not-allowed text-slate-700 dark:text-slate-200 rounded-md transition-colors"
                >
                    <RefreshIcon className={`w-5 h-5 ${isLoading ? 'animate-spin' : ''}`} />
                    Refresh {!isLoading && `(${countdown}s)`}
                </button>
            </div>

            <div className="flex flex-col flex-grow bg-white dark:bg-slate-800/50 rounded-lg shadow-lg overflow-hidden">
                <div className="flex-shrink-0 p-4 border-b border-slate-200 dark:border-slate-700">
                    <div className="flex flex-wrap items-center gap-3">
                        <h2 className="text-lg font-semibold text-slate-800 dark:text-slate-300">
                            Messages for: <span className="font-mono text-teal-600 dark:text-teal-400">{numberDetails?.number || '...'}</span>
                        </h2>
                        {numberDetails && (
                            <div className="relative">
                                <button
                                    onClick={handleCopyNumber}
                                    className="p-2 rounded-full bg-slate-200 dark:bg-slate-700/50 hover:bg-slate-300 dark:hover:bg-slate-600/50 text-slate-500 dark:text-slate-400 hover:text-teal-500 dark:hover:text-teal-400 transition-colors"
                                    title="Copy Number"
                                >
                                    <CopyIcon className="w-5 h-5" />
                                </button>
                                {isCopied && <span className="absolute -top-8 left-1/2 -translate-x-1/2 text-xs bg-teal-500 text-white rounded px-2 py-1 whitespace-nowrap">Copied!</span>}
                            </div>
                        )}
                    </div>
                    {numberDetails && <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">Inbox for {numberDetails.country}</p>}
                </div>

                <div className="p-4 border-b border-slate-200 dark:border-slate-700">
                    <AdsenseAd adKey="numberPageTopAd" />
                </div>

                {renderContent()}
            </div>
        </main>
        <Footer text={settings.footerText} links={settings.footerLinks} />
    </div>
  );
};

export default NumberPage;