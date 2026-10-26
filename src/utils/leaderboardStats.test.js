import { buildLeaderboardStats, formatRecordTime, getDerivedAchievements, getDerivedAchievementProgress } from './leaderboardStats';
import { ACHIEVEMENTS } from '../constants/achievements';

const now = new Date(2026, 9, 25, 12);
const date = (day, hour = 10) => new Date(2026, 9, day, hour).toISOString();
const users = {
  a: { id: 'a', name: 'Amir', totalMeters: 999999, uploadCount: 999 },
  b: { id: 'b', name: 'Bea', totalMeters: 1 },
};
const row = (id, userId = 'a', extra = {}) => ({
  id, userId, meters: 2000, time: 480, date: date(24), verificationStatus: 'verified',
  machineType: 'concept2_pm5', sessionType: 'distance', ...extra,
});
const build = (entries, options = {}) => buildLeaderboardStats({ users, entries, now, achievements: [], ...options });

test('uses numeric eligible ledger totals and leaves stored profiles and rows untouched', () => {
  const entries = [
    row('valid'), row('numeric-string', 'a', { meters: '1000' }),
    row('legacy-manual', 'b', { verificationStatus: 'unverified' }),
    ...['pending', 'pending_review', 'rejected'].map(status => row(status, 'a', { verificationStatus: status })),
    row('test', 'a', { isTest: true }), row('future', 'a', { date: date(26) }),
    row('invalid-date', 'a', { date: 'not-a-date' }), row('null-date', 'a', { date: null }),
    row('boolean-date', 'a', { date: true }),
    row('boolean', 'a', { meters: true }), row('infinity', 'a', { meters: Infinity }),
    row('negative', 'a', { meters: -500 }), row('missing-user', 'absent'),
  ];
  const original = JSON.stringify({ users, entries });
  const stats = build(entries);
  expect(stats.allTime.map(user => [user.id, user.totalMeters, user.uploadCount])).toEqual([['a', 3000, 2], ['b', 2000, 1]]);
  expect(stats.byUser.a.profile.totalMeters).toBe(999999);
  expect(stats.summary).toEqual({ rowers: 2, rows: 3, meters: 5000 });
  expect(stats.records[2000][0].rows).toHaveLength(1);
  expect(JSON.stringify({ users, entries })).toBe(original);
});

test('Monday–Sunday week includes Sunday, excludes last Sunday and future rows, and resets on Monday', () => {
  const entries = [
    row('last-sunday', 'a', { date: date(18), meters: 10000 }),
    row('monday', 'a', { date: date(19, 0), meters: 1000 }),
    row('sunday', 'b', { date: date(25), meters: 3000 }),
    row('next-monday', 'a', { date: date(26, 0), meters: 4000 }),
  ];
  const sunday = build(entries);
  expect(sunday.week.start).toEqual(new Date(2026, 9, 19));
  expect(sunday.week.end).toEqual(new Date(2026, 9, 26));
  expect(sunday.weekly.map(user => [user.id, user.weeklyMeters])).toEqual([['b', 3000], ['a', 1000]]);
  const monday = build(entries, { now: new Date(2026, 9, 26, 0, 1) });
  expect(monday.weekly.map(user => [user.id, user.weeklyMeters])).toEqual([['a', 4000]]);
});

test('week boundaries use local calendar arithmetic across daylight-saving changes', () => {
  // Run under TZ=America/Los_Angeles as well as the default test environment.
  const stats = build([], { now: new Date(2026, 10, 1, 12) });
  expect(stats.week.start).toEqual(new Date(2026, 9, 26, 0));
  expect(stats.week.end).toEqual(new Date(2026, 10, 2, 0));
});

