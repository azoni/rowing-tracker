import { getMonthlyProgram } from '../constants/monthly';
import { formatMeters, formatTimeDisplay } from './formatters';

const DAY = 86400000;
const WORKOUT_TYPES = ['free_row', 'timed', 'distance', 'interval'];
const asDate = value => value?.toDate ? value.toDate() : new Date(value);
const positive = value => Number.isFinite(Number(value)) && Number(value) > 0;
const isQualityRow = entry => positive(entry.time) && Number(entry.time) >= 600 && Number(entry.meters) >= 1000;
const formatPace = value => {
  const tenths = Math.round(value * 10);
  return `${Math.floor(tenths / 600)}:${((tenths % 600) / 10).toFixed(1).padStart(4, '0')}/500m`;
};
// Calendar-day numbers do not change length at daylight-saving boundaries.
export const getRowDay = entry => {
  const date = asDate(entry.date);
  return Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()) / DAY;
};
const weekOf = entry => {
  const date = asDate(entry.date);
  return getRowDay(entry) - (date.getDay() + 6) % 7;
};

export const getEligibleEntries = (entries = [], now = new Date()) => entries.filter(entry => (
  !entry.isTest && !['rejected', 'pending_review', 'pending'].includes(entry.verificationStatus)
  && positive(entry.meters) && Number.isFinite(asDate(entry.date).getTime()) && asDate(entry.date) <= now
));

export const getMonthEntries = (entries, date = new Date(), now = new Date(), legacy = false) => {
  const start = new Date(date.getFullYear(), date.getMonth(), 1);
  const end = new Date(date.getFullYear(), date.getMonth() + 1, 1);
  const source = legacy ? entries : getEligibleEntries(entries, now);
  return source.filter(entry => {
    const day = asDate(entry.date);
    return positive(entry.meters) && day >= start && day < end && day <= now;
  });
};

export const getBestRowStreak = entries => {
  const days = [...new Set(entries.map(getRowDay))].filter(Number.isFinite).sort((a, b) => a - b);
  let best = 0;
  let run = 0;
  days.forEach((day, index) => {
    run = index > 0 && day === days[index - 1] + 1 ? run + 1 : 1;
    best = Math.max(best, run);
  });
  return best;
};

export const getSameHourStreak = (entries, now = new Date()) => {
  const hours = new Map();
  getEligibleEntries(entries, now).forEach(entry => {
    const hour = entry.localHour ?? asDate(entry.date).getHours();
    if (!Number.isInteger(hour) || hour < 0 || hour > 23) return;
    if (!hours.has(hour)) hours.set(hour, new Set());
    hours.get(hour).add(getRowDay(entry));
  });
  let best = 0;
  hours.forEach(daySet => {
    const days = [...daySet].sort((a, b) => a - b);
    let run = 0;
    days.forEach((day, index) => {
      run = index > 0 && day === days[index - 1] + 1 ? run + 1 : 1;
      best = Math.max(best, run);
    });
  });
  return best;
};

export const hasPersonalDistanceRecord = (entries, now = new Date()) => {
  const sorted = getEligibleEntries(entries, now).sort((a, b) => asDate(a.date) - asDate(b.date));
  if (sorted.length < 2) return false;
  let best = Number(sorted[0].meters);
  for (let index = 1; index < sorted.length; index++) {
    const meters = Number(sorted[index].meters);
    if (meters > best) return true;
    best = Math.max(best, meters);
  }
  return false;
};

export const getDistanceStamps = (entries, distances = [500, 1000, 2000], tolerance = 10) => distances.map(distance => ({
  distance,
  entry: entries.filter(entry => Math.abs(Number(entry.meters) - distance) <= tolerance)
    .sort((a, b) => asDate(a.date) - asDate(b.date))[0] || null,
}));

