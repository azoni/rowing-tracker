// Format meters to human-readable string
export const formatMeters = (meters) => {
  if (meters >= 1000000) return `${(meters / 1000000).toFixed(1)}M`;
  if (meters >= 1000) return `${(meters / 1000).toFixed(1)}k`;
  return meters.toString();
};

// Format time to display string (e.g., "2:30.5" or "30.5s")
export const formatTime = (seconds) => {
  if (!seconds) return '--';
  const mins = Math.floor(seconds / 60);
  const secs = (seconds % 60).toFixed(1);
  if (mins > 0) {
    return `${mins}:${secs.padStart(4, '0')}`;
  }
  return `${secs}s`;
};

// Format seconds to display time (MM:SS or HH:MM:SS)
export const formatTimeDisplay = (seconds) => {
  if (!seconds && seconds !== 0) return '--';
  
  const hours = Math.floor(seconds / 3600);
  const mins = Math.floor((seconds % 3600) / 60);
  const secs = Math.floor(seconds % 60);
  
  if (hours > 0) {
    return `${hours}:${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  }
  return `${mins}:${secs.toString().padStart(2, '0')}`;
};

// Format time ago (e.g., "2h ago", "3d ago")
export const formatTimeAgo = (date) => {
  const seconds = Math.floor((new Date() - date) / 1000);
  
  if (seconds < 60) return 'just now';
  if (seconds < 3600) return `${Math.floor(seconds / 60)}m ago`;
  if (seconds < 86400) return `${Math.floor(seconds / 3600)}h ago`;
  if (seconds < 604800) return `${Math.floor(seconds / 86400)}d ago`;
  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
};

// Parse time input string to seconds
export const parseTimeInput = (timeStr) => {
  if (!timeStr || !timeStr.trim()) return null;
  
  const trimmed = timeStr.trim();
  
  // If it's just a number, treat as seconds
  if (/^\d+\.?\d*$/.test(trimmed)) {
    return parseFloat(trimmed);
  }
  
  // Handle MM:SS or MM:SS.s
  const mmssMatch = trimmed.match(/^(\d{1,2}):(\d{2}(?:\.\d+)?)$/);
  if (mmssMatch) {
    const minutes = parseInt(mmssMatch[1], 10);
    const seconds = parseFloat(mmssMatch[2]);
    return minutes * 60 + seconds;
  }
  
  // Handle HH:MM:SS
  const hhmmssMatch = trimmed.match(/^(\d+):(\d{2}):(\d{2}(?:\.\d+)?)$/);
  if (hhmmssMatch) {
    const hours = parseInt(hhmmssMatch[1], 10);
    const minutes = parseInt(hhmmssMatch[2], 10);
    const seconds = parseFloat(hhmmssMatch[3]);
    return hours * 3600 + minutes * 60 + seconds;
  }
  
  return null;
};

// Calculate pace per 500m
export const calculatePace = (meters, seconds) => {
  if (!meters || !seconds) return null;
  const paceSeconds = (seconds / meters) * 500;
  return formatTime(paceSeconds);
};
