import React, { useState, useEffect, useRef, useCallback } from 'react';
import { logout, updateCredentials } from '../services/authService';
import { getSettings, saveSettings } from '../services/settingsService';
import { fetchSettingsFromGist, saveSettingsToGist } from '../services/cloudSyncService';
import { getOwnedNumbers, getWebhookLogs, demoNumbers } from '../services/twilioService';
import { getOwnedNumbers as getSignalWireNumbers } from '../services/signalwireService';
import { navigate } from '../services/navigationService';
import type { Settings, PhoneNumber, FooterLink, WebhookLog } from '../types';
import { AdminIcon } from '../components/icons/AdminIcon';
import { LogoutIcon } from '../components/icons/LogoutIcon';
import { SettingsIcon } from '../components/icons/SettingsIcon';
import { PhoneIcon } from '../components/icons/PhoneIcon';
import { TrashIcon } from '../components/icons/TrashIcon';
import { PlusIcon } from '../components/icons/PlusIcon';
import { EyeIcon } from '../components/icons/EyeIcon';
import { DocumentIcon } from '../components/icons/DocumentIcon';
import { PencilIcon } from '../components/icons/PencilIcon';
import { DollarIcon } from '../components/icons/DollarIcon';
import { ShieldIcon } from '../components/icons/ShieldIcon';
import { RefreshIcon } from '../components/icons/RefreshIcon';
import { SaveIcon } from '../components/icons/SaveIcon';
import { WebhookIcon } from '../components/icons/WebhookIcon';
import { timeAgo } from '../utils/time';
import { CopyIcon } from '../components/icons/CopyIcon';
import { GripVerticalIcon } from '../components/icons/GripVerticalIcon';
import { NewspaperIcon } from '../components/icons/NewspaperIcon';
import BlogManagementPanel from '../components/admin/BlogManagementPanel';
import { DocumentPlusIcon } from '../components/icons/DocumentPlusIcon';
import CustomPageManagementPanel from '../components/admin/CustomPageManagementPanel';
import { UploadIcon } from '../components/icons/UploadIcon';
import { DownloadIcon } from '../components/icons/DownloadIcon';
import { CloudIcon } from '../components/icons/CloudIcon';


interface TabButtonProps {
    icon: React.ReactNode;
    label: string;
    tabName: string;
    activeTab: string;
    setActiveTab: (tabName: string) => void;
}

const TabButton: React.FC<TabButtonProps> = ({ icon, label, tabName, activeTab, setActiveTab }) => {
    const isActive = activeTab === tabName;
    return (
        <button
            onClick={() => setActiveTab(tabName)}
            className={`flex-shrink-0 md:w-full flex items-center justify-center md:justify-start gap-3 p-3 rounded-md md:text-left transition-colors ${
                isActive
                    ? 'bg-teal-500/10 text-teal-600 dark:text-teal-400 font-semibold'
                    : 'text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700'
                }`}
        >
            {icon}
            <span className="font-medium text-sm">{label}</span>
        </button>
    );
};

