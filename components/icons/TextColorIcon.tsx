import React from 'react';

export const TextColorIcon: React.FC<React.SVGProps<SVGSVGElement>> = (props) => (
  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" {...props}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 6.75h15" />
    <path strokeLinecap="round" strokeLinejoin="round" d="M12 6.75v10.5" />
    <path strokeLinecap="round" strokeLinejoin="round" d="M5.25 19.5h13.5" strokeWidth={4} />
  </svg>
);
