import React from 'react';
import { useApp } from '../context/AppContext';
import { ACHIEVEMENTS, getUserRank, getMachineName } from '../constants';
import { formatMeters, formatTimeDisplay } from '../utils';
import Icon from './Icon';
import BadgeArtwork from './BadgeArtwork';
import AvatarOrPhoto from './Avatar';
import { getMonthlyRewards } from '../utils/rowingGoals';
import './UserProfileArtwork.css';

function UserProfileModal() {
  const {
    showUserProfileModal, setShowUserProfileModal,
    getUserAchievements, calculateLongestStreak,
    getPersonalRecord, getTotalDaysRowed,
    getFirstRowDate, calculateStreak,
    calculateWeeklyAverage, entries, users, metricUsers,
  } = useApp();
  const dialogRef = React.useRef(null);
  const closeRef = React.useRef(null);
  const isOpen = !!showUserProfileModal;

  React.useEffect(() => {
    if (!isOpen) return undefined;
    const previousFocus = document.activeElement;
    const overflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    closeRef.current?.focus();
    const keydown = event => {
      if (event.key === 'Escape') { event.preventDefault(); setShowUserProfileModal(null); }
      if (event.key !== 'Tab') return;
      const dialog = dialogRef.current;
      const nodes = [...dialog.querySelectorAll('button:not([disabled]), a[href], input:not([disabled]), select:not([disabled]), textarea:not([disabled]), summary, [tabindex="0"]')].filter(node => {
        const closed = node.closest('details:not([open])');
        return !closed || (node.tagName === 'SUMMARY' && node.parentElement === closed);
      });
      const first = nodes[0], last = nodes[nodes.length - 1];
      if (!dialog.contains(document.activeElement)) { event.preventDefault(); (event.shiftKey ? last : first)?.focus(); }
      else if (event.shiftKey && document.activeElement === first) { event.preventDefault(); last?.focus(); }
      else if (!event.shiftKey && document.activeElement === last) { event.preventDefault(); first?.focus(); }
    };
    document.addEventListener('keydown', keydown);
    return () => {
      document.removeEventListener('keydown', keydown);
      document.body.style.overflow = overflow;
      if (previousFocus?.isConnected) previousFocus.focus();
    };
  }, [isOpen, setShowUserProfileModal]);

  if (!showUserProfileModal) return null;

  const selectedId = showUserProfileModal.id;
  const profile = metricUsers === undefined ? showUserProfileModal
    : Object.prototype.hasOwnProperty.call(metricUsers || {}, selectedId) ? metricUsers[selectedId] : null;
  const user = profile ? { ...profile, id: selectedId } : null;

  return (
    <div className="modal-overlay" onClick={() => setShowUserProfileModal(null)}>
      <div className="modal user-profile-modal" role="dialog" aria-modal="true" aria-labelledby="user-profile-title" ref={dialogRef} onClick={(e) => e.stopPropagation()}>
        <button className="modal-close" ref={closeRef} aria-label="Close rower profile" onClick={() => setShowUserProfileModal(null)}>✕</button>

        {(() => {
          if (!user) return <div className="profile-unavailable"><h2 id="user-profile-title">Profile unavailable</h2><p>This rower’s profile is not available right now.</p></div>;
          const userAchievements = getUserAchievements(user.id);
          const earnedIds = new Set(userAchievements.map(achievement => achievement.id));
          const earnedAchievements = ACHIEVEMENTS.filter(achievement => earnedIds.has(achievement.id));
          const remainingAchievements = ACHIEVEMENTS.filter(achievement => !earnedIds.has(achievement.id));
          const renderAchievement = achievement => {
            const unlocked = earnedIds.has(achievement.id);
            return <li key={achievement.id} className={`profile-badge ${unlocked ? 'unlocked' : 'locked'}`} title={`${achievement.name}: ${achievement.desc}`}>
              <BadgeArtwork achievement={achievement} size={48} />
              <span className="profile-badge-name">{achievement.name}</span>
              <span className="profile-badge-state">{unlocked ? 'Earned' : 'Not yet earned'}</span>
              <span className="profile-artwork-sr-only">{achievement.desc}</span>
            </li>;
          };
          const longestStreak = calculateLongestStreak(user.id);
          const personalRecord = getPersonalRecord(user.id);
          const totalDays = getTotalDaysRowed(user.id);
          const firstRow = getFirstRowDate(user.id);
          const streak = calculateStreak(user.id);
          const rank = getUserRank(user.totalMeters);
          const weeklyAvg = calculateWeeklyAverage(user.id);
          const avgPerUpload = user.uploadCount > 0 ? Math.round(user.totalMeters / user.uploadCount) : 0;

          return (
            <>
              {/* Header */}
              <div className="profile-modal-header">
                <AvatarOrPhoto user={user} size={64} className="profile-modal-avatar" />
                <div className="profile-modal-info">
                  <h2 id="user-profile-title">{user.name || 'Crew member'}</h2>
                  {user.username && <span className="profile-modal-username">@{user.username}</span>}
                  <span className="profile-modal-rank"><Icon name={rank?.emoji} size={16} /> {rank?.title}</span>
                  {streak > 0 && <span className="profile-modal-streak"><Icon name="ui_fire" size={14} /> {streak} day streak</span>}
                  {user.defaultMachine && (
                    <span className="profile-modal-machine">
                      <Icon name="ui_rowing" size={14} /> {getMachineName(user.defaultMachine, user.customMachineName)}
                    </span>
                  )}
                </div>
              </div>

              {/* Main Stats */}
              <div className="profile-stats-grid">
                <div className="profile-stat-box">
                  <span className="profile-stat-value">{formatMeters(user.totalMeters)}</span>
                  <span className="profile-stat-label">Total meters</span>
                </div>
                <div className="profile-stat-box">
                  <span className="profile-stat-value">{user.uploadCount || 0}</span>
                  <span className="profile-stat-label">Rows</span>
                </div>
                <div className="profile-stat-box highlight">
                  <span className="profile-stat-value">{formatMeters(personalRecord)}</span>
                  <span className="profile-stat-label"><Icon name="ui_trophy" size={14} /> Best row</span>
                </div>
                <div className="profile-stat-box highlight">
                  <span className="profile-stat-value">{longestStreak}</span>
                  <span className="profile-stat-label"><Icon name="ui_fire" size={14} /> Best streak</span>
                </div>
              </div>

              {/* Time & Calorie Stats */}
              {(user.totalTime > 0 || user.totalCalories > 0) && (
                <div className="profile-extra-stats">
                  {user.totalTime > 0 && (
                    <div className="profile-extra-stat">
                      <span className="profile-extra-icon"><Icon name="ui_timer" size={14} /></span>
                      <span className="profile-extra-value">{formatTimeDisplay(user.totalTime)}</span>
                      <span className="profile-extra-label">Total time</span>
                    </div>
                  )}
                  {user.totalCalories > 0 && (
                    <div className="profile-extra-stat">
                      <span className="profile-extra-icon"><Icon name="ui_fire" size={14} /></span>
                      <span className="profile-extra-value">{user.totalCalories.toLocaleString()}</span>
                      <span className="profile-extra-label">Calories</span>
                    </div>
                  )}
                </div>
              )}

              {/* Secondary Stats */}
              <div className="profile-secondary-stats">
                <div className="profile-stat-row">
                  <span>Average row</span>
                  <span>{formatMeters(avgPerUpload)}m</span>
                </div>
                <div className="profile-stat-row">
                  <span>Rows per week</span>
                  <span>{weeklyAvg}x</span>
                </div>
                <div className="profile-stat-row">
                  <span>Days rowed</span>
                  <span>{totalDays}</span>
                </div>
                {firstRow && (
                  <div className="profile-stat-row">
                    <span>Rowing since</span>
                    <span>{firstRow.toLocaleDateString('en-US', { month: 'short', year: 'numeric' })}</span>
                  </div>
                )}
              </div>

              {/* Rewards — Throwdown Completions + Challenge Placements */}
              {(() => {
                const rewards = getMonthlyRewards({ entries, users, userId: user.id });

                if (rewards.length === 0) return null;
                return (
                  <div className="profile-rewards">
                    <div className="profile-rewards-header">
                      <span>Rewards</span>
                      <span>{rewards.length}</span>
                    </div>
                    <div className="profile-rewards-grid">
                      {rewards.map(r => (
                        <div
                          key={r.key}
                          className={`profile-reward-badge ${r.type === 'challenge' ? 'challenge' : ''}`}
                          title={`${r.monthName} ${r.year} — ${r.label}`}
                        >
                          <BadgeArtwork achievement={{ category: r.type === 'challenge' ? 'milestones' : 'calories' }} size={48} />
                          <span className="profile-reward-copy"><span className="profile-reward-label">{r.label}</span><span className="profile-reward-month">{r.monthName} {r.year}</span></span>
                        </div>
                      ))}
                    </div>
                  </div>
                );
              })()}

              {/* Achievements */}
              <div className="profile-achievements">
                <div className="profile-achievements-header">
                  <span>Achievements</span>
                  <span>{userAchievements.length}/{ACHIEVEMENTS.length}</span>
                </div>
                {earnedAchievements.length > 0 ? <ul className="profile-badges" aria-label="Earned achievements">{earnedAchievements.map(renderAchievement)}</ul> : <p className="profile-achievements-empty">No badges earned yet.</p>}
                {remainingAchievements.length > 0 && <details className="profile-badges-remaining"><summary>Not yet earned <span>{remainingAchievements.length}</span></summary><ul className="profile-badges" aria-label="Achievements not yet earned">{remainingAchievements.map(renderAchievement)}</ul></details>}
              </div>
            </>
          );
        })()}
      </div>
    </div>
  );
}

export default UserProfileModal;
