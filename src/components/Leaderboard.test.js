import React, { act } from 'react';
import { createRoot } from 'react-dom/client';
import { Simulate } from 'react-dom/test-utils';
import { useApp } from '../context/AppContext';
import { buildLeaderboardStats } from '../utils/leaderboardStats';
import Leaderboard from './Leaderboard';

jest.mock('../context/AppContext', () => ({ useApp: jest.fn() }));
jest.mock('./Avatar', () => () => <span aria-hidden="true">avatar</span>);

let container, root, context;
const now = new Date(2026, 9, 25, 12);
const users = {
  a: { id: 'a', name: 'Amir', totalMeters: 900000 },
  b: { id: 'b', name: 'Bea', totalMeters: 1 },
};
const row = (id, userId, extra = {}) => ({
  id, userId, meters: 2000, time: 480, date: new Date(2026, 9, 24, 10).toISOString(),
  verificationStatus: 'verified', machineType: 'concept2_pm5', sessionType: 'distance', ...extra,
});
const render = () => act(() => root.render(<Leaderboard />));
const button = label => [...container.querySelectorAll('button')].find(element => element.textContent.trim() === label);
const setSearch = value => act(() => Simulate.change(container.querySelector('input[type="search"]'), { target: { value } }));

beforeEach(() => {
  global.IS_REACT_ACT_ENVIRONMENT = true;
  jest.useFakeTimers().setSystemTime(now);
  container = document.createElement('div');
  document.body.appendChild(container);
  root = createRoot(container);
  const stats = buildLeaderboardStats({
    users, now, achievements: [],
    entries: [row('a1', 'a'), row('b1', 'b'), row('b2', 'b', { machineType: 'hydrow', time: 400 })],
  });
  context = {
    currentUser: { uid: 'a' }, selectedGroupId: null, getSelectedGroup: jest.fn(),
    leaderboardTab: 'alltime', leaderboardStats: stats,
    getLeaderboard: stats.allTime, getWeeklyLeaderboard: stats.weekly, getStreakLeaderboard: stats.streaks,
    getAchievementsLeaderboard: stats.achievements, getDistanceRecords: stats.records,
    setShowUserProfileModal: jest.fn(), setShowCrewMap: jest.fn(),
    setLeaderboardTab: jest.fn(tab => { context.leaderboardTab = tab; root.render(<Leaderboard />); }),
  };
  useApp.mockImplementation(() => context);
});

afterEach(() => {
  act(() => root.unmount());
  container.remove();
  jest.useRealTimers();
  jest.restoreAllMocks();
});

test('shows ledger totals in native profile buttons while opening the unchanged stored profile', () => {
  render();
  const rows = container.querySelectorAll('.crew-board-row');
  expect(rows).toHaveLength(2);
  expect(rows[0].textContent).toContain('Bea');
  expect(rows[0].textContent).toContain('4.0k');
  expect(rows[1].textContent).toContain('2.0k');
  expect(rows[1].tagName).toBe('BUTTON');
  rows[1].focus();
  expect(document.activeElement).toBe(rows[1]);
  act(() => rows[1].click());
  expect(context.setShowUserProfileModal).toHaveBeenCalledWith(users.a);
  expect(container.textContent).toContain('Pending, rejected, test and future rows do not count');
});

test('search trims whitespace and preserves the actual place; clear search restores the board', () => {
  render();
  setSearch('  AMIR ');
  expect(container.querySelectorAll('.crew-board-row')).toHaveLength(1);
  expect(container.querySelector('.crew-board-place').textContent).toBe('02');
  expect(container.querySelector('[role="status"]').textContent).toBe('1 of 2 rowers');
  setSearch('No match');
  expect(container.textContent).toContain('No rowers match that name');
  act(() => Simulate.click(button('Clear search')));
  expect(container.querySelectorAll('.crew-board-row')).toHaveLength(2);
});

test('announces the selected board and Monday week range, with working map action', () => {
  render();
  expect(button('All time').getAttribute('aria-pressed')).toBe('true');
  act(() => Simulate.click(button('This week')));
  expect(button('This week').getAttribute('aria-pressed')).toBe('true');
  expect(button('All time').getAttribute('aria-pressed')).toBe('false');
  expect(container.textContent).toContain('Oct 19–Oct 25');
  expect(container.textContent).toContain('Monday–Sunday');
  act(() => Simulate.click(container.querySelector('[aria-label="Open crew map"]')));
  expect(context.setShowCrewMap).toHaveBeenCalledWith(true);
});

test('records compare one explicit setup at a time and keep different machines out of that ranking', () => {
  context.leaderboardTab = 'records';
  render();
  const select = container.querySelector('select');
  expect(select.labels[0].textContent).toContain('Recorded setup');
  expect(select.options).toHaveLength(2);
  expect(select.selectedOptions[0].textContent).toBe('Concept2 PM5 · Distance row');
  expect(container.querySelectorAll('.crew-board-row')).toHaveLength(2);
  const hydrow = [...select.options].find(option => option.textContent.includes('Hydrow'));
  act(() => Simulate.change(select, { target: { value: hydrow.value } }));
  expect(container.querySelectorAll('.crew-board-row')).toHaveLength(1);
  expect(container.querySelector('.crew-board-row').textContent).toContain('Bea');
  expect(container.querySelector('.crew-board-metric').textContent).toContain('6:40.0');
  expect(container.textContent).toContain('not an official race ranking');
  act(() => Simulate.click(button('5K')));
  expect(container.querySelector('select')).toBeNull();
  expect(container.textContent).toContain('No comparable times at this distance yet');
});

test('setup selection recovers when group changes without showing an old group record', () => {
  context.leaderboardTab = 'records';
  render();
  const select = container.querySelector('select');
  const hydrow = [...select.options].find(option => option.textContent.includes('Hydrow'));
  act(() => Simulate.change(select, { target: { value: hydrow.value } }));
  const stats = buildLeaderboardStats({ users, entries: [row('a1', 'a')], memberIds: ['a'], now, achievements: [] });
  context = { ...context, selectedGroupId: 'one', getSelectedGroup: () => ({ name: 'Morning crew' }), getDistanceRecords: stats.records };
  render();
  expect(container.querySelector('select').selectedOptions[0].textContent).toBe('Concept2 PM5 · Distance row');
  expect(container.querySelectorAll('.crew-board-row')).toHaveLength(1);
  expect(container.querySelector('.crew-board-row').textContent).toContain('Amir');
  expect(container.querySelector('h2').textContent).toBe('Morning crew');
});

test('empty weekly and awards boards describe their actual state instead of inventing activity', () => {
  context.leaderboardTab = 'weekly';
  context.getWeeklyLeaderboard = [];
  render();
  expect(container.textContent).toContain('The first eligible row this week will appear here');
  expect(container.querySelectorAll('.crew-board-row')).toHaveLength(0);
  act(() => Simulate.click(button('Awards')));
  expect(container.textContent).toContain('Room for the first badge');
});
