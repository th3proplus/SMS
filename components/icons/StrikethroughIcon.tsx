import React from 'react';

export const StrikethroughIcon: React.FC<React.SVGProps<SVGSVGElement>> = (props) => (
  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" {...props}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M4 12h16" />
    <path strokeLinecap="round" strokeLinejoin="round" d="M7 4.5s1.5 4.5 5 4.5 5-4.5 5-4.5" />
    <path strokeLinecap="round" strokeLinejoin="round" d="M7 19.5s1.5-4.5 5-4.5 5 4.5 5 4.5" />
  </svg>
);