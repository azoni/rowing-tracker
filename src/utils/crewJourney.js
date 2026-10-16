import { CREW_STOPS, WORLD_METERS } from '../constants/crewJourney';

const MAP_WIDTH = 1000;

function shortestDelta(from, to) {
  const delta = to.x - from.x;
  if (delta > MAP_WIDTH / 2) return delta - MAP_WIDTH;
  if (delta < -MAP_WIDTH / 2) return delta + MAP_WIDTH;
  return delta;
}

function positionOnLeg(from, to, progress) {
  const x = from.x + shortestDelta(from, to) * progress;
  return {
    x: (x + MAP_WIDTH) % MAP_WIDTH,
    y: from.y + (to.y - from.y) * progress,
  };
}

// Split at the date line instead of drawing a false route across the whole map.
// Each returned segment has a start and end point in the 1000 x 500 viewBox.
export function getCrewRouteSegments(from, to) {
  if (!from || !to || ![from.x, from.y, to.x, to.y].every(Number.isFinite)) return [];
  const start = { x: from.x, y: from.y };
  const end = { x: to.x, y: to.y };
  const delta = shortestDelta(from, to);
  const unwrappedEnd = from.x + delta;
  if (Math.abs(to.x - from.x) <= MAP_WIDTH / 2) return [{ start, end }];
  if (delta === 0) return [{ start, end: { x: from.x, y: to.y } }];

  const edge = unwrappedEnd <= 0 ? 0 : MAP_WIDTH;
  const progress = (edge - from.x) / delta;
  const y = from.y + (to.y - from.y) * progress;
  return [
    { start, end: { x: edge, y } },
    { start: { x: MAP_WIDTH - edge, y }, end },
  ];
}

export function getCrewRoutePath(stops = CREW_STOPS) {
  if (!Array.isArray(stops)) return '';
  const coordinate = value => Number(value.toFixed(3));
  return stops.slice(1).flatMap((stop, index) => getCrewRouteSegments(stops[index], stop))
    .map(({ start, end }) => `M ${coordinate(start.x)} ${coordinate(start.y)} L ${coordinate(end.x)} ${coordinate(end.y)}`)
    .join(' ');
}

export function getCrewJourney(value) {
  const number = typeof value === 'number' || typeof value === 'string' ? Number(value) : NaN;
  const totalMeters = Number.isFinite(number) ? Math.max(0, number) : 0;
  const distanceMeters = Math.min(totalMeters, WORLD_METERS);
  const upcomingIndex = CREW_STOPS.findIndex(stop => stop.meters > distanceMeters);
  const nextIndex = upcomingIndex === -1 ? null : upcomingIndex;
  const activeIndex = nextIndex === null ? CREW_STOPS.length - 1 : nextIndex - 1;
  const previous = CREW_STOPS[activeIndex];
  const next = nextIndex === null ? null : CREW_STOPS[nextIndex];
  const legProgress = next ? (distanceMeters - previous.meters) / (next.meters - previous.meters) : 1;

  return {
    totalMeters,
    distanceMeters,
    progressPct: distanceMeters / WORLD_METERS * 100,
    visitedStops: activeIndex,
    activeIndex,
    nextIndex,
    previous,
    next,
    legProgress,
    remainingOnLeg: next ? next.meters - distanceMeters : 0,
    position: next ? positionOnLeg(previous, next, legProgress) : { x: previous.x, y: previous.y },
  };
}
