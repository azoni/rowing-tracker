import React from 'react';

// An original overhead shell mark: a narrow hull, four seats, and paired oars.
export function CrewMark() {
  return <svg className="crew-mark" viewBox="0 0 48 48" fill="none" aria-hidden="true" focusable="false">
    <path d="M24 3c-4 8-4 34 0 42 4-8 4-34 0-42Z" stroke="currentColor" strokeWidth="1.5" />
    {[15, 22, 29, 36].map(y => <g key={y} stroke="currentColor" strokeLinecap="round">
      <path d={`M22 ${y} 9 ${y - 8}m17 8 13-8`} strokeWidth="1.4" />
      <path d={`m9 ${y - 8}-3-2m33 2 3-2`} strokeWidth="3" />
      <path d={`M23 ${y}h2`} strokeWidth="2" />
    </g>)}
  </svg>;
}

export function CrewArtwork() {
  const base = `${process.env.PUBLIC_URL || ''}/images/crew-on-water`;
  return <div className="crew-artwork" aria-hidden="true">
    <img src={`${base}-768.webp`} srcSet={`${base}-768.webp 768w, ${base}-1536.webp 1536w`}
      sizes="(min-width: 800px) 480px, (min-width: 600px) 740px, 100vw" width="1536" height="1024"
      alt="" decoding="async" fetchpriority="high" />
  </div>;
}
