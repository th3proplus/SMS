import React, { useState, useEffect, useCallback, useRef } from 'react';
import type { CustomPage } from '../../types';
import { slugify } from '../../utils/string';
import { SaveIcon } from '../icons/SaveIcon';
import { ChevronDownIcon } from '../icons/ChevronDownIcon';
import { BoldIcon } from '../icons/BoldIcon';
import { ItalicIcon } from '../icons/ItalicIcon';
import { LinkIcon } from '../icons/LinkIcon';
import { QuoteIcon } from '../icons/QuoteIcon';
import { ListUnorderedIcon } from '../icons/ListUnorderedIcon';
import { ImageIcon } from '../icons/ImageIcon';
import { UnderlineIcon } from '../icons/UnderlineIcon';
import { StrikethroughIcon } from '../icons/StrikethroughIcon';
import { ListOrderedIcon } from '../icons/ListOrderedIcon';
import { TextColorIcon } from '../icons/TextColorIcon';
import { parseMarkdown } from '../../utils/markdown';

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
            <p className="text-sm text-blue-800 dark:text-blue-400 truncate group-hover:underline">{title || "Your Page Title Will Appear Here"}</p>
            <p className="text-xs text-green-700 dark:text-green-500">{`${siteUrl}/#${`/pages/${slug || 'your-page-slug'}`}`}</p>
            <p className="text-xs text-slate-600 dark:text-slate-400 mt-1 line-clamp-2">{description || "Your meta description will appear here. Keep it concise and engaging to attract readers."}</p>
        </div>
    );
};

const ToolbarButton: React.FC<{ onMouseDown: (e: React.MouseEvent) => void, title: string, children: React.ReactNode, isActive?: boolean }> = ({ onMouseDown, title, children, isActive = false }) => (
    <button type="button" onMouseDown={onMouseDown} title={title} className={`p-2 rounded-md transition-colors ${isActive ? 'bg-teal-200 dark:bg-teal-500/30 text-teal-700 dark:text-teal-300' : 'hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300'}`}>
        {children}
    </button>
);

interface CustomPageEditorProps {
    page: CustomPage | null;
    onSave: (page: CustomPage) => void;
    onCancel: () => void;
}

const isHtml = (str: string | null | undefined): str is string => !!str && /<[a-z][\s\S]*>/i.test(str);

const createInitialState = (page: CustomPage | null): CustomPage => {
    const EMPTY_CONTENT = '<p>Start writing your page content here...</p>';

    if (page) {
        let contentHtml = page.content || EMPTY_CONTENT;
        if (!isHtml(contentHtml)) {
            contentHtml = parseMarkdown(contentHtml) || EMPTY_CONTENT;
        }
        return { ...page, content: contentHtml };
    }

    const now = new Date();
    return {
        id: Date.now().toString(),
        title: '',
        slug: '',
        content: EMPTY_CONTENT,
        isPublished: false,
        createdAt: now,
        updatedAt: now,
        metaTitle: '',
        metaDescription: '',
    };
};


