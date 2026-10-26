import React, { act } from 'react';
import { createRoot } from 'react-dom/client';
import { Simulate } from 'react-dom/test-utils';
import { useApp } from '../context/AppContext';
import { ACHIEVEMENTS } from '../constants';
import ActivityFeed from './ActivityFeed';

jest.mock('../context/AppContext', () => ({ useApp: jest.fn() }));
jest.mock('./Avatar', () => () => <span aria-hidden="true">avatar</span>);
jest.mock('./CrewPulse', () => ({ compact }) => compact
  ? <details className="crew-pulse-panel"><summary>This week together</summary><section aria-label="Weekly crew goal" /></details>
  : <section aria-label="Weekly crew goal" />);

let root;
let container;
let context;
let items;
const now = new Date(2026, 9, 15, 12);
const rower = { id: 'rower-a', name: 'Alex Rivera', totalMeters: 25000 };
const row = (id, extra = {}) => ({
  id, userId: rower.id, user: rower, type: 'row', meters: 2000, time: 480,
  date: new Date(2026, 9, 15, 10).toISOString(), verificationStatus: 'verified', ...extra,
});
const render = () => act(() => root.render(<ActivityFeed />));
const button = text => [...container.querySelectorAll('button')].find(element => element.textContent.trim() === text);
const namedButton = name => container.querySelector(`button[aria-label="${name}"]`);
const stateSetter = name => jest.fn(value => {
  context[name] = typeof value === 'function' ? value(context[name]) : value;
  root.render(<ActivityFeed />);
});

beforeEach(() => {
  global.IS_REACT_ACT_ENVIRONMENT = true;
  jest.useFakeTimers().setSystemTime(now);
  container = document.createElement('div');
  document.body.appendChild(container);
  root = createRoot(container);
  items = [row('actual-session')];
  context = {
    currentUser: { uid: 'me' }, users: { [rower.id]: rower, me: { name: 'Me' } },
    isAdmin: false, deleteActivity: jest.fn(), selectedGroupId: null,
    getSelectedGroup: jest.fn(), isGroupAdmin: jest.fn(() => false), challenges: [],
    feedSearchQuery: '', feedTypeFilter: 'row', feedPage: 1, isLoading: false,
    getActivityFeed: jest.fn(() => ({ items, total: items.length, hasMore: false })),
    handleSignIn: jest.fn(), setShowUserProfileModal: jest.fn(), setShowLogModal: jest.fn(),
    showReactionPicker: null, REACTION_EMOJIS: ['👏', '🔥'],
    getReactionCounts: jest.fn(() => ({ '👏': 2 })), hasUserReacted: jest.fn(() => false),
    toggleReaction: jest.fn().mockResolvedValue(undefined), expandedComments: {},
    getItemComments: jest.fn(() => []), newComment: {}, replyingTo: {},
    addComment: jest.fn().mockResolvedValue(undefined), deleteComment: jest.fn(),
    wrappedDismissed: true, getWrappedStats: jest.fn(() => null), setShowWrapped: jest.fn(),
  };
  ['feedSearchQuery', 'feedTypeFilter', 'feedPage', 'showReactionPicker', 'expandedComments',
    'newComment', 'replyingTo', 'wrappedDismissed'].forEach(name => {
    context[`set${name[0].toUpperCase()}${name.slice(1)}`] = stateSetter(name);
  });
  useApp.mockImplementation(() => context);
});

afterEach(() => {
  act(() => root.unmount());
  container.remove();
  jest.useRealTimers();
  jest.restoreAllMocks();
});

test('labels and trims search, resets pagination, and exposes the selected activity filter', () => {
  context.feedPage = 3;
  render();
  const input = container.querySelector('#crew-log-search');
  expect(container.querySelector('label[for="crew-log-search"]').textContent).toContain('rower, group, or challenge');
  act(() => Simulate.change(input, { target: { value: '  Alex  ' } }));
  expect(context.getActivityFeed).toHaveBeenLastCalledWith('Alex', 1, 'row');
  expect(context.setFeedPage).toHaveBeenCalledWith(1);
  act(() => Simulate.click(button('Milestones')));
  expect(context.setFeedTypeFilter).toHaveBeenCalledWith('milestone');
  expect(button('Milestones').getAttribute('aria-pressed')).toBe('true');
  act(() => Simulate.click(namedButton('Clear rower search')));
  expect(input.value).toBe('');
});

