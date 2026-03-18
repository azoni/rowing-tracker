import React from 'react';
import Icon from './Icon';
import { useApp } from '../context/AppContext';
import { formatMeters, formatTimeDisplay } from '../utils';
import { ACHIEVEMENTS, STANDARD_DISTANCES, getUserRank, TIER_COLORS } from '../constants';
import AvatarOrPhoto from './Avatar';

function Leaderboard() {
  const {
    currentUser, selectedGroupId, getSelectedGroup,
    leaderboardTab, setLeaderboardTab,
    getLeaderboard, getWeeklyLeaderboard, getStreakLeaderboard, getAchievementsLeaderboard, getDistanceRecords,
    setShowUserProfileModal, setShowCrewMap,
  } = useApp();

  const [selectedDistance, setSelectedDistance] = React.useState(2000);

  return (
    <section className="leaderboard-section">
      <div className="leaderboard-header-row">
        <h2>{selectedGroupId ? `${getSelectedGroup()?.name || 'Group'} Leaderboard` : 'Leaderboard'}</h2>
        <button className="crew-map-btn" onClick={() => setShowCrewMap(true)}>
          <Icon name="ui_globe" size={16} /> Map
        </button>
      </div>

      <div className="leaderboard-tabs">
        <button className={`lb-tab ${leaderboardTab === 'alltime' ? 'active' : ''}`} onClick={() => setLeaderboardTab('alltime')}><Icon name="ui_trophy" size={14} /> All</button>
        <button className={`lb-tab ${leaderboardTab === 'weekly' ? 'active' : ''}`} onClick={() => setLeaderboardTab('weekly')}><Icon name="ui_calendar" size={14} /> Week</button>
        <button className={`lb-tab ${leaderboardTab === 'streak' ? 'active' : ''}`} onClick={() => setLeaderboardTab('streak')}><Icon name="ui_fire" size={14} /> Streak</button>
        <button className={`lb-tab ${leaderboardTab === 'achievements' ? 'active' : ''}`} onClick={() => setLeaderboardTab('achievements')}><Icon name="ui_medal" size={14} /> Awards</button>
        <button className={`lb-tab ${leaderboardTab === 'records' ? 'active' : ''}`} onClick={() => setLeaderboardTab('records')}><Icon name="ui_records" size={14} /> Records</button>
      </div>

      {/* All Time Leaderboard */}
      {leaderboardTab === 'alltime' && (
        <>
          {getLeaderboard.length === 0 ? (
            <div className="empty-state"><p>No rowers yet!</p><p>Be the first to log a row.</p></div>
          ) : (
            <div className="leaderboard">
              {getLeaderboard.map((user, index) => (
                <div key={user.id} className={`leaderboard-item rank-${index + 1} ${user.id === currentUser?.uid ? 'is-you' : ''}`} style={{ borderLeftColor: TIER_COLORS[getUserRank(user.totalMeters)?.tier] || '#00d4aa' }} onClick={() => setShowUserProfileModal(user)}>
                  <div className="rank">{index === 0 ? <Icon name="ui_gold" size={20} /> : index === 1 ? <Icon name="ui_silver" size={20} /> : index === 2 ? <Icon name="ui_bronze" size={20} /> : index + 1}</div>
                  <div className="user-avatar-wrapper">
                    <AvatarOrPhoto user={user} size={36} className="leaderboard-avatar" />
                  </div>
                  <div className="user-info">
                    <span className="user-name">{user.name}{user.id === currentUser?.uid && <span className="you-badge">YOU</span>}</span>
                    <span className="user-rank-label"><Icon name={user.rank?.emoji} size={14} /> {user.rank?.title}</span>
                    <span className="user-streak">{user.streak > 0 && <><Icon name="ui_fire" size={14} /> {user.streak} day streak</>}</span>
                  </div>
                  <div className="user-meters">
                    <span className="meters-value">{formatMeters(user.totalMeters)}</span>
                    <span className="meters-label">meters</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </>
      )}

      {/* Weekly Leaderboard */}
      {leaderboardTab === 'weekly' && (
        <>
          <div className="weekly-reset-info">
            <Icon name="ui_timer" size={14} />
            <span>Resets {(() => {
              const now = new Date();
              const nextSunday = new Date(now);
              nextSunday.setDate(now.getDate() + (7 - now.getDay()));
              nextSunday.setHours(0, 0, 0, 0);
              const diff = nextSunday - now;
              const days = Math.floor(diff / 86400000);
              const hours = Math.floor((diff % 86400000) / 3600000);
              if (days > 1) return `in ${days} days`;
              if (days === 1) return `tomorrow`;
              if (hours > 0) return `in ${hours}h`;
              return 'soon';
            })()}</span>
            <span className="weekly-reset-day">
              Sunday {new Date((() => { const d = new Date(); d.setDate(d.getDate() + (7 - d.getDay())); return d; })()).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
            </span>
          </div>
          {getWeeklyLeaderboard.length === 0 ? (
            <div className="empty-state"><p>No rows this week yet!</p><p>Be the first to get on the board.</p></div>
          ) : (
            <div className="leaderboard">
              {getWeeklyLeaderboard.map((user, index) => (
                <div key={user.id} className={`leaderboard-item rank-${index + 1} ${user.id === currentUser?.uid ? 'is-you' : ''}`} style={{ borderLeftColor: TIER_COLORS[getUserRank(user.totalMeters)?.tier] || '#00d4aa' }} onClick={() => setShowUserProfileModal(user)}>
                  <div className="rank">{index === 0 ? <Icon name="ui_gold" size={20} /> : index === 1 ? <Icon name="ui_silver" size={20} /> : index === 2 ? <Icon name="ui_bronze" size={20} /> : index + 1}</div>
                  <div className="user-avatar-wrapper">
                    <AvatarOrPhoto user={user} size={36} className="leaderboard-avatar" />
                    {index === 0 && <span className="weekly-crown"><Icon name="ui_crown" size={16} /></span>}
                  </div>
                  <div className="user-info">
                    <span className="user-name">{user.name}{user.id === currentUser?.uid && <span className="you-badge">YOU</span>}</span>
                    <span className="user-rank-label"><Icon name={user.rank?.emoji} size={14} /> {user.rank?.title}</span>
                  </div>
                  <div className="user-meters">
                    <span className="meters-value">{formatMeters(user.weeklyMeters)}</span>
                    <span className="meters-label">this week</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </>
      )}

      {/* Streak Leaderboard */}
      {leaderboardTab === 'streak' && (
        <>
          {getStreakLeaderboard.length === 0 ? (
            <div className="empty-state"><p>No active streaks!</p><p>Row consistently to build yours.</p></div>
          ) : (
            <div className="leaderboard">
              {getStreakLeaderboard.map((user, index) => (
                <div key={user.id} className={`leaderboard-item rank-${index + 1} ${user.id === currentUser?.uid ? 'is-you' : ''}`} style={{ borderLeftColor: TIER_COLORS[getUserRank(user.totalMeters)?.tier] || '#00d4aa' }} onClick={() => setShowUserProfileModal(user)}>
                  <div className="rank">{index === 0 ? <Icon name="ui_fire" size={20} /> : index === 1 ? <Icon name="ui_silver" size={20} /> : index === 2 ? <Icon name="ui_bronze" size={20} /> : index + 1}</div>
                  <div className="user-avatar-wrapper">
                    <AvatarOrPhoto user={user} size={36} className="leaderboard-avatar" />
                  </div>
                  <div className="user-info">
                    <span className="user-name">{user.name}{user.id === currentUser?.uid && <span className="you-badge">YOU</span>}</span>
                    <span className="user-rank-label">Best: {user.longestStreak} days</span>
                  </div>
                  <div className="user-meters streak-display">
                    <span className="meters-value">{user.streak}</span>
                    <span className="meters-label">day streak</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </>
      )}

      {/* Achievements Leaderboard */}
      {leaderboardTab === 'achievements' && (
        <>
          {getAchievementsLeaderboard.length === 0 ? (
            <div className="empty-state"><p>No achievements unlocked yet!</p><p>Start rowing to earn badges.</p></div>
          ) : (
            <div className="leaderboard">
              {getAchievementsLeaderboard.map((user, index) => (
                <div key={user.id} className={`leaderboard-item rank-${index + 1} ${user.id === currentUser?.uid ? 'is-you' : ''}`} style={{ borderLeftColor: TIER_COLORS[getUserRank(user.totalMeters)?.tier] || '#00d4aa' }} onClick={() => setShowUserProfileModal(user)}>
                  <div className="rank">{index === 0 ? <Icon name="ui_medal" size={20} /> : index === 1 ? <Icon name="ui_silver" size={20} /> : index === 2 ? <Icon name="ui_bronze" size={20} /> : index + 1}</div>
                  <div className="user-avatar-wrapper">
                    <AvatarOrPhoto user={user} size={36} className="leaderboard-avatar" />
                  </div>
                  <div className="user-info">
                    <span className="user-name">{user.name}{user.id === currentUser?.uid && <span className="you-badge">YOU</span>}</span>
                    <span className="user-rank-label"><Icon name={user.rank?.emoji} size={14} /> {user.rank?.title}</span>
                  </div>
                  <div className="user-meters">
                    <span className="meters-value">{user.achievementCount}/{ACHIEVEMENTS.length}</span>
                    <span className="meters-label">badges</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </>
      )}

      {/* Distance Records */}
      {leaderboardTab === 'records' && (
        <>
          {/* Distance sub-tabs */}
          <div className="distance-tabs">
            {STANDARD_DISTANCES.map(dist => (
              <button
                key={dist.meters}
                className={`distance-tab ${selectedDistance === dist.meters ? 'active' : ''}`}
                onClick={() => setSelectedDistance(dist.meters)}
              >
                {dist.label}
              </button>
            ))}
          </div>

          {/* Records list */}
          {(!getDistanceRecords[selectedDistance] || getDistanceRecords[selectedDistance].length === 0) ? (
            <div className="empty-state">
              <p>No timed records for {STANDARD_DISTANCES.find(d => d.meters === selectedDistance)?.label} yet!</p>
              <p>Log a verified row at this distance with a time to set a record.</p>
            </div>
          ) : (
            <div className="leaderboard">
              {getDistanceRecords[selectedDistance].map((entry, index) => (
                <div
                  key={entry.id}
                  className={`leaderboard-item rank-${index + 1} ${entry.userId === currentUser?.uid ? 'is-you' : ''}`}
                  onClick={() => setShowUserProfileModal(entry.user)}
                >
                  <div className="rank">
                    {index === 0 ? <Icon name="ui_gold" size={20} /> : index === 1 ? <Icon name="ui_silver" size={20} /> : index === 2 ? <Icon name="ui_bronze" size={20} /> : index + 1}
                  </div>
                  <div className="user-avatar-wrapper">
                    <AvatarOrPhoto user={entry.user} size={36} className="leaderboard-avatar" />
                  </div>
                  <div className="user-info">
                    <span className="user-name">
                      {entry.user?.name}
                      {entry.userId === currentUser?.uid && <span className="you-badge">YOU</span>}
                    </span>
                    <span className="user-rank-label">
                      {new Date(entry.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                    </span>
                  </div>
                  <div className="user-meters">
                    <span className="meters-value">{formatTimeDisplay(entry.time)}</span>
                    <span className="meters-label">
                      {entry.pace ? `${Math.floor(entry.pace / 60)}:${(entry.pace % 60).toFixed(1).padStart(4, '0')}/500m` : ''}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </>
      )}
    </section>
  );
}

export default Leaderboard;
