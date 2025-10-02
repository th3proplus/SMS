import React from 'react';
// FIX: Add .ts extension for module resolution
import type { PhoneNumber } from '../types.ts';
import PhoneNumberCard from './PhoneNumberCard.tsx';

interface PhoneNumberListProps {
  numbers: PhoneNumber[];
}

const PhoneNumberList: React.FC<PhoneNumberListProps> = ({ numbers }) => {
  if (numbers.length === 0) {
    return (
      <p className="col-span-full text-center text-slate-500 dark:text-slate-400 p-10">
        No phone numbers available.
      </p>
    );
  }

  return (
    <div>
      {numbers.map((number) => (
        <div key={number.id} className="border-b border-slate-200 dark:border-slate-700/50 last:border-b-0">
          <PhoneNumberCard number={number} />
        </div>
      ))}
    </div>
  );
};

export default PhoneNumberList;
