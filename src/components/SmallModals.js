import React from 'react';
import { useApp } from '../context/AppContext';
import { MILESTONES, getMilestoneIndex, getNearestCheckpoints, APP_VERSION, CHANGELOG } from '../constants';
import { formatMeters } from '../utils';
import Icon from './Icon';

export function PRModal() {
  const { showPRModal, setShowPRModal } = useApp();

  if (!showPRModal) return null;

  return (
    <div className="modal-overlay pr-overlay" onClick={() => setShowPRModal(null)}>
      <div className="pr-modal" onClick={(e) => e.stopPropagation()}>
        <div className="pr-fireworks"><Icon name="ui_fireworks" size={48} /></div>
        <h2 className="pr-title">NEW PR! <Icon name="ui_trophy" size={24} /></h2>
        <p className="pr-meters">{showPRModal?.toLocaleString()}m</p>
        <p className="pr-subtitle">Personal Record Smashed!</p>
        <div className="pr-message">
          <p>You just beat your previous best!</p>
          <p>Keep pushing those limits! <Icon name="ui_fire" size={16} /></p>
        </div>
        <button className="pr-btn" onClick={() => setShowPRModal(null)}>
          Let's Go! <Icon name="ui_rocket" size={16} />
        </button>
      </div>
    </div>
  );
}

export function BustedModal() {
  const { showBustedModal, setShowBustedModal } = useApp();

  if (!showBustedModal) return null;

  return (
    <div className="modal-overlay busted-overlay" onClick={() => setShowBustedModal(false)}>
      <div className="busted-modal" onClick={(e) => e.stopPropagation()}>
        <div className="busted-emoji"><Icon name="ui_warning" size={48} /></div>
        <h2 className="busted-title">BUSTED!</h2>
        <p className="busted-subtitle">Nice try, Chinh 😏</p>
        <div className="busted-message">
          <p>We see you trying to mess with the database...</p>
          <p>Your sneaky activities have been logged <Icon name="ui_history" size={16} /></p>
        </div>
        <div className="busted-gif">
          <Icon name="ui_user" size={16} /> Database Integrity Police <Icon name="ui_police" size={16} />
        </div>
        <button className="busted-btn" onClick={() => setShowBustedModal(false)}>
          I'll behave now 😇
        </button>
      </div>
    </div>
  );
}