export const getHabitMetrics = (entries, now = new Date()) => {
  const eligible = getEligibleEntries(entries, now);
  const weeks = new Map();
  eligible.forEach(entry => {
    const key = weekOf(entry);
    if (!weeks.has(key)) weeks.set(key, new Set());
    weeks.get(key).add(getRowDay(entry));
  });
  const steadyWeeks = [...weeks.entries()].filter(([, days]) => days.size >= 2).map(([week]) => week).sort((a, b) => a - b);
  let run = 0;
  let bestSteadyWeeks = 0;
  steadyWeeks.forEach((week, index) => {
    run = index > 0 && week === steadyWeeks[index - 1] + 7 ? run + 1 : 1;
    bestSteadyWeeks = Math.max(bestSteadyWeeks, run);
  });
  const bookendWeeks = [...weeks.values()].filter(days => {
    const weekdays = [...days].map(day => new Date(day * DAY).getUTCDay());
    return weekdays.some(day => day >= 1 && day <= 5) && weekdays.some(day => day === 0 || day === 6);
  }).length;
  return {
    activeDays: new Set(eligible.map(getRowDay)).size,
    steadyWeeks: steadyWeeks.length,
    bestSteadyWeeks,
    workoutTypes: new Set(eligible.filter(entry => WORKOUT_TYPES.includes(entry.sessionType)).map(entry => entry.sessionType)).size,
    distanceStamps: getDistanceStamps(eligible).filter(stamp => stamp.entry).length,
    shortRows: eligible.filter(entry => entry.meters >= 500 && entry.meters <= 1500).length,
    pocketRows: eligible.filter(entry => entry.time >= 300 && entry.time <= 900).length,
    timedSessions: eligible.filter(entry => positive(entry.time)).length,
    bookendWeeks,
  };
};

// Advanced rungs use substantial rows and calendar days, so splitting an upload
// cannot turn a single workout into a consistency award.
export const getAdvancedHabitMetrics = (entries, now = new Date()) => {
  const allEligible = getEligibleEntries(entries, now);
  const eligible = allEligible.filter(entry => Number(entry.meters) >= 1000);
  const months = new Map();
  eligible.forEach(entry => {
    const date = asDate(entry.date);
    const key = `${date.getFullYear()}-${date.getMonth()}`;
    if (!months.has(key)) months.set(key, new Set());
    months.get(key).add(getRowDay(entry));
  });
  const timed = allEligible.filter(entry => positive(entry.time));
  return {
    bestSteadyWeeks: getHabitMetrics(eligible, now).bestSteadyWeeks,
    bestMonthDays: Math.max(0, ...[...months.values()].map(days => days.size)),
    eightDayMonths: [...months.values()].filter(days => days.size >= 8).length,
    benchmarkStamps: getDistanceStamps(timed, [1000, 2000, 5000]).filter(stamp => stamp.entry).length,
    extendedBenchmarkStamps: getDistanceStamps(timed, [1000, 2000, 5000, 10000]).filter(stamp => stamp.entry).length,
  };
};

export const getThrowdownProgress = (throwdown, entries, now = new Date()) => {
  const sum = field => entries.reduce((total, entry) => total + (positive(entry[field]) ? Number(entry[field]) : 0), 0);
  const qualifying = entries.filter(entry => Number(entry.meters) >= (throwdown.minimumMeters || 0));
  switch (throwdown.field) {
    case 'meters': return sum('meters');
    case 'calories': return sum('calories');
    case 'sessions': return entries.length;
    case 'streak': return getBestRowStreak(entries);
    case 'minutes': return Math.floor(sum('time') / 60);
    case 'active_days': return new Set(qualifying.map(getRowDay)).size;
    case 'steady_weeks': return getHabitMetrics(qualifying, now).steadyWeeks;
    case 'quality_days': return new Set(entries.filter(isQualityRow).map(getRowDay)).size;
    case 'workout_types': return getHabitMetrics(entries, now).workoutTypes;
    case 'timed_sessions': return entries.filter(entry => positive(entry.time)).length;
    case 'distance_ladder': return getDistanceStamps(entries, throwdown.distances, throwdown.tolerance).filter(stamp => stamp.entry).length;
    default: return 0;
  }
};

