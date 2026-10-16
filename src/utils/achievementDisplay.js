import { formatMeters, formatTimeDisplay } from './formatters';

// Some distance/time badges count qualifying sessions rather than meters or seconds.
export function formatAchievementProgress(achievement, progress) {
  const format = value => {
    if (achievement.category === 'distance' && progress.target >= 500) return `${formatMeters(value)}m`;
    if (achievement.category === 'time' && progress.target >= 60) return formatTimeDisplay(value);
    return Number(value).toLocaleString();
  };
  return `${format(progress.current)} / ${format(progress.target)}${achievement.category === 'calories' ? ' cal' : ''}`;
}
