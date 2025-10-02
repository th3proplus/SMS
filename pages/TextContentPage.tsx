import React, { useState, useEffect } from 'react';
import { getSettings } from '../services/settingsService';
import { updateMetadata } from '../services/seoService';
import type { Settings } from '../types';
import Header from '../components/Header';
import Footer from '../components/Footer';
import { ChevronLeftIcon } from '../components/icons/ChevronLeftIcon';
import { parseMarkdown } from '../utils/markdown';

interface TextContentPageProps {
  title: string;
  content: string;
}

const TextContentPage: React.FC<TextContentPageProps> = ({ title, content }) => {
    const [settings, setSettings] = useState<Settings>(getSettings());
    const [parsedContent, setParsedContent] = useState('');

    useEffect(() => {
        const handleSettingsChange = () => {
            setSettings(getSettings());
        }
        window.addEventListener('settingsChanged', handleSettingsChange);

        return () => {
            window.removeEventListener('settingsChanged', handleSettingsChange);
        };
    }, []);

    useEffect(() => {
        setParsedContent(parseMarkdown(content));
    }, [content]);

    useEffect(() => {
        updateMetadata({
            title: `${title} - ${settings.title}`,
            description: `Read the ${title.toLowerCase()} for our Free SMS Receiver service.`,
            path: window.location.pathname,
        });
    }, [title, settings.title]);


    return (
        <div className="flex flex-col min-h-screen">
            <Header title={settings.title} links={settings.footerLinks} showAdminLink={true} />
            <main className="flex-grow container mx-auto p-4 md:p-6">
                <div className="max-w-4xl mx-auto">
                     <div className="mb-6">
                        <a
                            href="/"
                            className="inline-flex items-center gap-2 px-4 py-2 bg-slate-200 dark:bg-slate-700 hover:bg-slate-300 dark:hover:bg-slate-600 text-slate-700 dark:text-slate-200 rounded-md transition-colors"
                        >
                            <ChevronLeftIcon className="w-5 h-5" />
                            Back to Home
                        </a>
                    </div>
                    <div className="bg-white dark:bg-slate-800/50 p-6 md:p-8 rounded-lg shadow-md">
                        <h1 className="text-3xl font-extrabold text-slate-800 dark:text-slate-100 mb-6 border-b border-slate-200 dark:border-slate-700 pb-4">{title}</h1>
                        <div className="prose dark:prose-invert max-w-none" dangerouslySetInnerHTML={{ __html: parsedContent }} />
                    </div>
                </div>
            </main>
            <Footer text={settings.footerText} links={settings.footerLinks} />
        </div>
    );
};

export default TextContentPage;
