import React from 'react';
// FIX: Add .ts extension for module resolution
import type { BlogPost } from '../types.ts';

const BlogPostCard: React.FC<{ post: BlogPost }> = ({ post }) => {
    return (
        <a 
            href={`/blog/${post.slug}`}
            className="group bg-white dark:bg-slate-800 rounded-xl shadow-md hover:shadow-lg dark:hover:shadow-teal-900/30 border border-slate-200 dark:border-slate-700 transition-all duration-300 transform hover:-translate-y-1 flex flex-col overflow-hidden"
        >
            {post.featuredImageUrl ? (
                <div className="h-40 overflow-hidden">
                     <img src={post.featuredImageUrl} alt={post.title} className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105" />
                </div>
            ) : (
                <div className="h-40 bg-slate-200 dark:bg-slate-700 flex items-center justify-center">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-12 w-12 text-slate-400 dark:text-slate-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                    </svg>
                </div>
            )}
            <div className="p-5 flex flex-col flex-grow">
                <p className="text-xs text-slate-500 dark:text-slate-400 mb-2">{new Date(post.publishedAt).toLocaleDateString(undefined, { year: 'numeric', month: 'long', day: 'numeric' })}</p>
                <h3 className="text-lg font-bold text-slate-800 dark:text-slate-100 group-hover:text-teal-600 dark:group-hover:text-teal-400 transition-colors flex-grow">
                    {post.title}
                </h3>
                <p className="text-sm text-slate-600 dark:text-slate-300 mt-2 line-clamp-3">
                    {post.excerpt}
                </p>
            </div>
        </a>
    );
};

interface BlogSectionProps {
    posts: BlogPost[];
}

const BlogSection: React.FC<BlogSectionProps> = ({ posts }) => {
    if (posts.length === 0) {
        return null; // Don't render anything if there are no posts
    }

    return (
        <div className="py-8 md:py-12 border-t border-slate-200 dark:border-slate-700 mt-8">
            <div className="flex justify-between items-center mb-8">
                <h2 className="text-3xl font-bold text-slate-800 dark:text-slate-200 tracking-tight">
                    From Our Blog
                </h2>
                <a href="/blog" className="text-sm font-semibold text-teal-600 dark:text-teal-400 hover:underline">
                    View All Posts &rarr;
                </a>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {posts.map(post => (
                    <BlogPostCard key={post.id} post={post} />
                ))}
            </div>
        </div>
    );
};

export default BlogSection;
