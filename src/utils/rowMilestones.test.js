import { getRowMilestones } from './rowMilestones';

const now = new Date(2026, 9, 25, 12);
const date = day => new Date(2026, 9, day, 10).toISOString();
const users = {
  a: { id: 'a', name: 'Amir', totalMeters: 9000000, uploadCount: 999 },
  b: { id: 'b', name: 'Bea', totalMeters: 0 },
};
const row = (id, extra = {}) => ({
  id, userId: 'a', meters: 2000, time: 480, date: date(25), verificationStatus: 'verified',
  machineType: 'concept2_pm5', sessionType: 'distance', ...extra,
});
const derive = (entries, savedEntry, extra = {}) => getRowMilestones({ users, entries, userId: 'a', savedEntry, now, ...extra });
const freeze = value => {
  if (value && typeof value === 'object' && !Object.isFrozen(value)) {
    Object.values(value).forEach(freeze);
    Object.freeze(value);
  }
  return value;
};
beforeEach(() => { jest.useFakeTimers().setSystemTime(now); });
afterEach(() => { jest.useRealTimers(); });

test('uses the exact persisted row once even if the live subscription already delivered it, without mutating input', () => {
  const saved = freeze(row('saved', { meters: '5000', time: '1200' }));
  const entries = freeze([row('earlier', { meters: 1000, date: date(24) }), row('saved', { meters: 8000 }), saved]);
  const profile = freeze({ ...users.a, unlockedAchievements: { first_row: '2026-10-24T10:00:00.000Z' } });
  const result = derive(entries, saved, { users: { ...users, a: profile } });
  expect(result.eligible).toBe(true);
  expect(result.afterUser).toMatchObject({ totalMeters: 6000, totalTime: 1680, uploadCount: 2 });
  expect(result.afterUser.rows.map(entry => entry.id)).toEqual(['earlier', 'saved']);
  expect(result.previousRank.title).toBe('Landlubber');
  expect(result.promotion.title).toBe('Deckhand');
  expect(result.newlyUnlocked.map(achievement => achievement.id)).toContain('first_5k');
  expect(result.newlyUnlocked.map(achievement => achievement.id)).not.toContain('first_row');
  expect(result.isDistancePR).toBe(true);
  expect(saved.meters).toBe('5000');
  expect(profile.totalMeters).toBe(9000000);
  expect(profile.unlockedAchievements).toEqual({ first_row: '2026-10-24T10:00:00.000Z' });
});

test.each([
  ['pending', { verificationStatus: 'pending' }],
  ['pending review', { verificationStatus: 'pending_review' }],
  ['rejected', { verificationStatus: 'rejected' }],
  ['test', { isTest: true }],
  ['future', { date: date(26) }],
  ['invalid distance', { meters: NaN }],
  ['missing date', { date: null }],
])('an ineligible %s save cannot trigger any award, promotion or record', (name, extra) => {
  const result = derive([row('old', { meters: 5000, date: date(24) })], row('saved', { meters: 50000, ...extra }));
  expect(result.eligible).toBe(false);
  expect(result.afterUser.totalMeters).toBe(5000);
  expect(result.newlyUnlocked).toEqual([]);
  expect(result.promotion).toBeNull();
  expect(result.isDistancePR).toBe(false);
  expect(result.newDistanceRecord).toBeNull();
});

test('an eligible manual row earns qualifying badges but never a verified distance record', () => {
  const result = derive([], row('manual', { meters: 5000, verificationStatus: 'unverified' }));
  expect(result.newlyUnlocked.map(achievement => achievement.id)).toEqual(expect.arrayContaining(['first_row', 'first_5k']));
  expect(result.newDistanceRecord).toBeNull();
  expect(result.promotion.title).toBe('Deckhand');
  expect(result.isDistancePR).toBe(false);
});

test('cached counters do not create promotions or high-distance achievements', () => {
  const result = derive([], row('first', { meters: 500 }));
  expect(result.afterUser.totalMeters).toBe(500);
  expect(result.previousRank.title).toBe('Landlubber');
  expect(result.newRank.title).toBe('Landlubber');
  expect(result.promotion).toBeNull();
  ['first_5k', 'million'].forEach(id => expect(result.newlyUnlocked.map(achievement => achievement.id)).not.toContain(id));
  expect(result.isDistancePR).toBe(false);
});

