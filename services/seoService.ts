export const updateMetadata = (
    { title, description, path }: 
    { title: string; description: string; path: string }
): void => {
    const origin = window.location.origin;
    const canonicalUrl = `${origin}${path}`;

    // Update Title
    document.title = title;

    const updateMetaTag = (identifier: 'name' | 'property', value: string, content: string) => {
        let tag = document.querySelector(`meta[${identifier}="${value}"]`);
        if (!tag) {
            tag = document.createElement('meta');
            tag.setAttribute(identifier, value);
            document.head.appendChild(tag);
        }
        tag.setAttribute('content', content);
    };

    const updateLinkTag = (rel: string, href: string) => {
        let tag = document.querySelector(`link[rel="${rel}"]`);
        if (!tag) {
            tag = document.createElement('link');
            tag.setAttribute('rel', rel);
            document.head.appendChild(tag);
        }
        tag.setAttribute('href', href);
    };

    // Update Meta Description
    updateMetaTag('name', 'description', description);

    // Update Canonical URL
    updateLinkTag('canonical', canonicalUrl);
    
    // Update Open Graph & Twitter tags
    updateMetaTag('property', 'og:title', title);
    updateMetaTag('property', 'og:description', description);
    updateMetaTag('property', 'og:url', canonicalUrl);
    updateMetaTag('property', 'twitter:title', title);
    updateMetaTag('property', 'twitter:description', description);
    updateMetaTag('property', 'twitter:url', canonicalUrl);
};
