import React from 'react';
import Icon from './Icon';
import WorldJourneyHero from './WorldJourneyHero';
import MonthlyMissions from './MonthlyMissions';
import BadgeArtwork from './BadgeArtwork';
import { useApp } from '../context/AppContext';
import { formatMeters, formatTimeDisplay } from '../utils';
import { getUserRank, getNextRank, getMonthlyProgram, ACHIEVEMENTS } from '../constants';
import { getWeeklyStats } from '../utils/weeklyStats';
import { getDistanceStamps, getMonthlySummary } from '../utils/rowingGoals';
import { getAnalyticsDate, getAnalyticsEntries, summarizeRows } from '../utils/rowingAnalytics';
import { getCrewColor } from '../utils/crewColor';
import './HomeTab.css';

const greeting = hour => hour < 5 ? 'Up early' : hour < 12 ? 'Good morning' : hour < 17 ? 'Good afternoon' : 'Good evening';

// Who moved the boat: the same eligible lifetime distance the crew map shows, largest first.
const crewShares = profiles => Object.entries(profiles || {})
  .map(([id, user]) => ({ id, name: user?.name, meters: Number(user?.totalMeters) > 0 ? Number(user.totalMeters) : 0 }))
  .filter(member => member.meters > 0)
  .sort((a, b) => b.meters - a.meters || a.id.localeCompare(b.id))
  .map(member => ({ ...member, color: getCrewColor(member) }));

