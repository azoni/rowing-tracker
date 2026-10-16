// Monthly competitive challenges — top 3 get reward badges
// type: 'fastest_distance' (lowest time for X meters), 'longest_row' (most meters single session),
//       'most_meters' (total meters in month), 'best_pace' (best /500m pace)
export const MONTHLY_CHALLENGES = [
  { id: 'fastest-2k', label: 'Fastest 2K', description: 'Best 2,000m time', type: 'fastest_distance', distance: 2000 },       // Jan
  { id: 'longest-row', label: 'Longest Single Row', description: 'Most meters in one session', type: 'longest_row' },           // Feb
  { id: 'fastest-500', label: 'Fastest 500m', description: 'Best 500m time', type: 'fastest_distance', distance: 500 },         // Mar
  { id: 'most-meters', label: 'Most Meters', description: 'Total meters this month', type: 'most_meters' },                     // Apr
  { id: 'fastest-1k', label: 'Fastest 1K', description: 'Best 1,000m time', type: 'fastest_distance', distance: 1000 },         // May
  { id: 'best-pace', label: 'Best Avg Pace', description: 'Fastest average /500m pace', type: 'best_pace' },                    // Jun
  { id: 'fastest-5k', label: 'Fastest 5K', description: 'Best 5,000m time', type: 'fastest_distance', distance: 5000 },         // Jul
  { id: 'longest-row-2', label: 'Longest Single Row', description: 'Most meters in one session', type: 'longest_row' },         // Aug
  { id: 'fastest-2k-2', label: 'Fastest 2K', description: 'Best 2,000m time', type: 'fastest_distance', distance: 2000 },       // Sep
  { id: 'most-meters-2', label: 'Most Meters', description: 'Total meters this month', type: 'most_meters' },                   // Oct
  { id: 'fastest-500-2', label: 'Fastest 500m', description: 'Best 500m time', type: 'fastest_distance', distance: 500 },       // Nov
  { id: 'best-pace-2', label: 'Best Avg Pace', description: 'Fastest average /500m pace', type: 'best_pace' },                  // Dec
];

export const THROWDOWNS = [
  { type: 'distance', target: 50000, label: 'Row 50K', unit: 'm', field: 'meters' },
  { type: 'streak', target: 14, label: '14-Day Streak', unit: ' days', field: 'streak' },
  { type: 'sessions', target: 20, label: '20 Sessions', unit: '', field: 'sessions' },
  { type: 'distance', target: 75000, label: 'Row 75K', unit: 'm', field: 'meters' },
  { type: 'calories', target: 10000, label: 'Burn 10K Cal', unit: ' cal', field: 'calories' },
  { type: 'distance', target: 100000, label: 'Row 100K', unit: 'm', field: 'meters' },
  { type: 'sessions', target: 25, label: '25 Sessions', unit: '', field: 'sessions' },
  { type: 'streak', target: 21, label: '21-Day Streak', unit: ' days', field: 'streak' },
  { type: 'distance', target: 60000, label: 'Row 60K', unit: 'm', field: 'meters' },
  { type: 'calories', target: 15000, label: 'Burn 15K Cal', unit: ' cal', field: 'calories' },
  { type: 'sessions', target: 22, label: '22 Sessions', unit: '', field: 'sessions' },
  { type: 'distance', target: 80000, label: 'Row 80K', unit: 'm', field: 'meters' },
];

export const MONTH_NAMES = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December'
];

// Keep the original program for recaps and the already-active October challenge.
// New rules begin at a month boundary so nobody loses progress mid-event.
export const MONTHLY_PROGRAM_START = new Date(2026, 10, 1);

const benchmark = (id, label, distance) => ({
  id, label, type: 'fastest_distance', distance, tolerance: 10, normalize: true,
  description: `Best ${distance.toLocaleString()}m time. Within 10m counts; times are adjusted to ${distance.toLocaleString()}m.`,
});
const timedRow = (id, label, minutes) => ({
  id, label, type: 'timed_distance', duration: minutes * 60, tolerance: 5,
  description: `Most meters in ${minutes} minutes. Within 5 seconds counts; distance is adjusted to ${minutes} minutes.`,
});

