import React from 'react';
import Icon from './Icon';
import { useApp } from '../context/AppContext';
import { formatMeters, formatTimeDisplay } from '../utils';
import { ACHIEVEMENTS } from '../constants';
import { formatAchievementProgress } from '../utils/achievementDisplay';
import './ProgressAndCrew.css';

const PAGE_SIZE = 6;
const CATEGORIES = ['distance', 'sessions', 'streaks', 'time', 'calories', 'pace', 'habits', 'fun', 'milestones'];

function StatsTab() {
  const {
    currentUser, isAdmin, entries,
    getUserAchievements, getAchievementProgress, setShowAchievementModal,
    setShowSessionHistory, setShowRankProgressModal, setShowSettingsModal,
    setShowAdminPanel, loadPendingReviews, handleSignOut, handleSignIn,
    calculateLongestStreak, setShowLogModal,
  } = useApp();
  const [achievementFilter, setAchievementFilter] = React.useState('next');
  const [categoryFilter, setCategoryFilter] = React.useState('all');
  const [page, setPage] = React.useState(0);
  const filter = currentUser ? achievementFilter : 'all';
  const earned = currentUser ? getUserAchievements(currentUser.uid) : [];
  const earnedById = new Map(earned.map(achievement => [achievement.id, achievement]));
  const achievementItems = ACHIEVEMENTS.map(achievement => ({
    achievement,
    earned: earnedById.get(achievement.id),
    progress: currentUser ? getAchievementProgress(currentUser.uid, achievement) : { current: 0, target: 1 },
  })).filter(item => (
    (filter === 'all' || (filter === 'earned' ? !!item.earned : !item.earned)) &&
    (categoryFilter === 'all' || item.achievement.category === categoryFilter)
  )).sort((a, b) => {
    if (filter === 'next') {
      return (b.progress.target > 0 ? b.progress.current / b.progress.target : 0) -
        (a.progress.target > 0 ? a.progress.current / a.progress.target : 0);
    }
    if (filter === 'earned') return (new Date(b.earned?.unlockedDate).getTime() || 0) - (new Date(a.earned?.unlockedDate).getTime() || 0);
    return 0;
  });
  const totalPages = Math.max(1, Math.ceil(achievementItems.length / PAGE_SIZE));
  const currentPage = Math.min(page, totalPages - 1);
  const pageItems = achievementItems.slice(currentPage * PAGE_SIZE, (currentPage + 1) * PAGE_SIZE);
  const userEntries = currentUser ? entries.filter(entry => entry.userId === currentUser.uid) : [];
  const totalMeters = userEntries.reduce((sum, entry) => sum + (Number(entry.meters) || 0), 0);
  const totalTime = userEntries.reduce((sum, entry) => sum + (Number(entry.time) || 0), 0);
  const activeDays = new Set(userEntries.map(entry => new Date(entry.date).toDateString())).size;
  const longestRow = userEntries.reduce((best, entry) => Math.max(best, Number(entry.meters) || 0), 0);
  const averageRow = userEntries.length ? Math.round(totalMeters / userEntries.length) : 0;

  return (
    <section className="more-section progress-screen" aria-labelledby="progress-heading">
      <div className="progress-page-heading">
        <div><span className="crew-eyebrow">Every row adds up</span><h2 id="progress-heading">Your progress</h2></div>
        {currentUser && <button className="progress-history-link" onClick={() => setShowSessionHistory(true)}><Icon name="ui_history" size={16} /> History</button>}
      </div>
      {currentUser ? (
        <>
          <div className="progress-overview">
            <div className="progress-total"><span>Lifetime distance</span><strong>{formatMeters(totalMeters)}<small>m</small></strong><span>{userEntries.length.toLocaleString()} {userEntries.length === 1 ? 'row' : 'rows'} in the books</span></div>
            <div className="progress-overview-secondary"><div><strong>{activeDays}</strong><span>days rowed</span></div><div><strong>{totalTime > 0 ? formatTimeDisplay(totalTime) : '—'}</strong><span>recorded time</span></div></div>
          </div>
          {userEntries.length > 0 ? (
            <div className="progress-records" aria-label="Your rowing records">
              <div><Icon name="ui_trophy" size={17} /><strong>{formatMeters(longestRow)}m</strong><span>longest row</span></div>
              <div><Icon name="ui_rowing" size={17} /><strong>{formatMeters(averageRow)}m</strong><span>average row</span></div>
              <div><Icon name="ui_fire" size={17} /><strong>{calculateLongestStreak(currentUser.uid)} days</strong><span>best streak</span></div>
            </div>
          ) : (
            <div className="progress-first-row"><p>Your first row starts the story. Add a monitor photo or enter your distance.</p><button onClick={() => setShowLogModal(true)}>Log your first row <span aria-hidden="true">→</span></button></div>
          )}
        </>
      ) : (
        <div className="progress-guest"><p>Keep your rowing history, see your progress, and collect achievements along the way.</p><button onClick={handleSignIn}>Sign in to track your rows</button></div>
      )}
      <div className="progress-achievements">
        <div className="progress-section-heading"><div><span className="crew-eyebrow">Small wins. Great stories.</span><h3>Achievements</h3></div><span className="progress-earned-count">{currentUser ? `${earned.length} / ${ACHIEVEMENTS.length} earned` : `${ACHIEVEMENTS.length} to discover`}</span></div>
        {currentUser && <div className="progress-status-filters" role="group" aria-label="Achievement status">
          {[{ key: 'next', label: 'Next up' }, { key: 'earned', label: 'Earned' }, { key: 'all', label: 'All badges' }].map(item => <button key={item.key} aria-pressed={filter === item.key} className={filter === item.key ? 'active' : ''} onClick={() => { setAchievementFilter(item.key); setPage(0); }}>{item.label}</button>)}
        </div>}
        <div className="progress-library-tools"><p>{filter === 'next' ? 'Your closest milestones, with a few new ideas.' : filter === 'earned' ? 'The milestones you have made your own.' : 'Pick a challenge that fits your next row.'}</p><label><span className="crew-sr-only">Achievement category</span><select value={categoryFilter} onChange={event => { setCategoryFilter(event.target.value); setPage(0); }}><option value="all">All categories</option>{CATEGORIES.map(category => <option key={category} value={category}>{category.charAt(0).toUpperCase() + category.slice(1)}</option>)}</select></label></div>
        <div className="progress-badge-list">
          {pageItems.map(({ achievement, progress, earned: unlocked }) => {
            const percent = Math.min(100, Math.max(0, progress.target > 0 ? progress.current / progress.target * 100 : 0));
            return <button key={achievement.id} className={`progress-badge-card ${unlocked ? 'is-earned' : ''}`} onClick={() => setShowAchievementModal({ ...achievement, progress, unlockedDate: unlocked?.unlockedDate })}>
              <span className="progress-badge-icon"><Icon name={achievement.emoji} size={27} /></span>
              <span className="progress-badge-copy"><strong>{achievement.name}</strong><span className="progress-badge-description">{achievement.desc}</span>
                {unlocked ? <span className="progress-badge-earned"><Icon name="ui_check" size={12} /> Earned{unlocked.unlockedDate ? ` · ${new Date(unlocked.unlockedDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}` : ''}</span> : currentUser && <><span className="progress-badge-meter" aria-hidden="true"><span style={{ width: `${percent}%` }} /></span><span className="progress-badge-numbers">{formatAchievementProgress(achievement, progress)}<span>{Math.floor(percent)}%</span></span></>}
              </span><span className="progress-badge-arrow" aria-hidden="true">›</span>
            </button>;
          })}
        </div>
        {pageItems.length === 0 && <div className="progress-no-badges"><Icon name="ui_medal" size={28} /><p>{filter === 'earned' ? 'Your collection starts with your next row.' : 'No badges in this view.'}</p><button onClick={() => { setAchievementFilter('all'); setCategoryFilter('all'); setPage(0); }}>Explore all badges</button></div>}
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
