import React, { useState, useEffect } from 'react';
import type { PhoneNumber, Settings, BlogPost } from '../types';
import { getAvailableNumbers } from '../services/smsService';
import { getLatestPosts, demoPosts } from '../services/wordpressService';
import { getSettings } from '../services/settingsService';
import { updateMetadata } from '../services/seoService';
import Header from '../components/Header';
import PhoneNumberCard from '../components/PhoneNumberCard';
import Footer from '../components/Footer';
import AdsenseAd from '../components/AdsenseAd';
import BlogSection from '../components/BlogSection';

const HomePage: React.FC = () => {
  const [settings, setSettings] = useState<Settings>(getSettings());
  
  const initialNumbers = (settings.publicNumbers || []).filter(n => n.enabled);
  const [numbers, setNumbers] = useState<PhoneNumber[]>(
    initialNumbers.sort((a, b) => b.lastMessageAt.getTime() - a.lastMessageAt.getTime())
  );
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(initialNumbers.length === 0);

  const [posts, setPosts] = useState<BlogPost[]>([]);
  const [isBlogLoading, setIsBlogLoading] = useState(false);
  const [blogError, setBlogError] = useState<string | null>(null);
  
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
        setNumbers(numbersData.sort((a,b) => b.lastMessageAt.getTime() - a.lastMessageAt.getTime()));
        setError(null);
      } catch (err: any) {
        setError(err.message || 'Failed to fetch phone numbers.');
        console.error(err);
      } finally {
        setIsLoading(false);
      }
    };

    const fetchBlogPosts = async () => {
        const currentSettings = getSettings();
        if (!currentSettings.enableBlogSection) {
            setPosts([]);
            setIsBlogLoading(false);
            setBlogError(null);
            return;
        }

        setIsBlogLoading(true);
        setBlogError(null);

        // If URL is not set, just use demo posts immediately.
        if (!currentSettings.wordpressUrl.trim()) {
            setPosts(demoPosts);
            setIsBlogLoading(false);
            return;
        }
        
        // If URL is set, try to fetch.
        try {
            const postsData = await getLatestPosts(3);
            setPosts(postsData);
        } catch (err: any) {
            console.error("Blog fetch error:", err);
            setPosts(demoPosts); // Fallback to demo posts
            setBlogError('Could not connect to the blog. Showing demo articles instead.');
        } finally {
            setIsBlogLoading(false);
        }
    };
    
    const initialFetch = () => {
        fetchNumbers();
        fetchBlogPosts();
    };

    initialFetch();
    const numberInterval = setInterval(fetchNumbers, 5000);
    
    const handleSettingsChange = () => {
        setSettings(getSettings());
        fetchBlogPosts(); // Refetch blog posts if settings change
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

    if (numbers.length === 0) {
        return (
            <p className="md:col-span-2 xl:col-span-3 text-center text-slate-500 dark:text-slate-400 p-10">
                No enabled phone numbers found. Please check the Admin Panel.
            </p>
        );
    }

    const itemsToRender: React.ReactNode[] = [];
    numbers.forEach((number, index) => {
        itemsToRender.push(<PhoneNumberCard number={number} key={number.id} />);
        
        // Insert an ad after the 4th number, making it span the full grid width
        if (index === 3) {
            itemsToRender.push(
                <div key="ad-home" className="md:col-span-2 xl:col-span-3 bg-slate-50 dark:bg-slate-800/50 p-4 rounded-lg shadow-inner">
                    <AdsenseAd adKey="homePageAd" />
                </div>
            );
        }
    });
    return itemsToRender;
  }

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
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
            {renderNumberList()}
        </div>
        {settings.enableBlogSection && (
            <BlogSection posts={posts} isLoading={isBlogLoading} error={blogError} />
        )}
      </main>
      <Footer text={settings.footerText} links={settings.footerLinks} />
    </div>
  );
};

export default HomePage;