import React, { act } from 'react';
import { createRoot } from 'react-dom/client';
import { Simulate } from 'react-dom/test-utils';
import { useApp } from '../context/AppContext';
import { WORLD_METERS } from '../constants/crewJourney';
import { getCrewJourney } from '../utils/crewJourney';
import JourneyPreview from './JourneyPreview';
import HomeTab from './HomeTab';

jest.mock('../context/AppContext', () => ({ useApp: jest.fn() }));

let container;
let root;

beforeEach(() => {
  global.IS_REACT_ACT_ENVIRONMENT = true;
  container = document.createElement('div');
  document.body.appendChild(container);
  root = createRoot(container);
});

afterEach(() => {
  act(() => root.unmount());
  container.remove();
  jest.useRealTimers();
  jest.restoreAllMocks();
});

const render = component => act(() => root.render(component));
const preview = () => container.querySelector('.journey-preview');
const boatPosition = () => container.querySelector('.journey-preview-boat').getAttribute('transform')
  .match(/translate\(([-\d.]+) ([-\d.]+)\)/).slice(1).map(Number);

test('the preview agrees with the full map on crew position, world progress, and the next leg', () => {
  const journey = getCrewJourney(675000);
  render(<JourneyPreview totalMeters={675000} />);
  expect(preview().getAttribute('aria-label')).toContain('675 km rowed together');
  expect(preview().getAttribute('aria-label')).toContain('1.7 percent around the world');
  expect(preview().getAttribute('aria-label')).toContain('Next stop: San Francisco, 325 km away');
  const [x, y] = boatPosition();
  expect(x).toBeCloseTo(journey.position.x);
  expect(y).toBeCloseTo(journey.position.y);
  const destination = container.querySelector('.journey-preview-destination');
  expect(Number(destination.getAttribute('cx'))).toBeCloseTo(journey.next.x);
  expect(Number(destination.getAttribute('cy'))).toBeCloseTo(journey.next.y);
  expect(parseFloat(container.querySelector('.journey-preview-track > span').style.width)).toBeCloseTo(journey.progressPct);
});

test('zero and unavailable totals start at Seattle without an invalid distance or misleading completion', () => {
  [0, undefined, NaN].forEach(totalMeters => {
    render(<JourneyPreview totalMeters={totalMeters} />);
    expect(preview().getAttribute('aria-label')).toContain('0 km rowed together, 0.0 percent');
    expect(preview().getAttribute('aria-label')).toContain('Next stop: Portland, 350 km away');
    expect(boatPosition()).toEqual([getCrewJourney(0).position.x, getCrewJourney(0).position.y]);
    expect(preview().textContent).not.toMatch(/NaN|Infinity|complete/i);
  });
});

test('finishing the world tour caps progress while retaining additional crew distance', () => {
  [WORLD_METERS, WORLD_METERS + 125000].forEach(totalMeters => {
    render(<JourneyPreview totalMeters={totalMeters} />);
    const distance = (totalMeters / 1000).toLocaleString();
    expect(preview().getAttribute('aria-label')).toContain(`${distance} km rowed together, 100.0 percent`);
    expect(preview().getAttribute('aria-label')).toContain('World tour complete. The crew is back in Seattle');
    expect(container.querySelector('.journey-preview-destination')).toBeNull();
    expect(container.querySelector('.journey-preview-track > span').style.width).toBe('100%');
    expect(boatPosition()).toEqual([getCrewJourney(WORLD_METERS).position.x, getCrewJourney(WORLD_METERS).position.y]);
    expect(preview().textContent).not.toContain('away');
  });
});

test('live checkpoint crossings update the destination and opening the map uses the supplied action', () => {
  const onOpen = jest.fn();
  render(<JourneyPreview totalMeters={999999} onOpen={onOpen} />);
  expect(preview().getAttribute('aria-label')).toContain('Next stop: San Francisco');
  render(<JourneyPreview totalMeters={1000000} onOpen={onOpen} />);
  expect(preview().getAttribute('aria-label')).toContain('Next stop: Los Angeles, 500 km away');
  expect(onOpen).not.toHaveBeenCalled();
  act(() => Simulate.click(preview()));
  expect(onOpen).toHaveBeenCalledTimes(1);
});

test('tiny progress and the last few meters remain distinguishable from zero or arrival', () => {
  render(<JourneyPreview totalMeters={100} />);
  expect(preview().getAttribute('aria-label')).toContain('less than 0.1 percent');
  render(<JourneyPreview totalMeters={349999} />);
  expect(preview().getAttribute('aria-label')).toContain('Next stop: Portland, less than 0.1 km away');
  expect(preview().getAttribute('aria-label')).not.toContain('complete');
});

test('Home keeps personal weekly rows separate from the whole crew lifetime journey', () => {
  jest.useFakeTimers('modern');
  jest.setSystemTime(new Date(2026, 9, 15, 12));
  const row = (id, day, meters, userId = 'me', extra = {}) => ({ id, userId, meters,
    date: new Date(2026, 9, day, 9).toISOString(), ...extra });
  const currentUser = { uid: 'me' };
  const userProfile = { id: 'me', name: 'Alex Rower', totalMeters: 100000 };
  const context = {
    currentUser, userProfile, totalMeters: 675000,
    users: { me: userProfile, teammate: { id: 'teammate', name: 'Sam Rower', totalMeters: 575000 } },
    entries: [row('monday', 12, 2000), row('wednesday', 14, 3000), row('old', 11, 7000),
      row('teammate', 14, 8000, 'teammate'), row('future', 16, 9000),
      row('review', 14, 6000, 'me', { verificationStatus: 'pending_review' }),
      row('test', 14, 5000, 'me', { isTest: true })],
    getUserAchievements: jest.fn(() => []), getAchievementProgress: jest.fn(() => ({ current: 0, target: 1 })),
    setShowCrewMap: jest.fn(), setShowLogModal: jest.fn(), setShowSessionHistory: jest.fn(),
    setShowRankProgressModal: jest.fn(), setShowAchievementModal: jest.fn(), setActiveTab: jest.fn(),
  };
  useApp.mockReturnValue(context);
  render(<HomeTab />);
  const weekly = container.querySelector('[aria-labelledby="weekly-title"]');
  expect(weekly.querySelector('.weekly-distance').textContent).toBe('5km');
  expect(weekly.querySelector('.weekly-tally').textContent).toBe('2 rows2 active days');
  expect(weekly.querySelector('[aria-label="Wednesday: 3,000 meters"]')).not.toBeNull();
  expect(weekly.querySelector('[aria-label="Friday: 0 meters, upcoming"]')).not.toBeNull();
  expect(preview().getAttribute('aria-label')).toContain('675 km rowed together');
  expect(preview().getAttribute('aria-label')).toContain('Next stop: San Francisco, 325 km away');
  act(() => Simulate.click(preview()));
  expect(context.setShowCrewMap).toHaveBeenCalledWith(true);
  act(() => Simulate.click(weekly.querySelector('.dashboard-log')));
  expect(context.setShowLogModal).toHaveBeenCalledWith(true);
  act(() => Simulate.click(weekly.querySelector('.weekly-history')));
  expect(context.setShowSessionHistory).toHaveBeenCalledWith(true);
});
