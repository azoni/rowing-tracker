import React from 'react';

// Crossed hatchet blades, the oldest sign of a rowing club, drawn as one mark.
export function CrewMark() {
  const oar = <>
    <path d="M16 30.5V11" strokeWidth="1.7" strokeLinecap="round" />
    <path d="M14.6 12.2V3.4c0-1.1.8-1.9 1.9-1.8l3.2.5c.9.1 1.5.9 1.4 1.8l-.7 7.5c-.1.8-.8 1.4-1.6 1.4h-2.6c-.9 0-1.6-.3-1.6-.6Z"
      fill="currentColor" stroke="none" />
  </>;
  return <svg className="crew-mark" viewBox="0 0 32 32" fill="none" stroke="currentColor" aria-hidden="true" focusable="false">
    <g transform="rotate(-30 16 16)">{oar}</g>
    <g transform="rotate(30 16 16) translate(32 0) scale(-1 1)">{oar}</g>
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
