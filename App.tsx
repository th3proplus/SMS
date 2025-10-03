

import React, { useState, useEffect } from 'react';
import { getSettings } from './services/settingsService';
import { navigate } from './services/navigationService';
import type { Settings } from './types';
import HomePage from './pages/HomePage';
import LoginPage from './pages/LoginPage';
import AdminPage from './pages/AdminPage';
import NumberPage from './pages/NumberPage';
import ProtectedRoute from './components/ProtectedRoute';
import TextContentPage from './pages/TextContentPage';
import BlogIndexPage from './pages/BlogIndexPage';
import BlogPostPage from './pages/BlogPostPage';
import CustomPageViewer from './pages/CustomPageViewer';

// Helper to extract the path from the hash, e.g., "#/some/path" -> "/some/path"
const getPathFromHash = () => {
    const hash = window.location.hash;
    if (hash.startsWith('#/')) {
        return hash.substring(1);
    }
    // Default to root path if hash is missing, empty, or just '#'
    return '/';
};


const App: React.FC = () => {
    const [pathname, setPathname] = useState(getPathFromHash());
    const [settings, setSettings] = useState<Settings>(getSettings());

    useEffect(() => {
        const handleLocationChange = () => {
            setPathname(getPathFromHash());
        };
        
        const handleSettingsChange = () => {
            const newSettings = getSettings();
            setSettings(newSettings);
        };

        // Listen for changes to the URL hash for navigation
        window.addEventListener('hashchange', handleLocationChange);
        // popstate is also needed for back/forward buttons that change the hash
        window.addEventListener('popstate', handleLocationChange);
        window.addEventListener('settingsChanged', handleSettingsChange);
        
        // The cleanup function removes the listeners when the component unmounts
        return () => {
            window.removeEventListener('hashchange', handleLocationChange);
            window.removeEventListener('popstate', handleLocationChange);
            window.removeEventListener('settingsChanged', handleSettingsChange);
        };
    }, []);

    // Global link click handler for client-side routing
    useEffect(() => {
        const handleLocalLinkClick = (event: MouseEvent) => {
            const target = event.target as HTMLElement;
            const anchor = target.closest('a');

            // Basic checks: not a link, new tab, modifier key pressed.
            if (!anchor || anchor.target === '_blank' || event.ctrlKey || event.metaKey) {
                return;
            }
            
            const href = anchor.getAttribute('href');

            // Special protocols that the router shouldn't handle.
            if (href && (href.startsWith('mailto:') || href.startsWith('tel:'))) {
                return;
            }

            // Determine if the link is internal. A link is internal if it's relative (starts with /)
            // or if it's an absolute URL with the same origin as the app.
            const isRelative = href && href.startsWith('/');
            const isAbsoluteSameOrigin = anchor.origin === window.location.origin;

            if (!isRelative && !isAbsoluteSameOrigin) {
                // It's an external link, so let the browser handle it.
                return;
            }

            // Ignore links that are just hashes for the current page (e.g., for accessibility skips)
            // With hash routing, we now check against the hash itself.
            if (anchor.pathname === window.location.pathname && anchor.hash.startsWith('#') && getPathFromHash() === '/') {
                return;
            }

            event.preventDefault();
            if (href) {
                navigate(href);
            }
        };

        document.body.addEventListener('click', handleLocalLinkClick);
        return () => {
            document.body.removeEventListener('click', handleLocalLinkClick);
        };
    }, []);

    // Custom Head Code Injection
    useEffect(() => {
        const updateHeadCode = () => {
            const currentSettings = getSettings();
            const head = document.head;
            let container = document.getElementById('custom-head-code-container');

            // Remove previous container if it exists
            if (container) {
                container.remove();
            }

            // If there's new code, create and append the container
            if (currentSettings.headCode && currentSettings.headCode.trim() !== '') {
                container = document.createElement('div');
                container.id = 'custom-head-code-container';
                container.innerHTML = currentSettings.headCode;
                head.appendChild(container);

                // Re-evaluate scripts inside the new container to make them execute
                Array.from(container.querySelectorAll('script')).forEach(oldScript => {
                    const newScript = document.createElement('script');
                    Array.from(oldScript.attributes).forEach(attr => newScript.setAttribute(attr.name, attr.value));
                    newScript.appendChild(document.createTextNode(oldScript.innerHTML));
                    oldScript.parentNode?.replaceChild(newScript, oldScript);
                });
            }
        };

        updateHeadCode();
        window.addEventListener('settingsChanged', updateHeadCode);

        return () => {
            window.removeEventListener('settingsChanged', updateHeadCode);
            const container = document.getElementById('custom-head-code-container');
            if (container) {
                container.remove();
            }
        };
    }, []);

    const renderRoute = () => {
        if (pathname.startsWith('/number/')) {
            const phoneNumber = decodeURIComponent(pathname.substring(8));
            return <NumberPage phoneNumber={phoneNumber} />;
        }
        
        if (pathname.startsWith('/blog/')) {
            const slug = decodeURIComponent(pathname.substring(6));
            return <BlogPostPage slug={slug} />;
        }

        if (pathname.startsWith('/pages/')) {
            const slug = decodeURIComponent(pathname.substring(7));
            return <CustomPageViewer slug={slug} />;
        }
        
        switch (pathname) {
            case '/login':
                return <LoginPage />;
            case '/admin':
                return (
                    <ProtectedRoute>
                        <AdminPage />
                    </ProtectedRoute>
                );
            case '/about':
                return <TextContentPage title="About Us" content={settings.aboutPageContent} />;
            case '/privacy':
                return <TextContentPage title="Privacy Policy" content={settings.privacyPageContent} />;
            case '/terms':
                return <TextContentPage title="Terms of Service" content={settings.termsPageContent} />;
            case '/blog':
                return <BlogIndexPage />;
            case '/':
            default:
                return <HomePage />;
        }
    }

    return (
        <div className="min-h-screen bg-slate-900 text-slate-200 font-sans">
           {renderRoute()}
        </div>
    );
};

export default App;