const SettingsPanel: React.FC = () => {
    const [settings, setSettings] = useState<Settings>(getSettings());
    const [isSaving, setIsSaving] = useState(false);

    const cloudflareWorkerCode = `
addEventListener('fetch', event => {
  event.respondWith(handleRequest(event.request))
})

async function handleRequest(request) {
  // Handle preflight OPTIONS requests for CORS
  if (request.method === 'OPTIONS') {
    return new Response(null, {
      status: 204,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
        'Access-Control-Allow-Headers': 'Authorization, Content-Type',
        'Access-Control-Max-Age': '86400', // Cache preflight for 1 day
      },
    });
  }

  const url = new URL(request.url);
  
  // The request to the worker will be like:
  // https://my-proxy.workers.dev/https://api.twilio.com/2010-04-01/...
  // We need to extract the target URL from the path.
  let apiUrl = url.pathname.substring(1); // Remove leading '/'
  if (url.search) {
      apiUrl += url.search;
  }
  
  // Security: Only allow requests to the Twilio or SignalWire API
  if (!apiUrl.startsWith('https://api.twilio.com/') && !apiUrl.includes('.signalwire.com/')) {
    return new Response('This proxy only forwards requests to approved APIs.', { status: 403 });
  }

  // Create a new request to the target API
  const newRequest = new Request(apiUrl, {
    method: request.method,
    headers: request.headers,
    body: request.body,
    redirect: 'follow'
  });

  try {
    const response = await fetch(newRequest);
    
    // Create a new response with permissive CORS headers
    const newHeaders = new Headers(response.headers);
    newHeaders.set('Access-Control-Allow-Origin', '*');
    newHeaders.set('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');

    return new Response(response.body, {
      status: response.status,
      statusText: response.statusText,
      headers: newHeaders
    });

  } catch (e) {
    return new Response('Error fetching from the target API.', { status: 502 });
  }
}
`.trim();

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
        const { name, value, type } = e.target;
        
        let processedValue: string | number | boolean = value;

        if (type === 'checkbox') {
            processedValue = (e.target as HTMLInputElement).checked;
        } else if (type === 'number') {
            processedValue = parseInt(value, 10);
            if (isNaN(processedValue) || processedValue < 1) {
                processedValue = 1;
            }
        }

        setSettings(prev => ({ ...prev, [name]: processedValue }));
    };

    const handleSave = () => {
        setIsSaving(true);
        saveSettings(settings);
        setTimeout(() => setIsSaving(false), 1000); 
    };
    
    const handleExport = () => {
        const settingsToExport = getSettings();
        const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(settingsToExport, null, 2));
        const downloadAnchorNode = document.createElement('a');
        downloadAnchorNode.setAttribute("href", dataStr);
        downloadAnchorNode.setAttribute("download", "sms-receiver-settings.json");
        document.body.appendChild(downloadAnchorNode); // Required for Firefox
        downloadAnchorNode.click();
        downloadAnchorNode.remove();
    };

    const handleImport = (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        if (!file) return;

        const reader = new FileReader();
        reader.onload = (e) => {
            try {
                const text = e.target?.result;
                if (typeof text !== 'string') {
                    throw new Error("File could not be read.");
                }
                const importedSettings = JSON.parse(text);
                
                // Basic validation
                if (importedSettings && typeof importedSettings.title === 'string' && Array.isArray(importedSettings.publicNumbers)) {
                    if (window.confirm("This will overwrite your current settings. Are you sure you want to continue?")) {
                        saveSettings(importedSettings);
                        // Update local state to reflect changes immediately
                        setSettings(getSettings());
                        alert("Settings imported successfully!");
                    }
                } else {
                    throw new Error("Invalid settings file format.");
                }
            } catch (error: any) {
                alert(`Error importing settings: ${error.message}`);
            } finally {
                // Reset file input so the same file can be loaded again
                event.target.value = '';
            }
        };
        reader.readAsText(file);
    };

    const isTwilioConnected = settings.twilioAccountSid.startsWith('AC') && settings.twilioAuthToken;
    const isSignalWireConnected = settings.signalwireSpaceUrl && settings.signalwireProjectId && settings.signalwireApiToken;

    return (
        <div className="bg-white dark:bg-slate-800 p-6 rounded-lg shadow-md space-y-8">
            <div>
                <h2 className="text-lg font-semibold text-slate-800 dark:text-slate-200 border-b border-slate-200 dark:border-slate-700 pb-2 mb-4">Site Configuration</h2>
                <div className="space-y-4">
                    <div>
                        <label htmlFor="title" className="block text-sm font-medium text-slate-600 dark:text-slate-300 mb-1">Site Title</label>
                        <input type="text" id="title" name="title" value={settings.title} onChange={handleChange} className="w-full px-3 py-2 bg-slate-100 dark:bg-slate-700 border border-slate-300 dark:border-slate-600 rounded-md focus:ring-2 focus:ring-teal-500 focus:outline-none" />
                    </div>
                    <div>
                        <label htmlFor="description" className="block text-sm font-medium text-slate-600 dark:text-slate-300 mb-1">Site Description</label>
                        <textarea id="description" name="description" value={settings.description} onChange={handleChange} rows={3} className="w-full px-3 py-2 bg-slate-100 dark:bg-slate-700 border border-slate-300 dark:border-slate-600 rounded-md focus:ring-2 focus:ring-teal-500 focus:outline-none" />
                    </div>
                     <div>
                        <label htmlFor="headCode" className="block text-sm font-medium text-slate-600 dark:text-slate-300 mb-1">Custom Head Code</label>
                        <textarea id="headCode" name="headCode" value={settings.headCode} onChange={handleChange} rows={6} className="w-full font-mono text-xs px-3 py-2 bg-slate-100 dark:bg-slate-700 border border-slate-300 dark:border-slate-600 rounded-md focus:ring-2 focus:ring-teal-500 focus:outline-none" placeholder="<script>...</script> or <meta ...>" />
                        <p className="text-xs text-slate-500 mt-1">Code entered here will be injected into the site's &lt;head&gt; tag. Use for analytics, AdSense script, etc.</p>
                    </div>
                </div>
            </div>

            <div>
                 <h2 className="text-lg font-semibold text-slate-800 dark:text-slate-200 border-b border-slate-200 dark:border-slate-700 pb-2 mb-4">Twilio Configuration</h2>
                 <div className="p-4 mb-4 text-sm rounded-lg bg-yellow-100 dark:bg-yellow-900/30 text-yellow-800 dark:text-yellow-300 border border-yellow-200 dark:border-yellow-800/50" role="alert">
                    <span className="font-bold">Security Warning:</span> Storing API keys on the client-side is highly insecure and can lead to account takeover. This is for demonstration purposes only. In a production environment, all API calls must be made from a secure backend server.
                </div>
                 <div className="space-y-4">
                    <div>
                        <label htmlFor="twilioAccountSid" className="block text-sm font-medium text-slate-600 dark:text-slate-300 mb-1">Account SID</label>
                        <input type="text" id="twilioAccountSid" name="twilioAccountSid" value={settings.twilioAccountSid} onChange={handleChange} className="w-full px-3 py-2 bg-slate-100 dark:bg-slate-700 border border-slate-300 dark:border-slate-600 rounded-md focus:ring-2 focus:ring-teal-500 focus:outline-none font-mono" />
                    </div>
                    <div>
                        <label htmlFor="twilioAuthToken" className="block text-sm font-medium text-slate-600 dark:text-slate-300 mb-1">Auth Token</label>
                        <input type="password" id="twilioAuthToken" name="twilioAuthToken" value={settings.twilioAuthToken} onChange={handleChange} placeholder="Enter token to change or set" className="w-full px-3 py-2 bg-slate-100 dark:bg-slate-700 border border-slate-300 dark:border-slate-600 rounded-md focus:ring-2 focus:ring-teal-500 focus:outline-none font-mono" />
                    </div>
                     <p className="text-sm text-slate-600 dark:text-slate-300">
                        <strong>Status:</strong> 
                        <span className={`ml-2 font-bold ${isTwilioConnected ? 'text-green-500' : 'text-red-500'}`}>
                            {isTwilioConnected ? 'Connected' : 'Disconnected'}
                        </span>
                    </p>
                 </div>
            </div>

            <div>
                 <h2 className="text-lg font-semibold text-slate-800 dark:text-slate-200 border-b border-slate-200 dark:border-slate-700 pb-2 mb-4">SignalWire Configuration</h2>
                 <div className="space-y-4">
                    <div>
                        <label htmlFor="signalwireSpaceUrl" className="block text-sm font-medium text-slate-600 dark:text-slate-300 mb-1">Space URL</label>
                        <input type="text" id="signalwireSpaceUrl" name="signalwireSpaceUrl" value={settings.signalwireSpaceUrl} onChange={handleChange} className="w-full px-3 py-2 bg-slate-100 dark:bg-slate-700 border border-slate-300 dark:border-slate-600 rounded-md focus:ring-2 focus:ring-teal-500 focus:outline-none font-mono" placeholder="your-space.signalwire.com" />
                    </div>
                    <div>
                        <label htmlFor="signalwireProjectId" className="block text-sm font-medium text-slate-600 dark:text-slate-300 mb-1">Project ID</label>
                        <input type="text" id="signalwireProjectId" name="signalwireProjectId" value={settings.signalwireProjectId} onChange={handleChange} className="w-full px-3 py-2 bg-slate-100 dark:bg-slate-700 border border-slate-300 dark:border-slate-600 rounded-md focus:ring-2 focus:ring-teal-500 focus:outline-none font-mono" placeholder="xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx" />
                    </div>
                    <div>
                        <label htmlFor="signalwireApiToken" className="block text-sm font-medium text-slate-600 dark:text-slate-300 mb-1">API Token</label>
                        <input type="password" id="signalwireApiToken" name="signalwireApiToken" value={settings.signalwireApiToken} onChange={handleChange} placeholder="Enter token to change or set" className="w-full px-3 py-2 bg-slate-100 dark:bg-slate-700 border border-slate-300 dark:border-slate-600 rounded-md focus:ring-2 focus:ring-teal-500 focus:outline-none font-mono" />
                    </div>
                     <p className="text-sm text-slate-600 dark:text-slate-300">
                        <strong>Status:</strong> 
                        <span className={`ml-2 font-bold ${isSignalWireConnected ? 'text-green-500' : 'text-red-500'}`}>
                            {isSignalWireConnected ? 'Connected' : 'Disconnected'}
                        </span>
                    </p>
                 </div>
            </div>

            <div>
                <h2 className="text-lg font-semibold text-slate-800 dark:text-slate-200 border-b border-slate-200 dark:border-slate-700 pb-2 mb-4">API Proxy Configuration</h2>
                <div className="p-4 mb-4 text-sm rounded-lg bg-blue-100 dark:bg-blue-900/30 text-blue-800 dark:text-blue-300 border border-blue-200 dark:border-blue-800/50">
                    <span className="font-bold">Recommendation:</span> For a reliable and permanent solution to API disconnections, use a custom proxy. The default public proxy is rate-limited and not suitable for regular use.
                </div>
                <div className="space-y-4">
                    <div>
                        <label htmlFor="proxyUrl" className="block text-sm font-medium text-slate-600 dark:text-slate-300 mb-1">Custom Proxy URL</label>
                        <input type="text" id="proxyUrl" name="proxyUrl" value={settings.proxyUrl} onChange={handleChange} className="w-full px-3 py-2 bg-slate-100 dark:bg-slate-700 border border-slate-300 dark:border-slate-600 rounded-md focus:ring-2 focus:ring-teal-500 focus:outline-none font-mono" placeholder="https://my-proxy.workers.dev" />
                        <p className="text-xs text-slate-500 mt-1">Leave blank to use the default public proxy (unreliable).</p>
                    </div>
                    <details className="group">
                        <summary className="cursor-pointer text-sm font-medium text-teal-600 dark:text-teal-400 hover:underline">
                            How to create your own free proxy in 5 minutes
                        </summary>
                        <div className="mt-2 p-4 bg-slate-100 dark:bg-slate-900/50 rounded-md border border-slate-200 dark:border-slate-700 text-sm text-slate-600 dark:text-slate-300">
                            <p className="mb-3">You can deploy a simple and secure proxy for free using Cloudflare Workers. This will route your API requests reliably without hitting public limits.</p>
                            <ol className="list-decimal list-inside space-y-2 mb-4">
                                <li><a href="https://dash.cloudflare.com/?to=/:account/workers" target="_blank" rel="noopener noreferrer" className="font-semibold text-teal-500 hover:underline">Sign up or log in to Cloudflare</a> and go to the Workers section.</li>
                                <li>Click "Create a Service", give it a name (e.g., `sms-proxy`), and choose the "HTTP handler" starter.</li>
                                <li>Click "Create service", then "Quick edit".</li>
                                <li>Delete all the boilerplate code and paste the code below.</li>
                                <li>Click "Save and Deploy". Your proxy URL will be shown at the top. Copy it and paste it into the field above.</li>
                            </ol>
                            <div className="relative">
                                <button
                                    onClick={(e) => { 
                                        e.preventDefault(); 
                                        navigator.clipboard.writeText(cloudflareWorkerCode); 
                                        const button = e.currentTarget;
                                        const originalText = button.title;
                                        button.title = 'Copied!';
                                        setTimeout(() => { button.title = originalText }, 2000);
                                    }} 
                                    className="absolute top-2 right-2 p-2 rounded-md bg-slate-200 dark:bg-slate-600 hover:bg-slate-300 dark:hover:bg-slate-500 text-slate-500 dark:text-slate-400" 
                                    title="Copy code"
                                >
                                    <CopyIcon className="w-4 h-4" />
                                </button>
                                <pre className="bg-slate-200 dark:bg-slate-800 p-4 rounded-md text-xs font-mono overflow-x-auto">
                                    <code>
                                        {cloudflareWorkerCode}
                                    </code>
                                </pre>
                            </div>
                        </div>
                    </details>
                </div>
            </div>

            <div className="mt-6 flex flex-wrap justify-end items-center gap-4 border-t border-slate-200 dark:border-slate-700 pt-6">
                <p className="text-sm text-slate-500 dark:text-slate-400 mr-auto">
                    Use Import/Export for local backups or one-time transfers between browsers.
                </p>
                <input 
                    type="file" 
                    id="import-settings" 
                    className="hidden" 
                    accept=".json" 
                    onChange={handleImport} 
                />
                <label 
                    htmlFor="import-settings" 
                    className="flex items-center gap-2 cursor-pointer px-4 py-2 bg-slate-200 text-slate-800 dark:bg-slate-700 dark:text-slate-200 font-semibold rounded-md hover:bg-slate-300 dark:hover:bg-slate-600 transition-colors"
                >
                    <UploadIcon className="w-5 h-5" />
                    Import
                </label>
                <button 
                    type="button" 
                    onClick={handleExport} 
                    className="flex items-center gap-2 px-4 py-2 bg-slate-200 text-slate-800 dark:bg-slate-700 dark:text-slate-200 font-semibold rounded-md hover:bg-slate-300 dark:hover:bg-slate-600 transition-colors"
                >
                    <DownloadIcon className="w-5 h-5" />
                    Export
                </button>
                <button onClick={handleSave} disabled={isSaving} className="flex items-center gap-2 px-4 py-2 bg-teal-600 text-white font-semibold rounded-md hover:bg-teal-700 disabled:bg-teal-800 disabled:cursor-wait">
                    <SaveIcon className="w-5 h-5" />
                    {isSaving ? 'Saving...' : 'Save Settings'}
                </button>
            </div>
        </div>
    );
};

