import { getSettings } from './settingsService';
import type { BlogPost } from '../types';

// FIX: Add and export demo posts to be used as a fallback.
export const demoPosts: BlogPost[] = [
    {
        id: 1,
        title: 'How to Use Temporary Numbers for Online Privacy',
        link: '#',
        excerpt: 'Learn the best practices for using temporary phone numbers to safeguard your personal information on various online platforms and services.',
        date: new Date(Date.now() - 1000 * 60 * 60 * 24 * 2), // 2 days ago
        featuredImageUrl: 'https://images.unsplash.com/photo-1554224155-169544351720?q=80&w=1000&auto=format&fit=crop',
    },
    {
        id: 2,
        title: 'Top 5 Reasons to Use a Free SMS Receiver',
        link: '#',
        excerpt: 'From avoiding spam to protecting your identity, discover the key benefits of using a free online SMS receiver for your verification needs.',
        date: new Date(Date.now() - 1000 * 60 * 60 * 24 * 7), // 1 week ago
        featuredImageUrl: 'https://images.unsplash.com/photo-1604782206214-f535272a1b9f?q=80&w=1000&auto=format&fit=crop',
    },
    {
        id: 3,
        title: 'Understanding SIM Swapping and How to Prevent It',
        link: '#',
        excerpt: 'A deep dive into the security threat of SIM swapping and how using a temporary number can be one of the simplest ways to protect yourself.',
        date: new Date(Date.now() - 1000 * 60 * 60 * 24 * 15), // 15 days ago
        featuredImageUrl: 'https://images.unsplash.com/photo-1614099232822-2139046a60d0?q=80&w=1000&auto=format&fit=crop',
    },
];

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