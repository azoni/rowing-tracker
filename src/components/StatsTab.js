import React from 'react';
import Icon from './Icon';
import { useApp } from '../context/AppContext';
import { formatMeters, formatTimeDisplay } from '../utils';
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
    currentUser, isAdmin, entries,
    getUserAchievements, getAchievementProgress,
    setShowAchievementModal,
    setShowSessionHistory, setShowRankProgressModal,
    setShowAdminPanel, loadPendingReviews,
    handleSignOut, calculateStreak, calculateLongestStreak,
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

      {/* Fun Stats Section */}
      {currentUser && (() => {
        const userEntries = entries.filter(e => e.userId === currentUser.uid);
        if (userEntries.length < 3) return null;

        const DAY_NAMES = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

        // Day of week with most meters
        const dayMeters = [0, 0, 0, 0, 0, 0, 0];
        const daySessions = [0, 0, 0, 0, 0, 0, 0];
        userEntries.forEach(e => {
          const day = new Date(e.date).getDay();
          dayMeters[day] += e.meters;
          daySessions[day]++;
        });
        const bestDayIdx = dayMeters.indexOf(Math.max(...dayMeters));
        const bestDay = DAY_NAMES[bestDayIdx];

        // Average meters per session
        const totalMeters = userEntries.reduce((s, e) => s + e.meters, 0);
        const avgMeters = Math.round(totalMeters / userEntries.length);

        // Longest single row
        const longestRow = Math.max(...userEntries.map(e => e.meters));

        // Most meters in a single day
        const dayTotals = {};
        userEntries.forEach(e => {
          const key = new Date(e.date).toDateString();
          dayTotals[key] = (dayTotals[key] || 0) + e.meters;
        });
        const bestSingleDay = Math.max(...Object.values(dayTotals));
        const bestSingleDayDate = Object.entries(dayTotals).find(([, v]) => v === bestSingleDay)?.[0];

        // Most productive month
        const monthTotals = {};
        userEntries.forEach(e => {
          const d = new Date(e.date);
          const key = `${d.getFullYear()}-${d.getMonth()}`;
          const label = d.toLocaleDateString('en-US', { month: 'short', year: 'numeric' });
          if (!monthTotals[key]) monthTotals[key] = { meters: 0, label };
          monthTotals[key].meters += e.meters;
        });
        const bestMonth = Object.values(monthTotals).sort((a, b) => b.meters - a.meters)[0];

        // Total time & calories
        const totalTime = userEntries.reduce((s, e) => s + (e.time || 0), 0);
        const totalCalories = userEntries.reduce((s, e) => s + (e.calories || 0), 0);

        // Current & longest streak
        const currentStreak = calculateStreak(currentUser.uid);
        const longestStreak = calculateLongestStreak(currentUser.uid);

        // Unique days rowed
        const uniqueDays = new Set(userEntries.map(e => new Date(e.date).toDateString())).size;

        // Sessions per day of week (bar chart data)
        const maxDaySessions = Math.max(...daySessions);

        return (
          <div className="fun-stats-section">
            <h3><Icon name="ui_records" size={18} /> Your Stats</h3>
            <div className="fun-stats-grid">
              <div className="fun-stat-card highlight">
                <span className="fun-stat-label">Best Day</span>
                <span className="fun-stat-value">{bestDay}s</span>
                <span className="fun-stat-sub">{formatMeters(dayMeters[bestDayIdx])} total</span>
              </div>
              <div className="fun-stat-card">
                <span className="fun-stat-label">Avg / Session</span>
                <span className="fun-stat-value">{formatMeters(avgMeters)}</span>
              </div>
              <div className="fun-stat-card">
                <span className="fun-stat-label">Best Single Day</span>
                <span className="fun-stat-value">{formatMeters(bestSingleDay)}</span>
                <span className="fun-stat-sub">{bestSingleDayDate ? new Date(bestSingleDayDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }) : ''}</span>
              </div>
              <div className="fun-stat-card">
                <span className="fun-stat-label">Best Month</span>
                <span className="fun-stat-value">{formatMeters(bestMonth?.meters || 0)}</span>
                <span className="fun-stat-sub">{bestMonth?.label}</span>
              </div>
              <div className="fun-stat-card">
                <span className="fun-stat-label">Longest Row</span>
                <span className="fun-stat-value">{formatMeters(longestRow)}</span>
              </div>
              <div className="fun-stat-card">
                <span className="fun-stat-label">Longest Streak</span>
                <span className="fun-stat-value">{longestStreak} days</span>
                {currentStreak > 0 && <span className="fun-stat-sub"><Icon name="ui_fire" size={12} /> {currentStreak} now</span>}
              </div>
              <div className="fun-stat-card">
                <span className="fun-stat-label">Days Rowed</span>
                <span className="fun-stat-value">{uniqueDays}</span>
              </div>
              {totalTime > 0 && (
                <div className="fun-stat-card">
                  <span className="fun-stat-label">Total Time</span>
                  <span className="fun-stat-value">{formatTimeDisplay(totalTime)}</span>
                </div>
              )}
              {totalCalories > 0 && (
                <div className="fun-stat-card">
                  <span className="fun-stat-label">Total Calories</span>
                  <span className="fun-stat-value">{totalCalories.toLocaleString()}</span>
                </div>
              )}
            </div>

            {/* Day of Week Distribution */}
            <div className="fun-stats-dow">
              <h4>Sessions by Day</h4>
              <div className="dow-bars">
                {DAY_NAMES.map((name, i) => (
                  <div key={i} className={`dow-bar-col ${i === bestDayIdx ? 'best' : ''}`}>
                    <div className="dow-bar-wrapper">
                      <div
                        className="dow-bar-fill"
                        style={{ height: `${maxDaySessions > 0 ? (daySessions[i] / maxDaySessions) * 100 : 0}%` }}
                      />
                    </div>
                    <span className="dow-bar-label">{name.charAt(0)}</span>
                    <span className="dow-bar-count">{daySessions[i]}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        );
      })()}

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
