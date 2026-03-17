import React from 'react';
import { ICONS } from '../constants/iconMap';

function Icon({ name, size = 20, className = '', color, style = {} }) {
  // Default to theme accent color via CSS variable, fallback to teal
  const resolvedColor = color || 'var(--accent-primary, #00d4aa)';
  const icon = ICONS[name];

  // Fallback: render the key string (graceful degradation for unmapped icons)
  if (!icon) {
    return <span className={`icon-fallback ${className}`} style={{ fontSize: size * 0.8, ...style }}>{name}</span>;
  }

  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={`icon ${className}`}
      style={style}
      role="img"
      aria-hidden="true"
    >
      {typeof icon === 'string' ? (
        <path d={icon} fill={resolvedColor} />
      ) : (
        icon(resolvedColor)
      )}
    </svg>
  );
}

export default Icon;
