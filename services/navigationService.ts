
export const navigate = (path: string, options: { replace?: boolean } = {}): void => {
    // Ensure path starts with a slash and create the hash format, e.g., #/path
    const newHash = `#${path.startsWith('/') ? path : '/' + path}`;

    // Avoid pushing a new history state if the hash is already what we want.
    if (window.location.hash === newHash && !options.replace) {
        return;
    }

    if (options.replace) {
        // Use location.replace to change the URL without adding to history.
        // This is safer than history.replaceState in blob environments as it correctly
        // handles the full URL. It replaces the current history entry.
        const baseUrl = window.location.href.split('#')[0];
        const newUrl = baseUrl + newHash;
        window.location.replace(newUrl);
    } else {
        // Setting location.hash automatically adds an entry to the browser history
        // and triggers the 'hashchange' event, which our App component listens for.
        window.location.hash = newHash;
    }
};
