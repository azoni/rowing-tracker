import React, { useState } from 'react';
import { getMachineName } from '../constants/machines';
import { getRowingAnalytics } from '../utils/rowingAnalytics';
import { formatTimeDisplay } from '../utils/formatters';
import './RowingAnalytics.css';

const WORKOUT_LABELS = { free_row: 'Free row', timed: 'Timed', distance: 'Distance', interval: 'Intervals' };
const shortDate = date => date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
const distance = meters => `${(meters / 1000).toLocaleString('en-US', { maximumFractionDigits: 1 })} km`;
const duration = seconds => {
  if (seconds === 0) return '—';
  if (seconds < 60) return '<1 min';
  const minutes = Math.floor(seconds / 60);
  return minutes < 60 ? `${minutes} min` : `${Math.floor(minutes / 60)}h ${minutes % 60}m`;
};
const pace = seconds => {
  const tenths = Math.round(seconds * 10);
  return `${Math.floor(tenths / 600)}:${((tenths % 600) / 10).toFixed(1).padStart(4, '0')}`;
};
const changeLabel = comparison => {
  if (!comparison.hasBaseline) return 'No previous baseline';
  const rounded = Math.round(Math.abs(comparison.percent));
  if (comparison.absolute === 0) return 'Same as previous period';
  return `${comparison.absolute > 0 ? '+' : '−'}${rounded || '<1'}% vs previous period`;
};

