import React, { act } from 'react';
import { createRoot } from 'react-dom/client';
import { Simulate } from 'react-dom/test-utils';
import { WORLD_METERS } from '../constants/crewJourney';
import { getCrewJourney } from '../utils/crewJourney';
import WorldJourneyHero from './WorldJourneyHero';

let container, root;
beforeEach(() => {
  global.IS_REACT_ACT_ENVIRONMENT = true;
  container = document.createElement('div');
  document.body.appendChild(container);
  root = createRoot(container);
});
afterEach(() => {
  act(() => root.unmount());
  container.remove();
});
const render = (totalMeters, onOpen = jest.fn()) => act(() => root.render(<WorldJourneyHero totalMeters={totalMeters} onOpen={onOpen} />));
const progress = () => container.querySelector('[role="progressbar"]');

test('crew distance, world percentage and destination agree with the full map', () => {
  render(675000);
  const journey = getCrewJourney(675000);
  expect(container.querySelector('.world-journey-distance strong').textContent).toBe('675');
  expect(container.textContent).toContain('40,075 km goal');
  expect(container.textContent).toContain('1.68% around the world');
  expect(Number(progress().getAttribute('aria-valuenow'))).toBe(journey.progressPct);
  expect(container.querySelector('.world-journey-destination').textContent).toContain('San Francisco325 km to go');
  expect(container.querySelector('.world-journey-milestone').textContent).toContain('750 km75 km away');
});

test('a crew starting at 29 kilometers sees 0.07 percent, with a proportionate progress bar', () => {
  render(29000);
  expect(container.textContent).toContain('0.07% around the world');
  expect(container.querySelector('.world-journey-distance strong').textContent).toBe('29');
  expect(parseFloat(progress().firstElementChild.style.width)).toBeCloseTo(29000 / WORLD_METERS * 100);
  render(100);
  expect(container.textContent).toContain('<0.01% around the world');
  expect(progress().getAttribute('aria-valuetext')).toContain('less than 0.01 percent');
});

test('invalid totals start at zero, and a last-meter gap never claims completion', () => {
  [undefined, null, NaN, Infinity, -500].forEach(total => {
    render(total);
    expect(container.querySelector('.world-journey-distance strong').textContent).toBe('0');
    expect(container.textContent).toContain('0.00% around the world');
    expect(container.querySelector('.world-journey-destination').textContent).toContain('Portland350 km to go');
    expect(container.textContent).not.toMatch(/NaN|Infinity|complete/);
  });
  render(WORLD_METERS - 1);
  expect(container.textContent).toContain('>99.99% around the world');
  expect(container.querySelector('.world-journey-distance strong').textContent).toBe('40,074.999');
  expect(container.querySelector('.world-journey-destination').textContent).toContain('0.001 km to go');
  expect(container.textContent).not.toContain('World tour complete');
});

test('a completed world tour retains extra distance while capping progress', () => {
  render(WORLD_METERS + 125000);
  expect(container.querySelector('.world-journey-distance strong').textContent).toBe('40,200');
  expect(progress().getAttribute('aria-valuenow')).toBe('100');
  expect(progress().firstElementChild.style.width).toBe('100%');
  expect(container.textContent).toContain('World tour complete');
  expect(container.textContent).toContain('Home in Seattle');
  expect(container.querySelector('.world-journey-milestone')).toBeNull();
});

test('live destination crossings update immediately and map opens only on the native button', () => {
  const open = jest.fn();
  render(999999, open);
  expect(container.querySelector('.world-journey-destination').textContent).toContain('San Francisco');
  render(1000000, open);
  expect(container.querySelector('.world-journey-destination').textContent).toContain('Los Angeles500 km to go');
  expect(open).not.toHaveBeenCalled();
  const button = container.querySelector('button');
  expect(button.textContent).toBe('Explore map');
  button.focus();
  expect(document.activeElement).toBe(button);
  act(() => button.click());
  expect(open).toHaveBeenCalledTimes(1);
});

test('the globe is decorative and unavailable artwork does not obscure real progress or the action', () => {
  const open = jest.fn();
  render(29000, open);
  const image = container.querySelector('img');
  expect(image.alt).toBe('');
  expect(image.parentElement.getAttribute('aria-hidden')).toBe('true');
  act(() => Simulate.error(image));
  expect(container.querySelector('img')).toBeNull();
  expect(progress().getAttribute('aria-valuetext')).toContain('29 kilometers rowed together');
  act(() => container.querySelector('button').click());
  expect(open).toHaveBeenCalledTimes(1);
});
