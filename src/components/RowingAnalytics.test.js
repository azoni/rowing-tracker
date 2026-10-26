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

test('shows the distance chart immediately and changes totals and accessible chart data with the period', () => {
  render([row(10, 1), row(8, 1)]);
  expect(container.querySelector('.analytics-week-chart').closest('details')).toBeNull();
  expect(container.querySelector('.analytics-date-range').textContent).toContain('Rolling 28 days');
  expect(container.querySelector('.analytics-metric strong').textContent).toBe('5 km');
  const twelveWeeks = Array.from(container.querySelectorAll('.analytics-period button')).find(button => button.textContent === '12 weeks');
  act(() => Simulate.click(twelveWeeks));
  expect(twelveWeeks.getAttribute('aria-pressed')).toBe('true');
  expect(container.querySelector('.analytics-metric strong').textContent).toBe('10 km');
  expect(container.querySelectorAll('.analytics-week')).toHaveLength(12);
  expect(container.querySelector('.analytics-week').getAttribute('aria-label')).toContain('meters');
  expect(container.querySelector('.analytics-date-range').textContent).toContain('Rolling 84 days');
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
  expect(container.textContent).toContain('No time recorded');
  expect([...container.querySelectorAll('.analytics-bar')].every(bar => bar.style.height === '0%')).toBe(true);
});

test('explains missing recorded time and retains exact accessible values and both data tables', () => {
  render([row(10, 1), row(10, 9, { time: 1400 }), row(10, 11, { time: null }), row(9, 1, { time: null })]);
  expect(container.querySelector('.analytics-coverage').textContent).toContain('2 of 3 rows');
  expect(container.querySelector('.analytics-coverage').textContent).toContain('Previously 0 of 1');
  expect(container.querySelector('.analytics-coverage').textContent).toContain('missing times are not estimated');
  const tables = [...container.querySelectorAll('table')];
  expect(tables).toHaveLength(2);
  expect(tables[0].caption.textContent).toContain('Weekly rowing totals');
  expect(tables[0].querySelectorAll('tbody tr')).toHaveLength(4);
  expect(tables[1].caption.textContent).toContain('Comparable 5,000 meter sessions');
  expect(tables[1].querySelectorAll('tbody tr')).toHaveLength(2);
  expect(container.querySelector('.analytics-pace-definition').textContent).toContain('A lower time is faster');
});

test('uses a true zero baseline and does not inflate short rows to a minimum chart height', () => {
  render([row(10, 1), row(10, 9, { meters: 1 })]);
  const shortRow = [...container.querySelectorAll('.analytics-week')].find(bar => bar.getAttribute('aria-label').includes(': 1 meters,'));
  expect(shortRow.querySelector('.analytics-bar').style.height).toBe('0.02%');
  expect([...container.querySelectorAll('.analytics-bar.empty')].every(bar => bar.style.height === '0%')).toBe(true);
});

test('missing times suppress misleading time changes while complete periods retain the comparison', () => {
  const entries = [row(10, 1), row(10, 2, { time: null }), row(9, 1), row(9, 2)];
  render(entries);
  const timeMetric = [...container.querySelectorAll('.analytics-metric')].find(metric => metric.querySelector('span').textContent === 'Recorded time');
  expect(timeMetric.querySelector('strong').textContent).toBe('25 min');
  expect(timeMetric.querySelector('small').textContent).toBe('Missing times; not compared');
  expect(timeMetric.textContent).not.toContain('50%');
  expect(container.querySelector('.analytics-coverage').textContent).toContain('1 of 2 rows');
  render(entries.map(entry => ({ ...entry, time: 1500 })));
  expect(timeMetric.querySelector('small').textContent).toBe('Same as previous period');
  render([row(10, 1), row(10, 2), row(9, 1), row(9, 2, { time: null })]);
  expect(timeMetric.querySelector('small').textContent).toBe('Missing times; not compared');
});

test('pace history includes intermediate sessions, retains first-to-latest meaning and follows the chosen setup', () => {
  render([row(10, 1, { time: 1400 }), row(10, 3, { time: 1200 }), row(10, 11, { time: 1500 }),
    row(10, 2, { machineType: 'hydrow' }), row(10, 10, { machineType: 'hydrow', time: 1300 })]);
  expect(container.querySelectorAll('.analytics-pace-dot')).toHaveLength(3);
  expect(container.querySelector('.analytics-pace-plot').getAttribute('aria-label')).toContain('First 2:20.0, latest 2:30.0 per 500 meters');
  expect(container.querySelector('.analytics-pace-change').textContent).toContain('10.0 sec / 500m slower');
  const benchmarkTable = container.querySelector('.analytics-benchmark table');
  expect(benchmarkTable.querySelectorAll('tbody tr')).toHaveLength(3);
  expect(benchmarkTable.querySelectorAll('tbody tr')[1].textContent).toContain('2:00.0');
  const select = container.querySelector('.analytics-benchmark-picker select');
  const hydrow = [...select.options].find(option => option.textContent.includes('Hydrow'));
  act(() => Simulate.change(select, { target: { value: hydrow.value } }));
  expect(container.querySelectorAll('.analytics-pace-dot')).toHaveLength(2);
  expect(container.querySelector('.analytics-pace-plot').getAttribute('aria-label')).toContain('First 2:30.0, latest 2:10.0 per 500 meters');
  expect(container.querySelector('.analytics-pace-change').textContent).toContain('20.0 sec / 500m quicker');
});

test('interval history has no false pace trend and weekly numbers preserve exact small distances', () => {
  render([row(10, 1, { meters: 501, sessionType: 'interval' }), row(10, 11, { meters: 501, sessionType: 'interval', time: 1200 })]);
  expect(container.querySelector('.analytics-pace-history')).toBeNull();
  expect(container.querySelector('.analytics-benchmark-empty')).not.toBeNull();
  expect([...container.querySelectorAll('.analytics-volume tbody td')].filter(cell => cell.textContent === '501 m')).toHaveLength(2);
  expect(container.querySelector('.analytics-week-detail').textContent).toContain('501 m');
});
