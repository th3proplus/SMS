import React, { useState } from 'react';
import { getSettings, saveSettings } from '../../services/settingsService';
import type { BlogPost, Settings } from '../../types';
import BlogPostEditor from './BlogPostEditor';
import { PlusIcon } from '../icons/PlusIcon';
import { PencilIcon } from '../icons/PencilIcon';
import { TrashIcon } from '../icons/TrashIcon';

const BlogManagementPanel: React.FC = () => {
    const [settings, setSettings] = useState<Settings>(getSettings());
    const [view, setView] = useState<'list' | 'editor'>('list');
    const [currentPost, setCurrentPost] = useState<BlogPost | null>(null);

    const handleCreateNew = () => {
        setCurrentPost(null);
        setView('editor');
    };

    const handleEdit = (post: BlogPost) => {
        setCurrentPost(post);
        setView('editor');
    };

    const handleDelete = (postId: string) => {
        if (window.confirm('Are you sure you want to delete this post? This action cannot be undone.')) {
            const updatedPosts = settings.posts.filter(p => p.id !== postId);
            saveSettings({ ...settings, posts: updatedPosts });
            setSettings(prev => ({ ...prev, posts: updatedPosts }));
        }
    };

    const handleSave = (postToSave: BlogPost) => {
        let updatedPosts: BlogPost[];
        if (currentPost) {
            // Editing existing post
            updatedPosts = settings.posts.map(p => p.id === postToSave.id ? postToSave : p);
        } else {
            // Creating new post
            updatedPosts = [...settings.posts, postToSave];
        }

        const newSettings = { ...settings, posts: updatedPosts };
        saveSettings(newSettings);
        setSettings(newSettings);
        setView('list');
        setCurrentPost(null);
    };

    const handleCancel = () => {
        setView('list');
        setCurrentPost(null);
    };

    const sortedPosts = [...settings.posts].sort((a, b) => new Date(b.publishedAt).getTime() - new Date(a.publishedAt).getTime());

    if (view === 'editor') {
        return <BlogPostEditor key={currentPost?.id || 'new'} post={currentPost} onSave={handleSave} onCancel={handleCancel} />;
    }

    return (
        <div className="bg-white dark:bg-slate-800 p-6 rounded-lg shadow-md">
            <div className="flex justify-between items-center border-b border-slate-200 dark:border-slate-700 pb-2 mb-4">
                <h2 className="text-lg font-semibold text-slate-800 dark:text-slate-200">Blog Posts</h2>
                <button
                    onClick={handleCreateNew}
                    className="flex items-center gap-2 px-4 py-2 bg-teal-600 text-white font-semibold rounded-md hover:bg-teal-700 transition-colors"
                >
                    <PlusIcon className="w-5 h-5" />
                    Create New Post
                </button>
            </div>
            
            <div className="space-y-3">
                {sortedPosts.length > 0 ? sortedPosts.map(post => (
                    <div key={post.id} className="p-3 bg-slate-100 dark:bg-slate-700/50 rounded-md flex flex-col sm:flex-row justify-between items-start sm:items-center">
                        <div className="flex-grow">
                            <div className="flex items-center gap-3">
                                <span className={`px-2 py-0.5 text-xs font-bold rounded-full ${post.isPublished ? 'bg-green-100 text-green-800 dark:bg-green-900/50 dark:text-green-300' : 'bg-slate-200 text-slate-600 dark:bg-slate-600 dark:text-slate-300'}`}>
                                    {post.isPublished ? 'Published' : 'Draft'}
                                </span>
                                <p className="font-semibold text-slate-800 dark:text-slate-200">{post.title}</p>
                            </div>
                            <p className="text-sm text-slate-500 dark:text-slate-400 ml-3 mt-1">
                                Published on {new Date(post.publishedAt).toLocaleDateString()}
                            </p>
                        </div>
                        <div className="mt-2 sm:mt-0 sm:ml-4 flex-shrink-0 flex items-center gap-2 self-end sm:self-center">
                            <a href={`/blog/${post.slug}`} target="_blank" rel="noopener noreferrer" className="px-3 py-1.5 text-sm font-semibold text-teal-600 dark:text-teal-400 hover:underline">
                                View
                            </a>
                            <button onClick={() => handleEdit(post)} className="flex items-center gap-2 px-3 py-1.5 text-sm bg-slate-200 dark:bg-slate-700 hover:bg-slate-300 dark:hover:bg-slate-600 text-slate-700 dark:text-slate-200 font-semibold rounded-md">
                                <PencilIcon className="w-4 h-4" /> Edit
                            </button>
                            <button onClick={() => handleDelete(post.id)} className="flex items-center gap-2 px-3 py-1.5 text-sm bg-red-500/10 hover:bg-red-500/20 text-red-600 dark:text-red-400 font-semibold rounded-md">
                                <TrashIcon className="w-4 h-4" />
                            </button>
                        </div>
                    </div>
                )) : (
                    <p className="text-center text-slate-500 dark:text-slate-400 py-8">
                        No blog posts yet. Click 'Create New Post' to get started!
                    </p>
                )}
            </div>
        </div>
    );
};

export default BlogManagementPanel;