test('current and best streaks use unique eligible local days; pending rows cannot bridge a gap', () => {
  const entries = [
    row('old-1', 'a', { date: date(10) }), row('old-2', 'a', { date: date(11) }), row('old-3', 'a', { date: date(12) }),
    row('recent', 'a', { date: date(24) }), row('same-day', 'a', { date: date(24, 11) }),
    row('pending-today', 'a', { date: date(25), verificationStatus: 'pending_review' }),
    row('inactive', 'b', { date: date(20) }),
  ];
  const stats = build(entries);
  expect(stats.byUser.a).toMatchObject({ streak: 1, longestStreak: 3 });
  expect(stats.byUser.b).toMatchObject({ streak: 0, longestStreak: 1 });
  expect(build(entries, { now: new Date(2026, 9, 26, 12) }).byUser.a.streak).toBe(0);
});

test('deduplicates row IDs and scopes boards without changing global per-user calculations', () => {
  const a = row('a');
  const entries = [a, a, row('b', 'b')];
  const stats = build(entries, { memberIds: ['b'] });
  expect(stats.allTime.map(user => user.id)).toEqual(['b']);
  expect(stats.summary).toEqual({ rowers: 1, rows: 1, meters: 2000 });
  expect(stats.byUser.a.totalMeters).toBe(2000);
  const unresolvedGroup = build(entries, { memberIds: [] });
  expect(unresolvedGroup.allTime).toEqual([]);
  expect(unresolvedGroup.records[2000]).toEqual([]);
});

test('awards retain saved unlocks but do not create new progress from excluded rows or cached totals', () => {
  const achievements = [
    { id: 'saved', check: () => false },
    { id: 'first', check: (user, entries) => entries.length >= 1 },
    { id: 'distance', check: user => user.totalMeters >= 5000 },
  ];
  const stats = build([row('pending', 'a', { verificationStatus: 'pending_review' }), row('real', 'b')], {
    achievements, users: { a: { ...users.a, unlockedAchievements: { saved: '2026-01-01' } }, b: users.b },
  });
  expect(stats.byUser.a.achievementCount).toBe(1);
  expect(stats.byUser.b.achievementCount).toBe(1);
});

test('records compare exact distances and known single-piece setups, never pending rows, intervals or unknown machines', () => {
  const entries = [
    row('best'), row('slower', 'a', { time: 500 }), row('competitor', 'b', { time: 490 }),
    row('other-machine', 'b', { machineType: 'hydrow', time: 400 }),
    row('other-workout', 'a', { sessionType: 'timed', time: 420 }),
    row('approximate', 'a', { meters: 1990, time: 300 }),
    row('pending', 'a', { verificationStatus: 'pending_review', time: 100 }),
    row('manual', 'a', { verificationStatus: 'unverified', time: 100 }),
    row('interval', 'a', { sessionType: 'interval', time: 100 }),
    row('generic', 'a', { machineType: 'gym_generic', time: 100 }),
    row('unknown', 'a', { machineType: 'no-such-machine', time: 100 }),
    row('missing-workout', 'a', { sessionType: undefined, time: 100 }),
    row('unnamed-custom', 'a', { machineType: 'other', time: 100 }),
    row('invalid-time', 'a', { time: true }),
  ];
  const setups = build(entries).records[2000];
  expect(setups).toHaveLength(3);
  expect(setups.find(setup => setup.label === 'Concept2 PM5 · Distance row').rows.map(entry => entry.id)).toEqual(['best', 'competitor']);
  expect(setups.find(setup => setup.machineType === 'hydrow').rows[0].id).toBe('other-machine');
  expect(setups.flatMap(setup => setup.rows).map(entry => entry.id)).toHaveLength(4);
});

test('named custom machines match normalized names, with separate machines kept apart', () => {
  const stats = build([
    row('custom-a', 'a', { machineType: 'other', machineCustomName: ' Club   Rower ' }),
    row('custom-b', 'b', { machineType: 'other', machineCustomName: 'club rower', time: 460 }),
    row('different', 'b', { machineType: 'other', machineCustomName: 'Another model', time: 400 }),
  ]);
  expect(stats.records[2000]).toHaveLength(2);
  expect(stats.records[2000].find(setup => setup.rows.length === 2).rows.map(entry => entry.id)).toEqual(['custom-b', 'custom-a']);
});

