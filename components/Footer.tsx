import React from 'react';
// FIX: Add .ts extension for module resolution
import type { FooterLink } from '../types.ts';

interface FooterProps {
  text: string;
  links: FooterLink[];
}

const Footer: React.FC<FooterProps> = ({ text, links }) => {
  return (
    <footer className="bg-white dark:bg-slate-800 border-t border-slate-200 dark:border-slate-700/50 mt-auto">
      <div className="container mx-auto px-4 py-4 flex flex-col sm:flex-row justify-between items-center text-sm">
        <p className="text-slate-500 dark:text-slate-400 mb-2 sm:mb-0">
          {text}
        </p>
        <nav className="flex items-center gap-4">
          {links.map((link) => (
            <a 
              key={link.text} 
              href={link.url} 
              className="text-slate-500 dark:text-slate-400 hover:text-teal-600 dark:hover:text-teal-400 transition-colors"
            >
              {link.text}
            </a>
          ))}
        </nav>
      </div>
    </footer>
  );
};

export default Footer;
