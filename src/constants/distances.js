export const STANDARD_DISTANCES = [
  { meters: 500, label: '500m', tolerance: 5 },
  { meters: 1000, label: '1K', tolerance: 5 },
  { meters: 2000, label: '2K', tolerance: 10 },
  { meters: 5000, label: '5K', tolerance: 10 },
  { meters: 10000, label: '10K', tolerance: 15 },
  { meters: 15000, label: '15K', tolerance: 15 },
];

export const getDistanceCategory = (meters) => {
  return STANDARD_DISTANCES.find(d => Math.abs(meters - d.meters) <= d.tolerance) || null;
};
