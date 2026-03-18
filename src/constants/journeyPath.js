// Journey route — checkpoint coordinates for the visual SVG map
// Route: Seattle → down coast → across Pacific → Asia → Middle East → Europe → Atlantic → Americas → home
// x,y positions on a 800x400 stylized world map (not geo-accurate, but visually pleasing)

export const JOURNEY_CHECKPOINTS = [
  { meters: 0,        x: 115, y: 95,  label: 'Seattle, WA' },
  { meters: 350000,   x: 110, y: 110, label: 'Portland, OR' },
  { meters: 1000000,  x: 100, y: 135, label: 'San Francisco' },
  { meters: 1500000,  x: 105, y: 155, label: 'Los Angeles' },
  { meters: 3000000,  x: 60,  y: 185, label: 'Honolulu' },
  { meters: 5000000,  x: 15,  y: 175, label: 'Midway Atoll' },
  { meters: 7000000,  x: 720, y: 140, label: 'Tokyo' },
  { meters: 8000000,  x: 690, y: 160, label: 'Shanghai' },
  { meters: 9000000,  x: 660, y: 195, label: 'Bangkok' },
  { meters: 10000000, x: 610, y: 190, label: 'Mumbai' },
  { meters: 12000000, x: 555, y: 185, label: 'Dubai' },
  { meters: 15000000, x: 510, y: 175, label: 'Cairo' },
  { meters: 16500000, x: 470, y: 140, label: 'Rome' },
  { meters: 18000000, x: 450, y: 120, label: 'Paris' },
  { meters: 20000000, x: 435, y: 105, label: 'London' },
  { meters: 22000000, x: 405, y: 65,  label: 'Reykjavik' },
  { meters: 25000000, x: 210, y: 120, label: 'New York' },
  { meters: 30000000, x: 175, y: 200, label: 'Mexico City' },
  { meters: 35000000, x: 195, y: 280, label: 'Lima' },
  { meters: 37500000, x: 200, y: 310, label: 'Santiago' },
  { meters: 40075000, x: 115, y: 95,  label: 'Seattle — HOME!' },
];

// Build SVG path string from checkpoints using smooth curves
export function getJourneyPathD() {
  const pts = JOURNEY_CHECKPOINTS;
  if (pts.length < 2) return '';

  let d = `M ${pts[0].x} ${pts[0].y}`;

  for (let i = 1; i < pts.length; i++) {
    const prev = pts[i - 1];
    const curr = pts[i];

    // Handle the Pacific wrap-around (Midway → Tokyo crosses the map edge)
    if (i === 6) {
      // Go off the left edge and come back on the right
      d += ` L -10 ${prev.y}`;
      d += ` M 810 ${curr.y}`;
      d += ` L ${curr.x} ${curr.y}`;
    } else {
      // Smooth curve
      const cx = (prev.x + curr.x) / 2;
      d += ` Q ${cx} ${prev.y} ${curr.x} ${curr.y}`;
    }
  }

  return d;
}

// Get position along the journey for a given meters value
export function getJourneyPosition(meters) {
  const pts = JOURNEY_CHECKPOINTS;
  if (meters <= 0) return { x: pts[0].x, y: pts[0].y };
  if (meters >= 40075000) return { x: pts[pts.length - 1].x, y: pts[pts.length - 1].y };

  // Find the two checkpoints we're between
  for (let i = 1; i < pts.length; i++) {
    if (meters < pts[i].meters) {
      const prev = pts[i - 1];
      const curr = pts[i];
      const t = (meters - prev.meters) / (curr.meters - prev.meters);

      // Skip the Pacific wrap interpolation
      if (i === 6) {
        // Interpolate across the map wrap
        if (t < 0.5) {
          return { x: prev.x - (t * 2 * (prev.x + 10)), y: prev.y + (curr.y - prev.y) * t };
        } else {
          return { x: 810 - ((1 - t) * 2 * (810 - curr.x)), y: prev.y + (curr.y - prev.y) * t };
        }
      }

      return {
        x: prev.x + (curr.x - prev.x) * t,
        y: prev.y + (curr.y - prev.y) * t,
      };
    }
  }

  return { x: pts[pts.length - 1].x, y: pts[pts.length - 1].y };
}
