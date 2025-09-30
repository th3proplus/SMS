import React from 'react';
import { AdminIcon } from './icons/AdminIcon';

interface HeaderProps {
    title: string;
    description: string;
    showAdminLink?: boolean;
}

const Header: React.FC<HeaderProps> = ({ title, description, showAdminLink = false }) => {
  return (
    <header className="bg-white dark:bg-slate-800 shadow-md">
      <div className="container mx-auto px-4 py-4 flex justify-between items-center">
        <div>
            <h1 className="text-2xl font-bold text-teal-500 dark:text-teal-400 tracking-wider">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-7 w-7 inline-block mr-2 -mt-1" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M18 5v8a2 2 0 01-2 2h-5l-5 4v-4H4a2 2 0 01-2-2V5a2 2 0 012-2h12a2 2 0 012 2zM7 8H5v2h2V8zm2 0h2v2H9V8zm6 0h-2v2h2V8z" clipRule="evenodd" />
            </svg>
            {title}
            </h1>
            <p className="text-slate-500 dark:text-slate-400 text-sm mt-1">{description}</p>
        </div>
        {showAdminLink && (
             <a
                href="/login"
                className="flex items-center gap-2 p-2 rounded-md text-slate-500 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-700 hover:text-teal-500 dark:hover:text-teal-400 transition-colors"
                aria-label="Admin Login"
                title="Admin Login"
            >
                <AdminIcon className="w-5 h-5" />
                <span className="text-sm font-medium">Admin Panel</span>
            </a>
        )}
      </div>
    </header>
  );
};

export default Header;