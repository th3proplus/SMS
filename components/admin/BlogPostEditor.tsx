import React, { useState, useEffect, useCallback } from 'react';
import type { BlogPost } from '../../types';
import { slugify } from '../../utils/string';
import { SaveIcon } from '../icons/SaveIcon';

interface BlogPostEditorProps {
    post: BlogPost | null;
    onSave: (post: BlogPost) => void;
    onCancel: () => void;
}

const BlogPostEditor: React.FC<BlogPostEditorProps> = ({ post, onSave, onCancel }) => {
    const getInitialState = useCallback(() => {
        if (post) return post;
        return {
            id: Date.now().toString(),
            title: '',
            slug: '',
            content: '',
            excerpt: '',
            featuredImageUrl: '',
            isPublished: false,
            publishedAt: new Date(),
            metaTitle: '',
            metaDescription: '',
        };
    }, [post]);

    const [formData, setFormData] = useState<BlogPost>(getInitialState);
    const [isSlugManuallyEdited, setIsSlugManuallyEdited] = useState(false);

    useEffect(() => {
        setFormData(getInitialState());
        setIsSlugManuallyEdited(!!post?.slug);
    }, [post, getInitialState]);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
        const { name, value, type } = e.target;
        const checked = (e.target as HTMLInputElement).checked;

        if (name === 'title' && !isSlugManuallyEdited) {
            setFormData(prev => ({ ...prev, title: value, slug: slugify(value) }));
        } else if (name === 'slug') {
            setIsSlugManuallyEdited(true);
            setFormData(prev => ({ ...prev, slug: slugify(value) }));
        } else {
            setFormData(prev => ({
                ...prev,
                [name]: type === 'checkbox' ? checked : value,
            }));
        }
    };
    
    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        onSave(formData);
    };

    return (
        <form onSubmit={handleSubmit} className="bg-white dark:bg-slate-800 p-6 rounded-lg shadow-md space-y-8">
            <h2 className="text-lg font-semibold text-slate-800 dark:text-slate-200 border-b border-slate-200 dark:border-slate-700 pb-2 mb-4">
                {post ? 'Edit Post' : 'Create New Post'}
            </h2>

            {/* Main Content */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                <div className="lg:col-span-2 space-y-6">
                    <div>
                        <label htmlFor="title" className="block text-sm font-medium text-slate-600 dark:text-slate-300 mb-1">Title</label>
                        <input type="text" id="title" name="title" value={formData.title} onChange={handleChange} required className="w-full px-3 py-2 bg-slate-100 dark:bg-slate-700 border border-slate-300 dark:border-slate-600 rounded-md focus:ring-2 focus:ring-teal-500 focus:outline-none text-lg font-semibold" />
                    </div>
                    <div>
                        <label htmlFor="content" className="block text-sm font-medium text-slate-600 dark:text-slate-300 mb-1">Content (Markdown)</label>
                        <textarea id="content" name="content" value={formData.content} onChange={handleChange} rows={15} required className="w-full px-3 py-2 bg-slate-100 dark:bg-slate-700 border border-slate-300 dark:border-slate-600 rounded-md focus:ring-2 focus:ring-teal-500 focus:outline-none font-mono text-sm" />
                        <p className="text-xs text-slate-500 mt-1">Supports headings (#, ##), lists (*), links ([text](url)), bold (**text**), and italic (*text*).</p>
                    </div>
                </div>

                {/* Sidebar */}
                <div className="space-y-6">
                     <div>
                        <div className="flex items-center justify-between">
                             <label className="text-sm font-medium text-slate-600 dark:text-slate-300">Publish Status</label>
                             <label className="relative inline-flex items-center cursor-pointer">
                                <input type="checkbox" name="isPublished" checked={formData.isPublished} onChange={handleChange} className="sr-only peer" />
                                <div className="w-11 h-6 bg-slate-300 peer-focus:outline-none rounded-full peer dark:bg-slate-600 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-slate-500 peer-checked:bg-teal-600"></div>
                                <span className="ml-3 text-sm font-medium text-slate-700 dark:text-slate-300">{formData.isPublished ? 'Published' : 'Draft'}</span>
                            </label>
                        </div>
                    </div>
                    <div>
                        <label htmlFor="slug" className="block text-sm font-medium text-slate-600 dark:text-slate-300 mb-1">URL Slug</label>
                        <input type="text" id="slug" name="slug" value={formData.slug} onChange={handleChange} required className="w-full px-3 py-2 bg-slate-100 dark:bg-slate-700 border border-slate-300 dark:border-slate-600 rounded-md focus:ring-2 focus:ring-teal-500 focus:outline-none font-mono text-sm" />
                        <p className="text-xs text-slate-500 mt-1">site.com/blog/{formData.slug}</p>
                    </div>
                    <div>
                        <label htmlFor="excerpt" className="block text-sm font-medium text-slate-600 dark:text-slate-300 mb-1">Excerpt</label>
                        <textarea id="excerpt" name="excerpt" value={formData.excerpt} onChange={handleChange} rows={4} required className="w-full px-3 py-2 bg-slate-100 dark:bg-slate-700 border border-slate-300 dark:border-slate-600 rounded-md focus:ring-2 focus:ring-teal-500 focus:outline-none" />
                    </div>
                     <div>
                        <label htmlFor="featuredImageUrl" className="block text-sm font-medium text-slate-600 dark:text-slate-300 mb-1">Featured Image URL</label>
                        <input type="url" id="featuredImageUrl" name="featuredImageUrl" value={formData.featuredImageUrl} onChange={handleChange} className="w-full px-3 py-2 bg-slate-100 dark:bg-slate-700 border border-slate-300 dark:border-slate-600 rounded-md focus:ring-2 focus:ring-teal-500 focus:outline-none" placeholder="https://example.com/image.jpg"/>
                    </div>
                </div>
            </div>

            {/* SEO Section */}
            <div className="border-t border-slate-200 dark:border-slate-700 pt-6">
                 <h3 className="text-md font-semibold text-slate-700 dark:text-slate-300 mb-4">SEO Settings</h3>
                 <div className="space-y-4">
                     <div>
                        <label htmlFor="metaTitle" className="block text-sm font-medium text-slate-600 dark:text-slate-300 mb-1">Meta Title</label>
                        <input type="text" id="metaTitle" name="metaTitle" value={formData.metaTitle} onChange={handleChange} className="w-full px-3 py-2 bg-slate-100 dark:bg-slate-700 border border-slate-300 dark:border-slate-600 rounded-md focus:ring-2 focus:ring-teal-500 focus:outline-none" placeholder="Defaults to post title if empty" />
                    </div>
                    <div>
                        <label htmlFor="metaDescription" className="block text-sm font-medium text-slate-600 dark:text-slate-300 mb-1">Meta Description</label>
                        <textarea id="metaDescription" name="metaDescription" value={formData.metaDescription} onChange={handleChange} rows={3} className="w-full px-3 py-2 bg-slate-100 dark:bg-slate-700 border border-slate-300 dark:border-slate-600 rounded-md focus:ring-2 focus:ring-teal-500 focus:outline-none" placeholder="Defaults to excerpt if empty" />
                    </div>
                 </div>
            </div>

            {/* Actions */}
            <div className="flex items-center justify-end gap-4 border-t border-slate-200 dark:border-slate-700 pt-6">
                <button type="button" onClick={onCancel} className="px-4 py-2 bg-slate-200 dark:bg-slate-600 text-slate-800 dark:text-slate-200 font-semibold rounded-md hover:bg-slate-300 dark:hover:bg-slate-500">
                    Cancel
                </button>
                <button type="submit" className="flex items-center gap-2 px-4 py-2 bg-teal-600 text-white font-semibold rounded-md hover:bg-teal-700">
                    <SaveIcon className="w-5 h-5" />
                    Save Post
                </button>
            </div>
        </form>
    );
};

export default BlogPostEditor;