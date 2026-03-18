import React from 'react';
import { useApp } from '../context/AppContext';
import { formatMeters, formatTime, formatTimeDisplay, formatTimeAgo } from '../utils';
import { getUserRank, getRankTier, TIER_COLORS } from '../constants';
import Icon from './Icon';

function ActivityFeed() {
  const {
    currentUser, users, isAdmin, deleteActivity,
    getLeaderboard, getWeeklyLeaderboard, getStreakLeaderboard,
    selectedGroupId, getSelectedGroup,
    isGroupAdmin, challenges,
    getChallengeStatus, getChallengeProgress,
    setShowChallengeDetail, setShowCreateChallengeModal,
    setShowManageMembersModal, setShowInviteUserModal,
    handleLeaveGroup,
    feedSearchQuery, setFeedSearchQuery,
    feedTypeFilter, setFeedTypeFilter,
    feedPage, setFeedPage,
    getActivityFeed, calculateStreak,
    handleSignIn,
    setShowUserProfileModal,
    showReactionPicker, setShowReactionPicker,
    REACTION_EMOJIS, getReactionCounts, hasUserReacted, toggleReaction,
    expandedComments, setExpandedComments,
    getItemComments, newComment, setNewComment,
    replyingTo, setReplyingTo,
    addComment, deleteComment,
    wrappedDismissed, setWrappedDismissed,
    getWrappedStats, setShowWrapped,
    entries,
  } = useApp();

  // Build top-3 badges across all leaderboard categories
  const userBadges = React.useMemo(() => {
    const badges = {}; // userId -> [{icon, category}]
    const addBadges = (list, icon) => {
      if (!list) return;
      list.slice(0, 3).forEach((user, i) => {
        const medalIcon = i === 0 ? 'ui_gold' : i === 1 ? 'ui_silver' : 'ui_bronze';
        if (!badges[user.id]) badges[user.id] = [];
        badges[user.id].push({ medal: medalIcon, category: icon });
      });
    };
    addBadges(getLeaderboard, 'ui_trophy');     // All-time meters
    addBadges(getWeeklyLeaderboard, 'ui_calendar'); // Weekly
    addBadges(getStreakLeaderboard, 'ui_fire');   // Streak
    return badges;
  }, [getLeaderboard, getWeeklyLeaderboard, getStreakLeaderboard]);

  return (
    <section className="feed-section">
      <h2>
        {selectedGroupId ? `${getSelectedGroup()?.name || 'Group'} Feed` : 'Activity Feed'}
      </h2>


      {/* 2025 Wrapped Banner */}
      {currentUser && !wrappedDismissed && !selectedGroupId && getWrappedStats(currentUser.uid) && (
        <div className="wrapped-banner">
          <div className="wrapped-banner-content">
            <span className="wrapped-banner-icon"><Icon name="ui_gift" size={20} /></span>
            <div className="wrapped-banner-text">
              <strong>Your 2025 Wrapped is here!</strong>
              <span>See your year in rowing</span>
            </div>
          </div>
          <div className="wrapped-banner-actions">
            <button className="wrapped-banner-view" onClick={() => setShowWrapped(true)}>View</button>
            <button
              className="wrapped-banner-dismiss"
              onClick={() => {
                setWrappedDismissed(true);
                localStorage.setItem('wrappedDismissed2025', 'true');
              }}
            >✕</button>
          </div>
        </div>
      )}

      {/* Group Info & Challenges (when group selected) */}
      {selectedGroupId && getSelectedGroup() && (
        <div className="group-info-section">
          <div className="group-header-card">
            <div className="group-header-top">
              <div className="group-header-info">
                <h3>{getSelectedGroup()?.name}</h3>
                {getSelectedGroup()?.description && (
                  <p className="group-description">{getSelectedGroup().description}</p>
                )}
              </div>
            </div>
            <div className="group-header-bottom">
              <div className="group-meta">
                <span><Icon name="ui_users" size={14} /> {getSelectedGroup()?.memberIds?.length || 0} members</span>
                <span className="group-code">Code: {getSelectedGroup()?.inviteCode}</span>
              </div>
              <div className="group-header-actions">
                {isGroupAdmin(selectedGroupId) && (
                  <>
                    <button className="group-action-btn" onClick={() => setShowManageMembersModal(true)} title="Manage Members"><Icon name="ui_settings" size={14} /> Manage</button>
                    <button className="group-action-btn" onClick={() => setShowInviteUserModal(true)} title="Invite User"><Icon name="ui_plus" size={14} /> Invite</button>
                    <button className="group-action-btn primary" onClick={() => setShowCreateChallengeModal(true)}><Icon name="ui_plus" size={14} /> Challenge</button>
                  </>
                )}
                <button
                  className="group-action-btn danger"
                  onClick={() => {
                    if (window.confirm('Are you sure you want to leave this group?')) {
                      handleLeaveGroup(selectedGroupId);
                    }
                  }}
                >Leave</button>
              </div>
            </div>
          </div>

          {/* Active Challenges */}
          {challenges.length > 0 && (
            <div className="challenges-section">
              <h4>Challenges</h4>
              <div className="challenges-list">
                {challenges.map(challenge => {
                  const status = getChallengeStatus(challenge);
                  const progress = getChallengeProgress(challenge);
                  return (
                    <div
                      key={challenge.id}
                      className={`challenge-card challenge-${status}`}
                      onClick={() => setShowChallengeDetail(challenge)}
                    >
                      <div className="challenge-card-header">
                        <span className="challenge-type-icon">
                          {challenge.type === 'collective' && <Icon name="ui_target" size={16} />}
                          {challenge.type === 'collective_calories' && <Icon name="ui_bolt" size={16} />}
                          {challenge.type === 'time_trial' && <Icon name="ui_records" size={16} />}
                          {challenge.type === 'distance_race' && <Icon name="ui_streak" size={16} />}
                          {challenge.type === 'total_time' && <Icon name="ui_timer" size={16} />}
                          {challenge.type === 'calories' && <Icon name="ui_fire" size={16} />}
                          {challenge.type === 'streak' && <Icon name="ui_streak" size={16} />}
                          {challenge.type === 'sessions' && <Icon name="ui_calendar" size={16} />}
                        </span>
                        <span className="challenge-name">{challenge.name}</span>
                        <span className={`challenge-status-badge ${status}`}>
                          {status === 'active' && <><Icon name="ui_check" size={12} /> Active</>}
                          {status === 'upcoming' && <><Icon name="ui_pending" size={12} /> Upcoming</>}
                          {status === 'completed' && <><Icon name="ui_success" size={12} /> Done</>}
                        </span>
                      </div>
                      {(challenge.type === 'collective' || challenge.type === 'collective_calories') && progress && (
                        <div className="challenge-progress">
                          <div className="challenge-progress-bar">
                            <div className="challenge-progress-fill" style={{ width: `${progress.percentage}%` }} />
                          </div>
                          <div className="challenge-progress-text">
                            {challenge.type === 'collective_calories'
                              ? `${progress.current.toLocaleString()} / ${progress.target.toLocaleString()} cal`
                              : `${formatMeters(progress.current)} / ${formatMeters(progress.target)}`
                            }
                          </div>
                        </div>
                      )}
                      {challenge.type === 'time_trial' && (
                        <div className="challenge-time-trial-info">
                          <span>{challenge.targetDistance}m time trial</span>
                          {challenge.participants?.[currentUser?.uid] && (
                            <span className="your-time">Your best: {formatTime(challenge.participants[currentUser.uid].bestTime)}</span>
                          )}
                        </div>
                      )}
                      {(challenge.type === 'total_time' || challenge.type === 'calories') && (
                        <div className="challenge-type-info">
                          {challenge.type === 'total_time' && 'Most total time rowed wins'}
                          {challenge.type === 'calories' && 'Most calories burned wins'}
                        </div>
                      )}
                      <div className="challenge-dates">
                        {new Date(challenge.startDate).toLocaleDateString()} - {new Date(challenge.endDate).toLocaleDateString()}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {challenges.length === 0 && isGroupAdmin(selectedGroupId) && (
            <div className="no-challenges">
              <p>No challenges yet!</p>
              <button className="create-first-challenge-btn" onClick={() => setShowCreateChallengeModal(true)}>Create First Challenge</button>
            </div>
          )}
        </div>
      )}

      {/* Search Bar */}
      <div className="search-bar">
        <span className="search-icon"><Icon name="ui_search" size={16} /></span>
        <input
          type="text"
          placeholder="Search rowers..."
          value={feedSearchQuery}
          onChange={(e) => { setFeedSearchQuery(e.target.value); setFeedPage(1); }}
          className="search-input"
        />
        {feedSearchQuery && (
          <button className="search-clear" onClick={() => { setFeedSearchQuery(''); setFeedPage(1); }}>✕</button>
        )}
      </div>

      {/* Feed Type Filters */}
      <div className="feed-filters">
        {[
          { key: 'all', label: 'All' },
          { key: 'row', label: <><Icon name="ui_rowing" size={14} /> Rows</> },
          { key: 'milestone', label: <><Icon name="ui_trophy" size={14} /> Milestones</> },
        ].map(f => (
          <button
            key={f.key}
            className={`feed-filter-pill ${feedTypeFilter === f.key ? 'active' : ''}`}
            onClick={() => { setFeedTypeFilter(f.key); setFeedPage(1); }}
          >{f.label}</button>
        ))}
      </div>

      {/* Guest Sign In Prompt */}
      {!currentUser && (
        <div className="guest-prompt">
          <p>👋 Sign in to log your rows and compete!</p>
          <button className="signin-prompt-btn" onClick={handleSignIn}>Sign in with Google</button>
        </div>
      )}

      {(() => {
        const feedData = getActivityFeed(feedSearchQuery, feedPage, feedTypeFilter);
        return feedData.items.length === 0 ? (
          <div className="empty-state">
            {feedSearchQuery || feedTypeFilter !== 'all' ? (
              <p>No activity found{feedSearchQuery ? ` for "${feedSearchQuery}"` : ' for this filter'}.</p>
            ) : entries.length === 0 ? (
              <div className="skeleton-feed">
                {[...Array(5)].map((_, i) => (
                  <div key={i} className="skeleton-feed-item">
                    <div className="skeleton skeleton-avatar" />
                    <div className="skeleton-content">
                      <div className="skeleton skeleton-line skeleton-line-short" />
                      <div className="skeleton skeleton-line skeleton-line-medium" />
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <>
                <p>No activity yet!</p>
                <p>Be the first to log a row.</p>
              </>
            )}
          </div>
        ) : (
          <>
            <div className="activity-feed">
              {feedData.items.map((item) => {
                const itemStreak = item.user ? calculateStreak(item.user.id) : 0;
                const itemRank = item.user ? getUserRank(item.user.totalMeters) : null;
                const itemTier = itemRank?.tier || 'bronze';
                const lbBadges = item.user ? (userBadges[item.user.id] || []) : [];

                return (
                  <div
                    key={item.id}
                    className={`feed-item feed-item-${item.type} ${item.type === 'rank' ? `tier-${getRankTier(item.rank?.rank)}` : ''} ${(item.type === 'row' || item.type === 'achievement') ? `row-tier-${itemTier}` : ''} ${item.userId === currentUser?.uid ? 'is-you' : ''} clickable`}
                    onClick={() => item.user && setShowUserProfileModal(item.user)}
                  >
                    <div className="feed-avatar">
                      {item.user?.photoURL ? (
                        <img src={item.user.photoURL} alt="" />
                      ) : (
                        <div className="feed-avatar-placeholder">
                          {item.user?.name?.charAt(0)?.toUpperCase() || '?'}
                        </div>
                      )}
                    </div>
                    <div className="feed-content">
                      <div className="feed-header">
                        <span className="feed-name">
                          {item.user?.name}
                          {lbBadges.length > 0 && (
                            <span className="feed-lb-badges">
                              {lbBadges.map((b, i) => (
                                <span key={i} className="feed-lb-badge" title={`Top 3 ${b.category}`}>
                                  <Icon name={b.medal} size={10} /><Icon name={b.category} size={8} />
                                </span>
                              ))}
                            </span>
                          )}
                          {itemRank && <span className="feed-rank-badge"><Icon name={itemRank.emoji} size={14} /></span>}
                        </span>
                        <span className="feed-time">{formatTimeAgo(new Date(item.date))}</span>
                      </div>
                      <div className="feed-action">
                        {item.type === 'row' && (
                          <>
                            rowed <span className="feed-meters">{item.meters.toLocaleString()}m</span>
                            {item.time && <span className="feed-time-cal"> in {formatTimeDisplay(item.time)}</span>}
                            {item.calories && <span className="feed-time-cal"> • {item.calories} cal</span>}
                            {item.sessionType && item.sessionType !== 'free_row' && (
                              <span className="feed-session-type">{item.sessionType.replace('_', ' ')}</span>
                            )}
                            {item.verificationStatus === 'verified' && <span className="verification-badge verified" title="Verified with photo"><Icon name="ui_check" size={12} /></span>}
                            {item.verificationStatus === 'pending_review' && <span className="verification-badge pending" title="Pending Review"><Icon name="ui_pending" size={12} /></span>}
                            {(item.verificationStatus === 'unverified' || !item.verificationStatus) && <span className="verification-badge unverified" title="No photo - unverified"><Icon name="ui_unverified" size={12} /></span>}
                          </>
                        )}
                        {item.type === 'achievement' && (
                          <span className="feed-achievement">
                            {item.achievements && item.achievements.length > 1 ? (
                              <>unlocked {item.achievements.length} awards: {item.achievements.map(a => <Icon key={a.id} name={a.emoji} size={16} />)}</>
                            ) : (
                              <>unlocked <span className="feed-achievement-name"><Icon name={item.achievement.emoji} size={16} /> {item.achievement.name}</span></>
                            )}
                          </span>
                        )}
                        {item.type === 'rank' && (() => {
                          const tier = getRankTier(item.rank?.rank);
                          const tierColor = TIER_COLORS[tier] || '#00d4aa';
                          return (
                            <div className="feed-rank-epic">
                              <div className="feed-rank-label" style={{ color: tierColor }}>RANK UP</div>
                              <Icon name={item.rank?.emoji} size={36} />
                              <div className="feed-rank-title" style={{ color: tierColor }}>{item.rank?.rank}</div>
                              <div className="feed-rank-tier-badge" style={{ borderColor: tierColor, color: tierColor }}>
                                {tier.toUpperCase()}
                              </div>
                            </div>
                          );
                        })()}
                        {item.type === 'join' && <span className="feed-join">joined Row Crew! 🎉</span>}
                        {item.type === 'group_created' && <span className="feed-group">created group <span className="feed-group-name"><Icon name="ui_rowing" size={14} /> {item.groupName}</span></span>}
                        {item.type === 'group_joined' && <span className="feed-group">joined <span className="feed-group-name"><Icon name="ui_users" size={14} /> {item.groupName}</span></span>}
                        {item.type === 'challenge_created' && (
                          <span className="feed-challenge">
                            started challenge <span className="feed-challenge-name"><Icon name="ui_target" size={14} /> {item.challengeName}</span>
                            {item.groupName && <span className="feed-in-group"> in {item.groupName}</span>}
                          </span>
                        )}
                        {item.type === 'throwdown_completed' && (
                          <span className="feed-throwdown">
                            completed the <span className="feed-throwdown-name"><Icon name="ui_fire" size={14} /> {item.monthName} Throwdown</span> — {item.throwdownLabel}
                          </span>
                        )}
                        {item.type === 'distance_record' && (
                          <span className="feed-record">
                            set a new <span className="feed-record-distance">{item.distanceLabel}</span> record — <span className="feed-meters">{formatTimeDisplay(item.time)}</span>
                            {item.previousBest && (
                              <span className="feed-record-improvement"> (was {formatTimeDisplay(item.previousBest)})</span>
                            )}
                            {item.isFirstRecord && <span className="feed-record-first"> — first time!</span>}
                          </span>
                        )}
                      </div>
                      {item.type === 'row' && itemStreak > 1 && (
                        <div className="feed-streak-badge"><Icon name="ui_fire" size={14} /> {itemStreak} day streak</div>
                      )}
                    </div>
                    {/* Reactions & Comments */}
                    {currentUser && (
                      <div className="feed-interactions-compact">
                        <div className="reactions-row">
                          {REACTION_EMOJIS.filter(emoji => getReactionCounts(item.id)[emoji] > 0).map(emoji => (
                            <button
                              key={emoji}
                              className={`reaction-pill ${hasUserReacted(item.id, emoji) ? 'active' : ''}`}
                              onClick={(e) => { e.stopPropagation(); toggleReaction(item.id, emoji); }}
                            >
                              {emoji} {getReactionCounts(item.id)[emoji]}
                            </button>
                          ))}
                          <div className="reaction-picker-wrapper">
                            <button
                              className="add-reaction-btn"
                              onClick={(e) => {
                                e.stopPropagation();
                                setShowReactionPicker(showReactionPicker === item.id ? null : item.id);
                              }}
                            >+</button>
                            {showReactionPicker === item.id && (
                              <>
                                <div className="reaction-picker-backdrop" onClick={(e) => { e.stopPropagation(); setShowReactionPicker(null); }} />
                                <div className="reaction-picker" onClick={(e) => e.stopPropagation()}>
                                  {REACTION_EMOJIS.map(emoji => (
                                    <button
                                      key={emoji}
                                      className={`picker-emoji ${hasUserReacted(item.id, emoji) ? 'active' : ''}`}
                                      onClick={() => { toggleReaction(item.id, emoji); setShowReactionPicker(null); }}
                                    >{emoji}</button>
                                  ))}
                                </div>
                              </>
                            )}
                          </div>
                          <button
                            className={`comment-link ${expandedComments[item.id] ? 'active' : ''}`}
                            onClick={(e) => {
                              e.stopPropagation();
                              setExpandedComments(prev => ({ ...prev, [item.id]: !prev[item.id] }));
                            }}
                          ><Icon name="ui_comment" size={14} /> {getItemComments(item.id).length || ''}</button>
                        </div>

                        {expandedComments[item.id] && (
                          <div className="comments-compact" onClick={(e) => e.stopPropagation()}>
                            {getItemComments(item.id).map(comment => {
                              const commentUser = users[comment.userId];
                              return (
                                <div key={comment.id} className="comment-row">
                                  <span className="comment-author-inline">{commentUser?.name?.split(' ')[0] || 'User'}</span>
                                  <span className="comment-text-inline">
                                    {comment.replyToName && <span className="reply-mention">@{comment.replyToName.split(' ')[0]} </span>}
                                    {comment.text}
                                  </span>
                                  <button
                                    className="comment-reply-inline"
                                    onClick={() => setReplyingTo(prev => ({
                                      ...prev,
                                      [item.id]: { commentId: comment.id, userId: comment.userId, userName: commentUser?.name || 'User' }
                                    }))}
                                    title="Reply"
                                  >↩</button>
                                  {comment.userId === currentUser?.uid && (
                                    <button className="comment-delete-inline" onClick={() => deleteComment(comment.id, comment.userId)}>✕</button>
                                  )}
                                </div>
                              );
                            })}
                            {replyingTo[item.id] && (
                              <div className="replying-to-indicator">
                                <span>Replying to @{replyingTo[item.id].userName?.split(' ')[0]}</span>
                                <button onClick={() => setReplyingTo(prev => ({ ...prev, [item.id]: null }))}>✕</button>
                              </div>
                            )}
                            <div className="comment-add-row">
                              <input
                                type="text"
                                placeholder={replyingTo[item.id] ? `Reply to ${replyingTo[item.id].userName?.split(' ')[0]}...` : "Add a comment..."}
                                value={newComment[item.id] || ''}
                                onChange={(e) => setNewComment(prev => ({ ...prev, [item.id]: e.target.value }))}
                                onKeyPress={(e) => {
                                  if (e.key === 'Enter' && newComment[item.id]?.trim()) {
                                    addComment(item.id, item.userId);
                                  }
                                }}
                                maxLength={200}
                              />
                              <button onClick={() => addComment(item.id, item.userId)} disabled={!newComment[item.id]?.trim()}>↵</button>
                            </div>
                          </div>
                        )}
                      </div>
                    )}
                    {isAdmin && (
                      <button
                        className="feed-delete-admin"
                        onClick={(e) => {
                          e.stopPropagation();
                          if (window.confirm('Delete this feed item?')) {
                            deleteActivity(item.id, item.type);
                          }
                        }}
                        title="Admin: Delete"
                      >
                        <Icon name="ui_unverified" size={12} />
                      </button>
                    )}
                  </div>
                );
              })}
            </div>
            {feedData.hasMore && (
              <button className="load-more-btn" onClick={() => setFeedPage(prev => prev + 1)}>
                Load More ({feedData.total - feedData.items.length} remaining)
              </button>
            )}
          </>
        );
      })()}
    </section>
  );
}

export default ActivityFeed;
