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