test('describes only eligible rows in view and groups real sessions by local date', () => {
  items = [
    row('verified', { meters: '2000' }),
    row('manual', { meters: 1000, verificationStatus: 'unverified' }),
    row('pending', { meters: 50000, verificationStatus: 'pending_review' }),
    row('rejected', { meters: 50000, verificationStatus: 'rejected' }),
    row('future', { meters: 50000, date: new Date(2026, 9, 16, 10).toISOString() }),
    row('test', { meters: 50000, isTest: true }),
    row('invalid', { meters: 'NaN' }),
    { id: 'joined', type: 'join', user: rower, date: new Date(2026, 9, 14, 10).toISOString() },
  ];
  context.getActivityFeed.mockImplementation(() => ({ items, total: 30, hasMore: true }));
  render();
  expect(container.querySelector('[role="status"]').textContent).toBe('Showing 8 of 30 entries');
  expect(container.querySelector('.crew-log-summary').textContent).toBe('3,000 m in view');
  expect(container.querySelector('.crew-log-summary').getAttribute('aria-label')).toBe('2 counted rows in view, 3,000 meters');
  expect([...container.querySelectorAll('.crew-log-day')].map(element => element.textContent)).toEqual(['Today', 'Fri, Oct 16', 'Today', 'Yesterday']);
  expect(container.querySelector('.crew-log-summary-note')).not.toBeNull();
  act(() => Simulate.click(button('Load More (22 remaining)')));
  expect(context.feedPage).toBe(2);
});

test('shows accessible session metrics and explicit verification without inventing missing time or pace', () => {
  items = [row('verified', { machineType: 'other', machineCustomName: 'Boathouse erg', sessionType: 'distance' }), row('manual', { time: null, verificationStatus: 'unverified' }), row('pending', { verificationStatus: 'pending_review' })];
  render();
  const articles = container.querySelectorAll('article');
  expect(articles[0].getAttribute('aria-label')).toBe('Alex Rivera rowing session');
  expect([...articles[0].querySelectorAll('dt')].map(element => element.textContent)).toEqual(['Distance', 'Time', 'Pace / 500 m']);
  expect(articles[0].textContent).toContain('2:00.0');
  expect(articles[0].textContent).toContain('Photo verified');
  expect(articles[0].textContent).toContain('Boathouse erg');
  expect(articles[1].querySelectorAll('dt')).toHaveLength(1);
  expect(articles[1].textContent).toContain('Manual entry');
  expect(articles[2].textContent).toContain('Awaiting review');
  expect(articles[0].querySelector('time').dateTime).toBe(items[0].date);
  act(() => Simulate.click(articles[0].querySelector('.feed-profile-link')));
  expect(context.setShowUserProfileModal).toHaveBeenCalledWith(rower);
});

test('renders earned badge artwork while preserving single and grouped achievement names', () => {
  const achievements = ACHIEVEMENTS.slice(0, 4).map(({ id, name }) => ({ id, name }));
  items = [
    { ...row('earned-one'), type: 'achievement', achievement: achievements[0] },
    { ...row('earned-many'), type: 'achievement', achievement: achievements[0], achievements },
  ];
  render();
  const articles = container.querySelectorAll('article');
  expect(articles[0].textContent.replace(/\s+/g, ' ')).toContain(`unlocked ${achievements[0].name}`);
  expect(articles[0].querySelectorAll('.badge-artwork')).toHaveLength(1);
  expect(articles[1].querySelectorAll('.badge-artwork')).toHaveLength(3);
  achievements.slice(0, 3).forEach(achievement => expect(articles[1].textContent).toContain(achievement.name));
  expect(articles[1].textContent).toContain('+1 more');
  expect(articles[1].textContent).not.toContain(achievements[3].name);
  expect([...container.querySelectorAll('.badge-artwork')].every(art => art.getAttribute('aria-hidden') === 'true')).toBe(true);
});

test('uses a real empty state once loading finishes and lets a member log a first row', () => {
  items = [];
  context.feedTypeFilter = 'all';
  context.isLoading = true;
  render();
  expect(container.textContent).toContain('Fetching the latest');
  expect(container.textContent).not.toContain('A fresh page');
  context.isLoading = false;
  render();
  expect(container.querySelector('.crew-log-empty').textContent).toContain('A fresh page for your crew');
  expect(container.querySelector('.skeleton-feed')).toBeNull();
  act(() => Simulate.click(container.querySelector('.crew-log-empty-primary')));
  expect(context.setShowLogModal).toHaveBeenCalledWith(true);
});

test('no results offers a complete filter reset without confusing it with a loading state', () => {
  items = [];
  context.feedSearchQuery = 'No such rower';
  context.feedTypeFilter = 'milestone';
  context.feedPage = 4;
  render();
  expect(container.querySelector('.crew-log-empty').textContent).toContain('No matches for “No such rower”');
  act(() => Simulate.click(button('Show all activity')));
  expect(context.feedSearchQuery).toBe('');
  expect(context.feedTypeFilter).toBe('all');
  expect(context.feedPage).toBe(1);
});

test('guests can read sessions and open profiles but cannot send reactions or comments', () => {
  context.currentUser = null;
  render();
  expect(container.querySelectorAll('article')).toHaveLength(1);
  expect(container.querySelector('.feed-interactions-compact')).toBeNull();
  expect(button('Log a row')).toBeUndefined();
  act(() => Simulate.click(button('Sign in with Google')));
  expect(context.handleSignIn).toHaveBeenCalledTimes(1);
  act(() => Simulate.click(namedButton('View Alex Rivera profile')));
  expect(context.setShowUserProfileModal).toHaveBeenCalledWith(rower);
});

