import React, { useState, useEffect, useCallback, useRef } from 'react';
import type { BlogPost } from '../../types';
import { slugify } from '../../utils/string';
import { parseMarkdown } from '../../utils/markdown';
import { SaveIcon } from '../icons/SaveIcon';
import { ChevronDownIcon } from '../icons/ChevronDownIcon';
import { BoldIcon } from '../icons/BoldIcon';
import { ItalicIcon } from '../icons/ItalicIcon';
import { LinkIcon } from '../icons/LinkIcon';
import { QuoteIcon } from '../icons/QuoteIcon';
import { ListUnorderedIcon } from '../icons/ListUnorderedIcon';
import { XIcon } from '../icons/XIcon';

interface AccordionProps {
    title: string;
    children: React.ReactNode;
    defaultOpen?: boolean;
}

const Accordion: React.FC<AccordionProps> = ({ title, children, defaultOpen = false }) => {
    const [isOpen, setIsOpen] = useState(defaultOpen);
    return (
        <div className="border border-slate-200 dark:border-slate-700 rounded-md">
            <button
                type="button"
                onClick={() => setIsOpen(!isOpen)}
                className="w-full flex justify-between items-center p-3 bg-slate-100 dark:bg-slate-700/50 hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors"
            >
                <h3 className="font-semibold text-sm text-slate-700 dark:text-slate-200">{title}</h3>
                <ChevronDownIcon className={`w-5 h-5 text-slate-500 dark:text-slate-400 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
            </button>
            {isOpen && <div className="p-4 border-t border-slate-200 dark:border-slate-700">{children}</div>}
        </div>
    );
};


const SERPPreview: React.FC<{ title: string; description: string; slug: string }> = ({ title, description, slug }) => {
    const siteUrl = window.location.origin;
    return (
        <div className="p-4 bg-slate-50 dark:bg-slate-900/50 rounded-md">
            <p className="text-sm text-blue-800 dark:text-blue-400 truncate group-hover:underline">{title || "Your Post Title Will Appear Here"}</p>
            <p className="text-xs text-green-700 dark:text-green-500">{`${siteUrl}/blog/${slug || 'your-post-slug'}`}</p>
            <p className="text-xs text-slate-600 dark:text-slate-400 mt-1 line-clamp-2">{description || "Your meta description will appear here. Keep it concise and engaging to attract readers."}</p>
        </div>
    );
};

const TagInput: React.FC<{ tags: string[]; setTags: (tags: string[]) => void }> = ({ tags, setTags }) => {
    const [inputValue, setInputValue] = useState('');

    const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
        if (e.key === 'Enter' || e.key === ',') {
            e.preventDefault();
            const newTag = inputValue.trim();
            if (newTag && !tags.includes(newTag)) {
                setTags([...tags, newTag]);
            }
            setInputValue('');
        }
    };

    const removeTag = (tagToRemove: string) => {
        setTags(tags.filter(tag => tag !== tagToRemove));
    };

    return (
        <div>
            <div className="flex flex-wrap gap-2 mb-2">
                {tags.map(tag => (
                    <div key={tag} className="flex items-center gap-1 bg-teal-100 dark:bg-teal-900/50 text-teal-800 dark:text-teal-300 text-xs font-semibold px-2 py-1 rounded-full">
                        <span>{tag}</span>
                        <button type="button" onClick={() => removeTag(tag)} className="text-teal-600 dark:text-teal-400 hover:text-teal-800 dark:hover:text-teal-200">
                            <XIcon className="w-3 h-3" />
                        </button>
                    </div>
                ))}
            </div>
            <input
                type="text"
                value={inputValue}
                onChange={e => setInputValue(e.target.value)}
                onKeyDown={handleKeyDown}
                className="w-full px-3 py-2 bg-slate-100 dark:bg-slate-700 border border-slate-300 dark:border-slate-600 rounded-md focus:ring-2 focus:ring-teal-500 focus:outline-none"
                placeholder="Add tags (press Enter)"
            />
        </div>
    );
};

interface BlogPostEditorProps {
    post: BlogPost | null;
    onSave: (post: BlogPost) => void;
    onCancel: () => void;
}

const BlogPostEditor: React.FC<BlogPostEditorProps> = ({ post, onSave, onCancel }) => {
    const getInitialState = useCallback(() => {
        if (post) return { ...post, tags: post.tags || [] }; // Ensure tags is an array
        return {
            id: Date.now().toString(),
            title: '',
            slug: '',
            content: '',
            excerpt: '',
            featuredImageUrl: '',
            isPublished: false,
            publishedAt: new Date(),
            tags: [],
            metaTitle: '',
            metaDescription: '',
        };
    }, [post]);

    const [formData, setFormData] = useState<BlogPost>(getInitialState);
    const [isSlugManuallyEdited, setIsSlugManuallyEdited] = useState(false);
    const contentRef = useRef<HTMLTextAreaElement>(null);

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
        } else if (name === 'publishedAt') {
            setFormData(prev => ({ ...prev, publishedAt: new Date(value) }));
        }
        else {
            setFormData(prev => ({
                ...prev,
                [name]: type === 'checkbox' ? checked : value,
            }));
        }
    };
    
    const handleTagsChange = (newTags: string[]) => {
        setFormData(prev => ({ ...prev, tags: newTags }));
    };

    const handleMarkdownAction = (syntax: 'bold' | 'italic' | 'link' | 'quote' | 'h2' | 'h3' | 'ul') => {
        const textarea = contentRef.current;
        if (!textarea) return;

        const start = textarea.selectionStart;
        const end = textarea.selectionEnd;
        const selectedText = textarea.value.substring(start, end);
        let newText;

        switch(syntax) {
            case 'bold':
                newText = `**${selectedText || 'bold text'}**`;
                break;
            case 'italic':
                newText = `*${selectedText || 'italic text'}*`;
                break;
            case 'link':
                newText = `[${selectedText || 'link text'}](url)`;
                break;
            case 'quote':
                newText = `> ${selectedText || 'quoted text'}`;
                break;
            case 'h2':
                newText = `## ${selectedText || 'Heading 2'}`;
                break;
            case 'h3':
                 newText = `### ${selectedText || 'Heading 3'}`;
                 break;
            case 'ul':
                 newText = `* ${selectedText || 'List item'}`;
                 break;
            default:
                newText = selectedText;
        }

        const before = textarea.value.substring(0, start);
        const after = textarea.value.substring(end);
        
        textarea.value = before + newText + after;
        
        // This is a bit of a trick to make React aware of the change
        const event = new Event('input', { bubbles: true });
        textarea.dispatchEvent(event);
        
        // Focus and set cursor position
        textarea.focus();
        textarea.setSelectionRange(start + newText.length, start + newText.length);
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        onSave(formData);
    };

    const dateForInput = (date: Date) => {
        const pad = (num: number) => num.toString().padStart(2, '0');
        const year = date.getFullYear();
        const month = pad(date.getMonth() + 1);
        const day = pad(date.getDate());
        const hours = pad(date.getHours());
        const minutes = pad(date.getMinutes());
        return `${year}-${month}-${day}T${hours}:${minutes}`;
    };

    return (
        <form onSubmit={handleSubmit} className="bg-white dark:bg-slate-800 p-6 rounded-lg shadow-md space-y-6">
            <div className="flex justify-between items-center">
                 <h2 className="text-xl font-bold text-slate-800 dark:text-slate-200">
                    {post ? 'Edit Post' : 'Create New Post'}
                </h2>
                <div className="flex items-center gap-4">
                    <button type="button" onClick={onCancel} className="px-4 py-2 bg-slate-200 dark:bg-slate-600 text-slate-800 dark:text-slate-200 font-semibold rounded-md hover:bg-slate-300 dark:hover:bg-slate-500">
                        Cancel
                    </button>
                    <button type="submit" className="flex items-center gap-2 px-4 py-2 bg-teal-600 text-white font-semibold rounded-md hover:bg-teal-700">
                        <SaveIcon className="w-5 h-5" />
                        Save Post
                    </button>
                </div>
            </div>
            
            {/* Main Content */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <div className="lg:col-span-2 space-y-4">
                    <div>
                        <input type="text" id="title" name="title" value={formData.title} onChange={handleChange} required className="w-full px-3 py-2 bg-slate-100 dark:bg-slate-700 border-2 border-transparent focus:border-teal-500 rounded-md focus:ring-0 focus:outline-none text-2xl font-extrabold" placeholder="Post Title" />
                    </div>

                    <div className="flex items-center gap-2 p-2 bg-slate-100 dark:bg-slate-900 rounded-md border border-slate-200 dark:border-slate-700">
                         <button type="button" onClick={() => handleMarkdownAction('h2')} title="Heading 2" className="p-2 rounded-md hover:bg-slate-200 dark:hover:bg-slate-700"><span className="font-bold text-sm">H2</span></button>
                         <button type="button" onClick={() => handleMarkdownAction('h3')} title="Heading 3" className="p-2 rounded-md hover:bg-slate-200 dark:hover:bg-slate-700"><span className="font-bold text-sm">H3</span></button>
                         <div className="w-px h-5 bg-slate-300 dark:bg-slate-600 mx-1"></div>
                        <button type="button" onClick={() => handleMarkdownAction('bold')} title="Bold" className="p-2 rounded-md hover:bg-slate-200 dark:hover:bg-slate-700"><BoldIcon className="w-5 h-5" /></button>
                        <button type="button" onClick={() => handleMarkdownAction('italic')} title="Italic" className="p-2 rounded-md hover:bg-slate-200 dark:hover:bg-slate-700"><ItalicIcon className="w-5 h-5" /></button>
                         <div className="w-px h-5 bg-slate-300 dark:bg-slate-600 mx-1"></div>
                        <button type="button" onClick={() => handleMarkdownAction('link')} title="Link" className="p-2 rounded-md hover:bg-slate-200 dark:hover:bg-slate-700"><LinkIcon className="w-5 h-5" /></button>
                        <button type="button" onClick={() => handleMarkdownAction('quote')} title="Blockquote" className="p-2 rounded-md hover:bg-slate-200 dark:hover:bg-slate-700"><QuoteIcon className="w-5 h-5" /></button>
                        <button type="button" onClick={() => handleMarkdownAction('ul')} title="Unordered List" className="p-2 rounded-md hover:bg-slate-200 dark:hover:bg-slate-700"><ListUnorderedIcon className="w-5 h-5" /></button>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 h-[60vh] min-h-[500px]">
                        <textarea
                            ref={contentRef}
                            id="content"
                            name="content"
                            value={formData.content}
                            onChange={handleChange}
                            required
                            className="w-full h-full resize-none p-3 bg-slate-100 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-md focus:ring-2 focus:ring-teal-500 focus:outline-none font-mono text-sm"
                            placeholder="Start writing your masterpiece in Markdown..."
                        />
                        <div className="h-full overflow-y-auto p-4 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-md">
                            <div
                                className="prose dark:prose-invert max-w-none"
                                dangerouslySetInnerHTML={{ __html: parseMarkdown(formData.content) }}
                            />
                        </div>
                    </div>
                </div>

                {/* Sidebar */}
                <div className="space-y-4">
                     <Accordion title="Publish Settings" defaultOpen={true}>
                         <div className="space-y-4">
                            <div className="flex items-center justify-between">
                                <label className="text-sm font-medium text-slate-600 dark:text-slate-300">Status</label>
                                <label className="relative inline-flex items-center cursor-pointer">
                                    <input type="checkbox" name="isPublished" checked={formData.isPublished} onChange={handleChange} className="sr-only peer" />
                                    <div className="w-11 h-6 bg-slate-300 peer-focus:outline-none rounded-full peer dark:bg-slate-600 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-slate-500 peer-checked:bg-teal-600"></div>
                                    <span className="ml-3 text-sm font-medium text-slate-700 dark:text-slate-300">{formData.isPublished ? 'Published' : 'Draft'}</span>
                                </label>
                            </div>
                            <div>
                                <label htmlFor="publishedAt" className="block text-sm font-medium text-slate-600 dark:text-slate-300 mb-1">Publish Date</label>
                                <input type="datetime-local" id="publishedAt" name="publishedAt" value={dateForInput(formData.publishedAt)} onChange={handleChange} className="w-full px-3 py-2 bg-slate-100 dark:bg-slate-700 border border-slate-300 dark:border-slate-600 rounded-md focus:ring-2 focus:ring-teal-500 focus:outline-none" />
                            </div>
                             <div>
                                <label htmlFor="slug" className="block text-sm font-medium text-slate-600 dark:text-slate-300 mb-1">URL Slug</label>
                                <input type="text" id="slug" name="slug" value={formData.slug} onChange={handleChange} required className="w-full px-3 py-2 bg-slate-100 dark:bg-slate-700 border border-slate-300 dark:border-slate-600 rounded-md focus:ring-2 focus:ring-teal-500 focus:outline-none font-mono text-sm" />
                            </div>
                         </div>
                     </Accordion>

                     <Accordion title="Tags">
                        <TagInput tags={formData.tags || []} setTags={handleTagsChange} />
                     </Accordion>

                    <Accordion title="Featured Image">
                         <div className="space-y-2">
                             <label htmlFor="featuredImageUrl" className="block text-sm font-medium text-slate-600 dark:text-slate-300 mb-1">Image URL</label>
                             <input type="url" id="featuredImageUrl" name="featuredImageUrl" value={formData.featuredImageUrl} onChange={handleChange} className="w-full px-3 py-2 bg-slate-100 dark:bg-slate-700 border border-slate-300 dark:border-slate-600 rounded-md focus:ring-2 focus:ring-teal-500 focus:outline-none" placeholder="https://..."/>
                             {formData.featuredImageUrl && (
                                <img src={formData.featuredImageUrl} alt="Preview" className="w-full h-auto rounded-md mt-2 border border-slate-200 dark:border-slate-700" onError={(e) => (e.currentTarget.style.display = 'none')} onLoad={(e) => (e.currentTarget.style.display = 'block')} />
                             )}
                         </div>
                    </Accordion>
                     
                    <Accordion title="Excerpt">
                        <textarea id="excerpt" name="excerpt" value={formData.excerpt} onChange={handleChange} rows={4} required className="w-full px-3 py-2 bg-slate-100 dark:bg-slate-700 border border-slate-300 dark:border-slate-600 rounded-md focus:ring-2 focus:ring-teal-500 focus:outline-none" />
                    </Accordion>

                     <Accordion title="SEO & Social">
                         <div className="space-y-4">
                             <div>
                                <label htmlFor="metaTitle" className="block text-sm font-medium text-slate-600 dark:text-slate-300 mb-1">Meta Title</label>
                                <input type="text" id="metaTitle" name="metaTitle" value={formData.metaTitle} onChange={handleChange} className="w-full px-3 py-2 bg-slate-100 dark:bg-slate-700 border border-slate-300 dark:border-slate-600 rounded-md focus:ring-2 focus:ring-teal-500 focus:outline-none" placeholder="Defaults to post title" />
                                <p className="text-xs text-slate-500 mt-1 text-right">{formData.metaTitle?.length || 0} / 60</p>
                            </div>
                            <div>
                                <label htmlFor="metaDescription" className="block text-sm font-medium text-slate-600 dark:text-slate-300 mb-1">Meta Description</label>
                                <textarea id="metaDescription" name="metaDescription" value={formData.metaDescription} onChange={handleChange} rows={3} className="w-full px-3 py-2 bg-slate-100 dark:bg-slate-700 border border-slate-300 dark:border-slate-600 rounded-md focus:ring-2 focus:ring-teal-500 focus:outline-none" placeholder="Defaults to excerpt" />
                                <p className="text-xs text-slate-500 mt-1 text-right">{formData.metaDescription?.length || 0} / 160</p>
                            </div>
                             <h4 className="text-sm font-semibold text-slate-600 dark:text-slate-300 pt-2 border-t border-slate-200 dark:border-slate-700">Search Result Preview</h4>
                             <SERPPreview title={formData.metaTitle || formData.title} description={formData.metaDescription || formData.excerpt} slug={formData.slug} />
                         </div>
                     </Accordion>
                </div>
            </div>
        </form>
    );
};

export default BlogPostEditor;
