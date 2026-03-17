// Milestone definitions — progressively growing gaps
// Route: Seattle, WA → south down coast → across Pacific → Asia → Middle East → Europe → Atlantic → Americas → home
// Gaps: 100km → 150km → 200km → 250km → 500km → 1000km → 2000km → 2500km → 5000km
export const MILESTONES = [
  // Early milestones — small wins to get started
  { meters: 5000, label: '5 km', emoji: 'milestone_park', comparison: 'Across Central Park!' },
  { meters: 10000, label: '10 km', emoji: 'milestone_cloud', comparison: 'Height of a cruising airplane!' },
  { meters: 21097, label: 'Half Marathon', emoji: 'milestone_runner', comparison: '21.1 km — half marathon without the shin splints!' },
  { meters: 42195, label: 'Marathon', emoji: 'milestone_medal', comparison: '42.2 km — full marathon! No medal though.' },
  { meters: 69000, label: '69 km', emoji: 'milestone_grin', comparison: 'Nice.' },
  { meters: 100000, label: '100 km', emoji: 'milestone_sailboat', comparison: 'Length of the Panama Canal!' },

  // 100km+ — gaps grow from here: 100 → 150 → 200 → 250 → 500
  { meters: 200000, label: '200 km', emoji: 'milestone_banana', comparison: 'About 1 million bananas laid end-to-end!' },
  { meters: 350000, label: '350 km', emoji: 'milestone_trees', comparison: 'Keep Portland weird!', checkpoint: 'Portland, OR' },
  { meters: 500000, label: '500 km', emoji: 'milestone_wave', comparison: 'Length of the California coastline!' },
  { meters: 750000, label: '750 km', emoji: 'milestone_bear', comparison: 'A grizzly bear\'s entire territory... twice!' },
  { meters: 1000000, label: '1,000 km', emoji: 'milestone_city', comparison: 'Fog, sourdough, and tech bros!', checkpoint: 'San Francisco, CA' },

  // 1000km+ — gaps: 500km
  { meters: 1500000, label: '1,500 km', emoji: 'milestone_movie', comparison: 'Lights, camera, rowing!', checkpoint: 'Los Angeles, CA' },
  { meters: 2000000, label: '2,000 km', emoji: 'milestone_americanfootball', comparison: 'Coast to coast if America was half as wide!' },

  // 2000km+ — gaps: 1000km, heading across the Pacific
  { meters: 3000000, label: '3,000 km', emoji: 'milestone_flower', comparison: 'Aloha! Grab a mai tai!', checkpoint: 'Honolulu, HI' },
  { meters: 4000000, label: '4,000 km', emoji: 'milestone_polarbear', comparison: 'Trans-Siberian Railway length!' },
  { meters: 5000000, label: '5,000 km', emoji: 'milestone_island', comparison: 'Middle of the Pacific. Nothing but ocean.', checkpoint: 'Midway Atoll' },

  // 5000km+ — gaps: 2000km, arriving in Asia
  { meters: 7000000, label: '7,000 km', emoji: 'milestone_tokyotower', comparison: 'Konnichiwa! Hit up a ramen shop!', checkpoint: 'Tokyo, Japan' },
  { meters: 9000000, label: '9,000 km', emoji: 'milestone_bowl', comparison: 'Pad thai and tuk tuks!', checkpoint: 'Bangkok, Thailand' },

  // 10000km+ — gaps: 2000-3000km, Middle East & Europe
  { meters: 10000000, label: '10,000 km', emoji: 'milestone_mosque', comparison: 'Quarter around the world!', checkpoint: 'Mumbai, India' },
  { meters: 12000000, label: '12,000 km', emoji: 'milestone_camel', comparison: 'Gold, skyscrapers, and 120F heat!', checkpoint: 'Dubai, UAE' },
  { meters: 15000000, label: '15,000 km', emoji: 'milestone_pyramid', comparison: 'Pyramids in sight!', checkpoint: 'Cairo, Egypt' },
  { meters: 18000000, label: '18,000 km', emoji: 'milestone_croissant', comparison: 'Ooh la la, croissants!', checkpoint: 'Paris, France' },
  { meters: 20000000, label: '20,000 km', emoji: 'milestone_coffee', comparison: 'Halfway! Time for tea and crumpets!', checkpoint: 'London, UK' },

  // 20000km+ — gaps: 5000km, across the Atlantic and home
  { meters: 25000000, label: '25,000 km', emoji: 'milestone_newyork', comparison: 'The Big Apple! Start spreading the news!', checkpoint: 'New York, NY' },
  { meters: 30000000, label: '30,000 km', emoji: 'milestone_mexico', comparison: 'Tacos and churros!', checkpoint: 'Mexico City, MX' },
  { meters: 35000000, label: '35,000 km', emoji: 'milestone_llama', comparison: 'Ceviche and Machu Picchu!', checkpoint: 'Lima, Peru' },
  { meters: 40075000, label: '40,075 km', emoji: 'milestone_home', comparison: 'YOU ROWED AROUND THE WORLD! Welcome home!', checkpoint: 'Seattle, WA — HOME!' },
];

// Get next milestone for a given total meters
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

// Get the index of the current milestone (0-based, how many completed)
export const getMilestoneIndex = (totalMeters) => {
  let count = 0;
  for (let i = 0; i < MILESTONES.length; i++) {
    if (totalMeters >= MILESTONES[i].meters) count++;
    else break;
  }
  return count;
};

// Get the nearest checkpoints (previous and next) for current position
export const getNearestCheckpoints = (totalMeters) => {
  const checkpoints = MILESTONES.filter(m => m.checkpoint);
  const next = checkpoints.find(m => m.meters > totalMeters) || null;
  let prev = null;
  for (let i = checkpoints.length - 1; i >= 0; i--) {
    if (totalMeters >= checkpoints[i].meters) {
      prev = checkpoints[i];
      break;
    }
  }
  return { prev, next };
};
