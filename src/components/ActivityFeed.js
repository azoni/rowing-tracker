import React, { useEffect, useRef, useState } from 'react';
import { useApp } from '../context/AppContext';
import { calculatePace, formatMeters, formatTime, formatTimeDisplay, formatTimeAgo } from '../utils';
import { ACHIEVEMENTS, getUserRank, getRankTier, getMachineName, TIER_COLORS } from '../constants';
import { getEligibleEntries } from '../utils/rowingGoals';
import Icon from './Icon';
import AvatarOrPhoto from './Avatar';
import BadgeArtwork from './BadgeArtwork';
import CrewPulse from './CrewPulse';
import './ProgressAndCrew.css';
import './ActivityFeed.css';

const asDate = value => value?.toDate ? value.toDate() : new Date(value);
const validNumber = value => Number.isFinite(Number(value)) && Number(value) > 0;
const dayKey = value => {
  const date = asDate(value);
  return Number.isFinite(date.getTime()) ? date.toDateString() : 'Date unavailable';
};
const dayLabel = (value, now) => {
  const date = asDate(value);
  if (!Number.isFinite(date.getTime())) return 'Date unavailable';
  if (dayKey(date) === dayKey(now)) return 'Today';
  const yesterday = new Date(now);
  yesterday.setDate(yesterday.getDate() - 1);
  if (dayKey(date) === dayKey(yesterday)) return 'Yesterday';
  return date.toLocaleDateString(undefined, {
    weekday: 'short', month: 'short', day: 'numeric',
    ...(date.getFullYear() !== now.getFullYear() ? { year: 'numeric' } : {}),
  });
};
const rowStatus = item => {
  if (item.isTest) return { label: 'Test entry', icon: 'ui_info', kind: 'review' };
  if (item.verificationStatus === 'verified') return { label: 'Photo verified', icon: 'ui_check', kind: 'verified' };
  if (['pending', 'pending_review'].includes(item.verificationStatus)) return { label: 'Awaiting review', icon: 'ui_pending', kind: 'review' };
  if (item.verificationStatus === 'rejected') return { label: 'Not approved', icon: 'ui_info', kind: 'review' };
  if (!item.verificationStatus || ['manual', 'unverified'].includes(item.verificationStatus)) return { label: 'Manual entry', icon: 'ui_rowing', kind: 'manual' };
  return { label: 'Not verified', icon: 'ui_info', kind: 'review' };
};
const sessionNames = { free_row: 'Free row', timed: 'Timed row', distance: 'Distance row', interval: 'Intervals' };
// The usual "add a reaction" mark: a face with a plus, so the button is not a bare "+".
const ReactionIcon = () => <svg viewBox="0 0 20 20" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" aria-hidden="true" focusable="false">
  <circle cx="9" cy="11" r="6.5" /><path d="M6.4 12.8c.6.9 1.5 1.4 2.6 1.4s2-.5 2.6-1.4" /><path d="M6.9 9.4h.01M11.1 9.4h.01" strokeWidth="2.2" /><path d="M16.5 1.5v4M14.5 3.5h4" />
</svg>;
const badgeDefinition = achievement => ACHIEVEMENTS.find(badge => badge.id === achievement?.id) || achievement;

