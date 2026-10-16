import React from 'react';
import Icon from './Icon';
import './MonthlyMissions.css';

function MonthlyMissions({ missions = [], onLog }) {
  const complete = missions.filter(mission => mission.complete).length;
  return (
    <section className="monthly-missions" aria-labelledby="missions-title">
      <div className="missions-heading">
        <div>
          <span className="missions-eyebrow">A LITTLE EXTRA MOTIVATION</span>
          <h2 id="missions-title">Your monthly missions</h2>
        </div>
        <span className="missions-count" aria-label={`${complete} of ${missions.length} missions complete`}>{complete}/{missions.length}</span>
      </div>
      <p className="missions-intro">Three small goals. Your pace. Every new month is a fresh start.</p>
      <div className="missions-list">
        {missions.map(mission => (
          <article className={`mission-card${mission.complete ? ' is-complete' : ''}`} key={mission.id}>
            <span className="mission-icon"><Icon name={mission.complete ? 'ui_check' : mission.icon} size={23} /></span>
            <div className="mission-body">
              <div className="mission-title-row"><h3>{mission.label}</h3><span>{mission.complete ? 'Done!' : `${mission.current}/${mission.target}`}</span></div>
              <p>{mission.description}</p>
              {mission.stamps && <div className="mission-stamps" aria-label="Distance stamps">
                {mission.stamps.map(stamp => <span key={stamp.distance} className={stamp.entry ? 'collected' : ''}>
                  {stamp.entry && <Icon name="ui_check" size={11} />}{stamp.distance >= 1000 ? `${stamp.distance / 1000}K` : `${stamp.distance}m`}
                  <span className="mission-sr-only">{stamp.entry ? ' collected' : ' remaining'}</span>
                </span>)}
              </div>}
              <div className="mission-progress" role="progressbar" aria-label={mission.label} aria-valuemin={0} aria-valuemax={mission.target} aria-valuenow={mission.current} aria-valuetext={`${mission.current} of ${mission.target} ${mission.unit}`}><span style={{ width: `${mission.pct}%` }} /></div>
            </div>
          </article>
        ))}
      </div>
      <div className="missions-footer"><span>{complete === missions.length ? 'All three collected. Nicely rowed.' : 'Saved rows count automatically. Photos under review count once approved.'}</span>{complete < missions.length && onLog && <button type="button" onClick={onLog}>Log a row <span aria-hidden="true">↗</span></button>}</div>
    </section>
  );
}

export default MonthlyMissions;
