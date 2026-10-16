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
