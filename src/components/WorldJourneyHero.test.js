import React, { act } from 'react';
import { createRoot } from 'react-dom/client';
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
  expect(container.querySelector('h2').textContent).toBe('Around the world');
  expect(container.textContent).toContain('1.68% of the world');
  expect(Number(progress().getAttribute('aria-valuenow'))).toBe(journey.progressPct);
  expect(container.querySelector('.world-journey-destination').textContent).toContain('San Francisco325 km to go');
  expect(container.querySelector('.world-journey-destination').textContent).toContain('Next: San Francisco');
  expect(container.textContent).not.toContain('Next crew milestone');
});

test('a crew starting at 29 kilometers sees 0.07 percent, with a proportionate progress bar', () => {
  render(29000);
  expect(container.textContent).toContain('0.07% of the world');
  expect(container.querySelector('.world-journey-distance strong').textContent).toBe('29');
  expect(parseFloat(progress().firstElementChild.style.width)).toBeCloseTo(29000 / WORLD_METERS * 100);
  render(100);
  expect(container.textContent).toContain('<0.01% of the world');
  expect(progress().getAttribute('aria-valuetext')).toContain('less than 0.01 percent');
});

test('invalid totals start at zero, and a last-meter gap never claims completion', () => {
  [undefined, null, NaN, Infinity, -500].forEach(total => {
    render(total);
    expect(container.querySelector('.world-journey-distance strong').textContent).toBe('0');
    expect(container.textContent).toContain('0.00% of the world');
    expect(container.querySelector('.world-journey-destination').textContent).toContain('Portland350 km to go');
    expect(container.textContent).not.toMatch(/NaN|Infinity|complete/);
  });
  render(WORLD_METERS - 1);
  expect(container.textContent).toContain('>99.99% of the world');
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

test('the lane is decorative: the shell sits at leg progress between the two ports, outside the accessibility tree', () => {
  const open = jest.fn();
  render(29000, open);
  const art = container.querySelector('.world-journey-art');
  expect(art.getAttribute('aria-hidden')).toBe('true');
  expect(container.querySelector('img')).toBeNull();
  expect(parseFloat(art.style.getPropertyValue('--leg'))).toBeCloseTo(getCrewJourney(29000).legProgress * 100);
  expect(container.querySelector('.world-journey-port.is-from').textContent).toBe('Seattle');
  expect(container.querySelector('.world-journey-port.is-to').textContent).toBe('Portland');
  expect(progress().getAttribute('aria-valuetext')).toContain('29 kilometers rowed together');
  act(() => container.querySelector('button').click());
  expect(open).toHaveBeenCalledTimes(1);
  render(-500, open);
  expect(container.querySelector('.world-journey-art').style.getPropertyValue('--leg')).toBe('0%');
});

test('who moved the boat gives five rowers their blade colour and sums the rest of the crew', () => {
  const crew = ['Alex Morgan', 'Sam Rivera', 'Jordan Lee', 'Priya Shah', 'Kim Ode', 'Lee Park', 'Ana Ruiz']
    .map((name, index) => ({ id: 'rower-' + index, name, meters: 7000 - index * 1000, color: '#59D2A4' }));
  act(() => root.render(<WorldJourneyHero totalMeters={28000} onOpen={jest.fn()} crew={crew} />));
  const strip = [...container.querySelectorAll('.world-journey-strip > span')];
  expect(strip.map(part => part.style.flexGrow)).toEqual(['7000', '6000', '5000', '4000', '3000', '3000']);
  expect(strip[5].className).toBe('is-rest');
  expect(container.querySelector('.world-journey-strip').getAttribute('aria-hidden')).toBe('true');
  const names = [...container.querySelectorAll('.world-journey-crew-name')].map(node => node.textContent);
  expect(names).toEqual(['Alex', 'Sam', 'Jordan', 'Priya', 'Kim', '2 more']);
  expect(container.querySelector('.world-journey-crew-list li').textContent).toBe('Alex7 km');
  expect(container.querySelector('.world-journey-crew-list li').style.getPropertyValue('--blade')).toBe('#59D2A4');
  expect(container.querySelector('.world-journey-crew-list .is-rest').textContent).toBe('2 more3 km');
});

test('the crew strip stays hidden until someone has eligible distance', () => {
  render(0);
  expect(container.querySelector('.world-journey-crew')).toBeNull();
  act(() => root.render(<WorldJourneyHero totalMeters={0} onOpen={jest.fn()} crew={[{ id: 'a', name: 'Alex', meters: 0, color: '#59D2A4' }]} />));
  expect(container.querySelector('.world-journey-crew')).toBeNull();
});
