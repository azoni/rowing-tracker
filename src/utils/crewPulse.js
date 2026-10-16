import { getEligibleEntries, getRowDay } from './rowingGoals';

const asDate = value => value?.toDate ? value.toDate() : new Date(value);

// Use calendar arithmetic: a week containing a DST change is not always 168 hours.
export const getCrewWeek = (now = new Date()) => {
  const start = new Date(now);
  start.setHours(0, 0, 0, 0);
  start.setDate(start.getDate() - (start.getDay() + 6) % 7);
  const end = new Date(start);
  end.setDate(end.getDate() + 7);
  const historyStart = new Date(start);
  historyStart.setDate(historyStart.getDate() - 28);
  return { start, end, historyStart };
};

export const getCrewPulse = ({ entries = [], users = {}, memberIds = null, currentUserId, now = new Date() } = {}) => {
  const { start, end, historyStart } = getCrewWeek(now);
  const members = memberIds === null ? null : new Set(memberIds);
  const seen = new Set();
  const rows = getEligibleEntries(entries, now).filter(entry => {
    if (!entry.id || seen.has(entry.id) || !entry.userId || !Object.prototype.hasOwnProperty.call(users, entry.userId)
      || !users[entry.userId] || (members && !members.has(entry.userId))) return false;
    seen.add(entry.id);
    return true;
  });
  const weekRows = rows.filter(entry => asDate(entry.date) >= start && asDate(entry.date) < end);
  const historyRows = rows.filter(entry => asDate(entry.date) >= historyStart && asDate(entry.date) < start);
  const historyMeters = historyRows.reduce((sum, entry) => sum + Number(entry.meters), 0);
  // Include quiet weeks. Current-week contributions never increase this week's target.
  const weeklyAverage = historyMeters / 4;
  const target = historyRows.length ? Math.max(1000, Math.ceil(weeklyAverage * 1.1 / 1000) * 1000) : 5000;
  const byRower = new Map();
  weekRows.forEach(entry => {
    const contributor = byRower.get(entry.userId) || {
      userId: entry.userId, user: { ...users[entry.userId], id: entry.userId }, meters: 0, sessions: 0,
    };
    contributor.meters += Number(entry.meters);
    contributor.sessions += 1;
    byRower.set(entry.userId, contributor);
  });
  // Recognition is alphabetical, so the panel includes every contribution without a second leaderboard.
  const contributors = [...byRower.values()].sort((a, b) =>
    (a.user.name || 'Crew member').localeCompare(b.user.name || 'Crew member') || a.userId.localeCompare(b.userId));
  const meters = contributors.reduce((sum, rower) => sum + rower.meters, 0);
  return {
    start, end, rows, contributors, meters, target, weeklyAverage,
    sessions: weekRows.length,
    activeDays: new Set(weekRows.map(getRowDay)).size,
    hasHistory: historyRows.length > 0,
    currentUserMeters: byRower.get(currentUserId)?.meters || 0,
    remaining: Math.max(0, target - meters),
    complete: meters >= target,
    percent: Math.min(100, meters / target * 100),
  };
};

// One recent row per teammate keeps frequent loggers from taking over the spotlight.
export const getCrewSpotlights = (rows, currentUserId, getReactionCounts = () => ({}), now = new Date()) => {
  const start = new Date(now);
  start.setHours(0, 0, 0, 0);
  start.setDate(start.getDate() - 6);
  const latest = new Map();
  rows.filter(entry => entry.userId !== currentUserId && asDate(entry.date) >= start && asDate(entry.date) <= now)
    .sort((a, b) => asDate(b.date) - asDate(a.date) || String(a.id).localeCompare(String(b.id)))
    .forEach(entry => {
      if (!latest.has(entry.userId)) {
        const reactionCount = Object.values(getReactionCounts(entry.id) || {})
          .reduce((sum, count) => sum + (Number.isFinite(Number(count)) && Number(count) > 0 ? Number(count) : 0), 0);
        latest.set(entry.userId, { ...entry, reactionCount });
      }
    });
  return [...latest.values()].sort((a, b) => a.reactionCount - b.reactionCount
    || asDate(b.date) - asDate(a.date) || String(a.id).localeCompare(String(b.id)));
};
