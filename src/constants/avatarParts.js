// Composable SVG avatar parts — cartoon/chibi style
// All paths designed for a 64x64 viewBox
// Each part is a function that returns JSX with the given colors

export const SKIN_COLORS = [
  { id: 'light', color: '#fde0c4', label: 'Light' },
  { id: 'fair', color: '#e8b88a', label: 'Fair' },
  { id: 'medium', color: '#c68642', label: 'Medium' },
  { id: 'tan', color: '#a0622e', label: 'Tan' },
  { id: 'brown', color: '#7a4420', label: 'Brown' },
  { id: 'dark', color: '#4a2912', label: 'Dark' },
];

export const HEAD_SHAPES = {
  round: (skin) => (
    <circle cx="32" cy="28" r="18" fill={skin} stroke={darken(skin)} strokeWidth="0.5" />
  ),
  oval: (skin) => (
    <ellipse cx="32" cy="28" rx="16" ry="19" fill={skin} stroke={darken(skin)} strokeWidth="0.5" />
  ),
  square: (skin) => (
    <rect x="15" y="10" width="34" height="36" rx="8" fill={skin} stroke={darken(skin)} strokeWidth="0.5" />
  ),
  wide: (skin) => (
    <ellipse cx="32" cy="28" rx="19" ry="17" fill={skin} stroke={darken(skin)} strokeWidth="0.5" />
  ),
};

export const HAIR_STYLES = {
  none: () => null,
  short: (color) => (
    <path d="M16,22 C16,12 22,6 32,6 C42,6 48,12 48,22 C48,18 44,10 32,10 C20,10 16,18 16,22 Z" fill={color} />
  ),
  medium: (color) => (
    <path d="M14,24 C14,10 22,4 32,4 C42,4 50,10 50,24 C50,18 46,8 32,8 C18,8 14,18 14,24 Z M14,24 L12,34 C12,34 14,28 16,26 Z M50,24 L52,34 C52,34 50,28 48,26 Z" fill={color} />
  ),
  long: (color) => (
    <path d="M14,24 C14,10 22,4 32,4 C42,4 50,10 50,24 L52,44 C52,44 50,38 48,34 L48,26 C48,18 44,8 32,8 C20,8 16,18 16,26 L16,34 C14,38 12,44 12,44 Z" fill={color} />
  ),
  buzz: (color) => (
    <path d="M16,24 C16,14 22,8 32,8 C42,8 48,14 48,24 C48,20 44,12 32,12 C20,12 16,20 16,24 Z" fill={color} opacity="0.7" />
  ),
  mohawk: (color) => (
    <path d="M28,4 C28,4 30,2 32,2 C34,2 36,4 36,4 L36,18 C36,18 34,16 32,16 C30,16 28,18 28,18 Z" fill={color} />
  ),
  bun: (color) => (
    <>
      <path d="M16,22 C16,12 22,6 32,6 C42,6 48,12 48,22 C48,18 44,10 32,10 C20,10 16,18 16,22 Z" fill={color} />
      <circle cx="32" cy="6" r="5" fill={color} />
    </>
  ),
  cap: (color) => (
    <>
      <path d="M14,22 C14,14 22,8 32,8 C42,8 50,14 50,22 L50,24 L14,24 Z" fill={color} />
      <rect x="12" y="22" width="26" height="3" rx="1" fill={darken(color)} />
    </>
  ),
  headband: (color) => (
    <rect x="14" y="16" width="36" height="4" rx="2" fill={color} />
  ),
};

export const HAIR_COLORS = [
  { id: 'black', color: '#1a1a1a', label: 'Black' },
  { id: 'brown', color: '#5c3317', label: 'Brown' },
  { id: 'blonde', color: '#d4a85c', label: 'Blonde' },
  { id: 'red', color: '#a0522d', label: 'Red' },
  { id: 'gray', color: '#8a8a8a', label: 'Gray' },
  { id: 'blue', color: '#4169e1', label: 'Blue' },
];

