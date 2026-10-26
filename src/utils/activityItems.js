// Persisted activities have a narrower feed shape than rows. Keep their public
// display fields explicit, and skip timestamps still waiting for the server.
export const buildActivityItem = (activity, user) => {
  if (!activity || !user) return null;

  let date;
  try {
    const value = typeof activity.createdAt?.toDate === 'function'
      ? activity.createdAt.toDate() : activity.createdAt;
    if (!(value instanceof Date) && typeof value !== 'string' && typeof value !== 'number') return null;
    if (typeof value === 'string' && !value.trim()) return null;
    date = new Date(value);
    if (!Number.isFinite(date.getTime())) return null;
  } catch {
    return null;
  }

  const item = {
    id: activity.id,
    type: activity.type,
    userId: activity.userId,
    user,
    groupId: activity.groupId,
    groupName: activity.groupName,
    challengeId: activity.challengeId,
    challengeName: activity.challengeName,
    challengeType: activity.challengeType,
    date: date.toISOString(),
    sortDate: date,
  };

  if (activity.type === 'distance_record') {
    item.distanceLabel = activity.distanceLabel;
    item.distanceMeters = activity.distanceMeters;
    item.time = activity.time;
    item.previousBest = activity.previousBest;
    item.isFirstRecord = activity.isFirstRecord;
    item.machineType = activity.machineType;
    item.sessionType = activity.sessionType;
  }
  return item;
};