function RowingAnalytics({ entries, userId, now = new Date() }) {
  const [weeks, setWeeks] = useState(4);
  const [selectedWeek, setSelectedWeek] = useState(null);
  const [benchmarkKey, setBenchmarkKey] = useState('');
  const analytics = getRowingAnalytics(entries, userId, weeks, now);
  const { current, comparison, weekly, benchmarks } = analytics;
  const highlightedWeek = selectedWeek === null ? weekly.length - 1 : Math.min(selectedWeek, weekly.length - 1);
  const week = weekly[highlightedWeek];
  const maxMeters = Math.max(1, ...weekly.map(item => item.meters));
  const benchmark = benchmarks.find(item => item.key === benchmarkKey) || benchmarks[0];
  const metrics = [
    { label: 'Distance', value: distance(current.meters), comparison: comparison.meters },
    { label: 'Recorded time', value: duration(current.seconds), comparison: comparison.seconds, note: current.timedSessions ? null : 'No time recorded' },
    { label: 'Rows', value: current.sessions.toLocaleString(), comparison: comparison.sessions },
    { label: 'Days rowed', value: current.activeDays.toLocaleString(), comparison: comparison.activeDays },
  ];

  return <section className="rowing-analytics" aria-labelledby="rowing-analytics-heading">
    <div className="analytics-heading"><div><h3 id="rowing-analytics-heading">Your recent rowing</h3><p>See the distance behind your routine.</p></div>
      <div className="analytics-period" role="group" aria-label="Analytics period">{[4, 12].map(count => <button key={count} aria-pressed={weeks === count} className={weeks === count ? 'active' : ''} onClick={() => { setWeeks(count); setSelectedWeek(null); }}>{count} weeks</button>)}</div>
    </div>
    <p className="analytics-date-range">{shortDate(analytics.start)} – {shortDate(analytics.end)}<span>Rolling {analytics.days} days, through now</span></p>
    <div className="analytics-metrics">{metrics.map(metric => <div key={metric.label} className={`analytics-metric ${metric.label === 'Distance' ? 'analytics-distance' : ''}`}><span>{metric.label}</span><strong>{metric.value}</strong><small>{metric.note || changeLabel(metric.comparison)}</small></div>)}</div>
    <p className="analytics-coverage">Time recorded for <strong>{current.timedSessions} of {current.sessions} rows</strong> in this window.{(current.timedSessions < current.sessions || analytics.previous.timedSessions < analytics.previous.sessions) && ` Previously ${analytics.previous.timedSessions} of ${analytics.previous.sessions}; missing times are not estimated.`}</p>

    <div className="analytics-volume">
      <div className="analytics-chart-heading"><h4>Distance by week</h4><span>Choose a bar to explore</span></div>
      <div className="analytics-chart-plot"><div className="analytics-chart-scale" aria-hidden="true"><span>{current.meters ? distance(maxMeters) : 'Distance'}</span><span>0</span></div>
      <div className="analytics-week-chart" role="group" aria-label="Weekly rowing distance">{weekly.map((item, index) => <button key={item.start.toISOString()} className={`analytics-week ${highlightedWeek === index ? 'selected' : ''}`} aria-pressed={highlightedWeek === index} aria-label={`${shortDate(item.start)} to ${shortDate(item.end)}${item.includesToday ? ', through now' : ''}: ${item.meters.toLocaleString()} meters, ${item.sessions} rows, ${item.activeDays} active days`} onClick={() => setSelectedWeek(index)}>
        <span className="analytics-bar-track" aria-hidden="true"><span className={`analytics-bar ${item.meters === 0 ? 'empty' : ''}`} style={{ height: `${item.meters / maxMeters * 100}%` }} /></span>
        <span className="analytics-week-label">{index === 0 || index === weekly.length - 1 || (weeks === 4) ? shortDate(item.start) : '·'}</span>
      </button>)}</div></div>
      <p className="analytics-week-detail" aria-live="polite"><strong>{shortDate(week.start)} – {shortDate(week.end)}{week.includesToday ? ' · through now' : ''}</strong><span>{distance(week.meters)} · {week.sessions} {week.sessions === 1 ? 'row' : 'rows'} · {week.activeDays} {week.activeDays === 1 ? 'day' : 'days'} rowed</span></p>
      {current.sessions === 0 && <p className="analytics-empty">No rows in this window yet. Your next saved row will start the chart.</p>}
      <details className="analytics-table-details"><summary>View weekly numbers</summary><div className="analytics-table-scroll"><table><caption className="crew-sr-only">Weekly rowing totals for the selected period</caption><thead><tr><th scope="col">Week starting</th><th scope="col">Distance</th><th scope="col">Rows</th><th scope="col">Days</th></tr></thead><tbody>{weekly.map(item => <tr key={item.start.toISOString()}><th scope="row">{shortDate(item.start)}{item.includesToday ? '*' : ''}</th><td>{distance(item.meters)}</td><td>{item.sessions}</td><td>{item.activeDays}</td></tr>)}</tbody></table></div><p>Seven-day groups within this rolling window. * The final group includes today through now.</p></details>
    </div>

    <details className="analytics-method-details"><summary>How these numbers are counted</summary>
      <p className="analytics-method">Compared with {shortDate(analytics.previousStart)} – {shortDate(analytics.previousEnd)}: the previous {analytics.days} days, through the same time on the final day. Distance and time changes describe your recorded activity, not fitness.</p>
      <p className="analytics-counting-note">Saved manual and verified rows count. Pending reviews, test uploads, and future dates are excluded.</p>
    </details>
    <div className="analytics-benchmark"><div className="analytics-chart-heading"><h4>Your repeat benchmark</h4><span>Pace / 500m</span></div>
      <p className="analytics-pace-definition">Time to cover 500 meters. A lower time is faster.</p>
      {benchmark ? <>
        <label className="analytics-benchmark-picker"><span className="crew-sr-only">Choose a comparable rowing benchmark</span><select value={benchmark.key} onChange={event => setBenchmarkKey(event.target.value)}>{benchmarks.map(item => <option key={item.key} value={item.key}>{item.meters.toLocaleString()}m · {getMachineName(item.machineType, item.machineCustomName)} · {WORKOUT_LABELS[item.sessionType]}</option>)}</select></label>
        <div className="analytics-pace-comparison"><div><span>First · {shortDate(benchmark.first.date)}</span><strong>{pace(benchmark.first.pace)}</strong></div><span className="analytics-pace-arrow" aria-hidden="true">→</span><div><span>Latest · {shortDate(benchmark.latest.date)}</span><strong>{pace(benchmark.latest.pace)}</strong></div></div>
        <p className="analytics-pace-change">{Math.abs(benchmark.paceChange) < 0.05 ? 'Same recorded pace' : `${Math.abs(benchmark.paceChange).toFixed(1)} sec / 500m ${benchmark.paceChange < 0 ? 'quicker' : 'slower'}`} <span>across {benchmark.points.length} comparable rows in this window.</span></p>
        <p className="analytics-method">Same recorded distance, machine, and workout type. This compares sessions; effort and machine settings can vary.</p>
        <details className="analytics-table-details"><summary>View benchmark rows</summary><div className="analytics-table-scroll"><table><caption className="crew-sr-only">Comparable {benchmark.meters.toLocaleString()} meter sessions</caption><thead><tr><th scope="col">Date</th><th scope="col">Time</th><th scope="col">Pace / 500m</th></tr></thead><tbody>{benchmark.points.map((point, index) => <tr key={`${point.date.toISOString()}-${index}`}><th scope="row">{shortDate(point.date)}</th><td>{formatTimeDisplay(point.seconds)}</td><td>{pace(point.pace)}</td></tr>)}</tbody></table></div></details>
      </> : <div className="analytics-benchmark-empty"><p>Build a benchmark worth comparing.</p><span>Repeat the same distance on two different days. Save the time, machine, and workout type with each row to see your pace change here.</span></div>}
    </div>
  </section>;
}

export default RowingAnalytics;
