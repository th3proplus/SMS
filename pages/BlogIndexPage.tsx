import React, { useState, useEffect } from 'react';
import { getSettings } from '../services/settingsService';
import { updateMetadata } from '../services/seoService';
import type { Settings, BlogPost } from '../types';
import Header from '../components/Header';
import Footer from '../components/Footer';
import { ArrowRightIcon } from '../components/icons/ArrowRightIcon';
import { SearchIcon } from '../components/icons/SearchIcon';

const BlogCard: React.FC<{ post: BlogPost }> = ({ post }) => (
    <a href={`/blog/${post.slug}`} className="group flex flex-col bg-white dark:bg-slate-800 rounded-xl shadow-md hover:shadow-lg dark:hover:shadow-teal-900/30 border border-slate-200 dark:border-slate-700 transition-all duration-300 transform hover:-translate-y-1 overflow-hidden">
        {post.featuredImageUrl && (
             <div className="h-48 overflow-hidden">
                <img src={post.featuredImageUrl} alt={post.title} className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105" />
            </div>
        )}
        <div className="p-6 flex flex-col flex-grow">
             <p className="text-xs text-slate-500 dark:text-slate-400 mb-2">{new Date(post.publishedAt).toLocaleDateString(undefined, { year: 'numeric', month: 'long', day: 'numeric' })}</p>
            <h2 className="text-xl font-bold text-slate-800 dark:text-slate-100 group-hover:text-teal-600 dark:group-hover:text-teal-400 transition-colors flex-grow">
                {post.title}
            </h2>
            <p className="text-sm text-slate-600 dark:text-slate-300 mt-2 line-clamp-3">
                {post.excerpt}
            </p>
            <div className="mt-4 pt-4 border-t border-slate-200 dark:border-slate-700 flex items-center justify-end font-semibold text-sm text-teal-600 dark:text-teal-500">
                <span>Read More</span>
                <ArrowRightIcon className="w-4 h-4 ml-1 transition-transform group-hover:translate-x-1" />
            </div>
        </div>
    </a>
);


const BlogIndexPage: React.FC = () => {
    const [settings, setSettings] = useState<Settings>(getSettings());
    const [searchQuery, setSearchQuery] = useState('');

    useEffect(() => {
        const handleSettingsChange = () => {
            setSettings(getSettings());
        };
        window.addEventListener('settingsChanged', handleSettingsChange);
        return () => window.removeEventListener('settingsChanged', handleSettingsChange);
    }, []);

    useEffect(() => {
        updateMetadata({
            title: `Blog - ${settings.title}`,
            description: `Latest articles and updates from ${settings.title}.`,
            path: '/blog',
        });
    }, [settings.title]);

    const publishedPosts = settings.posts
        .filter(p => p.isPublished)
        .sort((a, b) => new Date(b.publishedAt).getTime() - new Date(a.publishedAt).getTime());
        
    const filteredPosts = publishedPosts.filter(post => {
        const query = searchQuery.toLowerCase().trim();
        if (!query) return true;
        const titleMatch = post.title.toLowerCase().includes(query);
        const excerptMatch = post.excerpt.toLowerCase().includes(query);
        // Also search the content, removing HTML tags for a better match
        const contentMatch = post.content.replace(/<[^>]*>?/gm, '').toLowerCase().includes(query);
        return titleMatch || excerptMatch || contentMatch;
    });

    return (
        <div className="flex flex-col min-h-screen">
            <Header title={settings.title} links={settings.footerLinks} showAdminLink={true} />
            <main className="flex-grow container mx-auto p-4 md:p-6">
                <div className="text-center py-8 md:py-12">
                    <h1 className="text-4xl md:text-5xl font-extrabold text-slate-800 dark:text-slate-100 tracking-tight">
                        Our <span className="text-teal-500 dark:text-teal-400">Blog</span>
                    </h1>
                    <p className="mt-4 max-w-2xl mx-auto text-lg text-slate-500 dark:text-slate-400">
                        Stay updated with our latest articles, news, and privacy tips.
                    </p>
                </div>
                
                <div className="mb-10 max-w-2xl mx-auto">
                    <div className="relative">
                        <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                            <SearchIcon className="w-5 h-5 text-slate-400" />
                        </div>
                        <input
                            type="search"
                            placeholder="Search articles by title or content..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="w-full pl-12 pr-4 py-3 rounded-full bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 focus:ring-2 focus:ring-teal-500 focus:outline-none shadow-sm transition-colors"
                            aria-label="Search articles"
                        />
                    </div>
                </div>

                {publishedPosts.length > 0 ? (
                    filteredPosts.length > 0 ? (
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                            {filteredPosts.map(post => (
                                <BlogCard key={post.id} post={post} />
                            ))}
                        </div>
                    ) : (
                        <div className="text-center py-16">
                            <h2 className="text-2xl font-semibold text-slate-700 dark:text-slate-300">No Results Found</h2>
                            <p className="text-slate-500 dark:text-slate-400 mt-2">
                                We couldn't find any articles matching "{searchQuery}". Try a different search.
                            </p>
                        </div>
                    )
                ) : (
                    <div className="text-center py-16">
                        <h2 className="text-2xl font-semibold text-slate-700 dark:text-slate-300">No Posts Yet</h2>
                        <p className="text-slate-500 dark:text-slate-400 mt-2">
                            There are no articles to display right now. Please check back later!
                        </p>
                    </div>
                )}
            </main>
            <Footer text={settings.footerText} links={settings.footerLinks} />
        </div>
    );
};

export default BlogIndexPage;