export const getChallengeScore = (challenge, entries) => {
  if (!entries.length) return null;
  const timed = entries.filter(entry => positive(entry.time) && positive(entry.meters));
  const bestOf = (candidates, valueOf, descending, display) => {
    if (!candidates.length) return null;
    const ranked = candidates.map(entry => ({ entry, value: valueOf(entry) }))
      .sort((a, b) => (descending ? b.value - a.value : a.value - b.value) || asDate(a.entry.date) - asDate(b.entry.date));
    const { entry, value } = ranked[0];
    return { value, display: display(value), sort: descending ? -value : value, bestDate: asDate(entry.date), attempts: candidates.length };
  };
  switch (challenge.type) {
    case 'fastest_distance': {
      const tolerance = challenge.tolerance ?? challenge.distance * 0.1;
      return bestOf(timed.filter(entry => Math.abs(entry.meters - challenge.distance) <= tolerance),
        entry => challenge.normalize ? entry.time * challenge.distance / entry.meters : Number(entry.time), false, formatTimeDisplay);
    }
    case 'timed_distance':
      return bestOf(timed.filter(entry => Math.abs(entry.time - challenge.duration) <= challenge.tolerance),
        entry => entry.meters * challenge.duration / entry.time, true, value => `${Math.round(value).toLocaleString()}m`);
    case 'longest_row':
      return bestOf(entries, entry => Number(entry.meters), true, formatMeters);
    case 'most_meters': {
      const value = entries.reduce((total, entry) => total + Number(entry.meters), 0);
      const last = [...entries].sort((a, b) => asDate(b.date) - asDate(a.date))[0];
      return { value, display: formatMeters(value), sort: -value, bestDate: asDate(last.date), attempts: entries.length };
    }
    case 'best_pace':
      return bestOf(timed, entry => entry.time / entry.meters * 500, false, formatPace);
    case 'benchmark_tour': {
      const pieces = challenge.distances.map(distance => {
        const candidates = timed.filter(entry => Math.abs(Number(entry.meters) - distance) <= challenge.tolerance);
        const best = bestOf(candidates, entry => Number(entry.time) / Number(entry.meters) * 500, false, formatPace);
        return best ? { distance, ...best } : null;
      });
      // Partial tours can be shown as progress but never qualify for a podium.
      if (pieces.some(piece => !piece)) return null;
      // Round the equal-weight average once, to the displayed tenth of a second.
      // Equal displayed scores therefore use the published completion-time tie break.
      const value = Math.round(pieces.reduce((sum, piece) => sum + piece.value, 0) / pieces.length * 10) / 10;
      const bestPaces = challenge.distances.map(() => Infinity);
      const firstScore = [...timed].sort((a, b) => asDate(a.date) - asDate(b.date)).find(entry => {
        challenge.distances.forEach((distance, index) => {
          if (Math.abs(Number(entry.meters) - distance) <= challenge.tolerance) {
            bestPaces[index] = Math.min(bestPaces[index], Number(entry.time) / Number(entry.meters) * 500);
          }
        });
        return Math.round(bestPaces.reduce((sum, pace) => sum + pace, 0) / bestPaces.length * 10) / 10 === value;
      });
      return {
        value, display: formatPace(value), sort: value,
        bestDate: asDate(firstScore.date),
        attempts: pieces.reduce((sum, piece) => sum + piece.attempts, 0), pieces,
      };
    }
    case 'distance_ladder': {
      const stamps = getDistanceStamps(entries, challenge.distances, challenge.tolerance).filter(stamp => stamp.entry);
      if (!stamps.length) return null;
      const bestDate = new Date(Math.max(...stamps.map(stamp => asDate(stamp.entry.date).getTime())));
      return { value: stamps.length, display: `${stamps.length}/${challenge.distances.length} stamps`, sort: -stamps.length, bestDate, attempts: stamps.length };
    }
    default: return null;
  }
};

