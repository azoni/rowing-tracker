import { getMonthlyProgram } from '../constants/monthly';
import { ACHIEVEMENTS } from '../constants/achievements';
import {
  getAdvancedHabitMetrics, getBestRowStreak, getChallengeScore, getEligibleEntries, getHabitMetrics,
  getMonthEntries, getMonthlyRewards, getMonthlySummary, getPersonalMissions,
  getThrowdownProgress,
} from './rowingGoals';

const date = (year, month, day, hour = 12) => new Date(year, month - 1, day, hour);
const row = (day, extra = {}) => ({ userId: 'a', meters: 1000, time: 300, date: day.toISOString(), verificationStatus: 'verified', ...extra });
const users = { a: { name: 'A' }, b: { name: 'B' } };
const now = date(2027, 1, 15);

describe('monthly program compatibility', () => {
  test('keeps existing October and older challenges and changes at November boundary', () => {
    expect(getMonthlyProgram(date(2026, 10, 31)).challenge.id).toBe('most-meters-2');
    expect(getMonthlyProgram(date(2025, 11, 1)).challenge.id).toBe('fastest-500-2');
    expect(getMonthlyProgram(date(2026, 11, 1)).challenge.id).toBe('three-distance-tour');
    expect(getMonthlyProgram(date(2027, 1, 1)).throwdown.field).toBe('active_days');
  });

  test('preserves legacy timing tolerance without applying new normalization', () => {
    const legacy = getMonthlyProgram(date(2026, 1, 1)).challenge;
    expect(getChallengeScore(legacy, [row(date(2026, 1, 1), { meters: 1800, time: 360 })]).value).toBe(360);
    const refreshed = getMonthlyProgram(date(2027, 1, 1)).challenge;
    expect(getChallengeScore(refreshed, [row(date(2027, 1, 1), { meters: 1800, time: 360 })])).toBeNull();
    expect(getChallengeScore(refreshed, [row(date(2027, 1, 1), { meters: 2010, time: 402 })]).value).toBe(400);
  });
});

describe('entry eligibility and dates', () => {
  const entries = [
    row(date(2026, 11, 1)),
    row(date(2026, 11, 2), { verificationStatus: 'unverified' }),
    row(date(2026, 11, 3), { verificationStatus: 'pending_review' }),
    row(date(2026, 11, 4), { verificationStatus: 'rejected' }),
    row(date(2026, 11, 5), { isTest: true }),
    row(date(2026, 11, 6), { meters: -100 }),
    row(date(2026, 11, 7), { date: 'invalid' }),
    row(date(2027, 2, 1)),
  ];

  test('counts saved manual/verified rows, excluding pending, rejected, test, invalid and future rows', () => {
    expect(getEligibleEntries(entries, now)).toHaveLength(2);
    expect(getMonthEntries(entries, date(2026, 11, 1), now)).toHaveLength(2);
    expect(getMonthEntries(entries, date(2026, 11, 1), now, true)).toHaveLength(5);
  });

  test('uses an exclusive month end, including the last millisecond', () => {
    const last = new Date(2026, 10, 30, 23, 59, 59, 999);
    expect(getMonthEntries([row(last), row(new Date(2026, 11, 1))], date(2026, 11, 1), now)).toHaveLength(1);
  });

  test('calendar streaks work through daylight saving time and deduplicate rows', () => {
    const days = [date(2026, 11, 1), date(2026, 11, 1, 15), date(2026, 11, 2), date(2026, 11, 3)];
    expect(getBestRowStreak(days.map(day => row(day)))).toBe(3);
    expect(getBestRowStreak([])).toBe(0);
  });
});

