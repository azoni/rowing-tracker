// Achievement definitions
export const ACHIEVEMENTS = [
  // Session count achievements
  { 
    id: 'first_row', name: 'First Strokes', desc: 'Log your first row', emoji: '🎉', 
    check: (u, e) => e.length >= 1,
    getProgress: (u, e) => ({ current: Math.min(e.length, 1), target: 1 })
  },
  { 
    id: 'ten_sessions', name: 'Getting Serious', desc: 'Complete 10 sessions', emoji: '💪', 
    check: (u, e) => e.length >= 10,
    getProgress: (u, e) => ({ current: Math.min(e.length, 10), target: 10 })
  },
  { 
    id: 'fifty_sessions', name: 'Dedicated Rower', desc: 'Complete 50 sessions', emoji: '🏅', 
    check: (u, e) => e.length >= 50,
    getProgress: (u, e) => ({ current: Math.min(e.length, 50), target: 50 })
  },
  { 
    id: 'hundred_sessions', name: 'Centurion', desc: 'Complete 100 sessions', emoji: '💯', 
    check: (u, e) => e.length >= 100,
    getProgress: (u, e) => ({ current: Math.min(e.length, 100), target: 100 })
  },
  
  // Distance achievements
  { 
    id: 'first_5k', name: '5K Club', desc: 'Row 5,000 meters total', emoji: '🎯', 
    check: (u) => u.totalMeters >= 5000,
    getProgress: (u) => ({ current: Math.min(u.totalMeters || 0, 5000), target: 5000 })
  },
  { 
    id: 'first_10k', name: '10K Crusher', desc: 'Row 10,000 meters total', emoji: '🔥', 
    check: (u) => u.totalMeters >= 10000,
    getProgress: (u) => ({ current: Math.min(u.totalMeters || 0, 10000), target: 10000 })
  },
  { 
    id: 'marathon', name: 'Marathon Rower', desc: 'Row a marathon (42,195m)', emoji: '🏃', 
    check: (u) => u.totalMeters >= 42195,
    getProgress: (u) => ({ current: Math.min(u.totalMeters || 0, 42195), target: 42195 })
  },
  { 
    id: 'hundred_k', name: '100K Legend', desc: 'Row 100,000 meters total', emoji: '⭐', 
    check: (u) => u.totalMeters >= 100000,
    getProgress: (u) => ({ current: Math.min(u.totalMeters || 0, 100000), target: 100000 })
  },
  
  // Single session achievements
  { 
    id: 'big_session', name: 'Power Hour', desc: 'Row 5,000m in one session', emoji: '⚡', 
    check: (u, e) => e.some(x => x.meters >= 5000),
    getProgress: (u, e) => {
      const best = e.length > 0 ? Math.max(...e.map(x => x.meters)) : 0;
      return { current: Math.min(best, 5000), target: 5000 };
    }
  },
  { 
    id: 'huge_session', name: 'Beast Mode', desc: 'Row 10,000m in one session', emoji: '🦁', 
    check: (u, e) => e.some(x => x.meters >= 10000),
    getProgress: (u, e) => {
      const best = e.length > 0 ? Math.max(...e.map(x => x.meters)) : 0;
      return { current: Math.min(best, 10000), target: 10000 };
    }
  },
  
  // Streak achievements
  { 
    id: 'streak_3', name: 'Hat Trick', desc: 'Maintain a 3-day streak', emoji: '🎩', 
    check: (u, e, s) => s >= 3,
    getProgress: (u, e, s) => ({ current: Math.min(s, 3), target: 3 })
  },
  { 
    id: 'streak_7', name: 'Week Warrior', desc: 'Maintain a 7-day streak', emoji: '📅', 
    check: (u, e, s) => s >= 7,
    getProgress: (u, e, s) => ({ current: Math.min(s, 7), target: 7 })
  },
  { 
    id: 'streak_14', name: 'Fortnight Force', desc: 'Maintain a 14-day streak', emoji: '🔥', 
    check: (u, e, s) => s >= 14,
    getProgress: (u, e, s) => ({ current: Math.min(s, 14), target: 14 })
  },
  { 
    id: 'streak_30', name: 'Monthly Master', desc: 'Maintain a 30-day streak', emoji: '🌟', 
    check: (u, e, s) => s >= 30,
    getProgress: (u, e, s) => ({ current: Math.min(s, 30), target: 30 })
  },
  
  // Fun achievements
  { 
    id: 'early_bird', name: 'Early Bird', desc: 'Log a row before 7am', emoji: '🌅', 
    check: (u, e) => e.some(x => new Date(x.date).getHours() < 7),
    getProgress: (u, e) => ({ current: e.some(x => new Date(x.date).getHours() < 7) ? 1 : 0, target: 1 })
  },
  { 
    id: 'night_owl', name: 'Night Owl', desc: 'Log a row after 10pm', emoji: '🦉', 
    check: (u, e) => e.some(x => new Date(x.date).getHours() >= 22),
    getProgress: (u, e) => ({ current: e.some(x => new Date(x.date).getHours() >= 22) ? 1 : 0, target: 1 })
  },
  { 
    id: 'consistent', name: 'Consistency King', desc: 'Row 4+ days in a week', emoji: '👑', 
    check: (u, e) => {
      const lastWeek = e.filter(x => Date.now() - new Date(x.date).getTime() < 7 * 24 * 60 * 60 * 1000);
      const uniqueDays = new Set(lastWeek.map(x => new Date(x.date).toDateString()));
      return uniqueDays.size >= 4;
    },
    getProgress: (u, e) => {
      const lastWeek = e.filter(x => Date.now() - new Date(x.date).getTime() < 7 * 24 * 60 * 60 * 1000);
      const uniqueDays = new Set(lastWeek.map(x => new Date(x.date).toDateString()));
      return { current: Math.min(uniqueDays.size, 4), target: 4 };
    }
  },
  
  // More distance achievements
  { 
    id: 'half_marathon', name: 'Half Marathon', desc: 'Row 21,097m total', emoji: '🏃‍♂️', 
    check: (u) => u.totalMeters >= 21097,
    getProgress: (u) => ({ current: Math.min(u.totalMeters || 0, 21097), target: 21097 })
  },
  { 
    id: 'quarter_million', name: '250K Club', desc: 'Row 250,000m total', emoji: '🌟', 
    check: (u) => u.totalMeters >= 250000,
    getProgress: (u) => ({ current: Math.min(u.totalMeters || 0, 250000), target: 250000 })
  },
  { 
    id: 'half_million', name: 'Half Million Hero', desc: 'Row 500,000m total', emoji: '🦸', 
    check: (u) => u.totalMeters >= 500000,
    getProgress: (u) => ({ current: Math.min(u.totalMeters || 0, 500000), target: 500000 })
  },
  { 
    id: 'million', name: 'Millionaire', desc: 'Row 1,000,000m total', emoji: '💎', 
    check: (u) => u.totalMeters >= 1000000,
    getProgress: (u) => ({ current: Math.min(u.totalMeters || 0, 1000000), target: 1000000 })
  },
  
  // Fun achievements
  { 
    id: 'double_trouble', name: 'Double Trouble', desc: 'Log 2 rows in one day', emoji: '✌️', 
    check: (u, e) => {
      const dayGroups = {};
      e.forEach(x => {
        const day = new Date(x.date).toDateString();
        dayGroups[day] = (dayGroups[day] || 0) + 1;
      });
      return Object.values(dayGroups).some(count => count >= 2);
    },
    getProgress: (u, e) => {
      const dayGroups = {};
      e.forEach(x => {
        const day = new Date(x.date).toDateString();
        dayGroups[day] = (dayGroups[day] || 0) + 1;
      });
      const maxInDay = Math.max(...Object.values(dayGroups), 0);
      return { current: Math.min(maxInDay, 2), target: 2 };
    }
  },
  { 
    id: 'perfect_week', name: 'Perfect Week', desc: 'Row every day for 7 consecutive days', emoji: '🌈', 
    check: (u, e, s) => s >= 7,
    getProgress: (u, e, s) => ({ current: Math.min(s, 7), target: 7 })
  },
  { 
    id: 'weekend_warrior', name: 'Weekend Warrior', desc: 'Row on both Saturday and Sunday', emoji: '🎉', 
    check: (u, e) => {
      const saturdays = e.filter(x => new Date(x.date).getDay() === 6);
      const sundays = e.filter(x => new Date(x.date).getDay() === 0);
      return saturdays.length > 0 && sundays.length > 0;
    },
    getProgress: (u, e) => {
      const saturdays = e.filter(x => new Date(x.date).getDay() === 6);
      const sundays = e.filter(x => new Date(x.date).getDay() === 0);
      const count = (saturdays.length > 0 ? 1 : 0) + (sundays.length > 0 ? 1 : 0);
      return { current: count, target: 2 };
    }
  },
  { 
    id: 'veteran', name: 'Veteran Rower', desc: 'Be a member for 30 days', emoji: '🎖️', 
    check: (u) => {
      if (!u.createdAt) return false;
      const joinDate = u.createdAt.toDate ? u.createdAt.toDate() : new Date(u.createdAt);
      const daysSinceJoin = (Date.now() - joinDate.getTime()) / (1000 * 60 * 60 * 24);
      return daysSinceJoin >= 30;
    },
    getProgress: (u) => {
      if (!u.createdAt) return { current: 0, target: 30 };
      const joinDate = u.createdAt.toDate ? u.createdAt.toDate() : new Date(u.createdAt);
      const daysSinceJoin = Math.floor((Date.now() - joinDate.getTime()) / (1000 * 60 * 60 * 24));
      return { current: Math.min(daysSinceJoin, 30), target: 30 };
    }
  },
  // Weekly Champion achievements (awarded manually/via cloud function)
  { 
    id: 'weekly_champion', name: 'Weekly Champion', desc: 'Win the weekly leaderboard', emoji: '👑', 
    check: (u) => u.weeklyWins >= 1,
    getProgress: (u) => ({ current: u.weeklyWins || 0, target: 1 })
  },
  { 
    id: 'weekly_champion_3', name: 'Triple Crown', desc: 'Win weekly leaderboard 3 times', emoji: '🏆', 
    check: (u) => u.weeklyWins >= 3,
    getProgress: (u) => ({ current: Math.min(u.weeklyWins || 0, 3), target: 3 })
  },
  { 
    id: 'weekly_champion_10', name: 'Dynasty Builder', desc: 'Win weekly leaderboard 10 times', emoji: '💎', 
    check: (u) => u.weeklyWins >= 10,
    getProgress: (u) => ({ current: Math.min(u.weeklyWins || 0, 10), target: 10 })
  },
  // Streak achievements extended
  { 
    id: 'streak_60', name: '60 Day Fire', desc: 'Maintain a 60-day streak', emoji: '🔥🔥', 
    check: (u, e, s) => s >= 60,
    getProgress: (u, e, s) => ({ current: Math.min(s, 60), target: 60 })
  },
  { 
    id: 'streak_100', name: 'Century Streak', desc: 'Maintain a 100-day streak', emoji: '💯🔥', 
    check: (u, e, s) => s >= 100,
    getProgress: (u, e, s) => ({ current: Math.min(s, 100), target: 100 })
  },
  // Fun achievements
  { 
    id: 'triple_session', name: 'Triple Threat', desc: 'Log 3 rows in one day', emoji: '🎯', 
    check: (u, e) => {
      const dayGroups = {};
      e.forEach(x => {
        const day = new Date(x.date).toDateString();
        dayGroups[day] = (dayGroups[day] || 0) + 1;
      });
      return Object.values(dayGroups).some(count => count >= 3);
    },
    getProgress: (u, e) => {
      const dayGroups = {};
      e.forEach(x => {
        const day = new Date(x.date).toDateString();
        dayGroups[day] = (dayGroups[day] || 0) + 1;
      });
      const maxInDay = Math.max(...Object.values(dayGroups), 0);
      return { current: Math.min(maxInDay, 3), target: 3 };
    }
  },
  { 
    id: 'lunch_rower', name: 'Lunch Break Legend', desc: 'Log a row between 11am and 1pm', emoji: '🍽️', 
    check: (u, e) => e.some(x => {
      const hour = new Date(x.date).getHours();
      return hour >= 11 && hour < 13;
    }),
    getProgress: (u, e) => ({ 
      current: e.some(x => {
        const hour = new Date(x.date).getHours();
        return hour >= 11 && hour < 13;
      }) ? 1 : 0, 
      target: 1 
    })
  },
  
  // Time achievements
  { 
    id: 'first_hour', name: 'First Hour', desc: 'Row for 1 hour total', emoji: '⏱️', 
    check: (u) => (u.totalTime || 0) >= 3600,
    getProgress: (u) => ({ current: Math.min(u.totalTime || 0, 3600), target: 3600 })
  },
  { 
    id: 'ten_hours', name: 'Time Investor', desc: 'Row for 10 hours total', emoji: '⏳', 
    check: (u) => (u.totalTime || 0) >= 36000,
    getProgress: (u) => ({ current: Math.min(u.totalTime || 0, 36000), target: 36000 })
  },
  { 
    id: 'fifty_hours', name: 'Time Lord', desc: 'Row for 50 hours total', emoji: '🕐', 
    check: (u) => (u.totalTime || 0) >= 180000,
    getProgress: (u) => ({ current: Math.min(u.totalTime || 0, 180000), target: 180000 })
  },
  { 
    id: 'hundred_hours', name: 'Century Timer', desc: 'Row for 100 hours total', emoji: '💫', 
    check: (u) => (u.totalTime || 0) >= 360000,
    getProgress: (u) => ({ current: Math.min(u.totalTime || 0, 360000), target: 360000 })
  },
  { 
    id: 'half_hour_session', name: 'Half Hour Hero', desc: 'Row 30+ minutes in one session', emoji: '🎯', 
    check: (u, e) => e.some(x => (x.time || 0) >= 1800),
    getProgress: (u, e) => {
      const best = e.length > 0 ? Math.max(...e.map(x => x.time || 0)) : 0;
      return { current: Math.min(best, 1800), target: 1800 };
    }
  },
  { 
    id: 'hour_session', name: 'Hour of Power', desc: 'Row 60+ minutes in one session', emoji: '💪', 
    check: (u, e) => e.some(x => (x.time || 0) >= 3600),
    getProgress: (u, e) => {
      const best = e.length > 0 ? Math.max(...e.map(x => x.time || 0)) : 0;
      return { current: Math.min(best, 3600), target: 3600 };
    }
  },
  
  // Calorie achievements
  { 
    id: 'first_1k_cal', name: 'Calorie Crusher', desc: 'Burn 1,000 calories total', emoji: '🔥', 
    check: (u) => (u.totalCalories || 0) >= 1000,
    getProgress: (u) => ({ current: Math.min(u.totalCalories || 0, 1000), target: 1000 })
  },
  { 
    id: 'pizza_burner', name: 'Pizza Burner', desc: 'Burn 5,000 calories (≈ 2.5 pizzas!)', emoji: '🍕', 
    check: (u) => (u.totalCalories || 0) >= 5000,
    getProgress: (u) => ({ current: Math.min(u.totalCalories || 0, 5000), target: 5000 })
  },
  { 
    id: 'ten_k_cal', name: 'Furnace', desc: 'Burn 10,000 calories total', emoji: '🌋', 
    check: (u) => (u.totalCalories || 0) >= 10000,
    getProgress: (u) => ({ current: Math.min(u.totalCalories || 0, 10000), target: 10000 })
  },
  { 
    id: 'fifty_k_cal', name: 'Inferno', desc: 'Burn 50,000 calories total', emoji: '☄️', 
    check: (u) => (u.totalCalories || 0) >= 50000,
    getProgress: (u) => ({ current: Math.min(u.totalCalories || 0, 50000), target: 50000 })
  },
  { 
    id: 'hundred_k_cal', name: 'Calorie Destroyer', desc: 'Burn 100,000 calories total', emoji: '💥', 
    check: (u) => (u.totalCalories || 0) >= 100000,
    getProgress: (u) => ({ current: Math.min(u.totalCalories || 0, 100000), target: 100000 })
  },
  { 
    id: 'big_burn', name: 'Big Burn', desc: 'Burn 500+ calories in one session', emoji: '🥵', 
    check: (u, e) => e.some(x => (x.calories || 0) >= 500),
    getProgress: (u, e) => {
      const best = e.length > 0 ? Math.max(...e.map(x => x.calories || 0)) : 0;
      return { current: Math.min(best, 500), target: 500 };
    }
  },
];
