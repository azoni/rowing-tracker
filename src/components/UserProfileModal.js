import React from 'react';
import { useApp } from '../context/AppContext';
import { ACHIEVEMENTS, getUserRank, getMachineName } from '../constants';
import { formatMeters, formatTimeDisplay } from '../utils';
import Icon from './Icon';

function UserProfileModal() {
  const {
    showUserProfileModal, setShowUserProfileModal,
    getUserAchievements, calculateLongestStreak,
    getPersonalRecord, getTotalDaysRowed,
    getFirstRowDate, calculateStreak,
    calculateWeeklyAverage,
  } = useApp();

  if (!showUserProfileModal) return null;

  return (
    <div className="modal-overlay" onClick={() => setShowUserProfileModal(null)}>
      <div className="modal user-profile-modal" onClick={(e) => e.stopPropagation()}>
        <button className="modal-close" onClick={() => setShowUserProfileModal(null)}>✕</button>

        {(() => {
          const user = showUserProfileModal;
          const userAchievements = getUserAchievements(user.id);
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
                {user.photoURL ? (
                  <img src={user.photoURL} alt="" className="profile-modal-avatar" />
                ) : (
                  <div className="profile-modal-avatar-placeholder">
                    {user.name?.charAt(0)?.toUpperCase() || '?'}
                  </div>
                )}
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

              {/* Achievements */}
              <div className="profile-achievements">
                <div className="profile-achievements-header">
                  <span>Achievements</span>
                  <span>{userAchievements.length}/{ACHIEVEMENTS.length}</span>
                </div>
                <div className="profile-badges">
                  {ACHIEVEMENTS.map((achievement) => {
                    const unlocked = userAchievements.some(a => a.id === achievement.id);
                    return (
                      <div
                        key={achievement.id}
                        className={`profile-badge ${unlocked ? 'unlocked' : 'locked'}`}
                        title={`${achievement.name}: ${achievement.desc}`}
                      >
                        <Icon name={achievement.emoji} size={16} />
                      </div>
                    );
                  })}
                </div>
              </div>
            </>
          );
        })()}
      </div>
    </div>
  );
}

export default UserProfileModal;
