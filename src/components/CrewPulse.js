import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { getCrewPulse, getCrewSpotlights } from '../utils/crewPulse';
import { formatTimeAgo } from '../utils';
import AvatarOrPhoto from './Avatar';
import Icon from './Icon';
import './CrewPulse.css';

const distance = meters => meters >= 1000
  ? `${(meters / 1000).toLocaleString(undefined, { maximumFractionDigits: 1 })} km`
  : `${meters.toLocaleString()} m`;
const APPLAUSE = '👏';

export default function CrewPulse({ compact = false }) {
  const { entries, users, currentUser, selectedGroupId, getSelectedGroup,
    getReactionCounts, hasUserReacted, toggleReaction, setShowUserProfileModal } = useApp();
  const [spotlightId, setSpotlightId] = useState(null);
  const [pendingId, setPendingId] = useState(null);
  const now = new Date();
  const memberIds = selectedGroupId ? getSelectedGroup()?.memberIds || [] : null;
  const pulse = getCrewPulse({ entries, users, memberIds, currentUserId: currentUser?.uid, now });
  const spotlights = getCrewSpotlights(pulse.rows, currentUser?.uid, getReactionCounts, now);
  const spotlight = spotlights.find(row => row.id === spotlightId) || spotlights[0];
  const spotlightUser = spotlight ? { ...users[spotlight.userId], id: spotlight.userId } : null;
  const cheered = spotlight ? hasUserReacted(spotlight.id, APPLAUSE) : false;
  const lastDay = new Date(pulse.end);
  lastDay.setDate(lastDay.getDate() - 1);
  const dateLabel = `${pulse.start.toLocaleDateString(undefined, { month: 'short', day: 'numeric' })} – ${lastDay.toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}`;

  const cheer = async () => {
    if (!currentUser || !spotlight || pendingId) return;
    setSpotlightId(spotlight.id);
    setPendingId(spotlight.id);
    try {
      await toggleReaction(spotlight.id, APPLAUSE);
    } finally {
      setPendingId(null);
    }
  };

  const content = (
    <section className={`crew-pulse ${pulse.complete ? 'crew-pulse-complete' : ''}`} aria-labelledby="crew-pulse-title">
      <div className="crew-pulse-heading">
        <div><span className="crew-eyebrow">This week, together</span><h3 id="crew-pulse-title">Pull together</h3></div>
        <span className="crew-pulse-date">{dateLabel}</span>
      </div>
      <div className="crew-pulse-distance">
        <strong>{distance(pulse.meters)}</strong><span>of {distance(pulse.target)} crew goal</span>
        {pulse.complete && <span className="crew-pulse-won"><Icon name="ui_check" size={14} /> Reached</span>}
      </div>
      <div className="crew-pulse-track" role="progressbar" aria-label="Weekly crew distance"
        aria-valuemin={0} aria-valuemax={pulse.target} aria-valuenow={Math.min(pulse.meters, pulse.target)}
        aria-valuetext={`${distance(pulse.meters)} of ${distance(pulse.target)}`}>
        <span style={{ width: `${pulse.percent}%` }} />
      </div>
      <p className="crew-pulse-next">{pulse.complete
        ? `Goal reached together${pulse.meters > pulse.target ? `, plus ${distance(pulse.meters - pulse.target)} extra` : ''}. Every contribution counts.`
        : pulse.meters > 0 ? `${distance(pulse.remaining)} to go. Every row moves the crew forward.` : 'A fresh week. The first row gets us moving.'}</p>
      <div className="crew-pulse-stats">
        <span><strong>{pulse.contributors.length}</strong> {pulse.contributors.length === 1 ? 'rower' : 'rowers'}</span>
        <span><strong>{pulse.sessions}</strong> {pulse.sessions === 1 ? 'row' : 'rows'}</span>
        {pulse.currentUserMeters > 0 && <span className="crew-pulse-your-share"><strong>{distance(pulse.currentUserMeters)}</strong> from you</span>}
      </div>
      {pulse.contributors.length > 0 && (
        <details className="crew-pulse-contributors">
          <summary>Meet this week’s crew <span>{pulse.contributors.length}</span></summary>
          <div className="crew-pulse-contributor-list">
            {pulse.contributors.map(rower => (
              <button key={rower.userId} className="crew-pulse-contributor" onClick={() => setShowUserProfileModal(rower.user)}>
                <AvatarOrPhoto user={rower.user} size={30} />
                <span>{rower.user.name || 'Crew member'}{rower.userId === currentUser?.uid ? ' (you)' : ''}<small>{rower.sessions} {rower.sessions === 1 ? 'row' : 'rows'}</small></span>
                <strong>{distance(rower.meters)}</strong>
              </button>
            ))}
          </div>
        </details>
      )}
      <details className="crew-pulse-method">
        <summary>How this goal works</summary>
        <p>{pulse.hasHistory
          ? `The previous four completed weeks averaged ${distance(pulse.weeklyAverage)}. This goal adds 10%, rounds up to the next 1 km, and stays the same as this week’s rows arrive.`
          : 'No rows in the previous four completed weeks, so the crew starts with a shared 5 km goal.'} Weeks run Monday–Sunday in your local time. Photo and manual rows count; test rows and rows awaiting review do not.</p>
      </details>
      {spotlight && (
        <div className="crew-pulse-spotlight">
          <div className="crew-pulse-spotlight-label">
            <span className="crew-eyebrow">A little encouragement</span>
            {spotlights.length > 1 && <button className="crew-pulse-next-row" disabled={!!pendingId} onClick={() => {
              const next = (spotlights.findIndex(row => row.id === spotlight.id) + 1) % spotlights.length;
              setSpotlightId(spotlights[next].id);
            }}>Next row <span aria-hidden="true">→</span></button>}
          </div>
          <div className="crew-pulse-spotlight-row">
            <button className="crew-pulse-spotlight-person" aria-label={`View ${spotlightUser.name || 'rower'} profile`} onClick={() => setShowUserProfileModal(spotlightUser)}>
              <AvatarOrPhoto user={spotlightUser} size={36} />
              <span><strong>{spotlightUser.name || 'Crew member'}</strong><small>{distance(Number(spotlight.meters))}, {formatTimeAgo(spotlight.date?.toDate ? spotlight.date.toDate() : new Date(spotlight.date))}</small></span>
            </button>
            <button className={`crew-pulse-cheer ${cheered ? 'active' : ''}`} aria-pressed={cheered}
              aria-label={`${cheered ? 'Remove kudos from' : 'Give kudos to'} ${spotlightUser.name || 'this rower'}’s row`}
              disabled={!currentUser || !!pendingId} onClick={cheer}>
              <span aria-hidden="true">{APPLAUSE}</span> {pendingId === spotlight.id ? 'Saving…' : cheered ? 'Cheered · Undo' : 'Give kudos'}
            </button>
          </div>
          <p className="crew-pulse-support-note">{!currentUser ? 'Sign in to cheer on the crew.'
            : spotlight.reactionCount === 0 ? 'Be the first to cheer this row.'
              : `${spotlight.reactionCount} ${spotlight.reactionCount === 1 ? 'reaction' : 'reactions'} on this row`}</p>
        </div>
      )}
    </section>
  );

  if (!compact) return content;

  return (
    <details className="crew-pulse-panel">
      <summary className="crew-pulse-panel-summary">
        <span><strong>This week together</strong><small>{pulse.sessions} {pulse.sessions === 1 ? 'row' : 'rows'} from {pulse.contributors.length} {pulse.contributors.length === 1 ? 'rower' : 'rowers'}</small></span>
        <span className="crew-pulse-panel-distance"><strong>{distance(pulse.meters)}</strong><small>{pulse.complete ? 'Goal reached' : 'Crew goal & kudos'}</small></span>
        <span className="crew-pulse-panel-chevron" aria-hidden="true">+</span>
      </summary>
      <div className="crew-pulse-panel-body">{content}</div>
    </details>
  );
}
