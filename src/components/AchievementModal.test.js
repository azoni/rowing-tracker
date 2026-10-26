import React, { act } from 'react';
import { createRoot } from 'react-dom/client';
import { Simulate } from 'react-dom/test-utils';
import { useApp } from '../context/AppContext';
import { ACHIEVEMENTS } from '../constants';
import { AchievementModal } from './SmallModals';

jest.mock('../context/AppContext', () => ({ useApp: jest.fn() }));
jest.mock('./Icon', () => () => <span aria-hidden="true" />);
jest.mock('./BadgeArtwork', () => ({ achievement, size }) => <span data-medal={achievement.id} data-category={achievement.category} data-size={size} aria-hidden="true" />);

const marathon = ACHIEVEMENTS.find(achievement => achievement.id === 'marathon');
let container;
let root;
let context;
const render = () => act(() => root.render(<AchievementModal />));
const key = (value, options = {}) => act(() => document.dispatchEvent(new KeyboardEvent('keydown', { key: value, bubbles: true, cancelable: true, ...options })));

beforeEach(() => {
  global.IS_REACT_ACT_ENVIRONMENT = true;
  container = document.createElement('div');
  document.body.appendChild(container);
  root = createRoot(container);
  context = {
    currentUser: { uid: 'me' },
    showAchievementModal: { ...marathon, progress: { current: 40000, target: 42195 } },
    setShowAchievementModal: jest.fn(),
    getUserAchievements: jest.fn(() => []),
    getAchievementProgress: jest.fn(() => ({ current: 0, target: 42195 })),
  };
  useApp.mockImplementation(() => context);
});

afterEach(() => {
  act(() => root.unmount());
  container.remove();
  jest.clearAllMocks();
});

test('shows the selected medal, qualifying rule and real progress without claiming an unlock', () => {
  render();
  const dialog = container.querySelector('[role="dialog"]');
  expect(dialog.getAttribute('aria-labelledby')).toBe('achievement-title');
  expect(container.querySelector('#achievement-title').textContent).toBe(marathon.name);
  expect(container.querySelector('#achievement-description').textContent).toBe(marathon.desc);
  expect(container.querySelector('[data-medal]').dataset).toEqual(expect.objectContaining({ medal: marathon.id, category: 'distance', size: '156' }));
  expect(container.querySelector('.achievement-progress-heading').textContent).toBe('Your progress94%');
  expect(container.querySelector('.achievement-modal-progress-text').textContent).toBe('40.0km / 42.2km');
  expect(container.querySelector('.achievement-earned-detail')).toBeNull();
  expect(context.getAchievementProgress).not.toHaveBeenCalled();
});

test('preserves a saved award and its Firestore date without inventing current progress', () => {
  context.getUserAchievements.mockReturnValue([{ id: marathon.id, unlockedDate: { toDate: () => new Date('2026-10-01T12:00:00.000Z') } }]);
  context.showAchievementModal.progress = { current: 0, target: 42195 };
  render();
  expect(container.querySelector('.achievement-earned-detail').textContent.trim()).toBe('In your collectionEarned Oct 1, 2026');
  expect(container.querySelector('.achievement-modal-progress')).toBeNull();
});

test('keeps an earned badge with an unknown date and does not render an invalid date', () => {
  context.getUserAchievements.mockReturnValue([{ id: marathon.id, unlockedDate: 'unknown' }]);
  render();
  expect(container.querySelector('.achievement-earned-detail').textContent.trim()).toBe('In your collection');
  expect(container.querySelector('.achievement-modal-date')).toBeNull();
  expect(container.textContent).not.toContain('Invalid Date');
});

test('guests see the artwork and criterion without a fabricated personal progress meter', () => {
  context.currentUser = null;
  render();
  expect(container.querySelector('[data-medal]').dataset.medal).toBe(marathon.id);
  expect(container.querySelector('#achievement-description').textContent).toBe(marathon.desc);
  expect(container.querySelector('.achievement-modal-progress')).toBeNull();
  expect(container.querySelector('.achievement-earned-detail')).toBeNull();
  expect(context.getUserAchievements).not.toHaveBeenCalled();
  expect(context.getAchievementProgress).not.toHaveBeenCalled();
});

test('keeps keyboard focus in the detail, dismisses with Escape and restores the opening control', () => {
  const opener = document.createElement('button');
  document.body.appendChild(opener);
  opener.focus();
  render();
  const close = container.querySelector('[aria-label="Close achievement details"]');
  const done = container.querySelector('.achievement-modal-close-btn');
  expect(document.activeElement).toBe(close);
  key('Tab', { shiftKey: true });
  expect(document.activeElement).toBe(done);
  key('Tab');
  expect(document.activeElement).toBe(close);
  key('Escape');
  expect(context.setShowAchievementModal).toHaveBeenLastCalledWith(null);
  context.showAchievementModal = null;
  render();
  expect(document.activeElement).toBe(opener);
  expect(container.querySelector('[role="dialog"]')).toBeNull();
  opener.remove();
});

test('clicking the medal does not dismiss the detail while both close controls and the backdrop do', () => {
  render();
  act(() => Simulate.click(container.querySelector('[data-medal]')));
  expect(context.setShowAchievementModal).not.toHaveBeenCalled();
  act(() => Simulate.click(container.querySelector('[aria-label="Close achievement details"]')));
  act(() => Simulate.click(container.querySelector('.achievement-modal-close-btn')));
  act(() => Simulate.click(container.querySelector('.achievement-showcase-overlay')));
  expect(context.setShowAchievementModal.mock.calls).toEqual([[null], [null], [null]]);
});
