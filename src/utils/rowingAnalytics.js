import { ROWING_MACHINES } from '../constants/machines';

const DAY = 86400000;
// Interval totals do not preserve the work/rest structure needed to compare a piece.
const WORKOUT_TYPES = new Set(['free_row', 'timed', 'distance']);
const KNOWN_MACHINES = new Set(ROWING_MACHINES.map(machine => machine.id));

const positiveNumber = value => (
  (typeof value === 'number' || (typeof value === 'string' && value.trim() !== '')) &&
  Number.isFinite(Number(value)) && Number(value) > 0 ? Number(value) : 0
);

export const getAnalyticsDate = value => {
  if (value === null || value === undefined || value === '' || typeof value === 'boolean') return new Date(NaN);
  return value?.toDate ? value.toDate() : new Date(value);
};

// Calendar arithmetic preserves local dates and clock times across DST changes.
const shiftDays = (date, days) => {
  const shifted = new Date(date);
  shifted.setDate(shifted.getDate() + days);
  return shifted;
};
const calendarDay = date => Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()) / DAY;

export const getAnalyticsEntries = (entries = [], userId, now = new Date()) => entries.filter(entry => {
  const date = getAnalyticsDate(entry.date);
  return entry.userId === userId && !entry.isTest &&
    !['rejected', 'pending_review', 'pending'].includes(entry.verificationStatus) &&
    positiveNumber(entry.meters) > 0 && Number.isFinite(date.getTime()) && date <= now;
});

export const summarizeRows = rows => ({
  meters: rows.reduce((total, row) => total + positiveNumber(row.meters), 0),
  seconds: rows.reduce((total, row) => total + positiveNumber(row.time), 0),
  timedSessions: rows.filter(row => positiveNumber(row.time) > 0).length,
  sessions: rows.length,
  activeDays: new Set(rows.map(row => calendarDay(getAnalyticsDate(row.date)))).size,
});

const compare = (current, previous) => ({
  absolute: current - previous,
  percent: previous > 0 ? (current - previous) / previous * 100 : null,
  hasBaseline: previous > 0,
});

export const getComparableBenchmarks = rows => {
  const groups = new Map();
  rows.forEach(row => {
    const date = getAnalyticsDate(row.date);
    const meters = positiveNumber(row.meters);
    const seconds = positiveNumber(row.time);
    const machine = row.machineType;
    const customName = typeof row.machineCustomName === 'string' ? row.machineCustomName.trim().replace(/\s+/g, ' ') : '';
    // Missing or generic equipment labels cannot establish a comparable setup.
    if (!meters || !seconds || !Number.isFinite(date.getTime()) || !KNOWN_MACHINES.has(machine) || machine === 'gym_generic' ||
      (machine === 'other' && !customName) || !WORKOUT_TYPES.has(row.sessionType)) return;
    const key = JSON.stringify([meters, machine, machine === 'other' ? customName.toLowerCase() : '', row.sessionType]);
    if (!groups.has(key)) groups.set(key, {
      key, meters, machineType: machine, machineCustomName: customName, sessionType: row.sessionType, points: [],
    });
    groups.get(key).points.push({ date, pace: seconds / meters * 500, seconds, id: row.id || '' });
  });
  return [...groups.values()].filter(group => new Set(group.points.map(point => calendarDay(point.date))).size >= 2)
    .map(group => {
      group.points.sort((a, b) => a.date - b.date || String(a.id).localeCompare(String(b.id)));
      const first = group.points[0];
      const latest = group.points[group.points.length - 1];
      return { ...group, first, latest, paceChange: latest.pace - first.pace,
        percentChange: (latest.pace - first.pace) / first.pace * 100 };
    }).sort((a, b) => b.points.length - a.points.length || b.latest.date - a.latest.date || a.key.localeCompare(b.key));
};

export const getBenchmarkTrend = benchmark => {
  const paces = benchmark.points.map(point => point.pace);
  const fastest = Math.min(...paces);
  const slowest = Math.max(...paces);
  // Keep equal or near-equal paces level instead of magnifying sub-second noise.
  const padding = Math.max(1, (slowest - fastest) * 0.15);
  const minimumPace = Math.max(0, fastest - padding);
  const maximumPace = slowest + padding;
  const start = benchmark.first.date.getTime();
  const elapsed = benchmark.latest.date.getTime() - start;
  return {
    minimumPace, maximumPace,
    points: benchmark.points.map(point => ({ ...point,
      x: elapsed > 0 ? (point.date.getTime() - start) / elapsed : 0.5,
      y: (maximumPace - point.pace) / (maximumPace - minimumPace),
    })),
  };
};

export const getRowingAnalytics = (entries, userId, weeks = 4, now = new Date()) => {
  const weekCount = weeks === 12 ? 12 : 4;
  const days = weekCount * 7;
  const start = shiftDays(now, 1 - days);
  start.setHours(0, 0, 0, 0);
  const previousStart = shiftDays(start, -days);
  // Both windows end at the same local clock time on their final day. The
  // previous period never gets an extra afternoon while today is still ongoing.
  const previousEnd = shiftDays(now, -days);
  const eligible = getAnalyticsEntries(entries, userId, now);
  const between = (from, to) => eligible.filter(row => {
    const date = getAnalyticsDate(row.date);
    return date >= from && date <= to;
  });
  const rows = between(start, now);
  const current = summarizeRows(rows);
  const previous = summarizeRows(between(previousStart, previousEnd));
  const weekly = Array.from({ length: weekCount }, (_, index) => {
    const weekStart = shiftDays(start, index * 7);
    const weekEnd = shiftDays(weekStart, 6);
    const weekRows = rows.filter(row => Math.floor((calendarDay(getAnalyticsDate(row.date)) - calendarDay(start)) / 7) === index);
    return { start: weekStart, end: weekEnd, ...summarizeRows(weekRows), includesToday: index === weekCount - 1 };
  });
  return {
    weeks: weekCount, days, start, end: new Date(now), previousStart, previousEnd, current, previous, weekly,
    timeComparisonComplete: current.timedSessions === current.sessions && previous.timedSessions === previous.sessions,
    comparison: Object.fromEntries(['meters', 'seconds', 'sessions', 'activeDays'].map(key => [key, compare(current[key], previous[key])])),
    benchmarks: getComparableBenchmarks(rows),
  };
};
