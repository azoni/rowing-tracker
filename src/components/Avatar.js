import React from 'react';
import {
  HEAD_SHAPES, HAIR_STYLES, HAIR_COLORS, SKIN_COLORS,
  EYE_STYLES, MOUTH_STYLES, ACCESSORIES, BODY, DEFAULT_AVATAR,
} from '../constants/avatarParts';

function Avatar({ config, size = 40, showBody = false, className = '' }) {
  const c = config || DEFAULT_AVATAR;

  const skinHex = SKIN_COLORS.find(s => s.id === c.skinColor)?.color || '#c68642';
  const hairHex = HAIR_COLORS.find(h => h.id === c.hairColor)?.color || '#5c3317';

  const headFn = HEAD_SHAPES[c.head] || HEAD_SHAPES.round;
  const hairFn = HAIR_STYLES[c.hair] || HAIR_STYLES.short;
  const eyeFn = EYE_STYLES[c.eyes] || EYE_STYLES.normal;
  const mouthFn = MOUTH_STYLES[c.mouth] || MOUTH_STYLES.smile;
  const accessoryFn = ACCESSORIES[c.accessory] || ACCESSORIES.none;

  const vbHeight = showBody ? 56 : 48;

  return (
    <svg
      viewBox={`0 0 64 ${vbHeight}`}
      width={size}
      height={size * (vbHeight / 64)}
      className={`avatar-svg ${className}`}
    >
      {/* Body (optional) */}
      {showBody && BODY(c.outfitColor || '#00d4aa')}

      {/* Head */}
      {headFn(skinHex)}

      {/* Hair (behind accessories) */}
      {hairFn(hairHex)}

      {/* Eyes */}
      {eyeFn()}

      {/* Mouth */}
      {mouthFn()}

      {/* Accessories */}
      {accessoryFn(c.outfitColor)}
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
