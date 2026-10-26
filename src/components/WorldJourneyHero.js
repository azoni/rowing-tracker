import React from 'react';
import { WORLD_METERS } from '../constants/crewJourney';
import { getCrewJourney } from '../utils/crewJourney';
import './WorldJourneyHero.css';

const kilometers = meters => (meters / 1000).toLocaleString('en-US', { maximumFractionDigits: 3 });
const shortKilometers = meters => (meters / 1000).toLocaleString('en-US', { maximumFractionDigits: meters >= 100000 ? 0 : 1 });
const percentage = value => value > 0 && value < 0.01 ? '<0.01'
  : value < 100 && value > 99.99 ? '>99.99' : value.toFixed(2);
const LANE_BUOYS = 8;
const STRIP_MEMBERS = 5;

// The crew's boat, seen from above: a racing hull with its seats, bow toward the next port.
function Shell() {
  return <svg className="world-journey-shell" viewBox="0 0 60 12" width="44" height="9" aria-hidden="true" focusable="false">
    <path d="M1 6C12 1.6 38 1.2 59 6 38 10.8 12 10.4 1 6Z" fill="currentColor" />
    <path d="M17 6h1.5m7 0h1.5m7 0h1.5m7 0h1.5" stroke="var(--world-journey-water, #0A1C22)" strokeWidth="2.4" strokeLinecap="round" />
  </svg>;
}

// crew: optional [{ id, name, meters, color }], largest first. Shows who moved the boat.
export default function WorldJourneyHero({ totalMeters, onOpen, crew = [] }) {
  const journey = getCrewJourney(totalMeters);
  const percent = percentage(journey.progressPct);
  const distance = kilometers(journey.totalMeters);
  const spokenPercent = percent.replace('<', 'less than ').replace('>', 'more than ');
  const summary = distance + ' kilometers rowed together. ' + spokenPercent + ' percent of our 40,075 kilometer journey.';
  const legPct = Math.min(100, Math.max(0, journey.legProgress * 100));
  const crewTotal = crew.reduce((sum, member) => sum + member.meters, 0);
  const shown = crew.slice(0, STRIP_MEMBERS);
  const rest = crew.slice(STRIP_MEMBERS).reduce((sum, member) => sum + member.meters, 0);

  return <section className="world-journey" aria-labelledby="world-journey-heading">
    <div className="world-journey-main">
      <div className="world-journey-copy">
        <h2 id="world-journey-heading">Around the world</h2>
        <p className={'world-journey-distance' + (distance.length > 7 ? ' is-long' : '')}>
          <strong>{distance}</strong><span>km rowed by the crew</span>
        </p>
      </div>
    </div>

    <div className="world-journey-art" aria-hidden="true" style={{ '--leg': legPct + '%' }}>
      <span className="world-journey-port is-from">{journey.previous.label.replace(' · Home', '')}</span>
      <span className="world-journey-lane">
        {Array.from({ length: LANE_BUOYS + 1 }, (_, index) => <span key={index}
          className={'world-journey-buoy' + (index === 0 ? ' is-start' : index === LANE_BUOYS ? ' is-finish' : '')}
          style={{ left: index / LANE_BUOYS * 100 + '%' }} />)}
        <span className="world-journey-wake" />
        <span className="world-journey-boat"><Shell /></span>
      </span>
      <span className="world-journey-port is-to">{journey.next ? journey.next.label.replace(' · Home', '') : 'Home'}</span>
    </div>

    <div className="world-journey-next">
      <div className="world-journey-destination">
        <strong>{journey.next ? <><span>Next: </span>{journey.next.label}</> : 'Home in Seattle'}</strong>
        <span>{journey.next ? kilometers(journey.remainingOnLeg) + ' km to go' : 'World tour complete'}</span>
      </div>
      <button type="button" onClick={onOpen} className="world-journey-explore">
        Explore map
        <svg viewBox="0 0 20 20" width="17" height="17" fill="none" aria-hidden="true" focusable="false">
          <path d="m3 4 4-1 6 2 4-1v12l-4 1-6-2-4 1V4Zm4-1v12m6-10v12" stroke="currentColor" strokeWidth="1.3" strokeLinejoin="round" />
        </svg>
      </button>
    </div>

    <div className="world-journey-progress">
      <div className="world-journey-progress-label"><strong>{percent}% of the world</strong><span>{kilometers(WORLD_METERS)} km goal</span></div>
      <div className="world-journey-track" role="progressbar" aria-label="Crew journey around the world"
        aria-valuemin={0} aria-valuemax={100} aria-valuenow={journey.progressPct} aria-valuetext={summary}>
        <span style={{ width: journey.progressPct + '%' }} />
      </div>
    </div>

    {crewTotal > 0 && <div className="world-journey-crew">
      <p className="world-journey-crew-title">Who moved the boat</p>
      <div className="world-journey-strip" aria-hidden="true">
        {shown.map(member => <span key={member.id} style={{ flexGrow: member.meters, background: member.color }} />)}
        {rest > 0 && <span className="is-rest" style={{ flexGrow: rest }} />}
      </div>
      <ul className="world-journey-crew-list">
        {shown.map(member => <li key={member.id} style={{ '--blade': member.color }}>
          <span className="world-journey-blade" aria-hidden="true" />
          <span className="world-journey-crew-name">{member.name?.split(' ')[0] || 'Rower'}</span>
          <span className="world-journey-crew-km">{shortKilometers(member.meters)} km</span>
        </li>)}
        {rest > 0 && <li className="is-rest"><span className="world-journey-crew-name">{crew.length - STRIP_MEMBERS} more</span>
          <span className="world-journey-crew-km">{shortKilometers(rest)} km</span></li>}
      </ul>
    </div>}
  </section>;
}