describe('new challenges and personal missions', () => {
  test('tour requires all three distances and uses equal-weight pace, with earliest completion breaking ties', () => {
    const entries = [
      row(date(2026, 11, 1), { meters: 1000, time: 240 }),
      row(date(2026, 11, 2), { meters: 2000, time: 480 }),
      row(date(2026, 11, 3), { meters: 5000, time: 1500 }),
      row(date(2026, 11, 4), { meters: 1000, time: 240 }),
      row(date(2026, 11, 1), { meters: 1000, time: 240, userId: 'b' }),
      row(date(2026, 11, 2), { meters: 2000, time: 480, userId: 'b' }),
      row(date(2026, 11, 5), { meters: 5000, time: 1500, userId: 'b' }),
    ];
    const summary = getMonthlySummary({ entries, users, userId: 'b', date: date(2026, 11, 1), now });
    expect(summary.leaderboard.map(item => item.userId)).toEqual(['a', 'b']);
    expect(summary.userRank).toBe(2);
    expect(summary.userScore.value).toBe(130);
    expect(summary.userScore.display).toBe('2:10.0/500m');
    expect(summary.leaderboard[0].bestDate).toEqual(date(2026, 11, 3));
    expect(getChallengeScore(summary.challenge, entries.filter(entry => entry.meters !== 5000))).toBeNull();
  });

  test('tour normalizes tolerance, rejects untimed pieces, and keeps the first date of a rounded tied score', () => {
    const challenge = getMonthlyProgram(date(2026, 11, 1)).challenge;
    const entries = [
      row(date(2026, 11, 1), { meters: 990, time: 237.6 }),
      row(date(2026, 11, 2), { meters: 2010, time: 482.4 }),
      row(date(2026, 11, 3), { meters: 5000, time: 1200 }),
    ];
    expect(getChallengeScore(challenge, entries).value).toBe(120);
    expect(getChallengeScore(challenge, entries.map(entry => entry.meters === 5000 ? { ...entry, time: null } : entry))).toBeNull();
    expect(getChallengeScore(challenge, entries.map(entry => entry.meters === 990 ? { ...entry, meters: 989 } : entry))).toBeNull();
    entries.push(row(date(2026, 11, 6), { meters: 1000, time: 239.9 }));
    expect(getChallengeScore(challenge, entries).value).toBe(120);
    expect(getChallengeScore(challenge, entries).bestDate).toEqual(date(2026, 11, 3));
    entries.push(row(date(2026, 11, 8), { meters: 1000, time: 228 }));
    expect(getChallengeScore(challenge, entries).value).toBe(118);
    expect(getChallengeScore(challenge, entries).bestDate).toEqual(date(2026, 11, 8));
  });

  test('timed events normalize meters and reject rows outside the published duration', () => {
    const challenge = getMonthlyProgram(date(2026, 12, 1)).challenge;
    const entries = [row(date(2026, 12, 1), { time: 1200, meters: 5000 }), row(date(2026, 12, 2), { time: 1300, meters: 6000 })];
    expect(getChallengeScore(challenge, entries).value).toBe(5000);
    expect(getChallengeScore(challenge, [row(date(2026, 12, 1), { time: 1205, meters: 4820 })]).value).toBe(4800);
  });

  test('day missions cannot be completed by splitting the same day into many uploads', () => {
    const entries = [row(date(2026, 11, 1)), row(date(2026, 11, 1, 14)), row(date(2026, 11, 2))];
    const missions = getPersonalMissions(entries, date(2026, 11, 1), now);
    expect(missions[0].current).toBe(2);
    expect(missions[0].complete).toBe(false);
    expect(missions[1].current).toBe(1);
    expect(missions[2].baseComplete).toBe(true);
    expect(missions[2].tiers[0].complete).toBe(true);
    expect(missions[2].complete).toBe(false);
    expect(missions[2].activeTier).toBe(1);
  });

  test('starter mission progress stays earned while substantial distinct days unlock the harder tiers', () => {
    const entries = Array.from({ length: 12 }, (_, index) => row(date(2026, 11, index + 1), { time: 600 }));
    entries.push(row(date(2026, 11, 1, 14), { time: 600 }));
    const missions = getPersonalMissions(entries, date(2026, 11, 1), now);
    expect(missions[0]).toMatchObject({ completedTiers: 3, complete: true, current: 12, target: 12 });
    expect(missions[2]).toMatchObject({ completedTiers: 3, complete: true, current: 10, target: 10 });
    const tinyRows = entries.map(entry => ({ ...entry, meters: 100 }));
    const tinyMissions = getPersonalMissions(tinyRows, date(2026, 11, 1), now);
    expect(tinyMissions[0]).toMatchObject({ completedTiers: 1, baseComplete: true, current: 0, target: 8 });
    expect(tinyMissions[2]).toMatchObject({ completedTiers: 1, current: 0, target: 6 });
    const tooShort = getPersonalMissions(entries.map(entry => ({ ...entry, time: 599 })), date(2026, 11, 1), now);
    expect(tooShort[2]).toMatchObject({ baseComplete: true, current: 0 });
  });

  test('passport advances through the original pieces, a 5K, then a 10K without losing stamps', () => {
    const entries = [500, 1000, 2000].map((meters, index) => row(date(2026, 11, index + 1), { meters }));
    let passport = getPersonalMissions(entries, date(2026, 11, 1), now)[1];
    expect(passport).toMatchObject({ baseComplete: true, completedTiers: 1, current: 3, target: 4 });
    entries.push(row(date(2026, 11, 4), { meters: 5000 }));
    passport = getPersonalMissions(entries, date(2026, 11, 1), now)[1];
    expect(passport).toMatchObject({ completedTiers: 2, current: 4, target: 5 });
    entries.push(row(date(2026, 11, 5), { meters: 10000 }));
    expect(getPersonalMissions(entries, date(2026, 11, 1), now)[1]).toMatchObject({ completedTiers: 3, complete: true });
    expect(getPersonalMissions(entries, date(2026, 12, 1), now).every(mission => mission.completedTiers === 0)).toBe(true);
  });

  test('new day and week throwdowns reject tiny and duplicate rows without altering legacy challenges', () => {
    const entries = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map(day => row(date(2026, 11, day), { meters: day <= 4 ? 100 : 1000 }));
    entries.push(row(date(2026, 11, 5, 14)));
    const monthly = getMonthlyProgram(date(2026, 11, 1));
    expect(monthly.throwdown.target).toBe(10);
    expect(getThrowdownProgress(monthly.throwdown, entries, now)).toBe(6);
    const weeks = [2, 4, 9, 11, 16, 18].map(day => row(date(2026, 11, day)));
    const weekly = getMonthlyProgram(date(2027, 2, 1)).throwdown;
    expect(getThrowdownProgress(weekly, weeks, now)).toBe(3);
    expect(getThrowdownProgress(weekly, weeks.map(entry => ({ ...entry, meters: 999 })), now)).toBe(0);
    const quality = getMonthlyProgram(date(2027, 5, 1)).throwdown;
    expect(getThrowdownProgress(quality, weeks, now)).toBe(0);
    expect(getThrowdownProgress(quality, weeks.map(entry => ({ ...entry, time: 600 })), now)).toBe(6);
  });

  test('shows ranks outside the top three and does not score future months', () => {
    const allUsers = { a: {}, b: {}, c: {}, d: {} };
    const entries = Object.keys(allUsers).map((userId, i) => row(date(2027, 1, i + 1), { userId, meters: 2000, time: 400 + i * 10 }));
    const summary = getMonthlySummary({ entries, users: allUsers, userId: 'd', date: date(2027, 1, 1), now });
    expect(summary.userRank).toBe(4);
    expect(summary.leaderboard).toHaveLength(4);
    expect(getMonthlySummary({ entries: [row(date(2027, 2, 1))], users, userId: 'a', date: date(2027, 2, 1), now }).leaderboard).toHaveLength(0);
  });
});

