import React from 'react';
// FIX: Add .ts extension for module resolution
import type { SMSMessage } from '../types.ts';
import MessageCard from './MessageCard.tsx';

interface MessageListProps {
  messages: SMSMessage[];
}

const MessageList: React.FC<MessageListProps> = ({ messages }) => {
  if (messages.length === 0) {
    return (
      <div className="text-center p-10">
        <p className="text-slate-500 dark:text-slate-400">No messages to display.</p>
      </div>
    );
  }

  return (
    <div className="space-y-4 p-4">
      {messages.map((message) => (
        <MessageCard key={message.id} message={message} />
      ))}
    </div>
  );
};

export default MessageList;
