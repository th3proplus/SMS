import React, { useState, useEffect, useCallback, useRef } from 'react';
import type { BlogPost } from '../../types';
import { slugify } from '../../utils/string';
import { SaveIcon } from '../icons/SaveIcon';
import { ChevronDownIcon } from '../icons/ChevronDownIcon';
import { BoldIcon } from '../icons/BoldIcon';
import { ItalicIcon } from '../icons/ItalicIcon';
import { LinkIcon } from '../icons/LinkIcon';
import { QuoteIcon } from '../icons/QuoteIcon';
import { ListUnorderedIcon } from '../icons/ListUnorderedIcon';
import { ListOrderedIcon } from '../icons/ListOrderedIcon';
import { UnderlineIcon } from '../icons/UnderlineIcon';
import { StrikethroughIcon } from '../icons/StrikethroughIcon';
import { XIcon } from '../icons/XIcon';
import { ImageIcon } from '../icons/ImageIcon';
import { TextColorIcon } from '../icons/TextColorIcon';

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

const ToolbarButton: React.FC<{ onClick: () => void, title: string, children: React.ReactNode }> = ({ onClick, title, children }) => (
    <button type="button" onClick={onClick} title={title} className="p-2 rounded-md hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300">
        {children}
    </button>
);

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
            content: '<p>Start writing your masterpiece...</p>',
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
    const editorRef = useRef<HTMLDivElement>(null);
    const imageContentUploadRef = useRef<HTMLInputElement>(null);

    useEffect(() => {
        setFormData(getInitialState());
        setIsSlugManuallyEdited(!!post?.slug);
        if (editorRef.current) {
            editorRef.current.innerHTML = getInitialState().content;
        }
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

    const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;
    
        if (file.size > 2 * 1024 * 1024) { // 2MB limit
            alert("File is too large. Please upload an image under 2MB.");
            return;
        }
    
        const reader = new FileReader();
        reader.onload = () => {
            const result = reader.result as string;
            setFormData(prev => ({
                ...prev,
                featuredImageUrl: result
            }));
        };
        reader.onerror = (error) => {
            console.error("Error reading file:", error);
            alert("There was an error uploading the image.");
        };
        reader.readAsDataURL(file);
    
        e.target.value = '';
    };

    const handleEditorInput = (e: React.FormEvent<HTMLDivElement>) => {
        setFormData(prev => ({ ...prev, content: e.currentTarget.innerHTML }));
    };

    const executeCommand = (command: string, value?: string) => {
        document.execCommand(command, false, value);
        editorRef.current?.focus();
    };
    
    const handleLink = () => {
        const url = prompt("Enter the URL:");
        if (url) {
            executeCommand('createLink', url);
        }
    };
    
    const handleImageContentUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;
        
        if (file.size > 2 * 1024 * 1024) { // 2MB limit
            alert("File is too large. Please upload an image under 2MB.");
            return;
        }
        
        const reader = new FileReader();
        reader.onload = () => {
            const result = reader.result as string;
            const imgHtml = `<img src="${result}" alt="Uploaded image" style="max-width: 100%; height: auto; border-radius: 8px;" />`;
            executeCommand('insertHTML', imgHtml);
        };
        reader.readAsDataURL(file);
        e.target.value = ''; // Reset file input
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

                    <div className="flex items-center gap-1 flex-wrap p-2 bg-slate-100 dark:bg-slate-900 rounded-md border border-slate-200 dark:border-slate-700">
                         <ToolbarButton onClick={() => executeCommand('formatBlock', '<h2>')} title="Heading 2"><span className="font-bold text-sm">H2</span></ToolbarButton>
                         <ToolbarButton onClick={() => executeCommand('formatBlock', '<h3>')} title="Heading 3"><span className="font-bold text-sm">H3</span></ToolbarButton>
                         <div className="w-px h-5 bg-slate-300 dark:bg-slate-600 mx-1"></div>
                         <ToolbarButton onClick={() => executeCommand('bold')} title="Bold"><BoldIcon className="w-5 h-5" /></ToolbarButton>
                         <ToolbarButton onClick={() => executeCommand('italic')} title="Italic"><ItalicIcon className="w-5 h-5" /></ToolbarButton>
                         <ToolbarButton onClick={() => executeCommand('underline')} title="Underline"><UnderlineIcon className="w-5 h-5" /></ToolbarButton>
                         <ToolbarButton onClick={() => executeCommand('strikeThrough')} title="Strikethrough"><StrikethroughIcon className="w-5 h-5" /></ToolbarButton>
                         <div className="w-px h-5 bg-slate-300 dark:bg-slate-600 mx-1"></div>
                         <select
                            onChange={(e) => {
                                if (e.target.value) {
                                    executeCommand('fontSize', e.target.value);
                                    e.target.selectedIndex = 0; // Reset dropdown
                                }
                            }}
                            defaultValue=""
                            className="bg-transparent text-sm p-2 rounded-md hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300 focus:outline-none cursor-pointer"
                            title="Font Size"
                        >
                            <option value="" disabled>Size</option>
                            <option value="5">Large</option>
                            <option value="3">Normal</option>
                            <option value="2">Small</option>
                        </select>
                         <div className="relative p-2 rounded-md hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300 cursor-pointer" title="Text Color">
                            <TextColorIcon className="w-5 h-5" />
                            <input
                                type="color"
                                onChange={(e) => executeCommand('foreColor', e.target.value)}
                                className="absolute top-0 left-0 w-full h-full opacity-0 cursor-pointer"
                            />
                        </div>
                         <div className="w-px h-5 bg-slate-300 dark:bg-slate-600 mx-1"></div>
                         <ToolbarButton onClick={handleLink} title="Link"><LinkIcon className="w-5 h-5" /></ToolbarButton>
                         <ToolbarButton onClick={() => executeCommand('formatBlock', '<blockquote>')} title="Blockquote"><QuoteIcon className="w-5 h-5" /></ToolbarButton>
                         <ToolbarButton onClick={() => executeCommand('insertUnorderedList')} title="Unordered List"><ListUnorderedIcon className="w-5 h-5" /></ToolbarButton>
                         <ToolbarButton onClick={() => executeCommand('insertOrderedList')} title="Ordered List"><ListOrderedIcon className="w-5 h-5" /></ToolbarButton>
                         <div className="w-px h-5 bg-slate-300 dark:bg-slate-600 mx-1"></div>
                        <ToolbarButton onClick={() => imageContentUploadRef.current?.click()} title="Upload Image">
                             <ImageIcon className="w-5 h-5" />
                        </ToolbarButton>
                        <input
                            type="file"
                            ref={imageContentUploadRef}
                            accept="image/png, image/jpeg, image/gif, image/webp"
                            className="sr-only"
                            onChange={handleImageContentUpload}
                        />

                    </div>

                    <div
                        ref={editorRef}
                        contentEditable={true}
                        onInput={handleEditorInput}
                        className="w-full h-[60vh] min-h-[500px] resize-none p-4 bg-white dark:bg-slate-900/50 border border-slate-200 dark:border-slate-700 rounded-md focus:ring-2 focus:ring-teal-500 focus:outline-none overflow-y-auto prose dark:prose-invert max-w-none"
                    />

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
                        <div className="space-y-4">
                            {formData.featuredImageUrl && (
                                <div className="relative group">
                                    <img 
                                        src={formData.featuredImageUrl} 
                                        alt="Preview" 
                                        className="w-full h-auto rounded-md border border-slate-200 dark:border-slate-700" 
                                    />
                                    <button
                                        type="button"
                                        onClick={() => setFormData(prev => ({ ...prev, featuredImageUrl: '' }))}
                                        className="absolute top-2 right-2 p-1.5 bg-black/50 text-white rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
                                        title="Remove Image"
                                    >
                                        <XIcon className="w-4 h-4" />
                                    </button>
                                </div>
                            )}
                            
                            <div className="space-y-2">
                                <label 
                                    htmlFor="imageUpload"
                                    className="cursor-pointer w-full flex flex-col items-center justify-center p-6 border-2 border-dashed border-slate-300 dark:border-slate-600 rounded-md hover:border-teal-500 dark:hover:border-teal-400 transition-colors text-center"
                                >
                                    <svg xmlns="http://www.w3.org/2000/svg" className="w-10 h-10 text-slate-400 dark:text-slate-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1}>
                                      <path strokeLinecap="round" strokeLinejoin="round" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                                    </svg>
                                    <span className="mt-2 text-sm font-semibold text-slate-700 dark:text-slate-200">
                                        Click to upload an image
                                    </span>
                                    <span className="text-xs text-slate-500 dark:text-slate-400">
                                        PNG, JPG, GIF up to 2MB
                                    </span>
                                </label>
                                <input
                                    id="imageUpload"
                                    type="file"
                                    accept="image/png, image/jpeg, image/gif, image/webp"
                                    className="sr-only"
                                    onChange={handleImageUpload}
                                />
                            </div>

                            <div className="flex items-center gap-2">
                                <div className="flex-grow border-t border-slate-300 dark:border-slate-600"></div>
                                <span className="text-xs text-slate-500">OR</span>
                                <div className="flex-grow border-t border-slate-300 dark:border-slate-600"></div>
                            </div>

                            <div className="space-y-2">
                                <label htmlFor="featuredImageUrl" className="block text-sm font-medium text-slate-600 dark:text-slate-300">Paste an image URL</label>
                                <input 
                                    type="url" 
                                    id="featuredImageUrl" 
                                    name="featuredImageUrl" 
                                    value={formData.featuredImageUrl || ''} 
                                    onChange={handleChange} 
                                    className="w-full px-3 py-2 bg-slate-100 dark:bg-slate-700 border border-slate-300 dark:border-slate-600 rounded-md focus:ring-2 focus:ring-teal-500 focus:outline-none" 
                                    placeholder="https://..."
                                />
                            </div>
                            <p className="text-xs text-slate-500 dark:text-slate-400">Note: Uploaded images are stored in your browser's local storage and can increase the size of your site's data.</p>
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