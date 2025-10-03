import React, { useState, useEffect } from 'react';
import type { PhoneNumber, Settings, BlogPost } from '../types';
import { getAvailableNumbers } from '../services/smsService';
import { getSettings } from '../services/settingsService';
import { updateMetadata } from '../services/seoService';
import Header from '../components/Header';
import PhoneNumberCard from '../components/PhoneNumberCard';
import Footer from '../components/Footer';
import AdsenseAd from '../components/AdsenseAd';
import BlogSection from '../components/BlogSection';
import { SearchIcon } from '../components/icons/SearchIcon';

const HomePage: React.FC = () => {
  const [settings, setSettings] = useState<Settings>(getSettings());
  
  const initialNumbers = (settings.publicNumbers || []).filter(n => n.enabled);
  const [numbers, setNumbers] = useState<PhoneNumber[]>(initialNumbers);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(initialNumbers.length === 0);
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    updateMetadata({
        title: `${settings.title} - Receive SMS Online Free`,
        description: settings.description,
        path: '/',
    });
  }, [settings]);

  useEffect(() => {
    const fetchNumbers = async () => {
      try {
        const numbersData = (await getAvailableNumbers()).filter(n => n.enabled);
        setNumbers(numbersData);
        setError(null);
      } catch (err: any) {
        setError(err.message || 'Failed to fetch phone numbers.');
        console.error(err);
      } finally {
        setIsLoading(false);
      }
    };
    
    fetchNumbers();
    const numberInterval = setInterval(fetchNumbers, 5000);
    
    const handleSettingsChange = () => {
        setSettings(getSettings());
    }
    window.addEventListener('settingsChanged', handleSettingsChange);


    return () => {
        clearInterval(numberInterval);
        window.removeEventListener('settingsChanged', handleSettingsChange);
    };
  }, []);
  
  const renderNumberList = () => {
    if (isLoading) {
        return (
            <p className="md:col-span-2 xl:col-span-3 text-center text-slate-500 dark:text-slate-400 p-10">
                Loading available numbers...
            </p>
        );
    }

    if (error) {
        const isCorsError = error.includes('proxy');

        return (
            <div className="md:col-span-2 xl:col-span-3 text-center p-10 bg-white dark:bg-slate-800 rounded-lg shadow-md">
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
    
    const filteredNumbers = numbers.filter(number => {
        const query = searchQuery.toLowerCase().trim();
        if (!query) return true;
        const numberString = number.number.replace(/[\s+\-()]/g, '');
        const queryString = query.replace(/[\s+\-()]/g, '');
        return (
            numberString.includes(queryString) ||
            number.country.toLowerCase().includes(query)
        );
    });

    if (numbers.length > 0 && filteredNumbers.length === 0) {
        return (
            <p className="md:col-span-2 xl:col-span-3 text-center text-slate-500 dark:text-slate-400 p-10">
                No numbers found matching "{searchQuery}".
            </p>
        );
    }

    if (filteredNumbers.length === 0) {
        return (
            <p className="md:col-span-2 xl:col-span-3 text-center text-slate-500 dark:text-slate-400 p-10">
                No enabled phone numbers found. Please check the Admin Panel.
            </p>
        );
    }

    const itemsToRender: React.ReactNode[] = [];
    filteredNumbers.forEach((number, index) => {
        itemsToRender.push(<PhoneNumberCard number={number} key={number.id} />);
        
        // Insert an ad after the 3rd number, making it span the full grid width
        if (index === 2) {
            itemsToRender.push(
                <div key="ad-home" className="md:col-span-2 xl:col-span-3 bg-slate-50 dark:bg-slate-800/50 p-4 rounded-lg shadow-inner">
                    <AdsenseAd adKey="homePageAd" />
                </div>
            );
        }
    });
    return itemsToRender;
  }

  const publishedPosts = settings.posts
    .filter(p => p.isPublished)
    .sort((a, b) => b.publishedAt.getTime() - a.publishedAt.getTime());

  return (
    <div className="flex flex-col min-h-screen">
      <Header title={settings.title} links={settings.footerLinks} showAdminLink={true} />
      <main className="flex-grow container mx-auto p-4 md:p-6">
        <div className="text-center py-8 md:py-12">
            <h1 className="text-4xl md:text-5xl font-extrabold text-slate-800 dark:text-slate-100 tracking-tight">
                Receive SMS Online, <span className="text-teal-500 dark:text-teal-400">Instantly & Anonymously</span>
            </h1>
            <p className="mt-4 max-w-2xl mx-auto text-lg text-slate-500 dark:text-slate-400">
                {settings.description}
            </p>
        </div>
        <div className="mb-8 max-w-2xl mx-auto">
            <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                    <SearchIcon className="w-5 h-5 text-slate-400" />
                </div>
                <input
                    type="search"
                    placeholder="Search by country or number..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full pl-12 pr-4 py-3 rounded-full bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 focus:ring-2 focus:ring-teal-500 focus:outline-none shadow-sm transition-colors"
                    aria-label="Search phone numbers"
                />
            </div>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
            {renderNumberList()}
        </div>
        {publishedPosts.length > 0 && (
            <BlogSection posts={publishedPosts.slice(0, 6)} />
        )}
      </main>
      <Footer text={settings.footerText} links={settings.footerLinks} />
    </div>
  );
};

export default HomePage;