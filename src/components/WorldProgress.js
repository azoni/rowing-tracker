import React from 'react';
import Icon from './Icon';
import { useApp } from '../context/AppContext';
import { formatMeters } from '../utils';
import { MILESTONES, WORLD_CIRCUMFERENCE, getMilestoneIndex } from '../constants';
import './WorldProgress.css';

function WorldProgress() {
  const { totalMeters, milestoneProgress, worldProgress, setShowCrewMap } = useApp();
  const openMap = () => setShowCrewMap(true);
  const remaining = Math.max(0, WORLD_CIRCUMFERENCE - totalMeters);
  const percent = Math.min(100, Math.max(0, worldProgress));

  return (
    <section className="world-progress">
      <button type="button" className="world-stats world-progress-link" onClick={openMap} aria-label="Open crew map and milestone passport">
        <span className="world-total">
          <span className="world-number">{formatMeters(totalMeters)}</span>
          <span className="world-label">meters rowed</span>
        </span>
        <span className="milestone-count">
          <span className="milestone-count-number">{getMilestoneIndex(totalMeters)}/{MILESTONES.length}</span>
          <span className="milestone-count-label">milestones</span>
        </span>
      </button>

      <button type="button" className="world-milestone-link world-progress-link" onClick={openMap} aria-label="Explore crew journey milestones">
      {milestoneProgress.next ? (() => {
        const prevMeters = milestoneProgress.current?.meters || 0;
        const segmentProgress = ((totalMeters - prevMeters) / (milestoneProgress.next.meters - prevMeters)) * 100;
        return (
          <>
            {milestoneProgress.current && (
              <span className="milestone-current">
                <Icon name="ui_check" size={14} /> <Icon name={milestoneProgress.current.emoji} size={14} /> {milestoneProgress.current.label} — {milestoneProgress.current.comparison}
              </span>
            )}
            <span className="progress-bar-container">
              <span className="progress-bar" style={{ width: `${Math.min(segmentProgress, 100)}%` }} />
            </span>
            <span className="milestone-next">
              <Icon name={milestoneProgress.next.emoji} size={14} /> Next: {milestoneProgress.next.label} — {formatMeters(milestoneProgress.next.meters - totalMeters)} to go
            </span>
          </>
        );
      })() : (
        <span className="progress-bar-container">
          <span className="progress-bar" style={{ width: '100%' }} />
        </span>
      )}

      </button>

      <button type="button" className="world-around world-progress-link" onClick={openMap} aria-label="Explore the crew expedition map">
        <span className="world-around-header">
          <span className="world-around-title"><Icon name="ui_globe" size={16} /> Row Around The World</span>
          <span className="world-around-pct">{percent.toFixed(1)}%</span>
        </span>
        <span className="world-bar-container">
          <span className="world-bar" style={{ width: `${percent}%` }} />
        </span>
        <span className="world-around-detail">
          {formatMeters(totalMeters)} of {formatMeters(WORLD_CIRCUMFERENCE)} — {remaining ? `${formatMeters(remaining)} to go` : 'Journey complete!'}
        </span>
      </button>
    </section>
  );
}

export default WorldProgress;
