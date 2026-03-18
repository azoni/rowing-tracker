import React from 'react';
import { useApp } from '../context/AppContext';
import { MILESTONES, getMilestoneIndex, getNearestCheckpoints, APP_VERSION, CHANGELOG } from '../constants';
import { JOURNEY_CHECKPOINTS, getJourneyPathD, getJourneyPosition } from '../constants/journeyPath';
import { formatMeters } from '../utils';
import Icon from './Icon';
import { Avatar } from './Avatar';

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
  const { showJourneyModal, setShowJourneyModal, totalMeters, users } = useApp();

  if (!showJourneyModal) return null;

  const milestoneIdx = getMilestoneIndex(totalMeters);
  const checkpoints = getNearestCheckpoints(totalMeters);
  const pos = getJourneyPosition(totalMeters);
  const journeyCheckpoints = JOURNEY_CHECKPOINTS;

  return (
    <div className="modal-overlay" onClick={() => setShowJourneyModal(false)}>
      <div className="modal journey-modal" onClick={(e) => e.stopPropagation()}>
        <button className="modal-close" onClick={() => setShowJourneyModal(false)}>✕</button>
        <h2><Icon name="ui_globe" size={20} /> Journey Around the World</h2>

        {/* Visual Map */}
        <div className="journey-map-container">
          <svg className="journey-map-svg" viewBox="0 0 800 360" preserveAspectRatio="xMidYMid meet">
            {/* Water background */}
            <rect width="800" height="360" className="jm-water" />

            {/* Simplified continent shapes */}
            <g className="jm-continents">
              {/* North America */}
              <path d="M80,60 L150,55 L190,70 L220,90 L230,130 L210,160 L180,200 L160,210 L140,240 L130,200 L100,170 L80,130 Z" />
              {/* South America */}
              <path d="M180,220 L210,230 L230,260 L220,300 L200,330 L185,340 L175,310 L165,270 L170,240 Z" />
              {/* Europe */}
              <path d="M420,60 L470,55 L490,70 L480,90 L460,100 L470,120 L455,140 L430,130 L420,100 Z" />
              {/* Africa */}
              <path d="M440,150 L480,145 L520,160 L530,200 L520,240 L500,270 L470,280 L450,260 L440,220 L435,180 Z" />
              {/* Asia */}
              <path d="M500,50 L580,45 L650,60 L720,70 L740,100 L730,140 L700,160 L660,180 L620,190 L570,180 L540,150 L520,120 L500,90 Z" />
              {/* Australia */}
              <path d="M680,260 L720,250 L750,260 L755,280 L740,300 L710,305 L685,290 Z" />
            </g>

            {/* Journey route path — upcoming (dimmed) */}
            <path d={getJourneyPathD()} className="jm-route-upcoming" />

            {/* Journey route path — completed (glowing) */}
            <path d={getJourneyPathD()} className="jm-route-completed" style={{ strokeDasharray: '99999', strokeDashoffset: `${99999 - (totalMeters / 40075000) * 99999}` }} />

            {/* Checkpoint dots */}
            {journeyCheckpoints.map((cp, i) => {
              const isCompleted = totalMeters >= cp.meters;
              const isLast = i === journeyCheckpoints.length - 1;
              if (isLast && !isCompleted) return null;
              return (
                <g key={cp.meters}>
                  <circle cx={cp.x} cy={cp.y} r={isCompleted ? 4 : 3} className={`jm-checkpoint ${isCompleted ? 'completed' : 'upcoming'}`} />
                  {isCompleted && i > 0 && (
                    <text x={cp.x} y={cp.y - 8} className="jm-checkpoint-label">{cp.label}</text>
                  )}
                </g>
              );
            })}

            {/* Current position — crew boat */}
            <g className="jm-boat-marker" transform={`translate(${pos.x}, ${pos.y})`}>
              <circle r="8" className="jm-boat-pulse" />
              {/* Boat hull */}
              <path d="M-16,2 L16,2 L12,8 L-12,8 Z" className="jm-boat-hull" />
              {/* Crew avatars */}
              {(() => {
                const activeRowers = Object.values(users).filter(u => u.totalMeters > 0).sort((a, b) => b.totalMeters - a.totalMeters).slice(0, 5);
                const spacing = Math.min(8, 32 / Math.max(activeRowers.length, 1));
                const startX = -(activeRowers.length - 1) * spacing / 2;
                return activeRowers.map((u, i) => (
                  <foreignObject key={u.id} x={startX + i * spacing - 4} y={-10} width="8" height="8" style={{ overflow: 'visible' }}>
                    {u.avatar?.head ? (
                      <Avatar config={u.avatar} size={8} />
                    ) : (
                      <div style={{ width: 8, height: 8, borderRadius: '50%', background: '#a8b5c9', border: '0.5px solid #fff' }} />
                    )}
                  </foreignObject>
                ));
              })()}
              <text y="-12" className="jm-boat-label">CREW</text>
              <text y="18" className="jm-boat-meters">{formatMeters(totalMeters)}</text>
            </g>
          </svg>
        </div>

        {/* Location banner */}
        <div className="journey-location-banner">
          <span className="journey-location-pin"><Icon name="ui_pin" size={16} /></span>
          <div className="journey-location-info">
            {checkpoints.prev ? (
              <span className="journey-location-text">Passed {checkpoints.prev.checkpoint}</span>
            ) : (
              <span className="journey-location-text">Just departed Seattle!</span>
            )}
            {checkpoints.next && (
              <span className="journey-location-next">{formatMeters(checkpoints.next.meters - totalMeters)} to {checkpoints.next.checkpoint}</span>
            )}
          </div>
        </div>

        {/* Milestone list */}
        <div className="journey-list">
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

        <button className="journey-close-btn" onClick={() => setShowJourneyModal(false)}>Close</button>
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
