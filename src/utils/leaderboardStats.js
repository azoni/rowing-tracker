import { ACHIEVEMENTS } from '../constants/achievements';
import { STANDARD_DISTANCES } from '../constants/distances';
import { ROWING_MACHINES, getMachineName } from '../constants/machines';
import { getUserRank } from '../constants/ranks';
import { getCrewWeek } from './crewPulse';
import { getAnalyticsDate } from './rowingAnalytics';
import { getBestRowStreak, getEligibleEntries, getRowDay } from './rowingGoals';

const MACHINES = new Set(ROWING_MACHINES.map(machine => machine.id));
const RECORD_TYPES = { free_row: 'Free row', timed: 'Timed row', distance: 'Distance row' };
const positiveNumber = value => (
  (typeof value === 'number' || (typeof value === 'string' && value.trim() !== '')) &&
  Number.isFinite(Number(value)) && Number(value) > 0 ? Number(value) : 0
);
const byId = (a, b) => a.id.localeCompare(b.id);
const compareTimes = (a, b) => a.time - b.time || new Date(a.date) - new Date(b.date) || byId(a, b);

// All displayed totals come from eligible rows. Stored profiles and earned badges
// remain intact; this selector never repairs or writes historical counters.
export const buildLeaderboardStats = ({ users = {}, entries = [], memberIds = null, now = new Date(), achievements = ACHIEVEMENTS } = {}) => {
  const week = getCrewWeek(now);
  const members = memberIds === null ? null : new Set(memberIds);
  const seen = new Set();
  const validRows = entries.filter(entry => {
    if (!entry || typeof entry.id !== 'string' || !entry.id || seen.has(entry.id) ||
      !Object.prototype.hasOwnProperty.call(users, entry.userId) || !users[entry.userId] ||
      !positiveNumber(entry.meters) || typeof entry.date === 'boolean' || !Number.isFinite(getAnalyticsDate(entry.date).getTime())) return false;
    seen.add(entry.id);
    return true;
  }).map(entry => ({ ...entry, date: getAnalyticsDate(entry.date).toISOString(), meters: Number(entry.meters),
    time: positiveNumber(entry.time), calories: positiveNumber(entry.calories) }));
  const rows = getEligibleEntries(validRows, now);
  const rowsByUser = new Map();
  rows.forEach(row => {
    if (!rowsByUser.has(row.userId)) rowsByUser.set(row.userId, []);
    rowsByUser.get(row.userId).push(row);
  });
  const today = getRowDay({ date: now });
  const byUser = {};
  Object.entries(users).forEach(([id, storedProfile]) => {
    if (!storedProfile) return;
    const profile = { ...storedProfile, id };
    const userRows = rowsByUser.get(id) || [];
    const days = new Set(userRows.map(getRowDay));
    let day = days.has(today) ? today : today - 1;
    let streak = 0;
    while (days.has(day)) { streak += 1; day -= 1; }
    const weeklyRows = userRows.filter(row => new Date(row.date) >= week.start && new Date(row.date) < week.end);
    const totalMeters = userRows.reduce((sum, row) => sum + row.meters, 0);
    const latest = userRows.reduce((time, row) => Math.max(time, new Date(row.date).getTime()), 0);
    const weeklyLatest = weeklyRows.reduce((time, row) => Math.max(time, new Date(row.date).getTime()), 0);
    const firstDay = days.size ? Math.min(...days) : today;
    const user = {
      ...profile, profile, rows: userRows, totalMeters, uploadCount: userRows.length,
      totalTime: userRows.reduce((sum, row) => sum + row.time, 0),
      totalCalories: userRows.reduce((sum, row) => sum + row.calories, 0),
      streak, longestStreak: getBestRowStreak(userRows),
      weeklyMeters: weeklyRows.reduce((sum, row) => sum + row.meters, 0),
      weeklySessions: weeklyRows.length,
      weeklyAvg: Number((days.size / Math.max(1, (today - firstDay + 1) / 7)).toFixed(1)),
      avgPerUpload: userRows.length ? Math.round(totalMeters / userRows.length) : 0,
      rank: getUserRank(totalMeters), latest, weeklyLatest,
    };
    user.achievementCount = achievements.filter(badge =>
      profile.unlockedAchievements?.[badge.id] || badge.check(user, userRows, streak)).length;
    byUser[id] = user;
  });

  const people = Object.values(byUser).filter(user => !members || members.has(user.id));
  const scopedRows = rows.filter(row => !members || members.has(row.userId));
  const records = Object.fromEntries(STANDARD_DISTANCES.map(distance => [distance.meters, []]));
  const setups = new Map();
  scopedRows.forEach(row => {
    const time = positiveNumber(row.time);
    const customName = typeof row.machineCustomName === 'string' ? row.machineCustomName.trim().replace(/\s+/g, ' ') : '';
    // Interval totals omit work/rest structure. Approximate distances and unknown
    // setups stay in history, but cannot establish the same recorded piece.
    if (row.verificationStatus !== 'verified' || !time || !records[row.meters] ||
      !MACHINES.has(row.machineType) || row.machineType === 'gym_generic' ||
      (row.machineType === 'other' && !customName) || !Object.prototype.hasOwnProperty.call(RECORD_TYPES, row.sessionType)) return;
    const key = JSON.stringify([row.meters, row.machineType, row.machineType === 'other' ? customName.toLowerCase() : '', row.sessionType]);
    if (!setups.has(key)) setups.set(key, {
      key, meters: row.meters, machineType: row.machineType, sessionType: row.sessionType,
      label: `${getMachineName(row.machineType, customName)} · ${RECORD_TYPES[row.sessionType]}`,
      bestByUser: new Map(),
    });
    const setup = setups.get(key);
    const candidate = { ...row, time, pace: time / row.meters * 500, user: byUser[row.userId].profile };
    const best = setup.bestByUser.get(row.userId);
    if (!best || compareTimes(candidate, best) < 0) setup.bestByUser.set(row.userId, candidate);
  });
  setups.forEach(({ bestByUser, ...setup }) => {
    records[setup.meters].push({ ...setup, rows: [...bestByUser.values()].sort(compareTimes) });
  });
  Object.values(records).forEach(groups => groups.sort((a, b) => a.label.localeCompare(b.label) || a.key.localeCompare(b.key)));

  return {
    byUser, week: { start: week.start, end: week.end }, records,
    allTime: [...people].sort((a, b) => b.totalMeters - a.totalMeters || a.latest - b.latest || byId(a, b)),
    weekly: people.filter(user => user.weeklyMeters > 0).sort((a, b) => b.weeklyMeters - a.weeklyMeters || a.weeklyLatest - b.weeklyLatest || byId(a, b)),
    streaks: people.filter(user => user.longestStreak > 0).sort((a, b) => b.streak - a.streak || b.longestStreak - a.longestStreak || byId(a, b)),
    achievements: people.filter(user => user.achievementCount > 0).sort((a, b) => b.achievementCount - a.achievementCount || byId(a, b)),
    summary: { rowers: people.length, rows: scopedRows.length, meters: scopedRows.reduce((sum, row) => sum + row.meters, 0) },
  };
};

