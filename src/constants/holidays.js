// Holiday theme overrides — automatically activate based on date
// Fixed-date holidays use month/day. Dynamic holidays use a compute function.
// To add a new holiday, just add an entry to the HOLIDAYS array.

// Helper: get Nth weekday of a month (e.g., 3rd Monday)
function nthWeekday(year, month, weekday, n) {
  const first = new Date(year, month - 1, 1);
  let day = 1 + ((weekday - first.getDay() + 7) % 7);
  day += (n - 1) * 7;
  return new Date(year, month - 1, day);
}

// Helper: last weekday of a month (e.g., last Monday of May)
function lastWeekday(year, month, weekday) {
  const last = new Date(year, month, 0); // last day of month
  const diff = (last.getDay() - weekday + 7) % 7;
  return new Date(year, month - 1, last.getDate() - diff);
}

// Helper: compute Easter Sunday (Anonymous Gregorian algorithm)
function computeEaster(year) {
  const a = year % 19;
  const b = Math.floor(year / 100);
  const c = year % 100;
  const d = Math.floor(b / 4);
  const e = b % 4;
  const f = Math.floor((b + 8) / 25);
  const g = Math.floor((b - f + 1) / 3);
  const h = (19 * a + b - d - g + 15) % 30;
  const i = Math.floor(c / 4);
  const k = c % 4;
  const l = (32 + 2 * e + 2 * i - h - k) % 7;
  const m = Math.floor((a + 11 * h + 22 * l) / 451);
  const month = Math.floor((h + l - 7 * m + 114) / 31);
  const day = ((h + l - 7 * m + 114) % 31) + 1;
  return new Date(year, month - 1, day);
}

