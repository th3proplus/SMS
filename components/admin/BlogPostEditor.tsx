import React, { useState, useEffect, useRef } from 'react';
import type { BlogPost } from '../../types.ts';
import { slugify } from '../../utils/string.ts';

// Icons for the toolbar
import { BoldIcon } from '../icons/BoldIcon.tsx';
import { ItalicIcon } from '../icons/ItalicIcon.tsx';
import { LinkIcon } from '../icons/LinkIcon.tsx';
import { QuoteIcon } from '../icons/QuoteIcon.tsx';
import { ListUnorderedIcon } from '../icons/ListUnorderedIcon.tsx';

interface BlogPostEditorProps {
    post: BlogPost | null;
    onSave: (post: BlogPost) => void;
    onCancel: () => void;
}

const BlogPostEditor: React.FC<BlogPostEditorProps> = ({ post, onSave, onCancel }) => {
    const [formData, setFormData] = useState({
        title: '',
        slug: '',
        content: '',
        excerpt: '',
        featuredImageUrl: '',
        isPublished: false,
        publishedAt: new Date().toISOString().split('T')[0], // YYYY-MM-DD
    });
    
    const contentRef = useRef<HTMLTextAreaElement>(null);

    useEffect(() => {
        if (post) {
            setFormData({
                ...post,
                publishedAt: new Date(post.publishedAt).toISOString().split('T')[0],
            });
        }
    }, [post]);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
        const { name, value, type } = e.target;
        
        if (type === 'checkbox') {
            setFormData(prev => ({ ...prev, [name]: (e.target as HTMLInputElement).checked }));
        } else {
            setFormData(prev => ({ ...prev, [name]: value }));
        }
    };

    const handleTitleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const newTitle = e.target.value;
        setFormData(prev => ({
            ...prev,
            title: newTitle,
            slug: post?.slug ? prev.slug : slugify(newTitle) // Don't auto-update slug if post already exists
        }));
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        const finalPost: BlogPost = {
            id: post?.id || Date.now().toString(),
            title: formData.title.trim(),
            slug: formData.slug.trim() || slugify(formData.title.trim()),
            content: formData.content,
            excerpt: formData.excerpt.trim(),
            featuredImageUrl: formData.featuredImageUrl.trim(),
            isPublished: formData.isPublished,
            publishedAt: new Date(formData.publishedAt || Date.now()),
        };
        onSave(finalPost);
    };

    const insertMarkdown = (prefix: string, suffix: string = prefix, placeholder: string = 'text') => {
        const textarea = contentRef.current;
        if (!textarea) return;

        const start = textarea.selectionStart;
        const end = textarea.selectionEnd;
        const selectedText = textarea.value.substring(start, end);

        const textToInsert = selectedText || placeholder;
        
        const newText = `${textarea.value.substring(0, start)}${prefix}${textToInsert}${suffix}${textarea.value.substring(end)}`;
        
        setFormData(prev => ({ ...prev, content: newText }));
        
        // Focus and select the placeholder text
        setTimeout(() => {
            textarea.focus();
            if (!selectedText) {
                 textarea.selectionStart = start + prefix.length;
                 textarea.selectionEnd = start + prefix.length + placeholder.length;
            }
        }, 0);
    };
    
    return (
        <form onSubmit={handleSubmit} className="bg-white dark:bg-slate-800 p-6 rounded-lg shadow-md space-y-6">
            <h2 className="text-lg font-semibold text-slate-800 dark:text-slate-200 border-b border-slate-200 dark:border-slate-700 pb-2">
                {post ? 'Edit Post' : 'Create New Post'}
            </h2>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="md:col-span-2 space-y-6">
                    <div>
                        <label htmlFor="title" className="block text-sm font-medium text-slate-600 dark:text-slate-300 mb-1">Title</label>
                        <input type="text" id="title" name="title" value={formData.title} onChange={handleTitleChange} className="w-full px-3 py-2 bg-slate-100 dark:bg-slate-700 border border-slate-300 dark:border-slate-600 rounded-md focus:ring-2 focus:ring-teal-500 focus:outline-none" required />
                    </div>
                     <div>
                        <label htmlFor="content" className="block text-sm font-medium text-slate-600 dark:text-slate-300 mb-1">Content (Markdown)</label>
                        <div className="flex items-center gap-2 p-2 bg-slate-100 dark:bg-slate-700 border-b border-slate-300 dark:border-slate-600 rounded-t-md">
                            <button type="button" onClick={() => insertMarkdown('**')} title="Bold" className="p-2 rounded hover:bg-slate-200 dark:hover:bg-slate-600"><BoldIcon className="w-4 h-4" /></button>
                            <button type="button" onClick={() => insertMarkdown('*')} title="Italic" className="p-2 rounded hover:bg-slate-200 dark:hover:bg-slate-600"><ItalicIcon className="w-4 h-4" /></button>
                            <button type="button" onClick={() => insertMarkdown('[', '](url)', 'link text')} title="Link" className="p-2 rounded hover:bg-slate-200 dark:hover:bg-slate-600"><LinkIcon className="w-4 h-4" /></button>
                            <button type="button" onClick={() => insertMarkdown('> ', '', 'quote')} title="Blockquote" className="p-2 rounded hover:bg-slate-200 dark:hover:bg-slate-600"><QuoteIcon className="w-4 h-4" /></button>
                             <button type="button" onClick={() => insertMarkdown('* ', '', 'list item')} title="Unordered List" className="p-2 rounded hover:bg-slate-200 dark:hover:bg-slate-600"><ListUnorderedIcon className="w-4 h-4" /></button>
                        </div>
                        <textarea id="content" name="content" ref={contentRef} value={formData.content} onChange={handleChange} rows={15} className="w-full px-3 py-2 bg-slate-100 dark:bg-slate-700 border border-slate-300 dark:border-slate-600 rounded-b-md focus:ring-2 focus:ring-teal-500 focus:outline-none" />
                    </div>
                </div>

                <div className="space-y-6">
                    <div>
                        <label htmlFor="slug" className="block text-sm font-medium text-slate-600 dark:text-slate-300 mb-1">Slug</label>
                        <input type="text" id="slug" name="slug" value={formData.slug} onChange={handleChange} className="w-full px-3 py-2 bg-slate-100 dark:bg-slate-700 border border-slate-300 dark:border-slate-600 rounded-md focus:ring-2 focus:ring-teal-500 focus:outline-none" />
                    </div>
                    <div>
                        <label htmlFor="excerpt" className="block text-sm font-medium text-slate-600 dark:text-slate-300 mb-1">Excerpt</label>
                        <textarea id="excerpt" name="excerpt" value={formData.excerpt} onChange={handleChange} rows={4} className="w-full px-3 py-2 bg-slate-100 dark:bg-slate-700 border border-slate-300 dark:border-slate-600 rounded-md focus:ring-2 focus:ring-teal-500 focus:outline-none" />
                    </div>
                    <div>
                        <label htmlFor="featuredImageUrl" className="block text-sm font-medium text-slate-600 dark:text-slate-300 mb-1">Featured Image URL</label>
                        <input type="text" id="featuredImageUrl" name="featuredImageUrl" value={formData.featuredImageUrl} onChange={handleChange} className="w-full px-3 py-2 bg-slate-100 dark:bg-slate-700 border border-slate-300 dark:border-slate-600 rounded-md focus:ring-2 focus:ring-teal-500 focus:outline-none" />
                    </div>
                     <div>
                        <label htmlFor="publishedAt" className="block text-sm font-medium text-slate-600 dark:text-slate-300 mb-1">Publish Date</label>
                        <input type="date" id="publishedAt" name="publishedAt" value={formData.publishedAt} onChange={handleChange} className="w-full px-3 py-2 bg-slate-100 dark:bg-slate-700 border border-slate-300 dark:border-slate-600 rounded-md focus:ring-2 focus:ring-teal-500 focus:outline-none" />
                    </div>
                    <label className="relative inline-flex items-center cursor-pointer">
                        <input type="checkbox" name="isPublished" checked={formData.isPublished} onChange={handleChange} className="sr-only peer" />
                        <div className="w-11 h-6 bg-slate-300 peer-focus:outline-none rounded-full peer dark:bg-slate-600 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-slate-500 peer-checked:bg-teal-600"></div>
                        <span className="ml-3 text-sm font-medium text-slate-700 dark:text-slate-300">{formData.isPublished ? 'Published' : 'Draft'}</span>
                    </label>
                </div>
            </div>
            
            <div className="flex justify-end gap-4 pt-4 border-t border-slate-200 dark:border-slate-700">
                <button type="button" onClick={onCancel} className="px-4 py-2 bg-slate-200 dark:bg-slate-600 text-slate-800 dark:text-slate-200 font-semibold rounded-md hover:bg-slate-300 dark:hover:bg-slate-500">
                    Cancel
                </button>
                <button type="submit" className="px-4 py-2 bg-teal-600 text-white font-semibold rounded-md hover:bg-teal-700">
                    Save Post
                </button>
            </div>
        </form>
    );
};

export default BlogPostEditor;
