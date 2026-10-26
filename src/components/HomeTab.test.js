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
const render = entries => {
  const profile = { id: 'me', name: 'Alex', totalMeters: 900000, totalTime: 90000 };
  useApp.mockReturnValue({ currentUser: { uid: 'me' }, userProfile: profile, users: { me: profile }, entries,
    totalMeters: 1000000, getUserAchievements: () => [], getAchievementProgress: () => ({ current: 0, target: 1 }),
    setShowRankProgressModal: jest.fn(), setShowAchievementModal: jest.fn(), setShowLogModal: jest.fn(),
    setShowSessionHistory: jest.fn(), setActiveTab: jest.fn(), setShowCrewMap: jest.fn() });
  act(() => root.render(<HomeTab />));
};

test('weekly recorded time describes only timed eligible rows and reports its coverage', () => {
  render([row('timed', { time: 510 }), row('untimed'), row('pending', { time: 1200, verificationStatus: 'pending_review' }),
    row('test', { time: 3000, isTest: true }), row('future', { time: 3000, date: new Date(2026, 9, 16).toISOString() })]);
  expect(container.querySelector('.weekly-distance').textContent).toBe('4km rowed');
  expect(container.querySelector('.weekly-facts').textContent).toBe('Rows2Active days1 / 7Recorded time8:30');
  expect(container.querySelector('.weekly-time-coverage').textContent).toBe('Time recorded for 1 of 2 rows.');
});

test('Home rank uses eligible lifetime distance instead of a stale stored counter', () => {
  render([row('counted'), row('pending', { meters: 700000, verificationStatus: 'pending_review' })]);
  expect(container.querySelector('.dashboard-rank strong').textContent).toBe(getUserRank(2000).title);
  expect(container.querySelector('.dashboard-rank strong').textContent).not.toBe(getUserRank(900000).title);
});

test('recent history explains uncounted states and omits malformed, future and test fixtures', () => {
  render([row('manual'), row('pending', { verificationStatus: 'pending_review' }), row('rejected', { verificationStatus: 'rejected' }),
    row('bad-number', { meters: 'broken' }), row('bad-date', { date: 'broken' }), row('test', { isTest: true }),
    row('future', { date: new Date(2026, 9, 16).toISOString() })]);
  const recent = container.querySelector('.dashboard-recent');
  expect(recent.querySelectorAll('.dashboard-row')).toHaveLength(3);
  expect(recent.textContent).toContain('Manual entry');
  expect(recent.textContent).toContain('In review · not counted yet');
  expect(recent.textContent).toContain('Not approved · not counted');
  expect(recent.textContent).not.toMatch(/NaN|Invalid Date/);
  expect(container.querySelector('.weekly-distance').textContent).toBe('2km rowed');
});