// Fixed-date holidays
const FIXED_HOLIDAYS = [
  {
    id: 'new-years',
    name: "New Year's Day",
    month: 1,
    day: 1,
    banner: 'Happy New Year!',
    colorOverrides: {
      accentPrimary: '#ffd700',
      accentSecondary: '#c0c0c0',
      accentGold: '#ffd700',
      bgDark: '#0d0d1a',
      bgCard: '#1a1a2e',
      bgCardHover: '#25253d',
      borderColor: '#3d3d5c',
      gradientStart: '#0d0d1a',
      gradientEnd: '#06060f',
      headerGlow: 'rgba(255, 215, 0, 0.2)',
      shadowGlow: '0 0 40px rgba(255, 215, 0, 0.2)',
      progressGradient: 'linear-gradient(90deg, #ffd700 0%, #c0c0c0 100%)',
      progressGlow: '0 0 20px rgba(255, 215, 0, 0.5)',
    },
  },
  {
    id: 'groundhog-day',
    name: 'Groundhog Day',
    month: 2,
    day: 2,
    banner: 'Happy Groundhog Day!',
    colorOverrides: {
      accentPrimary: '#8B6914',
      accentSecondary: '#6B4226',
      accentGold: '#C4A35A',
      bgDark: '#1a1610',
      bgCard: '#2a2418',
      bgCardHover: '#362f22',
      borderColor: '#4a3f2e',
      gradientStart: '#1a1610',
      gradientEnd: '#0f0d09',
      headerGlow: 'rgba(139, 105, 20, 0.15)',
      shadowGlow: '0 0 40px rgba(139, 105, 20, 0.15)',
      progressGradient: 'linear-gradient(90deg, #8B6914 0%, #C4A35A 100%)',
      progressGlow: '0 0 20px rgba(139, 105, 20, 0.5)',
    },
  },
  {
    id: 'valentines-day',
    name: "Valentine's Day",
    month: 2,
    day: 14,
    banner: "Happy Valentine's Day!",
    colorOverrides: {
      accentPrimary: '#e63946',
      accentSecondary: '#a8325a',
      accentGold: '#f48fb1',
      bgDark: '#1f0d14',
      bgCard: '#2d1520',
      bgCardHover: '#3a1d2b',
      borderColor: '#4a2535',
      gradientStart: '#1f0d14',
      gradientEnd: '#12080d',
      headerGlow: 'rgba(230, 57, 70, 0.15)',
      shadowGlow: '0 0 40px rgba(230, 57, 70, 0.15)',
      progressGradient: 'linear-gradient(90deg, #e63946 0%, #f48fb1 100%)',
      progressGlow: '0 0 20px rgba(230, 57, 70, 0.5)',
    },
  },
  {
    id: 'pi-day',
    name: 'Pi Day',
    month: 3,
    day: 14,
    banner: 'Happy Pi Day! 3.14159...',
    colorOverrides: {
      accentPrimary: '#4169E1',
      accentSecondary: '#6A5ACD',
      accentGold: '#87CEEB',
      bgDark: '#0d1020',
      bgCard: '#161d35',
      bgCardHover: '#1f2845',
      borderColor: '#2d3a5c',
      gradientStart: '#0d1020',
      gradientEnd: '#070a14',
      headerGlow: 'rgba(65, 105, 225, 0.15)',
      shadowGlow: '0 0 40px rgba(65, 105, 225, 0.15)',
      progressGradient: 'linear-gradient(90deg, #4169E1 0%, #87CEEB 100%)',
      progressGlow: '0 0 20px rgba(65, 105, 225, 0.5)',
    },
  },
  {
    id: 'st-patricks-day',
    name: "St. Patrick's Day",
    month: 3,
    day: 17,
    banner: "Happy St. Patrick's Day!",
    colorOverrides: {
      accentPrimary: '#2e8b57',
      accentSecondary: '#228B22',
      accentGold: '#50C878',
      success: '#00a86b',
      borderColor: '#2d5a3d',
      bgDark: '#0d1f17',
      bgCard: '#162b20',
      bgCardHover: '#1e3a2b',
      gradientStart: '#0d1f17',
      gradientEnd: '#071210',
      headerGlow: 'rgba(46, 139, 87, 0.15)',
      shadowGlow: '0 0 40px rgba(46, 139, 87, 0.15)',
      progressGradient: 'linear-gradient(90deg, #2e8b57 0%, #50C878 100%)',
      progressGlow: '0 0 20px rgba(46, 139, 87, 0.5)',
    },
  },
  {
    id: 'april-fools',
    name: "April Fools' Day",
    month: 4,
    day: 1,
    banner: "Happy April Fools' Day!",
    colorOverrides: {
      accentPrimary: '#ff1493',
      accentSecondary: '#00ff7f',
      accentGold: '#ffff00',
      bgDark: '#1a0d1f',
      bgCard: '#2b152e',
      bgCardHover: '#381e3d',
      borderColor: '#4d2d52',
      gradientStart: '#1a0d1f',
      gradientEnd: '#0f0712',
      headerGlow: 'rgba(255, 20, 147, 0.15)',
      shadowGlow: '0 0 40px rgba(255, 20, 147, 0.15)',
      progressGradient: 'linear-gradient(90deg, #ff1493 0%, #00ff7f 50%, #ffff00 100%)',
      progressGlow: '0 0 20px rgba(255, 20, 147, 0.5)',
    },
  },
  {
    id: 'star-wars-day',
    name: 'Star Wars Day',
    month: 5,
    day: 4,
    banner: 'May the 4th Be With You!',
    colorOverrides: {
      accentPrimary: '#FFE81F',
      accentSecondary: '#4BD5EE',
      accentGold: '#FFE81F',
      bgDark: '#000000',
      bgCard: '#0d0d0d',
      bgCardHover: '#1a1a1a',
      borderColor: '#2a2a2a',
      gradientStart: '#000000',
      gradientEnd: '#000000',
      headerGlow: 'rgba(255, 232, 31, 0.15)',
      shadowGlow: '0 0 40px rgba(255, 232, 31, 0.15)',
      progressGradient: 'linear-gradient(90deg, #FFE81F 0%, #4BD5EE 100%)',
      progressGlow: '0 0 20px rgba(255, 232, 31, 0.5)',
    },
  },
  {
    id: 'cinco-de-mayo',
    name: 'Cinco de Mayo',
    month: 5,
    day: 5,
    banner: 'Feliz Cinco de Mayo!',
    colorOverrides: {
      accentPrimary: '#006847',
      accentSecondary: '#ce1126',
      accentGold: '#FFD700',
      bgDark: '#0d1a12',
      bgCard: '#16291c',
      bgCardHover: '#1e3826',
      borderColor: '#2d4a35',
      gradientStart: '#0d1a12',
      gradientEnd: '#070f0a',
      headerGlow: 'rgba(0, 104, 71, 0.15)',
      shadowGlow: '0 0 40px rgba(0, 104, 71, 0.15)',
      progressGradient: 'linear-gradient(90deg, #006847 0%, #ce1126 50%, #FFD700 100%)',
      progressGlow: '0 0 20px rgba(0, 104, 71, 0.5)',
    },
  },
  {
    id: 'juneteenth',
    name: 'Juneteenth',
    month: 6,
    day: 19,
    banner: 'Happy Juneteenth!',
    colorOverrides: {
      accentPrimary: '#E31B23',
      accentSecondary: '#00843D',
      accentGold: '#FFC72C',
      bgDark: '#0d0d14',
      bgCard: '#1a1a28',
      bgCardHover: '#252536',
      borderColor: '#3a3a4e',
      gradientStart: '#0d0d14',
      gradientEnd: '#07070c',
      headerGlow: 'rgba(227, 27, 35, 0.15)',
      shadowGlow: '0 0 40px rgba(227, 27, 35, 0.15)',
      progressGradient: 'linear-gradient(90deg, #E31B23 0%, #00843D 50%, #FFC72C 100%)',
      progressGlow: '0 0 20px rgba(227, 27, 35, 0.5)',
    },
  },
  {
    id: 'independence-day',
    name: 'Independence Day',
    month: 7,
    day: 4,
    banner: 'Happy 4th of July!',
    colorOverrides: {
      accentPrimary: '#b22234',
      accentSecondary: '#3c3b6e',
      accentGold: '#ffffff',
      bgDark: '#0d0d1a',
      bgCard: '#1a1a2e',
      bgCardHover: '#25253d',
      borderColor: '#3c3b5e',
      gradientStart: '#0d0d1a',
      gradientEnd: '#06060f',
      headerGlow: 'rgba(178, 34, 52, 0.15)',
      shadowGlow: '0 0 40px rgba(178, 34, 52, 0.15)',
      progressGradient: 'linear-gradient(90deg, #b22234 0%, #3c3b6e 100%)',
      progressGlow: '0 0 20px rgba(178, 34, 52, 0.5)',
    },
  },
  {
    id: 'halloween',
    name: 'Halloween',
    month: 10,
    day: 31,
    banner: 'Happy Halloween!',
    colorOverrides: {
      accentPrimary: '#ff6600',
      accentSecondary: '#8b00ff',
      accentGold: '#ff8c00',
      bgDark: '#0d0d0d',
      bgCard: '#1a1a1a',
      bgCardHover: '#262626',
      borderColor: '#3d2e1f',
      gradientStart: '#0d0d0d',
      gradientEnd: '#050505',
      headerGlow: 'rgba(255, 102, 0, 0.15)',
      shadowGlow: '0 0 40px rgba(255, 102, 0, 0.15)',
      progressGradient: 'linear-gradient(90deg, #ff6600 0%, #ff8c00 100%)',
      progressGlow: '0 0 20px rgba(255, 102, 0, 0.5)',
    },
  },
  {
    id: 'veterans-day',
    name: 'Veterans Day',
    month: 11,
    day: 11,
    banner: 'Thank You, Veterans',
    colorOverrides: {
      accentPrimary: '#b22234',
      accentSecondary: '#002868',
      accentGold: '#BF9B30',
      bgDark: '#0d0f1a',
      bgCard: '#1a1e2e',
      bgCardHover: '#24293d',
      borderColor: '#3a3f5c',
      gradientStart: '#0d0f1a',
      gradientEnd: '#07080f',
      headerGlow: 'rgba(178, 34, 52, 0.12)',
      shadowGlow: '0 0 40px rgba(178, 34, 52, 0.12)',
      progressGradient: 'linear-gradient(90deg, #b22234 0%, #002868 100%)',
      progressGlow: '0 0 20px rgba(178, 34, 52, 0.4)',
    },
  },
  {
    id: 'christmas-eve',
    name: 'Christmas Eve',
    month: 12,
    day: 24,
    banner: 'Merry Christmas Eve!',
    colorOverrides: {
      accentPrimary: '#c41e3a',
      accentSecondary: '#165b33',
      accentGold: '#f5e6cc',
      bgDark: '#0f1a0f',
      bgCard: '#1a2b1a',
      bgCardHover: '#243524',
      borderColor: '#2d4a2d',
      gradientStart: '#0f1a0f',
      gradientEnd: '#080f08',
      headerGlow: 'rgba(196, 30, 58, 0.15)',
      shadowGlow: '0 0 40px rgba(196, 30, 58, 0.15)',
      progressGradient: 'linear-gradient(90deg, #c41e3a 0%, #165b33 100%)',
      progressGlow: '0 0 20px rgba(196, 30, 58, 0.5)',
    },
  },
  {
    id: 'christmas',
    name: 'Christmas',
    month: 12,
    day: 25,
    banner: 'Merry Christmas!',
    colorOverrides: {
      accentPrimary: '#c41e3a',
      accentSecondary: '#165b33',
      accentGold: '#f5e6cc',
      bgDark: '#0f1a0f',
      bgCard: '#1a2b1a',
      bgCardHover: '#243524',
      borderColor: '#2d4a2d',
      gradientStart: '#0f1a0f',
      gradientEnd: '#080f08',
      headerGlow: 'rgba(196, 30, 58, 0.15)',
      shadowGlow: '0 0 40px rgba(196, 30, 58, 0.15)',
      progressGradient: 'linear-gradient(90deg, #c41e3a 0%, #165b33 100%)',
      progressGlow: '0 0 20px rgba(196, 30, 58, 0.5)',
    },
  },
  {
    id: 'new-years-eve',
    name: "New Year's Eve",
    month: 12,
    day: 31,
    banner: "Happy New Year's Eve!",
    colorOverrides: {
      accentPrimary: '#ffd700',
      accentSecondary: '#c0c0c0',
      accentGold: '#ffd700',
      bgDark: '#0d0d1a',
      bgCard: '#1a1a2e',
      bgCardHover: '#25253d',
      borderColor: '#3d3d5c',
      gradientStart: '#0d0d1a',
      gradientEnd: '#06060f',
      headerGlow: 'rgba(255, 215, 0, 0.2)',
      shadowGlow: '0 0 40px rgba(255, 215, 0, 0.2)',
      progressGradient: 'linear-gradient(90deg, #ffd700 0%, #c0c0c0 100%)',
      progressGlow: '0 0 20px rgba(255, 215, 0, 0.5)',
    },
  },
];

