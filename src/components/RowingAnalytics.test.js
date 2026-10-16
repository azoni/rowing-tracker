import React, { act } from 'react';
import { createRoot } from 'react-dom/client';
import { Simulate } from 'react-dom/test-utils';
import RowingAnalytics from './RowingAnalytics';

let container;
let root;
const now = new Date(2026, 9, 16, 12);
const row = (month, day, extra = {}) => ({ userId: 'me', meters: 5000, time: 1500,
  date: new Date(2026, month - 1, day, 10).toISOString(), machineType: 'concept2_pm5', sessionType: 'distance', ...extra });

beforeEach(() => {
  global.IS_REACT_ACT_ENVIRONMENT = true;
  container = document.createElement('div');
  document.body.appendChild(container);
  root = createRoot(container);
});
afterEach(() => { act(() => root.unmount()); container.remove(); });
const render = entries => act(() => root.render(<RowingAnalytics entries={entries} userId="me" now={now} />));

test('keeps detailed analytics collapsed and changes totals and accessible chart data with the period', () => {
  render([row(10, 1), row(8, 1)]);
  expect(container.querySelector('.analytics-explore').open).toBe(false);
  expect(container.querySelector('.analytics-metric strong').textContent).toBe('5 km');
  const twelveWeeks = Array.from(container.querySelectorAll('.analytics-period button')).find(button => button.textContent === '12 weeks');
  act(() => Simulate.click(twelveWeeks));
  expect(twelveWeeks.getAttribute('aria-pressed')).toBe('true');
  expect(container.querySelector('.analytics-metric strong').textContent).toBe('10 km');
  expect(container.querySelectorAll('.analytics-week')).toHaveLength(12);
  expect(container.querySelector('.analytics-week').getAttribute('aria-label')).toContain('meters');
});

test('bar selection reveals week details and benchmark selection compares only its own setup', () => {
  render([row(10, 1), row(10, 9, { time: 1400 }), row(10, 2, { machineType: 'hydrow', time: 1600 }), row(10, 11, { machineType: 'hydrow', time: 1700 })]);
  const bars = container.querySelectorAll('.analytics-week');
  act(() => Simulate.click(bars[1]));
  expect(bars[1].getAttribute('aria-pressed')).toBe('true');
  expect(container.querySelector('.analytics-week-detail').textContent).toContain('Sep 26');
  const select = container.querySelector('.analytics-benchmark-picker select');
  const concept = Array.from(select.options).find(option => option.textContent.includes('Concept2'));
  act(() => Simulate.change(select, { target: { value: concept.value } }));
  expect(container.querySelector('.analytics-pace-change').textContent).toContain('10.0 sec / 500m quicker');
  const hydrow = Array.from(select.options).find(option => option.textContent.includes('Hydrow'));
  act(() => Simulate.change(select, { target: { value: hydrow.value } }));
  expect(container.querySelector('.analytics-pace-change').textContent).toContain('10.0 sec / 500m slower');
});

test('empty state gives a clear path to useful analytics without fabricated progress', () => {
  render([]);
  expect(container.textContent).toContain('No previous baseline');
  expect(container.textContent).toContain('Repeat the same distance on two different days');
  expect(container.textContent).not.toContain('NaN');
  expect(container.querySelector('.analytics-benchmark-picker')).toBeNull();
});
