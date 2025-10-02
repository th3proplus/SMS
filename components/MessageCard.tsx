import React, { useState } from 'react';
// FIX: Add .ts extension for module resolution
import type { SMSMessage } from '../types.ts';
import { CopyIcon } from './icons/CopyIcon.tsx';
import { timeAgo } from '../utils/time.ts';

interface MessageCardProps {
  message: SMSMessage;
}

const MessageCard: React.FC<MessageCardProps> = ({ message }) => {
  const [copied, setCopied] = useState(false);

  const handleCopy = () => {
    navigator.clipboard.writeText(message.body).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  };

  return (
    <div className="bg-slate-100 dark:bg-slate-900/70 p-4 rounded-lg shadow-md border border-slate-200 dark:border-slate-700/50 relative overflow-hidden transition-transform hover:scale-[1.01]">
        <div className="absolute top-2 right-2">
            <button
                onClick={handleCopy}
                className="p-2 rounded-full bg-slate-200 dark:bg-slate-700/50 hover:bg-slate-300 dark:hover:bg-slate-600/50 text-slate-500 dark:text-slate-400 hover:text-teal-500 dark:hover:text-teal-400 transition-colors"
                title="Copy message body"
            >
                <CopyIcon className="w-5 h-5" />
                {copied && <span className="absolute -top-7 -left-5 text-xs bg-teal-500 text-white rounded px-2 py-1">Copied!</span>}
            </button>
        </div>
        <div className="flex justify-between items-center mb-2">
            <p className="text-sm font-semibold text-slate-500 dark:text-slate-400">
                From: <span className="font-bold text-slate-700 dark:text-slate-200">{message.from}</span>
            </p>
            <p className="text-xs text-slate-400 dark:text-slate-500">{timeAgo(message.receivedAt)}</p>
        </div>
        <p className="text-base text-slate-700 dark:text-slate-300 whitespace-pre-wrap break-words pr-12">
            {message.body}
        </p>
    </div>
  );
};

export default MessageCard;
