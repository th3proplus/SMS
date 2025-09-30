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
      className="group block p-4 hover:bg-slate-50 dark:hover:bg-slate-800/80 cursor-pointer transition-colors duration-200"
    >
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between">
        {/* Left Part: Flag, Number, Country */}
        <div className="flex items-center gap-4 mb-3 sm:mb-0">
          {number.countryCode ? (
              <img 
                src={`https://flagcdn.com/w40/${number.countryCode.toLowerCase()}.png`} 
                alt={`${number.country} flag`} 
                className="w-10 h-auto rounded-md shadow flex-shrink-0"
              />
          ) : (
              <div 
                  className="w-10 h-6 bg-slate-200 dark:bg-slate-700 rounded-md shadow flex items-center justify-center flex-shrink-0" 
                  title="Country not specified"
              >
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-slate-400 dark:text-slate-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M21 12a9 9 0 01-9 9m9-9a9 9 0 00-9-9m9 9H3m9 9a9 9 0 01-9-9m9 9V3" />
                  </svg>
              </div>
          )}
          <div>
            <p className="font-mono font-bold text-lg text-slate-800 dark:text-slate-100 group-hover:text-teal-600 dark:group-hover:text-teal-400 transition-colors">
              {number.number}
            </p>
            <p className="text-sm text-slate-500 dark:text-slate-400">{number.country}</p>
          </div>
        </div>

        {/* Right Part: Last Message & View Button */}
        <div className="w-full sm:w-auto flex items-center justify-between pl-1 sm:pl-0">
            <div className="flex items-center gap-2 text-sm text-slate-500 dark:text-slate-400 sm:mr-6">
                <ClockIcon className="w-4 h-4" />
                <span>{timeAgo(number.lastMessageAt)}</span>
            </div>
            <div className="flex items-center gap-2 font-semibold text-teal-600 dark:text-teal-500">
              <span>View Messages</span>
              <ArrowRightIcon className="w-4 h-4 transition-transform group-hover:translate-x-1" />
            </div>
        </div>
      </div>
    </a>
  );
};

export default PhoneNumberCard;