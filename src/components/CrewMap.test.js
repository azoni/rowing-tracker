import React, { act } from 'react';
import { createRoot } from 'react-dom/client';
import { Simulate } from 'react-dom/test-utils';
import { useApp } from '../context/AppContext';
import { WORLD_METERS } from '../constants/crewJourney';
import CrewMap from './CrewMap';

jest.mock('../context/AppContext', () => ({ useApp: jest.fn() }));

let container;
let root;
let context;
let trigger;

beforeEach(() => {
  global.IS_REACT_ACT_ENVIRONMENT = true;
  trigger = document.createElement('button');
  trigger.textContent = 'Open crew map';
  document.body.appendChild(trigger);
  trigger.focus();
  container = document.createElement('div');
  document.body.appendChild(container);
  root = createRoot(container);
  context = {
    showCrewMap: true, setShowCrewMap: jest.fn(), totalMeters: 675000,
    currentUser: { uid: 'alex' }, setShowLogModal: jest.fn(), handleSignIn: jest.fn(),
    users: { alex: { id: 'alex', name: 'Alex Rower', totalMeters: 500000 },
      sam: { id: 'sam', name: 'Sam Rower', totalMeters: 175000 } },
  };
  useApp.mockImplementation(() => context);
});

afterEach(() => {
  act(() => root.unmount());
  container.remove();
  trigger.remove();
  document.body.style.overflow = '';
  jest.restoreAllMocks();
});

const render = () => act(() => root.render(<CrewMap />));
const button = text => Array.from(container.querySelectorAll('button')).find(node => node.textContent.includes(text));
const labelled = label => container.querySelector(`[aria-label="${label}"]`);
const click = node => act(() => Simulate.click(node));
const key = (keyValue, options = {}) => act(() => document.dispatchEvent(new KeyboardEvent('keydown', { key: keyValue, bubbles: true, ...options })));
const viewBox = () => container.querySelector('.exp-atlas').getAttribute('viewBox').split(' ').map(Number);

test('the closed map leaves focus and page scrolling alone', () => {
  context.showCrewMap = false;
  document.body.style.overflow = 'scroll';
  render();
  expect(container.querySelector('[role="dialog"]')).toBeNull();
  expect(document.activeElement).toBe(trigger);
  expect(document.body.style.overflow).toBe('scroll');
  key('Escape');
  expect(context.setShowCrewMap).not.toHaveBeenCalled();
});

test('the modal labels itself, traps keyboard focus, and restores its opener and scroll state', () => {
  document.body.style.overflow = 'scroll';
  render();
  const dialog = container.querySelector('[role="dialog"]');
  const close = labelled('Close crew map');
  expect(dialog.getAttribute('aria-modal')).toBe('true');
  expect(document.getElementById(dialog.getAttribute('aria-labelledby')).textContent).toBe('A world to row.');
  expect(document.activeElement).toBe(close);
  expect(document.body.style.overflow).toBe('hidden');
  key('Tab', { shiftKey: true });
  expect(document.activeElement).toBe(button('Add a row'));
  key('Tab');
  expect(document.activeElement).toBe(close);
  trigger.focus();
  key('Tab', { shiftKey: true });
  expect(document.activeElement).toBe(button('Add a row'));
  key('Escape');
  expect(context.setShowCrewMap).toHaveBeenCalledWith(false);
  context.showCrewMap = false;
  render();
  expect(document.body.style.overflow).toBe('scroll');
  expect(document.activeElement).toBe(trigger);
});

test('backdrop dismisses the modal but interacting with its content does not', () => {
  render();
  click(container.querySelector('.exp-destination'));
  expect(context.setShowCrewMap).not.toHaveBeenCalled();
  click(container.querySelector('.exp-overlay'));
  expect(context.setShowCrewMap).toHaveBeenCalledWith(false);
});

