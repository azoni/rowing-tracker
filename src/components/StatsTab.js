import React from 'react';
import Icon from './Icon';
import { useApp } from '../context/AppContext';
import { formatMeters } from '../utils';
import { ACHIEVEMENTS } from '../constants';

function StatsTab() {
  const {
    currentUser, isAdmin,
    getUserAchievements, getAchievementProgress,
    setShowAchievementModal,
    setShowSessionHistory, setShowRankProgressModal,
    setShowAdminPanel, loadPendingReviews,
    handleSignOut,
  } = useApp();

  const [achievementFilter, setAchievementFilter] = React.useState('all');

  const filteredAchievements = ACHIEVEMENTS
    .filter(achievement => {
      if (achievementFilter === 'all') return true;
      const unlocked = currentUser ? getUserAchievements(currentUser.uid).some(a => a.id === achievement.id) : false;
      if (achievementFilter === 'completed') return unlocked;
      if (achievementFilter === 'locked') return !unlocked;
      if (achievementFilter === 'incomplete') {
        if (unlocked) return false;
        // "Almost There" — only show if some progress
        const progress = getAchievementProgress(currentUser.uid, achievement);
        return progress.current > 0;
      }
      return true;
    })
    .sort((a, b) => {
      if (achievementFilter === 'incomplete' && currentUser) {
        const progA = getAchievementProgress(currentUser.uid, a);
        const progB = getAchievementProgress(currentUser.uid, b);
        const pctA = progA.target > 0 ? progA.current / progA.target : 0;
        const pctB = progB.target > 0 ? progB.current / progB.target : 0;
        return pctB - pctA;
      }
      return 0;
    });

  return (
    <section className="more-section">
      <h2>Achievements & More</h2>

      {/* Achievements Section */}
      <div className="achievements-full-section">
        <h3><Icon name="ui_medal" size={18} /> {currentUser ? 'Your Achievements' : 'Achievements'}
          {currentUser && (
            <span className="achievements-count-inline"> {achievementFilter !== 'all' ? `Showing ${filteredAchievements.length} of ${ACHIEVEMENTS.length}` : `${getUserAchievements(currentUser.uid).length}/${ACHIEVEMENTS.length}`}</span>
          )}
        </h3>
        <div className="achievement-filters">
          {[
            { key: 'all', label: 'All' },
            { key: 'incomplete', label: 'Almost There' },
            { key: 'completed', label: 'Completed' },
            { key: 'locked', label: 'Locked' },
          ].map(f => (
            <button
              key={f.key}
              className={`achievement-filter-btn ${achievementFilter === f.key ? 'active' : ''}`}
              onClick={() => { setAchievementFilter(f.key); }}
            >
              {f.label}
            </button>
          ))}
        </div>
        <div className="achievements-grid-full">
          {filteredAchievements.map((achievement) => {
            const unlocked = currentUser ? getUserAchievements(currentUser.uid).some(a => a.id === achievement.id) : false;
            const progress = currentUser ? getAchievementProgress(currentUser.uid, achievement) : { current: 0, target: 1 };
            const unlockedAchievement = currentUser ? getUserAchievements(currentUser.uid).find(a => a.id === achievement.id) : null;
            const progressPercent = Math.min((progress.current / progress.target) * 100, 100);

            return (
              <div
                key={achievement.id}
                className={`achievement-card ${unlocked ? 'unlocked' : 'locked'}`}
                onClick={() => setShowAchievementModal({ ...achievement, progress, unlockedDate: unlockedAchievement?.unlockedDate })}
              >
                <span className="achievement-card-emoji"><Icon name={achievement.emoji} size={24} /></span>
                <span className="achievement-card-name">{achievement.name}</span>
                {!unlocked && currentUser && (
                  <div className="achievement-card-progress">
                    <div className="achievement-progress-bar">
                      <div className="achievement-progress-fill" style={{ width: `${progressPercent}%` }} />
                    </div>
                    <span className="achievement-progress-text">
                      {progress.target >= 1000 ? `${formatMeters(progress.current)}/${formatMeters(progress.target)}` : `${progress.current}/${progress.target}`}
                    </span>
                  </div>
                )}
                {unlocked && <span className="achievement-card-check">✓ Unlocked</span>}
              </div>
            );
          })}
        </div>
      </div>

      {/* Account Section */}
      {currentUser && (
        <div className="account-section">
          <h3><Icon name="ui_user" size={18} /> Account</h3>
          <div className="account-buttons">
            <button className="account-btn" onClick={() => setShowSessionHistory(true)}>
              <span className="account-btn-icon"><Icon name="ui_history" size={16} /></span><span className="account-btn-text">Session History</span><span className="account-btn-arrow">→</span>
            </button>
            <button className="account-btn" onClick={() => setShowRankProgressModal(true)}>
              <span className="account-btn-icon"><Icon name="ui_medal" size={16} /></span><span className="account-btn-text">Rank Progress</span><span className="account-btn-arrow">→</span>
            </button>
            {isAdmin && (
              <button className="account-btn admin" onClick={() => { setShowAdminPanel(true); loadPendingReviews(); }}>
                <span className="account-btn-icon"><Icon name="ui_shield" size={16} /></span><span className="account-btn-text">Admin Panel</span><span className="account-btn-arrow">→</span>
              </button>
            )}
            <button className="account-btn danger" onClick={handleSignOut}>
              <span className="account-btn-icon"><Icon name="ui_signout" size={16} /></span><span className="account-btn-text">Sign Out</span><span className="account-btn-arrow">→</span>
            </button>
          </div>
        </div>
      )}

    </section>
  );
}

export default StatsTab;
