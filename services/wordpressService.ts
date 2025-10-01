import { getSettings } from './settingsService';
import type { BlogPost } from '../types';

export const demoPosts: BlogPost[] = [
    {
        id: 9991,
        title: 'How to Protect Your Privacy Online',
        link: '#',
        excerpt: 'In an increasingly digital world, safeguarding your personal information is more important than ever. Learn our top tips for enhancing your online privacy using temporary numbers.',
        date: new Date(Date.now() - 1000 * 60 * 60 * 24 * 2), // 2 days ago
        featuredImageUrl: 'https://images.unsplash.com/photo-1562813733-b31f71025d54?q=80&w=1080&auto=format&fit=crop',
    },
    {
        id: 9992,
        title: 'Top 5 Use Cases for a Virtual Phone Number',
        link: '#',
        excerpt: 'Virtual phone numbers are not just for verification. Discover five creative and practical ways you can use them in your daily life, from business to online dating.',
        date: new Date(Date.now() - 1000 * 60 * 60 * 24 * 5), // 5 days ago
        featuredImageUrl: 'https://images.unsplash.com/photo-1586953208448-3151cf_25948?q=80&w=1080&auto=format&fit=crop',
    },
    {
        id: 9993,
        title: 'Understanding SMS: A Quick Guide',
        link: '#',
        excerpt: "Ever wondered how SMS technology works? This quick guide breaks down the basics of text messaging, from its history to its impact on modern communication.",
        date: new Date(Date.now() - 1000 * 60 * 60 * 24 * 10), // 10 days ago
        featuredImageUrl: 'https://images.unsplash.com/photo-1611162617474-5b21e879e113?q=80&w=1080&auto=format&fit=crop',
    }
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