import React from 'react';

export const UnderlineIcon: React.FC<React.SVGProps<SVGSVGElement>> = (props) => (
  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" {...props}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M4 8h16M4 16h16" />
    <path strokeLinecap="round" strokeLinejoin="round" d="M6 12h12V8H6v4z" />
    <path strokeLinecap="round" strokeLinejoin="round" d="M8 8V4h8v4" />
  </svg>
);