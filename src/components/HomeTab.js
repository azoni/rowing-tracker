import React from 'react';
import Icon from './Icon';
import WorldProgress from './WorldProgress';
import { useApp } from '../context/AppContext';
import { formatMeters, formatTimeDisplay, calculatePace } from '../utils';
import { getUserRank, getNextRank, ACHIEVEMENTS, TIER_COLORS } from '../constants';

// Monthly competitive challenges — top 3 get reward badges
// type: 'fastest_distance' (lowest time for X meters), 'longest_row' (most meters single session),
//       'most_meters' (total meters in month), 'best_pace' (best /500m pace)
const MONTHLY_CHALLENGES = [
  { id: 'fastest-2k', label: 'Fastest 2K', description: 'Best 2,000m time', type: 'fastest_distance', distance: 2000 },       // Jan
  { id: 'longest-row', label: 'Longest Single Row', description: 'Most meters in one session', type: 'longest_row' },           // Feb
  { id: 'fastest-500', label: 'Fastest 500m', description: 'Best 500m time', type: 'fastest_distance', distance: 500 },         // Mar
  { id: 'most-meters', label: 'Most Meters', description: 'Total meters this month', type: 'most_meters' },                     // Apr
  { id: 'fastest-1k', label: 'Fastest 1K', description: 'Best 1,000m time', type: 'fastest_distance', distance: 1000 },         // May
  { id: 'best-pace', label: 'Best Avg Pace', description: 'Fastest average /500m pace', type: 'best_pace' },                    // Jun
  { id: 'fastest-5k', label: 'Fastest 5K', description: 'Best 5,000m time', type: 'fastest_distance', distance: 5000 },         // Jul
  { id: 'longest-row-2', label: 'Longest Single Row', description: 'Most meters in one session', type: 'longest_row' },         // Aug
  { id: 'fastest-2k-2', label: 'Fastest 2K', description: 'Best 2,000m time', type: 'fastest_distance', distance: 2000 },       // Sep
  { id: 'most-meters-2', label: 'Most Meters', description: 'Total meters this month', type: 'most_meters' },                   // Oct
  { id: 'fastest-500-2', label: 'Fastest 500m', description: 'Best 500m time', type: 'fastest_distance', distance: 500 },       // Nov
  { id: 'best-pace-2', label: 'Best Avg Pace', description: 'Fastest average /500m pace', type: 'best_pace' },                  // Dec
];

const THROWDOWNS = [
  { type: 'distance', target: 50000, label: 'Row 50K', unit: 'm', field: 'meters' },
  { type: 'streak', target: 14, label: '14-Day Streak', unit: ' days', field: 'streak' },
  { type: 'sessions', target: 20, label: '20 Sessions', unit: '', field: 'sessions' },
  { type: 'distance', target: 75000, label: 'Row 75K', unit: 'm', field: 'meters' },
  { type: 'calories', target: 10000, label: 'Burn 10K Cal', unit: ' cal', field: 'calories' },
  { type: 'distance', target: 100000, label: 'Row 100K', unit: 'm', field: 'meters' },
  { type: 'sessions', target: 25, label: '25 Sessions', unit: '', field: 'sessions' },
  { type: 'streak', target: 21, label: '21-Day Streak', unit: ' days', field: 'streak' },
  { type: 'distance', target: 60000, label: 'Row 60K', unit: 'm', field: 'meters' },
  { type: 'calories', target: 15000, label: 'Burn 15K Cal', unit: ' cal', field: 'calories' },
  { type: 'sessions', target: 22, label: '22 Sessions', unit: '', field: 'sessions' },
  { type: 'distance', target: 80000, label: 'Row 80K', unit: 'm', field: 'meters' },
];

