import { CREW_STOPS, WORLD_METERS } from '../constants/crewJourney';
import { JOURNEY_CHECKPOINTS } from '../constants/journeyPath';
import { getCrewJourney, getCrewRoutePath, getCrewRouteSegments } from './crewJourney';

test('keeps all existing checkpoint targets and projects geographical locations onto the world map', () => {
  expect(CREW_STOPS.map(stop => stop.meters)).toEqual(JOURNEY_CHECKPOINTS.map(stop => stop.meters));
  expect(new Set(CREW_STOPS.map(stop => stop.id)).size).toBe(21);
  CREW_STOPS.forEach(stop => {
    expect(stop.x).toBeCloseTo((stop.lon + 180) / 360 * 1000);
    expect(stop.y).toBeCloseTo((90 - stop.lat) / 180 * 500);
    expect(stop.x).toBeGreaterThanOrEqual(0);
    expect(stop.x).toBeLessThanOrEqual(1000);
    expect(stop.y).toBeGreaterThanOrEqual(0);
    expect(stop.y).toBeLessThanOrEqual(500);
  });
});

test.each([undefined, null, NaN, Infinity, -Infinity, -5, 'broken', {}, true, Symbol('invalid')])(
  'invalid or negative totals start the journey safely (%s)', value => {
    expect(getCrewJourney(value)).toMatchObject({
      totalMeters: 0, distanceMeters: 0, progressPct: 0, visitedStops: 0,
      activeIndex: 0, nextIndex: 1, legProgress: 0, remainingOnLeg: 350000,
    });
    expect(getCrewJourney(value).position.x).toBeCloseTo(CREW_STOPS[0].x);
  },
);

test('accepts stored numeric strings and calculates progress within a leg', () => {
  const result = getCrewJourney('675000');
  expect(result).toMatchObject({
    totalMeters: 675000, distanceMeters: 675000, visitedStops: 1,
    activeIndex: 1, nextIndex: 2, legProgress: 0.5, remainingOnLeg: 325000,
  });
  expect(result.previous.id).toBe('portland');
  expect(result.next.id).toBe('san-francisco');
  expect(result.position.x).toBeCloseTo((CREW_STOPS[1].x + CREW_STOPS[2].x) / 2);
  expect(result.position.y).toBeCloseTo((CREW_STOPS[1].y + CREW_STOPS[2].y) / 2);
});

test('reaching each checkpoint completes it immediately and starts the next leg at zero', () => {
  CREW_STOPS.slice(1, -1).forEach((stop, index) => {
    const result = getCrewJourney(stop.meters);
    expect(result).toMatchObject({ activeIndex: index + 1, nextIndex: index + 2, visitedStops: index + 1, legProgress: 0 });
    expect(result.position.x).toBeCloseTo(stop.x);
    expect(result.position.y).toBeCloseTo(stop.y);
    expect(result.previous).toBe(stop);
  });
});

test.each([WORLD_METERS, WORLD_METERS + 10000000])('completion caps the map while retaining real crew distance (%s)', totalMeters => {
  expect(getCrewJourney(totalMeters)).toMatchObject({
    totalMeters, distanceMeters: WORLD_METERS, progressPct: 100, visitedStops: 20,
    activeIndex: 20, nextIndex: null, next: null, legProgress: 1, remainingOnLeg: 0,
    position: { x: CREW_STOPS[20].x, y: CREW_STOPS[20].y },
  });
});

test('the Pacific crossing interpolates through the map edge instead of through Europe', () => {
  const from = CREW_STOPS[5];
  const to = CREW_STOPS[6];
  const result = getCrewJourney((from.meters + to.meters) / 2);
  expect(result.position.x).toBeGreaterThan(900);
  expect(result.position.y).toBeCloseTo((from.y + to.y) / 2);
  const segments = getCrewRouteSegments(from, to);
  expect(segments).toHaveLength(2);
  expect(segments[0].start).toEqual({ x: from.x, y: from.y });
  expect(segments[0].end.x).toBe(0);
  expect(segments[1].start.x).toBe(1000);
  expect(segments[0].end.y).toBe(segments[1].start.y);
  expect(segments[1].end).toEqual({ x: to.x, y: to.y });
});

test('route splits work in either direction and at the boundary without long lines', () => {
  expect(getCrewRouteSegments({ x: 990, y: 100 }, { x: 10, y: 200 })).toEqual([
    { start: { x: 990, y: 100 }, end: { x: 1000, y: 150 } },
    { start: { x: 0, y: 150 }, end: { x: 10, y: 200 } },
  ]);
  expect(getCrewRouteSegments({ x: 100, y: 100 }, { x: 300, y: 200 })).toEqual([
    { start: { x: 100, y: 100 }, end: { x: 300, y: 200 } },
  ]);
  expect(getCrewRouteSegments({ x: 990, y: 100 }, { x: 0, y: 200 })).toEqual([
    { start: { x: 990, y: 100 }, end: { x: 1000, y: 200 } },
    { start: { x: 0, y: 200 }, end: { x: 0, y: 200 } },
  ]);
  expect(getCrewRouteSegments({ x: 0, y: 100 }, { x: 1000, y: 200 })).toEqual([
    { start: { x: 0, y: 100 }, end: { x: 0, y: 200 } },
  ]);
  for (let index = 1; index < CREW_STOPS.length; index += 1) {
    getCrewRouteSegments(CREW_STOPS[index - 1], CREW_STOPS[index]).forEach(segment => {
      expect(Math.abs(segment.end.x - segment.start.x)).toBeLessThanOrEqual(500);
    });
  }
});

test('SVG paths contain separate subpaths across the date line and handle incomplete input', () => {
  expect(getCrewRoutePath([{ x: 990, y: 100 }, { x: 10, y: 200 }]))
    .toBe('M 990 100 L 1000 150 M 0 150 L 10 200');
  expect(getCrewRoutePath()).not.toMatch(/NaN|Infinity/);
  expect(getCrewRoutePath([])).toBe('');
  expect(getCrewRoutePath(null)).toBe('');
  expect(getCrewRouteSegments(null, CREW_STOPS[0])).toEqual([]);
});
