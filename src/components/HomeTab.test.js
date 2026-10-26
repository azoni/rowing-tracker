import React, { act } from 'react';
import { createRoot } from 'react-dom/client';
import HomeTab from './HomeTab';
import { useApp } from '../context/AppContext';
import { getUserRank } from '../constants';

jest.mock('../context/AppContext', () => ({ useApp: jest.fn() }));
let container;
let root;
beforeEach(() => {
  global.IS_REACT_ACT_ENVIRONMENT = true;
  jest.useFakeTimers('modern');
  jest.setSystemTime(new Date(2026, 9, 15, 12));
  container = document.createElement('div');
  document.body.appendChild(container);
  root = createRoot(container);
});
afterEach(() => {
  act(() => root.unmount());
  container.remove();
  jest.useRealTimers();
});
const row = (id, extra = {}) => ({ id, userId: 'me', meters: 2000, date: new Date(2026, 9, 14, 9).toISOString(), ...extra });
const render = (entries, extra = {}) => {
  const profile = { id: 'me', name: 'Alex', totalMeters: 900000, totalTime: 90000 };
  const context = { currentUser: { uid: 'me' }, userProfile: profile, users: { me: profile }, entries,
    totalMeters: 1000000, getUserAchievements: () => [], getAchievementProgress: () => ({ current: 0, target: 1 }),
    setShowRankProgressModal: jest.fn(), setShowAchievementModal: jest.fn(), setShowLogModal: jest.fn(),
    setShowSessionHistory: jest.fn(), setActiveTab: jest.fn(), setShowCrewMap: jest.fn(), ...extra };
  useApp.mockReturnValue(context);
  act(() => root.render(<HomeTab />));
  return context;
};

test('weekly recorded time describes only timed eligible rows and reports its coverage', () => {
  render([row('timed', { time: 510 }), row('untimed'), row('pending', { time: 1200, verificationStatus: 'pending_review' }),
    row('test', { time: 3000, isTest: true }), row('future', { time: 3000, date: new Date(2026, 9, 16).toISOString() })]);
  expect(container.querySelector('.weekly-distance').textContent).toBe('4km rowed');
  expect(container.querySelector('.weekly-facts').textContent).toBe('Rows2Active days1 / 7Recorded time8:30');
  expect(container.querySelector('.weekly-time-coverage').textContent).toBe('Time recorded for 1 of 2 rows.');
});

test('an empty eligible week invites a row, keeps missing time honest and preserves log actions', () => {
  const context = render([row('last-week', { time: 510, date: new Date(2026, 9, 11, 9).toISOString() }),
    row('pending', { time: 1200, verificationStatus: 'pending_review' })]);
  const week = container.querySelector('.weekly-card');
  expect(week.querySelector('.weekly-distance').textContent).toBe('0km rowed');
  expect(week.querySelector('.weekly-facts').textContent).toBe('Rows0Active days0 / 7Recorded time—');
  expect(week.querySelector('.weekly-time-coverage').textContent).toBe('Your next row moves the crew forward.');
  expect(week.querySelectorAll('[role="listitem"]')).toHaveLength(7);
  expect(week.querySelectorAll('.has-row')).toHaveLength(0);
  act(() => week.querySelector('.dashboard-log').click());
  expect(context.setShowLogModal).toHaveBeenCalledWith(true);
  act(() => week.querySelector('.weekly-history').click());
  expect(context.setShowSessionHistory).toHaveBeenCalledWith(true);
});

test('a week of untimed rows distinguishes missing recorded time from an empty week', () => {
  render([row('untimed')]);
  expect(container.querySelector('.weekly-facts').textContent).toBe('Rows1Active days1 / 7Recorded time—');
  expect(container.querySelector('.weekly-time-coverage').textContent).toBe('Add a time to your row to track it here.');
});

test('Home rank uses eligible lifetime distance instead of a stale stored counter', () => {
  render([row('counted'), row('pending', { meters: 700000, verificationStatus: 'pending_review' })]);
  expect(container.querySelector('.dashboard-rank strong').textContent).toBe(getUserRank(2000).title);
  expect(container.querySelector('.dashboard-rank strong').textContent).not.toBe(getUserRank(900000).title);
});

test('the world journey leads Home and uses the whole crew total independently of the personal week', () => {
  const context = render([row('mine', { meters: 2000 })]);
  const world = container.querySelector('.world-journey');
  const week = container.querySelector('.weekly-card');
  expect(world.compareDocumentPosition(week) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();
  expect(world.querySelector('.world-journey-distance strong').textContent).toBe('1,000');
  expect(world.textContent).toContain('40,075 km goal');
  expect(week.querySelector('.weekly-distance').textContent).toBe('2km rowed');
  expect(container.querySelector('.crew-artwork')).toBeNull();
  expect(container.querySelector('.journey-preview')).toBeNull();
  act(() => world.querySelector('button').click());
  expect(context.setShowCrewMap).toHaveBeenCalledWith(true);
});

test('recent history explains uncounted states and omits malformed, future and test fixtures', () => {
  render([row('manual'), row('pending', { verificationStatus: 'pending_review' }), row('rejected', { verificationStatus: 'rejected' }),
    row('bad-number', { meters: 'broken' }), row('bad-date', { date: 'broken' }), row('test', { isTest: true }),
    row('future', { date: new Date(2026, 9, 16).toISOString() })]);
  const recent = container.querySelector('.dashboard-recent');
  expect(recent.querySelectorAll('.dashboard-row')).toHaveLength(3);
  expect(recent.textContent).toContain('Manual entry');
  expect(recent.textContent).toContain('In review, not counted yet');
  expect(recent.textContent).toContain('Not approved, not counted');
  expect(recent.textContent).not.toMatch(/NaN|Invalid Date/);
  expect(container.querySelector('.weekly-distance').textContent).toBe('2km rowed');
});

test('the greeting follows the time of day', () => {
  render([]);
  expect(container.querySelector('.dashboard-heading h2').textContent).toBe('Good afternoon, Alex.');
  jest.setSystemTime(new Date(2026, 9, 15, 6));
  render([]);
  expect(container.querySelector('.dashboard-heading h2').textContent).toBe('Good morning, Alex.');
});

test('the journey hero credits rowers by eligible lifetime distance, largest share first', () => {
  render([], { metricUsers: {
    me: { name: 'Alex Morgan', totalMeters: 12000 },
    sam: { name: 'Sam Rivera', totalMeters: 30000 },
    idle: { name: 'Idle Rower', totalMeters: 0 },
  } });
  const names = () => [...container.querySelectorAll('.world-journey-crew-name')].map(node => node.textContent);
  expect(names()).toEqual(['Sam', 'Alex']);
  expect(container.querySelector('.world-journey-crew-km').textContent).toBe('30 km');
  render([]);
  expect(names()).toEqual(['Alex']);
});
