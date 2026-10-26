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
    calculateWeeklyAverage, entries, users,
  } = useApp();

  if (!showUserProfileModal) return null;

  return (
    <div className="modal-overlay" onClick={() => setShowUserProfileModal(null)}>
      <div className="modal user-profile-modal" onClick={(e) => e.stopPropagation()}>
        <button className="modal-close" onClick={() => setShowUserProfileModal(null)}>✕</button>

        {(() => {
          const user = showUserProfileModal;
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
                  <h2>{user.name}</h2>
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
                  <span className="profile-stat-label">Total Meters</span>
                </div>
                <div className="profile-stat-box">
                  <span className="profile-stat-value">{user.uploadCount || 0}</span>
                  <span className="profile-stat-label">Sessions</span>
                </div>
                <div className="profile-stat-box highlight">
                  <span className="profile-stat-value">{formatMeters(personalRecord)}</span>
                  <span className="profile-stat-label"><Icon name="ui_trophy" size={14} /> Best Row</span>
                </div>
                <div className="profile-stat-box highlight">
                  <span className="profile-stat-value">{longestStreak}</span>
                  <span className="profile-stat-label"><Icon name="ui_fire" size={14} /> Best Streak</span>
                </div>
              </div>

              {/* Time & Calorie Stats */}
              {(user.totalTime > 0 || user.totalCalories > 0) && (
                <div className="profile-extra-stats">
                  {user.totalTime > 0 && (
                    <div className="profile-extra-stat">
                      <span className="profile-extra-icon"><Icon name="ui_timer" size={14} /></span>
                      <span className="profile-extra-value">{formatTimeDisplay(user.totalTime)}</span>
                      <span className="profile-extra-label">Total Time</span>
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
                  <span>Avg/Session</span>
                  <span>{formatMeters(avgPerUpload)}m</span>
                </div>
                <div className="profile-stat-row">
                  <span>Sessions/Week</span>
                  <span>{weeklyAvg}x</span>
                </div>
                <div className="profile-stat-row">
                  <span>Days Rowed</span>
                  <span>{totalDays}</span>
                </div>
                {firstRow && (
                  <div className="profile-stat-row">
                    <span>Member Since</span>
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
