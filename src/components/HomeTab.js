import React from 'react';
import Icon from './Icon';
import { useApp } from '../context/AppContext';
import { formatMeters, formatTimeDisplay } from '../utils';
import { getUserRank, getNextRank, ACHIEVEMENTS, TIER_COLORS } from '../constants';

function HomeTab() {
  const {
    currentUser, userProfile, entries,
    dailyQuote, calculateStreak, getPersonalRecord,
    getUserAchievements, getAchievementProgress,
    setShowRankProgressModal, setShowAchievementModal,
  } = useApp();

  if (!currentUser || !userProfile) return null;

  const rank = getUserRank(userProfile.totalMeters);
  const nextRank = getNextRank(userProfile.totalMeters);
  const streak = calculateStreak(currentUser.uid);
  const pr = getPersonalRecord(currentUser.uid);
  const tierColor = TIER_COLORS[rank.tier] || '#00d4aa';

  // Get top 3 "almost there" achievements
  const almostThere = ACHIEVEMENTS
    .filter(a => !getUserAchievements(currentUser.uid).some(ua => ua.id === a.id))
    .map(a => {
      const progress = getAchievementProgress(currentUser.uid, a);
      const pct = progress.target > 0 ? progress.current / progress.target : 0;
      return { ...a, progress, pct };
    })
    .filter(a => a.pct > 0)
    .sort((a, b) => b.pct - a.pct)
    .slice(0, 3);

  // Recent rows (last 5)
  const recentRows = entries
    .filter(e => e.userId === currentUser.uid)
    .sort((a, b) => new Date(b.date) - new Date(a.date))
    .slice(0, 5);

  return (
    <section className="home-section">
      {/* Daily Quote */}
      {dailyQuote && (
        <div className="daily-quote">
          <p className="quote-text">"{dailyQuote.text}"</p>
          <p className="quote-author">— {dailyQuote.author}</p>
        </div>
      )}

      {/* Rank Card */}
      <div className="home-rank-card" style={{ borderColor: tierColor }} onClick={() => setShowRankProgressModal(true)}>
        <div className="home-rank-top">
          <Icon name={rank.emoji} size={36} />
          <div className="home-rank-info">
            <span className="home-rank-title">{rank.title}</span>
            <span className="home-rank-tier" style={{ color: tierColor }}>{rank.tier?.toUpperCase()}</span>
          </div>
        </div>
        {nextRank && (
          <div className="home-rank-progress">
            <div className="home-rank-bar">
              <div className="home-rank-fill" style={{ width: `${Math.min(((userProfile.totalMeters - rank.minMeters) / (nextRank.minMeters - rank.minMeters)) * 100, 100)}%`, background: tierColor }} />
            </div>
            <span className="home-rank-next">{formatMeters(nextRank.minMeters - userProfile.totalMeters)} to {nextRank.title}</span>
          </div>
        )}
      </div>

      {/* Stats Grid */}
      <div className="home-stats-grid">
        <div className="home-stat">
          <span className="home-stat-value">{formatMeters(userProfile.totalMeters)}</span>
          <span className="home-stat-label">total meters</span>
        </div>
        <div className="home-stat">
          <span className="home-stat-value">{userProfile.uploadCount || 0}</span>
          <span className="home-stat-label">sessions</span>
        </div>
        <div className="home-stat">
          <span className="home-stat-value">{pr > 0 ? formatMeters(pr) : '—'}</span>
          <span className="home-stat-label">best row</span>
        </div>
        <div className="home-stat">
          <span className="home-stat-value" style={{ color: streak > 0 ? '#ff6b35' : 'var(--text-muted)' }}>
            {streak > 0 ? streak : '0'}
          </span>
          <span className="home-stat-label">{streak === 1 ? 'day streak' : 'day streak'}</span>
        </div>
      </div>

      {/* Almost There Achievements */}
      {almostThere.length > 0 && (
        <div className="home-almost-there">
          <h3>Almost There</h3>
          {almostThere.map(a => (
            <div key={a.id} className="home-achievement-row" onClick={() => setShowAchievementModal({ ...a, progress: a.progress })}>
              <Icon name={a.emoji} size={20} />
              <div className="home-achievement-info">
                <span className="home-achievement-name">{a.name}</span>
                <div className="home-achievement-bar">
                  <div className="home-achievement-fill" style={{ width: `${Math.min(a.pct * 100, 100)}%` }} />
                </div>
              </div>
              <span className="home-achievement-pct">{Math.round(a.pct * 100)}%</span>
            </div>
          ))}
        </div>
      )}

      {/* Recent Rows */}
      {recentRows.length > 0 && (
        <div className="home-recent">
          <h3>Recent Rows</h3>
          {recentRows.map((row, i) => (
            <div key={row.id || i} className="home-recent-row">
              <span className="home-recent-date">
                {new Date(row.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
              </span>
              <span className="home-recent-meters">{row.meters.toLocaleString()}m</span>
              {row.time && <span className="home-recent-time">{formatTimeDisplay(row.time)}</span>}
              <span className={`home-recent-status ${row.verificationStatus || 'unverified'}`}>
                {row.verificationStatus === 'verified' ? <Icon name="ui_check" size={12} /> :
                 row.verificationStatus === 'pending_review' ? <Icon name="ui_pending" size={12} /> :
                 <Icon name="ui_unverified" size={12} />}
              </span>
            </div>
          ))}
        </div>
      )}
    </section>
  );
}

export default HomeTab;
