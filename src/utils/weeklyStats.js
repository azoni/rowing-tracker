import { getEligibleEntries } from './rowingGoals';

// Calendar weeks start on Monday in the rower's local timezone.
export function getWeeklyStats(entries, userId, now = new Date()) {
  const eligibleRows = getEligibleEntries(entries, now).filter(row => row.userId === userId);
  const start = new Date(now);
  start.setHours(0, 0, 0, 0);
  start.setDate(start.getDate() - (start.getDay() + 6) % 7);
  const days = Array.from({ length: 7 }, (_, index) => {
    const date = new Date(start);
    date.setDate(date.getDate() + index);
    const end = new Date(date);
    end.setDate(end.getDate() + 1);
    const rows = eligibleRows.filter(row => {
      const rowDate = row.date?.toDate ? row.date.toDate() : new Date(row.date);
      return rowDate >= date && rowDate < end;
    });
    return { date, meters: rows.reduce((sum, row) => sum + Number(row.meters), 0), sessions: rows.length,
      today: date.toDateString() === now.toDateString(), future: date > now };
  });
  return { start, days, meters: days.reduce((sum, day) => sum + day.meters, 0),
    sessions: days.reduce((sum, day) => sum + day.sessions, 0), activeDays: days.filter(day => day.sessions > 0).length };
}
