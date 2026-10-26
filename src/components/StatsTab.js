import React from 'react';
import Icon from './Icon';
import { useApp } from '../context/AppContext';
import { formatMeters, formatTimeDisplay } from '../utils';
import { ACHIEVEMENTS } from '../constants';
import { formatAchievementProgress } from '../utils/achievementDisplay';
import RowingAnalytics from './RowingAnalytics';
import { getAnalyticsEntries, summarizeRows } from '../utils/rowingAnalytics';
import { getBestRowStreak } from '../utils/rowingGoals';
import './ProgressAndCrew.css';
import './ProgressShowcase.css';

const PAGE_SIZE = 6;
const CATEGORIES = ['distance', 'sessions', 'streaks', 'time', 'calories', 'pace', 'habits', 'fun', 'milestones'];
const earnedDate = value => {
  if (!value) return null;
  const date = value?.toDate ? value.toDate() : new Date(value);
  return Number.isFinite(date.getTime()) ? date : null;
};

function StatsTab() {
  const {
    currentUser, isAdmin, entries,
    getUserAchievements, getAchievementProgress, setShowAchievementModal,
    setShowSessionHistory, setShowRankProgressModal, setShowSettingsModal,
    setShowAdminPanel, loadPendingReviews, handleSignOut, handleSignIn,
    setShowLogModal,
  } = useApp();
  const [achievementFilter, setAchievementFilter] = React.useState('next');
  const [categoryFilter, setCategoryFilter] = React.useState('all');
  const [search, setSearch] = React.useState('');
  const [page, setPage] = React.useState(0);
  const filter = currentUser ? achievementFilter : 'all';
  const earned = currentUser ? getUserAchievements(currentUser.uid) : [];
  const earnedById = new Map(earned.map(achievement => [achievement.id, achievement]));
  const query = search.trim().toLocaleLowerCase();
  const latestEarned = [...earned].sort((a, b) => (earnedDate(b.unlockedDate)?.getTime() || 0) - (earnedDate(a.unlockedDate)?.getTime() || 0))[0];
  const achievementItems = ACHIEVEMENTS.map(achievement => ({
    achievement,
    earned: earnedById.get(achievement.id),
    progress: currentUser ? getAchievementProgress(currentUser.uid, achievement) : { current: 0, target: 1 },
  })).filter(item => (
    (filter === 'all' || (filter === 'earned' ? !!item.earned : !item.earned)) &&
    (categoryFilter === 'all' || (categoryFilter.startsWith('level:')
      ? item.achievement.difficulty === categoryFilter.slice(6) : item.achievement.category === categoryFilter)) &&
    (!query || [item.achievement.name, item.achievement.desc, item.achievement.category, item.achievement.difficulty].filter(Boolean).join(' ').toLocaleLowerCase().includes(query))
  )).sort((a, b) => {
    if (filter === 'next') {
      return (b.progress.target > 0 ? b.progress.current / b.progress.target : 0) -
        (a.progress.target > 0 ? a.progress.current / a.progress.target : 0);
    }
    if (filter === 'earned') return (earnedDate(b.earned?.unlockedDate)?.getTime() || 0) - (earnedDate(a.earned?.unlockedDate)?.getTime() || 0);
    return 0;
  });
  const totalPages = Math.max(1, Math.ceil(achievementItems.length / PAGE_SIZE));
  const currentPage = Math.min(page, totalPages - 1);
  const pageItems = achievementItems.slice(currentPage * PAGE_SIZE, (currentPage + 1) * PAGE_SIZE);
  const userEntries = currentUser ? getAnalyticsEntries(entries, currentUser.uid) : [];
  const { meters: totalMeters, seconds: totalTime, activeDays, timedSessions } = summarizeRows(userEntries);
  const longestRow = userEntries.reduce((best, entry) => Math.max(best, Number(entry.meters) || 0), 0);
  const averageRow = userEntries.length ? Math.round(totalMeters / userEntries.length) : 0;
  const bestStreak = getBestRowStreak(userEntries);

  return (
    <section className="more-section progress-screen progress-showcase" aria-labelledby="progress-heading">
      <div className="progress-page-heading">
        <div><h2 id="progress-heading">Your progress</h2><p>Your logbook, over the long run.</p></div>
        {currentUser && <button className="progress-history-link" onClick={() => setShowSessionHistory(true)}><Icon name="ui_history" size={16} /> History</button>}
      </div>
      {currentUser ? (
        <>
          <div className="progress-overview">
            <div className="progress-total"><span>Lifetime distance</span><strong>{formatMeters(totalMeters)}<small>m</small></strong><span>{userEntries.length.toLocaleString()} {userEntries.length === 1 ? 'row' : 'rows'} in the books</span></div>
            <div className="progress-overview-secondary"><div><strong>{activeDays}</strong><span>days rowed</span></div><div><strong>{totalTime > 0 ? formatTimeDisplay(totalTime) : '—'}</strong><span>recorded time</span><small>{timedSessions} of {userEntries.length} rows have a time</small></div></div>
          </div>
          {userEntries.length > 0 ? (
            <div className="progress-records" aria-label="Your rowing records">
              <div><Icon name="ui_trophy" size={17} /><strong>{formatMeters(longestRow)}m</strong><span>longest row</span></div>
              <div><Icon name="ui_rowing" size={17} /><strong>{formatMeters(averageRow)}m</strong><span>average row</span></div>
              <div><Icon name="ui_fire" size={17} /><strong>{bestStreak} {bestStreak === 1 ? 'day' : 'days'}</strong><span>best streak</span></div>
            </div>
          ) : (
            <div className="progress-first-row"><p>Your first row starts the story. Add a monitor photo or enter your distance.</p><button onClick={() => setShowLogModal(true)}>Log your first row <span aria-hidden="true">→</span></button></div>
          )}
        </>
      ) : (
        <div className="progress-guest"><p>Keep your rowing history, see your progress, and collect achievements along the way.</p><button onClick={handleSignIn}>Sign in to track your rows</button></div>
      )}
      {currentUser && <RowingAnalytics entries={entries} userId={currentUser.uid} />}
      <div className="progress-achievements">
        <div className="progress-section-heading"><div><h3>Achievements</h3><p>A collection built one row at a time.</p></div><span className="progress-earned-count">{currentUser ? `${earned.length} / ${ACHIEVEMENTS.length} earned` : `${ACHIEVEMENTS.length} to discover`}</span></div>
        {currentUser && latestEarned && <button className="progress-latest-earned" onClick={() => {
          const achievement = ACHIEVEMENTS.find(item => item.id === latestEarned.id);
          if (achievement) setShowAchievementModal({ ...achievement, progress: getAchievementProgress(currentUser.uid, achievement), unlockedDate: latestEarned.unlockedDate });
        }}><span className="progress-latest-icon" aria-hidden="true"><Icon name={latestEarned.emoji} size={24} /></span><span><small>{earnedDate(latestEarned.unlockedDate) ? 'Latest in your collection' : 'In your collection'}</small><strong>{latestEarned.name}</strong></span><span className="progress-latest-detail">View badge <span aria-hidden="true">›</span></span></button>}
        {currentUser && <div className="progress-status-filters" role="group" aria-label="Achievement status">
          {[{ key: 'next', label: 'Next up' }, { key: 'earned', label: 'Earned' }, { key: 'all', label: 'All badges' }].map(item => <button key={item.key} aria-pressed={filter === item.key} className={filter === item.key ? 'active' : ''} onClick={() => { setAchievementFilter(item.key); setPage(0); }}>{item.label}</button>)}
        </div>}
        <div className="progress-library-tools">
          <label className="progress-search"><span>Find a badge</span><span className="progress-search-field"><Icon name="ui_search" size={18} /><input type="search" value={search} placeholder="Name or challenge…" onChange={event => { setSearch(event.target.value); setPage(0); }} /></span></label>
          <label className="progress-category"><span>Category or level</span><select value={categoryFilter} onChange={event => { setCategoryFilter(event.target.value); setPage(0); }}><option value="all">All categories</option><optgroup label="Badge levels">{['starter', 'build', 'stretch'].map(level => <option key={level} value={`level:${level}`}>{level.charAt(0).toUpperCase() + level.slice(1)}</option>)}</optgroup><optgroup label="Categories">{CATEGORIES.map(category => <option key={category} value={category}>{category.charAt(0).toUpperCase() + category.slice(1)}</option>)}</optgroup></select></label>
        </div>
        <div className="progress-library-summary"><p aria-live="polite" aria-atomic="true">{achievementItems.length} {achievementItems.length === 1 ? 'badge' : 'badges'}{filter === 'next' ? ' to work toward, closest first' : filter === 'earned' ? ' earned, newest first' : ' to explore'}{query ? ` matching “${search.trim()}”` : ''}</p>{(query || categoryFilter !== 'all') && <button onClick={() => { setSearch(''); setCategoryFilter('all'); setPage(0); }}>Clear filters</button>}</div>
        <div className="progress-badge-list">
          {pageItems.map(({ achievement, progress, earned: unlocked }) => {
            const percent = Math.min(100, Math.max(0, progress.target > 0 ? progress.current / progress.target * 100 : 0));
            return <button key={achievement.id} className={`progress-badge-card ${unlocked ? 'is-earned' : ''}`} onClick={() => setShowAchievementModal({ ...achievement, progress, unlockedDate: unlocked?.unlockedDate })}>
              <span className="progress-badge-icon"><Icon name={achievement.emoji} size={27} /></span>
              <span className="progress-badge-copy"><strong>{achievement.name}</strong>{achievement.difficulty && <span className={`badge-difficulty is-${achievement.difficulty}`}>{achievement.difficulty}</span>}<span className="progress-badge-description">{achievement.desc}</span>
                {unlocked ? <span className="progress-badge-earned"><Icon name="ui_check" size={12} /> Earned{earnedDate(unlocked.unlockedDate) ? ` · ${earnedDate(unlocked.unlockedDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}` : ''}</span> : currentUser && <><span className="progress-badge-meter" aria-hidden="true"><span style={{ width: `${percent}%` }} /></span><span className="progress-badge-numbers">{formatAchievementProgress(achievement, progress)}<span>{Math.floor(percent)}%</span></span></>}
              </span><span className="progress-badge-arrow" aria-hidden="true">›</span>
            </button>;
          })}
        </div>
        {pageItems.length === 0 && <div className="progress-no-badges"><Icon name="ui_medal" size={28} /><p>{query || categoryFilter !== 'all' ? 'No badges match these filters. Try another name or category.' : filter === 'earned' ? 'Your collection starts with your next row.' : filter === 'next' ? 'You have earned every badge in this collection.' : 'No badges in this view.'}</p><button onClick={() => { setAchievementFilter('all'); setCategoryFilter('all'); setSearch(''); setPage(0); }}>Explore all badges</button></div>}
        {totalPages > 1 && <div className="progress-pagination"><button onClick={() => setPage(currentPage - 1)} disabled={currentPage === 0} aria-label="Previous achievements">← Previous</button><span aria-live="polite">{currentPage + 1} of {totalPages}</span><button onClick={() => setPage(currentPage + 1)} disabled={currentPage + 1 >= totalPages} aria-label="Next achievements">Next →</button></div>}
      </div>
      {currentUser && <div className="account-section progress-account"><h3>Your rowing toolkit</h3><div className="account-buttons">
        <button className="account-btn" onClick={() => setShowSessionHistory(true)}><span className="account-btn-icon"><Icon name="ui_history" size={18} /></span><span className="account-btn-text">Session history</span><span aria-hidden="true">→</span></button>
        <button className="account-btn" onClick={() => setShowRankProgressModal(true)}><span className="account-btn-icon"><Icon name="ui_medal" size={18} /></span><span className="account-btn-text">Ranks & next level</span><span aria-hidden="true">→</span></button>
        <button className="account-btn" onClick={() => setShowSettingsModal(true)}><span className="account-btn-icon"><Icon name="ui_settings" size={18} /></span><span className="account-btn-text">Profile & settings</span><span aria-hidden="true">→</span></button>
        {isAdmin && <button className="account-btn admin" onClick={() => { setShowAdminPanel(true); loadPendingReviews(); }}><span className="account-btn-icon"><Icon name="ui_shield" size={18} /></span><span className="account-btn-text">Admin panel</span><span aria-hidden="true">→</span></button>}
      </div><button className="progress-signout" onClick={handleSignOut}>Sign out</button></div>}
    </section>
  );
}

export default StatsTab;