export const getPersonalMissions = (entries, date = new Date(), now = new Date()) => {
  const monthEntries = getMonthEntries(entries, date, now);
  const metrics = getHabitMetrics(monthEntries, now);
  const substantialDays = new Set(monthEntries.filter(entry => Number(entry.meters) >= 1000).map(getRowDay)).size;
  const qualityDays = new Set(monthEntries.filter(isQualityRow).map(getRowDay)).size;
  const passportTier = distances => {
    const stamps = getDistanceStamps(monthEntries, distances);
    return { current: stamps.filter(stamp => stamp.entry).length, target: distances.length, unit: 'stamps', stamps };
  };
  return [
    { id: 'three-good-days', label: 'Find Your Rhythm', icon: 'ui_calendar', tiers: [
      { description: 'Row on 3 separate days this month.', current: metrics.activeDays, target: 3, unit: 'days' },
      { description: 'Log a row of at least 1K on 8 different days this month.', current: substantialDays, target: 8, unit: 'days' },
      { description: 'Log a row of at least 1K on 12 different days this month.', current: substantialDays, target: 12, unit: 'days' },
    ] },
    { id: 'distance-passport', label: 'Distance Passport', icon: 'ui_globe', tiers: [
      { description: 'Collect a 500m, 1K and 2K row, each within 10m.', ...passportTier([500, 1000, 2000]) },
      { description: 'Collect a 500m, 1K, 2K and 5K row, each within 10m.', ...passportTier([500, 1000, 2000, 5000]) },
      { description: 'Collect a 500m, 1K, 2K, 5K and 10K row, each within 10m. Spread them across the month.', ...passportTier([500, 1000, 2000, 5000, 10000]) },
    ] },
    { id: 'pace-notes', label: 'Pace Notes', icon: 'ui_timer', tiers: [
      { description: 'Include the time with 3 rows this month.', current: metrics.timedSessions, target: 3, unit: 'rows' },
      { description: 'Log a timed row of at least 10 minutes and 1K on 6 different days.', current: qualityDays, target: 6, unit: 'days' },
      { description: 'Log a timed row of at least 10 minutes and 1K on 10 different days.', current: qualityDays, target: 10, unit: 'days' },
    ] },
  ].map(mission => {
    const tiers = mission.tiers.map((tier, index) => ({
      ...tier, id: ['starter', 'build', 'stretch'][index], label: ['Starter', 'Build', 'Stretch'][index],
      current: Math.min(tier.current, tier.target), complete: tier.current >= tier.target,
      pct: Math.min(100, tier.current / tier.target * 100),
    }));
    const nextTier = tiers.findIndex(tier => !tier.complete);
    const activeTier = nextTier === -1 ? tiers.length - 1 : nextTier;
    const active = tiers[activeTier];
    return {
      ...mission, ...active, id: mission.id, label: mission.label,
      tiers, activeTier, completedTiers: tiers.filter(tier => tier.complete).length, totalTiers: tiers.length,
      baseComplete: tiers[0].complete, complete: tiers.every(tier => tier.complete),
    };
  });
};

export const getMonthlySummary = ({ entries = [], users = {}, userId, date = new Date(), now = new Date() }) => {
  const program = getMonthlyProgram(date);
  const monthEntries = getMonthEntries(entries, date, now, program.legacy);
  const userEntries = monthEntries.filter(entry => entry.userId === userId);
  const current = getThrowdownProgress(program.throwdown, userEntries, now);
  const leaderboard = Object.keys(users).map(id => {
    const score = getChallengeScore(program.challenge, monthEntries.filter(entry => entry.userId === id));
    return score ? { userId: id, user: users[id], ...score } : null;
  }).filter(Boolean).sort((a, b) => a.sort - b.sort || a.bestDate - b.bestDate || a.userId.localeCompare(b.userId));
  const userRank = leaderboard.findIndex(item => item.userId === userId) + 1 || null;
  return {
    ...program, monthEntries, userEntries, current,
    pct: Math.min(100, current / program.throwdown.target * 100),
    complete: current >= program.throwdown.target,
    leaderboard, userRank, userScore: leaderboard.find(item => item.userId === userId) || null,
    missions: getPersonalMissions(entries.filter(entry => entry.userId === userId), date, now),
  };
};

export const getMonthlyRewards = ({ entries = [], users = {}, userId, now = new Date() }) => {
  const months = [...new Set(entries.filter(entry => entry.userId === userId && Number.isFinite(asDate(entry.date).getTime()) && asDate(entry.date) <= now)
    .map(entry => { const date = asDate(entry.date); return new Date(date.getFullYear(), date.getMonth(), 1).getTime(); }))]
    .sort((a, b) => b - a);
  const currentMonth = new Date(now.getFullYear(), now.getMonth(), 1).getTime();
  return months.flatMap(monthTime => {
    const date = new Date(monthTime);
    const summary = getMonthlySummary({ entries, users, userId, date, now });
    const base = { month: date.getMonth(), year: date.getFullYear(), monthName: date.toLocaleDateString('en-US', { month: 'short' }) };
    const rewards = [];
    if (summary.complete) rewards.push({ ...base, key: `td-${monthTime}`, type: 'throwdown', label: summary.throwdown.label });
    if (monthTime < currentMonth && summary.userRank && summary.userRank <= 3) {
      const place = summary.userRank;
      rewards.push({ ...base, key: `ch-${monthTime}`, type: 'challenge', place, icon: ['ui_gold', 'ui_silver', 'ui_bronze'][place - 1], label: `${['1st', '2nd', '3rd'][place - 1]} — ${summary.challenge.label}` });
    }
    return rewards;
  });
};
