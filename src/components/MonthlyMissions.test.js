import React, { act } from 'react';
import { createRoot } from 'react-dom/client';
import { Simulate } from 'react-dom/test-utils';
import MonthlyMissions from './MonthlyMissions';
import { getPersonalMissions } from '../utils/rowingGoals';

jest.mock('./Icon', () => () => <span aria-hidden="true" />);

const month = new Date(2026, 10, 1);
const now = new Date(2026, 10, 20, 12);
const row = (day, meters = 1000, time = 600) => ({
  id: `row-${day}-${meters}`, userId: 'me', meters, time,
  date: new Date(2026, 10, day, 9).toISOString(), verificationStatus: 'unverified',
});
const starterRows = [row(1, 500, 300), row(2), row(3, 2000, 700)];
let container;
let root;
let onLog;

beforeEach(() => {
  global.IS_REACT_ACT_ENVIRONMENT = true;
  container = document.createElement('div');
  document.body.appendChild(container);
  root = createRoot(container);
  onLog = jest.fn();
});

afterEach(() => {
  act(() => root.unmount());
  container.remove();
});

const render = (entries = starterRows) => act(() => root.render(
  <MonthlyMissions missions={getPersonalMissions(entries, month, now)} onLog={onLog} />
));
const card = label => [...container.querySelectorAll('article')].find(element => element.querySelector('h3').textContent === label);
const level = (element, label) => [...element.querySelectorAll('button')].find(button => button.textContent.includes(label));
const click = element => act(() => Simulate.click(element));

test('opens the next incomplete level for each real mission and advances automatically when a new level is earned', () => {
  render();
  [...container.querySelectorAll('article')].forEach(element => {
    expect(level(element, 'Build').getAttribute('aria-pressed')).toBe('true');
    expect(level(element, 'Starter').classList.contains('is-earned')).toBe(true);
  });
  expect(card('Find Your Rhythm').querySelector('[role="progressbar"]').getAttribute('aria-valuenow')).toBe('2');
  render([...starterRows, ...[4, 5, 6, 7, 8, 9].map(day => row(day))]);
  expect(level(card('Find Your Rhythm'), 'Stretch').getAttribute('aria-pressed')).toBe('true');
  expect(level(card('Pace Notes'), 'Stretch').getAttribute('aria-pressed')).toBe('true');
  expect(level(card('Distance Passport'), 'Build').getAttribute('aria-pressed')).toBe('true');
});

test('reviewing Starter keeps earned progress visible and does not lose the harder levels', () => {
  render();
  const rhythm = card('Find Your Rhythm');
  click(level(rhythm, 'Starter'));
  expect(level(rhythm, 'Starter').getAttribute('aria-pressed')).toBe('true');
  expect(level(rhythm, 'Starter').classList.contains('is-earned')).toBe(true);
  expect(rhythm.querySelector('.mission-requirement').textContent).toBe('Row on 3 separate days this month.');
  expect(rhythm.querySelector('.mission-numbers').textContent).toContain('Starter earned');
  expect(rhythm.querySelector('[role="progressbar"]').getAttribute('aria-valuenow')).toBe('3');
  expect(rhythm.querySelector('[role="progressbar"]').getAttribute('aria-valuemax')).toBe('3');
  expect(rhythm.querySelectorAll('.mission-levels button')).toHaveLength(3);
  expect(container.querySelector('.missions-count').getAttribute('aria-label')).toBe('3 of 9 mission levels earned');
});

test('previewing Stretch changes the requirement, target, remaining work, and collected distance stamps', () => {
  render();
  const rhythm = card('Find Your Rhythm');
  click(level(rhythm, 'Stretch'));
  expect(rhythm.querySelector('.mission-requirement').textContent).toBe('Log a row of at least 1K on 12 different days this month.');
  expect(rhythm.querySelector('[role="progressbar"]').getAttribute('aria-valuenow')).toBe('2');
  expect(rhythm.querySelector('[role="progressbar"]').getAttribute('aria-valuemax')).toBe('12');
  expect(rhythm.querySelector('.mission-numbers').textContent).toContain('10 to go');
  const passport = card('Distance Passport');
  click(level(passport, 'Stretch'));
  expect(passport.querySelector('.mission-stamps').getAttribute('aria-label')).toBe('Stretch distance stamps');
  expect(passport.querySelectorAll('.mission-stamps > span')).toHaveLength(5);
  expect(passport.querySelectorAll('.mission-stamps > .collected')).toHaveLength(3);
  expect(passport.querySelector('[role="progressbar"]').getAttribute('aria-valuenow')).toBe('3');
  expect(passport.querySelector('[role="progressbar"]').getAttribute('aria-valuemax')).toBe('5');
  expect(level(passport, 'Starter').classList.contains('is-earned')).toBe(true);
});

test('counts nine available levels across the three missions and logs only after an explicit action', () => {
  render();
  expect(container.querySelector('.missions-count').getAttribute('aria-label')).toBe('3 of 9 mission levels earned');
  expect(onLog).not.toHaveBeenCalled();
  click([...container.querySelectorAll('button')].find(element => element.textContent.includes('Log a row')));
  expect(onLog).toHaveBeenCalledTimes(1);
  expect(container.querySelector('.missions-count').getAttribute('aria-label')).toBe('3 of 9 mission levels earned');
});

test('shows all nine levels earned and the finished state when the real criteria are complete', () => {
  const entries = [...Array.from({ length: 12 }, (_, index) => row(index + 1)),
    ...[500, 2000, 5000, 10000].map(meters => row(13, meters))];
  render(entries);
  expect(container.querySelector('.missions-count').getAttribute('aria-label')).toBe('9 of 9 mission levels earned');
  expect(container.textContent).toContain('Every level collected this month. Nicely rowed.');
  expect(container.querySelectorAll('.mission-levels .is-earned')).toHaveLength(9);
  expect(container.querySelector('.missions-footer button')).toBeNull();
  expect(onLog).not.toHaveBeenCalled();
});
