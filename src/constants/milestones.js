// Milestone definitions — ~83 fun milestones from 500m to around the world
// Route: Seattle, WA → south down coast → across Pacific → Asia → Middle East → Europe → Atlantic → Americas → home
export const MILESTONES = [
  // 0-10km: dense, every 1-2km
  { meters: 500, label: '500m', emoji: 'milestone_building', comparison: 'Height of the Empire State Building!' },
  { meters: 1000, label: '1 km', emoji: 'milestone_football', comparison: 'Length of 10 football fields!' },
  { meters: 1500, label: '1.5 km', emoji: 'milestone_coaster', comparison: 'Longer than 6 roller coasters end-to-end!' },
  { meters: 2000, label: '2 km', emoji: 'milestone_pool', comparison: '20 Olympic swimming pools!' },
  { meters: 3000, label: '3 km', emoji: 'milestone_bridge', comparison: 'Longer than the Golden Gate Bridge!' },
  { meters: 3142, label: 'π km', emoji: 'milestone_pi', comparison: 'You rowed pi kilometers. Nerd.' },
  { meters: 4000, label: '4 km', emoji: 'milestone_tower', comparison: '10 Eiffel Towers stacked up!' },
  { meters: 5000, label: '5 km', emoji: 'milestone_park', comparison: 'Across Central Park!' },
  { meters: 6000, label: '6 km', emoji: 'milestone_giraffe', comparison: 'About 1,000 giraffes tall!' },
  { meters: 7000, label: '7 km', emoji: 'milestone_plane', comparison: 'Longer than most airport runways!' },
  { meters: 8000, label: '8 km', emoji: 'milestone_mountain', comparison: 'Taller than Mount Everest!' },
  { meters: 9000, label: '9 km', emoji: 'milestone_tv', comparison: 'Over 9,000! *crushes scouter*' },
  { meters: 10000, label: '10 km', emoji: 'milestone_cloud', comparison: 'Height of a cruising airplane!' },

  // 10-50km: every 5km with a few fun ones
  { meters: 15000, label: '15 km', emoji: 'milestone_fish', comparison: 'Deeper than the Mariana Trench!' },
  { meters: 20000, label: '20 km', emoji: 'milestone_beaver', comparison: 'Beaver dam in Alberta is 850m. You rowed 23 of those.' },
  { meters: 21097, label: 'Half Marathon', emoji: 'milestone_runner', comparison: '21.1 km — half marathon without the shin splints!' },
  { meters: 25000, label: '25 km', emoji: 'milestone_pizza', comparison: '62,500 slices of pizza laid flat!' },
  { meters: 30000, label: '30 km', emoji: 'milestone_subway', comparison: 'Longer than the London Underground\'s longest line!' },
  { meters: 35000, label: '35 km', emoji: 'milestone_guitar', comparison: 'That\'s 35,000 guitar picks end-to-end!' },
  { meters: 40000, label: '40 km', emoji: 'milestone_beach', comparison: 'Length of all beaches in Miami!' },
  { meters: 42195, label: 'Marathon', emoji: 'milestone_medal', comparison: '42.2 km — full marathon! No medal though.' },
  { meters: 45000, label: '45 km', emoji: 'milestone_dinosaur', comparison: 'About 1,500 T-Rex lengths!' },
  { meters: 50000, label: '50 km', emoji: 'milestone_cart', comparison: 'The world\'s longest Costco run!' },

  // 50-100km: every 10km
  { meters: 55000, label: '55 km', emoji: 'milestone_bowling', comparison: 'That\'s bowling 2,750 lanes back to back!' },
  { meters: 60000, label: '60 km', emoji: 'milestone_pasta', comparison: 'If this was spaghetti, that\'s one serious dinner!' },
  { meters: 65000, label: '65 km', emoji: 'milestone_dog', comparison: 'Your dog would pass out walking this!' },
  { meters: 69000, label: '69 km', emoji: 'milestone_grin', comparison: 'Nice.' },
  { meters: 75000, label: '75 km', emoji: 'milestone_castle', comparison: 'Wall around a medieval kingdom!' },
  { meters: 80000, label: '80 km', emoji: 'milestone_shark', comparison: 'A great white shark swims about this far per day!' },
  { meters: 90000, label: '90 km', emoji: 'milestone_train', comparison: 'Longer than the Channel Tunnel... three times!' },
  { meters: 100000, label: '100 km', emoji: 'milestone_sailboat', comparison: 'Length of the Panama Canal!' },

  // 100-250km: every 25km
  { meters: 125000, label: '125 km', emoji: 'milestone_ski', comparison: 'You\'ve out-skied every resort on Earth!' },
  { meters: 150000, label: '150 km', emoji: 'milestone_hotdog', comparison: 'That\'s 750,000 hot dogs end-to-end!' },
  { meters: 175000, label: '175 km', emoji: 'milestone_snail', comparison: 'A snail would take 7 years to go this far!' },
  { meters: 200000, label: '200 km', emoji: 'milestone_banana', comparison: 'About 1 million bananas laid end-to-end!' },
  { meters: 225000, label: '225 km', emoji: 'milestone_racecar', comparison: 'Almost a full NASCAR race distance!' },
  { meters: 250000, label: '250 km', emoji: 'milestone_statue', comparison: 'NYC to Washington DC!' },

  // 250-500km: every 50km — heading south from Seattle
  { meters: 300000, label: '300 km', emoji: 'milestone_trees', comparison: 'Keep Portland weird!', checkpoint: 'Portland, OR' },
  { meters: 350000, label: '350 km', emoji: 'milestone_gamepad', comparison: 'Across the entire map in GTA V... 14 times!' },
  { meters: 400000, label: '400 km', emoji: 'milestone_rocket', comparison: 'ISS orbit altitude — you\'re in space!' },
  { meters: 420000, label: '420 km', emoji: 'milestone_leaf', comparison: 'Blaze it... in kilometers.' },
  { meters: 450000, label: '450 km', emoji: 'milestone_cheese', comparison: 'Length of Switzerland. Grab some cheese.' },
  { meters: 500000, label: '500 km', emoji: 'milestone_wave', comparison: 'Length of the California coastline!' },

  // 500-1000km: every 100km — down the coast
  { meters: 600000, label: '600 km', emoji: 'milestone_burger', comparison: 'NYC to Cleveland. Stop for a burger.' },
  { meters: 700000, label: '700 km', emoji: 'milestone_kangaroo', comparison: 'A kangaroo hops about 25km/day. This is a month of hopping.' },
  { meters: 750000, label: '750 km', emoji: 'milestone_music', comparison: 'You\'d listen to "Never Gonna Give You Up" 9,615 times.' },
  { meters: 800000, label: '800 km', emoji: 'milestone_bear', comparison: 'A grizzly bear\'s entire territory... twice!' },
  { meters: 900000, label: '900 km', emoji: 'milestone_waffle', comparison: 'Length of Belgium back and forth 3 times!' },
  { meters: 1000000, label: '1,000 km', emoji: 'milestone_city', comparison: 'Fog, sourdough, and tech bros!', checkpoint: 'San Francisco, CA' },

  // 1000-2000km: every 200km — continuing south
  { meters: 1200000, label: '1,200 km', emoji: 'milestone_whale', comparison: 'A blue whale\'s weekly migration!' },
  { meters: 1400000, label: '1,400 km', emoji: 'milestone_desert', comparison: 'Across the Sahara Desert at its narrowest!' },
  { meters: 1500000, label: '1,500 km', emoji: 'milestone_movie', comparison: 'Lights, camera, rowing!', checkpoint: 'Los Angeles, CA' },
  { meters: 1600000, label: '1,600 km', emoji: 'milestone_noodles', comparison: 'Length of Japan — slurp a ramen at each end!' },
  { meters: 1800000, label: '1,800 km', emoji: 'milestone_eagle', comparison: 'An eagle\'s migration from Canada to Mexico!' },
  { meters: 2000000, label: '2,000 km', emoji: 'milestone_americanfootball', comparison: 'Coast to coast if America was half as wide!' },

  // 2000-5000km: every 500km — across the Pacific
  { meters: 2500000, label: '2,500 km', emoji: 'milestone_kangaroo', comparison: 'Width of Australia — g\'day mate!' },
  { meters: 3000000, label: '3,000 km', emoji: 'milestone_flower', comparison: 'Aloha! Grab a mai tai!', checkpoint: 'Honolulu, HI' },
  { meters: 3500000, label: '3,500 km', emoji: 'milestone_italian', comparison: 'Length of Italy... 5 times. That\'s a lot of pizza.' },
  { meters: 4000000, label: '4,000 km', emoji: 'milestone_polarbear', comparison: 'Trans-Siberian Railway length!' },
  { meters: 4500000, label: '4,500 km', emoji: 'milestone_taco', comparison: 'US-Mexico border... 2.5 times!' },
  { meters: 5000000, label: '5,000 km', emoji: 'milestone_island', comparison: 'Middle of the Pacific. Nothing but ocean.', checkpoint: 'Midway Atoll' },

  // 5000-10000km: every 1000km — arriving in Asia
  { meters: 6000000, label: '6,000 km', emoji: 'milestone_map', comparison: 'Width of the entire United States!' },
  { meters: 6371000, label: '6,371 km', emoji: 'milestone_volcano', comparison: 'Earth\'s radius — you could row to the center!' },
  { meters: 7000000, label: '7,000 km', emoji: 'milestone_tokyotower', comparison: 'Konnichiwa! Hit up a ramen shop!', checkpoint: 'Tokyo, Japan' },
  { meters: 8000000, label: '8,000 km', emoji: 'milestone_dumpling', comparison: 'Dumplings for days!', checkpoint: 'Shanghai, China' },
  { meters: 9000000, label: '9,000 km', emoji: 'milestone_bowl', comparison: 'Pad thai and tuk tuks!', checkpoint: 'Bangkok, Thailand' },
  { meters: 10000000, label: '10,000 km', emoji: 'milestone_mosque', comparison: 'Quarter around the world!', checkpoint: 'Mumbai, India' },

  // 10000-20000km: every 2000km — Middle East & Europe
  { meters: 12000000, label: '12,000 km', emoji: 'milestone_camel', comparison: 'Gold, skyscrapers, and 120F heat!', checkpoint: 'Dubai, UAE' },
  { meters: 14000000, label: '14,000 km', emoji: 'milestone_pyramid', comparison: 'Pyramids in sight!', checkpoint: 'Cairo, Egypt' },
  { meters: 16000000, label: '16,000 km', emoji: 'milestone_italian', comparison: 'When in Rome... row!', checkpoint: 'Rome, Italy' },
  { meters: 18000000, label: '18,000 km', emoji: 'milestone_croissant', comparison: 'Ooh la la, croissants!', checkpoint: 'Paris, France' },
  { meters: 20000000, label: '20,000 km', emoji: 'milestone_coffee', comparison: 'Halfway! Time for tea and crumpets!', checkpoint: 'London, UK' },

  // 20000-40075km: every 2500-5000km — across the Atlantic and home
  { meters: 22500000, label: '22,500 km', emoji: 'milestone_iceland', comparison: 'Hot springs and puffins!', checkpoint: 'Reykjavik, Iceland' },
  { meters: 25000000, label: '25,000 km', emoji: 'milestone_newyork', comparison: 'The Big Apple! Start spreading the news!', checkpoint: 'New York, NY' },
  { meters: 27500000, label: '27,500 km', emoji: 'milestone_surfing', comparison: 'You surfed every ocean... twice!' },
  { meters: 30000000, label: '30,000 km', emoji: 'milestone_mexico', comparison: 'Tacos and churros!', checkpoint: 'Mexico City, MX' },
  { meters: 32500000, label: '32,500 km', emoji: 'milestone_target', comparison: 'The home stretch — less than 20% to go!' },
  { meters: 35000000, label: '35,000 km', emoji: 'milestone_llama', comparison: 'Ceviche and Machu Picchu!', checkpoint: 'Lima, Peru' },
  { meters: 37500000, label: '37,500 km', emoji: 'milestone_wine', comparison: 'Almost home! Wine country vibes!', checkpoint: 'Santiago, Chile' },
  { meters: 40075000, label: '40,075 km', emoji: 'milestone_home', comparison: '🌍 YOU ROWED AROUND THE WORLD! Welcome home! 🌍', checkpoint: 'Seattle, WA — HOME!' },
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
