export const navigate = (path: string, options: { replace?: boolean } = {}): void => {
  // Use the current document's location as the base for resolving the path.
  const targetUrl = new URL(path, window.location.href);
  
  // The History API requires the new URL to be of the same origin.
  if (targetUrl.origin !== window.location.origin) {
    console.warn(
      `navigate() was called with a cross-origin URL: ${path}. Navigation was blocked.`
    );
    return;
  }

  const relativePath = targetUrl.pathname + targetUrl.search + targetUrl.hash;
  const currentPath = window.location.pathname + window.location.search + window.location.hash;
  
  // Do nothing if the path is the same, unless we are explicitly trying to replace the history entry.
  if (!options.replace && currentPath === relativePath) {
    return;
  }

  // Use replaceState or pushState based on the 'replace' option.
  if (options.replace) {
      window.history.replaceState({}, '', relativePath);
  } else {
      window.history.pushState({}, '', relativePath);
  }

  // Dispatch a 'popstate' event to notify the application (e.g., App.tsx) that the URL has changed.
  window.dispatchEvent(new PopStateEvent('popstate'));
};