export function JourneyModal() {
  const { showJourneyModal, setShowJourneyModal, totalMeters } = useApp();

  if (!showJourneyModal) return null;

  const milestoneIdx = getMilestoneIndex(totalMeters);
  const checkpoints = getNearestCheckpoints(totalMeters);

  return (
    <div className="modal-overlay" onClick={() => setShowJourneyModal(false)}>
      <div className="modal journey-modal" onClick={(e) => e.stopPropagation()}>
        <button className="modal-close" onClick={() => setShowJourneyModal(false)}>✕</button>
        <h2><Icon name="ui_globe" size={20} /> Journey Around the World</h2>
        <p className="journey-subtitle">Starting from Seattle, WA</p>

        <div className="journey-location-banner">
          <span className="journey-location-pin"><Icon name="ui_pin" size={16} /></span>
          <div className="journey-location-info">
            {checkpoints.prev ? (
              <span className="journey-location-text">
                Passed {checkpoints.prev.checkpoint}
              </span>
            ) : (
              <span className="journey-location-text">Just departed Seattle!</span>
            )}
            {checkpoints.next && (
              <span className="journey-location-next">
                {formatMeters(checkpoints.next.meters - totalMeters)} to {checkpoints.next.checkpoint}
              </span>
            )}
          </div>
        </div>

        <div className="journey-list">
          {/* Start marker */}
          <div className="journey-item completed checkpoint">
            <div className="journey-indicator"><Icon name="ui_pin" size={16} /></div>
            <div className="journey-item-content">
              <span className="journey-item-label">Start</span>
              <span className="journey-checkpoint-name">Seattle, WA</span>
            </div>
            <span className="journey-item-check"><Icon name="ui_success" size={16} /></span>
          </div>

          {MILESTONES.map((m, i) => {
            const isCompleted = totalMeters >= m.meters;
            const isCurrent = i === milestoneIdx;
            const isCheckpoint = !!m.checkpoint;

            return (
              <div
                key={m.meters}
                className={`journey-item ${isCompleted ? 'completed' : 'upcoming'} ${isCurrent ? 'current' : ''} ${isCheckpoint ? 'checkpoint' : ''}`}
                ref={isCurrent ? (el) => el?.scrollIntoView({ block: 'center', behavior: 'smooth' }) : undefined}
              >
                <div className="journey-indicator">
                  {isCheckpoint ? <Icon name="ui_pin" size={16} /> : isCompleted ? <Icon name="ui_success" size={16} /> : <Icon name={m.emoji} size={16} />}
                </div>
                <div className="journey-item-content">
                  <span className="journey-item-label">{m.label}</span>
                  {isCheckpoint && <span className="journey-checkpoint-name">{m.checkpoint}</span>}
                  <span className="journey-item-comparison">{m.comparison}</span>
                </div>
                {isCompleted && !isCheckpoint && <span className="journey-item-check"><Icon name="ui_success" size={16} /></span>}
                {!isCompleted && isCurrent && (
                  <span className="journey-item-distance">{formatMeters(m.meters - totalMeters)}</span>
                )}
              </div>
            );
          })}
        </div>

        <button className="journey-close-btn" onClick={() => setShowJourneyModal(false)}>
          Close
        </button>
      </div>
    </div>
  );
}

export function AchievementModal() {
  const {
    showAchievementModal, setShowAchievementModal,
    currentUser, getUserAchievements, getAchievementProgress,
  } = useApp();

  if (!showAchievementModal) return null;

  return (
    <div className="modal-overlay" onClick={() => setShowAchievementModal(null)}>
      <div className="modal achievement-modal" onClick={(e) => e.stopPropagation()}>
        <button className="modal-close" onClick={() => setShowAchievementModal(null)}>✕</button>

        <div className="achievement-modal-content">
          <span className="achievement-modal-emoji"><Icon name={showAchievementModal.emoji} size={48} /></span>
          <h2>{showAchievementModal.name}</h2>
          <p className="achievement-modal-desc">{showAchievementModal.desc}</p>

          {currentUser && (() => {
            const isUnlocked = getUserAchievements(currentUser.uid).some(a => a.id === showAchievementModal.id);
            const progress = showAchievementModal.progress || getAchievementProgress(currentUser.uid, showAchievementModal);
            const progressPercent = Math.min((progress.current / progress.target) * 100, 100);

            return (
              <>
                {/* Progress Bar */}
                <div className="achievement-modal-progress">
                  <div className="achievement-modal-progress-bar">
                    <div
                      className={`achievement-modal-progress-fill ${isUnlocked ? 'complete' : ''}`}
                      style={{ width: `${progressPercent}%` }}
                    />
                  </div>
                  <span className="achievement-modal-progress-text">
                    {progress.target >= 1000
                      ? `${formatMeters(progress.current)} / ${formatMeters(progress.target)}`
                      : `${progress.current} / ${progress.target}`
                    }
                  </span>
                </div>

                {/* Status */}
                <div className={`achievement-modal-status ${isUnlocked ? 'unlocked' : 'locked'}`}>
                  {isUnlocked ? (
                    <>
                      <span className="status-icon"><Icon name="ui_check" size={16} /></span>
                      <span>Unlocked!</span>
                    </>
                  ) : (
                    <>
                      <span className="status-icon">🔒</span>
                      <span>Keep rowing to unlock!</span>
                    </>
                  )}
                </div>

                {/* Date Completed */}
                {isUnlocked && showAchievementModal.unlockedDate && (
                  <p className="achievement-modal-date">
                    Completed on {new Date(showAchievementModal.unlockedDate).toLocaleDateString('en-US', {
                      month: 'short',
                      day: 'numeric',
                      year: 'numeric'
                    })}
                  </p>
                )}
              </>
            );
          })()}
        </div>

        <button className="achievement-modal-close-btn" onClick={() => setShowAchievementModal(null)}>
          Got it!
        </button>
      </div>
    </div>
  );
}