test('excluded historical rows cannot create new badges, while stored unlocks remain intact', () => {
  const stored = { first_row: '2025-01-01', million: '2025-02-02' };
  const result = derive([
    row('pending', { meters: 1000000, verificationStatus: 'pending_review' }),
    row('future', { meters: 1000000, date: date(26) }),
    row('test', { meters: 1000000, isTest: true }),
  ], row('new', { meters: 1000 }), { users: { ...users, a: { ...users.a, unlockedAchievements: stored } } });
  expect(result.afterUser.unlockedAchievements).toEqual(stored);
  expect(result.afterUser.totalMeters).toBe(1000);
  ['first_row', 'million', 'first_5k'].forEach(id => expect(result.newlyUnlocked.map(achievement => achievement.id)).not.toContain(id));
  expect(result.promotion).toBeNull();
});

test('records compare the same user, exact distance, machine and workout against eligible verified history', () => {
  const result = derive([
    row('same-setup', { time: 500, date: date(24) }),
    row('other-machine', { time: 300, machineType: 'hydrow' }),
    row('other-workout', { time: 300, sessionType: 'timed' }),
    row('other-user', { userId: 'b', time: 300 }),
    row('pending-fast', { time: 100, verificationStatus: 'pending_review' }),
    row('manual-fast', { time: 100, verificationStatus: 'unverified' }),
    row('nearby-distance', { meters: 1990, time: 100 }),
  ], row('saved', { time: 450 }));
  expect(result.newDistanceRecord).toEqual({
    distanceMeters: 2000, distanceLabel: '2K', time: 450, previousBest: 500, isFirstRecord: false,
    machineType: 'concept2_pm5', machineCustomName: null, sessionType: 'distance',
    setupKey: JSON.stringify([2000, 'concept2_pm5', '', 'distance']),
  });
});

test.each([480, 500])('an equal or slower %s-second piece is not a new record', time => {
  const result = derive([row('prior', { time: 480, date: date(24) })], row('saved', { time }));
  expect(result.newDistanceRecord).toBeNull();
  expect(result.isDistancePR).toBe(false);
});

test.each([
  ['interval', { sessionType: 'interval' }],
  ['approximate distance', { meters: 1990 }],
  ['generic machine', { machineType: 'gym_generic' }],
  ['unknown machine', { machineType: 'unknown' }],
  ['missing workout', { sessionType: null }],
  ['unnamed custom machine', { machineType: 'other' }],
  ['missing time', { time: null }],
])('a %s session remains eligible for distance but cannot establish a comparable time', (name, extra) => {
  const result = derive([], row('saved', extra));
  expect(result.eligible).toBe(true);
  expect(result.newDistanceRecord).toBeNull();
});

test('named custom machines match normalized names and keep other machines separate', () => {
  const result = derive([
    row('same', { machineType: 'other', machineCustomName: 'Club Rower', time: 500 }),
    row('different', { machineType: 'other', machineCustomName: 'Another model', time: 300 }),
  ], row('saved', { machineType: 'other', machineCustomName: '  club   rower ', time: 450 }));
  expect(result.newDistanceRecord).toMatchObject({ previousBest: 500, machineCustomName: 'club rower', time: 450 });
});

test('a first verified piece establishes a setup record without claiming a previous personal best', () => {
  const result = derive([], row('first'));
  expect(result.newDistanceRecord).toMatchObject({ previousBest: null, isFirstRecord: true, time: 480 });
  expect(result.isDistancePR).toBe(false);
});

test('a missing, unknown or mismatched saved-row owner cannot award another member', () => {
  const previous = row('same-id', { meters: 1000 });
  const mismatch = derive([previous], row('same-id', { userId: 'b', meters: 5000 }));
  expect(mismatch.eligible).toBe(false);
  expect(mismatch.afterUser.totalMeters).toBe(1000);
  expect(mismatch.newlyUnlocked).toEqual([]);
  const absent = derive([], row('saved', { userId: 'missing' }), { userId: 'missing' });
  expect(absent.afterUser).toBeNull();
  expect(absent.eligible).toBe(false);
  expect(absent.promotion).toBeNull();
  const noRow = derive([previous], undefined);
  expect(noRow.afterUser.totalMeters).toBe(1000);
  expect(noRow.eligible).toBe(false);
});
