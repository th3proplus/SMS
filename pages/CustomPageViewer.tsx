import React, { useState, useEffect } from 'react';
import { getSettings } from '../services/settingsService';
import { updateMetadata } from '../services/seoService';
import type { Settings, CustomPage } from '../types';
import Header from '../components/Header';
import Footer from '../components/Footer';
import { ChevronLeftIcon } from '../components/icons/ChevronLeftIcon';
import { parseMarkdown } from '../utils/markdown';

interface CustomPageViewerProps {
    slug: string;
}

const isHtml = (str: string | null | undefined): str is string => !!str && /<[a-z][\s\S]*>/i.test(str);

const CustomPageViewer: React.FC<CustomPageViewerProps> = ({ slug }) => {
    const [settings, setSettings] = useState<Settings>(getSettings());
    const [page, setPage] = useState<CustomPage | null | undefined>(undefined);
    const [parsedContent, setParsedContent] = useState('');

    useEffect(() => {
        const currentSettings = getSettings();
        setSettings(currentSettings);
        const foundPage = (currentSettings.customPages || []).find(p => p.slug === slug && p.isPublished);
        setPage(foundPage);

        const handleSettingsChange = () => {
            const newSettings = getSettings();
            setSettings(newSettings);
            const newFoundPage = (newSettings.customPages || []).find(p => p.slug === slug && p.isPublished);
            setPage(newFoundPage);
        };
        window.addEventListener('settingsChanged', handleSettingsChange);
        return () => window.removeEventListener('settingsChanged', handleSettingsChange);
    }, [slug]);

    useEffect(() => {
        if (page) {
            updateMetadata({
                title: page.metaTitle || page.title,
                description: page.metaDescription || `Read more about ${page.title} on our site.`,
                path: `/pages/${slug}`,
            });

            if (isHtml(page.content)) {
                setParsedContent(page.content);
            } else {
                setParsedContent(parseMarkdown(page.content));
            }
        }
    }, [page, slug]);

    if (page === undefined) {
        return <div>Loading...</div>;
    }

    if (page === null) {
        return (
            <div className="flex flex-col min-h-screen">
                <Header title={settings.title} links={settings.footerLinks} showAdminLink={true} />
                <main className="flex-grow container mx-auto p-4 md:p-6 flex items-center justify-center">
                    <div className="text-center">
                        <h1 className="text-4xl font-bold text-slate-800 dark:text-slate-200">404 - Not Found</h1>
                        <p className="mt-4 text-slate-500 dark:text-slate-400">The page you are looking for does not exist or has been moved.</p>
                        <a href="/" className="mt-6 inline-block px-4 py-2 bg-teal-600 text-white font-semibold rounded-md hover:bg-teal-700">Back to Home</a>
                    </div>
                </main>
                <Footer text={settings.footerText} links={settings.footerLinks} />
            </div>
        );
    }

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

                    <article className="bg-white dark:bg-slate-800/50 p-6 md:p-8 rounded-lg shadow-md">
                        <h1 className="text-3xl md:text-4xl font-extrabold text-slate-800 dark:text-slate-100 mb-6 border-b border-slate-200 dark:border-slate-700 pb-4">
                            {page.title}
                        </h1>
                        <div className="prose dark:prose-invert max-w-none" dangerouslySetInnerHTML={{ __html: parsedContent }} />
                    </article>
                </div>
            </main>
            <Footer text={settings.footerText} links={settings.footerLinks} />
        </div>
    );
};

export default CustomPageViewer;