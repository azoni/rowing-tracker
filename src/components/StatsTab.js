import React from 'react';
import Icon from './Icon';
import { useApp } from '../context/AppContext';
import { formatMeters, formatTimeDisplay, calculatePace } from '../utils';
import { ACHIEVEMENTS, RANKS, getUserRank, CHANGELOG } from '../constants';

function StatsTab() {
  const {
    currentUser, userProfile, isAdmin, entries,
    achievementsPage, setAchievementsPage, ACHIEVEMENTS_PAGE_SIZE,
    getUserAchievements, getAchievementProgress,
    setShowAchievementModal,
    setShowSessionHistory, setShowRankProgressModal,
    setShowAdminPanel, loadPendingReviews,
    handleSignOut, handleDeleteEntry, deletingEntryId,
  } = useApp();

  const [achievementFilter, setAchievementFilter] = React.useState('all');
  const [categoryFilter, setCategoryFilter] = React.useState('all');

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

  const filteredAchievements = ACHIEVEMENTS
    .filter(achievement => {
      // Status filter
      if (achievementFilter !== 'all') {
        const unlocked = currentUser ? getUserAchievements(currentUser.uid).some(a => a.id === achievement.id) : false;
        if (achievementFilter === 'completed' && !unlocked) return false;
        if (achievementFilter === 'incomplete' && unlocked) return false;
      }
      // Category filter
      if (categoryFilter !== 'all' && achievement.category !== categoryFilter) return false;
      return true;
    })
    .sort((a, b) => {
      // When viewing incomplete, sort by closest to completion first
      if (achievementFilter === 'incomplete' && currentUser) {
        const progA = getAchievementProgress(currentUser.uid, a);
        const progB = getAchievementProgress(currentUser.uid, b);
        const pctA = progA.target > 0 ? progA.current / progA.target : 0;
        const pctB = progB.target > 0 ? progB.current / progB.target : 0;
        return pctB - pctA; // Highest progress first
      }
      return 0; // Keep original order otherwise
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
            { key: 'completed', label: 'Completed' },
            { key: 'incomplete', label: 'Almost There' },
          ].map(f => (
            <button
              key={f.key}
              className={`achievement-filter-btn ${achievementFilter === f.key ? 'active' : ''}`}
              onClick={() => { setAchievementFilter(f.key); setAchievementsPage(0); }}
            >
              {f.label}
            </button>
          ))}
        </div>
        <div className="achievement-category-filters">
          {CATEGORIES.map(c => (
            <button
              key={c.key}
              className={`achievement-category-btn ${categoryFilter === c.key ? 'active' : ''}`}
              onClick={() => { setCategoryFilter(c.key); setAchievementsPage(0); }}
            >
              {c.label}
            </button>
          ))}
        </div>
        <div className="achievements-grid-full">
          {filteredAchievements.slice(achievementsPage * ACHIEVEMENTS_PAGE_SIZE, (achievementsPage + 1) * ACHIEVEMENTS_PAGE_SIZE).map((achievement) => {
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
        <div className="achievements-pagination">
          <button className="achievements-page-btn" onClick={() => setAchievementsPage(p => p - 1)} disabled={achievementsPage === 0}>← Prev</button>
          <span className="achievements-page-info">{achievementsPage + 1} / {Math.ceil(filteredAchievements.length / ACHIEVEMENTS_PAGE_SIZE) || 1}</span>
          <button className="achievements-page-btn" onClick={() => setAchievementsPage(p => p + 1)} disabled={(achievementsPage + 1) * ACHIEVEMENTS_PAGE_SIZE >= filteredAchievements.length}>Next →</button>
        </div>
      </div>

      {/* Rank Progression */}
      <div className="ranks-section">
        <h3><Icon name="ui_medal" size={18} /> Rank Progression</h3>
        <div className="ranks-list">
          {RANKS.map((rank, index) => {
            const userMeters = userProfile?.totalMeters || 0;
            const isCurrentRank = getUserRank(userMeters).title === rank.title;
            const isUnlocked = userMeters >= rank.minMeters;
            const nextRank = RANKS[index + 1];
            const progressToNext = nextRank
              ? Math.min(((userMeters - rank.minMeters) / (nextRank.minMeters - rank.minMeters)) * 100, 100)
              : 100;

            return (
              <div key={rank.title} className={`rank-item ${isCurrentRank ? 'current' : ''} ${isUnlocked ? 'unlocked' : 'locked'}`}>
                <span className="rank-item-emoji"><Icon name={rank.emoji} size={24} /></span>
                <div className="rank-item-info">
                  <span className="rank-item-title">{rank.title}</span>
                  <span className="rank-item-meters">{formatMeters(rank.minMeters)}m</span>
                  {isCurrentRank && nextRank && (
                    <div className="rank-progress-bar">
                      <div className="rank-progress-fill" style={{ width: `${progressToNext}%` }} />
                    </div>
                  )}
                </div>
                {isCurrentRank && <span className="rank-current-badge">YOU</span>}
                {isUnlocked && !isCurrentRank && <span className="rank-unlocked-check">✓</span>}
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

      {/* Session History */}
      {currentUser && (
        <div className="session-history-section">
          <h3><Icon name="ui_history" size={18} /> Your Session History</h3>
          <div className="session-history-list">
            {entries
              .filter(e => e.userId === currentUser.uid)
              .sort((a, b) => new Date(b.date) - new Date(a.date))
              .slice(0, 20)
              .map((entry, index) => (
                <div key={entry.id || index} className="session-history-item">
                  <div className="session-history-date">{new Date(entry.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}</div>
                  <div className="session-history-main">
                    <div className="session-history-meters">{entry.meters.toLocaleString()}m</div>
                    {(entry.time || entry.calories) && (
                      <div className="session-history-extra">
                        {entry.time && <span>{formatTimeDisplay(entry.time)}</span>}
                        {entry.calories && <span>{entry.calories} cal</span>}
                        {entry.time && entry.meters && <span className="session-pace">{calculatePace(entry.meters, entry.time)}/500m</span>}
                      </div>
                    )}
                  </div>
                  <div className={`session-history-status ${entry.verificationStatus || 'unverified'}`}>
                    {entry.verificationStatus === 'verified' ? '✓' : entry.verificationStatus === 'pending_review' ? '⏳' : '✗'}
                  </div>
                  <button className="session-delete-btn" onClick={() => handleDeleteEntry(entry.id, entry.meters)} disabled={deletingEntryId === entry.id} title="Delete entry">
                    {deletingEntryId === entry.id ? '...' : '🗑️'}
                  </button>
                </div>
              ))}
            {entries.filter(e => e.userId === currentUser.uid).length === 0 && (
              <p className="empty-history">No sessions yet. Start rowing!</p>
            )}
          </div>
        </div>
      )}

      {/* Changelog */}
      <div className="changelog-section">
        <h3><Icon name="ui_history" size={18} /> App Updates</h3>
        <div className="changelog">
          {CHANGELOG.map((release, index) => (
            <div key={release.version} className={`changelog-entry ${index === 0 ? 'latest' : ''}`}>
              <div className="changelog-header">
                <span className="changelog-version">v{release.version}</span>
                <span className="changelog-date">{new Date(release.date + 'T12:00:00-08:00').toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric', timeZone: 'America/Los_Angeles' })}</span>
                {index === 0 && <span className="latest-badge">LATEST</span>}
              </div>
              <ul className="changelog-changes">
                {release.changes.map((change, i) => <li key={i}>{change}</li>)}
              </ul>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

export default StatsTab;
