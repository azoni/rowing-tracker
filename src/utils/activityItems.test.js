import { buildActivityItem } from './activityItems';

const user = Object.freeze({ id: 'rower', name: 'Amir' });
const timestamp = '2026-10-25T18:00:00.000Z';
const common = {
  id: 'activity-1', userId: 'rower', createdAt: timestamp,
  groupId: 'crew-1', groupName: 'Early crew',
  challengeId: 'challenge-1', challengeName: 'October distance', challengeType: 'distance',
};

test('preserves the persisted exact-distance result in the feed without forwarding unrelated payloads', () => {
  const record = {
    distanceLabel: '2k', distanceMeters: 2000, time: 420, previousBest: 435,
    isFirstRecord: false, machineType: 'concept2_pm5', sessionType: 'distance',
  };
  const activity = Object.freeze({ ...common, type: 'distance_record', ...record, internalMetadata: 'not a feed field' });
  const item = buildActivityItem(activity, user);
  expect(item).toEqual({
    id: common.id, type: 'distance_record', userId: common.userId, user,
    groupId: common.groupId, groupName: common.groupName,
    challengeId: common.challengeId, challengeName: common.challengeName, challengeType: common.challengeType,
    date: timestamp, sortDate: new Date(timestamp), ...record,
  });
  expect(item.user).toBe(user);
});

test('retains a first record with no previous best and resolves a Firestore timestamp', () => {
  const createdAt = Object.freeze({ toDate: () => new Date(timestamp) });
  const item = buildActivityItem({
    ...common, type: 'distance_record', createdAt,
    distanceLabel: '5k', distanceMeters: 5000, time: 1200, previousBest: null,
    isFirstRecord: true, machineType: 'waterrower', sessionType: 'free_row',
  }, user);
  expect(item).toMatchObject({
    type: 'distance_record', distanceLabel: '5k', distanceMeters: 5000, time: 1200,
    previousBest: null, isFirstRecord: true, machineType: 'waterrower', sessionType: 'free_row',
    date: timestamp, sortDate: new Date(timestamp),
  });
});

test.each(['group_created', 'group_joined', 'challenge_created'])('retains legacy %s fields and excludes record-only metadata', type => {
  const item = buildActivityItem({ ...common, type, distanceMeters: 2000 }, user);
  expect(item).toMatchObject({
    id: common.id, userId: common.userId, type, user,
    groupId: common.groupId, groupName: common.groupName,
    challengeId: common.challengeId, challengeName: common.challengeName, challengeType: common.challengeType,
    date: timestamp, sortDate: new Date(timestamp),
  });
  expect(item).not.toHaveProperty('distanceMeters');
});

test.each([null, undefined, '', '  ', 'not a date', false, {}, [], NaN, Infinity, new Date(NaN),
  { toDate: () => null }, { toDate: () => { throw new Error('unresolved'); } },
])('skips an unresolved or invalid timestamp (%p) without breaking the feed', createdAt => {
  expect(buildActivityItem({ ...common, createdAt }, user)).toBeNull();
});

test('accepts Date and millisecond timestamps without reusing mutable dates', () => {
  const createdAt = new Date(timestamp);
  const item = buildActivityItem({ ...common, createdAt }, user);
  expect(item.date).toBe(timestamp);
  expect(item.sortDate).not.toBe(createdAt);
  expect(buildActivityItem({ ...common, createdAt: createdAt.getTime() }, user).date).toBe(timestamp);
});

test('skips an unresolved activity or user', () => {
  expect(buildActivityItem(null, user)).toBeNull();
  expect(buildActivityItem(common, undefined)).toBeNull();
});
