import { getSettings } from './settingsService';
import type { BlogPost } from '../types';

const cleanHtmlAndTrim = (html: string): string => {
    const doc = new DOMParser().parseFromString(html, 'text/html');
    let text = doc.body.textContent || "";
    // WP excerpts often end with "[&hellip;]"
    text = text.replace(/\[&hellip;\]$/, '').trim();
    if (text.length > 120) {
        return text.substring(0, 120) + '...';
    }
    return text;
};

export const getLatestPosts = async (count: number = 3): Promise<BlogPost[]> => {
    const { wordpressUrl, enableBlogSection } = getSettings();
    if (!enableBlogSection || !wordpressUrl) {
        return [];
    }

    try {
        const url = new URL(wordpressUrl.trim());
        const apiUrl = `${url.origin}/wp-json/wp/v2/posts?per_page=${count}&_embed=true`;

        const response = await fetch(apiUrl);
        if (!response.ok) {
            throw new Error(`Failed to fetch posts from WordPress API. Status: ${response.status}`);
        }

        const postsData = await response.json();

        return postsData.map((post: any): BlogPost => ({
            id: post.id,
            title: post.title.rendered,
            link: post.link,
            excerpt: cleanHtmlAndTrim(post.excerpt.rendered),
            date: new Date(post.date),
            featuredImageUrl: post._embedded?.['wp:featuredmedia']?.[0]?.source_url,
        }));

    } catch (error) {
        console.error("Error fetching WordPress posts:", error);
        // Rethrow the error so the UI can display a message
        throw error;
    }
};
