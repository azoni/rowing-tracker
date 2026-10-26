// Each crew member rows with a blade colour, like a club's oar blades. It comes from the member's id, so it is the
// same on every screen and every device without storing anything.
export const CREW_BLADES = [
  '#F2668B', // cerise
  '#FF9466', // coral
  '#F5C84C', // saffron
  '#A9DC62', // lime
  '#59D2A4', // mint
  '#7CC6F6', // Cambridge blue
  '#B79CFF', // lilac
];

const memberKey = user => {
  if (!user || typeof user !== 'object') return '';
  const key = user.id ?? user.uid ?? user.userId ?? user.name ?? '';
  return typeof key === 'string' || typeof key === 'number' ? String(key) : '';
};

export function getCrewColor(user) {
  const key = memberKey(user);
  if (!key) return CREW_BLADES[0];
  let hash = 0;
  for (let i = 0; i < key.length; i += 1) hash = (hash * 31 + key.charCodeAt(i)) >>> 0;
  return CREW_BLADES[hash % CREW_BLADES.length];
}
