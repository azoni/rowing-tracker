import { CREW_BLADES, getCrewColor } from './crewColor';

test('a member keeps the same blade colour wherever they appear', () => {
  const member = { id: 'crew-2', name: 'Sam Rivera' };
  expect(getCrewColor(member)).toBe(getCrewColor({ id: 'crew-2' }));
  expect(getCrewColor({ uid: 'crew-2' })).toBe(getCrewColor(member));
  expect(CREW_BLADES).toContain(getCrewColor(member));
});

test('members without an id fall back to their name, then to the first blade', () => {
  expect(getCrewColor({ name: 'Jordan Lee' })).toBe(getCrewColor({ name: 'Jordan Lee' }));
  expect(getCrewColor(null)).toBe(CREW_BLADES[0]);
  expect(getCrewColor({ id: { nested: true } })).toBe(CREW_BLADES[0]);
});

test('different members spread across the blades', () => {
  const colors = new Set(Array.from({ length: 40 }, (_, i) => getCrewColor({ id: `member-${i}` })));
  expect(colors.size).toBeGreaterThan(5);
});
