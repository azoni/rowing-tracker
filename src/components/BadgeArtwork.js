import React from 'react';
import './BadgeArtwork.css';

// One shared image request for the whole collection. The generated sheet has
// optical spacing rather than exact grid registration; these viewports preserve
// every complete medal without clipping a neighboring piece of artwork.
const MEDAL_CELLS = {
  distance: [38, 18], sessions: [431, 18], streaks: [824, 18],
  time: [38, 412], calories: [431, 412], pace: [824, 412],
  habits: [38, 805], fun: [431, 805], milestones: [824, 805],
};

export default function BadgeArtwork({ achievement = {}, size = 80, className = '' }) {
  const [x, y] = MEDAL_CELLS[achievement.category] || MEDAL_CELLS.milestones;
  return <span className={`badge-artwork ${className}`} aria-hidden="true" style={{
    width: size, height: size,
    backgroundImage: `url("${process.env.PUBLIC_URL || ''}/images/crew-medals.webp")`,
    backgroundSize: `${1260 / 394 * 100}%`,
    backgroundPosition: `${x / (1260 - 394) * 100}% ${y / (1260 - 394) * 100}%`,
  }} />;
}
