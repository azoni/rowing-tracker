import React from 'react';
import { useApp } from '../context/AppContext';
import { ACHIEVEMENTS, getUserRank, getMachineName } from '../constants';
import { formatMeters, formatTimeDisplay } from '../utils';
import Icon from './Icon';

const THROWDOWNS = [
  { target: 50000, label: 'Row 50K', field: 'meters', icon: 'ui_fire' },
  { target: 14, label: '14-Day Streak', field: 'streak', icon: 'ui_fire' },
  { target: 20, label: '20 Sessions', field: 'sessions', icon: 'ui_fire' },
  { target: 75000, label: 'Row 75K', field: 'meters', icon: 'ui_fire' },
  { target: 10000, label: 'Burn 10K Cal', field: 'calories', icon: 'ui_fire' },
  { target: 100000, label: 'Row 100K', field: 'meters', icon: 'ui_fire' },
  { target: 25, label: '25 Sessions', field: 'sessions', icon: 'ui_fire' },
  { target: 21, label: '21-Day Streak', field: 'streak', icon: 'ui_fire' },
  { target: 60000, label: 'Row 60K', field: 'meters', icon: 'ui_fire' },
  { target: 15000, label: 'Burn 15K Cal', field: 'calories', icon: 'ui_fire' },
  { target: 22, label: '22 Sessions', field: 'sessions', icon: 'ui_fire' },
  { target: 80000, label: 'Row 80K', field: 'meters', icon: 'ui_fire' },
];
const MONTH_NAMES = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

function UserProfileModal() {
  const {
    showUserProfileModal, setShowUserProfileModal,
    getUserAchievements, calculateLongestStreak,
    getPersonalRecord, getTotalDaysRowed,
    getFirstRowDate, calculateStreak,
    calculateWeeklyAverage, entries,
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

              {/* Rewards — Monthly Throwdown Completions */}
              {(() => {
                const now = new Date();
                const rewards = [];
                // Check each month up to current
                for (let m = 0; m <= Math.min(now.getMonth(), 11); m++) {
                  const yr = now.getFullYear();
                  const mStart = new Date(yr, m, 1);
                  const mEnd = new Date(yr, m + 1, 0, 23, 59, 59);
                  const mEntries = entries.filter(e => e.userId === user.id && new Date(e.date) >= mStart && new Date(e.date) <= mEnd);
                  const td = THROWDOWNS[m];
                  let val = 0;
                  if (td.field === 'meters') val = mEntries.reduce((s, e) => s + e.meters, 0);
                  else if (td.field === 'sessions') val = mEntries.length;
                  else if (td.field === 'calories') val = mEntries.reduce((s, e) => s + (e.calories || 0), 0);
                  else if (td.field === 'streak') val = calculateStreak(user.id);
                  if (val >= td.target) {
                    rewards.push({ month: m, label: td.label, monthName: MONTH_NAMES[m], year: yr });
                  }
                }
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
                          key={r.month}
                          className="profile-reward-badge"
                          title={`${r.monthName} ${r.year} — ${r.label}`}
                        >
                          <Icon name="ui_fire" size={16} />
                          <span className="profile-reward-month">{r.monthName}</span>
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