export const EYE_STYLES = {
  normal: () => (
    <>
      <circle cx="26" cy="27" r="2.5" fill="#fff" />
      <circle cx="38" cy="27" r="2.5" fill="#fff" />
      <circle cx="26.5" cy="27" r="1.5" fill="#2c3e50" />
      <circle cx="38.5" cy="27" r="1.5" fill="#2c3e50" />
    </>
  ),
  big: () => (
    <>
      <circle cx="25" cy="26" r="4" fill="#fff" />
      <circle cx="39" cy="26" r="4" fill="#fff" />
      <circle cx="26" cy="26" r="2.5" fill="#2c3e50" />
      <circle cx="40" cy="26" r="2.5" fill="#2c3e50" />
      <circle cx="27" cy="25" r="1" fill="#fff" />
      <circle cx="41" cy="25" r="1" fill="#fff" />
    </>
  ),
  sleepy: () => (
    <>
      <line x1="23" y1="27" x2="29" y2="27" stroke="#2c3e50" strokeWidth="1.5" strokeLinecap="round" />
      <line x1="35" y1="27" x2="41" y2="27" stroke="#2c3e50" strokeWidth="1.5" strokeLinecap="round" />
    </>
  ),
  determined: () => (
    <>
      <circle cx="26" cy="27" r="2.5" fill="#fff" />
      <circle cx="38" cy="27" r="2.5" fill="#fff" />
      <circle cx="26.5" cy="27" r="1.5" fill="#2c3e50" />
      <circle cx="38.5" cy="27" r="1.5" fill="#2c3e50" />
      <line x1="23" y1="23" x2="29" y2="24" stroke="#2c3e50" strokeWidth="1" strokeLinecap="round" />
      <line x1="41" y1="23" x2="35" y2="24" stroke="#2c3e50" strokeWidth="1" strokeLinecap="round" />
    </>
  ),
  sunglasses: () => (
    <>
      <rect x="21" y="24" width="10" height="7" rx="2" fill="#1a1a1a" />
      <rect x="33" y="24" width="10" height="7" rx="2" fill="#1a1a1a" />
      <line x1="31" y1="27" x2="33" y2="27" stroke="#1a1a1a" strokeWidth="1" />
      <line x1="21" y1="26" x2="16" y2="24" stroke="#1a1a1a" strokeWidth="1" />
      <line x1="43" y1="26" x2="48" y2="24" stroke="#1a1a1a" strokeWidth="1" />
    </>
  ),
  wink: () => (
    <>
      <circle cx="26" cy="27" r="2.5" fill="#fff" />
      <circle cx="26.5" cy="27" r="1.5" fill="#2c3e50" />
      <path d="M35,27 Q38,24 41,27" stroke="#2c3e50" strokeWidth="1.5" fill="none" strokeLinecap="round" />
    </>
  ),
};

export const MOUTH_STYLES = {
  smile: () => (
    <path d="M27,34 Q32,38 37,34" stroke="#2c3e50" strokeWidth="1.2" fill="none" strokeLinecap="round" />
  ),
  grin: () => (
    <path d="M26,33 Q32,39 38,33 Z" fill="#fff" stroke="#2c3e50" strokeWidth="0.8" />
  ),
  neutral: () => (
    <line x1="28" y1="35" x2="36" y2="35" stroke="#2c3e50" strokeWidth="1.2" strokeLinecap="round" />
  ),
  smirk: () => (
    <path d="M28,34 Q34,37 38,33" stroke="#2c3e50" strokeWidth="1.2" fill="none" strokeLinecap="round" />
  ),
  open: () => (
    <ellipse cx="32" cy="35" rx="4" ry="3" fill="#2c3e50" />
  ),
};

export const ACCESSORIES = {
  none: () => null,
  sweatband: (color) => (
    <rect x="14" y="16" width="36" height="3" rx="1.5" fill={color || '#ff6b35'} />
  ),
  earring_left: () => (
    <circle cx="14" cy="30" r="1.5" fill="#ffd700" />
  ),
  earring_both: () => (
    <>
      <circle cx="14" cy="30" r="1.5" fill="#ffd700" />
      <circle cx="50" cy="30" r="1.5" fill="#ffd700" />
    </>
  ),
  blush: () => (
    <>
      <ellipse cx="22" cy="32" rx="3" ry="2" fill="#ff9999" opacity="0.4" />
      <ellipse cx="42" cy="32" rx="3" ry="2" fill="#ff9999" opacity="0.4" />
    </>
  ),
  scar: () => (
    <line x1="40" y1="22" x2="44" y2="28" stroke="#b87d6b" strokeWidth="1" strokeLinecap="round" />
  ),
};

// Body (shown below head in avatar)
export const BODY = (outfitColor) => (
  <path d="M22,46 C22,42 26,40 32,40 C38,40 42,42 42,46 L42,54 L22,54 Z" fill={outfitColor} stroke={darken(outfitColor)} strokeWidth="0.5" />
);

