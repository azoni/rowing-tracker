// Common rowing machine types for AI training
export const ROWING_MACHINES = [
  { id: 'concept2_pm5', name: 'Concept2 PM5', popular: true, aliases: ['c2 pm5', 'concept 2 pm5', 'c2pm5', 'pm5'] },
  { id: 'concept2_pm4', name: 'Concept2 PM4', popular: true, aliases: ['c2 pm4', 'concept 2 pm4', 'c2pm4', 'pm4'] },
  { id: 'concept2_pm3', name: 'Concept2 PM3', popular: false, aliases: ['c2 pm3', 'concept 2 pm3', 'c2pm3', 'pm3'] },
  { id: 'hydrow', name: 'Hydrow', popular: true, aliases: ['hydro'] },
  { id: 'nordictrack', name: 'NordicTrack', popular: true, aliases: ['nordic track', 'nordic'] },
  { id: 'waterrower', name: 'WaterRower', popular: true, aliases: ['water rower', 'water'] },
  { id: 'echelon', name: 'Echelon Row', popular: false, aliases: ['echelon'] },
  { id: 'proform', name: 'ProForm', popular: false, aliases: ['pro form'] },
  { id: 'sunny', name: 'Sunny Health', popular: false, aliases: ['sunny health & fitness', 'sunny fitness'] },
  { id: 'life_fitness', name: 'Life Fitness', popular: false, aliases: ['lifefitness'] },
  { id: 'technogym', name: 'Technogym', popular: false, aliases: ['techno gym'] },
  { id: 'gym_generic', name: 'Gym Machine', popular: true, aliases: ['gym', 'generic', 'gym rower'] },
  { id: 'other', name: 'Other / Custom', popular: false, aliases: [] },
];

// Normalize and match machine name to known machines
export const normalizeMachineName = (input) => {
  if (!input) return null;
  const normalized = input.toLowerCase().trim().replace(/\s+/g, ' ');
  
  // First try exact ID match
  const exactMatch = ROWING_MACHINES.find(m => m.id === normalized);
  if (exactMatch) return exactMatch.id;
  
  // Try name match
  const nameMatch = ROWING_MACHINES.find(m => m.name.toLowerCase() === normalized);
  if (nameMatch) return nameMatch.id;
  
  // Try alias match
  const aliasMatch = ROWING_MACHINES.find(m => 
    m.aliases?.some(a => a.toLowerCase() === normalized || normalized.includes(a.toLowerCase()))
  );
  if (aliasMatch) return aliasMatch.id;
  
  // Return as custom if no match
  return null;
};

// Get machine display name
export const getMachineName = (machineId, customName) => {
  if (machineId === 'other' && customName) return customName;
  const machine = ROWING_MACHINES.find(m => m.id === machineId);
  return machine?.name || customName || 'Unknown';
};
