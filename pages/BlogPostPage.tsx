import React, { useState, useEffect } from 'react';
import { getSettings } from '../services/settingsService.ts';
import { updateMetadata } from '../services/seoService.ts';
import type { Settings, BlogPost } from '../types.ts';
import Header from '../components/Header.tsx';
import Footer from '../components/Footer.tsx';
import { ChevronLeftIcon } from '../components/icons/ChevronLeftIcon.tsx';
import { parseMarkdown } from '../utils/markdown.ts';

interface BlogPostPageProps {
    slug: string;
}

const BlogPostPage: React.FC<BlogPostPageProps> = ({ slug }) => {
    const [settings, setSettings] = useState<Settings>(getSettings());
    const [post, setPost] = useState<BlogPost | null | undefined>(undefined); // undefined: loading, null: not found
    const [parsedContent, setParsedContent] = useState('');

    useEffect(() => {
        const handleSettingsChange = () => {
            const newSettings = getSettings();
            setSettings(newSettings);
            const foundPost = newSettings.posts.find(p => p.slug === slug && p.isPublished);
            setPost(foundPost || null);
        };
        
        handleSettingsChange(); // Initial load

        window.addEventListener('settingsChanged', handleSettingsChange);
        return () => window.removeEventListener('settingsChanged', handleSettingsChange);
    }, [slug]);

    useEffect(() => {
        if (post) {
            updateMetadata({
                title: `${post.title} - ${settings.title}`,
                description: post.excerpt,
                path: `/blog/${slug}`,
            });
            // Render content as raw HTML if specified, otherwise parse as Markdown (default for old posts)
            const contentToRender = post.editorMode === 'html' ? post.content : parseMarkdown(post.content);
            setParsedContent(contentToRender);
        } else if (post === null) {
            updateMetadata({
                title: `Post Not Found - ${settings.title}`,
                description: 'The blog post you are looking for does not exist.',
                path: `/blog/${slug}`,
            });
        }
    }, [post, settings.title, slug]);
    
    const renderContent = () => {
        if (post === undefined) {
            // Loading state
            return (
                <div className="text-center p-10">
                    <p className="text-slate-500 dark:text-slate-400">Loading post...</p>
                </div>
            );
        }

        if (post === null) {
            // Not found state
            return (
                <div className="text-center p-10 bg-white dark:bg-slate-800/50 rounded-lg shadow-md">
                    <h1 className="text-3xl font-bold text-slate-800 dark:text-slate-100 mb-4">Post Not Found</h1>
                    <p className="text-slate-600 dark:text-slate-400">Sorry, we couldn't find the post you were looking for.</p>
                </div>
            );
        }

        // Post found
        return (
            <article className="bg-white dark:bg-slate-800/50 rounded-lg shadow-md overflow-hidden">
                {post.featuredImageUrl && (
                    <img src={post.featuredImageUrl} alt={post.title} className="w-full h-64 md:h-96 object-cover" />
                )}
                <div className="p-6 md:p-8">
                    <p className="text-sm text-slate-500 dark:text-slate-400 mb-2">
                        Published on {new Date(post.publishedAt).toLocaleDateString(undefined, { year: 'numeric', month: 'long', day: 'numeric' })}
                    </p>
                    <h1 className="text-3xl md:text-4xl font-extrabold text-slate-800 dark:text-slate-100 mb-6">
                        {post.title}
                    </h1>
                    <div className="prose dark:prose-invert max-w-none" dangerouslySetInnerHTML={{ __html: parsedContent }} />
                </div>
            </article>
        );
    };

    return (
        <div className="flex flex-col min-h-screen">
            <Header title={settings.title} links={settings.footerLinks} showAdminLink={true} />
            <main className="flex-grow container mx-auto p-4 md:p-6">
                <div className="max-w-4xl mx-auto">
                    <div className="mb-6">
                        <a
                            href="/blog"
                            className="inline-flex items-center gap-2 px-4 py-2 bg-slate-200 dark:bg-slate-700 hover:bg-slate-300 dark:hover:bg-slate-600 text-slate-700 dark:text-slate-200 rounded-md transition-colors"
                        >
                            <ChevronLeftIcon className="w-5 h-5" />
                            Back to Blog
                        </a>
                    </div>
                    {renderContent()}
                </div>
            </main>
            <Footer text={settings.footerText} links={settings.footerLinks} />
        </div>
    );
};

export default BlogPostPage;