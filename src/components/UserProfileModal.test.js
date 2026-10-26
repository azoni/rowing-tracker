import React, { act } from 'react';
import { createRoot } from 'react-dom/client';
import { Simulate } from 'react-dom/test-utils';
import { useApp } from '../context/AppContext';
import { ACHIEVEMENTS } from '../constants';
import UserProfileModal from './UserProfileModal';

jest.mock('../context/AppContext', () => ({ useApp: jest.fn() }));
jest.mock('./Avatar', () => ({ user }) => <span data-profile-avatar={user.photoURL} aria-hidden="true" />);

let container;
let root;
let context;
let trigger;
const firstRow = ACHIEVEMENTS.find(achievement => achievement.id === 'first_row');
const render = () => act(() => root.render(<UserProfileModal />));
const click = node => act(() => Simulate.click(node));
const key = (value, options = {}) => act(() => document.dispatchEvent(new KeyboardEvent('keydown', { key: value, bubbles: true, cancelable: true, ...options })));
const closeButton = () => container.querySelector('[aria-label="Close rower profile"]');

beforeEach(() => {
  global.IS_REACT_ACT_ENVIRONMENT = true;
  trigger = document.createElement('button');
  trigger.textContent = 'View rower';
  document.body.appendChild(trigger);
  trigger.focus();
  container = document.createElement('div');
  document.body.appendChild(container);
  root = createRoot(container);
  const cached = { id: 'me', name: 'Old profile name', totalMeters: 999999, uploadCount: 999, totalTime: 999999, totalCalories: 999999 };
  context = {
    showUserProfileModal: cached, setShowUserProfileModal: jest.fn(), users: { me: cached }, entries: [],
    metricUsers: { me: { id: 'me', name: 'Current profile name', username: 'rower', photoURL: '/current-photo.jpg',
      totalMeters: 5000, uploadCount: 2, totalTime: 900, totalCalories: 40 } },
    getUserAchievements: jest.fn(() => [{ ...firstRow, unlockedDate: null }]),
    calculateLongestStreak: jest.fn(() => 3), getPersonalRecord: jest.fn(() => 3000),
    getTotalDaysRowed: jest.fn(() => 2), getFirstRowDate: jest.fn(() => new Date(2026, 9, 1)),
    calculateStreak: jest.fn(() => 1), calculateWeeklyAverage: jest.fn(() => 1.5),
  };
  useApp.mockImplementation(() => context);
});

afterEach(() => {
  act(() => root.unmount());
  container.remove();
  trigger.remove();
  document.body.style.overflow = '';
  jest.clearAllMocks();
});

test('selected profile uses current derived totals and metadata instead of cached counters', () => {
  render();
  expect([...container.querySelectorAll('.profile-stat-value')].map(node => node.textContent)).toEqual(['5.0k', '2', '3.0k', '3']);
  expect(container.querySelector('.profile-modal-rank').textContent).toContain('Deckhand');
  expect([...container.querySelectorAll('.profile-extra-value')].map(node => node.textContent)).toEqual(['15:00', '40']);
  expect(container.querySelector('.profile-secondary-stats').textContent).toContain('2.5km');
  expect(container.querySelector('.profile-secondary-stats').textContent).toContain('Rowing sinceOct 2026');
  expect(container.textContent).not.toContain('Member Since');
  expect(container.querySelector('#user-profile-title').textContent).toBe('Current profile name');
  expect(container.querySelector('[data-profile-avatar]').dataset.profileAvatar).toBe('/current-photo.jpg');
  expect(container.textContent).not.toMatch(/999,999|999999|1000\.0k|Old profile name/);
  expect(context.showUserProfileModal.totalMeters).toBe(999999);
  expect(context.getPersonalRecord).toHaveBeenCalledWith('me');
});

test('an open profile follows derived data updates without moving focus or trusting a stored id', () => {
  render();
  const summary = container.querySelector('.profile-badges-remaining summary');
  summary.focus();
  context.metricUsers = { me: { ...context.metricUsers.me, id: 'wrong-stored-id', totalMeters: 7000, uploadCount: 3, totalTime: 1200 } };
  render();
  expect(container.querySelector('.profile-stat-value').textContent).toBe('7.0k');
  expect(container.querySelector('.profile-extra-value').textContent).toBe('20:00');
  expect(document.activeElement).toBe(summary);
  expect(document.body.style.overflow).toBe('hidden');
  expect(context.getUserAchievements).toHaveBeenLastCalledWith('me');
});

test.each([{}, null])('an available metrics context never falls back to a missing cached rower (%s)', metricUsers => {
  context.metricUsers = metricUsers;
  render();
  expect(container.querySelector('#user-profile-title').textContent).toBe('Profile unavailable');
  expect(container.querySelector('.profile-stats-grid')).toBeNull();
  expect(context.getUserAchievements).not.toHaveBeenCalled();
  expect(container.textContent).not.toContain('Old profile name');
  expect(document.activeElement).toBe(closeButton());
});

test('a legacy context without the derived map still renders its selected profile', () => {
  delete context.metricUsers;
  context.showUserProfileModal = { ...context.showUserProfileModal, totalMeters: 1234 };
  render();
  expect(container.querySelector('.profile-stat-value').textContent).toBe('1.2k');
  expect(container.querySelector('#user-profile-title').textContent).toBe('Old profile name');
});

test('profile dialog labels itself, traps focus including its disclosure, and restores the opener and scroll state', () => {
  document.body.style.overflow = 'scroll';
  render();
  const dialog = container.querySelector('[role="dialog"]');
  const summary = container.querySelector('.profile-badges-remaining summary');
  expect(dialog.getAttribute('aria-modal')).toBe('true');
  expect(document.getElementById(dialog.getAttribute('aria-labelledby')).textContent).toBe('Current profile name');
  expect(document.activeElement).toBe(closeButton());
  expect(document.body.style.overflow).toBe('hidden');
  key('Tab', { shiftKey: true });
  expect(document.activeElement).toBe(summary);
  key('Tab');
  expect(document.activeElement).toBe(closeButton());
  trigger.focus();
  key('Tab', { shiftKey: true });
  expect(document.activeElement).toBe(summary);
  key('Escape');
  expect(context.setShowUserProfileModal).toHaveBeenCalledWith(null);
  context.showUserProfileModal = null;
  render();
  expect(document.activeElement).toBe(trigger);
  expect(document.body.style.overflow).toBe('scroll');
  expect(container.querySelector('[role="dialog"]')).toBeNull();
});

test('a closed profile leaves the page alone and restores an existing scroll lock after closing', () => {
  context.showUserProfileModal = null;
  document.body.style.overflow = 'hidden';
  render();
  key('Escape');
  expect(context.setShowUserProfileModal).not.toHaveBeenCalled();
  expect(document.activeElement).toBe(trigger);
  context.showUserProfileModal = context.users.me;
  render();
  context.showUserProfileModal = null;
  render();
  expect(document.body.style.overflow).toBe('hidden');
  expect(document.activeElement).toBe(trigger);
});

test('profile content does not dismiss it, while its labelled close button and backdrop do', () => {
  render();
  click(container.querySelector('.profile-stats-grid'));
  expect(context.setShowUserProfileModal).not.toHaveBeenCalled();
  click(closeButton());
  click(container.querySelector('.modal-overlay'));
  expect(context.setShowUserProfileModal.mock.calls).toEqual([[null], [null]]);
});
