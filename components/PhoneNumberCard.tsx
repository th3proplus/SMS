import React from 'react';
import type { PhoneNumber } from '../types';
import { timeAgo } from '../utils/time';
import { ClockIcon } from './icons/ClockIcon';
import { ArrowRightIcon } from './icons/ArrowRightIcon';

interface PhoneNumberCardProps {
  number: PhoneNumber;
}

const PhoneNumberCard: React.FC<PhoneNumberCardProps> = ({ number }) => {
    
  return (
    <a
      href={`/number/${encodeURIComponent(number.number)}`}
      className="group bg-white dark:bg-slate-800 rounded-xl shadow-md hover:shadow-lg dark:hover:shadow-teal-900/30 border border-slate-200 dark:border-slate-700 transition-all duration-300 transform hover:-translate-y-1 flex flex-col p-5 h-full"
    >
      {/* Top: Flag and Country */}
      <div className="flex items-center gap-3 mb-4">
        {number.countryCode ? (
            <img 
              src={`https://flagcdn.com/w40/${number.countryCode.toLowerCase()}.png`} 
              alt={`${number.country} flag`} 
              className="w-8 h-auto rounded-md shadow"
            />
        ) : (
            <div 
                className="w-8 h-5 bg-slate-200 dark:bg-slate-700 rounded-md shadow flex items-center justify-center flex-shrink-0" 
                title="Country not specified"
            >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-slate-400 dark:text-slate-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M21 12a9 9 0 01-9 9m9-9a9 9 0 00-9-9m9 9H3m9 9a9 9 0 01-9-9m9 9V3" />
                </svg>
            </div>
        )}
        <p className="text-sm font-semibold text-slate-600 dark:text-slate-300">{number.country}</p>
      </div>

      {/* Middle: Number */}
      <div className="flex-grow my-2">
        <p className="font-mono font-bold text-2xl text-slate-800 dark:text-slate-100 group-hover:text-teal-600 dark:group-hover:text-teal-400 transition-colors">
          {number.number}
        </p>
      </div>
      
      {/* Bottom: Last message and CTA */}
      <div className="flex items-center justify-between border-t border-slate-200 dark:border-slate-700 pt-4 mt-auto">
        <div className="flex items-center gap-2 text-xs text-slate-500 dark:text-slate-400">
            <ClockIcon className="w-3.5 h-3.5" />
            <span>{timeAgo(number.lastMessageAt)}</span>
        </div>
        <div className="flex items-center gap-1.5 font-semibold text-sm text-teal-600 dark:text-teal-500">
          <span>View SMS</span>
          <ArrowRightIcon className="w-4 h-4 transition-transform group-hover:translate-x-1" />
        </div>
      </div>
    </a>
  );
};

export default PhoneNumberCard;