const NumbersPanel: React.FC = () => {
    const [publicNumbers, setPublicNumbers] = useState<PhoneNumber[]>([]);
    const [initialPublicNumbersOrder, setInitialPublicNumbersOrder] = useState<string[]>([]);
    const [availableNumbers, setAvailableNumbers] = useState<PhoneNumber[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [editingSid, setEditingSid] = useState<string | null>(null);
    const [editFormData, setEditFormData] = useState<{ country: string; enabled: boolean; countryCode: string }>({ country: '', enabled: true, countryCode: '' });

    // For drag and drop
    const draggedItem = useRef<PhoneNumber | null>(null);
    const dragOverItem = useRef<PhoneNumber | null>(null);

    const isOrderChanged = JSON.stringify(publicNumbers.map(n => n.id)) !== JSON.stringify(initialPublicNumbersOrder);

    const fetchNumbers = useCallback(async () => {
        setIsLoading(true);
        setError(null);
        try {
            const currentSettings = getSettings();
            const savedPublicNumbers = currentSettings.publicNumbers || [];
            setPublicNumbers(savedPublicNumbers);
            setInitialPublicNumbersOrder(savedPublicNumbers.map(n => n.id));
            
            const [twilioResult, signalwireResult] = await Promise.allSettled([
                getOwnedNumbers(),
                getSignalWireNumbers(),
            ]);

            let allOwnedNumbers: PhoneNumber[] = [];
            if (twilioResult.status === 'fulfilled') {
                allOwnedNumbers.push(...twilioResult.value);
            } else {
                 console.error("Twilio fetch failed:", twilioResult.reason);
                 setError(prev => (prev ? prev + ' | ' : '') + `Twilio: ${twilioResult.reason?.message || 'Failed'}`);
            }

            if (signalwireResult.status === 'fulfilled') {
                allOwnedNumbers.push(...signalwireResult.value);
            } else {
                 console.error("SignalWire fetch failed:", signalwireResult.reason);
                 setError(prev => (prev ? prev + ' | ' : '') + `SignalWire: ${signalwireResult.reason?.message || 'Failed'}`);
            }
            
            const publicIds = new Set(savedPublicNumbers.map(n => n.id));
            const available = allOwnedNumbers.filter(n => !publicIds.has(n.id));
            setAvailableNumbers(available.sort((a,b) => a.number.localeCompare(b.number)));

        } catch (err: any) {
            console.error("Failed to fetch numbers", err);
            setError(err.message || 'An unknown error occurred.');
        } finally {
            setIsLoading(false);
        }
    }, []);
    
    useEffect(() => {
        fetchNumbers();
        window.addEventListener('settingsChanged', fetchNumbers);
        return () => {
            window.removeEventListener('settingsChanged', fetchNumbers);
        };
    }, [fetchNumbers]);

    const handleAddDemoNumbers = () => {
        const currentSettings = getSettings();
        const existingPublicIds = new Set((currentSettings.publicNumbers || []).map(n => n.id));
        
        const newDemoNumbersToAdd = demoNumbers.filter(demoNum => !existingPublicIds.has(demoNum.id));

        if (newDemoNumbersToAdd.length === 0) {
            alert('All demo numbers have already been added.');
            return;
        }

        const updatedPublicNumbers = [...(currentSettings.publicNumbers || []), ...newDemoNumbersToAdd];
        saveSettings({ ...currentSettings, publicNumbers: updatedPublicNumbers });
        fetchNumbers();
    };


    const handleEdit = (number: PhoneNumber) => {
        setEditingSid(number.id);
        setEditFormData({ 
            country: number.country, 
            enabled: number.enabled,
            countryCode: number.countryCode || '',
        });
    };

    const handleCancel = () => {
        setEditingSid(null);
    };
    
    const handleFormChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const { name, value, type, checked } = e.target;
        setEditFormData(prev => ({
            ...prev,
            [name]: type === 'checkbox' ? checked : value
        }));
    };
    
    const handleSave = (id: string) => {
        const currentSettings = getSettings();
        const updatedPublicNumbers = currentSettings.publicNumbers.map(num => 
            num.id === id 
                ? { ...num, ...editFormData, countryCode: editFormData.countryCode.toUpperCase() } 
                : num
        );
        saveSettings({ ...currentSettings, publicNumbers: updatedPublicNumbers });
        setEditingSid(null);
        fetchNumbers();
    };

    const handleAddNumber = (numberToAdd: PhoneNumber) => {
        const currentSettings = getSettings();
        const updatedPublicNumbers = [...currentSettings.publicNumbers, { ...numberToAdd, enabled: true }];
        saveSettings({ ...currentSettings, publicNumbers: updatedPublicNumbers });
        fetchNumbers();
    };

    const handleRemoveNumber = (idToRemove: string) => {
        if (window.confirm('Are you sure you want to remove this number from the public site? It can be re-added later.')) {
            const currentSettings = getSettings();
            const updatedPublicNumbers = currentSettings.publicNumbers.filter(n => n.id !== idToRemove);
            saveSettings({ ...currentSettings, publicNumbers: updatedPublicNumbers });
            fetchNumbers();
        }
    };

    const handleSaveOrder = () => {
        const currentSettings = getSettings();
        saveSettings({ ...currentSettings, publicNumbers });
        setInitialPublicNumbersOrder(publicNumbers.map(n => n.id)); // Reset initial order to current
    };

    const handleDragSort = () => {
        if (!draggedItem.current || !dragOverItem.current) return;

        // Create a copy of the numbers array
        let items = [...publicNumbers];

        // Find the indexes of the dragged and drag-over items
        const draggedItemIndex = items.findIndex(item => item.id === draggedItem.current!.id);
        const dragOverItemIndex = items.findIndex(item => item.id === dragOverItem.current!.id);

        // Remove the dragged item from its original position
        const [reorderedItem] = items.splice(draggedItemIndex, 1);
        
        // Insert the dragged item at the new position
        items.splice(dragOverItemIndex, 0, reorderedItem);

        // Update the state
        setPublicNumbers(items);

        // Reset the refs
        draggedItem.current = null;
        dragOverItem.current = null;
    };
    
    const providerBadgeClass = (provider: PhoneNumber['provider']) => {
        switch (provider) {
            case 'twilio': return 'bg-blue-100 text-blue-800 dark:bg-blue-900/50 dark:text-blue-300';
            case 'signalwire': return 'bg-green-100 text-green-800 dark:bg-green-900/50 dark:text-green-300';
            case 'demo': return 'bg-purple-100 text-purple-800 dark:bg-purple-900/50 dark:text-purple-300';
            default: return 'bg-slate-200 text-slate-800 dark:bg-slate-600 dark:text-slate-300';
        }
    }


    const renderErrorState = () => (
         <div className="text-center p-4">
            <p className="font-semibold text-red-500 mb-2">Could not load all numbers</p>
            <p className="text-sm text-slate-500 dark:text-slate-400 mb-4">{error}</p>
            {error?.includes('proxy') && (
                <div className="mt-4 p-4 bg-blue-100 dark:bg-blue-900/30 rounded-md text-left">
                    <p className="text-sm font-semibold text-blue-800 dark:text-blue-200">How to fix this:</p>
                    <ol className="list-decimal list-inside text-sm text-blue-700 dark:text-blue-300 mt-2">
                        <li>Open this link: <a href="https://cors-anywhere.herokuapp.com/" target="_blank" rel="noopener noreferrer" className="font-bold text-blue-600 dark:text-blue-400 hover:underline">Activate Proxy</a></li>
                        <li>Click the button to "Request temporary access".</li>
                        <li>Come back here and click the Refresh button above.</li>
                    </ol>
                </div>
            )}
        </div>
    );

    return (
        <div className="bg-white dark:bg-slate-800 p-6 rounded-lg shadow-md">
            <div className="flex justify-between items-center border-b border-slate-200 dark:border-slate-700 pb-2 mb-4">
                <h2 className="text-lg font-semibold text-slate-800 dark:text-slate-200">Phone Number Management</h2>
                <button
                    onClick={() => fetchNumbers()}
                    disabled={isLoading}
                    className="flex items-center gap-2 p-2 rounded-md text-slate-500 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-700 hover:text-teal-500 dark:hover:text-teal-400 transition-colors disabled:opacity-50 disabled:cursor-wait"
                    title="Refresh Numbers"
                >
                    <RefreshIcon className={`w-5 h-5 ${isLoading ? 'animate-spin' : ''}`} />
                    <span className="text-sm font-medium hidden sm:inline">Refresh</span>
                </button>
            </div>
            
             {isLoading ? <p className="text-slate-500">Loading numbers...</p> : error && !availableNumbers.length && !publicNumbers.length ? renderErrorState() : (
                 <div className="space-y-8">
                      {error && <div className="p-3 text-sm rounded-md bg-yellow-100 dark:bg-yellow-900/30 text-yellow-800 dark:text-yellow-300 border border-yellow-200 dark:border-yellow-800/50">{error}</div>}
                     {/* Your Public Numbers */}
                     <div>
                        <div className="flex items-center justify-between flex-wrap gap-2 mb-2">
                           <h3 className="text-md font-semibold text-slate-700 dark:text-slate-300">Your Public Numbers ({publicNumbers.length})</h3>
                           <div className="flex items-center gap-2">
                            {isOrderChanged && (
                                <button
                                    onClick={handleSaveOrder}
                                    className="flex items-center gap-2 px-3 py-1.5 text-sm bg-teal-600 hover:bg-teal-700 text-white font-semibold rounded-md transition-colors"
                                >
                                    <SaveIcon className="w-4 h-4" />
                                    Save Order
                                </button>
                            )}
                           <button
                               onClick={handleAddDemoNumbers}
                               className="flex items-center gap-2 px-3 py-1.5 text-sm bg-slate-200 dark:bg-slate-700 hover:bg-slate-300 dark:hover:bg-slate-600 text-slate-700 dark:text-slate-200 font-semibold rounded-md transition-colors"
                           >
                               <PlusIcon className="w-4 h-4" />
                               Add Demo Numbers
                           </button>
                           </div>
                        </div>

                        <p className="text-sm text-slate-500 dark:text-slate-400 mb-4">
                            These numbers are visible on your website. Drag and drop to reorder them.
                        </p>
                        <div className="space-y-3">
                            {publicNumbers.length > 0 ? publicNumbers.map((num) => (
                                <div 
                                    key={num.id} 
                                    className={`p-3 bg-slate-100 dark:bg-slate-700/50 rounded-md transition-all duration-300 ${draggedItem.current?.id === num.id ? 'opacity-50' : ''}`}
                                    draggable
                                    onDragStart={() => (draggedItem.current = num)}
                                    onDragEnter={() => (dragOverItem.current = num)}
                                    onDragEnd={handleDragSort}
                                    onDragOver={(e) => e.preventDefault()}
                                >
                                    {editingSid === num.id ? (
                                        <div className="space-y-4">
                                            {/* Edit Form */}
                                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                                <div>
                                                    <label htmlFor={`country-${num.id}`} className="block text-sm font-medium text-slate-600 dark:text-slate-300 mb-1">Display Name / Country</label>
                                                    <input type="text" id={`country-${num.id}`} name="country" value={editFormData.country} onChange={handleFormChange} className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-700 border border-slate-300 dark:border-slate-600 rounded-md focus:ring-2 focus:ring-teal-500 focus:outline-none" />
                                                </div>
                                                <div>
                                                    <label htmlFor={`countryCode-${num.id}`} className="block text-sm font-medium text-slate-600 dark:text-slate-300 mb-1">Country Code (Flag)</label>
                                                    <input type="text" id={`countryCode-${num.id}`} name="countryCode" value={editFormData.countryCode} onChange={handleFormChange} className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-700 border border-slate-300 dark:border-slate-600 rounded-md focus:ring-2 focus:ring-teal-500 focus:outline-none uppercase" placeholder="e.g., US, GB, CA" maxLength={2} />
                                                    <p className="text-xs text-slate-500 mt-1">2-letter ISO code. <a href="https://www.iso.org/obp/ui/#search/code/" target="_blank" rel="noopener noreferrer" className="text-teal-500 hover:underline">List</a>.</p>
                                                </div>
                                            </div>
                                            <label className="relative inline-flex items-center cursor-pointer">
                                                <input type="checkbox" name="enabled" checked={editFormData.enabled} onChange={handleFormChange} className="sr-only peer" />
                                                <div className="w-11 h-6 bg-slate-300 peer-focus:outline-none rounded-full peer dark:bg-slate-600 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-slate-500 peer-checked:bg-teal-600"></div>
                                                <span className="ml-3 text-sm font-medium text-slate-700 dark:text-slate-300">{editFormData.enabled ? 'Enabled' : 'Disabled'} on Public Site</span>
                                            </label>
                                            <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-200 dark:border-slate-600">
                                                <button onClick={handleCancel} className="px-3 py-1.5 text-sm bg-slate-200 dark:bg-slate-600 hover:bg-slate-300 dark:hover:bg-slate-500 text-slate-700 dark:text-slate-200 font-semibold rounded-md">Cancel</button>
                                                <button onClick={() => handleSave(num.id)} className="flex items-center gap-2 px-3 py-1.5 text-sm bg-teal-600 hover:bg-teal-700 text-white font-semibold rounded-md"><SaveIcon className="w-4 h-4" /> Save</button>
                                            </div>
                                        </div>
                                    ) : (
                                        <div className="flex items-center">
                                            <div className="cursor-grab text-slate-400 dark:text-slate-500 hover:text-slate-600 dark:hover:text-slate-300 pr-3">
                                                <GripVerticalIcon className="w-5 h-5" />
                                            </div>
                                            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center w-full">
                                                {/* Display View */}
                                                <div className="flex-grow">
                                                    <div className="flex items-center gap-2 flex-wrap">
                                                        <span className={`w-2.5 h-2.5 rounded-full flex-shrink-0 ${num.enabled ? 'bg-green-500' : 'bg-red-500'}`} title={num.enabled ? 'Enabled' : 'Disabled'}></span>
                                                        <p className="font-mono font-semibold text-slate-800 dark:text-slate-200">{num.number}</p>
                                                        <span className={`text-xs font-bold uppercase px-2 py-0.5 rounded-full ${providerBadgeClass(num.provider)}`}>{num.provider}</span>
                                                    </div>
                                                    <p className="text-sm text-slate-500 dark:text-slate-400 ml-5">{num.country} {num.countryCode ? `(${num.countryCode.toUpperCase()})` : ''}</p>
                                                </div>
                                                <div className="mt-2 sm:mt-0 sm:ml-4 flex-shrink-0 flex items-center gap-2 self-end sm:self-center">
                                                    <button onClick={() => handleEdit(num)} className="flex items-center gap-2 px-3 py-1.5 text-sm bg-slate-200 dark:bg-slate-700 hover:bg-slate-300 dark:hover:bg-slate-600 text-slate-700 dark:text-slate-200 font-semibold rounded-md"><PencilIcon className="w-4 h-4" /> Edit</button>
                                                    <button onClick={() => handleRemoveNumber(num.id)} className="flex items-center gap-2 px-3 py-1.5 text-sm bg-red-500/10 hover:bg-red-500/20 text-red-600 dark:text-red-400 font-semibold rounded-md"><TrashIcon className="w-4 h-4" /> Remove</button>
                                                </div>
                                            </div>
                                        </div>
                                    )}
                                </div>
                            )) : <p className="text-slate-500 dark:text-slate-400 text-center py-4 text-sm">You haven't added any numbers yet. Add one from the list below.</p>}
                        </div>
                     </div>
                     
                     {/* Available from Twilio */}
                     <div>
                        <h3 className="text-md font-semibold text-slate-700 dark:text-slate-300 mb-2">Available from Your Accounts ({availableNumbers.length})</h3>
                         <p className="text-sm text-slate-500 dark:text-slate-400 mb-4">
                           These numbers were found in your Twilio/SignalWire accounts but are not yet public on the site.
                        </p>
                        <div className="space-y-3">
                             {availableNumbers.length > 0 ? availableNumbers.map(num => (
                                <div key={num.id} className="p-3 bg-slate-50 dark:bg-slate-900/50 rounded-md flex flex-col sm:flex-row justify-between items-start sm:items-center">
                                    <div className="flex-grow">
                                        <div className="flex items-center gap-2 flex-wrap">
                                            <p className="font-mono font-semibold text-slate-800 dark:text-slate-200">{num.number}</p>
                                            <span className={`text-xs font-bold uppercase px-2 py-0.5 rounded-full ${providerBadgeClass(num.provider)}`}>{num.provider}</span>
                                        </div>
                                        <p className="text-sm text-slate-500 dark:text-slate-400">{num.country} {num.countryCode ? `(${num.countryCode.toUpperCase()})` : ''}</p>
                                    </div>
                                    <div className="mt-2 sm:mt-0 sm:ml-4 flex-shrink-0">
                                        <button onClick={() => handleAddNumber(num)} className="flex items-center gap-2 px-3 py-1.5 text-sm bg-teal-600 hover:bg-teal-700 text-white font-semibold rounded-md"><PlusIcon className="w-4 h-4" /> Add to Site</button>
                                    </div>
                                </div>
                             )) : <p className="text-slate-500 dark:text-slate-400 text-center py-4 text-sm">No new numbers available in your connected accounts.</p>}
                        </div>
                     </div>
                 </div>
             )}
        </div>
    );
};


const WebhookLogsPanel: React.FC = () => {
    const [logs, setLogs] = useState<WebhookLog[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const fetchLogs = useCallback(async () => {
        setIsLoading(true);
        setError(null);
        try {
            const data = await getWebhookLogs();
            // Sort by most recent first
            setLogs(data.sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime()));
        } catch (err: any) {
            console.error("Failed to fetch webhook logs", err);
            setError(err.message || 'An unknown error occurred.');
        } finally {
            setIsLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchLogs();
        window.addEventListener('settingsChanged', fetchLogs);
        return () => {
            window.removeEventListener('settingsChanged', fetchLogs);
        };
    }, [fetchLogs]);

    const getLogLevelClass = (level: WebhookLog['logLevel']) => {
        switch (level) {
            case 'error': return 'bg-red-100 text-red-800 dark:bg-red-900/50 dark:text-red-300';
            case 'warning': return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/50 dark:text-yellow-300';
            default: return 'bg-blue-100 text-blue-800 dark:bg-blue-900/50 dark:text-blue-300';
        }
    };

    return (
        <div className="bg-white dark:bg-slate-800 p-6 rounded-lg shadow-md">
            <div className="flex justify-between items-center border-b border-slate-200 dark:border-slate-700 pb-2 mb-4">
                <h2 className="text-lg font-semibold text-slate-800 dark:text-slate-200">Webhook & Error Logs</h2>
                <button
                    onClick={fetchLogs}
                    disabled={isLoading}
                    className="flex items-center gap-2 p-2 rounded-md text-slate-500 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-700 hover:text-teal-500 dark:hover:text-teal-400 transition-colors disabled:opacity-50 disabled:cursor-wait"
                    title="Refresh Logs"
                >
                    <RefreshIcon className={`w-5 h-5 ${isLoading ? 'animate-spin' : ''}`} />
                    <span className="text-sm font-medium hidden sm:inline">Refresh</span>
                </button>
            </div>
            <p className="text-sm text-slate-500 dark:text-slate-400 mb-4">
                Shows the latest errors and warnings from your Twilio account, such as webhook failures. SignalWire logs are not currently supported.
            </p>
            {isLoading ? (
                <p className="text-slate-500 text-center py-4">Loading logs...</p>
            ) : error ? (
                <div className="text-center p-4">
                    <p className="font-semibold text-red-500 mb-2">Could not load logs</p>
                    <p className="text-sm text-slate-500 dark:text-slate-400 mb-4">{error}</p>
                    {error.includes('proxy') && (
                        <div className="mt-4 p-4 bg-blue-100 dark:bg-blue-900/30 rounded-md text-left">
                           <p className="text-sm font-semibold text-blue-800 dark:text-blue-200">How to fix this:</p>
                                <ol className="list-decimal list-inside text-sm text-blue-700 dark:text-blue-300 mt-2">
                                    <li>Open this link: <a href="https://cors-anywhere.herokuapp.com/" target="_blank" rel="noopener noreferrer" className="font-bold text-blue-600 dark:text-blue-400 hover:underline">Activate Proxy</a></li>
                                    <li>Click the button to "Request temporary access".</li>
                                    <li>Come back here and click the Refresh button above.</li>
                                </ol>
                        </div>
                    )}
                </div>
            ) : (
                <div className="overflow-x-auto">
                    <table className="w-full text-sm text-left">
                        <thead className="text-xs text-slate-700 uppercase bg-slate-100 dark:bg-slate-700 dark:text-slate-300">
                            <tr>
                                <th scope="col" className="px-4 py-3">Timestamp</th>
                                <th scope="col" className="px-4 py-3">Level</th>
                                <th scope="col" className="px-4 py-3">Error Code</th>
                                <th scope="col" className="px-4 py-3">Message</th>
                            </tr>
                        </thead>
                        <tbody>
                            {logs.length > 0 ? logs.map(log => (
                                <tr key={log.id} className="border-b dark:border-slate-700">
                                    <td className="px-4 py-3 text-slate-500 dark:text-slate-400 whitespace-nowrap" title={log.timestamp.toLocaleString()}>{timeAgo(log.timestamp)}</td>
                                    <td className="px-4 py-3">
                                        <span className={`px-2 py-1 text-xs font-medium rounded-full uppercase ${getLogLevelClass(log.logLevel)}`}>
                                            {log.logLevel}
                                        </span>
                                    </td>
                                    <td className="px-4 py-3 font-mono text-slate-600 dark:text-slate-300">{log.errorCode || 'N/A'}</td>
                                    <td className="px-4 py-3 text-slate-600 dark:text-slate-300">{log.message}</td>
                                </tr>
                            )) : (
                                <tr>
                                    <td colSpan={4} className="text-center py-6 text-slate-500 dark:text-slate-400">
                                        No logs found. Your account is looking clean!
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            )}
        </div>
    );
};


const PagesPanel: React.FC = () => {
    const [settings, setSettings] = useState<Settings>(getSettings());
    const [isSaving, setIsSaving] = useState(false);

    const handleTextChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
        const { name, value } = e.target;
        setSettings(prev => ({ ...prev, [name]: value }));
    };

    const handleLinkChange = (index: number, field: keyof FooterLink, value: string) => {
        const newLinks = [...settings.footerLinks];
        newLinks[index] = { ...newLinks[index], [field]: value };
        setSettings(prev => ({ ...prev, footerLinks: newLinks }));
    };

    const addLink = () => {
        setSettings(prev => ({ ...prev, footerLinks: [...prev.footerLinks, { text: 'New Link', url: '#' }] }));
    };

    const removeLink = (index: number) => {
        const newLinks = settings.footerLinks.filter((_, i) => i !== index);
        setSettings(prev => ({ ...prev, footerLinks: newLinks }));
    };

    const handleSave = () => {
        setIsSaving(true);
        saveSettings(settings);
        setTimeout(() => setIsSaving(false), 1000);
    };

    return (
        <div className="bg-white dark:bg-slate-800 p-6 rounded-lg shadow-md space-y-8">
            <div>
                <h2 className="text-lg font-semibold text-slate-800 dark:text-slate-200 border-b border-slate-200 dark:border-slate-700 pb-2 mb-4">Footer Settings</h2>
                <div className="space-y-4">
                    <div>
                        <label htmlFor="footerText" className="block text-sm font-medium text-slate-600 dark:text-slate-300 mb-1">Footer Text</label>
                        <input type="text" id="footerText" name="footerText" value={settings.footerText} onChange={handleTextChange} className="w-full px-3 py-2 bg-slate-100 dark:bg-slate-700 border border-slate-300 dark:border-slate-600 rounded-md focus:ring-2 focus:ring-teal-500 focus:outline-none" />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-slate-600 dark:text-slate-300 mb-1">Footer Links</label>
                        <div className="space-y-2">
                            {settings.footerLinks.map((link, index) => (
                                <div key={index} className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
                                    <input type="text" placeholder="Link Text" value={link.text} onChange={e => handleLinkChange(index, 'text', e.target.value)} className="w-full px-3 py-2 bg-slate-100 dark:bg-slate-700 border border-slate-300 dark:border-slate-600 rounded-md focus:ring-2 focus:ring-teal-500 focus:outline-none" />
                                    <input type="text" placeholder="URL (e.g., /about)" value={link.url} onChange={e => handleLinkChange(index, 'url', e.target.value)} className="w-full px-3 py-2 bg-slate-100 dark:bg-slate-700 border border-slate-300 dark:border-slate-600 rounded-md focus:ring-2 focus:ring-teal-500 focus:outline-none" />
                                    <button onClick={() => removeLink(index)} className="p-2 text-slate-500 hover:text-red-500 dark:text-slate-400 dark:hover:text-red-400 rounded-full hover:bg-red-500/10 transition-colors self-end sm:self-center flex-shrink-0" title="Remove Link">
                                        <TrashIcon className="w-5 h-5" />
                                    </button>
                                </div>
                            ))}
                        </div>
                        <button onClick={addLink} className="mt-2 flex items-center gap-2 px-3 py-1.5 text-sm bg-slate-200 dark:bg-slate-700 hover:bg-slate-300 dark:hover:bg-slate-600 text-slate-700 dark:text-slate-200 font-semibold rounded-md">
                            <PlusIcon className="w-4 h-4" /> Add Link
                        </button>
                    </div>
                </div>
            </div>

            <div>
                <h2 className="text-lg font-semibold text-slate-800 dark:text-slate-200 border-b border-slate-200 dark:border-slate-700 pb-2 mb-4">Page Content</h2>
                <div className="space-y-4">
                     <div>
                        <label htmlFor="aboutPageContent" className="block text-sm font-medium text-slate-600 dark:text-slate-300 mb-1">About Us Page</label>
                        <textarea id="aboutPageContent" name="aboutPageContent" value={settings.aboutPageContent} onChange={handleTextChange} rows={6} className="w-full px-3 py-2 bg-slate-100 dark:bg-slate-700 border border-slate-300 dark:border-slate-600 rounded-md focus:ring-2 focus:ring-teal-500 focus:outline-none" placeholder="Enter content for the About Us page. Markdown is supported." />
                    </div>
                     <div>
                        <label htmlFor="privacyPageContent" className="block text-sm font-medium text-slate-600 dark:text-slate-300 mb-1">Privacy Policy Page</label>
                        <textarea id="privacyPageContent" name="privacyPageContent" value={settings.privacyPageContent} onChange={handleTextChange} rows={6} className="w-full px-3 py-2 bg-slate-100 dark:bg-slate-700 border border-slate-300 dark:border-slate-600 rounded-md focus:ring-2 focus:ring-teal-500 focus:outline-none" placeholder="Enter content for the Privacy Policy page. Markdown is supported." />
                    </div>
                     <div>
                        <label htmlFor="termsPageContent" className="block text-sm font-medium text-slate-600 dark:text-slate-300 mb-1">Terms of Service Page</label>
                        <textarea id="termsPageContent" name="termsPageContent" value={settings.termsPageContent} onChange={handleTextChange} rows={6} className="w-full px-3 py-2 bg-slate-100 dark:bg-slate-700 border border-slate-300 dark:border-slate-600 rounded-md focus:ring-2 focus:ring-teal-500 focus:outline-none" placeholder="Enter content for the Terms of Service page. Markdown is supported." />
                    </div>
                </div>
            </div>

            <div className="mt-6 text-right">
                <button onClick={handleSave} disabled={isSaving} className="px-4 py-2 bg-teal-600 text-white font-semibold rounded-md hover:bg-teal-700 disabled:bg-teal-800 disabled:cursor-wait">
                    {isSaving ? 'Saving...' : 'Save All Changes'}
                </button>
            </div>
        </div>
    );
};

const AdvertisingPanel: React.FC = () => {
    const [settings, setSettings] = useState<Settings>(getSettings());
    const [isSaving, setIsSaving] = useState(false);

    const handleCheckboxChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const { name, checked } = e.target;
        setSettings(prev => ({
            ...prev,
            [name]: checked
        }));
    };

    const handleAdChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
        const { name, value } = e.target;
        setSettings(prev => ({
            ...prev,
            ads: {
                ...prev.ads,
                [name]: value
            }
        }));
    };

    const handleSave = () => {
        setIsSaving(true);
        saveSettings(settings);
        setTimeout(() => setIsSaving(false), 1000);
    };

    return (
        <div className="bg-white dark:bg-slate-800 p-6 rounded-lg shadow-md space-y-8">
            <div>
                <h2 className="text-lg font-semibold text-slate-800 dark:text-slate-200 border-b border-slate-200 dark:border-slate-700 pb-2 mb-4">Advertising Settings</h2>
                <div className="space-y-6">
                    <div className="flex items-center justify-between pt-2">
                        <div className="flex flex-col">
                            <span className="text-sm font-medium text-slate-600 dark:text-slate-300">Enable Ads</span>
                            <span className="text-xs text-slate-500 dark:text-slate-400">This will render the ad codes you provide below.</span>
                        </div>
                        <label className="relative inline-flex items-center cursor-pointer">
                            <input type="checkbox" name="adsenseEnabled" checked={settings.adsenseEnabled} onChange={handleCheckboxChange} className="sr-only peer" />
                            <div className="w-11 h-6 bg-slate-300 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-teal-300/50 dark:peer-focus:ring-teal-800/50 rounded-full peer dark:bg-slate-600 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-slate-500 peer-checked:bg-teal-600"></div>
                        </label>
                    </div>
                     {settings.adsenseEnabled && (
                        <div className="space-y-6 p-4 border border-slate-200 dark:border-slate-700 rounded-lg">
                            <p className="text-sm text-slate-500 dark:text-slate-400">Paste your full ad code (e.g., from AdSense) into the appropriate slot below.</p>
                            <div>
                                <label htmlFor="homePageAd" className="block text-sm font-medium text-slate-600 dark:text-slate-300 mb-1">Homepage Ad Code</label>
                                <textarea 
                                    id="homePageAd" 
                                    name="homePageAd" 
                                    value={settings.ads.homePageAd} 
                                    onChange={handleAdChange} 
                                    rows={6}
                                    placeholder="Paste your <ins>...</ins> ad code here."
                                    className="w-full font-mono text-xs px-3 py-2 bg-slate-100 dark:bg-slate-700 border border-slate-300 dark:border-slate-600 rounded-md focus:ring-2 focus:ring-teal-500 focus:outline-none" />
                            </div>
                            <div>
                                <label htmlFor="numberPageTopAd" className="block text-sm font-medium text-slate-600 dark:text-slate-300 mb-1">Number Page - Top Banner Ad Code</label>
                                <textarea 
                                    id="numberPageTopAd" 
                                    name="numberPageTopAd" 
                                    value={settings.ads.numberPageTopAd} 
                                    onChange={handleAdChange} 
                                    rows={6}
                                    placeholder="Paste your <ins>...</ins> ad code here."
                                    className="w-full font-mono text-xs px-3 py-2 bg-slate-100 dark:bg-slate-700 border border-slate-300 dark:border-slate-600 rounded-md focus:ring-2 focus:ring-teal-500 focus:outline-none" />
                            </div>
                            <div>
                                <label htmlFor="numberPageInFeedAd" className="block text-sm font-medium text-slate-600 dark:text-slate-300 mb-1">Number Page - In-Feed Ad Code</label>
                                <textarea 
                                    id="numberPageInFeedAd" 
                                    name="numberPageInFeedAd" 
                                    value={settings.ads.numberPageInFeedAd} 
                                    onChange={handleAdChange} 
                                    rows={6}
                                    placeholder="Paste your <ins>...</ins> ad code here."
                                    className="w-full font-mono text-xs px-3 py-2 bg-slate-100 dark:bg-slate-700 border border-slate-300 dark:border-slate-600 rounded-md focus:ring-2 focus:ring-teal-500 focus:outline-none" />
                            </div>
                        </div>
                    )}
                </div>
                 <div className="mt-6 text-right">
                    <button onClick={handleSave} disabled={isSaving} className="px-4 py-2 bg-teal-600 text-white font-semibold rounded-md hover:bg-teal-700 disabled:bg-teal-800 disabled:cursor-wait">
                        {isSaving ? 'Saving...' : 'Save Ad Settings'}
                    </button>
                </div>
            </div>
        </div>
    );
};

const SecurityPanel: React.FC = () => {
    const [credentials, setCredentials] = useState({
        username: getSettings().adminUsername,
        password: '',
        confirmPassword: ''
    });
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');
    const [isSaving, setIsSaving] = useState(false);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setCredentials(prev => ({...prev, [e.target.name]: e.target.value}));
        setError('');
        setSuccess('');
    };
    
    const handleSave = async (e: React.FormEvent) => {
        e.preventDefault();
        if (credentials.password && credentials.password !== credentials.confirmPassword) {
            setError('Passwords do not match.');
            return;
        }
        
        setIsSaving(true);
        // The service now handles preserving the password if the input is empty.
        // We just pass the values from the form.
        await updateCredentials(credentials.username.trim(), credentials.password);
        
        setTimeout(() => {
            setIsSaving(false);
            setSuccess('Credentials updated successfully.');
            setCredentials(prev => ({...prev, password: '', confirmPassword: ''}));
        }, 1000);
    };

    return (
        <div className="bg-white dark:bg-slate-800 p-6 rounded-lg shadow-md">
            <form onSubmit={handleSave}>
                <h2 className="text-lg font-semibold text-slate-800 dark:text-slate-200 border-b border-slate-200 dark:border-slate-700 pb-2 mb-4">Admin Credentials</h2>
                <div className="space-y-4">
                    <div>
                        <label htmlFor="username" className="block text-sm font-medium text-slate-600 dark:text-slate-300 mb-1">Username</label>
                        <input type="text" id="username" name="username" value={credentials.username} onChange={handleChange} className="w-full px-3 py-2 bg-slate-100 dark:bg-slate-700 border border-slate-300 dark:border-slate-600 rounded-md focus:ring-2 focus:ring-teal-500 focus:outline-none" required />
                    </div>
                    <div>
                        <label htmlFor="password"  className="block text-sm font-medium text-slate-600 dark:text-slate-300 mb-1">New Password</label>
                        <input type="password" id="password" name="password" value={credentials.password} onChange={handleChange}  className="w-full px-3 py-2 bg-slate-100 dark:bg-slate-700 border border-slate-300 dark:border-slate-600 rounded-md focus:ring-2 focus:ring-teal-500 focus:outline-none" placeholder="Leave blank to keep current password"/>
                    </div>
                    <div>
                        <label htmlFor="confirmPassword"  className="block text-sm font-medium text-slate-600 dark:text-slate-300 mb-1">Confirm New Password</label>
                        <input type="password" id="confirmPassword" name="confirmPassword" value={credentials.confirmPassword} onChange={handleChange}  className="w-full px-3 py-2 bg-slate-100 dark:bg-slate-700 border border-slate-300 dark:border-slate-600 rounded-md focus:ring-2 focus:ring-teal-500 focus:outline-none" />
                    </div>
                    {error && <p className="text-sm text-red-500">{error}</p>}
                    {success && <p className="text-sm text-green-500">{success}</p>}
                </div>
                <div className="mt-6 text-right">
                    <button type="submit" disabled={isSaving} className="px-4 py-2 bg-teal-600 text-white font-semibold rounded-md hover:bg-teal-700 disabled:bg-teal-800 disabled:cursor-wait">
                        {isSaving ? 'Saving...' : 'Save Credentials'}
                    </button>
                </div>
            </form>
        </div>
    );
};