export function PhotoModal() {
  const { showPhotoModal, setShowPhotoModal } = useApp();

  if (!showPhotoModal) return null;

  return (
    <div className="modal-overlay" onClick={() => setShowPhotoModal(null)}>
      <div className="modal photo-modal" onClick={(e) => e.stopPropagation()}>
        <button className="modal-close" onClick={() => setShowPhotoModal(null)}>✕</button>

        <div className="photo-modal-content">
          <img src={showPhotoModal.url} alt="Row evidence" className="photo-modal-image" />

          <div className="photo-modal-details">
            <p><strong>{showPhotoModal.entry?.user?.name}</strong></p>
            <p>{showPhotoModal.entry?.meters?.toLocaleString()}m</p>
            <p className="photo-modal-date">
              {new Date(showPhotoModal.entry?.date).toLocaleString()}
            </p>

            {showPhotoModal.entry?.verificationDetails && (
              <div className="photo-modal-verification">
                <p>
                  <span className={`verification-status-badge ${showPhotoModal.entry.verificationStatus}`}>
                    {showPhotoModal.entry.verificationStatus === 'verified' ? <><Icon name="ui_check" size={14} /> Verified</> :
                     showPhotoModal.entry.verificationStatus === 'pending_review' ? <><Icon name="ui_pending" size={14} /> Pending Review</> :
                     '? Unverified'}
                  </span>
                </p>
                {showPhotoModal.entry.verificationDetails.displayType && (
                  <p className="photo-modal-detail">Machine: {showPhotoModal.entry.verificationDetails.displayType}</p>
                )}
                {showPhotoModal.entry.verificationDetails.confidence > 0 && (
                  <p className="photo-modal-detail">Confidence: {showPhotoModal.entry.verificationDetails.confidence}%</p>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

export function InstallPrompt() {
  const {
    showInstallPrompt, isStandalone, isIOS,
    deferredPrompt, handleInstallClick, dismissInstallPrompt,
  } = useApp();

  if (!showInstallPrompt || isStandalone) return null;

  return (
    <div className="install-prompt">
      <div className="install-prompt-content">
        <span className="install-prompt-icon"><Icon name="ui_upload" size={24} /></span>
        <div className="install-prompt-text">
          <strong>Install Row Crew</strong>
          <p>Add to your home screen for quick access!</p>
        </div>
      </div>

      {isIOS ? (
        <div className="install-prompt-ios">
          <p>1. Tap the Share button <span className="ios-share-icon">⬆️</span></p>
          <p>2. Scroll down and tap "Add to Home Screen"</p>
          <button className="install-prompt-dismiss" onClick={dismissInstallPrompt}>Got it!</button>
        </div>
      ) : deferredPrompt ? (
        <div className="install-prompt-actions">
          <button className="install-prompt-btn" onClick={handleInstallClick}>Install</button>
          <button className="install-prompt-dismiss" onClick={dismissInstallPrompt}>Maybe Later</button>
        </div>
      ) : (
        <div className="install-prompt-ios">
          <p>Open browser menu and select "Add to Home Screen"</p>
          <button className="install-prompt-dismiss" onClick={dismissInstallPrompt}>Got it!</button>
        </div>
      )}
    </div>
  );
}

export function WelcomeModal() {
  const {
    showWelcomeModal, setShowWelcomeModal,
    handleSignIn, currentUser,
  } = useApp();

  if (!showWelcomeModal) return null;

  return (
    <div className="modal-overlay" onClick={() => setShowWelcomeModal(false)}>
      <div className="modal welcome-modal" onClick={(e) => e.stopPropagation()}>
        <button className="modal-close" onClick={() => setShowWelcomeModal(false)}>✕</button>

        <div className="welcome-header">
          <span className="welcome-logo"><Icon name="ui_rowing" size={32} /></span>
          <h2>Welcome to Row Crew!</h2>
          <p className="welcome-tagline">The social rowing tracker that makes every meter count</p>
        </div>

        <div className="welcome-features">
          <div className="welcome-feature">
            <span className="welcome-feature-icon"><Icon name="ui_globe" size={24} /></span>
            <div>
              <h4>Row Around The World</h4>
              <p>Join our global community goal to row 40,075km together</p>
            </div>
          </div>

          <div className="welcome-feature">
            <span className="welcome-feature-icon"><Icon name="ui_camera" size={24} /></span>
            <div>
              <h4>AI-Verified Rows</h4>
              <p>Snap a photo of your machine - our AI reads your meters automatically</p>
            </div>
          </div>

          <div className="welcome-feature">
            <span className="welcome-feature-icon"><Icon name="ui_users" size={24} /></span>
            <div>
              <h4>Private Groups</h4>
              <p>Create crews with friends, family, or gym buddies</p>
            </div>
          </div>

          <div className="welcome-feature">
            <span className="welcome-feature-icon"><Icon name="ui_target" size={24} /></span>
            <div>
              <h4>Challenges</h4>
              <p>Compete in distance races, time trials, and team goals</p>
            </div>
          </div>

          <div className="welcome-feature">
            <span className="welcome-feature-icon"><Icon name="ui_trophy" size={24} /></span>
            <div>
              <h4>Ranks & Achievements</h4>
              <p>Level up from Landlubber to Captain as you progress</p>
            </div>
          </div>

          <div className="welcome-feature">
            <span className="welcome-feature-icon"><Icon name="ui_fire" size={24} /></span>
            <div>
              <h4>Streaks & Stats</h4>
              <p>Track your consistency and see detailed analytics</p>
            </div>
          </div>
        </div>

        <div className="welcome-cta">
          {!currentUser ? (
            <button className="welcome-signin-btn" onClick={() => { setShowWelcomeModal(false); handleSignIn(); }}>
              Sign In to Start Rowing
            </button>
          ) : (
            <button className="welcome-close-btn" onClick={() => setShowWelcomeModal(false)}>
              Let's Go! <Icon name="ui_rowing" size={16} />
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

export function ChangelogModal() {
  const { showChangelogModal, setShowChangelogModal } = useApp();

  if (!showChangelogModal) return null;

  return (
    <div className="modal-overlay" onClick={() => setShowChangelogModal(false)}>
      <div className="modal changelog-modal" onClick={(e) => e.stopPropagation()}>
        <button className="modal-close" onClick={() => setShowChangelogModal(false)}>✕</button>

        <div className="changelog-header">
          <span className="changelog-icon"><Icon name="ui_celebrate" size={24} /></span>
          <h2>What's New!</h2>
          <p className="changelog-version">Version {APP_VERSION}</p>
        </div>

        <div className="changelog-content">
          {CHANGELOG.slice(0, 2).map((release, index) => (
            <div key={release.version} className={`changelog-release ${index === 0 ? 'latest' : ''}`}>
              <div className="changelog-release-header">
                <span className="changelog-release-version">v{release.version}</span>
                <span className="changelog-release-date">{release.date}</span>
              </div>
              <ul className="changelog-changes">
                {release.changes.map((change, i) => (
                  <li key={i}>{change}</li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        <button className="changelog-close-btn" onClick={() => setShowChangelogModal(false)}>
          Got it!
        </button>
      </div>
    </div>
  );
}
