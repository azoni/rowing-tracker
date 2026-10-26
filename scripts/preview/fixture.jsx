import React, { useRef, useState } from 'react';
import { createRoot } from 'react-dom/client';
import '../../src/App.css';
import { AppContext } from '../../src/context/AppContext';
import { ACHIEVEMENTS, MILESTONES, THEMES, MIN_METERS, MAX_METERS } from '../../src/constants';
import { parseTimeInput } from '../../src/utils';
import { buildLeaderboardStats, getDerivedAchievementProgress, getDerivedAchievements, getMetricProfiles } from '../../src/utils/leaderboardStats';
import { getEligibleEntries } from '../../src/utils/rowingGoals';
import CrewMap from '../../src/components/CrewMap';
import HomeTab from '../../src/components/HomeTab';
import AppNavigation from '../../src/components/AppNavigation';
import Header from '../../src/components/Header';
import StatsTab from '../../src/components/StatsTab';
import ActivityFeed from '../../src/components/ActivityFeed';
import Leaderboard from '../../src/components/Leaderboard';
import EntryForm from '../../src/components/EntryForm';
import ConfirmEntryModal from '../../src/components/ConfirmEntryModal';
import { AchievementModal } from '../../src/components/SmallModals';
import UserProfileModal from '../../src/components/UserProfileModal';
// The design layer loads after every component stylesheet, as in src/index.js.
import '../../src/styles/rowcrew-design.css';

// This preview never imports App.js or Firebase. All writes and auth actions stay
// in memory. Reloading resets everything. Freeze the browser clock before loading
// this entry point when taking repeatable screenshots or testing calendar rules.
const params = new URLSearchParams(window.location.search);
const isEmpty = params.get('empty') === '1';
const isGuest = params.get('guest') === '1';
const isMixed = params.get('mixed') === '1';
const hasStaleCounters = params.get('stale') === '1';
const startsLoading = params.get('loading') === '1';
const PAGE_SIZE = 8;
const now = new Date();
const date = days => {
  if (!days) return new Date(now.getTime() - 5 * 60 * 1000).toISOString();
  const value = new Date(now);
  value.setDate(value.getDate() - days);
  value.setHours(8, 10, 0, 0);
  return value.toISOString();
};
const identity = { uid: 'qa-user' };
const baseProfiles = {
  [identity.uid]: { id: identity.uid, name: 'Alex Morgan', defaultMachine: 'concept2_pm5', unlockedAchievements: isEmpty ? {} : { first_row: date(17), first_5k: date(17) } },
  'crew-2': { id: 'crew-2', name: 'Sam Rivera', defaultMachine: 'concept2_pm5', unlockedAchievements: {} },
  'crew-3': { id: 'crew-3', name: 'Jordan Lee', defaultMachine: 'hydrow', unlockedAchievements: {} },
};
const personalRows = isEmpty ? [] : [
  [0, 2000, 510, 'distance'], [1, 1250, 360, 'free_row'], [3, 3000, 810, 'timed'], [5, 1000, 275, 'interval'],
  [8, 2000, 540, 'distance'], [10, 1500, 420, 'free_row'], [13, 500, 130, 'distance'], [17, 5000, 1400, 'free_row'],
].map(([days, meters, time, sessionType], index) => ({
  id: `row-${index}`, userId: identity.uid, meters, time, calories: Math.round(meters / 13),
  date: date(days), sessionType, machineType: 'concept2_pm5',
  verificationStatus: index === 1 ? 'unverified' : 'verified', localHour: 8,
}));
const crewRows = isEmpty ? [] : [
  { id: 'crew-row-1', userId: 'crew-2', meters: 5000, time: 1302, date: date(0), verificationStatus: 'verified', machineType: 'concept2_pm5', sessionType: 'free_row' },
  { id: 'crew-row-2', userId: 'crew-3', meters: 3000, time: 900, date: date(1), verificationStatus: 'verified', machineType: 'hydrow', sessionType: 'free_row' },
  { id: 'crew-record-1', userId: 'crew-2', meters: 2000, time: 505.5, date: date(2), verificationStatus: 'verified', machineType: 'concept2_pm5', sessionType: 'distance' },
  { id: 'crew-record-2', userId: 'crew-3', meters: 2000, time: 525, date: date(4), verificationStatus: 'verified', machineType: 'hydrow', sessionType: 'distance' },
];
const mixedRows = isEmpty || !isMixed ? [] : [
  { id: 'pending-session', userId: identity.uid, meters: 12000, time: 3300, date: new Date(now.getTime() - 60000).toISOString(), verificationStatus: 'pending_review', machineType: 'concept2_pm5', sessionType: 'distance' },
  { id: 'no-time-session', userId: identity.uid, meters: 1750, time: null, date: new Date(now.getTime() - 120000).toISOString(), verificationStatus: 'unverified', machineType: 'concept2_pm5', sessionType: 'free_row' },
];
const initialEntries = [...mixedRows, ...personalRows, ...crewRows];
const milestoneTypes = new Set(['achievement', 'rank', 'distance_record', 'join', 'group_created', 'group_joined', 'challenge_created', 'throwdown_completed']);
const monitor = 'data:image/svg+xml;charset=utf-8,' + encodeURIComponent('<svg xmlns="http://www.w3.org/2000/svg" width="600" height="400"><rect width="600" height="400" fill="#242b31"/><rect x="90" y="40" width="420" height="320" rx="16" fill="#c3c9b0"/><text x="130" y="105" font-size="24" font-family="monospace" fill="#202820">CONCEPT2 / PM5</text><text x="130" y="180" font-size="56" font-family="monospace" fill="#202820">2000 m</text><text x="130" y="250" font-size="50" font-family="monospace" fill="#202820">8:30</text><text x="130" y="310" font-size="24" font-family="monospace" fill="#202820">2:07.5 /500m</text></svg>');
const noOp = () => {};
const requestedMeters = params.has('meters') ? Number(params.get('meters')) : null;

