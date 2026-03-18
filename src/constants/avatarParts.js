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
  curly: (color) => (
    <path d="M16,20 C14,10 22,4 32,4 C42,4 50,10 48,20 C48,16 44,8 32,8 C20,8 16,16 16,20 Z M16,20 C14,22 15,26 17,24 C19,22 18,18 16,20 Z M48,20 C50,22 49,26 47,24 C45,22 46,18 48,20 Z M20,8 C18,6 20,4 22,5 M42,8 C44,6 42,4 40,5 M26,6 C25,4 27,3 28,5 M36,6 C37,4 35,3 34,5" fill={color} />
  ),
  ponytail: (color) => (
    <>
      <path d="M16,22 C16,12 22,6 32,6 C42,6 48,12 48,22 C48,18 44,10 32,10 C20,10 16,18 16,22 Z" fill={color} />
      <path d="M44,16 Q50,18 48,30 Q46,38 44,42" fill="none" stroke={color} strokeWidth="4" strokeLinecap="round" />
    </>
  ),
  spiky: (color) => (
    <path d="M18,20 L22,4 L26,16 L30,2 L34,16 L38,4 L42,16 L46,6 L48,20 C48,14 44,8 32,8 C20,8 16,14 18,20 Z" fill={color} />
  ),
  beanie: (color) => (
    <>
      <path d="M14,24 C14,12 22,6 32,6 C42,6 50,12 50,24 Z" fill={color} />
      <rect x="14" y="22" width="36" height="4" rx="2" fill={darken(color)} />
      <circle cx="32" cy="4" r="3" fill={color} />
    </>
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
  angry: () => (
    <>
      <circle cx="26" cy="27" r="2.5" fill="#fff" />
      <circle cx="38" cy="27" r="2.5" fill="#fff" />
      <circle cx="26.5" cy="27" r="1.5" fill="#c0392b" />
      <circle cx="38.5" cy="27" r="1.5" fill="#c0392b" />
      <line x1="23" y1="24" x2="29" y2="23" stroke="#2c3e50" strokeWidth="1.2" strokeLinecap="round" />
      <line x1="41" y1="24" x2="35" y2="23" stroke="#2c3e50" strokeWidth="1.2" strokeLinecap="round" />
    </>
  ),
  stars: () => (
    <>
      <text x="23" y="30" fontSize="8" fill="#ffd700">★</text>
      <text x="35" y="30" fontSize="8" fill="#ffd700">★</text>
    </>
  ),
  hearts: () => (
    <>
      <text x="22" y="30" fontSize="7" fill="#e63946">♥</text>
      <text x="35" y="30" fontSize="7" fill="#e63946">♥</text>
    </>
  ),
  monacle: () => (
    <>
      <circle cx="26" cy="27" r="2.5" fill="#fff" />
      <circle cx="38" cy="27" r="2.5" fill="#fff" />
      <circle cx="26.5" cy="27" r="1.5" fill="#2c3e50" />
      <circle cx="38.5" cy="27" r="1.5" fill="#2c3e50" />
      <circle cx="38" cy="27" r="5" fill="none" stroke="#ffd700" strokeWidth="0.8" />
      <line x1="43" y1="27" x2="48" y2="35" stroke="#ffd700" strokeWidth="0.5" />
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
  tongue: () => (
    <>
      <path d="M27,34 Q32,38 37,34" stroke="#2c3e50" strokeWidth="1.2" fill="none" strokeLinecap="round" />
      <ellipse cx="32" cy="36" rx="2" ry="2" fill="#e63946" />
    </>
  ),
  teeth: () => (
    <>
      <path d="M26,33 Q32,39 38,33 Z" fill="#fff" stroke="#2c3e50" strokeWidth="0.8" />
      <line x1="30" y1="33" x2="30" y2="36" stroke="#2c3e50" strokeWidth="0.5" />
      <line x1="34" y1="33" x2="34" y2="36" stroke="#2c3e50" strokeWidth="0.5" />
    </>
  ),
  mustache: () => (
    <>
      <line x1="28" y1="33" x2="36" y2="33" stroke="#2c3e50" strokeWidth="1" strokeLinecap="round" />
      <path d="M25,33 Q28,30 32,33 Q36,30 39,33" fill="#5c3317" stroke="none" />
    </>
  ),
  beard: () => (
    <>
      <line x1="28" y1="35" x2="36" y2="35" stroke="#2c3e50" strokeWidth="1" strokeLinecap="round" />
      <path d="M23,34 Q24,42 32,44 Q40,42 41,34" fill="#5c3317" opacity="0.7" />
    </>
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
  crown: () => (
    <path d="M22,12 L26,6 L29,10 L32,4 L35,10 L38,6 L42,12 Z" fill="#ffd700" stroke="#c9a227" strokeWidth="0.5" />
  ),
  halo: () => (
    <ellipse cx="32" cy="8" rx="12" ry="3" fill="none" stroke="#ffd700" strokeWidth="1.5" opacity="0.7" />
  ),
  horns: () => (
    <>
      <path d="M18,18 L14,6 L22,14" fill="#c0392b" />
      <path d="M46,18 L50,6 L42,14" fill="#c0392b" />
    </>
  ),
  bandana: (color) => (
    <>
      <path d="M14,20 C14,14 22,10 32,10 C42,10 50,14 50,20 L50,22 L14,22 Z" fill={color || '#e63946'} />
      <path d="M48,20 L54,26 L52,28 L48,22" fill={color || '#e63946'} />
    </>
  ),
  glasses: () => (
    <>
      <circle cx="26" cy="27" r="5" fill="none" stroke="#2c3e50" strokeWidth="1" />
      <circle cx="38" cy="27" r="5" fill="none" stroke="#2c3e50" strokeWidth="1" />
      <line x1="31" y1="27" x2="33" y2="27" stroke="#2c3e50" strokeWidth="1" />
      <line x1="21" y1="26" x2="16" y2="24" stroke="#2c3e50" strokeWidth="0.8" />
      <line x1="43" y1="26" x2="48" y2="24" stroke="#2c3e50" strokeWidth="0.8" />
    </>
  ),
  medal: () => (
    <g transform="translate(32,48)">
      <path d="M-2,-4 L-4,0 L4,0 L2,-4" fill="#4169e1" />
      <circle r="4" fill="#ffd700" stroke="#c9a227" strokeWidth="0.5" />
      <text y="1.5" textAnchor="middle" fontSize="4" fill="#c9a227" fontWeight="700">1</text>
    </g>
  ),
  fire_aura: () => (
    <>
      <path d="M14,20 Q12,10 16,8 Q14,14 18,12 Q16,18 14,20" fill="#ff6b35" opacity="0.5" />
      <path d="M50,20 Q52,10 48,8 Q50,14 46,12 Q48,18 50,20" fill="#ff6b35" opacity="0.5" />
    </>
  ),
  tattoo: () => (
    <path d="M16,32 Q14,30 16,28 Q18,30 16,32 M17,30 L20,30" fill="none" stroke="#2c3e50" strokeWidth="0.5" />
  ),
};

// Arms helper — draws arms on sides of torso
export const ARMS = (skinColor) => (
  <>
    <path d="M20,44 L16,54 L18,55 L22,46" fill={skinColor} stroke={darken(skinColor)} strokeWidth="0.3" />
    <path d="M44,44 L48,54 L46,55 L42,46" fill={skinColor} stroke={darken(skinColor)} strokeWidth="0.3" />
    <circle cx="16" cy="55" r="2" fill={skinColor} />
    <circle cx="48" cy="55" r="2" fill={skinColor} />
  </>
);

// Legs helper — draws legs below the torso
const LEGS = (pantColor) => (
  <>
    <rect x="25" y="56" width="5" height="10" rx="2" fill={pantColor} stroke={darken(pantColor)} strokeWidth="0.3" />
    <rect x="34" y="56" width="5" height="10" rx="2" fill={pantColor} stroke={darken(pantColor)} strokeWidth="0.3" />
    <rect x="24" y="64" width="6" height="3" rx="1.5" fill="#333" />
    <rect x="34" y="64" width="6" height="3" rx="1.5" fill="#333" />
  </>
);

// Outfit styles (body area, y: 40-68)
export const OUTFIT_STYLES = {
  basic: (color) => (
    <>
      <path d="M22,46 C22,42 26,40 32,40 C38,40 42,42 42,46 L42,56 L22,56 Z" fill={color} stroke={darken(color)} strokeWidth="0.5" />
      {LEGS('#3d4f6f')}
    </>
  ),
  singlet: (color) => (
    <>
      <path d="M24,46 C24,42 27,40 32,40 C37,40 40,42 40,46 L40,56 L24,56 Z" fill={color} stroke={darken(color)} strokeWidth="0.5" />
      <line x1="32" y1="42" x2="32" y2="50" stroke={darken(color)} strokeWidth="0.5" />
      {LEGS('#1a1a1a')}
    </>
  ),
  hoodie: (color) => (
    <>
      <path d="M20,46 C20,41 25,38 32,38 C39,38 44,41 44,46 L44,56 L20,56 Z" fill={color} stroke={darken(color)} strokeWidth="0.5" />
      <path d="M28,38 Q32,42 36,38" fill="none" stroke={darken(color)} strokeWidth="0.5" />
      <ellipse cx="32" cy="40" rx="3" ry="1.5" fill={darken(color)} opacity="0.3" />
      {LEGS('#3d4f6f')}
    </>
  ),
  tank_top: (color) => (
    <>
      <path d="M26,44 C26,42 28,40 32,40 C36,40 38,42 38,44 L38,56 L26,56 Z" fill={color} stroke={darken(color)} strokeWidth="0.5" />
      {LEGS('#3d4f6f')}
    </>
  ),
  wetsuit: (color) => (
    <>
      <path d="M20,46 C20,41 25,38 32,38 C39,38 44,41 44,46 L44,56 L20,56 Z" fill="#1a1a1a" stroke="#333" strokeWidth="0.5" />
      <line x1="32" y1="40" x2="32" y2="56" stroke={color} strokeWidth="1" />
      {LEGS('#1a1a1a')}
    </>
  ),
  tuxedo: (color) => (
    <>
      <path d="M22,46 C22,42 26,40 32,40 C38,40 42,42 42,46 L42,56 L22,56 Z" fill="#1a1a1a" stroke="#333" strokeWidth="0.5" />
      <path d="M30,40 L32,48 L34,40" fill="#fff" />
      <circle cx="32" cy="46" r="1" fill="#e63946" />
      {LEGS('#1a1a1a')}
    </>
  ),
  cape: (color) => (
    <>
      <path d="M20,42 L14,68 Q32,64 50,68 L44,42" fill={darken(color)} opacity="0.7" />
      <path d="M22,46 C22,42 26,40 32,40 C38,40 42,42 42,46 L42,56 L22,56 Z" fill={color} stroke={darken(color)} strokeWidth="0.5" />
      {LEGS('#1a1a1a')}
    </>
  ),
  jersey: (color) => (
    <>
      <path d="M22,46 C22,42 26,40 32,40 C38,40 42,42 42,46 L42,56 L22,56 Z" fill={color} stroke={darken(color)} strokeWidth="0.5" />
      <text x="32" y="52" textAnchor="middle" fontSize="7" fill="#fff" fontWeight="700">1</text>
      {LEGS('#1a1a1a')}
    </>
  ),
};

// Legacy BODY export for backwards compat
export const BODY = (outfitColor) => OUTFIT_STYLES.basic(outfitColor);

// Held items (positioned to the right of body)
export const HELD_ITEMS = {
  none: () => null,
  oar: () => (
    <line x1="44" y1="38" x2="54" y2="58" stroke="#8B6914" strokeWidth="2" strokeLinecap="round" />
  ),
  trophy: () => (
    <g transform="translate(46,42)">
      <path d="M0,4 L2,0 L8,0 L10,4 L8,8 L6,12 L4,12 L2,8 Z" fill="#ffd700" stroke="#c9a227" strokeWidth="0.5" />
      <rect x="3" y="12" width="4" height="2" fill="#c9a227" />
    </g>
  ),
  coffee: () => (
    <g transform="translate(44,44)">
      <rect x="0" y="0" width="7" height="9" rx="1" fill="#8B4513" />
      <path d="M7,2 Q10,2 10,5 Q10,8 7,8" fill="none" stroke="#8B4513" strokeWidth="1" />
      <path d="M1,0 Q2,-2 3,0 Q4,-2 5,0" fill="none" stroke="#aaa" strokeWidth="0.5" opacity="0.5" />
    </g>
  ),
  flag: (color) => (
    <g transform="translate(46,36)">
      <line x1="0" y1="0" x2="0" y2="20" stroke="#8a8a8a" strokeWidth="1" />
      <path d="M1,1 L12,4 L1,7 Z" fill={color || '#e63946'} />
    </g>
  ),
  dumbbell: () => (
    <g transform="translate(44,46)">
      <rect x="0" y="2" width="3" height="6" rx="1" fill="#555" />
      <rect x="3" y="4" width="8" height="2" rx="0.5" fill="#888" />
      <rect x="11" y="2" width="3" height="6" rx="1" fill="#555" />
    </g>
  ),
  sword: () => (
    <g transform="translate(46,36)">
      <line x1="2" y1="0" x2="2" y2="16" stroke="#c0c0c0" strokeWidth="1.5" />
      <rect x="0" y="14" width="4" height="2" rx="0.5" fill="#8B6914" />
      <circle cx="2" cy="0" r="1" fill="#ffd700" />
    </g>
  ),
};

// Pets (positioned below/beside the body, y: 56-72)
export const PET_STYLES = {
  none: () => null,
  dog: () => (
    <g transform="translate(46,54)">
      <ellipse cx="6" cy="8" rx="5" ry="4" fill="#c68642" />
      <circle cx="3" cy="4" r="3.5" fill="#c68642" />
      <circle cx="2" cy="3" r="1" fill="#2c3e50" />
      <path d="M1,5 Q3,7 4,5" stroke="#2c3e50" strokeWidth="0.5" fill="none" />
      <path d="M0,2 L-1,0 L1,1" fill="#8B6914" />
      <path d="M5,1 L7,0 L6,2" fill="#8B6914" />
      <path d="M11,8 Q14,7 13,9" stroke="#c68642" strokeWidth="1" fill="none" />
    </g>
  ),
  cat: () => (
    <g transform="translate(46,54)">
      <ellipse cx="5" cy="8" rx="4" ry="3.5" fill="#555" />
      <circle cx="3" cy="4" r="3" fill="#555" />
      <path d="M1,2 L0,-1 L2,1" fill="#555" />
      <path d="M5,2 L6,-1 L4,1" fill="#555" />
      <circle cx="2" cy="3.5" r="0.8" fill="#2ed573" />
      <circle cx="4" cy="3.5" r="0.8" fill="#2ed573" />
      <path d="M10,8 Q13,6 12,9 Q14,7 13,10" stroke="#555" strokeWidth="0.8" fill="none" />
    </g>
  ),
  parrot: () => (
    <g transform="translate(44,34)">
      <ellipse cx="4" cy="6" rx="3" ry="4" fill="#2ed573" />
      <circle cx="3" cy="3" r="2.5" fill="#e63946" />
      <circle cx="2.5" cy="2.5" r="0.7" fill="#2c3e50" />
      <path d="M1,3.5 L-1,4 L1,4.5" fill="#ffd700" />
      <path d="M5,8 L6,14 L4,14 L3,9" fill="#2ed573" />
      <path d="M6,10 L8,12" stroke="#4169e1" strokeWidth="1" />
    </g>
  ),
  dragon: () => (
    <g transform="translate(44,48)">
      <ellipse cx="8" cy="10" rx="6" ry="5" fill="#8b5cf6" />
      <circle cx="4" cy="6" r="4" fill="#8b5cf6" />
      <circle cx="3" cy="5" r="1" fill="#ffd700" />
      <path d="M1,3 L-1,1 L1,2" fill="#8b5cf6" />
      <path d="M6,3 L8,1 L7,3" fill="#8b5cf6" />
      <path d="M0,7 L-1,8" stroke="#e63946" strokeWidth="0.5" />
      <path d="M14,10 Q18,8 16,12 Q19,10 17,13" stroke="#8b5cf6" strokeWidth="1" fill="none" />
      <path d="M6,6 L4,2 L8,4" fill="#8b5cf6" opacity="0.6" />
      <path d="M10,6 L12,3 L9,5" fill="#8b5cf6" opacity="0.6" />
    </g>
  ),
  fish: () => (
    <g transform="translate(46,56)">
      <ellipse cx="5" cy="4" rx="4" ry="2.5" fill="#4169e1" />
      <path d="M9,4 L12,2 L12,6 Z" fill="#4169e1" />
      <circle cx="3" cy="3.5" r="0.7" fill="#fff" />
      <circle cx="3.3" cy="3.5" r="0.4" fill="#2c3e50" />
    </g>
  ),
  phoenix: () => (
    <g transform="translate(42,32)">
      <ellipse cx="6" cy="10" rx="4" ry="5" fill="#ff6b35" />
      <circle cx="4" cy="6" r="3" fill="#ffd700" />
      <circle cx="3" cy="5.5" r="0.8" fill="#e63946" />
      <path d="M2,7 L0,7.5 L2,8" fill="#ff6b35" />
      <path d="M6,4 L4,0 L8,2" fill="#e63946" />
      <path d="M8,4 L10,1 L9,4" fill="#ff6b35" />
      <path d="M8,14 L12,18 L10,14 L14,16 L11,13" fill="#ffd700" opacity="0.7" />
      <path d="M3,14 L0,17 L2,13 L-1,15 L1,12" fill="#ff6b35" opacity="0.7" />
    </g>
  ),
};

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
  outfit: 'basic',
  heldItem: 'none',
  pet: 'none',
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
    curly: { rarity: 'uncommon', achievementId: 'first_row', achievementName: 'First Strokes' },
    ponytail: { rarity: 'uncommon', achievementId: 'first_10k', achievementName: '10K Crusher' },
    spiky: { rarity: 'rare', achievementId: 'marathon', achievementName: 'Marathon Rower' },
    beanie: { rarity: 'rare', achievementId: 'fortnight_streak', achievementName: 'Fortnight Streak' },
  },
  eyes: {
    normal: { rarity: 'common' },
    big: { rarity: 'common' },
    sleepy: { rarity: 'common' },
    determined: { rarity: 'uncommon', achievementId: 'first_10k', achievementName: '10K Crusher' },
    sunglasses: { rarity: 'rare', achievementId: 'hundred_k', achievementName: '100K Legend' },
    wink: { rarity: 'uncommon', achievementId: 'marathon', achievementName: 'Marathon Rower' },
    angry: { rarity: 'rare', achievementId: 'huge_session', achievementName: 'Beast Mode' },
    stars: { rarity: 'epic', achievementId: 'weekly_champion', achievementName: 'Weekly Champion' },
    hearts: { rarity: 'rare', achievementId: 'consistent_rower', achievementName: 'Consistency King' },
    monacle: { rarity: 'legendary', achievementId: 'hundred_sessions', achievementName: 'Centurion' },
  },
  mouth: {
    smile: { rarity: 'common' },
    grin: { rarity: 'common' },
    neutral: { rarity: 'common' },
    smirk: { rarity: 'uncommon', achievementId: 'big_session', achievementName: 'Power Hour' },
    open: { rarity: 'uncommon', achievementId: 'huge_session', achievementName: 'Beast Mode' },
    tongue: { rarity: 'uncommon', achievementId: 'ten_sessions', achievementName: 'Getting Serious' },
    teeth: { rarity: 'rare', achievementId: 'fifty_sessions', achievementName: 'Dedicated Rower' },
    mustache: { rarity: 'rare', achievementId: 'hundred_k', achievementName: '100K Legend' },
    beard: { rarity: 'epic', achievementId: 'monthly_master', achievementName: 'Monthly Master' },
  },
  head: {
    round: { rarity: 'common' },
    oval: { rarity: 'common' },
    square: { rarity: 'uncommon', achievementId: 'first_row', achievementName: 'First Strokes' },
    wide: { rarity: 'uncommon', achievementId: 'ten_sessions', achievementName: 'Getting Serious' },
  },
  accessory: {
    none: { rarity: 'common' },
    sweatband: { rarity: 'uncommon', achievementId: 'first_5k', achievementName: '5K Club' },
    earring_left: { rarity: 'rare', achievementId: 'marathon', achievementName: 'Marathon Rower' },
    earring_both: { rarity: 'epic', achievementId: 'hundred_k', achievementName: '100K Legend' },
    blush: { rarity: 'uncommon', achievementId: 'first_row', achievementName: 'First Strokes' },
    scar: { rarity: 'epic', achievementId: 'hundred_sessions', achievementName: 'Centurion' },
    crown: { rarity: 'legendary', achievementId: 'triple_crown', achievementName: 'Triple Crown' },
    halo: { rarity: 'epic', achievementId: 'no_days_off', achievementName: 'No Days Off' },
    horns: { rarity: 'rare', achievementId: 'night_owl', achievementName: 'Night Owl' },
    bandana: { rarity: 'rare', achievementId: 'week_streak', achievementName: 'Week Warrior' },
    glasses: { rarity: 'uncommon', achievementId: 'first_10k', achievementName: '10K Crusher' },
    medal: { rarity: 'epic', achievementId: 'weekly_champion', achievementName: 'Weekly Champion' },
    fire_aura: { rarity: 'legendary', achievementId: 'sixty_day_streak', achievementName: '60-Day Fire' },
    tattoo: { rarity: 'rare', achievementId: 'big_session', achievementName: 'Power Hour' },
  },
  outfit: {
    basic: { rarity: 'common' },
    singlet: { rarity: 'common' },
    tank_top: { rarity: 'common' },
    hoodie: { rarity: 'uncommon', achievementId: 'ten_sessions', achievementName: 'Getting Serious' },
    wetsuit: { rarity: 'rare', achievementId: 'marathon', achievementName: 'Marathon Rower' },
    jersey: { rarity: 'rare', achievementId: 'weekly_champion', achievementName: 'Weekly Champion' },
    tuxedo: { rarity: 'epic', achievementId: 'hundred_sessions', achievementName: 'Centurion' },
    cape: { rarity: 'legendary', achievementId: 'hundred_k', achievementName: '100K Legend' },
  },
  heldItem: {
    none: { rarity: 'common' },
    oar: { rarity: 'uncommon', achievementId: 'first_row', achievementName: 'First Strokes' },
    coffee: { rarity: 'uncommon', achievementId: 'early_bird', achievementName: 'Early Bird' },
    flag: { rarity: 'rare', achievementId: 'week_streak', achievementName: 'Week Warrior' },
    trophy: { rarity: 'epic', achievementId: 'weekly_champion', achievementName: 'Weekly Champion' },
    dumbbell: { rarity: 'rare', achievementId: 'big_session', achievementName: 'Power Hour' },
    sword: { rarity: 'legendary', achievementId: 'hundred_sessions', achievementName: 'Centurion' },
  },
  pet: {
    none: { rarity: 'common' },
    fish: { rarity: 'uncommon', achievementId: 'first_5k', achievementName: '5K Club' },
    cat: { rarity: 'rare', achievementId: 'fortnight_streak', achievementName: 'Fortnight Streak' },
    dog: { rarity: 'rare', achievementId: 'fifty_sessions', achievementName: 'Dedicated Rower' },
    parrot: { rarity: 'epic', achievementId: 'monthly_master', achievementName: 'Monthly Master' },
    dragon: { rarity: 'legendary', achievementId: 'sixty_day_streak', achievementName: '60-Day Fire' },
    phoenix: { rarity: 'legendary', achievementId: 'century_streak', achievementName: 'Century Streak' },
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
  outfit: Object.keys(OUTFIT_STYLES),
  heldItem: Object.keys(HELD_ITEMS),
  pet: Object.keys(PET_STYLES),
};
