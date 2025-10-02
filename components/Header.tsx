import React, { useState } from 'react';
// FIX: Add .ts extension for module resolution
import type { FooterLink } from '../types.ts';
import { AdminIcon } from './icons/AdminIcon.tsx';
import { MenuIcon } from './icons/MenuIcon.tsx';
import { XIcon } from './icons/XIcon.tsx';

interface HeaderProps {
    title: string;
    links: FooterLink[];
    showAdminLink?: boolean;
}

const Header: React.FC<HeaderProps> = ({ title, links = [], showAdminLink = false }) => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  return (
    <header className="bg-white/80 dark:bg-slate-900/80 backdrop-blur-sm border-b border-slate-200 dark:border-slate-700 sticky top-0 z-20">
      <div className="container mx-auto px-4">
        <div className="flex justify-between items-center py-3">
            {/* Left side: Logo */}
            <a href="/" className="flex items-center gap-3 group" aria-label="Homepage">
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-7 h-7 text-slate-400 dark:text-slate-500 group-hover:text-teal-500 dark:group-hover:text-teal-400 transition-colors duration-300">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M8.625 9.75a.375.375 0 11-.75 0 .375.375 0 01.75 0zm0 0H8.25m4.125 0a.375.375 0 11-.75 0 .375.375 0 01.75 0zm0 0H12m4.125 0a.375.375 0 11-.75 0 .375.375 0 01.75 0zm0 0h-.375m-13.5 3.01c0 1.6 1.123 2.994 2.707 3.227 1.087.16 2.185.283 3.293.369V21l4.184-4.183a1.14 1.14 0 01.778-.332 48.294 48.294 0 005.83-.498c1.585-.233 2.708-1.626 2.708-3.228V6.741c0-1.602-1.123-2.995-2.707-3.228A48.394 48.394 0 0012 3c-2.392 0-4.744.175-7.043.513C3.373 3.746 2.25 5.14 2.25 6.741v6.018z" />
                </svg>
                <h1 className="text-xl font-bold text-slate-800 dark:text-slate-100 tracking-tight">
                  {title}
                </h1>
            </a>
          
            {/* Right side: Navigation and Actions */}
            <div className="flex items-center gap-2">
                {/* Desktop Navigation */}
                <nav className="hidden md:flex items-center gap-6">
                    {links.map((link) => (
                        <a key={link.text} href={link.url} className="text-sm font-medium text-slate-600 dark:text-slate-300 hover:text-teal-600 dark:hover:text-teal-400 transition-colors">
                            {link.text}
                        </a>
                    ))}
                    {showAdminLink && (
                        <a
                            href="/login"
                            className="flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 hover:text-teal-600 dark:hover:text-teal-400 transition-colors"
                            aria-label="Admin Panel"
                            title="Admin Panel"
                        >
                            <AdminIcon className="w-5 h-5" />
                            <span className="hidden sm:inline">Admin Panel</span>
                        </a>
                    )}
                </nav>
                
                {/* Mobile Menu Button */}
                <button
                    onClick={() => setIsMenuOpen(!isMenuOpen)}
                    className="md:hidden p-2 rounded-md text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 focus:outline-none focus:ring-2 focus:ring-inset focus:ring-teal-500"
                    aria-expanded={isMenuOpen}
                    aria-controls="mobile-menu"
                >
                    <span className="sr-only">Open main menu</span>
                    {isMenuOpen ? <XIcon className="h-6 w-6" /> : <MenuIcon className="h-6 w-6" />}
                </button>
            </div>
        </div>

        {/* Mobile Menu */}
        <div className={`${isMenuOpen ? 'block' : 'hidden'} md:hidden`} id="mobile-menu">
            <nav className="px-2 pt-2 pb-4 space-y-1 border-t border-slate-200 dark:border-slate-700">
                {links.map((link) => (
                    <a
                        key={link.text}
                        href={link.url}
                        className="block px-3 py-2 rounded-md text-base font-medium text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 hover:text-teal-600 dark:hover:text-teal-400"
                    >
                        {link.text}
                    </a>
                ))}
                {showAdminLink && (
                    <a
                        href="/login"
                        className="flex items-center gap-3 px-3 py-2 rounded-md text-base font-medium text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 hover:text-teal-600 dark:hover:text-teal-400"
                    >
                        <AdminIcon className="w-5 h-5" />
                        <span>Admin Panel</span>
                    </a>
                )}
            </nav>
        </div>
      </div>
    </header>
  );
};

export default Header;
