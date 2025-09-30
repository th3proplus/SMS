export const navigate = (path: string): void => {
  // Use the current document's location as the base for resolving the path.
  // This correctly handles both relative paths (e.g., "/login") and absolute,
  // same-origin URLs, ensuring the resulting URL has the correct origin.
  const targetUrl = new URL(path, window.location.href);
  
  // The History API's pushState method requires the new URL to be of the same
  // origin as the document. If it's not, it throws a SecurityError. This check
  // prevents that crash. The global click handler in App.tsx should already
  // filter out cross-origin links, but this also protects direct calls to navigate().
  if (targetUrl.origin !== window.location.origin) {
    console.warn(
      `navigate() was called with a cross-origin URL: ${path}. Navigation was blocked.`
    );
    return;
  }

  // We construct the relative path from the parsed URL object.
  const relativePath = targetUrl.pathname + targetUrl.search + targetUrl.hash;
  
  if (window.location.pathname + window.location.search + window.location.hash === relativePath) {
    return; // No change, do nothing
  }

  // By using `relativePath`, we provide pushState with a path that is guaranteed
  // to be on the same origin, resolving the security error.
  window.history.pushState({}, '', relativePath);
  window.dispatchEvent(new PopStateEvent('popstate'));
};
