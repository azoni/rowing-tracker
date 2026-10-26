import { getAnalyticsEntries, getBenchmarkTrend, getComparableBenchmarks, getRowingAnalytics, summarizeRows } from './rowingAnalytics';

const date = (month, day, hour = 12, minute = 0) => new Date(2026, month - 1, day, hour, minute);
const now = date(10, 16);
const row = (day, extra = {}) => ({ userId: 'me', meters: 5000, time: 1500, date: day.toISOString(),
  machineType: 'concept2_pm5', sessionType: 'distance', verificationStatus: 'verified', ...extra });

test('excludes other users, test/pending/rejected rows, future and invalid dates, and nonfinite or nonpositive distances', () => {
  const valid = row(date(10, 1));
  const manual = row(date(10, 2), { verificationStatus: 'unverified', meters: '2000' });
  const ineligible = [{ userId: 'other' }, { isTest: true }, { verificationStatus: 'pending_review' },
    { verificationStatus: 'pending' }, { verificationStatus: 'rejected' }, { date: date(10, 16, 13).toISOString() },
    { date: null }, { date: 'bad' }, { date: false }, { date: true }, { meters: Infinity }, { meters: 'Infinity' }, { meters: -1 },
    { meters: '' }, { meters: true }, { meters: 0 }].map(extra => row(date(10, 2), extra));
  expect(getAnalyticsEntries([valid, manual, ...ineligible], 'me', now)).toEqual([valid, manual]);
});

test('uses inclusive local start and now boundaries and a prior window cut off at the same clock time', () => {
  const entries = [row(date(9, 19, 0)), row(now, { meters: 1000 }), row(date(9, 18, 12), { meters: 3000 }),
    row(date(9, 18, 12, 1), { meters: 50000 }), row(date(8, 22, 0), { meters: 1000 }),
    row(date(8, 21, 23, 59), { meters: 50000 }), row(date(10, 16, 12, 1), { meters: 50000 })];
  const result = getRowingAnalytics(entries, 'me', 4, now);
  expect(result.start).toEqual(date(9, 19, 0));
  expect(result.previousStart).toEqual(date(8, 22, 0));
  expect(result.previousEnd).toEqual(date(9, 18, 12));
  expect(result.end - result.start).toBe(result.previousEnd - result.previousStart);
  expect(result.current).toMatchObject({ meters: 6000, sessions: 2, activeDays: 2 });
  expect(result.previous.meters).toBe(4000);
  expect(result.comparison.meters).toEqual({ absolute: 2000, percent: 50, hasBaseline: true });
});

test('counts active days once, accepts numeric strings, and does not invent missing time', () => {
  const result = getRowingAnalytics([row(date(10, 1), { meters: '3000', time: '900' }),
    row(date(10, 1, 14), { meters: '2000', time: null }), row(date(10, 2), { time: Infinity }),
    row(date(10, 3), { time: -100 }), row(date(10, 4), { time: true })], 'me', 4, now);
  expect(result.current).toEqual({ meters: 20000, seconds: 900, sessions: 5, timedSessions: 1, activeDays: 4 });
  expect(result.comparison.meters.percent).toBeNull();
  expect(result.comparison.meters.hasBaseline).toBe(false);
});

test('supports Firestore timestamps and keeps local days at a daylight saving transition', () => {
  const fallNow = date(11, 3, 9);
  const result = getRowingAnalytics([row(date(11, 1, 0, 30)), row(date(11, 1, 23, 30)),
    row(date(10, 7, 0), { date: { toDate: () => date(10, 7, 0) } })], 'me', 4, fallNow);
  expect(result.start).toEqual(date(10, 7, 0));
  expect(result.previousStart).toEqual(date(9, 9, 0));
  expect(result.previousEnd).toEqual(date(10, 6, 9));
  expect(result.current.activeDays).toBe(2);
  expect(result.weekly[3].activeDays).toBe(1);
  expect(result.weekly[3].sessions).toBe(2);
  expect(result.weekly[3].start).toEqual(date(10, 28, 0));
});

test('weekly buckets sum to the period totals and preserve empty weeks', () => {
  const result = getRowingAnalytics([row(date(9, 19)), row(date(9, 25)), row(date(10, 16, 10))], 'me', 4, now);
  expect(result.weekly.map(week => week.sessions)).toEqual([2, 0, 0, 1]);
  expect(result.weekly.reduce((sum, week) => sum + week.meters, 0)).toBe(result.current.meters);
  expect(result.weekly[3].includesToday).toBe(true);
  expect(getRowingAnalytics([], 'me', 12, now).weekly).toHaveLength(12);
});

