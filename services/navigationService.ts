export const navigate = (path: string): void => {
  if (window.location.pathname + window.location.search + window.location.hash === path) {
    return; // No change, do nothing
  }
  window.history.pushState({}, '', path);
  // Dispatch a popstate event to which the App component listens, triggering a re-render.
  window.dispatchEvent(new PopStateEvent('popstate'));
};