function ActivityFeed() {
  const {
    currentUser, users, isAdmin, deleteActivity,
    selectedGroupId, getSelectedGroup,
    isGroupAdmin, challenges,
    getChallengeStatus, getChallengeProgress,
    setShowChallengeDetail, setShowCreateChallengeModal,
    setShowManageMembersModal, setShowInviteUserModal,
    handleLeaveGroup,
    feedSearchQuery, setFeedSearchQuery,
    feedTypeFilter, setFeedTypeFilter,
    feedPage, setFeedPage,
    getActivityFeed,
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
    isLoading, setShowLogModal,
  } = useApp();

  const [pendingActions, setPendingActions] = useState({});
  const [actionErrors, setActionErrors] = useState({});
  const pendingRef = useRef(new Set());
  const reactionButtons = useRef(new Map());
  const now = new Date();
  const query = feedSearchQuery.trim();
  const feedData = getActivityFeed(query, feedPage, feedTypeFilter);
  // This summary describes only the currently displayed sessions, never unseen pages or milestones.
  const shownRows = feedData.items.filter(item => item.type === 'row');
  const countedRows = getEligibleEntries(shownRows, now);
  const shownMeters = countedRows.reduce((total, row) => total + Number(row.meters), 0);

  const resetFilters = () => {
    setFeedSearchQuery('');
    setFeedTypeFilter('all');
    setFeedPage(1);
  };
  const runAction = async (key, itemId, action, errorMessage) => {
    if (pendingRef.current.has(key)) return;
    pendingRef.current.add(key);
    setPendingActions(previous => ({ ...previous, [key]: true }));
    setActionErrors(previous => ({ ...previous, [itemId]: '' }));
    try {
      await action();
    } catch {
      setActionErrors(previous => ({ ...previous, [itemId]: errorMessage }));
    } finally {
      pendingRef.current.delete(key);
      setPendingActions(previous => ({ ...previous, [key]: false }));
    }
  };
  const react = (itemId, emoji) => runAction(`reaction:${itemId}`, itemId,
    () => toggleReaction(itemId, emoji), 'Reaction could not be saved. Try again.');
  const postComment = item => {
    if (!newComment[item.id]?.trim()) return;
    return runAction(`comment:${item.id}`, item.id, () => addComment(item.id, item.userId),
      'Comment could not be posted. Your draft is still here.');
  };
  const closeReactionPicker = itemId => {
    setShowReactionPicker(null);
    reactionButtons.current.get(itemId)?.focus();
  };

  useEffect(() => {
    if (!showReactionPicker) return undefined;
    const onKeyDown = event => {
      if (event.key === 'Escape') {
        event.preventDefault();
        setShowReactionPicker(null);
        reactionButtons.current.get(showReactionPicker)?.focus();
      }
    };
    document.addEventListener('keydown', onKeyDown);
    return () => document.removeEventListener('keydown', onKeyDown);
  }, [showReactionPicker, setShowReactionPicker]);

  return (
    <section className="feed-section crew-feed crew-log" aria-labelledby="crew-log-title">
      <div className="feed-heading">
        <div>
          <h2 id="crew-log-title">Crew log</h2>
          {selectedGroupId && <p>{getSelectedGroup()?.name || 'Your group'}</p>}
        </div>
        {currentUser && <button className="crew-log-add" onClick={() => setShowLogModal(true)}><Icon name="ui_plus" size={18} color="currentColor" /> Log a row</button>}
      </div>

      <div className="crew-log-tools" role="search" aria-label="Find crew activity">
      <label className="crew-log-search-label" htmlFor="crew-log-search">Find a rower, group, or challenge</label>
      <div className="search-bar">
        <span className="search-icon"><Icon name="ui_search" size={16} /></span>
        <input
          id="crew-log-search"
          type="search"
          placeholder="Search the crew log…"
          value={feedSearchQuery}
          onChange={(e) => { setFeedSearchQuery(e.target.value); setFeedPage(1); }}
          className="search-input"
        />
        {feedSearchQuery && (
          <button className="search-clear" aria-label="Clear rower search" onClick={() => { setFeedSearchQuery(''); setFeedPage(1); }}>✕</button>
        )}
      </div>

      {/* Feed Type Filters */}
      <div className="feed-filters" role="group" aria-label="Activity type">
        {[
          { key: 'all', label: 'All activity' },
          { key: 'row', label: 'Rows' },
          { key: 'milestone', label: 'Milestones' },
        ].map(f => (
          <button
            key={f.key}
            className={`feed-filter-pill ${feedTypeFilter === f.key ? 'active' : ''}`}
            aria-pressed={feedTypeFilter === f.key}
            onClick={() => { setFeedTypeFilter(f.key); setFeedPage(1); }}
          >{f.label}</button>
        ))}
      </div>
      </div>

      <div className="crew-log-results">
        <p role="status">{isLoading ? 'Loading crew activity…' : feedData.total > 0
          ? `Showing ${feedData.items.length.toLocaleString()} of ${feedData.total.toLocaleString()} ${feedData.total === 1 ? 'entry' : 'entries'}`
          : query || feedTypeFilter !== 'all' ? 'No matching entries' : 'No entries yet'}</p>
        {countedRows.length > 0 && <p className="crew-log-summary" aria-label={`${countedRows.length} counted ${countedRows.length === 1 ? 'row' : 'rows'} in view, ${shownMeters.toLocaleString()} meters`}>
          <strong>{shownMeters.toLocaleString()} m</strong> in view
        </p>}
        {shownRows.length > countedRows.length && <p className="crew-log-summary-note">Only saved, eligible rows contribute to the distance shown.</p>}
      </div>

      {feedData.items.length === 0 ? (
          <div className="crew-log-empty">
            {isLoading ? (
              <p>Fetching the latest from your crew…</p>
            ) : query || feedTypeFilter !== 'all' ? (
              <>
                <Icon name="ui_search" size={28} color="currentColor" />
                <h3>{query ? `No matches for “${query}”` : `No ${feedTypeFilter === 'row' ? 'rows' : 'milestones'} yet`}</h3>
                <p>{query ? 'Try another name, or clear your filters to see the whole crew.' : 'Try all activity to see what your crew has been up to.'}</p>
                <button onClick={resetFilters}>Show all activity</button>
                {!query && feedTypeFilter === 'row' && currentUser && <button className="crew-log-empty-primary" onClick={() => setShowLogModal(true)}>Log a row</button>}
              </>
            ) : (
              <>
                <Icon name="ui_rowing" size={32} color="currentColor" />
                <h3>A fresh page for your crew</h3>
                <p>Rows and milestones will appear here. Start with your first session.</p>
                <button className="crew-log-empty-primary" onClick={currentUser ? () => setShowLogModal(true) : handleSignIn}>{currentUser ? 'Log a row' : 'Sign in to row'}</button>
              </>
            )}
          </div>
        ) : (
          <>
            <div className="activity-feed">
              {feedData.items.map((item, index) => {
                const itemRank = item.user ? getUserRank(item.user.totalMeters) : null;
                const itemTier = itemRank?.tier || 'bronze';
                const date = asDate(item.date);
                const validDate = Number.isFinite(date.getTime());
                const status = rowStatus(item);
                const reactionPending = !!pendingActions[`reaction:${item.id}`];
                const commentPending = !!pendingActions[`comment:${item.id}`];

                return (
                  <React.Fragment key={item.id}>
                  {(index === 0 || dayKey(item.date) !== dayKey(feedData.items[index - 1].date)) && (
                    <h3 className="crew-log-day">{dayLabel(item.date, now)}</h3>
                  )}
                  <article
                    aria-label={`${item.user?.name || 'Crew member'} ${item.type === 'row' ? 'rowing session' : 'crew update'}`}
                    className={`feed-item feed-item-${item.type} ${item.type === 'rank' ? `tier-${getRankTier(item.rank?.rank)}` : ''} ${(item.type === 'row' || item.type === 'achievement') ? `row-tier-${itemTier}` : ''} ${item.userId === currentUser?.uid ? 'is-you' : ''}`}
                  >
                    <button className="feed-avatar feed-avatar-button" disabled={!item.user} aria-label={`View ${item.user?.name || 'rower'} profile`} onClick={() => item.user && setShowUserProfileModal(item.user)}>
                      <AvatarOrPhoto user={item.user} size={40} showBody />
                    </button>
                    <div className="feed-content">
                      <div className="feed-header">
                        <button className="feed-name feed-profile-link" disabled={!item.user} onClick={() => item.user && setShowUserProfileModal(item.user)}>
                          <span>{item.user?.name || 'Crew member'}</span>
                          {item.userId === currentUser?.uid && <span className="crew-log-you">You</span>}
                        </button>
                        <time className="feed-time" dateTime={validDate ? date.toISOString() : undefined} title={validDate ? date.toLocaleString() : undefined}>{validDate ? formatTimeAgo(date) : 'Date unavailable'}</time>
                      </div>
                      <div className="feed-action">
                        {item.type === 'row' && (
                          <>
                            <p className="crew-log-row-details">
                              {(item.sessionType || item.machineType) && <span className="crew-log-what">
                                {item.sessionType && <strong>{sessionNames[item.sessionType] || item.sessionType.replace(/_/g, ' ')}</strong>}
                                {item.sessionType && item.machineType && ' on '}
                                {item.machineType && getMachineName(item.machineType, item.machineCustomName)}
                              </span>}{' '}
                              <span className={`crew-log-verification is-${status.kind}`}><Icon name={status.icon} size={14} color="currentColor" />{status.label}</span>
                            </p>
                            <dl className="crew-log-metrics">
                              <div className="crew-log-distance"><dt>Distance</dt><dd>{validNumber(item.meters) ? Number(item.meters).toLocaleString() : '—'} <small>m</small></dd></div>
                              {validNumber(item.time) && <div><dt>Time</dt><dd>{formatTimeDisplay(Number(item.time))}</dd></div>}
                              {validNumber(item.time) && validNumber(item.meters) && <div><dt>Pace / 500 m</dt><dd>{calculatePace(Number(item.meters), Number(item.time))}</dd></div>}
                            </dl>
                          </>
                        )}
                        {item.type === 'achievement' && (
                          <span className="feed-achievement">
                            {item.achievements && item.achievements.length > 1 ? (() => {
                              const shown = item.achievements.slice(0, 3);
                              const rest = item.achievements.length - shown.length;
                              return (
                                <>
                                  {shown.map((a, i) => (
                                    <span key={a.id} className="feed-achievement-name"><BadgeArtwork achievement={badgeDefinition(a)} size={48} /> <span>{a.name}{i < shown.length - 1 ? ', ' : ''}</span></span>
                                  ))}
                                  {rest > 0 && <span className="feed-achievement-more"> +{rest} more</span>}
                                </>
                              );
                            })() : (
                              <>unlocked <span className="feed-achievement-name"><BadgeArtwork achievement={badgeDefinition(item.achievement)} size={48} /> <span>{item.achievement.name}</span></span></>
                            )}
                          </span>
                        )}
                        {item.type === 'rank' && (() => {
                          const tier = getRankTier(item.rank?.rank);
                          const tierColor = TIER_COLORS[tier] || '#00d4aa';
                          return (
                            <div className="feed-rank-epic">
                              <div className="feed-rank-label">New rank</div>
                              <Icon name={item.rank?.emoji} size={36} />
                              <div className="feed-rank-title">{item.rank?.rank}</div>
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
                    </div>
                    {/* Reactions & Comments */}
                    {currentUser && (
                      <div className="feed-interactions-compact">
                        <div className="reactions-row">
                          {REACTION_EMOJIS.filter(emoji => getReactionCounts(item.id)[emoji] > 0).map(emoji => (
                            <button
                              key={emoji}
                              className={`reaction-pill ${hasUserReacted(item.id, emoji) ? 'active' : ''}`}
                              aria-label={`${emoji}: ${getReactionCounts(item.id)[emoji]} reactions`}
                              aria-pressed={hasUserReacted(item.id, emoji)}
                              disabled={reactionPending}
                              onClick={() => react(item.id, emoji)}
                            >
                              {emoji} {getReactionCounts(item.id)[emoji]}
                            </button>
                          ))}
                          <div className="reaction-picker-wrapper">
                            <button
                              className="add-reaction-btn"
                              ref={element => element ? reactionButtons.current.set(item.id, element) : reactionButtons.current.delete(item.id)}
                              aria-label="Add a reaction"
                              aria-expanded={showReactionPicker === item.id}
                              aria-controls={showReactionPicker === item.id ? `crew-reactions-${item.id}` : undefined}
                              disabled={reactionPending}
                              onClick={(e) => {
                                e.stopPropagation();
                                setShowReactionPicker(showReactionPicker === item.id ? null : item.id);
                              }}
                            ><ReactionIcon /></button>
                            {showReactionPicker === item.id && (
                              <>
                                <div className="reaction-picker-backdrop" aria-hidden="true" onClick={() => closeReactionPicker(item.id)} />
                                <div className="reaction-picker" id={`crew-reactions-${item.id}`} role="group" aria-label="Choose a reaction" onClick={(e) => e.stopPropagation()}>
                                  {REACTION_EMOJIS.map(emoji => (
                                    <button
                                      key={emoji}
                                      className={`picker-emoji ${hasUserReacted(item.id, emoji) ? 'active' : ''}`}
                                      aria-label={`React with ${emoji}`}
                                      aria-pressed={hasUserReacted(item.id, emoji)}
                                      disabled={reactionPending}
                                      onClick={() => { closeReactionPicker(item.id); react(item.id, emoji); }}
                                    >{emoji}</button>
                                  ))}
                                </div>
                              </>
                            )}
                          </div>
                          <button
                            className={`comment-link ${expandedComments[item.id] ? 'active' : ''}`}
                            aria-label={`${expandedComments[item.id] ? 'Hide' : 'Show'} comments (${getItemComments(item.id).length})`}
                            aria-expanded={!!expandedComments[item.id]}
                            aria-controls={expandedComments[item.id] ? `crew-comments-${item.id}` : undefined}
                            onClick={(e) => {
                              e.stopPropagation();
                              setExpandedComments(prev => ({ ...prev, [item.id]: !prev[item.id] }));
                            }}
                          ><Icon name="ui_comment" size={14} /> {getItemComments(item.id).length
                            ? `${getItemComments(item.id).length} ${getItemComments(item.id).length === 1 ? 'comment' : 'comments'}`
                            : 'Comment'}</button>
                        </div>

                        {expandedComments[item.id] && (
                          <div className="comments-compact" id={`crew-comments-${item.id}`} onClick={(e) => e.stopPropagation()}>
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
                                    aria-label={`Reply to ${commentUser?.name || 'crew member'}`}
                                    disabled={commentPending}
                                    onClick={() => setReplyingTo(prev => ({
                                      ...prev,
                                      [item.id]: { commentId: comment.id, userId: comment.userId, userName: commentUser?.name || 'User' }
                                    }))}
                                    title="Reply"
                                  >↩</button>
                                  {comment.userId === currentUser?.uid && (
                                    <button className="comment-delete-inline" aria-label="Delete your comment" onClick={() => deleteComment(comment.id, comment.userId)}>✕</button>
                                  )}
                                </div>
                              );
                            })}
                            {replyingTo[item.id] && (
                              <div className="replying-to-indicator">
                                <span>Replying to @{replyingTo[item.id].userName?.split(' ')[0]}</span>
                                <button aria-label="Cancel reply" onClick={() => setReplyingTo(prev => ({ ...prev, [item.id]: null }))}>✕</button>
                              </div>
                            )}
                            <form className="comment-add-row" onSubmit={event => { event.preventDefault(); postComment(item); }} aria-label={`Comment on ${item.user?.name || 'crew member'}’s entry`}>
                              <input
                                type="text"
                                aria-label={replyingTo[item.id] ? `Reply to ${replyingTo[item.id].userName}` : 'Add a comment'}
                                placeholder={replyingTo[item.id] ? `Reply to ${replyingTo[item.id].userName?.split(' ')[0]}...` : "Add a comment..."}
                                value={newComment[item.id] || ''}
                                disabled={commentPending}
                                onChange={(e) => setNewComment(prev => ({ ...prev, [item.id]: e.target.value }))}
                                maxLength={200}
                              />
                              <button type="submit" aria-label={commentPending ? 'Posting comment' : 'Post comment'} disabled={commentPending || !newComment[item.id]?.trim()}>{commentPending ? 'Posting…' : 'Post'}</button>
                            </form>
                          </div>
                        )}
                      </div>
                    )}
                    {actionErrors[item.id] && <p className="crew-log-error" role="alert">{actionErrors[item.id]}</p>}
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
                        aria-label="Admin: delete feed item"
                      >
                        <Icon name="ui_unverified" size={12} />
                      </button>
                    )}
                  </article>
                  </React.Fragment>
                );
              })}
            </div>
            {feedData.hasMore && (
              <button className="load-more-btn" onClick={() => setFeedPage(prev => prev + 1)}>
                Load more ({feedData.total - feedData.items.length} remaining)
              </button>
            )}
          </>
      )}
      {/* Guest Sign In Prompt */}
      {!currentUser && (
        <div className="guest-prompt">
          <p>Join the conversation, cheer a teammate, and log your next row.</p>
          <button className="signin-prompt-btn" onClick={handleSignIn}>Sign in with Google</button>
        </div>
      )}

      {/* Group Info & Challenges (when group selected) */}
      {selectedGroupId && getSelectedGroup() && (
        <details className="group-info-section">
          <summary className="crew-log-group-summary">Group details & challenges<span>{getSelectedGroup().name}</span></summary>
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
                    <button
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
                    </button>
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
        </details>
      )}

      <CrewPulse compact />

      {currentUser && !wrappedDismissed && !selectedGroupId && getWrappedStats(currentUser.uid) && (
        <div className="crew-wrapped-archive">
          <button onClick={() => setShowWrapped(true)}><Icon name="ui_gift" size={16} /> Revisit your 2025 Wrapped</button>
          <button aria-label="Dismiss 2025 Wrapped link" onClick={() => { setWrappedDismissed(true); localStorage.setItem('wrappedDismissed2025', 'true'); }}>Dismiss</button>
        </div>
      )}
    </section>
  );
}

export default ActivityFeed;