// Dynamic holidays — computed per year
function getDynamicHolidays(year) {
  return [
    {
      id: 'mlk-day',
      name: 'Martin Luther King Jr. Day',
      date: nthWeekday(year, 1, 1, 3), // 3rd Monday of January
      banner: 'Honoring Dr. Martin Luther King Jr.',
      colorOverrides: {
        accentPrimary: '#C9A227',
        accentSecondary: '#8B4513',
        accentGold: '#D4AF37',
        bgDark: '#0d0d14',
        bgCard: '#1a1a28',
        bgCardHover: '#252536',
        borderColor: '#3a3a4e',
        gradientStart: '#0d0d14',
        gradientEnd: '#07070c',
        headerGlow: 'rgba(201, 162, 39, 0.15)',
        shadowGlow: '0 0 40px rgba(201, 162, 39, 0.15)',
        progressGradient: 'linear-gradient(90deg, #C9A227 0%, #D4AF37 100%)',
        progressGlow: '0 0 20px rgba(201, 162, 39, 0.5)',
      },
    },
    {
      id: 'presidents-day',
      name: "Presidents' Day",
      date: nthWeekday(year, 2, 1, 3), // 3rd Monday of February
      banner: "Happy Presidents' Day!",
      colorOverrides: {
        accentPrimary: '#b22234',
        accentSecondary: '#002868',
        accentGold: '#BF9B30',
        bgDark: '#0d0f1a',
        bgCard: '#1a1e2e',
        bgCardHover: '#24293d',
        borderColor: '#3a3f5c',
        gradientStart: '#0d0f1a',
        gradientEnd: '#07080f',
        headerGlow: 'rgba(178, 34, 52, 0.12)',
        shadowGlow: '0 0 40px rgba(178, 34, 52, 0.12)',
        progressGradient: 'linear-gradient(90deg, #b22234 0%, #002868 100%)',
        progressGlow: '0 0 20px rgba(178, 34, 52, 0.4)',
      },
    },
    {
      id: 'easter',
      name: 'Easter',
      date: computeEaster(year),
      banner: 'Happy Easter!',
      colorOverrides: {
        accentPrimary: '#DDA0DD',
        accentSecondary: '#98FB98',
        accentGold: '#FFD700',
        bgDark: '#1a151f',
        bgCard: '#2a2230',
        bgCardHover: '#362d3d',
        borderColor: '#4a3f52',
        gradientStart: '#1a151f',
        gradientEnd: '#0f0c14',
        headerGlow: 'rgba(221, 160, 221, 0.15)',
        shadowGlow: '0 0 40px rgba(221, 160, 221, 0.15)',
        progressGradient: 'linear-gradient(90deg, #DDA0DD 0%, #98FB98 50%, #FFD700 100%)',
        progressGlow: '0 0 20px rgba(221, 160, 221, 0.5)',
      },
    },
    {
      id: 'memorial-day',
      name: 'Memorial Day',
      date: lastWeekday(year, 5, 1), // Last Monday of May
      banner: 'Remembering Our Heroes',
      colorOverrides: {
        accentPrimary: '#b22234',
        accentSecondary: '#002868',
        accentGold: '#FFFFFF',
        bgDark: '#0d0f1a',
        bgCard: '#1a1e2e',
        bgCardHover: '#24293d',
        borderColor: '#3a3f5c',
        gradientStart: '#0d0f1a',
        gradientEnd: '#07080f',
        headerGlow: 'rgba(178, 34, 52, 0.12)',
        shadowGlow: '0 0 40px rgba(178, 34, 52, 0.12)',
        progressGradient: 'linear-gradient(90deg, #b22234 0%, #002868 100%)',
        progressGlow: '0 0 20px rgba(178, 34, 52, 0.4)',
      },
    },
    {
      id: 'labor-day',
      name: 'Labor Day',
      date: nthWeekday(year, 9, 1, 1), // 1st Monday of September
      banner: 'Happy Labor Day!',
      colorOverrides: {
        accentPrimary: '#1E90FF',
        accentSecondary: '#B22234',
        accentGold: '#FFD700',
        bgDark: '#0d1420',
        bgCard: '#1a2235',
        bgCardHover: '#242f45',
        borderColor: '#3a4a5c',
        gradientStart: '#0d1420',
        gradientEnd: '#070c14',
        headerGlow: 'rgba(30, 144, 255, 0.15)',
        shadowGlow: '0 0 40px rgba(30, 144, 255, 0.15)',
        progressGradient: 'linear-gradient(90deg, #1E90FF 0%, #FFD700 100%)',
        progressGlow: '0 0 20px rgba(30, 144, 255, 0.5)',
      },
    },
    {
      id: 'thanksgiving',
      name: 'Thanksgiving',
      date: nthWeekday(year, 11, 4, 4), // 4th Thursday of November
      banner: 'Happy Thanksgiving!',
      colorOverrides: {
        accentPrimary: '#D2691E',
        accentSecondary: '#8B4513',
        accentGold: '#DAA520',
        bgDark: '#1a1208',
        bgCard: '#2a2010',
        bgCardHover: '#362b18',
        borderColor: '#4a3d25',
        gradientStart: '#1a1208',
        gradientEnd: '#0f0b05',
        headerGlow: 'rgba(210, 105, 30, 0.15)',
        shadowGlow: '0 0 40px rgba(210, 105, 30, 0.15)',
        progressGradient: 'linear-gradient(90deg, #D2691E 0%, #DAA520 100%)',
        progressGlow: '0 0 20px rgba(210, 105, 30, 0.5)',
      },
    },
  ];
}

export function getActiveHoliday(date = new Date()) {
  const month = date.getMonth() + 1;
  const day = date.getDate();

  // Check fixed holidays
  const fixed = FIXED_HOLIDAYS.find(h => h.month === month && h.day === day);
  if (fixed) return fixed;

  // Check dynamic holidays
  const year = date.getFullYear();
  const dynamic = getDynamicHolidays(year).find(h => {
    const d = h.date;
    return d.getMonth() + 1 === month && d.getDate() === day;
  });
  return dynamic || null;
}

// Export all holidays for reference (e.g., admin panel)
export const HOLIDAYS = FIXED_HOLIDAYS;
