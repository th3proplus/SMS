import React from 'react';

export const TextColorIcon: React.FC<React.SVGProps<SVGSVGElement>> = (props) => (
  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" {...props}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M4 4h16" />
    <path strokeLinecap="round" strokeLinejoin="round" d="M4 20h16v-2H4v2z" />
    <path strokeLinecap="round" strokeLinejoin="round" d="M9.75 4L12 16l2.25-12" />
  </svg>
);