import React from 'react';
import {
  HEAD_SHAPES, HAIR_STYLES, HAIR_COLORS, SKIN_COLORS,
  EYE_STYLES, MOUTH_STYLES, ACCESSORIES, OUTFIT_STYLES,
  HELD_ITEMS, PET_STYLES, DEFAULT_AVATAR,
} from '../constants/avatarParts';

function Avatar({ config, size = 40, showBody = false, className = '' }) {
  const c = { ...DEFAULT_AVATAR, ...config };

  const skinHex = SKIN_COLORS.find(s => s.id === c.skinColor)?.color || '#c68642';
  const hairHex = HAIR_COLORS.find(h => h.id === c.hairColor)?.color || '#5c3317';
  const outfitColor = c.outfitColor || '#00d4aa';

  const headFn = HEAD_SHAPES[c.head] || HEAD_SHAPES.round;
  const hairFn = HAIR_STYLES[c.hair] || HAIR_STYLES.short;
  const eyeFn = EYE_STYLES[c.eyes] || EYE_STYLES.normal;
  const mouthFn = MOUTH_STYLES[c.mouth] || MOUTH_STYLES.smile;
  const accessoryFn = ACCESSORIES[c.accessory] || ACCESSORIES.none;
  const outfitFn = OUTFIT_STYLES[c.outfit] || OUTFIT_STYLES.basic;
  const heldItemFn = HELD_ITEMS[c.heldItem] || HELD_ITEMS.none;
  const petFn = PET_STYLES[c.pet] || PET_STYLES.none;

  const hasPet = c.pet && c.pet !== 'none';
  const hasHeldItem = c.heldItem && c.heldItem !== 'none';

  // Extend viewBox based on what's shown
  let vbHeight = 48; // face only
  if (showBody) {
    vbHeight = 70; // body with legs
    if (hasPet || hasHeldItem) vbHeight = 78; // extra room for pets/items
  }

  return (
    <svg
      viewBox={`0 0 64 ${vbHeight}`}
      width={size}
      height={size * (vbHeight / 64)}
      className={`avatar-svg ${className}`}
    >
      {/* Pet behind body */}
      {showBody && petFn()}

      {/* Cape/outfit behind body */}
      {showBody && outfitFn(outfitColor)}

      {/* Head */}
      {headFn(skinHex)}

      {/* Hair */}
      {hairFn(hairHex)}

      {/* Eyes */}
      {eyeFn()}

      {/* Mouth */}
      {mouthFn()}

      {/* Accessories (head level) */}
      {accessoryFn(outfitColor)}

      {/* Held item */}
      {showBody && heldItemFn(outfitColor)}
    </svg>
  );
}

// Wrapper that falls back to photo/letter if no avatar config
function AvatarOrPhoto({ user, size = 40, showBody = false, className = '' }) {
  if (user?.avatar && user.avatar.head) {
    return <Avatar config={user.avatar} size={size} showBody={showBody} className={className} />;
  }

  if (user?.photoURL) {
    return <img src={user.photoURL} alt="" className={className} style={{ width: size, height: size, borderRadius: '50%', objectFit: 'cover' }} />;
  }

  return (
    <div
      className={className}
      style={{
        width: size, height: size, borderRadius: '50%',
        background: 'linear-gradient(135deg, var(--accent-primary), #00b894)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        fontWeight: 700, color: 'var(--bg-dark)', fontSize: size * 0.4,
      }}
    >
      {user?.name?.charAt(0)?.toUpperCase() || '?'}
    </div>
  );
}

export { Avatar, AvatarOrPhoto };
export default AvatarOrPhoto;