test('passport destinations navigate the map and returning to the boat restores the current leg', () => {
  render();
  expect(container.querySelector('.exp-destination h3').textContent).toBe('San Francisco');
  expect(container.querySelector('progress').value).toBe(0.5);
  click(button('Passport'));
  expect(button('Passport').getAttribute('aria-pressed')).toBe('true');
  expect(container.querySelectorAll('.exp-passport-stop')).toHaveLength(21);
  const tokyo = button('Tokyo');
  tokyo.focus();
  click(tokyo);
  expect(button('Explore').getAttribute('aria-pressed')).toBe('true');
  expect(container.querySelector('.exp-destination h3').textContent).toBe('Tokyo');
  expect(container.querySelector('.exp-destination-progress').textContent).toContain('6,325 km');
  expect(viewBox().every(Number.isFinite)).toBe(true);
  key('Tab');
  expect(container.querySelector('[role="dialog"]').contains(document.activeElement)).toBe(true);
  click(button('Previous stop'));
  expect(container.querySelector('.exp-destination h3').textContent).toBe('Midway Atoll');
  click(button('Our boat'));
  expect(container.querySelector('.exp-destination h3').textContent).toBe('San Francisco');
  expect(button('Our boat').getAttribute('aria-pressed')).toBe('true');
});

test('a reopened map starts at the current crew leg rather than a previously browsed destination or tab', () => {
  render();
  click(button('Passport'));
  click(button('Tokyo'));
  click(button('The crew'));
  click(labelled('Close crew map'));
  context.showCrewMap = false;
  render();
  context.showCrewMap = true;
  render();
  expect(button('Explore').getAttribute('aria-pressed')).toBe('true');
  expect(container.querySelector('.exp-destination h3').textContent).toBe('San Francisco');
  expect(button('Our boat').getAttribute('aria-pressed')).toBe('true');
});

test('live distance updates advance the current leg without replacing a destination being explored', () => {
  context.totalMeters = 999999;
  render();
  expect(container.querySelector('.exp-destination h3').textContent).toBe('San Francisco');
  context.totalMeters = 1000000;
  render();
  expect(container.querySelector('.exp-destination h3').textContent).toBe('Los Angeles');
  expect(container.querySelector('.exp-map-toolbar').textContent).toContain('San Francisco → Los Angeles');
  expect(container.querySelector('progress').value).toBe(0);
  click(button('Passport'));
  click(button('Tokyo'));
  context.totalMeters = 1500000;
  render();
  expect(container.querySelector('.exp-destination h3').textContent).toBe('Tokyo');
  expect(container.querySelector('.exp-map-toolbar').textContent).toContain('Los Angeles → Honolulu');
  click(button('Our boat'));
  expect(container.querySelector('.exp-destination h3').textContent).toBe('Honolulu');
  expect(container.querySelector('progress').value).toBe(0);
  expect(document.body.style.overflow).toBe('hidden');
});

test('crew recognition uses map IDs, valid lifetime distances, and a consistent contribution denominator', () => {
  context.users = {
    alex: { id: 'wrong-stored-id', name: 'Alex Rower', totalMeters: '500000' },
    sam: { name: 'Sam Rower', totalMeters: 175000 },
    invalid: { name: 'Invalid Rower', totalMeters: 'bad' },
    infinite: { name: 'Infinite Rower', totalMeters: Infinity },
    negative: { name: 'Negative Rower', totalMeters: -1 },
    empty: null,
  };
  context.selectedGroupId = 'private-group';
  render();
  click(button('The crew'));
  expect(container.querySelectorAll('.exp-member')).toHaveLength(2);
  expect(container.querySelector('.exp-member.is-you').textContent).toContain('Alex Rower (you)');
  expect(container.querySelector('.exp-own-share').textContent).toContain('74.1%');
  expect(container.querySelector('.exp-crew').textContent).toContain('whole crew');
  expect(container.querySelector('.exp-member-distance').textContent).toContain('500 km');
  expect(container.textContent).not.toMatch(/NaN|Infinity|Invalid Rower|Negative Rower/);
});

