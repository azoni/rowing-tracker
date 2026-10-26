import React, { act } from 'react';
import { createRoot } from 'react-dom/client';
import { Simulate } from 'react-dom/test-utils';
import { useApp } from '../context/AppContext';
import { ACHIEVEMENTS } from '../constants';
import StatsTab from './StatsTab';

jest.mock('../context/AppContext', () => ({ useApp: jest.fn() }));
jest.mock('./Icon', () => () => <span aria-hidden="true" />);

let container;
let root;
let context;
const now = new Date(2026, 9, 16, 12);
const firstRow = ACHIEVEMENTS.find(achievement => achievement.id === 'first_row');
const marathon = ACHIEVEMENTS.find(achievement => achievement.id === 'marathon');
const render = () => act(() => root.render(<StatsTab />));
const button = text => [...container.querySelectorAll('button')].find(element => element.textContent === text);
const cards = () => [...container.querySelectorAll('.progress-badge-card')];

beforeEach(() => {
  global.IS_REACT_ACT_ENVIRONMENT = true;
  jest.useFakeTimers().setSystemTime(now);
  container = document.createElement('div');
  document.body.appendChild(container);
  root = createRoot(container);
  context = {
    currentUser: { uid: 'me' }, isAdmin: false, entries: [],
    getUserAchievements: jest.fn(() => [{ ...firstRow, unlockedDate: '2026-10-01T12:00:00.000Z' }]),
    getAchievementProgress: jest.fn((userId, achievement) => achievement.id === 'marathon'
      ? { current: 40000, target: 42195 } : { current: 0, target: 100 }),
    setShowAchievementModal: jest.fn(), setShowSessionHistory: jest.fn(),
    setShowRankProgressModal: jest.fn(), setShowSettingsModal: jest.fn(),
    setShowAdminPanel: jest.fn(), loadPendingReviews: jest.fn(),
    handleSignOut: jest.fn(), handleSignIn: jest.fn(), setShowLogModal: jest.fn(),
  };
  useApp.mockImplementation(() => context);
});

afterEach(() => {
  act(() => root.unmount());
  container.remove();
  jest.useRealTimers();
  jest.clearAllMocks();
});

test('keeps next and earned badges distinct and opens the existing achievement detail with real progress', () => {
  render();
  expect(button('Next up').getAttribute('aria-pressed')).toBe('true');
  expect(cards()[0].textContent).toContain('Marathon Rower');
  expect(cards().some(card => card.textContent.includes('First Strokes'))).toBe(false);
  act(() => Simulate.click(cards()[0]));
  expect(context.setShowAchievementModal).toHaveBeenLastCalledWith({
    ...marathon, progress: { current: 40000, target: 42195 }, unlockedDate: undefined,
  });
  act(() => Simulate.click(button('Earned')));
  expect(cards()).toHaveLength(1);
  expect(cards()[0].textContent).toContain('First Strokes');
  expect(cards()[0].textContent).toContain('Oct 1, 2026');
  act(() => Simulate.click(container.querySelector('.progress-latest-earned')));
  expect(context.setShowAchievementModal).toHaveBeenLastCalledWith(expect.objectContaining({
    id: 'first_row', unlockedDate: '2026-10-01T12:00:00.000Z',
  }));
});

test('search and category combine, reset pagination, and recover from no matches without changing earned state', () => {
  render();
  act(() => Simulate.click(container.querySelector('[aria-label="Next achievements"]')));
  expect(container.querySelector('.progress-pagination > span').textContent).toMatch(/^2 of /);
  const input = container.querySelector('input[type="search"]');
  act(() => Simulate.change(input, { target: { value: '  MARATHON ROWER  ' } }));
  expect(cards()).toHaveLength(1);
  expect(cards()[0].textContent).toContain('Marathon Rower');
  expect(container.querySelector('.progress-library-summary').textContent).toContain('1 badge to work toward');
  act(() => Simulate.change(container.querySelector('.progress-category select'), { target: { value: 'calories' } }));
  expect(cards()).toHaveLength(0);
  expect(container.querySelector('.progress-no-badges').textContent).toContain('No badges match these filters');
  act(() => Simulate.click(button('Clear filters')));
  expect(input.value).toBe('');
  expect(container.querySelector('.progress-category select').value).toBe('all');
  expect(container.querySelector('.progress-pagination > span').textContent).toMatch(/^1 of /);
  expect(button('Next up').getAttribute('aria-pressed')).toBe('true');
  expect(cards()[0].textContent).toContain('Marathon Rower');
  expect(context.setShowAchievementModal).not.toHaveBeenCalled();
});

test('filters badge levels and can search the qualifying rule rather than only the title', () => {
  render();
  act(() => Simulate.click(button('All badges')));
  act(() => Simulate.change(container.querySelector('.progress-category select'), { target: { value: 'level:stretch' } }));
  expect(cards().length).toBeGreaterThan(0);
  expect(cards().every(card => card.querySelector('.badge-difficulty')?.textContent === 'stretch')).toBe(true);
  act(() => Simulate.click(button('Clear filters')));
  act(() => Simulate.change(container.querySelector('input'), { target: { value: '42,195m across' } }));
  expect(cards()).toHaveLength(1);
  expect(cards()[0].textContent).toContain('Marathon Rower');
});

test('lifetime overview excludes pending, test and future rows and identifies incomplete recorded time', () => {
  const row = extra => ({ userId: 'me', meters: 1000, time: 300, date: '2026-10-01T12:00:00.000Z', ...extra });
  context.entries = [row({}), row({ time: null }), row({ verificationStatus: 'pending_review' }), row({ isTest: true }), row({ date: '2027-01-01' })];
  render();
  expect(container.querySelector('.progress-total strong').textContent).toBe('2.0km');
  expect(container.querySelector('.progress-total').textContent).toContain('2 rows in the books');
  expect(container.querySelector('.progress-overview-secondary').textContent).toContain('1 of 2 rows have a time');
  expect(container.querySelector('.analytics-coverage').textContent).toContain('1 of 2 rows');
});

test('guests can explore and search badges without fabricated personal progress or account actions', () => {
  context.currentUser = null;
  render();
  expect(container.querySelector('.rowing-analytics')).toBeNull();
  expect(container.querySelector('.progress-latest-earned')).toBeNull();
  expect(container.querySelector('.progress-account')).toBeNull();
  expect(container.querySelector('.progress-badge-numbers')).toBeNull();
  expect(context.getUserAchievements).not.toHaveBeenCalled();
  expect(context.getAchievementProgress).not.toHaveBeenCalled();
  act(() => Simulate.change(container.querySelector('input'), { target: { value: 'Marathon Rower' } }));
  expect(cards()).toHaveLength(1);
  act(() => Simulate.click(button('Sign in to track your rows')));
  expect(context.handleSignIn).toHaveBeenCalledTimes(1);
});

test('older earned badges without a saved date are not presented as the latest unlock', () => {
  context.getUserAchievements.mockReturnValue([{ ...firstRow, unlockedDate: null }]);
  render();
  expect(container.querySelector('.progress-latest-earned small').textContent).toBe('In your collection');
  act(() => Simulate.click(button('Earned')));
  expect(cards()[0].querySelector('.progress-badge-earned').textContent.trim()).toBe('Earned');
  expect(container.textContent).not.toContain('Invalid Date');
});