const CloudSyncPanel: React.FC = () => {
    const GIST_ID_KEY = 'sms_receiver_gist_id';
    const GITHUB_TOKEN_KEY = 'sms_receiver_github_token';

    const [gistId, setGistId] = useState(() => localStorage.getItem(GIST_ID_KEY) || '');
    const [token, setToken] = useState(() => localStorage.getItem(GITHUB_TOKEN_KEY) || '');
    const [status, setStatus] = useState<{ type: 'idle' | 'loading' | 'success' | 'error'; message: string }>({ type: 'idle', message: '' });

    useEffect(() => {
        localStorage.setItem(GIST_ID_KEY, gistId);
    }, [gistId]);

    useEffect(() => {
        localStorage.setItem(GITHUB_TOKEN_KEY, token);
    }, [token]);
    
    const handleFetch = async () => {
        if (!gistId || !token) {
            setStatus({ type: 'error', message: 'Gist ID and Token are required.' });
            return;
        }
        setStatus({ type: 'loading', message: 'Fetching settings from cloud...' });
        try {
            const settings = await fetchSettingsFromGist(gistId, token);
            if (window.confirm("Successfully fetched settings from cloud. Do you want to overwrite your current local settings?")) {
                saveSettings(settings);
                setStatus({ type: 'success', message: 'Settings successfully fetched and applied locally.' });
                // Optionally, force a refresh or use an event to notify other components
                window.location.reload();
            } else {
                 setStatus({ type: 'idle', message: 'Fetch cancelled.' });
            }
        } catch (error: any) {
            setStatus({ type: 'error', message: `Failed to fetch: ${error.message}` });
        }
    };
    
    const handleSave = async () => {
        if (!gistId || !token) {
            setStatus({ type: 'error', message: 'Gist ID and Token are required.' });
            return;
        }
        setStatus({ type: 'loading', message: 'Saving current settings to cloud...' });
        try {
            const currentSettings = getSettings();
            await saveSettingsToGist(gistId, token, currentSettings);
            setStatus({ type: 'success', message: 'Settings successfully saved to cloud.' });
        } catch (error: any) {
            setStatus({ type: 'error', message: `Failed to save: ${error.message}` });
        }
    };

    const getStatusColor = () => {
        switch (status.type) {
            case 'loading': return 'text-blue-500';
            case 'success': return 'text-green-500';
            case 'error': return 'text-red-500';
            default: return 'text-slate-500';
        }
    };

    return (
        <div className="bg-white dark:bg-slate-800 p-6 rounded-lg shadow-md space-y-6">
            <div>
                <h2 className="text-lg font-semibold text-slate-800 dark:text-slate-200">Cloud Sync with GitHub Gist</h2>
                <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">Save your settings to a private Gist to sync and back them up across browsers and devices.</p>
            </div>
            <div className="space-y-4">
                <div>
                    <label htmlFor="gistId" className="block text-sm font-medium text-slate-600 dark:text-slate-300 mb-1">Gist ID</label>
                    <input type="text" id="gistId" value={gistId} onChange={(e) => setGistId(e.target.value)} className="w-full px-3 py-2 bg-slate-100 dark:bg-slate-700 border border-slate-300 dark:border-slate-600 rounded-md focus:ring-2 focus:ring-teal-500 focus:outline-none font-mono" placeholder="e.g., 123abc456def789" />
                </div>
                <div>
                    <label htmlFor="token" className="block text-sm font-medium text-slate-600 dark:text-slate-300 mb-1">GitHub Personal Access Token</label>
                    <input type="password" id="token" value={token} onChange={(e) => setToken(e.target.value)} className="w-full px-3 py-2 bg-slate-100 dark:bg-slate-700 border border-slate-300 dark:border-slate-600 rounded-md focus:ring-2 focus:ring-teal-500 focus:outline-none font-mono" placeholder="ghp_xxxxxxxxxxxxxxxx" />
                </div>
            </div>
            <details className="group">
                <summary className="cursor-pointer text-sm font-medium text-teal-600 dark:text-teal-400 hover:underline">
                    How to get your Gist ID and Token
                </summary>
                <div className="mt-2 p-4 bg-slate-100 dark:bg-slate-900/50 rounded-md border border-slate-200 dark:border-slate-700 text-sm text-slate-600 dark:text-slate-300 prose prose-sm dark:prose-invert max-w-none">
                    <h4>Creating the Gist</h4>
                    <ol>
                        <li>Go to <a href="https://gist.github.com/" target="_blank" rel="noopener noreferrer">gist.github.com</a>.</li>
                        <li>Enter <code>sms-receiver-settings.json</code> as the filename.</li>
                        <li>In the content box, type <code>{`{}`}</code> (an empty JSON object).</li>
                        <li>Click the dropdown next to "Create public gist" and select <strong>"Create secret gist"</strong>. This is crucial for security.</li>
                        <li>Click the "Create secret gist" button.</li>
                        <li>The <strong>Gist ID</strong> is the long string of characters in the URL after your username. For example, in <code>https://gist.github.com/username/<strong>123abc456def789</strong></code>, the ID is <code>123abc456def789</code>. Copy this ID.</li>
                    </ol>
                    <h4>Creating the Access Token</h4>
                    <ol>
                        <li>Go to your GitHub <a href="https://github.com/settings/tokens" target="_blank" rel="noopener noreferrer">Personal access tokens</a> page.</li>
                        <li>Click "Generate new token" and choose "Generate new token (classic)".</li>
                        <li>Give the token a descriptive name, like "SMS Receiver Sync".</li>
                        <li>Set the expiration (90 days is a good balance of security and convenience).</li>
                        <li>Under "Select scopes", check the box next to <strong><code>gist</code></strong>. No other scopes are needed.</li>
                        <li>Click "Generate token" at the bottom of the page.</li>
                        <li><strong>Important:</strong> Copy your new token immediately. You will not be able to see it again. Paste it into the field above.</li>
                    </ol>
                </div>
            </details>
            <div className="flex flex-col sm:flex-row items-center gap-4 pt-4 border-t border-slate-200 dark:border-slate-700">
                <div className="flex items-center gap-4">
                    <button onClick={handleFetch} disabled={status.type === 'loading'} className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white font-semibold rounded-md hover:bg-blue-700 disabled:bg-blue-800 disabled:cursor-wait">
                        <DownloadIcon className="w-5 h-5" />
                        Fetch from Cloud
                    </button>
                    <button onClick={handleSave} disabled={status.type === 'loading'} className="flex items-center gap-2 px-4 py-2 bg-teal-600 text-white font-semibold rounded-md hover:bg-teal-700 disabled:bg-teal-800 disabled:cursor-wait">
                        <UploadIcon className="w-5 h-5" />
                        Save to Cloud
                    </button>
                </div>
                {status.message && (
                    <p className={`text-sm font-medium ${getStatusColor()}`}>
                        {status.message}
                    </p>
                )}
            </div>
        </div>
    );
};