test('reaction picker closes on Escape and returns focus, while repeated taps await the existing save', async () => {
  let finish;
  context.toggleReaction.mockImplementation(() => new Promise(resolve => { finish = resolve; }));
  render();
  const opener = namedButton('Add a reaction');
  act(() => Simulate.click(opener));
  expect(container.querySelector('[aria-label="Choose a reaction"]')).not.toBeNull();
  act(() => document.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape', bubbles: true })));
  expect(container.querySelector('[aria-label="Choose a reaction"]')).toBeNull();
  expect(document.activeElement).toBe(opener);
  act(() => {
    Simulate.click(namedButton('👏: 2 reactions'));
    Simulate.click(namedButton('👏: 2 reactions'));
  });
  expect(context.toggleReaction).toHaveBeenCalledTimes(1);
  expect(context.toggleReaction).toHaveBeenCalledWith('actual-session', '👏');
  expect(opener.disabled).toBe(true);
  await act(async () => finish());
  expect(opener.disabled).toBe(false);
});

test('comments preserve owner and reply bindings, block duplicate submits, and recover with the draft on failure', async () => {
  let fail;
  context.getItemComments.mockReturnValue([{ id: 'comment-a', userId: rower.id, text: 'Great row!' }]);
  context.addComment.mockImplementation(() => new Promise((resolve, reject) => { fail = reject; }));
  render();
  act(() => Simulate.click(namedButton('Show comments (1)')));
  expect(namedButton('Delete your comment')).toBeNull();
  act(() => Simulate.click(namedButton('Reply to Alex Rivera')));
  expect(context.replyingTo['actual-session']).toEqual({ commentId: 'comment-a', userId: rower.id, userName: rower.name });
  const input = container.querySelector('.comment-add-row input');
  act(() => Simulate.change(input, { target: { value: 'Thanks, Alex!' } }));
  const form = container.querySelector('form');
  act(() => { Simulate.submit(form); Simulate.submit(form); });
  expect(context.addComment).toHaveBeenCalledTimes(1);
  expect(context.addComment).toHaveBeenCalledWith('actual-session', rower.id);
  expect(input.disabled).toBe(true);
  expect(namedButton('Posting comment').disabled).toBe(true);
  await act(async () => fail(new Error('Synthetic unavailable service')));
  expect(container.querySelector('[role="alert"]').textContent).toContain('Your draft is still here');
  expect(input.disabled).toBe(false);
  expect(input.value).toBe('Thanks, Alex!');
  context.addComment.mockResolvedValueOnce(undefined);
  await act(async () => Simulate.submit(form));
  expect(context.addComment).toHaveBeenCalledTimes(2);
  expect(container.querySelector('[role="alert"]')).toBeNull();
});

test('keeps group actions on the existing callbacks and confirms before leaving', () => {
  context.selectedGroupId = 'actual-group';
  context.getSelectedGroup.mockReturnValue({ id: 'actual-group', name: 'Dawn crew', memberIds: ['me', rower.id], inviteCode: 'CREW' });
  context.isGroupAdmin.mockReturnValue(true);
  context.setShowManageMembersModal = jest.fn();
  context.handleLeaveGroup = jest.fn();
  jest.spyOn(window, 'confirm').mockReturnValue(false);
  render();
  const groupDetails = container.querySelector('.group-info-section');
  expect(groupDetails.tagName).toBe('DETAILS');
  expect(groupDetails.open).toBe(false);
  groupDetails.open = true;
  act(() => Simulate.click(button('Manage')));
  expect(context.setShowManageMembersModal).toHaveBeenCalledWith(true);
  act(() => Simulate.click(button('Leave')));
  expect(context.handleLeaveGroup).not.toHaveBeenCalled();
  window.confirm.mockReturnValue(true);
  act(() => Simulate.click(button('Leave')));
  expect(context.handleLeaveGroup).toHaveBeenCalledWith('actual-group');
});

test('puts real sessions before optional crew details and the guest prompt in reading order', () => {
  context.currentUser = null;
  render();
  const feed = container.querySelector('.activity-feed');
  const goal = container.querySelector('.crew-pulse-panel');
  const guest = container.querySelector('.guest-prompt');
  expect(goal.open).toBe(false);
  expect(feed.compareDocumentPosition(goal) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();
  expect(feed.compareDocumentPosition(guest) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();
  expect(container.querySelector('.crew-log-tools').compareDocumentPosition(feed) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();
  expect(container.querySelectorAll('article')).toHaveLength(1);
  expect(context.toggleReaction).not.toHaveBeenCalled();
  expect(context.addComment).not.toHaveBeenCalled();
});
