// Rank titles based on total meters
export const RANKS = [
  { minMeters: 0, title: 'Landlubber', emoji: 'rank_landlubber' },
  { minMeters: 5000, title: 'Novice Rower', emoji: 'rank_novice' },
  { minMeters: 15000, title: 'River Runner', emoji: 'rank_river' },
  { minMeters: 30000, title: 'Lake Crosser', emoji: 'rank_lake' },
  { minMeters: 50000, title: 'Ocean Voyager', emoji: 'rank_ocean' },
  { minMeters: 100000, title: 'Iron Oars', emoji: 'rank_iron' },
  { minMeters: 200000, title: 'Sea Champion', emoji: 'rank_champion' },
  { minMeters: 500000, title: 'Row Legend', emoji: 'rank_legend' },
  { minMeters: 1000000, title: 'Mythical Rower', emoji: 'rank_mythical' },
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
