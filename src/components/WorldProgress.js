import React from 'react';
import Icon from './Icon';
import { useApp } from '../context/AppContext';
import { formatMeters } from '../utils';
import { MILESTONES, getMilestoneIndex } from '../constants';

function WorldProgress() {
  const { totalMeters, milestoneProgress, worldProgress, setShowJourneyModal, setShowCrewMap } = useApp();

  return (
    <section className="world-progress">
      {/* Main stats row — tap to open milestones */}
      <div className="world-stats clickable" onClick={() => setShowJourneyModal(true)}>
        <div className="world-total">
          <span className="world-number">{formatMeters(totalMeters)}</span>
          <span className="world-label">meters rowed</span>
        </div>
        <div className="milestone-count">
          <span className="milestone-count-number">{getMilestoneIndex(totalMeters)}/{MILESTONES.length}</span>
          <span className="milestone-count-label">milestones</span>
        </div>
      </div>

      {/* Milestone progress — tap to open milestones */}
      <div className="clickable" onClick={() => setShowJourneyModal(true)}>
      {milestoneProgress.next ? (() => {
        const prevMeters = milestoneProgress.current?.meters || 0;
        const segmentProgress = ((totalMeters - prevMeters) / (milestoneProgress.next.meters - prevMeters)) * 100;
        return (
          <>
            {milestoneProgress.current && (
              <div className="milestone-current">
                <Icon name="ui_check" size={14} /> <Icon name={milestoneProgress.current.emoji} size={14} /> {milestoneProgress.current.label} — {milestoneProgress.current.comparison}
              </div>
            )}
            <div className="progress-bar-container">
              <div className="progress-bar" style={{ width: `${Math.min(segmentProgress, 100)}%` }} />
            </div>
            <div className="milestone-next">
              <Icon name={milestoneProgress.next.emoji} size={14} /> Next: {milestoneProgress.next.label} — {formatMeters(milestoneProgress.next.meters - totalMeters)} to go
            </div>
          </>
        );
      })() : (
        <div className="progress-bar-container">
          <div className="progress-bar" style={{ width: '100%' }} />
        </div>
      )}

      </div>

      {/* Around the World — tap to open map */}
      <div className="world-around clickable" onClick={() => setShowCrewMap(true)}>
        <div className="world-around-header">
          <span className="world-around-title"><Icon name="ui_globe" size={16} /> Row Around The World</span>
          <span className="world-around-pct">{worldProgress.toFixed(1)}%</span>
        </div>
        <div className="world-bar-container">
          <div className="world-bar" style={{ width: `${Math.min(worldProgress, 100)}%` }} />
        </div>
        <div className="world-around-detail">
          {formatMeters(totalMeters)} of {formatMeters(40075000)} — {formatMeters(40075000 - totalMeters)} to go
        </div>
      </div>
    </section>
  );
}

export default WorldProgress;
