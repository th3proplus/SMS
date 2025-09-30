import React, { useState, useEffect, useCallback } from 'react';
import type { PhoneNumber, Settings } from '../types';
import { getAvailableNumbers } from '../services/smsService';
import { getSettings } from '../services/settingsService';
import { updateMetadata } from '../services/seoService';
import Header from '../components/Header';
import PhoneNumberCard from '../components/PhoneNumberCard';
import Footer from '../components/Footer';
import AdsenseAd from '../components/AdsenseAd';
import { RefreshIcon } from '../components/icons/RefreshIcon';

const HomePage: React.FC = () => {
  const [numbers, setNumbers] = useState<PhoneNumber[]>([]);
  const [settings, setSettings] = useState<Settings>(getSettings());
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  
  useEffect(() => {
    updateMetadata({
        title: `${settings.title} - Receive SMS Online Free`,
        description: settings.description,
        path: '/',
    });
  }, [settings]);

  const fetchNumbers = useCallback(async () => {
      try {
        // Only show numbers that are explicitly enabled
        const numbersData = (await getAvailableNumbers()).filter(n => n.enabled);
        // Sort by most recently active
        setNumbers(numbersData.sort((a,b) => b.lastMessageAt.getTime() - a.lastMessageAt.getTime()));
        setError(null);
      } catch (err: any) {
        setError(err.message || 'Failed to fetch phone numbers.');
        console.error(err);
      }
  }, []);

  useEffect(() => {
    const loadInitialNumbers = async () => {
        setIsLoading(true);
        await fetchNumbers();
        setIsLoading(false);
    };
    
    loadInitialNumbers();
    
    const handleSettingsChange = () => {
        setSettings(getSettings());
    }
    window.addEventListener('settingsChanged', handleSettingsChange);


    return () => {
        window.removeEventListener('settingsChanged', handleSettingsChange);
    };
  }, [fetchNumbers]);

  const handleRefresh = async () => {
    setIsRefreshing(true);
    await fetchNumbers();
    setIsRefreshing(false);
  };
  
  const renderNumberList = () => {
    if (isLoading) {
        return (
            <p className="col-span-full text-center text-slate-500 dark:text-slate-400 p-10">
                Loading available numbers...
            </p>
        );
    }

    if (error) {
        const isCorsError = error.includes('proxy');

        return (
            <div className="col-span-full text-center p-10">
                 <p className="font-semibold text-red-500 mb-2">Could not load numbers</p>
                 <p className="text-sm text-slate-500 dark:text-slate-400 mb-4">{error}</p>
                 {isCorsError && (
                     <div className="mt-4 p-4 bg-blue-100 dark:bg-blue-900/30 rounded-md max-w-lg mx-auto">
                         <p className="text-sm font-semibold text-blue-800 dark:text-blue-200">
                             How to fix this:
                         </p>
                         <ol className="list-decimal list-inside text-left text-sm text-blue-700 dark:text-blue-300 mt-2">
                             <li>Click this link to activate the proxy: <a href="https://cors-anywhere.herokuapp.com/" target="_blank" rel="noopener noreferrer" className="font-bold text-blue-600 dark:text-blue-400 hover:underline">Activate Proxy</a></li>
                             <li>Click the button on that page to "Request temporary access".</li>
                             <li>Come back to this page and it should refresh automatically.</li>
                         </ol>
                     </div>
                 )}
                 {error.includes('credentials') && !isCorsError && (
                     <p className="text-sm text-slate-500 dark:text-slate-400 mt-4">
                         Please configure your Twilio Account SID and Auth Token in the <a href="/login" className="text-teal-500 hover:underline font-semibold">Admin Panel</a>.
                     </p>
                 )}
            </div>
        );
    }

    if (numbers.length === 0) {
        return (
            <p className="col-span-full text-center text-slate-500 dark:text-slate-400 p-10">
                No enabled phone numbers found. Please check the Admin Panel.
            </p>
        );
    }

    const numberElements: React.ReactNode[] = [];
    numbers.forEach((number, index) => {
        numberElements.push(
            <div key={number.id} className="border-b border-slate-200 dark:border-slate-700/50 last:border-b-0">
                <PhoneNumberCard number={number} />
            </div>
        );
        // Insert an ad after the 4th number
        if (index === 3) {
            numberElements.push(
                <div key="ad-home" className="p-4 border-b border-slate-200 dark:border-slate-700/50">
                    <AdsenseAd adKey="homePageAd" />
                </div>
            );
        }
    });
    return numberElements;
  }

  return (
    <div className="flex flex-col min-h-screen">
      <Header title={settings.title} description={settings.description} showAdminLink={true} />
      <main className="flex-grow container mx-auto p-4 md:p-6">
        <div className="flex justify-between items-center mb-4 px-2">
            <h2 className="text-xl font-bold text-slate-700 dark:text-slate-300">Select a number to view messages</h2>
            <button
                onClick={handleRefresh}
                disabled={isRefreshing || isLoading}
                className="flex items-center gap-2 p-2 rounded-md text-slate-500 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-700 hover:text-teal-500 dark:hover:text-teal-400 transition-colors disabled:opacity-50 disabled:cursor-wait"
                title="Refresh number activity"
                aria-label="Refresh number activity"
            >
                <RefreshIcon className={`w-5 h-5 ${isRefreshing ? 'animate-spin' : ''}`} />
                <span className="text-sm font-medium hidden sm:inline">Refresh</span>
            </button>
        </div>
        <div className="bg-white dark:bg-slate-800 rounded-lg shadow-lg overflow-hidden border border-slate-200 dark:border-slate-700/50">
            {renderNumberList()}
        </div>
      </main>
      <Footer text={settings.footerText} links={settings.footerLinks} />
    </div>
  );
};

export default HomePage;