test('ties use the earliest equal total within that period, then stable IDs; record ties use earliest row', () => {
  const stats = build([
    row('a-week', 'a', { date: date(20) }), row('b-week', 'b', { date: date(19) }),
    row('a-history', 'a', { date: date(1) }), row('b-history', 'b', { date: date(2) }),
    row('a-record-tie', 'a', { date: date(21) }),
  ]);
  expect(stats.records[2000][0].rows.find(entry => entry.userId === 'a').id).toBe('a-history');
  const equal = build([row('a', 'a'), row('b', 'b')]);
  expect(equal.weekly.map(user => user.id)).toEqual(['a', 'b']);
  const earlier = build([row('a', 'a', { date: date(20) }), row('b', 'b', { date: date(19) })]);
  expect(earlier.weekly.map(user => user.id)).toEqual(['b', 'a']);
});

test('accepts Firestore-style dates and formats rounded times without a 60-second remainder', () => {
  expect(build([row('timestamp', 'a', { date: { toDate: () => new Date(2026, 9, 24) } })]).summary.rows).toBe(1);
  expect(formatRecordTime(119.96)).toBe('2:00.0');
  expect(formatRecordTime(479.25)).toBe('7:59.3');
});

test('pending time/calories and stale profile counters never earn read-only badges', () => {
  const achievements = ACHIEVEMENTS.filter(badge => ['first_row', 'first_hour', 'first_1k_cal', 'first_5k'].includes(badge.id));
  const storedUsers = { a: { ...users.a, totalTime: 999999, totalCalories: 999999 } };
  const pending = row('pending', 'a', { verificationStatus: 'pending_review', time: 3600, calories: 1000 });
  const empty = build([pending], { users: storedUsers, achievements });
  expect(empty.byUser.a).toMatchObject({ totalMeters: 0, totalTime: 0, totalCalories: 0, achievementCount: 0 });
  expect(getDerivedAchievements(empty.byUser.a, achievements)).toEqual([]);
  const hour = achievements.find(badge => badge.id === 'first_hour');
  expect(getDerivedAchievementProgress(empty.byUser.a, hour)).toEqual({ current: 0, target: 3600 });

  const actual = build([pending, row('timed', 'a', { time: '120', calories: '50' }),
    row('invalid-optional', 'a', { time: Infinity, calories: true })], { users: storedUsers, achievements });
  expect(actual.byUser.a).toMatchObject({ totalMeters: 4000, totalTime: 120, totalCalories: 50, achievementCount: 1 });
  expect(getDerivedAchievements(actual.byUser.a, achievements).map(badge => badge.id)).toEqual(['first_row']);
  expect(getDerivedAchievementProgress(actual.byUser.a, hour)).toEqual({ current: 120, target: 3600 });
  expect(actual.byUser.a.profile.totalTime).toBe(999999);
  expect(storedUsers.a.totalCalories).toBe(999999);
});

test('saved unlock dates and completed progress survive excluded historical rows in every badge view', () => {
  const achievements = ACHIEVEMENTS.filter(badge => ['first_row', 'first_hour'].includes(badge.id));
  const unlockedDate = '2025-08-11T09:00:00.000Z';
  const stats = build([row('rejected', 'a', { verificationStatus: 'rejected', time: 3600 })], {
    users: { a: { ...users.a, unlockedAchievements: { first_hour: unlockedDate, first_row: unlockedDate } } }, achievements,
  });
  const earned = getDerivedAchievements(stats.byUser.a, achievements);
  expect(earned).toHaveLength(stats.byUser.a.achievementCount);
  expect(earned.map(badge => badge.unlockedDate)).toEqual([unlockedDate, unlockedDate]);
  expect(earned.find(badge => badge.id === 'first_hour').progress).toEqual({ current: 3600, target: 3600 });
  expect(earned.find(badge => badge.id === 'first_row').progress).toEqual({ current: 1, target: 1 });
  expect(getDerivedAchievements(undefined)).toEqual([]);
  expect(getDerivedAchievementProgress(undefined, achievements[0])).toEqual({ current: 0, target: 1 });
});