function HomeTab() {
  const {
    currentUser, userProfile, entries, users,
    calculateStreak, getPersonalRecord,
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
      <WorldProgress />

      {/* Monthly Throwdown */}
      {(() => {
        const now = new Date();
        const month = now.getMonth();
        const monthName = now.toLocaleDateString('en-US', { month: 'long' });
        const daysLeft = new Date(now.getFullYear(), month + 1, 0).getDate() - now.getDate();
        const throwdown = THROWDOWNS[month];

        const monthStart = new Date(now.getFullYear(), month, 1);
        const monthEntries = entries.filter(e => e.userId === currentUser.uid && new Date(e.date) >= monthStart);
        let current = 0;
        if (throwdown.field === 'meters') current = monthEntries.reduce((s, e) => s + e.meters, 0);
        else if (throwdown.field === 'sessions') current = monthEntries.length;
        else if (throwdown.field === 'calories') current = monthEntries.reduce((s, e) => s + (e.calories || 0), 0);
        else if (throwdown.field === 'streak') current = calculateStreak(currentUser.uid);
        const pct = Math.min((current / throwdown.target) * 100, 100);
        const complete = current >= throwdown.target;

        return (
          <div className={`throwdown-banner ${complete ? 'complete' : ''}`}>
            <div className="throwdown-header">
              <span className="throwdown-title"><Icon name="ui_fire" size={14} /> {monthName} Throwdown</span>
              <span className="throwdown-days">{daysLeft}d left</span>
            </div>
            <div className="throwdown-goal">
              {complete ? <><Icon name="ui_check" size={14} /> Completed!</> : throwdown.label}
            </div>
            <div className="throwdown-bar">
              <div className="throwdown-fill" style={{ width: `${pct}%` }} />
            </div>
            <div className="throwdown-progress">
              {throwdown.field === 'meters' ? formatMeters(current) : current.toLocaleString()}{throwdown.unit} / {throwdown.field === 'meters' ? formatMeters(throwdown.target) : throwdown.target.toLocaleString()}{throwdown.unit}
            </div>
          </div>
        );
      })()}

      {/* Monthly Challenge */}
      {(() => {
        const now = new Date();
        const month = now.getMonth();
        const monthName = now.toLocaleDateString('en-US', { month: 'long' });
        const challenge = MONTHLY_CHALLENGES[month];
        const daysLeft = new Date(now.getFullYear(), month + 1, 0).getDate() - now.getDate();
        const monthStart = new Date(now.getFullYear(), month, 1);

        // Compute leaderboard for this challenge
        const allMonthEntries = entries.filter(e => new Date(e.date) >= monthStart);

        const getScore = (userId) => {
          const userEntries = allMonthEntries.filter(e => e.userId === userId && e.time && e.time > 0 && e.meters > 0);
          if (challenge.type === 'fastest_distance') {
            // Find entries close to the target distance (within 10%)
            const tolerance = challenge.distance * 0.1;
            const qualifying = userEntries.filter(e => Math.abs(e.meters - challenge.distance) <= tolerance);
            if (qualifying.length === 0) return null;
            const best = qualifying.reduce((best, e) => (!best || e.time < best.time) ? e : best, null);
            return best ? { value: best.time, display: formatTimeDisplay(best.time), sort: best.time } : null;
          } else if (challenge.type === 'longest_row') {
            const allUserEntries = allMonthEntries.filter(e => e.userId === userId);
            if (allUserEntries.length === 0) return null;
            const best = Math.max(...allUserEntries.map(e => e.meters));
            return { value: best, display: formatMeters(best), sort: -best };
          } else if (challenge.type === 'most_meters') {
            const allUserEntries = allMonthEntries.filter(e => e.userId === userId);
            const total = allUserEntries.reduce((s, e) => s + e.meters, 0);
            if (total === 0) return null;
            return { value: total, display: formatMeters(total), sort: -total };
          } else if (challenge.type === 'best_pace') {
            if (userEntries.length === 0) return null;
            const paces = userEntries.map(e => (e.time / e.meters) * 500);
            const bestPace = Math.min(...paces);
            const mins = Math.floor(bestPace / 60);
            const secs = (bestPace % 60).toFixed(1).padStart(4, '0');
            return { value: bestPace, display: `${mins}:${secs}/500m`, sort: bestPace };
          }
          return null;
        };

        // Build leaderboard from all users
        const leaderboard = Object.keys(users)
          .map(uid => {
            const score = getScore(uid);
            if (!score) return null;
            return { userId: uid, user: users[uid], ...score };
          })
          .filter(Boolean)
          .sort((a, b) => a.sort - b.sort)
          .slice(0, 3);

        // Current user's score
        const myScore = currentUser ? getScore(currentUser.uid) : null;
        const myRank = currentUser ? leaderboard.findIndex(l => l.userId === currentUser.uid) + 1 : 0;

        return (
          <div className="challenge-banner">
            <div className="challenge-banner-header">
              <span className="challenge-banner-title"><Icon name="ui_trophy" size={14} /> {monthName} Challenge</span>
              <span className="challenge-banner-days">{daysLeft}d left</span>
            </div>
            <div className="challenge-banner-name">{challenge.label}</div>
            <div className="challenge-banner-desc">{challenge.description}</div>

            {myScore && (
              <div className="challenge-banner-my-score">
                Your best: <strong>{myScore.display}</strong>
                {myRank > 0 && <span className="challenge-banner-my-rank"> (#{myRank})</span>}
              </div>
            )}
            {!myScore && (
              <div className="challenge-banner-my-score muted">No qualifying entries yet</div>
            )}

            {leaderboard.length > 0 && (
              <div className="challenge-banner-leaders">
                {leaderboard.map((entry, i) => (
                  <div key={entry.userId} className={`challenge-leader ${entry.userId === currentUser?.uid ? 'is-you' : ''}`}>
                    <span className="challenge-leader-rank">
                      {i === 0 ? <Icon name="ui_gold" size={14} /> : i === 1 ? <Icon name="ui_silver" size={14} /> : <Icon name="ui_bronze" size={14} />}
                    </span>
                    <span className="challenge-leader-name">{entry.user?.name?.split(' ')[0] || 'User'}</span>
                    <span className="challenge-leader-score">{entry.display}</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        );
      })()}

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

      {/* Row Streak Heatmap */}
      {(() => {
        const userEntries = entries.filter(e => e.userId === currentUser.uid);
        if (userEntries.length === 0) return null;

        // Local date key to avoid UTC timezone shift
        const toLocalKey = (d) => {
          const date = new Date(d);
          return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
        };

        // Build day → meters map for last 3 months
        const dayMap = {};
        userEntries.forEach(e => {
          const key = toLocalKey(e.date);
          dayMap[key] = (dayMap[key] || 0) + e.meters;
        });

        // Generate last 12 weeks of days
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const weeks = [];
        const startDate = new Date(today);
        startDate.setDate(startDate.getDate() - (12 * 7 - 1) - startDate.getDay()); // Start on Sunday, 12 weeks ago

        for (let w = 0; w < 12; w++) {
          const week = [];
          for (let d = 0; d < 7; d++) {
            const date = new Date(startDate);
            date.setDate(startDate.getDate() + w * 7 + d);
            const key = toLocalKey(date);
            const meters = dayMap[key] || 0;
            const isFuture = date > today;
            week.push({ date, key, meters, isFuture });
          }
          weeks.push(week);
        }

        // Max meters for color scaling
        const maxMeters = Math.max(...Object.values(dayMap), 1);

        const getColor = (meters) => {
          if (!meters) return 'var(--bg-dark)';
          const intensity = Math.min(meters / maxMeters, 1);
          if (intensity < 0.25) return 'rgba(0, 212, 170, 0.2)';
          if (intensity < 0.5) return 'rgba(0, 212, 170, 0.4)';
          if (intensity < 0.75) return 'rgba(0, 212, 170, 0.65)';
          return 'rgba(0, 212, 170, 0.9)';
        };

        const monthLabels = [];
        let lastMonth = -1;
        weeks.forEach((week, wi) => {
          const m = week[0].date.getMonth();
          if (m !== lastMonth) {
            monthLabels.push({ index: wi, label: week[0].date.toLocaleDateString('en-US', { month: 'short' }) });
            lastMonth = m;
          }
        });

        return (
          <div className="home-heatmap">
            <h3>Activity</h3>
            <div className="heatmap-month-labels">
              {monthLabels.map((ml, i) => (
                <span key={i} className="heatmap-month" style={{ gridColumn: ml.index + 1 }}>{ml.label}</span>
              ))}
            </div>
            <div className="heatmap-grid">
              {['S', 'M', 'T', 'W', 'T', 'F', 'S'].map((d, i) => (
                <span key={i} className="heatmap-day-label">{i % 2 === 1 ? d : ''}</span>
              ))}
              {[0, 1, 2, 3, 4, 5, 6].map(dayOfWeek => (
                <React.Fragment key={dayOfWeek}>
                  {weeks.map((week, wi) => {
                    const cell = week[dayOfWeek];
                    return (
                      <div
                        key={cell.key}
                        className={`heatmap-cell ${cell.isFuture ? 'future' : ''}`}
                        style={{ background: cell.isFuture ? 'transparent' : getColor(cell.meters) }}
                        title={cell.meters ? `${cell.date.toLocaleDateString()}: ${cell.meters.toLocaleString()}m` : cell.date.toLocaleDateString()}
                      />
                    );
                  })}
                </React.Fragment>
              ))}
            </div>
          </div>
        );
      })()}

      {/* Pace Trend */}
      {(() => {
        const paceEntries = entries
          .filter(e => e.userId === currentUser.uid && e.time && e.time > 0 && e.meters && e.meters > 0)
          .sort((a, b) => new Date(a.date) - new Date(b.date))
          .slice(-20) // Last 20 sessions with pace data
          .map(e => ({
            date: new Date(e.date),
            pace: (e.time / e.meters) * 500, // seconds per 500m
          }));

        if (paceEntries.length < 3) return null;

        const minPace = Math.min(...paceEntries.map(p => p.pace));
        const maxPace = Math.max(...paceEntries.map(p => p.pace));
        const range = maxPace - minPace || 1;
        const width = 280;
        const height = 80;
        const padding = 4;

        const points = paceEntries.map((p, i) => {
          const x = padding + (i / (paceEntries.length - 1)) * (width - padding * 2);
          const y = padding + ((p.pace - minPace) / range) * (height - padding * 2);
          return `${x},${y}`;
        }).join(' ');

        // Format pace as M:SS
        const formatPace = (secs) => {
          const m = Math.floor(secs / 60);
          const s = Math.floor(secs % 60);
          return `${m}:${s.toString().padStart(2, '0')}`;
        };

        const latestPace = paceEntries[paceEntries.length - 1].pace;
        const firstPace = paceEntries[0].pace;
        const improvement = firstPace - latestPace;

        return (
          <div className="home-pace-trend">
            <h3>Pace Trend <span className="pace-trend-label">/500m</span></h3>
            <div className="pace-trend-chart">
              <svg viewBox={`0 0 ${width} ${height}`} className="pace-svg">
                <polyline
                  points={points}
                  fill="none"
                  stroke="var(--accent-primary)"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
                {/* Latest point dot */}
                {(() => {
                  const lastPt = points.split(' ').pop().split(',');
                  return <circle cx={lastPt[0]} cy={lastPt[1]} r="3" fill="var(--accent-primary)" />;
                })()}
              </svg>
              <div className="pace-trend-labels">
                <span>{formatPace(maxPace)}</span>
                <span>{formatPace(minPace)}</span>
              </div>
            </div>
            <div className="pace-trend-summary">
              <span>Current: <strong>{formatPace(latestPace)}</strong>/500m</span>
              {improvement > 2 && (
                <span className="pace-improvement"><Icon name="ui_streak" size={12} /> {formatPace(improvement)} faster</span>
              )}
            </div>
          </div>
        );
      })()}

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