const AdminPage: React.FC = () => {
    const [activeTab, setActiveTab] = useState('settings');

    const handleLogout = () => {
        logout();
        navigate('/login');
    };

    const renderTabContent = () => {
        switch (activeTab) {
            case 'settings':
                return <SettingsPanel />;
            case 'numbers':
                return <NumbersPanel />;
            case 'cloud':
                return <CloudSyncPanel />;
            case 'blog':
                return <BlogManagementPanel />;
            case 'customPages':
                return <CustomPageManagementPanel />;
            case 'webhooks':
                return <WebhookLogsPanel />;
            case 'pages':
                return <PagesPanel />;
            case 'advertising':
                return <AdvertisingPanel />;
            case 'security':
                return <SecurityPanel />;
            default:
                return null;
        }
    };

    return (
        <div className="min-h-screen bg-slate-100 dark:bg-slate-900">
            <header className="bg-white dark:bg-slate-800 shadow-md sticky top-0 z-10">
                <div className="container mx-auto px-4 py-3 flex justify-between items-center">
                    <div className="flex items-center gap-3">
                        <AdminIcon className="w-7 h-7 text-teal-500 dark:text-teal-400" />
                        <h1 className="text-xl font-bold text-slate-800 dark:text-slate-200">
                            Admin Panel
                        </h1>
                    </div>
                    <div className="flex items-center gap-2 sm:gap-4">
                         <button
                            onClick={() => navigate('/')}
                            className="flex items-center gap-2 p-2 rounded-md text-slate-500 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-700 hover:text-teal-500 dark:hover:text-teal-400 transition-colors"
                            title="View Public Site"
                        >
                            <EyeIcon className="w-5 h-5" />
                            <span className="text-sm font-medium hidden sm:inline">Public Site</span>
                        </button>
                        <button
                            onClick={handleLogout}
                            className="flex items-center gap-2 p-2 rounded-md text-slate-500 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-700 hover:text-red-500 dark:hover:text-red-400 transition-colors"
                            title="Logout"
                        >
                            <LogoutIcon className="w-5 h-5" />
                            <span className="text-sm font-medium hidden sm:inline">Logout</span>
                        </button>
                    </div>
                </div>
            </header>

            <main className="container mx-auto p-4 md:p-6">
                <div className="flex flex-col md:flex-row gap-6">
                    <aside className="md:w-1/4 lg:w-1/5 flex-shrink-0">
                        <nav className="flex flex-row md:flex-col gap-2 bg-white dark:bg-slate-800 p-3 rounded-lg shadow-md overflow-x-auto md:overflow-y-auto">
                            <TabButton icon={<SettingsIcon className="w-5 h-5" />} label="General Settings" tabName="settings" activeTab={activeTab} setActiveTab={setActiveTab} />
                            <TabButton icon={<PhoneIcon className="w-5 h-5" />} label="Phone Numbers" tabName="numbers" activeTab={activeTab} setActiveTab={setActiveTab} />
                            <TabButton icon={<CloudIcon className="w-5 h-5" />} label="Cloud Sync" tabName="cloud" activeTab={activeTab} setActiveTab={setActiveTab} />
                            <TabButton icon={<NewspaperIcon className="w-5 h-5" />} label="Blog" tabName="blog" activeTab={activeTab} setActiveTab={setActiveTab} />
                            <TabButton icon={<DocumentPlusIcon className="w-5 h-5" />} label="Custom Pages" tabName="customPages" activeTab={activeTab} setActiveTab={setActiveTab} />
                            <TabButton icon={<WebhookIcon className="w-5 h-5" />} label="Webhook Logs" tabName="webhooks" activeTab={activeTab} setActiveTab={setActiveTab} />
                            <TabButton icon={<DocumentIcon className="w-5 h-5" />} label="Pages & Footer" tabName="pages" activeTab={activeTab} setActiveTab={setActiveTab} />
                            <TabButton icon={<DollarIcon className="w-5 h-5" />} label="Advertising" tabName="advertising" activeTab={activeTab} setActiveTab={setActiveTab} />
                            <TabButton icon={<ShieldIcon className="w-5 h-5" />} label="Security" tabName="security" activeTab={activeTab} setActiveTab={setActiveTab} />
                        </nav>
                    </aside>
                    <div className="flex-grow">
                        {renderTabContent()}
                    </div>
                </div>
            </main>
        </div>
    );
};

export default AdminPage;