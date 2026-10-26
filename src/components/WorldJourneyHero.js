import React, { useState } from 'react';
import { WORLD_METERS } from '../constants/crewJourney';
import { getNextMilestone } from '../constants/milestones';
import { getCrewJourney } from '../utils/crewJourney';
import './WorldJourneyHero.css';

const kilometers = meters => (meters / 1000).toLocaleString('en-US', { maximumFractionDigits: 3 });
const percentage = value => value > 0 && value < 0.01 ? '<0.01'
  : value < 100 && value > 99.99 ? '>99.99' : value.toFixed(2);

export default function WorldJourneyHero({ totalMeters, onOpen }) {
  const journey = getCrewJourney(totalMeters);
  const milestone = getNextMilestone(journey.distanceMeters);
  const [artAvailable, setArtAvailable] = useState(true);
  const percent = percentage(journey.progressPct);
  const distance = kilometers(journey.totalMeters);
  const spokenPercent = percent.replace('<', 'less than ').replace('>', 'more than ');
  const summary = distance + ' kilometers rowed together. ' + spokenPercent + ' percent of our 40,075 kilometer journey.';

  return <section className="world-journey" aria-labelledby="world-journey-heading">
    <div className="world-journey-main">
      <div className="world-journey-copy">
        <h2 id="world-journey-heading">Around the world,<br />together.</h2>
        <p className={'world-journey-distance' + (distance.length > 7 ? ' is-long' : '')}>
          <strong>{distance}</strong><span>km rowed by the crew</span>
        </p>
      </div>
      <div className="world-journey-art" aria-hidden="true">
        {artAvailable && <img src={(process.env.PUBLIC_URL || '') + '/images/journey-globe.webp'} width="640" height="640"
          alt="" decoding="async" fetchpriority="high" onError={() => setArtAvailable(false)} />}
      </div>
    </div>
    <div className="world-journey-progress">
      <div className="world-journey-progress-label"><strong>{percent}% around the world</strong><span>{kilometers(WORLD_METERS)} km goal</span></div>
      <div className="world-journey-track" role="progressbar" aria-label="Crew journey around the world"
        aria-valuemin={0} aria-valuemax={100} aria-valuenow={journey.progressPct} aria-valuetext={summary}>
        <span style={{ width: journey.progressPct + '%' }} />
      </div>
    </div>
    <div className="world-journey-next">
      <div className="world-journey-destination">
        <span>{journey.next ? 'Next port of call' : 'World tour complete'}</span>
        <strong>{journey.next ? journey.next.label : 'Home in Seattle'}</strong>
        <span>{journey.next ? kilometers(journey.remainingOnLeg) + ' km to go' : 'One whole world, rowed together.'}</span>
      </div>
      <button type="button" onClick={onOpen} className="world-journey-explore">
        Explore map
        <svg viewBox="0 0 20 20" width="17" height="17" fill="none" aria-hidden="true" focusable="false">
          <path d="m3 4 4-1 6 2 4-1v12l-4 1-6-2-4 1V4Zm4-1v12m6-10v12" stroke="currentColor" strokeWidth="1.3" strokeLinejoin="round" />
        </svg>
      </button>
    </div>
    {milestone && <p className="world-journey-milestone">Next crew milestone: <strong>{milestone.label}</strong>
      <span>{kilometers(milestone.meters - journey.distanceMeters)} km away</span></p>}
  </section>;
}
