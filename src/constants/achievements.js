// Achievement definitions
export const ACHIEVEMENTS = [
  // Session count achievements
  { 
    id: 'first_row', name: 'First Strokes', desc: 'Log your first row', emoji: 'achievement_first_strokes', 
    check: (u, e) => e.length >= 1,
    getProgress: (u, e) => ({ current: Math.min(e.length, 1), target: 1 })
  },
  { 
    id: 'ten_sessions', name: 'Getting Serious', desc: 'Complete 10 sessions', emoji: 'achievement_getting_serious', 
    check: (u, e) => e.length >= 10,
    getProgress: (u, e) => ({ current: Math.min(e.length, 10), target: 10 })
  },
  { 
    id: 'fifty_sessions', name: 'Dedicated Rower', desc: 'Complete 50 sessions', emoji: 'achievement_dedicated', 
    check: (u, e) => e.length >= 50,
    getProgress: (u, e) => ({ current: Math.min(e.length, 50), target: 50 })
  },
  { 
    id: 'hundred_sessions', name: 'Centurion', desc: 'Complete 100 sessions', emoji: 'achievement_centurion', 
    check: (u, e) => e.length >= 100,
    getProgress: (u, e) => ({ current: Math.min(e.length, 100), target: 100 })
  },
  
  // Distance achievements
  { 
    id: 'first_5k', name: '5K Club', desc: 'Row 5,000 meters total', emoji: 'achievement_5k', 
    check: (u) => u.totalMeters >= 5000,
    getProgress: (u) => ({ current: Math.min(u.totalMeters || 0, 5000), target: 5000 })
  },
  { 
    id: 'first_10k', name: '10K Crusher', desc: 'Row 10,000 meters total', emoji: 'achievement_10k', 
    check: (u) => u.totalMeters >= 10000,
    getProgress: (u) => ({ current: Math.min(u.totalMeters || 0, 10000), target: 10000 })
  },
  { 
    id: 'marathon', name: 'Marathon Rower', desc: 'Row a marathon (42,195m)', emoji: 'achievement_marathon', 
    check: (u) => u.totalMeters >= 42195,
    getProgress: (u) => ({ current: Math.min(u.totalMeters || 0, 42195), target: 42195 })
  },
  { 
    id: 'hundred_k', name: '100K Legend', desc: 'Row 100,000 meters total', emoji: 'achievement_100k', 
    check: (u) => u.totalMeters >= 100000,
    getProgress: (u) => ({ current: Math.min(u.totalMeters || 0, 100000), target: 100000 })
  },
  
  // Single session achievements
  { 
    id: 'big_session', name: 'Power Hour', desc: 'Row 5,000m in one session', emoji: 'achievement_power_hour', 
    check: (u, e) => e.some(x => x.meters >= 5000),
    getProgress: (u, e) => {
      const best = e.length > 0 ? Math.max(...e.map(x => x.meters)) : 0;
      return { current: Math.min(best, 5000), target: 5000 };
    }
  },
  { 
    id: 'huge_session', name: 'Beast Mode', desc: 'Row 10,000m in one session', emoji: 'achievement_beast_mode', 
    check: (u, e) => e.some(x => x.meters >= 10000),
    getProgress: (u, e) => {
      const best = e.length > 0 ? Math.max(...e.map(x => x.meters)) : 0;
      return { current: Math.min(best, 10000), target: 10000 };
    }
  },
  
  // Streak achievements
  { 
    id: 'streak_3', name: 'Hat Trick', desc: 'Maintain a 3-day streak', emoji: 'achievement_hat_trick', 
    check: (u, e, s) => s >= 3,
    getProgress: (u, e, s) => ({ current: Math.min(s, 3), target: 3 })
  },
  { 
    id: 'streak_7', name: 'Week Warrior', desc: 'Maintain a 7-day streak', emoji: 'achievement_week_warrior', 
    check: (u, e, s) => s >= 7,
    getProgress: (u, e, s) => ({ current: Math.min(s, 7), target: 7 })
  },
  { 
    id: 'streak_14', name: 'Fortnight Force', desc: 'Maintain a 14-day streak', emoji: 'achievement_fortnight', 
    check: (u, e, s) => s >= 14,
    getProgress: (u, e, s) => ({ current: Math.min(s, 14), target: 14 })
  },
  { 
    id: 'streak_30', name: 'Monthly Master', desc: 'Maintain a 30-day streak', emoji: 'achievement_monthly_master', 
    check: (u, e, s) => s >= 30,
    getProgress: (u, e, s) => ({ current: Math.min(s, 30), target: 30 })
  },
  
  // Fun achievements
  {
    id: 'early_bird', name: 'Early Bird', desc: 'Log a row before 7am', emoji: 'achievement_early_bird',
    check: (u, e) => e.some(x => (x.localHour ?? new Date(x.date).getHours()) < 7),
    getProgress: (u, e) => ({ current: e.some(x => (x.localHour ?? new Date(x.date).getHours()) < 7) ? 1 : 0, target: 1 })
  },
  {
    id: 'night_owl', name: 'Night Owl', desc: 'Log a row after 10pm', emoji: 'achievement_night_owl',
    check: (u, e) => e.some(x => (x.localHour ?? new Date(x.date).getHours()) >= 22),
    getProgress: (u, e) => ({ current: e.some(x => (x.localHour ?? new Date(x.date).getHours()) >= 22) ? 1 : 0, target: 1 })
  },
  { 
    id: 'consistent', name: 'Consistency King', desc: 'Row 4+ days in a week', emoji: 'achievement_consistency', 
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
    id: 'half_marathon', name: 'Half Marathon', desc: 'Row 21,097m total', emoji: 'achievement_half_marathon', 
    check: (u) => u.totalMeters >= 21097,
    getProgress: (u) => ({ current: Math.min(u.totalMeters || 0, 21097), target: 21097 })
  },
  { 
    id: 'quarter_million', name: '250K Club', desc: 'Row 250,000m total', emoji: 'achievement_250k', 
    check: (u) => u.totalMeters >= 250000,
    getProgress: (u) => ({ current: Math.min(u.totalMeters || 0, 250000), target: 250000 })
  },
  { 
    id: 'half_million', name: 'Half Million Hero', desc: 'Row 500,000m total', emoji: 'achievement_half_million', 
    check: (u) => u.totalMeters >= 500000,
    getProgress: (u) => ({ current: Math.min(u.totalMeters || 0, 500000), target: 500000 })
  },
  { 
    id: 'million', name: 'Millionaire', desc: 'Row 1,000,000m total', emoji: 'achievement_million', 
    check: (u) => u.totalMeters >= 1000000,
    getProgress: (u) => ({ current: Math.min(u.totalMeters || 0, 1000000), target: 1000000 })
  },
  
  // Fun achievements
  { 
    id: 'double_trouble', name: 'Double Trouble', desc: 'Log 2 rows in one day', emoji: 'achievement_double_trouble', 
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
    id: 'perfect_week', name: 'Perfect Week', desc: 'Row every day for 7 consecutive days', emoji: 'achievement_perfect_week', 
    check: (u, e, s) => s >= 7,
    getProgress: (u, e, s) => ({ current: Math.min(s, 7), target: 7 })
  },
  { 
    id: 'weekend_warrior', name: 'Weekend Warrior', desc: 'Row on both Saturday and Sunday', emoji: 'achievement_weekend_warrior', 
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
    id: 'veteran', name: 'Veteran Rower', desc: 'Be a member for 30 days', emoji: 'achievement_veteran', 
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
    id: 'weekly_champion', name: 'Weekly Champion', desc: 'Win the weekly leaderboard', emoji: 'achievement_weekly_champion', 
    check: (u) => u.weeklyWins >= 1,
    getProgress: (u) => ({ current: u.weeklyWins || 0, target: 1 })
  },
  { 
    id: 'weekly_champion_3', name: 'Triple Crown', desc: 'Win weekly leaderboard 3 times', emoji: 'achievement_triple_crown', 
    check: (u) => u.weeklyWins >= 3,
    getProgress: (u) => ({ current: Math.min(u.weeklyWins || 0, 3), target: 3 })
  },
  { 
    id: 'weekly_champion_10', name: 'Dynasty Builder', desc: 'Win weekly leaderboard 10 times', emoji: 'achievement_dynasty', 
    check: (u) => u.weeklyWins >= 10,
    getProgress: (u) => ({ current: Math.min(u.weeklyWins || 0, 10), target: 10 })
  },
  // Streak achievements extended
  { 
    id: 'streak_60', name: '60 Day Fire', desc: 'Maintain a 60-day streak', emoji: 'achievement_60_day', 
    check: (u, e, s) => s >= 60,
    getProgress: (u, e, s) => ({ current: Math.min(s, 60), target: 60 })
  },
  { 
    id: 'streak_100', name: 'Century Streak', desc: 'Maintain a 100-day streak', emoji: 'achievement_century_streak', 
    check: (u, e, s) => s >= 100,
    getProgress: (u, e, s) => ({ current: Math.min(s, 100), target: 100 })
  },
  // Fun achievements
  { 
    id: 'triple_session', name: 'Triple Threat', desc: 'Log 3 rows in one day', emoji: 'achievement_triple_threat', 
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
    id: 'lunch_rower', name: 'Lunch Break Legend', desc: 'Log a row between 11am and 1pm', emoji: 'achievement_lunch_legend',
    check: (u, e) => e.some(x => {
      const hour = x.localHour ?? new Date(x.date).getHours();
      return hour >= 11 && hour < 13;
    }),
    getProgress: (u, e) => ({
      current: e.some(x => {
        const hour = x.localHour ?? new Date(x.date).getHours();
        return hour >= 11 && hour < 13;
      }) ? 1 : 0,
      target: 1
    })
  },
  
  // Time achievements
  { 
    id: 'first_hour', name: 'First Hour', desc: 'Row for 1 hour total', emoji: 'achievement_first_hour', 
    check: (u) => (u.totalTime || 0) >= 3600,
    getProgress: (u) => ({ current: Math.min(u.totalTime || 0, 3600), target: 3600 })
  },
  { 
    id: 'ten_hours', name: 'Time Investor', desc: 'Row for 10 hours total', emoji: 'achievement_time_investor', 
    check: (u) => (u.totalTime || 0) >= 36000,
    getProgress: (u) => ({ current: Math.min(u.totalTime || 0, 36000), target: 36000 })
  },
  { 
    id: 'fifty_hours', name: 'Time Lord', desc: 'Row for 50 hours total', emoji: 'achievement_time_lord', 
    check: (u) => (u.totalTime || 0) >= 180000,
    getProgress: (u) => ({ current: Math.min(u.totalTime || 0, 180000), target: 180000 })
  },
  { 
    id: 'hundred_hours', name: 'Century Timer', desc: 'Row for 100 hours total', emoji: 'achievement_century_timer', 
    check: (u) => (u.totalTime || 0) >= 360000,
    getProgress: (u) => ({ current: Math.min(u.totalTime || 0, 360000), target: 360000 })
  },
  { 
    id: 'half_hour_session', name: 'Half Hour Hero', desc: 'Row 30+ minutes in one session', emoji: 'achievement_half_hour_hero', 
    check: (u, e) => e.some(x => (x.time || 0) >= 1800),
    getProgress: (u, e) => {
      const best = e.length > 0 ? Math.max(...e.map(x => x.time || 0)) : 0;
      return { current: Math.min(best, 1800), target: 1800 };
    }
  },
  { 
    id: 'hour_session', name: 'Hour of Power', desc: 'Row 60+ minutes in one session', emoji: 'achievement_hour_power', 
    check: (u, e) => e.some(x => (x.time || 0) >= 3600),
    getProgress: (u, e) => {
      const best = e.length > 0 ? Math.max(...e.map(x => x.time || 0)) : 0;
      return { current: Math.min(best, 3600), target: 3600 };
    }
  },
  
  // Calorie achievements
  { 
    id: 'first_1k_cal', name: 'Calorie Crusher', desc: 'Burn 1,000 calories total', emoji: 'achievement_calorie_crusher', 
    check: (u) => (u.totalCalories || 0) >= 1000,
    getProgress: (u) => ({ current: Math.min(u.totalCalories || 0, 1000), target: 1000 })
  },
  { 
    id: 'pizza_burner', name: 'Pizza Burner', desc: 'Burn 5,000 calories (≈ 2.5 pizzas!)', emoji: 'achievement_pizza_burner', 
    check: (u) => (u.totalCalories || 0) >= 5000,
    getProgress: (u) => ({ current: Math.min(u.totalCalories || 0, 5000), target: 5000 })
  },
  { 
    id: 'ten_k_cal', name: 'Furnace', desc: 'Burn 10,000 calories total', emoji: 'achievement_furnace', 
    check: (u) => (u.totalCalories || 0) >= 10000,
    getProgress: (u) => ({ current: Math.min(u.totalCalories || 0, 10000), target: 10000 })
  },
  { 
    id: 'fifty_k_cal', name: 'Inferno', desc: 'Burn 50,000 calories total', emoji: 'achievement_inferno', 
    check: (u) => (u.totalCalories || 0) >= 50000,
    getProgress: (u) => ({ current: Math.min(u.totalCalories || 0, 50000), target: 50000 })
  },
  { 
    id: 'hundred_k_cal', name: 'Calorie Destroyer', desc: 'Burn 100,000 calories total', emoji: 'achievement_calorie_destroyer', 
    check: (u) => (u.totalCalories || 0) >= 100000,
    getProgress: (u) => ({ current: Math.min(u.totalCalories || 0, 100000), target: 100000 })
  },
  {
    id: 'big_burn', name: 'Big Burn', desc: 'Burn 500+ calories in one session', emoji: 'achievement_big_burn',
    check: (u, e) => e.some(x => (x.calories || 0) >= 500),
    getProgress: (u, e) => {
      const best = e.length > 0 ? Math.max(...e.map(x => x.calories || 0)) : 0;
      return { current: Math.min(best, 500), target: 500 };
    }
  },

  // Pace achievements
  {
    id: 'speed_demon',
    name: 'Speed Demon',
    emoji: 'achievement_speed_demon',
    desc: 'Achieve sub-2:00/500m pace in a session',
    check: (user, entries) => entries.some(e => e.time && e.meters && (e.time / e.meters) * 500 < 120),
    getProgress: (user, entries) => {
      const best = entries.filter(e => e.time && e.meters).map(e => (e.time / e.meters) * 500);
      const bestPace = best.length > 0 ? Math.min(...best) : 999;
      return { current: bestPace <= 120 ? 1 : 0, target: 1 };
    },
  },
  {
    id: 'lightning',
    name: 'Lightning',
    emoji: 'achievement_lightning_pace',
    desc: 'Achieve sub-1:50/500m pace in a session',
    check: (user, entries) => entries.some(e => e.time && e.meters && (e.time / e.meters) * 500 < 110),
    getProgress: (user, entries) => {
      const best = entries.filter(e => e.time && e.meters).map(e => (e.time / e.meters) * 500);
      const bestPace = best.length > 0 ? Math.min(...best) : 999;
      return { current: bestPace <= 110 ? 1 : 0, target: 1 };
    },
  },

  // Pattern achievements
  {
    id: 'every_weekday',
    name: '9 to 5',
    emoji: 'achievement_nine_to_five',
    desc: 'Row every weekday (Mon-Fri) in a single week',
    check: (user, entries) => {
      const weekMap = {};
      entries.forEach(e => {
        const d = new Date(e.date);
        const day = d.getDay();
        if (day >= 1 && day <= 5) {
          const weekStart = new Date(d);
          weekStart.setDate(d.getDate() - d.getDay() + 1);
          const key = weekStart.toISOString().split('T')[0];
          if (!weekMap[key]) weekMap[key] = new Set();
          weekMap[key].add(day);
        }
      });
      return Object.values(weekMap).some(days => days.size >= 5);
    },
    getProgress: (user, entries) => {
      const weekMap = {};
      entries.forEach(e => {
        const d = new Date(e.date);
        const day = d.getDay();
        if (day >= 1 && day <= 5) {
          const weekStart = new Date(d);
          weekStart.setDate(d.getDate() - d.getDay() + 1);
          const key = weekStart.toISOString().split('T')[0];
          if (!weekMap[key]) weekMap[key] = new Set();
          weekMap[key].add(day);
        }
      });
      const best = Object.values(weekMap).reduce((max, days) => Math.max(max, days.size), 0);
      return { current: best, target: 5 };
    },
  },
  {
    id: 'dawn_patrol',
    name: 'Dawn Patrol',
    emoji: 'achievement_dawn_patrol',
    desc: 'Row before 7am five times',
    check: (user, entries) => entries.filter(e => (e.localHour !== undefined ? e.localHour : new Date(e.date).getHours()) < 7).length >= 5,
    getProgress: (user, entries) => ({
      current: entries.filter(e => (e.localHour !== undefined ? e.localHour : new Date(e.date).getHours()) < 7).length,
      target: 5,
    }),
  },
  {
    id: 'hump_day',
    name: 'Hump Day Hero',
    emoji: 'achievement_hump_day',
    desc: 'Row on 10 different Wednesdays',
    check: (user, entries) => {
      const weds = new Set(entries.filter(e => new Date(e.date).getDay() === 3).map(e => new Date(e.date).toDateString()));
      return weds.size >= 10;
    },
    getProgress: (user, entries) => {
      const weds = new Set(entries.filter(e => new Date(e.date).getDay() === 3).map(e => new Date(e.date).toDateString()));
      return { current: weds.size, target: 10 };
    },
  },
  {
    id: 'creature_of_habit',
    name: 'Creature of Habit',
    emoji: 'achievement_creature_habit',
    desc: 'Row within the same hour for 7 days straight',
    check: (user, entries) => {
      if (entries.length < 7) return false;
      const sorted = [...entries].sort((a, b) => new Date(a.date) - new Date(b.date));
      for (let i = 0; i <= sorted.length - 7; i++) {
        const window = sorted.slice(i, i + 7);
        const hours = window.map(e => e.localHour !== undefined ? e.localHour : new Date(e.date).getHours());
        const days = window.map(e => new Date(e.date));
        let consecutive = true;
        for (let j = 1; j < 7; j++) {
          const diff = Math.round((days[j] - days[j-1]) / (1000 * 60 * 60 * 24));
          if (diff !== 1) { consecutive = false; break; }
        }
        if (!consecutive) continue;
        const baseHour = hours[0];
        if (hours.every(h => Math.abs(h - baseHour) <= 1 || Math.abs(h - baseHour) >= 23)) return true;
      }
      return false;
    },
    getProgress: (user, entries) => ({ current: entries.length >= 7 ? 1 : 0, target: 1 }),
  },

  // Improvement achievements
  {
    id: 'new_pr',
    name: 'Record Breaker',
    emoji: 'achievement_record_breaker',
    desc: 'Set a new personal best distance (after your first row)',
    check: (user, entries) => {
      if (entries.length < 2) return false;
      const sorted = [...entries].sort((a, b) => new Date(a.date) - new Date(b.date));
      let maxSoFar = sorted[0].meters;
      for (let i = 1; i < sorted.length; i++) {
        if (sorted[i].meters > maxSoFar) return true;
        maxSoFar = Math.max(maxSoFar, sorted[i].meters);
      }
      return false;
    },
    getProgress: (user, entries) => ({ current: entries.length >= 2 ? 1 : 0, target: 1 }),
  },
  {
    id: 'progressive',
    name: 'Escalation',
    emoji: 'achievement_escalation',
    desc: 'Log 5 sessions in a row, each longer than the previous',
    check: (user, entries) => {
      if (entries.length < 5) return false;
      const sorted = [...entries].sort((a, b) => new Date(a.date) - new Date(b.date));
      let streak = 1;
      for (let i = 1; i < sorted.length; i++) {
        if (sorted[i].meters > sorted[i-1].meters) {
          streak++;
          if (streak >= 5) return true;
        } else {
          streak = 1;
        }
      }
      return false;
    },
    getProgress: (user, entries) => {
      if (entries.length < 2) return { current: 1, target: 5 };
      const sorted = [...entries].sort((a, b) => new Date(a.date) - new Date(b.date));
      let streak = 1, best = 1;
      for (let i = 1; i < sorted.length; i++) {
        if (sorted[i].meters > sorted[i-1].meters) { streak++; best = Math.max(best, streak); }
        else { streak = 1; }
      }
      return { current: Math.min(best, 5), target: 5 };
    },
  },
  {
    id: 'back_to_back_5k',
    name: 'Iron Will',
    emoji: 'achievement_iron_will',
    desc: 'Row 5,000m+ on two consecutive days',
    check: (user, entries) => {
      const bigDays = new Set(entries.filter(e => e.meters >= 5000).map(e => {
        const d = new Date(e.date); d.setHours(0,0,0,0); return d.getTime();
      }));
      for (const day of bigDays) {
        if (bigDays.has(day + 86400000)) return true;
      }
      return false;
    },
    getProgress: (user, entries) => ({ current: entries.filter(e => e.meters >= 5000).length >= 2 ? 1 : 0, target: 1 }),
  },

  // Fun/quirky achievements
  {
    id: 'palindrome',
    name: 'Palindrome',
    emoji: 'achievement_palindrome',
    desc: 'Row a palindrome distance (e.g., 2002m, 5005m)',
    check: (user, entries) => entries.some(e => {
      const s = e.meters.toString();
      return s.length >= 4 && s === s.split('').reverse().join('');
    }),
    getProgress: (user, entries) => ({ current: entries.some(e => { const s = e.meters.toString(); return s.length >= 4 && s === s.split('').reverse().join(''); }) ? 1 : 0, target: 1 }),
  },
  {
    id: 'lucky_sevens',
    name: 'Lucky Sevens',
    emoji: 'achievement_lucky_sevens',
    desc: 'Reach exactly 7,777m total',
    check: (user) => (user.totalMeters || 0) >= 7777,
    getProgress: (user) => ({ current: Math.min(user.totalMeters || 0, 7777), target: 7777 }),
  },
  {
    id: 'round_number',
    name: 'Round Roller',
    emoji: 'achievement_round_roller',
    desc: 'Log a round-thousand distance (1000, 2000, 3000...) 5 times',
    check: (user, entries) => entries.filter(e => e.meters >= 1000 && e.meters % 1000 === 0).length >= 5,
    getProgress: (user, entries) => ({
      current: entries.filter(e => e.meters >= 1000 && e.meters % 1000 === 0).length,
      target: 5,
    }),
  },
  {
    id: 'coffee_powered',
    name: 'Coffee Powered',
    emoji: 'achievement_coffee_powered',
    desc: 'Row before 8am on 5 consecutive days',
    check: (user, entries) => {
      const earlyDays = [...new Set(entries.filter(e => (e.localHour !== undefined ? e.localHour : new Date(e.date).getHours()) < 8).map(e => new Date(e.date).toDateString()))].map(d => new Date(d)).sort((a,b) => a-b);
      let streak = 1;
      for (let i = 1; i < earlyDays.length; i++) {
        const diff = Math.round((earlyDays[i] - earlyDays[i-1]) / 86400000);
        if (diff === 1) { streak++; if (streak >= 5) return true; }
        else streak = 1;
      }
      return false;
    },
    getProgress: (user, entries) => {
      const earlyDays = [...new Set(entries.filter(e => (e.localHour !== undefined ? e.localHour : new Date(e.date).getHours()) < 8).map(e => new Date(e.date).toDateString()))].map(d => new Date(d)).sort((a,b) => a-b);
      let streak = 1, best = earlyDays.length > 0 ? 1 : 0;
      for (let i = 1; i < earlyDays.length; i++) {
        const diff = Math.round((earlyDays[i] - earlyDays[i-1]) / 86400000);
        if (diff === 1) { streak++; best = Math.max(best, streak); }
        else streak = 1;
      }
      return { current: Math.min(best, 5), target: 5 };
    },
  },

  // Extreme achievements
  {
    id: 'ultra_session',
    name: 'Ultramarathon',
    emoji: 'achievement_ultramarathon',
    desc: 'Row 21,097m+ in a single session',
    check: (user, entries) => entries.some(e => e.meters >= 21097),
    getProgress: (user, entries) => {
      const best = entries.length > 0 ? Math.max(...entries.map(e => e.meters)) : 0;
      return { current: Math.min(best, 21097), target: 21097 };
    },
  },
  {
    id: 'century_minutes',
    name: 'Century Session',
    emoji: 'achievement_century_session',
    desc: 'Row for 100+ minutes in a single session',
    check: (user, entries) => entries.some(e => e.time && e.time >= 6000),
    getProgress: (user, entries) => {
      const best = entries.filter(e => e.time).map(e => Math.floor(e.time / 60));
      const bestMins = best.length > 0 ? Math.max(...best) : 0;
      return { current: Math.min(bestMins, 100), target: 100 };
    },
  },
  {
    id: 'five_figure_day',
    name: 'Big Day Energy',
    emoji: 'achievement_big_day',
    desc: 'Row 10,000m+ in a single calendar day',
    check: (user, entries) => {
      const dayTotals = {};
      entries.forEach(e => {
        const key = new Date(e.date).toDateString();
        dayTotals[key] = (dayTotals[key] || 0) + e.meters;
      });
      return Object.values(dayTotals).some(total => total >= 10000);
    },
    getProgress: (user, entries) => {
      const dayTotals = {};
      entries.forEach(e => {
        const key = new Date(e.date).toDateString();
        dayTotals[key] = (dayTotals[key] || 0) + e.meters;
      });
      const best = Object.values(dayTotals).length > 0 ? Math.max(...Object.values(dayTotals)) : 0;
      return { current: Math.min(best, 10000), target: 10000 };
    },
  },

  // Seasonal achievements
  {
    id: 'summer_grind',
    name: 'Summer Grind',
    emoji: 'achievement_summer_grind',
    desc: 'Log 20 sessions during Jun-Aug',
    check: (user, entries) => entries.filter(e => { const m = new Date(e.date).getMonth(); return m >= 5 && m <= 7; }).length >= 20,
    getProgress: (user, entries) => ({
      current: entries.filter(e => { const m = new Date(e.date).getMonth(); return m >= 5 && m <= 7; }).length,
      target: 20,
    }),
  },
  {
    id: 'winter_warrior_season',
    name: 'Winter Warrior',
    emoji: 'achievement_winter_warrior',
    desc: 'Log 10 sessions during Dec-Feb',
    check: (user, entries) => entries.filter(e => { const m = new Date(e.date).getMonth(); return m === 11 || m <= 1; }).length >= 10,
    getProgress: (user, entries) => ({
      current: entries.filter(e => { const m = new Date(e.date).getMonth(); return m === 11 || m <= 1; }).length,
      target: 10,
    }),
  },

  // Social achievement
  {
    id: 'top_10',
    name: 'Top 10',
    emoji: 'achievement_top_10',
    desc: 'Finish in the top 10 of the weekly leaderboard',
    check: (user) => (user.weeklyWins || 0) >= 1 || (user.weeklyTop10 || 0) >= 1,
    getProgress: (user) => ({ current: (user.weeklyWins || 0) + (user.weeklyTop10 || 0) >= 1 ? 1 : 0, target: 1 }),
  },
];
