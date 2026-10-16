import React from 'react';
import { CREW_STOPS } from '../constants/crewJourney';
import { CREW_LAND_PATHS } from '../constants/crewLand';
import { getCrewJourney, getCrewRoutePath } from '../utils/crewJourney';
import './JourneyPreview.css';

const route = getCrewRoutePath();
const kilometers = meters => `${(meters / 1000).toLocaleString(undefined, { maximumFractionDigits: 1 })} km`;

export default function JourneyPreview({ totalMeters, onOpen }) {
  const journey = getCrewJourney(totalMeters);
  const percent = journey.progressPct > 0 && journey.progressPct < 0.1 ? '<0.1' : journey.progressPct.toFixed(1);
  const remaining = journey.remainingOnLeg > 0 && journey.remainingOnLeg < 100 ? '<0.1 km' : kilometers(journey.remainingOnLeg);
  const completedRoute = getCrewRoutePath([...CREW_STOPS.slice(0, journey.activeIndex + 1), journey.position]);
  const summary = `Open crew map. ${kilometers(journey.totalMeters)} rowed together, ${percent.replace('<', 'less than ')} percent around the world. ${journey.next ? `Next stop: ${journey.next.label}, ${remaining.replace('<', 'less than ')} away.` : 'World tour complete. The crew is back in Seattle.'}`;

  return <button type="button" className="journey-preview" onClick={onOpen} aria-label={summary}>
    <span className="journey-preview-main">
      <span className="journey-preview-copy">
        <span className="journey-preview-eyebrow">Our world tour</span>
        <strong>{journey.next ? `Next: ${journey.next.label}` : 'Home, together.'}</strong>
        <span>{journey.next ? `${remaining} away` : 'One whole world rowed.'}</span>
      </span>
      <span className="journey-preview-map">
        <svg viewBox="0 0 1000 500" aria-hidden="true" focusable="false">
          <rect width="1000" height="500" fill="#09212c" />
          <path d="M0 250H1000 M0 125H1000 M0 375H1000 M250 0V500 M500 0V500 M750 0V500" className="journey-preview-grid" vectorEffect="non-scaling-stroke" />
          <g className="journey-preview-land">{CREW_LAND_PATHS.map((d, index) => <path key={index} d={d} fillRule="evenodd" />)}</g>
          <path d={route} className="journey-preview-route" vectorEffect="non-scaling-stroke" />
          <path d={completedRoute} className="journey-preview-completed" vectorEffect="non-scaling-stroke" />
          {journey.next && <circle className="journey-preview-destination" cx={journey.next.x} cy={journey.next.y} r="14" vectorEffect="non-scaling-stroke" />}
          <g className="journey-preview-boat" transform={`translate(${journey.position.x} ${journey.position.y})`}>
            <circle r="45" fill="#79dfc4" opacity=".16" />
            <circle r="24" fill="#79dfc4" stroke="#09212c" strokeWidth="6" />
            <path d="M-10 10 L0 -15 L10 10 L0 5 Z" fill="#09212c" />
          </g>
        </svg>
        <span className="journey-preview-explore">Explore map <span aria-hidden="true">↗</span></span>
      </span>
    </span>
    <span className="journey-preview-numbers"><span><strong>{kilometers(journey.totalMeters)}</strong> together</span><span>{percent}% around world</span></span>
    <span className="journey-preview-track" aria-hidden="true"><span style={{ width: `${journey.progressPct}%` }} /></span>
  </button>;
}
