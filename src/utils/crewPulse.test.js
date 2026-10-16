import { getCrewPulse, getCrewSpotlights, getCrewWeek } from './crewPulse';

const now = new Date(2026, 9, 15, 12);
const users = { me: { name: 'Zoe' }, a: { name: 'Amir' }, b: { id: 'wrong-id', name: 'Bea' } };
const row = (id, day, meters = 1000, userId = 'a', extra = {}) => ({
  id, userId, meters, date: new Date(2026, 9, day, 9).toISOString(), ...extra,
});
const pulse = (entries, extra = {}) => getCrewPulse({ entries, users, currentUserId: 'me', now, ...extra });

test('uses only the four completed weeks, includes zero weeks, and keeps the target stable as current rows arrive', () => {
  const history = [row('first-boundary', 1, 4000, 'a', { date: new Date(2026, 8, 14).toISOString() }),
    row('prior', 5, 4000), row('too-old', 1, 50000, 'a', { date: new Date(2026, 8, 13, 23, 59).toISOString() })];
  const before = pulse(history);
  const after = pulse([...history, row('this-week', 12, 50000)]);
  expect(before.weeklyAverage).toBe(2000);
  expect(before.target).toBe(3000);
  expect(after.target).toBe(before.target);
  expect(after.meters).toBe(50000);
  expect(after.complete).toBe(true);
  expect(after.percent).toBe(100);
  expect(after.remaining).toBe(0);
});

test('counts distinct real rows and contributor identities, excluding future, invalid, review, test, and orphan records', () => {
  const entries = [row('valid', 12, '2000'), row('mine', 13, 500, 'me'), row('valid', 12, 2000),
    row('pending', 12, 1000, 'a', { verificationStatus: 'pending_review' }),
    row('pending-old', 12, 1000, 'a', { verificationStatus: 'pending' }),
    row('rejected', 12, 1000, 'a', { verificationStatus: 'rejected' }),
    row('test', 12, 1000, 'a', { isTest: true }), row('future', 16),
    row('later-today', 15, 1000, 'a', { date: new Date(2026, 9, 15, 13).toISOString() }),
    row('invalid', 12, 0), row('invalid-date', 12, 1000, 'a', { date: 'broken' }),
    row('orphan', 12, 1000, 'missing'), row(null, 12), row('infinite', 12, Infinity)];
  const result = pulse(entries);
  expect(result.meters).toBe(2500);
  expect(result.sessions).toBe(2);
  expect(result.activeDays).toBe(2);
  expect(result.currentUserMeters).toBe(500);
  expect(result.contributors.map(person => person.userId)).toEqual(['a', 'me']);
});

test('group membership scopes current totals, historical goal, identities, and spotlights without leaking a global fallback', () => {
  const entries = [row('a-prior', 5, 50000), row('b-prior', 6, 8000, 'b'), row('a-now', 14, 5000), row('b-now', 14, 1200, 'b')];
  const group = pulse(entries, { memberIds: ['b'] });
  expect(group.weeklyAverage).toBe(2000);
  expect(group.meters).toBe(1200);
  expect(group.contributors[0].user.id).toBe('b');
  expect(getCrewSpotlights(group.rows, 'me', () => ({}), now).map(entry => entry.id)).toEqual(['b-now']);
  const unloaded = pulse(entries, { memberIds: [] });
  expect(unloaded.rows).toEqual([]);
  expect(unloaded.meters).toBe(0);
});

test('empty and inactive crews get an explicit starter target, while small recent activity gets a proportional minimum', () => {
  expect(pulse([])).toMatchObject({ meters: 0, target: 5000, hasHistory: false, contributors: [] });
  expect(pulse([row('ancient', 1, 50000, 'a', { date: '2020-01-01T10:00:00Z' })]).target).toBe(5000);
  expect(pulse([row('small', 5, 1000)])).toMatchObject({ weeklyAverage: 250, target: 1000, hasHistory: true });
});

test.each([new Date(2026, 2, 8, 23, 30), new Date(2026, 10, 1, 23, 30)])(
  'calendar weeks include the whole Sunday around DST (%s) and exclude next Monday', checkDate => {
    const { start, end, historyStart } = getCrewWeek(checkDate);
    expect(start.getDay()).toBe(1);
    expect(end.getDay()).toBe(1);
    expect(start.getHours()).toBe(0);
    expect(end.getHours()).toBe(0);
    expect(end - start).toBe((7 * 24 * 60 + end.getTimezoneOffset() - start.getTimezoneOffset()) * 60000);
    const fourWeeks = new Date(start);
    fourWeeks.setDate(fourWeeks.getDate() - 28);
    expect(historyStart).toEqual(fourWeeks);
    const entries = [row('sunday', 1, 1500, 'a', { date: checkDate.toISOString() }),
      row('next-monday', 1, 9999, 'a', { date: end.toISOString() })];
    expect(pulse(entries, { now: checkDate }).meters).toBe(1500);
    expect(pulse(entries, { now: end }).meters).toBe(9999);
  });

test('Monday-to-Sunday weeks cross year boundaries correctly and support Firestore timestamps', () => {
  const checkDate = new Date(2027, 0, 3, 23);
  expect(getCrewWeek(checkDate).start).toEqual(new Date(2026, 11, 28));
  const date = new Date(2027, 0, 1, 10);
  expect(pulse([row('timestamp', 1, 750, 'a', { date: { toDate: () => date } })], { now: checkDate }).meters).toBe(750);
});

test('spotlight uses the latest row per teammate, prioritizes less-supported rows, and excludes self and stale activity', () => {
  const entries = [row('old-a', 12), row('new-a', 14), row('b', 13, 800, 'b'), row('me', 15, 900, 'me'), row('stale', 8, 2000, 'c')];
  const counts = id => id === 'new-a' ? { '👏': 2, '🔥': 1 } : {};
  const result = getCrewSpotlights(entries, 'me', counts, now);
  expect(result.map(entry => entry.id)).toEqual(['b', 'new-a']);
  expect(result[1].reactionCount).toBe(3);
  expect(entries[0].id).toBe('old-a');
});
