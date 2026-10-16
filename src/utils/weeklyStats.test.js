import { getWeeklyStats } from './weeklyStats';

test('uses Monday boundaries, counts active days once, and ignores other users and future rows', () => {
  const now = new Date(2026, 9, 15, 12);
  const row = (day, meters, userId = 'me', hour = 9) => ({ userId, meters, date: new Date(2026, 9, day, hour).toISOString() });
  const stats = getWeeklyStats([row(11, 1000), row(12, 2000), row(12, 500), row(14, 3000),
    row(15, 9000, 'other'), row(15, 1000, 'me', 15), row(16, 1000)], 'me', now);
  expect(stats.start.getDate()).toBe(12);
  expect(stats.meters).toBe(5500);
  expect(stats.sessions).toBe(3);
  expect(stats.activeDays).toBe(2);
  expect(stats.days[3].today).toBe(true);
  expect(stats.days[4].future).toBe(true);
});

test('Sunday still belongs to the week starting the previous Monday, across year boundaries', () => {
  const stats = getWeeklyStats([], 'me', new Date(2027, 0, 3, 23));
  expect(stats.start.getFullYear()).toBe(2026);
  expect(stats.start.getMonth()).toBe(11);
  expect(stats.start.getDate()).toBe(28);
  expect(stats.days[6].today).toBe(true);
});

test('matches mission and analytics eligibility for manual and verified rows without counting review or test uploads', () => {
  const now = new Date(2026, 9, 15, 12);
  const row = extra => ({ userId: 'me', meters: 1000, date: new Date(2026, 9, 14, 9).toISOString(), ...extra });
  const rows = [row({ verificationStatus: 'verified' }), row({ verificationStatus: 'unverified', meters: '2000' }),
    ...['pending', 'pending_review', 'rejected'].map(verificationStatus => row({ verificationStatus })),
    row({ isTest: true }), row({ meters: Infinity }), row({ meters: 0 }), row({ meters: -1 }), row({ date: 'bad' })];
  expect(getWeeklyStats(rows, 'me', now)).toMatchObject({ meters: 3000, sessions: 2, activeDays: 1 });
});

test('supports Firestore dates and keeps the complete Sunday at a daylight-saving boundary', () => {
  const now = new Date(2026, 10, 1, 23, 30);
  const row = date => ({ userId: 'me', meters: 1000, date });
  const rows = [row({ toDate: () => new Date(2026, 9, 26) }),
    row(new Date(2026, 10, 1, 0, 30).toISOString()), row(new Date(2026, 10, 1, 23).toISOString()),
    row({ toDate: () => new Date(2026, 10, 2) }), row({ toDate: () => new Date(NaN) })];
  const stats = getWeeklyStats(rows, 'me', now);
  expect(stats.start).toEqual(new Date(2026, 9, 26));
  expect(stats).toMatchObject({ meters: 3000, sessions: 3, activeDays: 2 });
  expect(stats.days[6]).toMatchObject({ sessions: 2, today: true });
});
