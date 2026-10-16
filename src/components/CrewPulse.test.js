import React, { act } from 'react';
import { createRoot } from 'react-dom/client';
import { Simulate } from 'react-dom/test-utils';
import { useApp } from '../context/AppContext';
import CrewPulse from './CrewPulse';

jest.mock('../context/AppContext', () => ({ useApp: jest.fn() }));
jest.mock('./Avatar', () => () => <span aria-hidden="true">avatar</span>);

let container;
let root;
let context;
const now = new Date(2026, 9, 15, 12);
const row = (id, userId, meters = 1000) => ({ id, userId, meters, date: new Date(2026, 9, 14, 12).toISOString() });
const render = () => act(() => root.render(<CrewPulse />));
const button = text => [...container.querySelectorAll('button')].find(element => element.textContent.includes(text));

beforeEach(() => {
  global.IS_REACT_ACT_ENVIRONMENT = true;
  jest.useFakeTimers().setSystemTime(now);
  container = document.createElement('div');
  document.body.appendChild(container);
  root = createRoot(container);
  context = {
    entries: [row('actual-row-a', 'a'), row('actual-row-b', 'b', 2000), row('my-row', 'me', 3000)],
    users: { a: { name: 'Amir' }, b: { name: 'Bea' }, me: { name: 'Me' } },
    currentUser: { uid: 'me' }, selectedGroupId: null, getSelectedGroup: jest.fn(),
    getReactionCounts: jest.fn(() => ({})), hasUserReacted: jest.fn(() => false),
    toggleReaction: jest.fn().mockResolvedValue(undefined), setShowUserProfileModal: jest.fn(),
  };
  useApp.mockImplementation(() => context);
});

afterEach(() => {
  act(() => root.unmount());
  container.remove();
  jest.useRealTimers();
  jest.restoreAllMocks();
});

test('requires a deliberate click and sends kudos to the actual row ID; keeps that row selected so kudos can be undone', async () => {
  render();
  expect(context.toggleReaction).not.toHaveBeenCalled();
  await act(async () => Simulate.click(button('Give kudos')));
  expect(context.toggleReaction).toHaveBeenCalledWith('actual-row-a', '👏');
  context.hasUserReacted.mockImplementation(id => id === 'actual-row-a');
  context.getReactionCounts.mockImplementation(id => id === 'actual-row-a' ? { '👏': 1 } : {});
  render();
  expect(button('Cheered · Undo').getAttribute('aria-pressed')).toBe('true');
  expect(container.querySelector('.crew-pulse-spotlight-person strong').textContent).toBe('Amir');
  await act(async () => Simulate.click(button('Cheered · Undo')));
  expect(context.toggleReaction).toHaveBeenLastCalledWith('actual-row-a', '👏');
  expect(context.toggleReaction).toHaveBeenCalledTimes(2);
});

test('prevents repeated taps while saving, then allows another teammate spotlight', async () => {
  let finish;
  context.toggleReaction.mockImplementation(() => new Promise(resolve => { finish = resolve; }));
  render();
  act(() => Simulate.click(button('Give kudos')));
  expect(button('Saving').disabled).toBe(true);
  expect(button('Next row').disabled).toBe(true);
  await act(async () => finish());
  act(() => Simulate.click(button('Next row')));
  expect(container.querySelector('.crew-pulse-spotlight-person strong').textContent).toBe('Bea');
});

test('guests can read the goal and profiles, but cannot send reactions', () => {
  context.currentUser = null;
  render();
  expect(button('Give kudos').disabled).toBe(true);
  act(() => Simulate.click(button('Give kudos')));
  expect(context.toggleReaction).not.toHaveBeenCalled();
  expect(container.textContent).toContain('Sign in below to cheer on the crew.');
  act(() => Simulate.click(container.querySelector('.crew-pulse-spotlight-person')));
  expect(context.setShowUserProfileModal).toHaveBeenCalledWith({ id: 'a', name: 'Amir' });
});

test('recognizes every contributor and completed goal without raising it or inventing activity', () => {
  render();
  expect(container.textContent).toContain('Goal reached together, plus 1 km extra');
  expect(container.textContent).toContain('3 km from you');
  expect(container.querySelectorAll('.crew-pulse-contributor')).toHaveLength(3);
  expect(container.querySelector('[role="progressbar"]').getAttribute('aria-valuemax')).toBe('5000');
  context.entries = [];
  render();
  expect(container.querySelector('.crew-pulse-spotlight')).toBeNull();
  expect(container.querySelectorAll('.crew-pulse-contributor')).toHaveLength(0);
  expect(container.textContent).toContain('A fresh week.');
});

test('unknown selected group never displays global crew members or their rows', () => {
  context.selectedGroupId = 'still-loading';
  render();
  expect(container.querySelector('.crew-pulse-spotlight')).toBeNull();
  expect(container.querySelectorAll('.crew-pulse-contributor')).toHaveLength(0);
  expect(container.textContent).not.toContain('Amir');
});
