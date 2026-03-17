import React from 'react';
import Icon from './Icon';
import { useApp } from '../context/AppContext';
import { formatMeters } from '../utils';
import { MILESTONES, getMilestoneIndex } from '../constants';
import confetti from 'canvas-confetti';

function MilestoneCelebration() {
  const {
    showMilestoneCelebration, setShowMilestoneCelebration,
    milestoneSegmentData,
    totalMeters,
  } = useApp();

  React.useEffect(() => {
    if (showMilestoneCelebration) {
      // Fire confetti on open
      confetti({ particleCount: 100, spread: 70, origin: { y: 0.6 }, colors: ['#00d4aa', '#ffd700', '#ff6b35'] });
    }
  }, [showMilestoneCelebration]);

  if (!showMilestoneCelebration) return null;

  const milestone = showMilestoneCelebration;
  const currentIdx = getMilestoneIndex(totalMeters);
  const nextMilestone = MILESTONES[currentIdx] || null;

  const handleDismiss = () => {
    localStorage.setItem('rowcrew_lastSeenMilestone', getMilestoneIndex(totalMeters).toString());
    setShowMilestoneCelebration(null);
  };

  return (
    <div className="milestone-celebration-overlay" onClick={handleDismiss}>
      <div className="milestone-celebration-card" onClick={(e) => e.stopPropagation()}>
        <div className="milestone-celebration-header">
          <span className="milestone-celebration-label">MILESTONE REACHED!</span>
        </div>

        <div className="milestone-celebration-icon">
          <Icon name={milestone.emoji} size={56} />
        </div>

        <h2 className="milestone-celebration-title">{milestone.label}</h2>
        <p className="milestone-celebration-comparison">{milestone.comparison}</p>

        {milestone.checkpoint && (
          <div className="milestone-celebration-checkpoint">
            <Icon name="ui_pin" size={14} /> Now passing: {milestone.checkpoint}
          </div>
        )}

        <div className="milestone-celebration-divider" />

        {/* Segment stats */}
        {milestoneSegmentData && (
          <>
            {milestoneSegmentData.duration && (
              <p className="milestone-celebration-duration">
                Took <strong>{milestoneSegmentData.duration}</strong> to row <strong>{formatMeters(milestoneSegmentData.segmentMeters)}</strong>
              </p>
            )}

            {milestoneSegmentData.topRowers && milestoneSegmentData.topRowers.length > 0 && (
              <div className="milestone-celebration-rowers">
                <h4>Top Rowers This Segment</h4>
                {milestoneSegmentData.topRowers.map((rower, i) => (
                  <div key={rower.userId} className="milestone-rower-row">
                    <span className="milestone-rower-rank">
                      <Icon name={i === 0 ? 'ui_gold' : i === 1 ? 'ui_silver' : 'ui_bronze'} size={16} />
                    </span>
                    <span className="milestone-rower-name">{rower.name}</span>
                    <span className="milestone-rower-meters">{formatMeters(rower.meters)}</span>
                    <span className="milestone-rower-sessions">{rower.sessions} rows</span>
                  </div>
                ))}
              </div>
            )}
          </>
        )}

        {/* Next milestone preview */}
        {nextMilestone && (
          <div className="milestone-celebration-next">
            <span className="milestone-next-label">Next:</span>
            <Icon name={nextMilestone.emoji} size={16} />
            <span>{nextMilestone.label}</span>
            <span className="milestone-next-distance">— {formatMeters(nextMilestone.meters - totalMeters)} to go</span>
          </div>
        )}

        <button className="milestone-celebration-btn" onClick={handleDismiss}>
          Continue Rowing <Icon name="ui_rowing" size={16} color="#fff" />
        </button>
      </div>
    </div>
  );
}

export default MilestoneCelebration;
