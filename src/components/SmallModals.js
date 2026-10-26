import React from 'react';
import { useApp } from '../context/AppContext';
import { APP_VERSION, CHANGELOG } from '../constants';
import Icon from './Icon';
import BadgeArtwork from './BadgeArtwork';
import { formatAchievementProgress } from '../utils/achievementDisplay';
import './AchievementModal.css';

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

export function AchievementModal() {
  const {
    showAchievementModal, setShowAchievementModal,
    currentUser, getUserAchievements, getAchievementProgress,
  } = useApp();
  const modalRef = React.useRef(null);

  React.useEffect(() => {
    if (!showAchievementModal) return undefined;
    const previousFocus = document.activeElement;
    const modal = modalRef.current;
    modal?.querySelector('button')?.focus();
    const onKeyDown = event => {
      if (event.key === 'Escape') setShowAchievementModal(null);
      if (event.key !== 'Tab') return;
      const buttons = modal?.querySelectorAll('button:not([disabled]), [href], input, select, textarea, [tabindex="0"]');
      if (!buttons?.length) return;
      const first = buttons[0];
      const last = buttons[buttons.length - 1];
      if (event.shiftKey && document.activeElement === first) { event.preventDefault(); last.focus(); }
      else if (!event.shiftKey && document.activeElement === last) { event.preventDefault(); first.focus(); }
    };
    document.addEventListener('keydown', onKeyDown);
    return () => { document.removeEventListener('keydown', onKeyDown); previousFocus?.focus(); };
  }, [showAchievementModal, setShowAchievementModal]);

  if (!showAchievementModal) return null;

  const earned = currentUser ? getUserAchievements(currentUser.uid).find(achievement => achievement.id === showAchievementModal.id) : null;
  const progress = currentUser ? showAchievementModal.progress || getAchievementProgress(currentUser.uid, showAchievementModal) : null;
  const progressPercent = progress ? Math.min(100, Math.max(0, progress.target > 0 ? progress.current / progress.target * 100 : 0)) : 0;
  const savedDate = earned?.unlockedDate || showAchievementModal.unlockedDate;
  const date = savedDate ? (savedDate.toDate ? savedDate.toDate() : new Date(savedDate)) : null;
  const earnedDate = date && Number.isFinite(date.getTime()) ? date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) : null;

  return (
    <div className="modal-overlay achievement-showcase-overlay" onClick={() => setShowAchievementModal(null)}>
      <div className={`modal achievement-modal achievement-showcase${earned ? ' is-earned' : ''}`} ref={modalRef} role="dialog" aria-modal="true" aria-labelledby="achievement-title" aria-describedby="achievement-description" onClick={(e) => e.stopPropagation()}>
        <button className="modal-close" aria-label="Close achievement details" onClick={() => setShowAchievementModal(null)}>✕</button>

        <div className="achievement-modal-content">
          <div className="achievement-medal-display"><BadgeArtwork achievement={showAchievementModal} size={156} /></div>
          <div className="achievement-classification"><span>{showAchievementModal.category}</span>{showAchievementModal.difficulty && <><span aria-hidden="true">·</span><span>{showAchievementModal.difficulty}</span></>}</div>
          <h2 id="achievement-title">{showAchievementModal.name}</h2>
          <p className="achievement-modal-desc" id="achievement-description">{showAchievementModal.desc}</p>
          {earned ? <div className="achievement-earned-detail"><span className="achievement-earned-label"><Icon name="ui_check" size={16} /> In your collection</span>{earnedDate && <p className="achievement-modal-date">Earned {earnedDate}</p>}</div> : progress ? <div className="achievement-modal-progress">
            <div className="achievement-progress-heading"><span>Your progress</span><strong>{Math.floor(progressPercent)}%</strong></div>
            <div className="achievement-modal-progress-bar" aria-hidden="true"><div className="achievement-modal-progress-fill" style={{ width: `${progressPercent}%` }} /></div>
            <span className="achievement-modal-progress-text">{formatAchievementProgress(showAchievementModal, progress)}</span>
          </div> : <p className="achievement-guest-note">Sign in to track your progress.</p>}
        </div>

        <button className="achievement-modal-close-btn" onClick={() => setShowAchievementModal(null)}>
          Back to rowing
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
              Sign in to start rowing
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
