import React, { useState } from 'react';
import { getSettings, saveSettings } from '../../services/settingsService';
import type { CustomPage, Settings } from '../../types';
import CustomPageEditor from './CustomPageEditor';
import { PlusIcon } from '../icons/PlusIcon';
import { PencilIcon } from '../icons/PencilIcon';
import { TrashIcon } from '../icons/TrashIcon';
import { timeAgo } from '../../utils/time';

const CustomPageManagementPanel: React.FC = () => {
    const [settings, setSettings] = useState<Settings>(getSettings());
    const [view, setView] = useState<'list' | 'editor'>('list');
    const [currentPage, setCurrentPage] = useState<CustomPage | null>(null);

    const handleCreateNew = () => {
        setCurrentPage(null);
        setView('editor');
    };

    const handleEdit = (page: CustomPage) => {
        setCurrentPage(page);
        setView('editor');
    };

    const handleDelete = (pageId: string) => {
        if (window.confirm('Are you sure you want to delete this page? This action cannot be undone.')) {
            const updatedPages = settings.customPages.filter(p => p.id !== pageId);
            saveSettings({ ...settings, customPages: updatedPages });
            setSettings(prev => ({ ...prev, customPages: updatedPages }));
        }
    };

    const handleSave = (pageToSave: CustomPage) => {
        let updatedPages: CustomPage[];
        const isEditing = !!currentPage;

        if (isEditing) {
            updatedPages = settings.customPages.map(p => p.id === pageToSave.id ? pageToSave : p);
        } else {
            updatedPages = [...settings.customPages, pageToSave];
        }

        const newSettings = { ...settings, customPages: updatedPages };
        saveSettings(newSettings);
        setSettings(newSettings);
        setView('list');
        setCurrentPage(null);
    };

    const handleCancel = () => {
        setView('list');
        setCurrentPage(null);
    };

    const sortedPages = [...(settings.customPages || [])].sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime());

    if (view === 'editor') {
        return <CustomPageEditor key={currentPage?.id || 'new'} page={currentPage} onSave={handleSave} onCancel={handleCancel} />;
    }

    return (
        <div className="bg-white dark:bg-slate-800 p-6 rounded-lg shadow-md">
            <div className="flex justify-between items-center border-b border-slate-200 dark:border-slate-700 pb-2 mb-4">
                <h2 className="text-lg font-semibold text-slate-800 dark:text-slate-200">Custom Pages</h2>
                <button
                    onClick={handleCreateNew}
                    className="flex items-center gap-2 px-4 py-2 bg-teal-600 text-white font-semibold rounded-md hover:bg-teal-700 transition-colors"
                >
                    <PlusIcon className="w-5 h-5" />
                    Create New Page
                </button>
            </div>
            
            <div className="space-y-3">
                {sortedPages.length > 0 ? sortedPages.map(page => (
                    <div key={page.id} className="p-3 bg-slate-100 dark:bg-slate-700/50 rounded-md flex flex-col sm:flex-row justify-between items-start sm:items-center">
                        <div className="flex-grow">
                            <div className="flex items-center gap-3">
                                <span className={`px-2 py-0.5 text-xs font-bold rounded-full ${page.isPublished ? 'bg-green-100 text-green-800 dark:bg-green-900/50 dark:text-green-300' : 'bg-slate-200 text-slate-600 dark:bg-slate-600 dark:text-slate-300'}`}>
                                    {page.isPublished ? 'Published' : 'Draft'}
                                </span>
                                <p className="font-semibold text-slate-800 dark:text-slate-200">{page.title}</p>
                            </div>
                            <div className="text-sm text-slate-500 dark:text-slate-400 ml-3 mt-1 flex items-center gap-4">
                               <p className="font-mono text-xs">/pages/{page.slug}</p>
                               <span>&bull;</span>
                               <p>Last updated {timeAgo(page.updatedAt)}</p>
                            </div>
                        </div>
                        <div className="mt-2 sm:mt-0 sm:ml-4 flex-shrink-0 flex items-center gap-2 self-end sm:self-center">
                            <a href={`/pages/${page.slug}`} target="_blank" rel="noopener noreferrer" className="px-3 py-1.5 text-sm font-semibold text-teal-600 dark:text-teal-400 hover:underline">
                                View
                            </a>
                            <button onClick={() => handleEdit(page)} className="flex items-center gap-2 px-3 py-1.5 text-sm bg-slate-200 dark:bg-slate-700 hover:bg-slate-300 dark:hover:bg-slate-600 text-slate-700 dark:text-slate-200 font-semibold rounded-md">
                                <PencilIcon className="w-4 h-4" /> Edit
                            </button>
                            <button onClick={() => handleDelete(page.id)} className="flex items-center gap-2 px-3 py-1.5 text-sm bg-red-500/10 hover:bg-red-500/20 text-red-600 dark:text-red-400 font-semibold rounded-md">
                                <TrashIcon className="w-4 h-4" />
                            </button>
                        </div>
                    </div>
                )) : (
                    <p className="text-center text-slate-500 dark:text-slate-400 py-8">
                        No custom pages yet. Click 'Create New Page' to get started!
                    </p>
                )}
            </div>
        </div>
    );
};

export default CustomPageManagementPanel;