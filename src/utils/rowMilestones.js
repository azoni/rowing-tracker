import { ACHIEVEMENTS } from '../constants/achievements';
import { STANDARD_DISTANCES } from '../constants/distances';
import { buildLeaderboardStats } from './leaderboardStats';

// The caller supplies the row that was actually persisted. A live subscription
// may already contain that ID, so replace it once rather than counting it twice.
// This derives notifications only; it never changes rows, profiles or unlocks.
export const getRowMilestones = ({ users = {}, entries = [], userId, savedEntry, now = new Date() } = {}) => {
  const hasSavedIdentity = typeof userId === 'string' && userId.length > 0 &&
    typeof savedEntry?.id === 'string' && savedEntry.id.trim().length > 0 && savedEntry.userId === userId;
  const beforeEntries = hasSavedIdentity ? entries.filter(entry => entry?.id !== savedEntry.id) : entries;
  const before = buildLeaderboardStats({ users, entries: beforeEntries, now });
  const after = hasSavedIdentity
    ? buildLeaderboardStats({ users, entries: [...beforeEntries, savedEntry], now })
    : before;
  const beforeUser = before.byUser[userId] || null;
  const afterUser = after.byUser[userId] || null;
  const savedRow = hasSavedIdentity && afterUser?.rows.find(row => row.id === savedEntry.id);
  const eligible = Boolean(savedRow);
  const previousRank = beforeUser?.rank || null;
  const newRank = afterUser?.rank || null;
  const promotion = eligible && previousRank && newRank.minMeters > previousRank.minMeters ? newRank : null;
  const newlyUnlocked = eligible ? ACHIEVEMENTS.filter(achievement =>
    !afterUser.unlockedAchievements?.[achievement.id] && achievement.check(afterUser, afterUser.rows, afterUser.streak)) : [];
  const previousLongest = beforeUser?.rows.reduce((longest, row) => Math.max(longest, row.meters), 0) || 0;
  // Preserve the existing distinction between a first row and a new personal best.
  const isDistancePR = eligible && previousLongest > 0 && savedRow.meters > previousLongest;

  let newDistanceRecord = null;
  if (eligible) {
    // Reuse the board's verified, exact-distance, machine/workout separation.
    // Being a user's best in this setup is independent of other rowers' times.
    const setup = after.records[savedRow.meters]?.find(group =>
      group.rows.some(row => row.userId === userId && row.id === savedRow.id));
    if (setup) {
      const previousBest = before.records[savedRow.meters]?.find(group => group.key === setup.key)
        ?.rows.find(row => row.userId === userId);
      if (!previousBest || savedRow.time < previousBest.time) {
        newDistanceRecord = {
          distanceMeters: savedRow.meters,
          distanceLabel: STANDARD_DISTANCES.find(distance => distance.meters === savedRow.meters).label,
          time: savedRow.time,
          previousBest: previousBest?.time ?? null,
          isFirstRecord: !previousBest,
          machineType: savedRow.machineType,
          machineCustomName: savedRow.machineType === 'other' ? savedRow.machineCustomName.trim().replace(/\s+/g, ' ') : null,
          sessionType: savedRow.sessionType,
          setupKey: setup.key,
        };
      }
    }
  }

  return { eligible, afterUser, previousRank, newRank, promotion, newlyUnlocked, isDistancePR, newDistanceRecord };
};