if (params.get('light') === '1') {
  document.documentElement.setAttribute('data-theme', 'morning-lake');
  Object.entries(THEMES['morning-lake'].colors).forEach(([name, color]) => {
    document.documentElement.style.setProperty('--' + name.replace(/[A-Z]/g, letter => '-' + letter.toLowerCase()), color);
  });
}

function Fixture() {
  const [entries, setEntries] = useState(initialEntries);
  const [isLoading, setIsLoading] = useState(startsLoading);
  const [showCrewMap, setShowCrewMap] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);
  const initialTab = ['home', 'feed', 'leaderboard', 'more'].includes(params.get('tab')) ? params.get('tab') : isGuest || startsLoading ? 'feed' : 'home';
  const [activeTab, setActiveTab] = useState(initialTab);
  const [leaderboardTab, setLeaderboardTab] = useState('alltime');
  const [showLogModal, setShowLogModal] = useState(false);
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [showAchievementModal, setShowAchievementModal] = useState(null);
  const [showUserProfileModal, setShowUserProfileModal] = useState(null);
  const [showNotifications, setShowNotifications] = useState(false);
  const [manualMeters, setManualMeters] = useState('');
  const [manualTime, setManualTime] = useState('');
  const [manualCalories, setManualCalories] = useState('');
  const [editableMeters, setEditableMeters] = useState('2000');
  const [editableTime, setEditableTime] = useState('8:30');
  const [editableCalories, setEditableCalories] = useState('150');
  const [aiMachineType, setAiMachineType] = useState('concept2_pm5');
  const [customMachineName, setCustomMachineName] = useState('');
  const [sessionType, setSessionType] = useState('free_row');
  const [testMode, setTestMode] = useState(false);
  const [validationError, setValidationError] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [isSubmittingManual, setIsSubmittingManual] = useState(false);
  const [capturedImage, setCapturedImage] = useState(null);
  const [feedSearchQuery, setFeedSearchQuery] = useState('');
  const [feedTypeFilter, setFeedTypeFilter] = useState('row');
  const [feedPage, setFeedPage] = useState(1);
  const [expandedComments, setExpandedComments] = useState({});
  const [showReactionPicker, setShowReactionPicker] = useState(null);
  const [newComment, setNewComment] = useState({});
  const [replyingTo, setReplyingTo] = useState({});
  const [wrappedDismissed, setWrappedDismissed] = useState(true);
  const [reactions, setReactions] = useState(isEmpty ? [] : [{ id: 'fixture-cheer', targetId: 'crew-row-1', userId: 'crew-3', emoji: '👏' }]);
  const [comments, setComments] = useState(isEmpty ? [] : [{ id: 'fixture-comment', targetId: 'crew-row-1', userId: 'crew-3', text: 'Strong finish, Sam!', createdAt: date(0) }]);
  const [hiddenActivities, setHiddenActivities] = useState([]);
  const [notice, setNotice] = useState('');
  const fileInputRef = useRef(null);
  const galleryInputRef = useRef(null);
  const sequence = useRef(0);
  const writes = useRef({ held: false, pending: [] });
  const recordAction = action => { window.__qaActions.push(action); setNotice(action); };
  const nextId = prefix => `${prefix}-${++sequence.current}`;
  const waitForWrite = () => writes.current.held ? new Promise((resolve, reject) => writes.current.pending.push({ resolve, reject })) : Promise.resolve();
  const releaseWrites = fail => {
    writes.current.held = false;
    writes.current.pending.splice(0).forEach(pending => fail ? pending.reject(new Error('Synthetic write failure')) : pending.resolve());
  };

  const eligible = getEligibleEntries(entries);
  const profiles = Object.fromEntries(Object.entries(baseProfiles).map(([id, profile]) => {
    const rows = eligible.filter(row => row.userId === id);
    return [id, {
      ...profile, totalMeters: rows.reduce((sum, row) => sum + Number(row.meters), 0),
      totalTime: rows.reduce((sum, row) => sum + (Number(row.time) || 0), 0),
      totalCalories: rows.reduce((sum, row) => sum + (Number(row.calories) || 0), 0),
      uploadCount: rows.length,
      ...(hasStaleCounters ? { totalMeters: 999999, totalTime: 999999, totalCalories: 999999, uploadCount: 999 } : {}),
    }];
  }));
  const userProfile = profiles[identity.uid];
  // Keep the signed-in member's empty profile, as the real app does. No other
  // members, rows, milestones, comments, or reactions exist in the empty crew.
  const users = isEmpty ? { [identity.uid]: userProfile } : profiles;
  const visibleEntries = isLoading ? [] : entries;
  const leaderboardStats = buildLeaderboardStats({ users, entries: visibleEntries, now: new Date() });
  const metricUsers = getMetricProfiles(leaderboardStats);
  const calculateStreak = uid => leaderboardStats.byUser[uid]?.streak || 0;
  const calculateLongestStreak = uid => leaderboardStats.byUser[uid]?.longestStreak || 0;
  const calculateWeeklyAverage = uid => leaderboardStats.byUser[uid]?.weeklyAvg || 0;
  const getPersonalRecord = uid => leaderboardStats.byUser[uid]?.longestRow || 0;
  const getTotalDaysRowed = uid => leaderboardStats.byUser[uid]?.activeDays || 0;
  const getFirstRowDate = uid => leaderboardStats.byUser[uid]?.firstRowDate || null;
  const getAchievementProgress = (uid, achievement) => getDerivedAchievementProgress(leaderboardStats.byUser[uid], achievement);
  const getUserAchievements = uid => getDerivedAchievements(leaderboardStats.byUser[uid]);
  const openReview = () => {
    if (isGuest) return;
    setCapturedImage({ data: monitor, dataUrl: monitor, imageData: monitor, claudeResult: { extractedMeters: 2000, confidence: 98 } });
    setEditableMeters('2000'); setEditableTime('8:30'); setEditableCalories('150');
    setAiMachineType('concept2_pm5'); setValidationError('');
    setShowLogModal(false); setShowConfirmModal(true);
  };
  const saveRow = async mode => {
    if (isGuest || isSubmittingManual || isProcessing) return;
    const photo = mode === 'photo';
    const meters = Number(photo ? editableMeters : manualMeters);
    const timeInput = photo ? editableTime : manualTime;
    const time = parseTimeInput(timeInput);
    if (!Number.isInteger(meters) || meters < MIN_METERS || meters > MAX_METERS || (timeInput.trim() && !(time > 0))) {
      setValidationError('Enter a valid distance and optional time.');
      return;
    }
    photo ? setIsProcessing(true) : setIsSubmittingManual(true);
    try {
      await waitForWrite();
      if (testMode !== 'dry') setEntries(previous => [{
        id: nextId('local-row'), userId: identity.uid, meters, time: time || null,
        calories: Number(photo ? editableCalories : manualCalories) || null,
        date: new Date().toISOString(), sessionType, machineType: aiMachineType || 'concept2_pm5',
        machineCustomName: customMachineName, verificationStatus: photo ? 'verified' : 'unverified',
        ...(testMode === 'review' ? { verificationStatus: 'pending_review', isTest: true } : {}),
      }, ...previous]);
      recordAction(testMode === 'dry' ? 'Dry run completed locally; no row saved' : photo ? 'Photo row saved locally' : 'Manual row saved locally');
      setShowLogModal(false); setShowConfirmModal(false); setCapturedImage(null);
      setManualMeters(''); setManualTime(''); setManualCalories(''); setValidationError('');
    } catch {
      setValidationError('Synthetic save failed. Your draft is unchanged.');
    } finally {
      photo ? setIsProcessing(false) : setIsSubmittingManual(false);
    }
  };
  const feed = isLoading ? [] : [
    ...entries.filter(row => !row.isTest).map(row => ({ ...row, type: 'row', user: profiles[row.userId] })),
    ...(!isEmpty ? [{ id: 'crew-badge', type: 'achievement', userId: 'crew-3', user: profiles['crew-3'], achievement: ACHIEVEMENTS[0], date: date(1) }] : []),
  ].filter(item => !hiddenActivities.includes(item.id)).sort((a, b) => new Date(b.date) - new Date(a.date));
  const getActivityFeed = (query = '', page = 1, type = 'all') => {
    const search = query.trim().toLocaleLowerCase();
    const filtered = feed.filter(item => (
      (type === 'all' || (type === 'milestone' ? milestoneTypes.has(item.type) : item.type === type)) &&
      (!search || [item.user?.name, item.groupName, item.challengeName].some(value => value?.toLocaleLowerCase().includes(search)))
    ));
    const shown = filtered.slice(0, Math.max(1, page) * PAGE_SIZE);
    return { items: shown, total: filtered.length, hasMore: shown.length < filtered.length };
  };
  const toggleReaction = async (id, emoji) => {
    if (isGuest) return;
    await waitForWrite();
    setReactions(previous => previous.some(item => item.targetId === id && item.userId === identity.uid && item.emoji === emoji)
      ? previous.filter(item => !(item.targetId === id && item.userId === identity.uid && item.emoji === emoji))
      : [...previous, { id: nextId('local-reaction'), targetId: id, userId: identity.uid, emoji }]);
    recordAction(`Reaction ${emoji} on ${id}`);
  };
  const addComment = async (id, ownerId) => {
    const text = newComment[id]?.trim();
    if (isGuest || !text) return;
    const reply = replyingTo[id];
    await waitForWrite();
    setComments(previous => [...previous, {
      id: nextId('local-comment'), targetId: id, userId: identity.uid, text: text.slice(0, 200),
      createdAt: new Date().toISOString(),
      ...(reply ? { replyToId: reply.commentId, replyToUserId: reply.userId, replyToName: reply.userName } : {}),
    }]);
    setNewComment(previous => previous[id]?.trim() === text ? { ...previous, [id]: '' } : previous);
    setReplyingTo(previous => ({ ...previous, [id]: null }));
    recordAction(`Comment posted locally on ${id} for ${ownerId}`);
  };
  const totalMeters = Number.isFinite(requestedMeters) && requestedMeters >= 0 ? requestedMeters
    : leaderboardStats.globalSummary.meters;
  const value = {
    currentUser: isGuest ? null : identity, userProfile: isGuest ? null : userProfile, users, metricUsers,
    entries: visibleEntries, isLoading, isAdmin, activeTab, setActiveTab,
    getAchievementProgress, getUserAchievements, calculateStreak, calculateLongestStreak,
    calculateWeeklyAverage, getPersonalRecord, getTotalDaysRowed, getFirstRowDate,
    leaderboardStats, leaderboardTab, setLeaderboardTab, getLeaderboard: leaderboardStats.allTime,
    getWeeklyLeaderboard: leaderboardStats.weekly, getStreakLeaderboard: leaderboardStats.streaks,
    getAchievementsLeaderboard: leaderboardStats.achievements, getDistanceRecords: leaderboardStats.records,
    setShowRankProgressModal: () => recordAction('Ranks opened'), setShowAchievementModal, showAchievementModal,
    setShowSessionHistory: () => recordAction('History opened'), setShowSettingsModal: () => recordAction('Settings opened'),
    getUserSessionHistory: uid => entries.filter(row => row.userId === uid).sort((a, b) => new Date(b.date) - new Date(a.date)),
    setShowAdminPanel: noOp, loadPendingReviews: noOp, handleSignOut: () => recordAction('Sign out requested'),
    handleSignIn: () => recordAction('Sign in requested in synthetic preview'),
    setShowWelcomeModal: () => recordAction('About Row Crew opened'), showCrewMap, setShowCrewMap, setShowJourneyModal: noOp,
    totalMeters, worldProgress: totalMeters / 40075000 * 100, milestoneProgress: { current: MILESTONES[0], next: MILESTONES[1] },
    showNotifications, setShowNotifications, notifications: [], unreadNotificationCount: 0, markAllNotificationsRead: noOp, markNotificationRead: noOp,
    showLogModal, setShowLogModal, fileInputRef, galleryInputRef, handleImageUpload: openReview,
    manualMeters, setManualMeters, manualTime, setManualTime, manualCalories, setManualCalories,
    isSubmittingManual, isProcessing, processingStatus: 'Reading your monitor…', handleManualSubmit: () => saveRow('manual'),
    aiMachineType, setAiMachineType, customMachineName, setCustomMachineName, sessionType, setSessionType, testMode, setTestMode, validationError, setValidationError,
    showConfirmModal, setShowConfirmModal, capturedImage, setCapturedImage,
    editableMeters, setEditableMeters, editableTime, setEditableTime, editableCalories, setEditableCalories,
    detectedMeters: 2000, detectedTime: '8:30', detectedCalories: 150, handleConfirmEntry: () => saveRow('photo'),
    selectedGroupId: null, getSelectedGroup: () => null, isGroupAdmin: () => false, challenges: [],
    getChallengeStatus: () => 'active', getChallengeProgress: () => null,
    setShowChallengeDetail: noOp, setShowCreateChallengeModal: noOp, setShowManageMembersModal: noOp, setShowInviteUserModal: noOp, handleLeaveGroup: noOp,
    feedSearchQuery, setFeedSearchQuery, feedTypeFilter, setFeedTypeFilter, feedPage, setFeedPage, FEED_PAGE_SIZE: PAGE_SIZE, getActivityFeed,
    showUserProfileModal, setShowUserProfileModal,
    showReactionPicker, setShowReactionPicker, REACTION_EMOJIS: ['🔥', '💪', '👏', '🚣'],
    getReactionCounts: id => reactions.filter(item => item.targetId === id).reduce((counts, item) => ({ ...counts, [item.emoji]: (counts[item.emoji] || 0) + 1 }), {}),
    hasUserReacted: (id, emoji) => !isGuest && reactions.some(item => item.targetId === id && item.userId === identity.uid && item.emoji === emoji),
    toggleReaction, expandedComments, setExpandedComments,
    getItemComments: id => comments.filter(comment => comment.targetId === id).sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt)),
    newComment, setNewComment, replyingTo, setReplyingTo, addComment,
    deleteComment: (id, uid) => {
      if (isGuest || uid !== identity.uid) return;
      setComments(previous => previous.filter(comment => !(comment.id === id && comment.userId === identity.uid)));
      recordAction(`Comment deleted locally: ${id}`);
    },
    deleteActivity: (id, type) => {
      if (!isAdmin) return;
      if (type === 'row') setEntries(previous => previous.filter(row => row.id !== id));
      else setHiddenActivities(previous => [...previous, id]);
      recordAction(`Activity deleted locally: ${id}`);
    },
    wrappedDismissed, setWrappedDismissed, getWrappedStats: () => null, setShowWrapped: noOp,
  };

  // Preview-only test controls. This entry point is not part of the production bundle.
  window.__rowcrewQA = {
    now: now.toISOString(), setShowCrewMap, setIsAdmin, openReview, setIsProcessing, setIsLoading,
    setActiveTab, setLeaderboardTab, setShowLogModal, setValidationError, setEditableMeters, setEditableTime, setAiMachineType,
    holdWrites: () => { writes.current.held = true; }, releaseWrites: () => releaseWrites(false), failWrites: () => releaseWrites(true),
    snapshot: () => ({ entries, comments, reactions, totalMeters, leaderboardStats, metricUsers, users, showUserProfileModal, isLoading }),
  };
  return <AppContext.Provider value={value}>
    <aside aria-label="Preview information" style={{ padding: '8px 16px', textAlign: 'center', fontSize: 13, color: 'var(--text-secondary)' }}>Local preview · Sample data · Changes reset on refresh</aside>
    <div className="app">
      <Header />
      <main className="main-content" id="crew-main" tabIndex={-1}>
        {activeTab === 'home' ? <HomeTab /> : activeTab === 'more' ? <StatsTab /> : activeTab === 'feed' ? <ActivityFeed /> : <Leaderboard />}
      </main>
      <AppNavigation /><EntryForm /><ConfirmEntryModal /><AchievementModal /><UserProfileModal /><CrewMap />
      <output id="qa-action" aria-live="polite" style={{ display: notice && !showLogModal && !showConfirmModal && !showCrewMap && !showAchievementModal && !showUserProfileModal ? 'block' : 'none', pointerEvents: 'none', position: 'fixed', bottom: 110, left: 16, maxWidth: 300, zIndex: 70, padding: '10px 14px', borderRadius: 10, border: '1px solid var(--border-color)', background: 'var(--bg-card)', color: 'var(--text-primary)', fontSize: 13 }}> {notice ? `Preview action: ${notice}` : ''}</output>
    </div>
  </AppContext.Provider>;
}

window.__qaActions = [];
createRoot(document.getElementById('root')).render(<Fixture />);
