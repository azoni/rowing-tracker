import React from 'react';
import { useApp } from '../context/AppContext';
import { formatMeters } from '../utils';
import Icon from './Icon';

function ShareCardModal() {
  const {
    showShareModal, handleCloseShare,
    shareCardRef, userProfile, shareImageUrl,
    lastSessionMeters, calculateStreak,
    currentUser, linkCopied, isCopying, handleCopyLink,
  } = useApp();

  if (!showShareModal) return null;

  return (
    <div className="modal-overlay" onClick={handleCloseShare}>
      <div className="share-modal" onClick={(e) => e.stopPropagation()}>
        <button className="share-close-btn" onClick={handleCloseShare}>✕</button>

        <div className="share-card" ref={shareCardRef}>
          <div className="share-card-header">
            <div className="share-card-brand">
              <span className="share-brand-icon"><Icon name="ui_rowing" size={20} /></span>
              <span className="share-brand-text">ROW CREW</span>
            </div>
            <div className="share-card-date">
              {new Date().toLocaleDateString('en-US', {
                weekday: 'short',
                month: 'short',
                day: 'numeric',
                year: 'numeric',
                timeZone: 'America/Los_Angeles'
              })}
            </div>
          </div>

          <div className="share-card-user">
            {userProfile?.photoURL ? (
              <img src={userProfile.photoURL} alt="" className="share-user-avatar" crossOrigin="anonymous" />
            ) : (
              <div className="share-user-avatar-placeholder">
                {userProfile?.name?.charAt(0)?.toUpperCase() || '?'}
              </div>
            )}
            <span className="share-user-name">{userProfile?.name}</span>
          </div>

          {shareImageUrl && (
            <div className="share-card-image">
              <img src={shareImageUrl} alt="Rowing session" crossOrigin="anonymous" />
            </div>
          )}

          <div className="share-card-session">
            <span className="share-session-label">Just rowed</span>
            <span className="share-session-meters">{lastSessionMeters.toLocaleString()}m</span>
          </div>

          <div className="share-card-stats">
            <div className="share-stat">
              <span className="share-stat-icon"><Icon name="ui_fire" size={16} /></span>
              <span className="share-stat-value">{calculateStreak(currentUser?.uid)}</span>
              <span className="share-stat-label">day streak</span>
            </div>
            <div className="share-stat-divider"></div>
            <div className="share-stat">
              <span className="share-stat-icon"><Icon name="ui_chart" size={16} /></span>
              <span className="share-stat-value">{formatMeters((userProfile?.totalMeters || 0) + lastSessionMeters)}</span>
              <span className="share-stat-label">total meters</span>
            </div>
          </div>

          <div className="share-card-footer">
            <span>Join us rowing around the world! <Icon name="ui_globe" size={14} /></span>
            <a
              href="https://rowcrew.netlify.app"
              target="_blank"
              rel="noopener noreferrer"
              className="share-card-url"
            >
              rowcrew.netlify.app
            </a>
          </div>
        </div>

        <div className="share-actions">
          <button
            className={`share-copy-btn ${linkCopied ? 'copied' : ''} ${isCopying ? 'copying' : ''}`}
            onClick={handleCopyLink}
            disabled={isCopying}
          >
            {isCopying ? <><Icon name="ui_pending" size={16} /> Working...</> : linkCopied ? <><Icon name="ui_check" size={16} /> Done!</> : <><Icon name="ui_share" size={16} /> Share</>}
          </button>
          <button className="share-done-btn" onClick={handleCloseShare}>
            Done
          </button>
        </div>
      </div>
    </div>
  );
}

export default ShareCardModal;
