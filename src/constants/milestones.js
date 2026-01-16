// Milestone definitions
export const MILESTONES = [
  { meters: 1000, label: '1 km', comparison: 'Length of 10 football fields!' },
  { meters: 5000, label: '5 km', comparison: 'Across Central Park!' },
  { meters: 10000, label: '10 km', comparison: 'Height of a cruising airplane!' },
  { meters: 21097, label: 'Half Marathon', comparison: '21.1 km - Half marathon distance!' },
  { meters: 42195, label: 'Marathon', comparison: '42.2 km - Full marathon!' },
  { meters: 100000, label: '100 km', comparison: 'Length of the Panama Canal!' },
  { meters: 250000, label: '250 km', comparison: 'New York to Washington DC!' },
  { meters: 500000, label: '500 km', comparison: 'Length of California coastline!' },
  { meters: 1000000, label: '1,000 km', comparison: 'Paris to Rome!' },
  { meters: 2500000, label: '2,500 km', comparison: 'Width of Australia!' },
  { meters: 5000000, label: '5,000 km', comparison: 'New York to London!' },
  { meters: 10000000, label: '10,000 km', comparison: 'Quarter around the world!' },
  { meters: 20000000, label: '20,000 km', comparison: 'Halfway around the world!' },
  { meters: 40075000, label: '40,075 km', comparison: '🌍 YOU ROWED AROUND THE WORLD! 🌍' },
];

// Get next milestone for a user
export const getNextMilestone = (totalMeters) => {
  return MILESTONES.find(m => m.meters > totalMeters) || null;
};

// Get last achieved milestone
export const getLastMilestone = (totalMeters) => {
  for (let i = MILESTONES.length - 1; i >= 0; i--) {
    if (totalMeters >= MILESTONES[i].meters) {
      return MILESTONES[i];
    }
  }
  return null;
};
