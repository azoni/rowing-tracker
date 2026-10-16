import React, { useState } from 'react';
import Icon from './Icon';
import './MonthlyMissions.css';

function MissionCard({ mission }) {
  const [selectedLevel, setSelectedLevel] = useState(null);
  const tiers = mission.tiers || [{ ...mission, id: 'starter', label: 'Starter' }];
  const nextLevel = tiers.findIndex(tier => !tier.complete);
  const activeLevel = selectedLevel ?? (nextLevel === -1 ? tiers.length - 1 : nextLevel);
  const tier = tiers[Math.min(activeLevel, tiers.length - 1)];
  const remaining = Math.max(0, tier.target - tier.current);
  const format = value => Number(value).toLocaleString();
  return (
    <article className={`mission-card mission-tier-card${mission.complete ? ' is-complete' : ''}`}>
      <div className="mission-card-heading">
        <span className="mission-icon"><Icon name={mission.complete ? 'ui_check' : mission.icon} size={23} /></span>
        <div><h3>{mission.label}</h3><span className="mission-earned-label">{mission.complete ? 'Every level earned' : mission.baseComplete ? 'Starter earned. Keep building.' : 'One goal, three levels.'}</span></div>
      </div>
      <div className="mission-levels" role="group" aria-label={`${mission.label} difficulty`}>
        {tiers.map((level, index) => <button type="button" key={level.id} aria-pressed={index === activeLevel}
          className={`${index === activeLevel ? 'is-selected' : ''} ${level.complete ? 'is-earned' : ''}`}
          onClick={() => setSelectedLevel(index)}>
          {level.complete ? <Icon name="ui_check" size={12} /> : <span className="mission-level-number">{index + 1}</span>}
          {level.label}<span className="mission-sr-only">{level.complete ? ', earned' : ', in progress'}</span>
        </button>)}
      </div>
      <div className="mission-body">
        <p className="mission-requirement">{tier.description}</p>
        {tier.stamps && <div className="mission-stamps" aria-label={`${tier.label} distance stamps`}>
          {tier.stamps.map(stamp => <span key={stamp.distance} className={stamp.entry ? 'collected' : ''}>
            {stamp.entry && <Icon name="ui_check" size={11} />}{stamp.distance >= 1000 ? `${stamp.distance / 1000}K` : `${stamp.distance}m`}
            <span className="mission-sr-only">{stamp.entry ? ' collected' : ' remaining'}</span>
          </span>)}
        </div>}
        <div className="mission-numbers"><strong>{format(Math.min(tier.current, tier.target))}<span> / {format(tier.target)} {tier.unit?.trim()}</span></strong>
          <span>{tier.complete ? `${tier.label} earned` : `${format(remaining)} to go`}</span>
        </div>
        <div className="mission-progress" role="progressbar" aria-label={`${mission.label}: ${tier.label}`} aria-valuemin={0}
          aria-valuemax={tier.target} aria-valuenow={Math.min(tier.current, tier.target)} aria-valuetext={`${tier.current} of ${tier.target} ${tier.unit}`}>
          <span style={{ width: `${tier.pct}%` }} />
        </div>
      </div>
    </article>
  );
}

function MonthlyMissions({ missions = [], onLog }) {
  const completed = missions.reduce((total, mission) => total + (mission.completedTiers ?? (mission.complete ? 1 : 0)), 0);
  const total = missions.reduce((sum, mission) => sum + (mission.tiers?.length || 1), 0);
  return (
    <section className="monthly-missions" aria-labelledby="missions-title">
      <div className="missions-heading"><div><span className="missions-eyebrow">A LITTLE FURTHER EACH TIME</span>
        <h2 id="missions-title">Your monthly missions</h2></div>
        <span className="missions-count" aria-label={`${completed} of ${total} mission levels earned`}>{completed}/{total}<small>levels</small></span>
      </div>
      <p className="missions-intro">Get started, build a rhythm, then reach for a stretch. Each level is a win.</p>
      <div className="missions-list">{missions.map(mission => <MissionCard key={mission.id} mission={mission} />)}</div>
      <div className="missions-footer"><span>{total > 0 && completed === total ? 'Every level collected this month. Nicely rowed.' : 'Progress resets monthly. Approved photos and manual rows count automatically.'}</span>
        {completed < total && onLog && <button type="button" onClick={onLog}>Log a row <span aria-hidden="true">↗</span></button>}
      </div>
    </section>
  );
}

export default MonthlyMissions;