export const REFRESHED_CHALLENGES = [
  benchmark('benchmark-2k', 'The 2K Benchmark', 2000),
  timedRow('ten-minute-trip', 'The Ten-Minute Trip', 10),
  benchmark('short-course', 'Short Course: 500m', 500),
  benchmark('one-k-club', 'The 1K Club', 1000),
  timedRow('twenty-minute-voyage', 'Twenty-Minute Voyage', 20),
  benchmark('five-k-route', 'The 5K Route', 5000),
  timedRow('quarter-hour', 'The Quarter Hour', 15),
  benchmark('three-k-crossing', 'The 3K Crossing', 3000),
  benchmark('benchmark-rematch', '2K Benchmark Rematch', 2000),
  timedRow('ten-minute-rematch', 'Ten-Minute Rematch', 10),
  {
    id: 'distance-passport', label: 'Distance Passport', type: 'distance_ladder',
    distances: [500, 1000, 2000], tolerance: 10,
    description: 'Collect a 500m, 1,000m and 2,000m row, each within 10m. Most stamps wins; ties go to the first to collect them.',
  },
  timedRow('year-end-voyage', 'Year-End Voyage', 20),
];

export const REFRESHED_THROWDOWNS = [
  { type: 'rhythm', field: 'active_days', target: 8, unit: ' days', label: 'Find Your Rhythm', description: 'Row on 8 different days. Choose the days that work for you.' },
  { type: 'rhythm', field: 'steady_weeks', target: 3, unit: ' weeks', label: 'A Little, Often', description: 'Row on 2 different days in 3 Monday–Sunday weeks this month.' },
  { type: 'variety', field: 'workout_types', target: 3, unit: ' types', label: 'Mix It Up', description: 'Try 3 workout types: free row, timed, distance or intervals.' },
  { type: 'variety', field: 'distance_ladder', distances: [500, 1000, 2000], tolerance: 10, target: 3, unit: ' stamps', label: 'Three Stops', description: 'Collect a 500m, 1,000m and 2,000m row, each within 10m.' },
  { type: 'time', field: 'timed_sessions', target: 6, unit: ' rows', label: 'Keep the Details', description: 'Include your time with 6 rows so you can follow your pace.' },
  { type: 'rhythm', field: 'active_days', target: 8, unit: ' days', label: 'Eight Is Great', description: 'Find 8 days to row this month. No streak required.' },
  { type: 'time', field: 'minutes', target: 90, unit: ' min', label: 'Ninety Minutes, Your Way', description: 'Build up 90 minutes across as many rows as you like.' },
  { type: 'rhythm', field: 'steady_weeks', target: 3, unit: ' weeks', label: 'Keep Coming Back', description: 'Row on 2 different days in 3 Monday–Sunday weeks this month.' },
  { type: 'distance', field: 'meters', target: 25000, unit: 'm', label: 'The 25K Journey', description: 'Collect 25,000 meters at your own pace.' },
  { type: 'variety', field: 'workout_types', target: 3, unit: ' types', label: 'Change the Playlist', description: 'Log 3 different workout types this month.' },
  { type: 'rhythm', field: 'active_days', target: 6, unit: ' days', label: 'Six Good Days', description: 'Row on 6 different days this month. Rest days fit right in.' },
  { type: 'time', field: 'minutes', target: 120, unit: ' min', label: 'Make Time for You', description: 'Collect 120 minutes this month, in sessions that fit your day.' },
];

export const getMonthlyProgram = (date = new Date()) => {
  const legacy = new Date(date.getFullYear(), date.getMonth(), 1) < MONTHLY_PROGRAM_START;
  const month = date.getMonth();
  return {
    legacy,
    throwdown: (legacy ? THROWDOWNS : REFRESHED_THROWDOWNS)[month],
    challenge: (legacy ? MONTHLY_CHALLENGES : REFRESHED_CHALLENGES)[month],
  };
};
