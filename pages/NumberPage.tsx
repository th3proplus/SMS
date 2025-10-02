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

const NumberPage: React.FC<NumberPageProps> = ({ phoneNumber }) => {
  const [numberDetails, setNumberDetails] = useState<PhoneNumber | null>(null);
  const [messages, setMessages] = useState<SMSMessage[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [settings, setSettings] = useState<Settings>(getSettings());
  const [isCopied, setIsCopied] = useState(false);

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
                // Find the user-configured display details from settings, if they exist
                const settingsNumber = getSettings().publicNumbers.find(n => n.id === details.id);
                setNumberDetails({
                    ...details,
                    country: settingsNumber?.country || details.country,
                    countryCode: settingsNumber?.countryCode || details.countryCode,
                });
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

  // Auto-refresh messages
  useEffect(() => {
    const refreshInterval = setInterval(() => {
      fetchMessages(false);
    }, 3000); // Refresh every 3 seconds
    return () => clearInterval(refreshInterval);
  }, [fetchMessages]);

  const handleCopyNumber = () => {
    if (!numberDetails) return;
    navigator.clipboard.writeText(numberDetails.number).then(() => {
        setIsCopied(true);
        setTimeout(() => setIsCopied(false), 2000);
    });
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
        <Header title={settings.title} links={settings.footerLinks} showAdminLink={true} />
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
                    onClick={() => fetchMessages(true)}
                    disabled={isLoading}
                    className="flex items-center gap-2 px-4 py-2 bg-slate-200 dark:bg-slate-700 hover:bg-slate-300 dark:hover:bg-slate-600 disabled:bg-slate-300 dark:disabled:bg-slate-800 disabled:cursor-not-allowed text-slate-700 dark:text-slate-200 rounded-md transition-colors"
                >
                    <RefreshIcon className={`w-5 h-5 ${isLoading ? 'animate-spin' : ''}`} />
                    Refresh
                </button>
            </div>

            <div className="flex flex-col flex-grow bg-white dark:bg-slate-800/50 rounded-lg shadow-lg overflow-hidden">
                <div className="flex-shrink-0 p-6 text-center border-b border-slate-200 dark:border-slate-700">
                    {numberDetails ? (
                        <>
                            <div className="flex justify-center items-center gap-3 mb-2">
                                {numberDetails.countryCode ? (
                                    <img 
                                        src={`https://flagcdn.com/w40/${numberDetails.countryCode.toLowerCase()}.png`} 
                                        alt={`${numberDetails.country} flag`} 
                                        className="w-10 h-auto rounded-md shadow"
                                        />
                                ) : (
                                    <div className="w-10 h-6 bg-slate-200 dark:bg-slate-700 rounded-md shadow flex items-center justify-center flex-shrink-0" title="Country not specified">
                                        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-slate-400 dark:text-slate-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                            <path strokeLinecap="round" strokeLinejoin="round" d="M21 12a9 9 0 01-9 9m9-9a9 9 0 00-9-9m9 9H3m9 9a9 9 0 01-9-9m9 9V3" />
                                        </svg>
                                    </div>
                                )}
                                <p className="text-lg text-slate-600 dark:text-slate-300">{numberDetails.country}</p>
                            </div>
                            <div className="flex justify-center items-center gap-3 relative">
                                <h1 className="font-mono font-bold text-3xl md:text-4xl text-slate-800 dark:text-slate-100 tracking-wider">
                                    {numberDetails.number}
                                </h1>
                                <div className="relative">
                                    <button
                                        onClick={handleCopyNumber}
                                        className="p-2 rounded-full bg-slate-200 dark:bg-slate-700/50 hover:bg-slate-300 dark:hover:bg-slate-600/50 text-slate-500 dark:text-slate-400 hover:text-teal-500 dark:hover:text-teal-400 transition-colors"
                                        title="Copy Number"
                                    >
                                        <CopyIcon className="w-6 h-6" />
                                    </button>
                                    {isCopied && <span className="absolute -top-8 left-1/2 -translate-x-1/2 text-xs bg-teal-500 text-white rounded px-2 py-1 whitespace-nowrap">Copied!</span>}
                                </div>
                            </div>
                            <p className="text-sm text-slate-500 dark:text-slate-400 mt-2">
                                This is a temporary number. Messages are public. Refresh to see new messages.
                            </p>
                        </>
                    ) : (
                        <div className="animate-pulse">
                            <div className="h-6 w-32 bg-slate-300 dark:bg-slate-700 rounded-md mx-auto mb-3"></div>
                            <div className="h-10 w-64 bg-slate-300 dark:bg-slate-700 rounded-md mx-auto"></div>
                            <div className="h-4 w-48 bg-slate-300 dark:bg-slate-700 rounded-md mx-auto mt-3"></div>
                        </div>
                    )}
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