describe('durable rewards', () => {
  test('same-hour progress counts consecutive calendar days, not uploads or total days', () => {
    const badge = ACHIEVEMENTS.find(item => item.id === 'creature_of_habit');
    const entries = [1, 2, 3, 5, 6, 7, 8].map(day => row(date(2025, 11, day), { localHour: 7 }));
    entries.push(row(date(2025, 11, 8, 18), { localHour: 7 }));
    expect(badge.check({}, entries)).toBe(false);
    expect(badge.getProgress({}, entries)).toEqual({ current: 4, target: 7 });
    expect(badge.getProgress({}, [])).toEqual({ current: 0, target: 7 });
  });

  test('same-hour achievement survives extra rows at other times and stays earned historically', () => {
    const badge = ACHIEVEMENTS.find(item => item.id === 'creature_of_habit');
    const entries = Array.from({ length: 7 }, (_, index) => row(date(2025, 11, index + 1), { localHour: 7 }));
    entries.push(row(date(2025, 11, 3, 18), { localHour: 18 }));
    expect(badge.check({}, entries)).toBe(true);
    expect(badge.getProgress({}, entries)).toEqual({ current: 7, target: 7 });
    const differentHours = entries.slice(0, 7).map((entry, index) => ({ ...entry, localHour: index % 2 ? 8 : 7 }));
    expect(badge.check({}, differentHours)).toBe(false);
    expect(badge.getProgress({}, differentHours).current).toBe(1);
  });

  test('record progress stays locked for equal or shorter rows and completes on a later best', () => {
    const badge = ACHIEVEMENTS.find(item => item.id === 'new_pr');
    const entries = [2000, 2000, 1000].map((meters, index) => row(date(2025, 1, index + 1), { meters }));
    expect(badge.check({}, entries)).toBe(false);
    expect(badge.getProgress({}, entries)).toEqual({ current: 0, target: 1 });
    entries.push(row(date(2025, 1, 4), { meters: 2500 }));
    expect(badge.check({}, entries.reverse())).toBe(true);
    expect(badge.getProgress({}, entries)).toEqual({ current: 1, target: 1 });
  });

  test('first row alone and test records cannot unlock Record Breaker', () => {
    const badge = ACHIEVEMENTS.find(item => item.id === 'new_pr');
    const first = row(date(2025, 1, 1), { meters: 1000 });
    expect(badge.check({}, [first])).toBe(false);
    expect(badge.getProgress({}, [first, row(date(2025, 1, 2), { meters: 2000, isTest: true })])).toEqual({ current: 0, target: 1 });
  });

  test('two-day weekly rhythm allows rest days and requires consecutive calendar weeks', () => {
    const entries = [2, 4, 9, 11, 16, 18].map(day => row(date(2026, 11, day)));
    expect(getHabitMetrics(entries, now).bestSteadyWeeks).toBe(3);
    expect(getHabitMetrics(entries.filter(entry => new Date(entry.date).getDate() !== 11), now).bestSteadyWeeks).toBe(1);
  });

  test('weekday and weekend must fall in the same Monday–Sunday week', () => {
    expect(getHabitMetrics([row(date(2026, 11, 2)), row(date(2026, 11, 8))], now).bookendWeeks).toBe(1);
    expect(getHabitMetrics([row(date(2026, 11, 2)), row(date(2026, 11, 15))], now).bookendWeeks).toBe(0);
  });

  test('new achievements have distinct IDs and matching checks/progress', () => {
    expect(new Set(ACHIEVEMENTS.map(item => item.id)).size).toBe(ACHIEVEMENTS.length);
    const passport = ACHIEVEMENTS.find(item => item.id === 'distance_passport');
    const entries = [500, 1000, 2000].map(meters => row(date(2025, 1, 1), { meters }));
    expect(passport.check({}, entries)).toBe(true);
    expect(passport.getProgress({}, entries)).toEqual({ current: 3, target: 3 });
    expect(passport.check({}, entries.map(entry => ({ ...entry, isTest: true })))).toBe(false);
  });

  test('advanced badges retain starter criteria and require real calendar consistency', () => {
    const entries = Array.from({ length: 12 }, (_, index) => row(date(2025, 11, index + 1)));
    const badge = ACHIEVEMENTS.find(item => item.id === 'twelve_day_rhythm');
    expect(badge.check({}, entries)).toBe(true);
    expect(badge.getProgress({}, entries)).toEqual({ current: 12, target: 12 });
    expect(badge.check({}, entries.map(entry => ({ ...entry, date: entries[0].date })))).toBe(false);
    expect(badge.getProgress({}, entries.map(entry => ({ ...entry, meters: 999 })))).toEqual({ current: 0, target: 12 });
    const tour = ACHIEVEMENTS.find(item => item.id === 'benchmark_tour');
    const pieces = [990, 2010, 5000].map(meters => row(date(2025, 11, 1), { meters }));
    expect(tour.check({}, pieces)).toBe(true);
    expect(tour.check({}, pieces.map(entry => ({ ...entry, time: 0 })))).toBe(false);
    expect(tour.check({}, pieces.map(entry => ({ ...entry, verificationStatus: 'pending_review' })))).toBe(false);
  });

  test('advanced month and week metrics reset at calendar boundaries and preserve prior accomplishments', () => {
    const entries = [1, 2, 3].flatMap(month => Array.from({ length: 8 }, (_, index) => row(date(2025, month, index + 1))));
    expect(getAdvancedHabitMetrics(entries, now).eightDayMonths).toBe(3);
    const weekly = Array.from({ length: 8 }, (_, week) => [row(new Date(2025, 0, 6 + week * 7)), row(new Date(2025, 0, 8 + week * 7))]).flat();
    expect(getAdvancedHabitMetrics(weekly, now).bestSteadyWeeks).toBe(8);
    expect(ACHIEVEMENTS.find(item => item.id === 'eight_week_rhythm').check({}, weekly)).toBe(true);
    const gap = weekly.filter((entry, index) => index !== 7);
    expect(getAdvancedHabitMetrics(gap, now).bestSteadyWeeks).toBe(4);
  });

  test('past-year rewards survive January and use the historical event definition', () => {
    const entries = [row(date(2025, 11, 1), { meters: 500, time: 100 })];
    const rewards = getMonthlyRewards({ entries, users, userId: 'a', now });
    expect(rewards).toHaveLength(1);
    expect(rewards[0]).toMatchObject({ year: 2025, month: 10, label: '1st — Fastest 500m' });
  });
});