// Helper: darken a hex color
function darken(hex) {
  if (!hex) return '#000';
  const r = Math.max(0, parseInt(hex.slice(1, 3), 16) - 30);
  const g = Math.max(0, parseInt(hex.slice(3, 5), 16) - 30);
  const b = Math.max(0, parseInt(hex.slice(5, 7), 16) - 30);
  return `#${r.toString(16).padStart(2, '0')}${g.toString(16).padStart(2, '0')}${b.toString(16).padStart(2, '0')}`;
}

// Default avatar config
export const DEFAULT_AVATAR = {
  head: 'round',
  hair: 'short',
  hairColor: 'brown',
  eyes: 'normal',
  mouth: 'smile',
  skinColor: 'medium',
  accessory: 'none',
  outfitColor: '#00d4aa',
};

// Rarity tiers: common (free), uncommon (easy achievement), rare, epic, legendary
export const RARITY_COLORS = {
  common: '#a8b5c9',
  uncommon: '#2ed573',
  rare: '#4169e1',
  epic: '#8b5cf6',
  legendary: '#ffd700',
};

// Cosmetic metadata — maps part type + id to rarity and unlock requirement
// If no entry here, the part is 'common' (free)
// achievementId: the achievement id that unlocks this cosmetic
export const COSMETIC_UNLOCKS = {
  // Hair styles
  hair: {
    none: { rarity: 'common' },
    short: { rarity: 'common' },
    medium: { rarity: 'common' },
    long: { rarity: 'common' },
    buzz: { rarity: 'common' },
    mohawk: { rarity: 'uncommon', achievementId: 'ten_sessions', achievementName: 'Getting Serious' },
    bun: { rarity: 'uncommon', achievementId: 'first_5k', achievementName: '5K Club' },
    cap: { rarity: 'rare', achievementId: 'fifty_sessions', achievementName: 'Dedicated Rower' },
    headband: { rarity: 'rare', achievementId: 'week_streak', achievementName: 'Week Warrior' },
  },
  // Eyes
  eyes: {
    normal: { rarity: 'common' },
    big: { rarity: 'common' },
    sleepy: { rarity: 'common' },
    determined: { rarity: 'uncommon', achievementId: 'first_10k', achievementName: '10K Crusher' },
    sunglasses: { rarity: 'rare', achievementId: 'hundred_k', achievementName: '100K Legend' },
    wink: { rarity: 'uncommon', achievementId: 'marathon', achievementName: 'Marathon Rower' },
  },
  // Mouths
  mouth: {
    smile: { rarity: 'common' },
    grin: { rarity: 'common' },
    neutral: { rarity: 'common' },
    smirk: { rarity: 'uncommon', achievementId: 'big_session', achievementName: 'Power Hour' },
    open: { rarity: 'uncommon', achievementId: 'huge_session', achievementName: 'Beast Mode' },
  },
  // Heads
  head: {
    round: { rarity: 'common' },
    oval: { rarity: 'common' },
    square: { rarity: 'uncommon', achievementId: 'first_row', achievementName: 'First Strokes' },
    wide: { rarity: 'uncommon', achievementId: 'ten_sessions', achievementName: 'Getting Serious' },
  },
  // Accessories
  accessory: {
    none: { rarity: 'common' },
    sweatband: { rarity: 'uncommon', achievementId: 'first_5k', achievementName: '5K Club' },
    earring_left: { rarity: 'rare', achievementId: 'marathon', achievementName: 'Marathon Rower' },
    earring_both: { rarity: 'epic', achievementId: 'hundred_k', achievementName: '100K Legend' },
    blush: { rarity: 'uncommon', achievementId: 'first_row', achievementName: 'First Strokes' },
    scar: { rarity: 'legendary', achievementId: 'hundred_sessions', achievementName: 'Centurion' },
  },
};

// Check if a cosmetic is unlocked for a user
export function isCosmeticUnlocked(partType, partId, userAchievements) {
  const unlock = COSMETIC_UNLOCKS[partType]?.[partId];
  if (!unlock || unlock.rarity === 'common') return true;
  if (!unlock.achievementId) return true;
  return !!(userAchievements && userAchievements[unlock.achievementId]);
}

// Get cosmetic info
export function getCosmeticInfo(partType, partId) {
  return COSMETIC_UNLOCKS[partType]?.[partId] || { rarity: 'common' };
}

// All part options for the builder
export const AVATAR_PARTS = {
  head: Object.keys(HEAD_SHAPES),
  hair: Object.keys(HAIR_STYLES),
  eyes: Object.keys(EYE_STYLES),
  mouth: Object.keys(MOUTH_STYLES),
  accessory: Object.keys(ACCESSORIES),
};