test('never mixes distance, machine, workout type, or unnamed custom equipment in benchmark comparisons', () => {
  const rows = [row(date(10, 1)), row(date(10, 2), { meters: 5001 }),
    row(date(10, 3), { machineType: 'hydrow' }), row(date(10, 4), { sessionType: 'timed' }),
    row(date(10, 5), { machineType: null }), row(date(10, 6), { machineType: 'gym_generic' }),
    row(date(10, 7), { machineType: 'other' }), row(date(10, 8), { sessionType: null })];
  expect(getComparableBenchmarks(rows)).toEqual([]);
  const [benchmark] = getComparableBenchmarks([...rows, row(date(10, 9), { time: 1400 })]);
  expect(benchmark.points).toHaveLength(2);
  expect(benchmark.meters).toBe(5000);
  expect(benchmark.paceChange).toBe(-10);
  expect(benchmark.first.pace).toBe(150);
  expect(benchmark.latest.pace).toBe(140);
});

test('benchmark requires different rowing days and positive finite time', () => {
  expect(getComparableBenchmarks([row(date(10, 1, 10)), row(date(10, 1, 14)),
    row(date(10, 2), { time: 0 }), row(date(10, 3), { time: Infinity }),
    row(date(10, 4), { time: -300 }), row(date(10, 5), { date: 'invalid' })])).toEqual([]);
});

test('normalizes custom labels without treating different named machines as comparable', () => {
  const groups = getComparableBenchmarks([
    row(date(10, 1), { machineType: 'other', machineCustomName: ' My   Rower ' }),
    row(date(10, 2), { machineType: 'other', machineCustomName: 'my rower' }),
    row(date(10, 3), { machineType: 'other', machineCustomName: 'Another Rower' }),
  ]);
  expect(groups).toHaveLength(1);
  expect(groups[0].points).toHaveLength(2);
});

test('benchmark is a chronological first-to-latest comparison inside the selected window', () => {
  const result = getRowingAnalytics([row(date(10, 15), { time: 1500 }), row(date(10, 1), { time: 1400 }),
    row(date(10, 5), { time: 1200 }), row(date(8, 1), { time: 1800 })], 'me', 4, now);
  expect(result.benchmarks[0].first.seconds).toBe(1400);
  expect(result.benchmarks[0].latest.seconds).toBe(1500);
  expect(result.benchmarks[0].paceChange).toBe(10);
  expect(result.benchmarks[0].points).toHaveLength(3);
});

test('empty totals are finite with no fake percentage gain or benchmark', () => {
  const result = getRowingAnalytics([], 'me', 4, now);
  expect(result.current).toEqual(summarizeRows([]));
  expect(result.comparison.activeDays).toEqual({ absolute: 0, percent: null, hasBaseline: false });
  expect(result.benchmarks).toEqual([]);
});

test('interval totals remain in recorded activity but cannot establish comparable pace', () => {
  const result = getRowingAnalytics([row(date(10, 1), { sessionType: 'interval' }),
    row(date(10, 9), { sessionType: 'interval', time: 1200 })], 'me', 4, now);
  expect(result.current).toMatchObject({ meters: 10000, seconds: 2700, sessions: 2 });
  expect(result.benchmarks).toEqual([]);
});

test.each([
  [1500, 1500, true],
  [null, 1500, false],
  [1500, null, false],
  [null, null, false],
])('time comparison requires complete coverage in both windows (%s, %s)', (currentTime, previousTime, complete) => {
  const result = getRowingAnalytics([row(date(10, 1)), row(date(10, 2), { time: currentTime }),
    row(date(9, 1)), row(date(9, 2), { time: previousTime })], 'me', 4, now);
  expect(result.timeComparisonComplete).toBe(complete);
  expect(result.current.seconds).toBe(1500 + (currentTime || 0));
  expect(result.previous.seconds).toBe(1500 + (previousTime || 0));
});

test('benchmark history preserves the actual time spacing and intermediate pace, not just the best row', () => {
  const [benchmark] = getComparableBenchmarks([row(date(10, 11), { time: 1500 }),
    row(date(10, 1), { time: 1400 }), row(date(10, 3), { time: 1200 })]);
  const trend = getBenchmarkTrend(benchmark);
  expect(trend.points.map(point => point.pace)).toEqual([140, 120, 150]);
  expect(trend.points.map(point => point.x)).toEqual([0, 0.2, 1]);
  expect(trend.points[1].y).toBeGreaterThan(trend.points[0].y);
  expect(trend.points.every(point => point.y > 0 && point.y < 1)).toBe(true);
  expect(trend.minimumPace).toBeLessThan(120);
  expect(trend.maximumPace).toBeGreaterThan(150);
  expect(benchmark.paceChange).toBe(10);
});

test('equal benchmark paces stay level and sub-second variation is not expanded to fill the chart', () => {
  const [flat] = getComparableBenchmarks([row(date(10, 1)), row(date(10, 2))]);
  const flatTrend = getBenchmarkTrend(flat);
  expect(flatTrend.points.map(point => point.y)).toEqual([0.5, 0.5]);
  expect(flatTrend.maximumPace - flatTrend.minimumPace).toBe(2);
  const [near] = getComparableBenchmarks([row(date(10, 1)), row(date(10, 2), { time: 1500.1 })]);
  const nearTrend = getBenchmarkTrend(near);
  expect(Math.abs(nearTrend.points[1].y - nearTrend.points[0].y)).toBeLessThan(0.01);
});
