import React from 'react';
import Icon from './Icon';
import { useApp } from '../context/AppContext';
import { formatMeters } from '../utils';
import { MILESTONES, getMilestoneIndex } from '../constants';

function WorldProgress() {
  const { totalMeters, milestoneProgress, worldProgress, setShowJourneyModal } = useApp();

  return (
    <section className="world-progress clickable" onClick={() => setShowJourneyModal(true)}>
      <div className="world-stats">
        <div className="world-total">
          <span className="world-number">{formatMeters(totalMeters)}</span>
          <span className="world-label">meters rowed</span>
        </div>
        <div className="milestone-count">
          <span className="milestone-count-number">{getMilestoneIndex(totalMeters)}/{MILESTONES.length}</span>
          <span className="milestone-count-label">milestones</span>
        </div>
      </div>
      {milestoneProgress.next ? (() => {
        const prevMeters = milestoneProgress.current?.meters || 0;
        const segmentProgress = ((totalMeters - prevMeters) / (milestoneProgress.next.meters - prevMeters)) * 100;
        return (
          <>
            <div className="progress-bar-container">
              <div className="progress-bar" style={{ width: `${Math.min(segmentProgress, 100)}%` }} />
            </div>
            <p className="next-milestone">
              <Icon name={milestoneProgress.next.emoji} size={16} /> Next: {milestoneProgress.next.label} — {formatMeters(milestoneProgress.next.meters - totalMeters)} to go!
            </p>
          </>
        );
      })() : (
        <div className="progress-bar-container">
          <div className="progress-bar" style={{ width: '100%' }} />
        </div>
      )}
      {milestoneProgress.current && (
        <p className="current-achievement"><Icon name={milestoneProgress.current.emoji} size={16} /> {milestoneProgress.current.comparison}</p>
      )}
      <div className="world-bar-row">
        <div className="world-bar-container">
          <div className="world-bar" style={{ width: `${Math.min(worldProgress, 100)}%` }} />
        </div>
        <span className="world-bar-label"><Icon name="ui_globe" size={14} /> {worldProgress.toFixed(2)}%</span>
      </div>
    </section>
  );
}

export default WorldProgress;