// Read-only badge views share the same derived profile and eligible rows as the
// board. Existing unlock dates win even when historical rows no longer qualify.
export const getDerivedAchievementProgress = (user, achievement) => {
  if (!user) return { current: 0, target: 1 };
  const progress = achievement.getProgress(user, user.rows, user.streak);
  const savedUnlock = user.unlockedAchievements?.[achievement.id];
  if (progress.target === 1) {
    return { ...progress, current: savedUnlock || achievement.check(user, user.rows, user.streak) ? 1 : 0 };
  }
  return savedUnlock ? { ...progress, current: Math.max(progress.current, progress.target) } : progress;
};

export const getDerivedAchievements = (user, achievements = ACHIEVEMENTS) => {
  if (!user) return [];
  return achievements.filter(achievement => user.unlockedAchievements?.[achievement.id] ||
    achievement.check(user, user.rows, user.streak)).map(achievement => ({
    ...achievement,
    progress: getDerivedAchievementProgress(user, achievement),
    unlockedDate: user.unlockedAchievements?.[achievement.id] || null,
  }));
};

// Round before splitting minutes so 119.96 seconds becomes 2:00.0, never 1:60.0.
export const formatRecordTime = seconds => {
  const tenths = Math.round(seconds * 10);
  return `${Math.floor(tenths / 600)}:${((tenths % 600) / 10).toFixed(1).padStart(4, '0')}`;
};