function HomeTab() {
  const { currentUser, userProfile, entries, users, metricUsers, getUserAchievements, getAchievementProgress,
    setShowRankProgressModal, setShowAchievementModal, setShowLogModal, setShowSessionHistory,
    setActiveTab, setShowCrewMap, totalMeters } = useApp();
  if (!currentUser || !userProfile) return null;

  const now = new Date();
  const personalRows = getAnalyticsEntries(entries, currentUser.uid, now);
  const week = getWeeklyStats(personalRows, currentUser.uid, now);
  const monthly = getMonthlySummary({ entries, users, userId: currentUser.uid, date: now, now });
  const nextMonth = new Date(now.getFullYear(), now.getMonth() + 1, 1);
  const upcoming = getMonthlyProgram(nextMonth);
  const tourStamps = monthly.challenge.type === 'benchmark_tour'
    ? getDistanceStamps(monthly.userEntries.filter(entry => Number(entry.time) > 0), monthly.challenge.distances, monthly.challenge.tolerance)
    : null;
  const lifetimeMeters = summarizeRows(personalRows).meters;
  const weekSummary = summarizeRows(personalRows.filter(row => getAnalyticsDate(row.date) >= week.start));
  const rank = getUserRank(lifetimeMeters);
  const nextRank = getNextRank(lifetimeMeters);
  const earned = new Set(getUserAchievements(currentUser.uid).map(a => a.id));
  const nextBadges = ACHIEVEMENTS.filter(a => !earned.has(a.id)).map(a => {
    const progress = getAchievementProgress(currentUser.uid, a);
    return { ...a, progress, pct: progress.target > 0 ? progress.current / progress.target : 0 };
  }).sort((a, b) => b.pct - a.pct).slice(0, 2);
  const recent = entries.filter(e => e.userId === currentUser.uid && !e.isTest &&
    ['number', 'string'].includes(typeof e.meters) && Number.isFinite(Number(e.meters)) && Number(e.meters) > 0 &&
    typeof e.date !== 'boolean' &&
    Number.isFinite(getAnalyticsDate(e.date).getTime()) && getAnalyticsDate(e.date) <= now)
    .sort((a, b) => getAnalyticsDate(b.date) - getAnalyticsDate(a.date)).slice(0, 3);
  const monthName = now.toLocaleDateString('en-US', { month: 'long' });
  const daysLeft = new Date(now.getFullYear(), now.getMonth() + 1, 0).getDate() - now.getDate() + 1;
  const rankPct = nextRank ? Math.min(100, Math.max(0, (lifetimeMeters - rank.minMeters) /
    (nextRank.minMeters - rank.minMeters) * 100)) : 100;
  const showLog = () => setShowLogModal(true);

  return (
    <section className="home-section dashboard">
      <div className="dashboard-heading">
        <div><h2>{greeting(now.getHours())}, {userProfile.name?.split(' ')[0] || 'rower'}.</h2></div>
        <time className="dashboard-date" dateTime={now.toLocaleDateString('en-CA')}>{now.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })}</time>
      </div>

      <WorldJourneyHero totalMeters={totalMeters} onOpen={() => setShowCrewMap(true)}
        crew={crewShares(metricUsers === undefined ? users : metricUsers)} />

      <section className="weekly-card" aria-labelledby="weekly-title">
        <div className="weekly-content">
        <div className="weekly-overview">
          <div><h3 id="weekly-title">Your week</h3><p className="weekly-period">Monday–Sunday <span>{week.start.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}–{week.days[6].date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}</span></p></div>
          <div className="weekly-distance"><strong>{(week.meters / 1000).toLocaleString(undefined, { maximumFractionDigits: 2 })}</strong><span>km rowed</span></div>
        </div>
        <dl className="weekly-facts">
          <div><dt>Rows</dt><dd>{week.sessions}</dd></div>
          <div><dt>Active days</dt><dd>{week.activeDays}<small> / 7</small></dd></div>
          <div><dt>Recorded time</dt><dd>{weekSummary.timedSessions ? formatTimeDisplay(weekSummary.seconds) : '—'}</dd></div>
        </dl>
        <p className="weekly-time-coverage">{week.sessions === 0 ? 'Your next row moves the crew forward.' : weekSummary.timedSessions ? `Time recorded for ${weekSummary.timedSessions} of ${week.sessions} ${week.sessions === 1 ? 'row' : 'rows'}.` : 'Add a time to your row to track it here.'}</p>
        <div className="weekly-actions"><button className="dashboard-log" onClick={showLog}><Icon name="ui_plus" size={20} color="currentColor" /> Log a row</button>
          <button className="weekly-history" onClick={() => setShowSessionHistory(true)}><Icon name="ui_history" size={17} color="currentColor" /><span>Logbook</span></button></div>
        <div className="week-rhythm" role="list" aria-label="Your activity this week, Monday to Sunday">
          {week.days.map(day => <div key={day.date.toISOString()} className={`week-day ${day.sessions ? 'has-row' : ''} ${day.today ? 'is-today' : ''} ${day.future ? 'is-future' : ''}`}
            role="listitem" aria-label={`${day.date.toLocaleDateString('en-US', { weekday: 'long' })}: ${day.meters.toLocaleString()} meters${day.today ? ', today' : day.future ? ', upcoming' : ''}`}>
            <span aria-hidden="true">{day.date.toLocaleDateString('en-US', { weekday: 'short' })}</span>
            <span className="week-day-mark" aria-hidden="true">{day.sessions ? <Icon name="ui_check" size={11} /> : <span />}</span>
          </div>)}
        </div>
        </div>
      </section>

      <details className="dashboard-month">
        <summary><span className="dashboard-month-icon"><Icon name="ui_trophy" size={22} /></span>
          <span><strong>{monthName} crew challenges</strong><small><span>{monthly.challenge.label}</span>{' '}<span>{daysLeft} {daysLeft === 1 ? 'day' : 'days'} left</span></small></span><span className="details-chevron">⌄</span></summary>
        <div className="dashboard-month-content">
          <p className="dashboard-eyebrow">Personal throwdown</p>
          <h3>{monthly.throwdown.label}</h3>
          {monthly.throwdown.description && <p>{monthly.throwdown.description}</p>}
          <progress aria-label={monthly.throwdown.label} value={Math.min(monthly.current, monthly.throwdown.target)} max={monthly.throwdown.target} />
          <p className="dashboard-goal-progress">{monthly.complete ? 'Completed — nicely rowed!' : `${monthly.current.toLocaleString()} / ${monthly.throwdown.target.toLocaleString()} ${monthly.throwdown.unit || ''}`}</p>
          <div className="dashboard-competition">
            <p className="dashboard-eyebrow">Crew competition</p><h3>{monthly.challenge.label}</h3><p>{monthly.challenge.description}</p>
            {monthly.userScore ? <p className="dashboard-your-score">Your score <strong>{monthly.userScore.display}</strong><span>#{monthly.userRank}</span></p>
              : <p className="dashboard-goal-progress">{tourStamps ? 'Complete all three timed distances to enter the standings.' : 'Your next qualifying row enters automatically.'}</p>}
            {tourStamps && <div className="mission-stamps" aria-label="Your monthly tour distances">{tourStamps.map(stamp => <span key={stamp.distance} className={stamp.entry ? 'collected' : ''}>{stamp.entry && <Icon name="ui_check" size={12} />}{stamp.distance / 1000}K<span className="mission-sr-only">{stamp.entry ? ' completed' : ' remaining'}</span></span>)}</div>}
            {monthly.leaderboard.length > 0 && <ol className="dashboard-podium">
              {monthly.leaderboard.slice(0, 3).map((row, i) => <li key={row.userId}>
                <span className="podium-position">{i + 1}</span><span>{row.user?.name?.split(' ')[0] || 'Rower'}{row.userId === currentUser.uid ? ' (you)' : ''}</span><strong>{row.display}</strong>
              </li>)}
            </ol>}
          </div>
          <div className="dashboard-upcoming">
            <p className="dashboard-eyebrow">Coming {nextMonth.toLocaleDateString('en-US', { month: 'long' })} 1</p>
            <h3>{upcoming.challenge.label}</h3><p>{upcoming.challenge.description}</p>
            <p><strong>Your throwdown: {upcoming.throwdown.label}.</strong> {upcoming.throwdown.description}</p>
          </div>
        </div>
      </details>

      <section className="dashboard-badges">
        <div className="dashboard-section-heading"><h3>Your next wins</h3><button onClick={() => setActiveTab('more')}>All progress <span>→</span></button></div>
        {nextBadges.length ? nextBadges.map(badge => <button className="dashboard-badge" key={badge.id}
          onClick={() => setShowAchievementModal({ ...badge, progress: badge.progress })}>
          <BadgeArtwork achievement={badge} size={64} className="dashboard-badge-art" />
          <span className="dashboard-badge-copy"><strong>{badge.name}</strong>{badge.difficulty && <span className={`badge-difficulty is-${badge.difficulty}`}>{badge.difficulty}</span>}<small>{badge.desc}</small>
            <progress aria-label={`${badge.name} progress`} value={Math.min(badge.pct, 1)} max="1" /></span>
          <span className="dashboard-badge-percent">{Math.round(Math.min(badge.pct, 1) * 100)}%</span>
        </button>) : <p>Every badge earned. What a journey!</p>}
        <button className="dashboard-rank" onClick={() => setShowRankProgressModal(true)}>
          <Icon name={rank.emoji} size={27} /><span><strong>{rank.title}</strong><small>{nextRank ? `${formatMeters(nextRank.minMeters - lifetimeMeters)}m to ${nextRank.title}` : 'Top rank reached'}
          </small><progress aria-label="Progress to next rank" value={rankPct} max="100" /></span><span>→</span>
        </button>
      </section>

      <section className="dashboard-recent">
        <div className="dashboard-section-heading"><h3>Fresh from your logbook</h3><button onClick={() => setShowSessionHistory(true)}>View all <span>→</span></button></div>
        {recent.length ? recent.map((row, index) => <div key={row.id || index} className="dashboard-row">
          <span className="dashboard-row-date">{getAnalyticsDate(row.date).toLocaleDateString('en-US', { month: 'short' })}<strong>{getAnalyticsDate(row.date).getDate()}</strong></span>
          <span><strong>{Number(row.meters).toLocaleString()} <small>m</small></strong><small>{Number(row.time) > 0 && <><span>{formatTimeDisplay(row.time)}</span>{' '}</>}<span>{row.verificationStatus === 'verified' ? 'Photo verified' : ['pending_review', 'pending'].includes(row.verificationStatus) ? 'In review, not counted yet' : row.verificationStatus === 'rejected' ? 'Not approved, not counted' : 'Manual entry'}</span></small></span>
          <Icon name={row.verificationStatus === 'verified' ? 'ui_check' : 'ui_rowing'} size={19} />
        </div>) : <div className="dashboard-empty"><Icon name="ui_rowing" size={30} /><p>Nothing in your logbook yet.<br />A photo of your monitor is all you need.</p><button onClick={showLog}>Log your first row</button></div>}
      </section>

      <MonthlyMissions missions={monthly.missions} onLog={showLog} />

    </section>
  );
}
export default HomeTab;
