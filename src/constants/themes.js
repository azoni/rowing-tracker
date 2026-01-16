// Theme definitions for Row Crew
// Each theme provides a complete color palette

export const THEMES = {
  'boathouse-classic': {
    id: 'boathouse-classic',
    name: 'Boathouse Classic',
    description: 'Navy, cream & wood tones - collegiate rowing aesthetic',
    emoji: '🏛️',
    colors: {
      bgDark: '#1a2744',
      bgCard: '#243352',
      bgCardHover: '#2d3f63',
      accentPrimary: '#c9a227',
      accentSecondary: '#8b4513',
      accentGold: '#d4af37',
      textPrimary: '#f5f1e8',
      textSecondary: '#a8b5c9',
      textMuted: '#6b7a94',
      borderColor: '#3d4f6f',
      success: '#5d8a4d',
      shadowGlow: '0 0 40px rgba(201, 162, 39, 0.15)',
      gradientStart: '#1a2744',
      gradientEnd: '#0f1829',
      headerGlow: 'rgba(201, 162, 39, 0.1)',
      progressGradient: 'linear-gradient(90deg, #c9a227 0%, #d4af37 100%)',
      progressGlow: '0 0 20px rgba(201, 162, 39, 0.5)',
    }
  },
  'morning-lake': {
    id: 'morning-lake',
    name: 'Morning Lake',
    description: 'Soft blues & greens - peaceful sunrise rowing',
    emoji: '🌅',
    colors: {
      bgDark: '#f0f5f9',
      bgCard: '#ffffff',
      bgCardHover: '#e8f0f5',
      accentPrimary: '#2d7d9a',
      accentSecondary: '#e07c4c',
      accentGold: '#d4a84b',
      textPrimary: '#1a3c4d',
      textSecondary: '#5a7d8a',
      textMuted: '#8fa9b5',
      borderColor: '#d1e0e8',
      success: '#4a9d7c',
      shadowGlow: '0 0 40px rgba(45, 125, 154, 0.1)',
      gradientStart: '#f0f5f9',
      gradientEnd: '#e5eef3',
      headerGlow: 'rgba(45, 125, 154, 0.08)',
      progressGradient: 'linear-gradient(90deg, #2d7d9a 0%, #4a9eb8 100%)',
      progressGlow: '0 0 20px rgba(45, 125, 154, 0.3)',
    }
  },
  'athletic-performance': {
    id: 'athletic-performance',
    name: 'Athletic Performance',
    description: 'Deep blue & coral - modern sports feel',
    emoji: '🏋️',
    colors: {
      bgDark: '#0f172a',
      bgCard: '#1e293b',
      bgCardHover: '#273549',
      accentPrimary: '#f97316',
      accentSecondary: '#3b82f6',
      accentGold: '#fbbf24',
      textPrimary: '#f8fafc',
      textSecondary: '#94a3b8',
      textMuted: '#64748b',
      borderColor: '#334155',
      success: '#22c55e',
      shadowGlow: '0 0 40px rgba(249, 115, 22, 0.15)',
      gradientStart: '#0f172a',
      gradientEnd: '#020617',
      headerGlow: 'rgba(249, 115, 22, 0.1)',
      progressGradient: 'linear-gradient(90deg, #f97316 0%, #fb923c 100%)',
      progressGlow: '0 0 20px rgba(249, 115, 22, 0.5)',
    }
  },
  'ocean-crew': {
    id: 'ocean-crew',
    name: 'Ocean Crew',
    description: 'Rich navy & teal - maritime club aesthetic',
    emoji: '⚓',
    colors: {
      bgDark: '#0c1929',
      bgCard: '#132337',
      bgCardHover: '#1a2d45',
      accentPrimary: '#14b8a6',
      accentSecondary: '#f59e0b',
      accentGold: '#fcd34d',
      textPrimary: '#e2e8f0',
      textSecondary: '#7dd3c7',
      textMuted: '#4a6670',
      borderColor: '#234058',
      success: '#10b981',
      shadowGlow: '0 0 40px rgba(20, 184, 166, 0.15)',
      gradientStart: '#0c1929',
      gradientEnd: '#061018',
      headerGlow: 'rgba(20, 184, 166, 0.1)',
      progressGradient: 'linear-gradient(90deg, #14b8a6 0%, #2dd4bf 100%)',
      progressGlow: '0 0 20px rgba(20, 184, 166, 0.5)',
    }
  }
};

export const DEFAULT_THEME = 'boathouse-classic';

export const THEME_LIST = Object.values(THEMES);