const CustomPageEditor: React.FC<CustomPageEditorProps> = ({ page, onSave, onCancel }) => {
    const [formData, setFormData] = useState<CustomPage>(() => createInitialState(page));
    const [editorMode, setEditorMode] = useState<'visual' | 'html'>('visual');
    const [isSlugManuallyEdited, setIsSlugManuallyEdited] = useState(!!page?.slug);
    const editorRef = useRef<HTMLDivElement>(null);
    const imageContentUploadRef = useRef<HTMLInputElement>(null);
    const savedRange = useRef<Range | null>(null);
    const [activeFormats, setActiveFormats] = useState({
        bold: false,
        italic: false,
        underline: false,
        strikeThrough: false,
        ul: false,
        ol: false,
        blockquote: false,
        link: false,
        blockType: 'p',
    });
    const isInitialMount = useRef(true);

    const getBlockParent = useCallback((node: Node | null): HTMLElement | null => {
        if (!editorRef.current || !node) return null;
        let currentNode = node.nodeType === Node.TEXT_NODE ? node.parentElement : node as HTMLElement;
        while (currentNode && currentNode !== editorRef.current) {
            const tagName = currentNode.tagName.toLowerCase();
            if (['p', 'h2', 'h3', 'blockquote', 'li', 'div'].includes(tagName)) {
                if (tagName === 'div') return currentNode;
                return currentNode;
            }
            currentNode = currentNode.parentElement;
        }
        return null;
    }, []);

    const updateToolbarState = useCallback(() => {
        if (!editorRef.current) return;
        const selection = window.getSelection();
        if (!selection || selection.rangeCount === 0 || !selection.anchorNode || !editorRef.current.contains(selection.anchorNode)) {
            return;
        }

        let isLink = false;
        let node = selection.anchorNode;
        if (node.nodeType !== Node.ELEMENT_NODE) node = node.parentNode!;
        if (node && (node as HTMLElement).closest('a')) isLink = true;

        const blockParent = getBlockParent(selection.anchorNode);
        const blockType = blockParent ? blockParent.tagName.toLowerCase() : 'p';
        
        setActiveFormats({
            bold: document.queryCommandState('bold'),
            italic: document.queryCommandState('italic'),
            underline: document.queryCommandState('underline'),
            strikeThrough: document.queryCommandState('strikeThrough'),
            ul: document.queryCommandState('insertUnorderedList'),
            ol: document.queryCommandState('insertOrderedList'),
            blockquote: blockType === 'blockquote',
            blockType: blockType,
            link: isLink,
        });
    }, [getBlockParent]);

    const saveSelection = useCallback(() => {
        const selection = window.getSelection();
        if (selection && selection.rangeCount > 0) {
            savedRange.current = selection.getRangeAt(0);
        }
    }, []);

    const restoreSelection = useCallback(() => {
        if (savedRange.current) {
            const selection = window.getSelection();
            selection?.removeAllRanges();
            selection?.addRange(savedRange.current);
        } else if (editorRef.current) {
            editorRef.current.focus({ preventScroll: true });
            const range = document.createRange();
            range.selectNodeContents(editorRef.current);
            range.collapse(false);
            const selection = window.getSelection();
            selection?.removeAllRanges();
            selection?.addRange(range);
        }
    }, []);
    
    const executeCommandWithFocus = useCallback((command: () => void) => {
        if (!editorRef.current) return;
        restoreSelection();
        command();
        saveSelection();
        editorRef.current.focus();
        setTimeout(updateToolbarState, 0);
    }, [restoreSelection, saveSelection, updateToolbarState]);

     useEffect(() => {
        const editor = editorRef.current;
        if (!editor || editorMode !== 'visual') return;

        const updateAndSaveSelection = () => {
            updateToolbarState();
            saveSelection();
        };

        editor.addEventListener('keyup', updateAndSaveSelection);
        editor.addEventListener('mouseup', updateAndSaveSelection);
        editor.addEventListener('focus', restoreSelection);
        document.addEventListener('selectionchange', updateToolbarState);
        
        restoreSelection();
        updateToolbarState();
        
        return () => {
            editor.removeEventListener('keyup', updateAndSaveSelection);
            editor.removeEventListener('mouseup', updateAndSaveSelection);
            editor.removeEventListener('focus', restoreSelection);
            document.removeEventListener('selectionchange', updateToolbarState);
        };
    }, [saveSelection, restoreSelection, updateToolbarState, editorMode]);

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
    
    const handleEditorContentBlur = () => {
        if (editorRef.current) {
            const currentContent = editorRef.current.innerHTML;
            if (formData.content !== currentContent) {
                setFormData(prev => ({ ...prev, content: currentContent }));
            }
        }
    };

    const handleHtmlContentChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
        setFormData(prev => ({ ...prev, content: e.target.value }));
    };

    const handleModeSwitch = (newMode: 'visual' | 'html') => {
        if (editorMode === newMode) return;
    
        if (editorMode === 'visual' && editorRef.current) {
            const currentContent = editorRef.current.innerHTML;
            setFormData(prev => ({ ...prev, content: currentContent }));
        }
        
        setEditorMode(newMode);
    };

     useEffect(() => {
        if (editorRef.current) {
            if (isInitialMount.current) {
                editorRef.current.innerHTML = formData.content;
                isInitialMount.current = false;
            } else if (editorMode === 'visual' && editorRef.current.innerHTML !== formData.content) {
                editorRef.current.innerHTML = formData.content;
            }
        }
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [editorMode]);

    const handleBlockFormat = (e: React.MouseEvent, tag: 'p' | 'h2' | 'h3' | 'blockquote') => {
        e.preventDefault();
        executeCommandWithFocus(() => {
            const blockParent = getBlockParent(window.getSelection()?.anchorNode ?? null);
            const currentTag = blockParent ? blockParent.tagName.toLowerCase() : 'p';
            if (currentTag === tag) {
                document.execCommand('formatBlock', false, 'p');
            } else {
                document.execCommand('formatBlock', false, `<${tag}>`);
            }
        });
    };

    const handleInlineFormat = (e: React.MouseEvent, command: string) => {
        e.preventDefault();
        executeCommandWithFocus(() => document.execCommand(command));
    };

    const handleListFormat = (e: React.MouseEvent, command: 'insertUnorderedList' | 'insertOrderedList') => {
        e.preventDefault();
        executeCommandWithFocus(() => document.execCommand(command));
    };

    const handleLink = (e: React.MouseEvent) => {
        e.preventDefault();
        executeCommandWithFocus(() => {
             if (activeFormats.link) {
                 document.execCommand('unlink');
             } else {
                 const url = prompt("Enter the URL:");
                 if (url) {
                     document.execCommand('createLink', false, url);
                 }
             }
        });
    };
    
    const handleValueChange = (e: React.ChangeEvent<HTMLSelectElement> | React.FormEvent<HTMLInputElement>, command: 'fontSize' | 'foreColor') => {
        const value = (e.target as HTMLInputElement).value;
        executeCommandWithFocus(() => document.execCommand(command, false, value));
    };
    
    const handleImageContentUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;
        if (file.size > 2 * 1024 * 1024) {
            alert("File is too large. Please upload an image under 2MB.");
            return;
        }
        const reader = new FileReader();
        reader.onload = () => {
            const result = reader.result as string;
            const imgHtml = `<img src="${result}" alt="Uploaded image" style="max-width: 100%; height: auto; border-radius: 8px;" />`;
            executeCommandWithFocus(() => document.execCommand('insertHTML', false, imgHtml));
        };
        reader.readAsDataURL(file);
        e.target.value = '';
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        let finalContent = formData.content;
        if (editorMode === 'visual' && editorRef.current) {
            finalContent = editorRef.current.innerHTML;
        }
        onSave({
            ...formData,
            content: finalContent,
            updatedAt: new Date(),
        });
    };

    return (
        <form onSubmit={handleSubmit} className="bg-white dark:bg-slate-800 p-6 rounded-lg shadow-md space-y-6">
            <div className="flex justify-between items-center">
                 <h2 className="text-xl font-bold text-slate-800 dark:text-slate-200">
                    {page ? 'Edit Page' : 'Create New Page'}
                </h2>
                <div className="flex items-center gap-4">
                    <button type="button" onClick={onCancel} className="px-4 py-2 bg-slate-200 dark:bg-slate-600 text-slate-800 dark:text-slate-200 font-semibold rounded-md hover:bg-slate-300 dark:hover:bg-slate-500">
                        Cancel
                    </button>
                    <button type="submit" className="flex items-center gap-2 px-4 py-2 bg-teal-600 text-white font-semibold rounded-md hover:bg-teal-700">
                        <SaveIcon className="w-5 h-5" />
                        Save Page
                    </button>
                </div>
            </div>
            
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <div className="lg:col-span-2 space-y-4">
                    <div>
                        <input type="text" id="title" name="title" value={formData.title} onChange={handleChange} required className="w-full px-3 py-2 bg-slate-100 dark:bg-slate-700 border-2 border-transparent focus:border-teal-500 rounded-md focus:ring-0 focus:outline-none text-2xl font-extrabold" placeholder="Page Title" />
                    </div>

                    <div className="flex items-center border-b border-slate-200 dark:border-slate-700">
                        <button type="button" onClick={() => handleModeSwitch('visual')} className={`px-4 py-2 text-sm font-semibold rounded-t-md ${editorMode === 'visual' ? 'border-b-2 border-teal-500 text-teal-600 dark:text-teal-400' : 'text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-700'}`}>
                            Visual
                        </button>
                        <button type="button" onClick={() => handleModeSwitch('html')} className={`px-4 py-2 text-sm font-semibold rounded-t-md ${editorMode === 'html' ? 'border-b-2 border-teal-500 text-teal-600 dark:text-teal-400' : 'text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-700'}`}>
                            HTML
                        </button>
                    </div>

                    {editorMode === 'visual' && (
                        <div className="flex items-center gap-1 flex-wrap p-2 bg-slate-100 dark:bg-slate-900 rounded-md border border-slate-200 dark:border-slate-700">
                            <ToolbarButton onMouseDown={(e) => handleBlockFormat(e, 'p')} title="Paragraph" isActive={activeFormats.blockType === 'p'}><span className="font-bold text-sm">P</span></ToolbarButton>
                            <ToolbarButton onMouseDown={(e) => handleBlockFormat(e, 'h2')} title="Heading 2" isActive={activeFormats.blockType === 'h2'}><span className="font-bold text-sm">H2</span></ToolbarButton>
                            <ToolbarButton onMouseDown={(e) => handleBlockFormat(e, 'h3')} title="Heading 3" isActive={activeFormats.blockType === 'h3'}><span className="font-bold text-sm">H3</span></ToolbarButton>
                            <div className="w-px h-5 bg-slate-300 dark:bg-slate-600 mx-1"></div>
                            <ToolbarButton onMouseDown={(e) => handleInlineFormat(e, 'bold')} title="Bold" isActive={activeFormats.bold}><BoldIcon className="w-5 h-5" /></ToolbarButton>
                            <ToolbarButton onMouseDown={(e) => handleInlineFormat(e, 'italic')} title="Italic" isActive={activeFormats.italic}><ItalicIcon className="w-5 h-5" /></ToolbarButton>
                            <ToolbarButton onMouseDown={(e) => handleInlineFormat(e, 'underline')} title="Underline" isActive={activeFormats.underline}><UnderlineIcon className="w-5 h-5" /></ToolbarButton>
                            <ToolbarButton onMouseDown={(e) => handleInlineFormat(e, 'strikeThrough')} title="Strikethrough" isActive={activeFormats.strikeThrough}><StrikethroughIcon className="w-5 h-5" /></ToolbarButton>
                            <div className="w-px h-5 bg-slate-300 dark:bg-slate-600 mx-1"></div>
                            <div className="flex items-center p-1 rounded-md hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300">
                                <label htmlFor="foreColor" className="cursor-pointer p-1" title="Text Color"><TextColorIcon className="w-5 h-5" /></label>
                                <input type="color" id="foreColor" className="w-6 h-6 border-none bg-transparent cursor-pointer" style={{padding:0}} onInput={(e) => handleValueChange(e as React.FormEvent<HTMLInputElement>, 'foreColor')} />
                            </div>
                            <select 
                                onChange={(e) => handleValueChange(e, 'fontSize')} 
                                className="bg-transparent border-none text-sm font-medium text-slate-600 dark:text-slate-300 focus:ring-0 focus:outline-none p-2 rounded-md hover:bg-slate-200 dark:hover:bg-slate-700"
                                title="Font Size"
                            >
                                <option value="3">Small</option>
                                <option value="4" selected>Normal</option>
                                <option value="5">Large</option>
                                <option value="6">XL</option>
                                <option value="7">Huge</option>
                            </select>
                            <div className="w-px h-5 bg-slate-300 dark:bg-slate-600 mx-1"></div>
                            <ToolbarButton onMouseDown={handleLink} title="Link" isActive={activeFormats.link}><LinkIcon className="w-5 h-5" /></ToolbarButton>
                            <ToolbarButton onMouseDown={(e) => handleBlockFormat(e, 'blockquote')} title="Blockquote" isActive={activeFormats.blockquote}><QuoteIcon className="w-5 h-5" /></ToolbarButton>
                            <ToolbarButton onMouseDown={(e) => handleListFormat(e, 'insertUnorderedList')} title="Bulleted List" isActive={activeFormats.ul}><ListUnorderedIcon className="w-5 h-5" /></ToolbarButton>
                            <ToolbarButton onMouseDown={(e) => handleListFormat(e, 'insertOrderedList')} title="Numbered List" isActive={activeFormats.ol}><ListOrderedIcon className="w-5 h-5" /></ToolbarButton>
                            <div className="w-px h-5 bg-slate-300 dark:bg-slate-600 mx-1"></div>
                            <ToolbarButton onMouseDown={(e) => { e.preventDefault(); imageContentUploadRef.current?.click(); }} title="Upload Image">
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
                    )}

                    <div className="w-full h-[60vh] min-h-[500px]">
                         {editorMode === 'visual' ? (
                            <div
                                ref={editorRef}
                                contentEditable={true}
                                onBlur={handleEditorContentBlur}
                                className="w-full h-full p-4 bg-white dark:bg-slate-900/50 border border-slate-200 dark:border-slate-700 rounded-md focus:ring-2 focus:ring-teal-500 focus:outline-none overflow-y-auto prose dark:prose-invert max-w-none"
                            />
                         ) : (
                            <textarea
                                value={formData.content}
                                onChange={handleHtmlContentChange}
                                className="w-full h-full resize-y p-4 bg-slate-900 text-slate-300 font-mono text-sm border border-slate-700 rounded-md focus:ring-2 focus:ring-teal-500 focus:outline-none"
                                placeholder="Enter your HTML content here..."
                                spellCheck="false"
                            />
                         )}
                    </div>
                </div>

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
                                <label htmlFor="slug" className="block text-sm font-medium text-slate-600 dark:text-slate-300 mb-1">URL Slug</label>
                                <input type="text" id="slug" name="slug" value={formData.slug} onChange={handleChange} required className="w-full px-3 py-2 bg-slate-100 dark:bg-slate-700 border border-slate-300 dark:border-slate-600 rounded-md focus:ring-2 focus:ring-teal-500 focus:outline-none font-mono text-sm" />
                            </div>
                         </div>
                     </Accordion>

                     <Accordion title="SEO & Social">
                         <div className="space-y-4">
                             <div>
                                <label htmlFor="metaTitle" className="block text-sm font-medium text-slate-600 dark:text-slate-300 mb-1">Meta Title</label>
                                <input type="text" id="metaTitle" name="metaTitle" value={formData.metaTitle} onChange={handleChange} className="w-full px-3 py-2 bg-slate-100 dark:bg-slate-700 border border-slate-300 dark:border-slate-600 rounded-md focus:ring-2 focus:ring-teal-500 focus:outline-none" placeholder="Defaults to page title" />
                                <p className="text-xs text-slate-500 mt-1 text-right">{formData.metaTitle?.length || 0} / 60</p>
                            </div>
                            <div>
                                <label htmlFor="metaDescription" className="block text-sm font-medium text-slate-600 dark:text-slate-300 mb-1">Meta Description</label>
                                <textarea id="metaDescription" name="metaDescription" value={formData.metaDescription} onChange={handleChange} rows={3} className="w-full px-3 py-2 bg-slate-100 dark:bg-slate-700 border border-slate-300 dark:border-slate-600 rounded-md focus:ring-2 focus:ring-teal-500 focus:outline-none" />
                                <p className="text-xs text-slate-500 mt-1 text-right">{formData.metaDescription?.length || 0} / 160</p>
                            </div>
                             <h4 className="text-sm font-semibold text-slate-600 dark:text-slate-300 pt-2 border-t border-slate-200 dark:border-slate-700">Search Result Preview</h4>
                             <SERPPreview title={formData.metaTitle || formData.title} description={formData.metaDescription || ''} slug={formData.slug} />
                         </div>
                     </Accordion>
                </div>
            </div>
        </form>
    );
};

export default CustomPageEditor;