test('guests join through sign-in and existing members open the existing row logger', () => {
  context.currentUser = null;
  render();
  click(button('Join the crew'));
  expect(context.setShowCrewMap).toHaveBeenCalledWith(false);
  expect(context.handleSignIn).toHaveBeenCalledTimes(1);
  expect(context.setShowLogModal).not.toHaveBeenCalled();
  context.currentUser = { uid: 'alex' };
  render();
  click(button('Add a row'));
  expect(context.setShowLogModal).toHaveBeenCalledWith(true);
  expect(context.handleSignIn).toHaveBeenCalledTimes(1);
});

test.each([0, -100, Infinity, 'bad'])('an empty crew safely starts in Seattle with total %s', totalMeters => {
  context.totalMeters = totalMeters;
  context.users = {};
  render();
  expect(container.querySelector('.exp-summary').textContent).toContain('0 km');
  expect(container.querySelector('.exp-map-toolbar').textContent).toContain('Seattle → Portland');
  expect(container.querySelector('.exp-destination h3').textContent).toBe('Portland');
  expect(container.querySelector('progress').value).toBe(0);
  expect(viewBox().every(Number.isFinite)).toBe(true);
  expect(container.textContent).not.toMatch(/NaN|Infinity/);
  click(button('The crew'));
  expect(container.querySelector('.exp-empty').textContent).toContain('first saved row');
  expect(container.querySelector('.exp-own-share')).toBeNull();
});

test.each([WORLD_METERS, WORLD_METERS + 100000])('a completed expedition keeps extra meters without negative remaining distance (%s)', totalMeters => {
  context.totalMeters = totalMeters;
  render();
  expect(container.querySelector('.exp-map-toolbar').textContent).toContain('EXPEDITION COMPLETE');
  expect(container.querySelector('.exp-summary').textContent).toContain('100.0%');
  expect(container.querySelector('.exp-destination h3').textContent).toContain('Seattle');
  expect(button('Next stop').disabled).toBe(true);
  expect(container.querySelector('.exp-footer').textContent).toContain('The world is in your passport');
  expect(container.querySelector('progress')).toBeNull();
  expect(viewBox().every(Number.isFinite)).toBe(true);
});

test('world reset and bounded zoom keep the map usable after exploration', () => {
  render();
  click(button('World'));
  const worldView = viewBox();
  expect(worldView[2]).toBeCloseTo(1000);
  expect(labelled('Zoom out').disabled).toBe(true);
  click(labelled('Zoom in'));
  expect(viewBox()[2]).toBeLessThan(worldView[2]);
  for (let step = 0; step < 8; step += 1) click(labelled('Zoom in'));
  expect(labelled('Zoom in').disabled).toBe(true);
  expect(viewBox()[2]).toBeCloseTo(1000 / 12);
  click(button('World'));
  expect(viewBox()).toEqual(worldView);
  click(button('Our boat'));
  expect(viewBox()[2]).toBeLessThan(worldView[2]);
});

test('dragging moves the camera and pointer cancellation ends the gesture', () => {
  render();
  const atlas = container.querySelector('.exp-atlas');
  const before = viewBox();
  act(() => Simulate.pointerDown(atlas, { button: 0, pointerId: 1, clientX: 100, clientY: 100 }));
  act(() => Simulate.pointerMove(atlas, { pointerId: 1, clientX: 120, clientY: 110 }));
  expect(container.querySelector('.exp-map').classList.contains('is-dragging')).toBe(true);
  expect(viewBox()[0]).toBeLessThan(before[0]);
  expect(viewBox()[1]).toBeLessThan(before[1]);
  act(() => Simulate.pointerCancel(atlas, { pointerId: 1 }));
  expect(container.querySelector('.exp-map').classList.contains('is-dragging')).toBe(false);
  const after = viewBox();
  act(() => Simulate.pointerMove(atlas, { pointerId: 1, clientX: 200, clientY: 200 }));
  expect(viewBox()).toEqual(after);
});
