import { WORLD_CIRCUMFERENCE } from './config';

export const WORLD_METERS = WORLD_CIRCUMFERENCE;

// Approximate city centres, projected onto the map's 1000 x 500 world.
// These are virtual rowing checkpoints: meter targets preserve the original
// journey and are not the geographical distance between destinations.
// Midway location: https://repository.library.noaa.gov/view/noaa/3383/noaa_3383_DS1.pdf
// Reykjavik location: https://www.geonames.org/3413829/reykjavik.html
const stops = [
  { id: 'seattle-start', meters: 0, label: 'Seattle', country: 'United States', lat: 47.6062, lon: -122.3321, description: 'From Puget Sound, a shared journey begins.' },
  { id: 'portland', meters: 350000, label: 'Portland', country: 'United States', lat: 45.5152, lon: -122.6784, description: 'A river city in the Pacific Northwest. First stop, together.' },
  { id: 'san-francisco', meters: 1000000, label: 'San Francisco', country: 'United States', lat: 37.7749, lon: -122.4194, description: 'Where the bay meets the Pacific. A million meters in the logbook.' },
  { id: 'los-angeles', meters: 1500000, label: 'Los Angeles', country: 'United States', lat: 34.0522, lon: -118.2437, description: 'Southern California, with the Pacific crossing ahead.' },
  { id: 'honolulu', meters: 3000000, label: 'Honolulu', country: 'United States', lat: 21.3069, lon: -157.8583, description: 'An island stop on Oahu, far out in the Pacific.' },
  { id: 'midway', meters: 5000000, label: 'Midway Atoll', country: 'United States', lat: 28.2333, lon: -177.3667, description: 'A coral atoll in the North Pacific. Next, cross the date line.' },
  { id: 'tokyo', meters: 7000000, label: 'Tokyo', country: 'Japan', lat: 35.6762, lon: 139.6503, description: 'Across the Pacific to Tokyo Bay. A new chapter in Asia.' },
  { id: 'shanghai', meters: 8000000, label: 'Shanghai', country: 'China', lat: 31.2304, lon: 121.4737, description: 'Follow the journey to the Huangpu River.' },
  { id: 'bangkok', meters: 9000000, label: 'Bangkok', country: 'Thailand', lat: 13.7563, lon: 100.5018, description: 'A city along the Chao Phraya River. Keep the crew moving.' },
  { id: 'mumbai', meters: 10000000, label: 'Mumbai', country: 'India', lat: 19.0760, lon: 72.8777, description: 'Reach the Arabian Sea, ten million meters from the start.' },
  { id: 'dubai', meters: 12000000, label: 'Dubai', country: 'United Arab Emirates', lat: 25.2048, lon: 55.2708, description: 'A coastal stop on the Arabian Peninsula.' },
  { id: 'cairo', meters: 15000000, label: 'Cairo', country: 'Egypt', lat: 30.0444, lon: 31.2357, description: 'The Nile brings the journey into Africa.' },
  { id: 'rome', meters: 16500000, label: 'Rome', country: 'Italy', lat: 41.9028, lon: 12.4964, description: 'A stop along the Tiber, with Europe ahead.' },
  { id: 'paris', meters: 18000000, label: 'Paris', country: 'France', lat: 48.8566, lon: 2.3522, description: 'Reach the Seine and another page in the crew passport.' },
  { id: 'london', meters: 20000000, label: 'London', country: 'United Kingdom', lat: 51.5074, lon: -0.1278, description: 'Along the Thames, almost halfway around the journey.' },
  { id: 'reykjavik', meters: 22000000, label: 'Reykjavik', country: 'Iceland', lat: 64.1355, lon: -21.8954, description: 'An Icelandic coastal stop before the Atlantic crossing.' },
  { id: 'new-york', meters: 25000000, label: 'New York', country: 'United States', lat: 40.7128, lon: -74.0060, description: 'Back across the Atlantic, into New York Harbor.' },
  { id: 'mexico-city', meters: 30000000, label: 'Mexico City', country: 'Mexico', lat: 19.4326, lon: -99.1332, description: 'An inland stop in central Mexico. Thirty million meters together.' },
  { id: 'lima', meters: 35000000, label: 'Lima', country: 'Peru', lat: -12.0464, lon: -77.0428, description: 'South of the equator, on Peru\'s Pacific coast.' },
  { id: 'santiago', meters: 37500000, label: 'Santiago', country: 'Chile', lat: -33.4489, lon: -70.6693, description: 'At the foot of the Andes. One final leg home.' },
  { id: 'seattle-home', meters: WORLD_METERS, label: 'Seattle · Home', country: 'United States', lat: 47.6062, lon: -122.3321, description: 'Back to Puget Sound. A whole world of meters, made by the crew.' },
];

export const CREW_STOPS = stops.map(stop => ({
  ...stop,
  x: (stop.lon + 180) / 360 * 1000,
  y: (90 - stop.lat) / 180 * 500,
}));
