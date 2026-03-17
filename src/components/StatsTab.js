import React from 'react';
import Icon from './Icon';
import { useApp } from '../context/AppContext';
import { formatMeters } from '../utils';
import { ACHIEVEMENTS } from '../constants';

const PAGE_SIZE = 12;

const CATEGORIES = [
  { key: 'all', label: 'All' },
  { key: 'distance', label: 'Distance' },
  { key: 'sessions', label: 'Sessions' },
  { key: 'streaks', label: 'Streaks' },
  { key: 'time', label: 'Time' },
  { key: 'calories', label: 'Calories' },
  { key: 'pace', label: 'Pace' },
  { key: 'habits', label: 'Habits' },
  { key: 'fun', label: 'Fun' },
  { key: 'milestones', label: 'Milestones' },
];

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
  const [categoryFilter, setCategoryFilter] = React.useState('all');
  const [page, setPage] = React.useState(0);

  const filteredAchievements = ACHIEVEMENTS
    .filter(achievement => {
      // Status filter
      if (achievementFilter !== 'all') {
        const unlocked = currentUser ? getUserAchievements(currentUser.uid).some(a => a.id === achievement.id) : false;
        if (achievementFilter === 'completed' && !unlocked) return false;
        if (achievementFilter === 'locked' && unlocked) return false;
        if (achievementFilter === 'incomplete') {
          if (unlocked) return false;
          const progress = getAchievementProgress(currentUser.uid, achievement);
          if (progress.current <= 0) return false;
        }
      }
      // Category filter
      if (categoryFilter !== 'all' && achievement.category !== categoryFilter) return false;
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

  const totalPages = Math.ceil(filteredAchievements.length / PAGE_SIZE) || 1;
  const pageItems = filteredAchievements.slice(page * PAGE_SIZE, (page + 1) * PAGE_SIZE);

  return (
    <section className="more-section">
      <h2>Achievements & More</h2>

      {/* Achievements Section */}
      <div className="achievements-full-section">
        <h3><Icon name="ui_medal" size={18} /> {currentUser ? 'Your Achievements' : 'Achievements'}
          {currentUser && (
            <span className="achievements-count-inline"> {getUserAchievements(currentUser.uid).length}/{ACHIEVEMENTS.length}</span>
          )}
        </h3>

        {/* Status filters */}
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
              onClick={() => { setAchievementFilter(f.key); setPage(0); }}
            >
              {f.label}
            </button>
          ))}
        </div>

        {/* Category filters */}
        <div className="achievement-category-filters">
          {CATEGORIES.map(c => (
            <button
              key={c.key}
              className={`achievement-category-btn ${categoryFilter === c.key ? 'active' : ''}`}
              onClick={() => { setCategoryFilter(c.key); setPage(0); }}
            >
              {c.label}
            </button>
          ))}
        </div>

        {/* Achievement grid */}
        <div className="achievements-grid-full">
          {pageItems.map((achievement) => {
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

        {/* Pagination */}
        <div className="achievements-pagination">
          <button className="achievements-page-btn" onClick={() => setPage(p => p - 1)} disabled={page === 0}>← Prev</button>
          <span className="achievements-page-info">
            {filteredAchievements.length > 0 ? `${page + 1} / ${totalPages}` : 'No matches'}
          </span>
          <button className="achievements-page-btn" onClick={() => setPage(p => p + 1)} disabled={page + 1 >= totalPages}>Next →</button>
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
