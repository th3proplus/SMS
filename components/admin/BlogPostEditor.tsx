import React, { useState, useEffect, useRef, useMemo } from 'react';
import type { BlogPost } from '../../types.ts';
import { slugify } from '../../utils/string.ts';
import { parseMarkdown } from '../../utils/markdown.ts';

// Icons for the toolbar
import { BoldIcon } from '../icons/BoldIcon.tsx';
import { ItalicIcon } from '../icons/ItalicIcon.tsx';
import { LinkIcon } from '../icons/LinkIcon.tsx';
import { QuoteIcon } from '../icons/QuoteIcon.tsx';
import { ListUnorderedIcon } from '../icons/ListUnorderedIcon.tsx';
import { PhotoIcon } from '../icons/PhotoIcon.tsx';
import { CodeBracketIcon } from '../icons/CodeBracketIcon.tsx';
import { MarkdownIcon } from '../icons/MarkdownIcon.tsx';
import { ArrowsPointingOutIcon } from '../icons/ArrowsPointingOutIcon.tsx';
import { ArrowsPointingInIcon } from '../icons/ArrowsPointingInIcon.tsx';
import { PaletteIcon } from '../icons/PaletteIcon.tsx';
import { TrashIcon } from '../icons/TrashIcon.tsx';


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
        editorMode: 'markdown' as 'markdown' | 'html',
    });
    const [isFullscreen, setIsFullscreen] = useState(false);
    
    const contentRef = useRef<HTMLTextAreaElement>(null);
    const colorPickerRef = useRef<HTMLInputElement>(null);

    useEffect(() => {
        if (post) {
            setFormData({
                ...post,
                publishedAt: new Date(post.publishedAt).toISOString().split('T')[0],
                editorMode: post.editorMode || 'markdown',
            });
        }
    }, [post]);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
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
            editorMode: formData.editorMode,
        };
        onSave(finalPost);
    };

    const handleFileUpload = (file: File, callback: (base64: string) => void) => {
        if (file && file.type.startsWith('image/')) {
            const reader = new FileReader();
            reader.onload = (e) => {
                if (typeof e.target?.result === 'string') {
                    callback(e.target.result);
                }
            };
            reader.readAsDataURL(file);
        } else {
            alert('Please select a valid image file.');
        }
    };

    const handleContentImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0]) {
            handleFileUpload(e.target.files[0], (base64) => {
                insertMarkdown(`\n![${e.target.files?.[0].name || 'image'}](${base64})\n`, '', '');
            });
        }
    };
    
    const handleFeaturedImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0]) {
            handleFileUpload(e.target.files[0], (base64) => {
                setFormData(prev => ({ ...prev, featuredImageUrl: base64 }));
            });
        }
    };

    const insertMarkdown = (prefix: string, suffix: string = '', placeholder: string = 'text') => {
        const textarea = contentRef.current;
        if (!textarea) return;

        const start = textarea.selectionStart;
        const end = textarea.selectionEnd;
        const selectedText = textarea.value.substring(start, end);

        const textToInsert = selectedText || placeholder;
        
        const newText = `${textarea.value.substring(0, start)}${prefix}${textToInsert}${suffix}${textarea.value.substring(end)}`;
        
        setFormData(prev => ({ ...prev, content: newText }));
        
        setTimeout(() => {
            textarea.focus();
            if (!selectedText) {
                 textarea.selectionStart = start + prefix.length;
                 textarea.selectionEnd = start + prefix.length + placeholder.length;
            } else {
                textarea.selectionStart = start + prefix.length;
                textarea.selectionEnd = end + prefix.length;
            }
        }, 0);
    };
    
    const previewContent = useMemo(() => {
        return formData.editorMode === 'html' ? formData.content : parseMarkdown(formData.content);
    }, [formData.content, formData.editorMode]);

    const editorClasses = isFullscreen 
        ? 'fixed inset-0 z-50 bg-white dark:bg-slate-800 flex flex-col'
        : 'bg-white dark:bg-slate-800 p-6 rounded-lg shadow-md space-y-6';

    return (
        <form onSubmit={handleSubmit} className={editorClasses}>
             <div className={`flex justify-between items-center border-b border-slate-200 dark:border-slate-700 pb-2 ${isFullscreen ? 'p-4' : ''}`}>
                <h2 className="text-lg font-semibold text-slate-800 dark:text-slate-200">
                    {post ? 'Edit Post' : 'Create New Post'}
                </h2>
                {isFullscreen && (
                     <div className="flex justify-end gap-4">
                        <button type="button" onClick={onCancel} className="px-4 py-2 bg-slate-200 dark:bg-slate-600 text-slate-800 dark:text-slate-200 font-semibold rounded-md hover:bg-slate-300 dark:hover:bg-slate-500">
                            Cancel
                        </button>
                        <button type="submit" className="px-4 py-2 bg-teal-600 text-white font-semibold rounded-md hover:bg-teal-700">
                            Save Post
                        </button>
                    </div>
                )}
            </div>
            
            <div className={`flex-grow flex flex-col md:flex-row gap-6 overflow-auto ${isFullscreen ? 'p-4' : ''}`}>
                {/* Main Content Area */}
                <div className="flex-grow flex flex-col md:grid md:grid-cols-2 gap-4">
                     {/* Editor */}
                    <div className="flex flex-col">
                        <div className="flex items-center flex-wrap gap-1 p-2 bg-slate-100 dark:bg-slate-900/50 border-b border-slate-300 dark:border-slate-700 rounded-t-md">
                            <button type="button" onClick={() => insertMarkdown('## ', '', 'Heading 2')} title="H2" className="p-2 w-8 rounded hover:bg-slate-200 dark:hover:bg-slate-700 font-bold">H2</button>
                            <button type="button" onClick={() => insertMarkdown('### ', '', 'Heading 3')} title="H3" className="p-2 w-8 rounded hover:bg-slate-200 dark:hover:bg-slate-700 font-bold">H3</button>
                            <div className="w-px h-6 bg-slate-300 dark:bg-slate-600 mx-1"></div>
                            <button type="button" onClick={() => insertMarkdown('**', '**')} title="Bold" className="p-2 rounded hover:bg-slate-200 dark:hover:bg-slate-700"><BoldIcon className="w-4 h-4" /></button>
                            <button type="button" onClick={() => insertMarkdown('*', '*')} title="Italic" className="p-2 rounded hover:bg-slate-200 dark:hover:bg-slate-700"><ItalicIcon className="w-4 h-4" /></button>
                            <div className="w-px h-6 bg-slate-300 dark:bg-slate-600 mx-1"></div>
                            <button type="button" onClick={() => insertMarkdown('[', '](url)', 'link text')} title="Link" className="p-2 rounded hover:bg-slate-200 dark:hover:bg-slate-700"><LinkIcon className="w-4 h-4" /></button>
                            <button type="button" onClick={() => insertMarkdown('> ', '', 'quote')} title="Blockquote" className="p-2 rounded hover:bg-slate-200 dark:hover:bg-slate-700"><QuoteIcon className="w-4 h-4" /></button>
                             <button type="button" onClick={() => insertMarkdown('* ', '', 'list item')} title="Unordered List" className="p-2 rounded hover:bg-slate-200 dark:hover:bg-slate-700"><ListUnorderedIcon className="w-4 h-4" /></button>
                             <div className="relative">
                                <button type="button" onClick={() => colorPickerRef.current?.click()} title="Text Color" className="p-2 rounded hover:bg-slate-200 dark:hover:bg-slate-700"><PaletteIcon className="w-4 h-4" /></button>
                                <input ref={colorPickerRef} type="color" className="absolute top-0 left-0 w-full h-full opacity-0 cursor-pointer" onChange={(e) => insertMarkdown(`<span style="color: ${e.target.value};">`, '</span>')} />
                             </div>
                            <label htmlFor="content-image-upload" title="Upload Image" className="p-2 rounded hover:bg-slate-200 dark:hover:bg-slate-700 cursor-pointer"><PhotoIcon className="w-4 h-4" /></label>
                            <input type="file" id="content-image-upload" accept="image/*" className="hidden" onChange={handleContentImageUpload} />
                             <div className="flex-grow"></div>
                             <button type="button" onClick={() => setIsFullscreen(!isFullscreen)} title={isFullscreen ? "Exit fullscreen" : "Fullscreen"} className="p-2 rounded hover:bg-slate-200 dark:hover:bg-slate-700">
                                {isFullscreen ? <ArrowsPointingInIcon className="w-4 h-4" /> : <ArrowsPointingOutIcon className="w-4 h-4" />}
                            </button>
                        </div>
                        <textarea id="content" name="content" ref={contentRef} value={formData.content} onChange={handleChange} className="flex-grow w-full px-3 py-2 bg-slate-50 dark:bg-slate-700 border border-slate-300 dark:border-slate-600 rounded-b-md focus:ring-2 focus:ring-teal-500 focus:outline-none" />
                    </div>
                     {/* Preview */}
                    <div className="flex-col h-full hidden md:flex">
                        <div className="p-2 bg-slate-100 dark:bg-slate-900/50 border-b border-slate-300 dark:border-slate-700 rounded-t-md text-sm font-semibold text-slate-600 dark:text-slate-300">Preview</div>
                        <div
                            className="prose dark:prose-invert max-w-none flex-grow p-3 bg-slate-50 dark:bg-slate-700/50 border border-slate-300 dark:border-slate-600 rounded-b-md overflow-auto"
                            dangerouslySetInnerHTML={{ __html: previewContent }}
                        />
                    </div>
                </div>

                {/* Side Panel */}
                <div className={`space-y-6 ${isFullscreen ? 'w-full md:w-80 flex-shrink-0' : 'w-full md:w-1/3'}`}>
                    <div>
                        <label className="block text-sm font-medium text-slate-600 dark:text-slate-300 mb-2">Editor Mode</label>
                        <div className="flex rounded-md shadow-sm">
                             <button type="button" onClick={() => setFormData(p => ({...p, editorMode: 'markdown'}))} className={`relative inline-flex items-center px-4 py-2 rounded-l-md border border-slate-300 dark:border-slate-600 text-sm font-medium ${formData.editorMode === 'markdown' ? 'bg-teal-500 text-white z-10' : 'bg-white dark:bg-slate-700 hover:bg-slate-50 dark:hover:bg-slate-600'}`}>
                                <MarkdownIcon className="w-5 h-5 mr-2" /> Markdown
                             </button>
                             <button type="button" onClick={() => setFormData(p => ({...p, editorMode: 'html'}))} className={`-ml-px relative inline-flex items-center px-4 py-2 rounded-r-md border border-slate-300 dark:border-slate-600 text-sm font-medium ${formData.editorMode === 'html' ? 'bg-teal-500 text-white z-10' : 'bg-white dark:bg-slate-700 hover:bg-slate-50 dark:hover:bg-slate-600'}`}>
                                <CodeBracketIcon className="w-5 h-5 mr-2" /> HTML
                             </button>
                        </div>
                    </div>
                    <div>
                        <label htmlFor="title" className="block text-sm font-medium text-slate-600 dark:text-slate-300 mb-1">Title</label>
                        <input type="text" id="title" name="title" value={formData.title} onChange={handleTitleChange} className="w-full px-3 py-2 bg-slate-100 dark:bg-slate-700 border border-slate-300 dark:border-slate-600 rounded-md focus:ring-2 focus:ring-teal-500 focus:outline-none" required />
                    </div>
                    <div>
                        <label htmlFor="slug" className="block text-sm font-medium text-slate-600 dark:text-slate-300 mb-1">Slug</label>
                        <input type="text" id="slug" name="slug" value={formData.slug} onChange={handleChange} className="w-full px-3 py-2 bg-slate-100 dark:bg-slate-700 border border-slate-300 dark:border-slate-600 rounded-md focus:ring-2 focus:ring-teal-500 focus:outline-none" />
                    </div>
                     <div>
                        <label className="block text-sm font-medium text-slate-600 dark:text-slate-300 mb-1">Featured Image</label>
                        <div className="mt-1 flex justify-center px-6 pt-5 pb-6 border-2 border-slate-300 dark:border-slate-600 border-dashed rounded-md">
                            <div className="space-y-1 text-center">
                                {formData.featuredImageUrl ? (
                                    <div>
                                        <img src={formData.featuredImageUrl} alt="Featured preview" className="mx-auto h-24 w-auto rounded-md" />
                                        <button type="button" onClick={() => setFormData(p => ({...p, featuredImageUrl: ''}))} className="mt-2 text-xs text-red-500 hover:underline">Remove Image</button>
                                    </div>
                                ) : (
                                    <PhotoIcon className="mx-auto h-12 w-12 text-slate-400" />
                                )}
                                <div className="flex text-sm text-slate-600 dark:text-slate-400">
                                    <label htmlFor="featured-image-upload" className="relative cursor-pointer bg-white dark:bg-slate-800 rounded-md font-medium text-teal-600 dark:text-teal-400 hover:text-teal-500 focus-within:outline-none focus-within:ring-2 focus-within:ring-offset-2 focus-within:ring-teal-500">
                                        <span>Upload a file</span>
                                        <input id="featured-image-upload" name="featured-image-upload" type="file" className="sr-only" accept="image/*" onChange={handleFeaturedImageUpload} />
                                    </label>
                                    <p className="pl-1">or drag and drop</p>
                                </div>
                                <p className="text-xs text-slate-500 dark:text-slate-500">PNG, JPG, GIF up to 10MB</p>
                            </div>
                        </div>
                    </div>
                    <div>
                        <label htmlFor="excerpt" className="block text-sm font-medium text-slate-600 dark:text-slate-300 mb-1">Excerpt</label>
                        <textarea id="excerpt" name="excerpt" value={formData.excerpt} onChange={handleChange} rows={4} className="w-full px-3 py-2 bg-slate-100 dark:bg-slate-700 border border-slate-300 dark:border-slate-600 rounded-md focus:ring-2 focus:ring-teal-500 focus:outline-none" />
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
            
             {!isFullscreen && (
                <div className="flex justify-end gap-4 pt-4 border-t border-slate-200 dark:border-slate-700">
                    <button type="button" onClick={onCancel} className="px-4 py-2 bg-slate-200 dark:bg-slate-600 text-slate-800 dark:text-slate-200 font-semibold rounded-md hover:bg-slate-300 dark:hover:bg-slate-500">
                        Cancel
                    </button>
                    <button type="submit" className="px-4 py-2 bg-teal-600 text-white font-semibold rounded-md hover:bg-teal-700">
                        Save Post
                    </button>
                </div>
            )}
        </form>
    );
};

export default BlogPostEditor;