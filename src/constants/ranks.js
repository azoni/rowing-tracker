// Rank titles based on total meters — 20 ranks in 5 tiers
// Calibrated for ~25K/week active user

export const TIER_COLORS = {
  bronze: '#cd7f32',
  silver: '#c0c0c0',
  gold: '#ffd700',
  platinum: '#a29bfe',
  diamond: '#00d4aa',
};

export const RANKS = [
  // BRONZE TIER (0–50K, ~2 weeks) — Finding your sea legs
  { minMeters: 0, title: 'Landlubber', emoji: 'rank_landlubber', tier: 'bronze' },
  { minMeters: 5000, title: 'Deckhand', emoji: 'rank_deckhand', tier: 'bronze' },
  { minMeters: 15000, title: 'Oar Dipper', emoji: 'rank_oar_dipper', tier: 'bronze' },
  { minMeters: 30000, title: 'Novice Rower', emoji: 'rank_novice', tier: 'bronze' },

  // SILVER TIER (50K–150K, ~4 weeks) — Building habits
  { minMeters: 50000, title: 'River Runner', emoji: 'rank_river', tier: 'silver' },
  { minMeters: 75000, title: 'Lake Crosser', emoji: 'rank_lake', tier: 'silver' },
  { minMeters: 100000, title: 'Channel Swimmer', emoji: 'rank_channel', tier: 'silver' },
  { minMeters: 150000, title: 'Ocean Voyager', emoji: 'rank_ocean', tier: 'silver' },

  // GOLD TIER (200K–500K, ~3 months) — Dedicated rower
  { minMeters: 200000, title: 'Iron Oars', emoji: 'rank_iron', tier: 'gold' },
  { minMeters: 300000, title: 'Steel Spine', emoji: 'rank_steel', tier: 'gold' },
  { minMeters: 400000, title: 'Wave Breaker', emoji: 'rank_wave_breaker', tier: 'gold' },
  { minMeters: 500000, title: 'Sea Champion', emoji: 'rank_champion', tier: 'gold' },

  // PLATINUM TIER (750K–2M, long grind) — Elite
  { minMeters: 750000, title: 'Storm Rider', emoji: 'rank_storm', tier: 'platinum' },
  { minMeters: 1000000, title: 'Tide Turner', emoji: 'rank_tide', tier: 'platinum' },
  { minMeters: 1500000, title: 'Row Legend', emoji: 'rank_legend', tier: 'platinum' },
  { minMeters: 2000000, title: 'Ocean Master', emoji: 'rank_ocean_master', tier: 'platinum' },

  // DIAMOND TIER (3M+) — Mythical
  { minMeters: 3000000, title: 'Mythical Rower', emoji: 'rank_mythical', tier: 'diamond' },
  { minMeters: 5000000, title: 'Kraken Slayer', emoji: 'rank_kraken', tier: 'diamond' },
  { minMeters: 7500000, title: 'Poseidon\'s Chosen', emoji: 'rank_poseidon', tier: 'diamond' },
  { minMeters: 10000000, title: 'Immortal', emoji: 'rank_immortal', tier: 'diamond' },
];

// Get user's rank based on total meters
export const getUserRank = (totalMeters) => {
  for (let i = RANKS.length - 1; i >= 0; i--) {
    if (totalMeters >= RANKS[i].minMeters) {
      return RANKS[i];
    }
  }
  return RANKS[0];
};

// Get next rank
export const getNextRank = (totalMeters) => {
  for (let i = 0; i < RANKS.length; i++) {
    if (totalMeters < RANKS[i].minMeters) {
      return RANKS[i];
    }
  }
  return null; // Already at max rank
};

// Get rank tier from rank title (for backwards compat with old rankHistory)
export const getRankTier = (rankTitle) => {
  const rank = RANKS.find(r => r.title === rankTitle);
  return rank?.tier || 'bronze';
};
