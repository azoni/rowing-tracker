import React from 'react';
import Icon from './Icon';
import { useApp } from '../context/AppContext';
import { formatMeters } from '../utils';
import { ACHIEVEMENTS, STANDARD_DISTANCES } from '../constants';
import { formatRecordTime } from '../utils/leaderboardStats';
import AvatarOrPhoto from './Avatar';
import './Leaderboard.css';

const TABS = [
  ['alltime', 'All time', 'ui_trophy'], ['weekly', 'This week', 'ui_calendar'],
  ['streak', 'Streaks', 'ui_fire'], ['achievements', 'Awards', 'ui_medal'], ['records', 'Records', 'ui_records'],
];
const dateLabel = value => new Date(value).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
const plural = (value, word) => value + ' ' + word + (value === 1 ? '' : 's');

function Leaderboard() {
  const {
    currentUser, selectedGroupId, getSelectedGroup,
    leaderboardTab, setLeaderboardTab, leaderboardStats,
    getLeaderboard = [], getWeeklyLeaderboard = [], getStreakLeaderboard = [],
    getAchievementsLeaderboard = [], getDistanceRecords = {},
    setShowUserProfileModal, setShowCrewMap,
  } = useApp();
  const [selectedDistance, setSelectedDistance] = React.useState(2000);
  const [selectedSetup, setSelectedSetup] = React.useState('');
  const [search, setSearch] = React.useState('');
  const recordGroups = getDistanceRecords[selectedDistance] || [];
  const setup = recordGroups.find(group => group.key === selectedSetup) || recordGroups[0];
  const isRecords = leaderboardTab === 'records';
  const boards = { alltime: getLeaderboard, weekly: getWeeklyLeaderboard, streak: getStreakLeaderboard, achievements: getAchievementsLeaderboard };
  const rows = isRecords ? setup?.rows || [] : boards[leaderboardTab] || [];
  const query = search.trim().toLocaleLowerCase();
  const visibleRows = rows.map((row, index) => ({ row, place: index + 1 }))
    .filter(({ row }) => ((isRecords ? row.user : row)?.name || 'Crew member').toLocaleLowerCase().includes(query));
  const week = leaderboardStats?.week;
  const lastWeekDay = week ? new Date(week.end) : null;
  if (lastWeekDay) lastWeekDay.setDate(lastWeekDay.getDate() - 1);
  const titles = { alltime: 'Lifetime distance', weekly: 'A fresh week, together', streak: 'One day at a time', achievements: 'Earned along the way', records: 'Photo-verified times' };
  const descriptions = {
    alltime: 'Every eligible logged row adds to your distance.',
    weekly: week ? dateLabel(week.start) + '–' + dateLabel(lastWeekDay) + ' · Monday–Sunday, in your local time.' : 'Monday–Sunday, in your local time.',
    streak: 'A current streak includes today or yesterday. Your best stays with you.',
    achievements: 'Earned badges stay counted. New progress uses eligible rows.',
    records: 'Your best time for the same recorded distance, machine and workout type.',
  };
  const empty = {
    alltime: ['The crew is just getting started.', 'Logged rows will appear here.'],
    weekly: ['A fresh start for the crew.', 'The first eligible row this week will appear here.'],
    streak: ['Every rhythm starts with one row.', 'Your current and longest streaks will appear here.'],
    achievements: ['Room for the first badge.', 'Keep logging rows to build your collection.'],
    records: ['No comparable times at this distance yet.', 'Photo-verified, single-piece rows need an exact distance, a time and a known setup.'],
  }[leaderboardTab] || ['', ''];

  return (
    <section className="crew-board" aria-labelledby="crew-board-heading">
      <header className="crew-board-header">
        <div>
          <h2 id="crew-board-heading">{selectedGroupId ? getSelectedGroup()?.name || 'Your crew' : 'The crew board'}</h2>
          <p>A little friendly competition, at your own pace.</p>
        </div>
        <button type="button" className="crew-board-map" onClick={() => setShowCrewMap(true)} aria-label="Open crew map">
          <Icon name="ui_globe" size={16} color="currentColor" /> <span>Map</span>
        </button>
      </header>

      <div className="crew-board-tabs" role="group" aria-label="Leaderboard view">
        {TABS.map(([id, label, icon]) => (
          <button type="button" key={id} aria-pressed={leaderboardTab === id} onClick={() => setLeaderboardTab(id)}>
            <Icon name={icon} size={15} color="currentColor" /><span>{label}</span>
          </button>
        ))}
      </div>

      <div className="crew-board-body">
        <div className="crew-board-intro">
          <h3>{titles[leaderboardTab]}</h3>
          <p>{descriptions[leaderboardTab]}</p>
        </div>
        {isRecords && (
          <div className="crew-board-record-filters">
            <div className="crew-board-distances" role="group" aria-label="Record distance">
              {STANDARD_DISTANCES.map(distance => (
                <button type="button" key={distance.meters} aria-pressed={selectedDistance === distance.meters}
                  onClick={() => setSelectedDistance(distance.meters)}>{distance.label}</button>
              ))}
            </div>
            {recordGroups.length > 0 && (
              <label className="crew-board-setup">Recorded setup
                <select value={setup.key} onChange={event => setSelectedSetup(event.target.value)}>
                  {recordGroups.map(group => <option key={group.key} value={group.key}>{group.label}</option>)}
                </select>
              </label>
            )}
          </div>
        )}
        <div className="crew-board-tools">
          <label className="crew-board-search">
            <span className="crew-board-search-label">Find a rower</span>
            <Icon name="ui_search" size={16} color="currentColor" />
            <input type="search" value={search} onChange={event => setSearch(event.target.value)} placeholder="Find a rower" />
          </label>
          <span className="crew-board-count" role="status">{query ? visibleRows.length + ' of ' : ''}{plural(rows.length, 'rower')}</span>
        </div>
        {rows.length === 0 ? (
          <div className="crew-board-empty"><h4>{empty[0]}</h4><p>{empty[1]}</p></div>
        ) : visibleRows.length === 0 ? (
          <div className="crew-board-empty"><h4>No rowers match that name.</h4>
            <button type="button" className="crew-board-clear" onClick={() => setSearch('')}>Clear search</button>
          </div>
        ) : (
          <ol className="crew-board-list" aria-label={titles[leaderboardTab]}>
            {visibleRows.map(({ row, place }) => {
              const user = isRecords ? row.user : row.profile || row;
              const isYou = user.id === currentUser?.uid;
              let metric, unit, detail, exact;
              if (isRecords) {
                metric = formatRecordTime(row.time); unit = formatRecordTime(row.pace) + ' /500m'; detail = dateLabel(row.date);
              } else if (leaderboardTab === 'streak') {
                metric = row.streak; unit = row.streak === 1 ? 'day now' : 'days now'; detail = 'Best: ' + plural(row.longestStreak, 'day');
              } else if (leaderboardTab === 'achievements') {
                metric = row.achievementCount; unit = 'of ' + ACHIEVEMENTS.length + ' badges'; detail = row.rank?.title || 'Crew member';
              } else {
                const meters = leaderboardTab === 'weekly' ? row.weeklyMeters : row.totalMeters;
                metric = formatMeters(meters); unit = 'meters'; exact = meters.toLocaleString() + ' meters';
                detail = plural(leaderboardTab === 'weekly' ? row.weeklySessions || 0 : row.uploadCount || 0, 'row') + ' logged';
              }
              return (
                <li key={row.id} value={place}>
                  <button type="button" className={'crew-board-row' + (isYou ? ' is-you' : '')}
                    onClick={() => setShowUserProfileModal(user)} aria-label={'View ' + (user.name || 'crew member') + ' profile, place ' + place + ', ' + metric + ' ' + unit + ', ' + detail}>
                    <span className="crew-board-place" aria-hidden="true">{place.toString().padStart(2, '0')}</span>
                    <AvatarOrPhoto user={user} size={36} className="crew-board-avatar" />
                    <span className="crew-board-person"><span className="crew-board-name">{user.name || 'Crew member'}{isYou && <span className="crew-board-you">You</span>}</span>
                      <span className="crew-board-detail">{detail}</span></span>
                    <span className="crew-board-metric" title={exact}><strong>{metric}</strong><span>{unit}</span></span>
                  </button>
                </li>
              );
            })}
          </ol>
        )}
        <p className="crew-board-note">{isRecords
          ? 'Verified by Row Crew from a photo, not an official race ranking. Settings and effort can differ; intervals and unknown setups are not compared.'
          : 'Based on eligible logged rows. Pending, rejected, test and future rows do not count.'}</p>
      </div>
    </section>
  );
}

export default Leaderboard;
