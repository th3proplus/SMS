import React, { useState, useEffect } from 'react';
// FIX: Add .ts extension for module resolution
import { getSettings, applyTheme } from './services/settingsService.ts';
import { navigate } from './services/navigationService.ts';
// FIX: Add .ts extension for module resolution
import type { Settings } from './types.ts';
import HomePage from './pages/HomePage.tsx';
import LoginPage from './pages/LoginPage.tsx';
import AdminPage from './pages/AdminPage.tsx';
import NumberPage from './pages/NumberPage.tsx';
import ProtectedRoute from './components/ProtectedRoute.tsx';
import TextContentPage from './pages/TextContentPage.tsx';
import BlogIndexPage from './pages/BlogIndexPage.tsx';
// FIX: Add .tsx extension for module resolution
import BlogPostPage from './pages/BlogPostPage.tsx';

const App: React.FC = () => {
    const [pathname, setPathname] = useState(window.location.pathname);
    const [settings, setSettings] = useState<Settings>(getSettings());

    useEffect(() => {
        // Apply theme on initial load from the most recent settings
        applyTheme(getSettings().theme);

        const handlePopState = () => {
            setPathname(window.location.pathname);
        };
        
        const handleSettingsChange = () => {
            const newSettings = getSettings();
            setSettings(newSettings);
            // Also apply the theme immediately when settings change
            applyTheme(newSettings.theme);
        };

        window.addEventListener('popstate', handlePopState);
        window.addEventListener('settingsChanged', handleSettingsChange);
        
        // The cleanup function removes the listeners when the component unmounts
        return () => {
            window.removeEventListener('popstate', handlePopState);
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
            if (anchor.pathname === window.location.pathname && anchor.hash !== '') {
                return;
            }

            event.preventDefault();
            const newPath = anchor.pathname + anchor.search + anchor.hash;
            if (window.location.pathname + window.location.search + window.location.hash !== newPath) {
                 navigate(newPath);
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
        <div className="min-h-screen bg-slate-100 dark:bg-slate-900 text-slate-800 dark:text-slate-200 font-sans">
           {renderRoute()}
        </div>
    );
};

export default App;
