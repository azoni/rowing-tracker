import React from 'react';
import { ICONS } from '../constants/iconMap';

// Vibrant color palette for each icon — gives the app life
const ICON_COLORS = {
  // UI — warm & varied
  ui_fire: '#ff6b35',
  ui_trophy: '#ffd700',
  ui_medal: '#ffd700',
  ui_crown: '#ffd700',
  ui_gold: '#ffd700',
  ui_silver: '#c0c0c0',
  ui_bronze: '#cd7f32',
  ui_star: '#ffec3d',
  ui_sparkle: '#ffec3d',
  ui_bolt: '#ffcc00',
  ui_rocket: '#ff6b6b',
  ui_target: '#ff4757',
  ui_bell: '#ffb142',
  ui_camera: '#a29bfe',
  ui_gallery: '#a29bfe',
  ui_globe: '#54a0ff',
  ui_pin: '#ff6b6b',
  ui_rowing: '#00d4aa',
  ui_robot: '#74b9ff',
  ui_shield: '#ffd700',
  ui_gift: '#ff6b6b',
  ui_celebrate: '#ff6b6b',
  ui_fireworks: '#ffd700',
  ui_warning: '#ffa502',
  ui_success: '#2ed573',
  ui_check: '#2ed573',
  ui_unverified: '#ff4757',
  ui_pending: '#ffa502',
  ui_info: '#74b9ff',
  ui_info_circle: '#74b9ff',
  ui_chart: '#a29bfe',
  ui_feed: '#ff6b6b',
  ui_streak: '#2ed573',
  ui_calendar: '#74b9ff',
  ui_clock: '#74b9ff',
  ui_timer: '#ffb142',
  ui_records: '#ffd700',
  ui_meters: '#00d4aa',
  ui_share: '#74b9ff',
  ui_upload: '#a29bfe',
  ui_refresh: '#54a0ff',
  ui_history: '#a29bfe',
  ui_user: '#74b9ff',
  ui_users: '#54a0ff',
  ui_settings: '#a29bfe',
  ui_signout: '#ff6b6b',
  ui_link: '#00d4aa',
  ui_plus: '#2ed573',
  ui_search: '#a29bfe',
  ui_comment: '#74b9ff',
  ui_police: '#ff4757',

  // Ranks — colored by tier
  rank_landlubber: '#cd7f32',   // bronze
  rank_deckhand: '#cd7f32',     // bronze
  rank_oar_dipper: '#cd7f32',   // bronze
  rank_novice: '#cd7f32',       // bronze
  rank_river: '#c0c0c0',        // silver
  rank_lake: '#c0c0c0',         // silver
  rank_channel: '#c0c0c0',      // silver
  rank_ocean: '#c0c0c0',        // silver
  rank_iron: '#ffd700',          // gold
  rank_steel: '#ffd700',         // gold
  rank_wave_breaker: '#ffd700',  // gold
  rank_champion: '#ffd700',      // gold
  rank_storm: '#a29bfe',         // platinum
  rank_tide: '#a29bfe',          // platinum
  rank_legend: '#a29bfe',        // platinum
  rank_ocean_master: '#a29bfe',  // platinum
  rank_mythical: '#00d4aa',      // diamond
  rank_kraken: '#00d4aa',        // diamond
  rank_poseidon: '#00d4aa',      // diamond
  rank_immortal: '#00d4aa',      // diamond

  // Achievements — colorful by category
  achievement_first_strokes: '#ff6b6b',
  achievement_getting_serious: '#ff6b35',
  achievement_dedicated: '#ffd700',
  achievement_centurion: '#ffd700',
  achievement_5k: '#ff4757',
  achievement_10k: '#ff6b35',
  achievement_half_marathon: '#2ed573',
  achievement_marathon: '#2ed573',
  achievement_100k: '#ffec3d',
  achievement_250k: '#ffd700',
  achievement_half_million: '#a29bfe',
  achievement_million: '#74b9ff',
  achievement_power_hour: '#ffcc00',
  achievement_beast_mode: '#ff6b35',
  achievement_hat_trick: '#a29bfe',
  achievement_week_warrior: '#54a0ff',
  achievement_fortnight: '#ff6b35',
  achievement_monthly_master: '#ffd700',
  achievement_60_day: '#ff6b35',
  achievement_century_streak: '#ffd700',
  achievement_early_bird: '#ffb142',
  achievement_night_owl: '#a29bfe',
  achievement_lunch_legend: '#ff6b6b',
  achievement_consistency: '#ffd700',
  achievement_double_trouble: '#2ed573',
  achievement_perfect_week: '#54a0ff',
  achievement_weekend_warrior: '#ff6b6b',
  achievement_veteran: '#ffd700',
  achievement_triple_threat: '#ff4757',
  achievement_weekly_champion: '#ffd700',
  achievement_triple_crown: '#ffd700',
  achievement_dynasty: '#74b9ff',
  achievement_first_hour: '#ffb142',
  achievement_time_investor: '#a29bfe',
  achievement_time_lord: '#74b9ff',
  achievement_century_timer: '#ffd700',
  achievement_half_hour_hero: '#ff4757',
  achievement_hour_power: '#ff6b35',
  achievement_calorie_crusher: '#ff6b35',
  achievement_pizza_burner: '#ff6b6b',
  achievement_furnace: '#ff4757',
  achievement_inferno: '#ff6b35',
  achievement_calorie_destroyer: '#ff4757',
  achievement_big_burn: '#ff6b35',
  achievement_speed_demon: '#ffcc00',
  achievement_lightning_pace: '#ffcc00',
  achievement_nine_to_five: '#74b9ff',
  achievement_dawn_patrol: '#ffb142',
  achievement_hump_day: '#ffb142',
  achievement_creature_habit: '#a29bfe',
  achievement_record_breaker: '#ffd700',
  achievement_escalation: '#2ed573',
  achievement_iron_will: '#ff6b35',
  achievement_palindrome: '#a29bfe',
  achievement_lucky_sevens: '#2ed573',
  achievement_round_roller: '#ff4757',
  achievement_coffee_powered: '#ffb142',
  achievement_ultramarathon: '#ffd700',
  achievement_century_session: '#ffb142',
  achievement_big_day: '#ff6b35',
  achievement_summer_grind: '#ffec3d',
  achievement_winter_warrior: '#74b9ff',
  achievement_top_10: '#ffd700',
  achievement_quarter_century: '#74b9ff',
  achievement_bicentennial: '#a29bfe',
  achievement_living_legend: '#ffd700',
  achievement_50k: '#ff6b35',
  achievement_75k: '#ff6b35',
  achievement_2m: '#ffd700',
  achievement_the_standard: '#54a0ff',
  achievement_the_five_k: '#54a0ff',
  achievement_the_ten_k: '#54a0ff',
  achievement_distance_machine: '#2ed573',
  achievement_show_work: '#a29bfe',
  achievement_proof_positive: '#2ed573',
  achievement_documenter: '#2ed573',
  achievement_comeback: '#74b9ff',
  achievement_the_return: '#74b9ff',
  achievement_quarterly: '#ffb142',
  achievement_half_year: '#ff6b35',
  achievement_year_rounder: '#ffd700',
  achievement_3_weeks: '#ff6b35',
  achievement_45_days: '#ff6b35',
  achievement_full_rotation: '#a29bfe',
  achievement_explorer: '#54a0ff',
  achievement_flexible: '#74b9ff',
  achievement_time_keeper: '#ffb142',
  achievement_overachiever: '#2ed573',
  achievement_balanced: '#a29bfe',
  achievement_warm_up: '#ffb142',
  achievement_kiloburn: '#ff4757',
  achievement_five_hours: '#74b9ff',
  achievement_full_day: '#a29bfe',
  achievement_quick_fifteen: '#74b9ff',
  achievement_endurance: '#ff6b35',
  achievement_the_grind: '#ff4757',
  achievement_morning_evening: '#ffb142',
  achievement_high_roller: '#ffd700',
  achievement_no_days_off: '#ff6b6b',
  achievement_spring: '#2ed573',

  // Milestones — earthy varied palette
  milestone_building: '#a29bfe',
  milestone_football: '#2ed573',
  milestone_coaster: '#ff6b6b',
  milestone_pool: '#54a0ff',
  milestone_bridge: '#ff6b35',
  milestone_pi: '#a29bfe',
  milestone_tower: '#ffd700',
  milestone_park: '#2ed573',
  milestone_giraffe: '#ffb142',
  milestone_plane: '#74b9ff',
  milestone_mountain: '#a29bfe',
  milestone_tv: '#74b9ff',
  milestone_cloud: '#54a0ff',
  milestone_fish: '#54a0ff',
  milestone_beaver: '#ffb142',
  milestone_runner: '#2ed573',
  milestone_pizza: '#ff6b35',
  milestone_subway: '#a29bfe',
  milestone_guitar: '#ff6b6b',
  milestone_beach: '#ffec3d',
  milestone_medal: '#ffd700',
  milestone_dinosaur: '#2ed573',
  milestone_cart: '#74b9ff',
  milestone_bowling: '#ff4757',
  milestone_pasta: '#ffb142',
  milestone_dog: '#ffb142',
  milestone_grin: '#ffec3d',
  milestone_castle: '#a29bfe',
  milestone_shark: '#54a0ff',
  milestone_train: '#ff6b35',
  milestone_sailboat: '#54a0ff',
  milestone_ski: '#74b9ff',
  milestone_hotdog: '#ff6b35',
  milestone_snail: '#2ed573',
  milestone_banana: '#ffec3d',
  milestone_racecar: '#ff4757',
  milestone_statue: '#2ed573',
  milestone_trees: '#2ed573',
  milestone_gamepad: '#a29bfe',
  milestone_rocket: '#ff6b6b',
  milestone_leaf: '#2ed573',
  milestone_cheese: '#ffec3d',
  milestone_wave: '#54a0ff',
  milestone_burger: '#ff6b35',
  milestone_kangaroo: '#ffb142',
  milestone_music: '#a29bfe',
  milestone_bear: '#ffb142',
  milestone_waffle: '#ffb142',
  milestone_city: '#74b9ff',
  milestone_whale: '#54a0ff',
  milestone_desert: '#ffb142',
  milestone_movie: '#ff6b6b',
  milestone_noodles: '#ffb142',
  milestone_eagle: '#ffd700',
  milestone_americanfootball: '#ff6b35',
  milestone_flower: '#ff6b6b',
  milestone_italian: '#ff4757',
  milestone_polarbear: '#74b9ff',
  milestone_taco: '#ffb142',
  milestone_island: '#2ed573',
  milestone_map: '#54a0ff',
  milestone_volcano: '#ff4757',
  milestone_tokyotower: '#ff6b6b',
  milestone_dumpling: '#ffb142',
  milestone_bowl: '#ff6b35',
  milestone_mosque: '#ffd700',
  milestone_camel: '#ffb142',
  milestone_pyramid: '#ffd700',
  milestone_croissant: '#ffb142',
  milestone_coffee: '#ffb142',
  milestone_iceland: '#74b9ff',
  milestone_newyork: '#2ed573',
  milestone_surfing: '#54a0ff',
  milestone_mexico: '#ff6b35',
  milestone_target: '#ff4757',
  milestone_llama: '#ffb142',
  milestone_wine: '#a29bfe',
  milestone_home: '#ffd700',

  // Themes
  theme_boathouse: '#c9a227',
  theme_boathouse_classic: '#c9a227',
  theme_sunrise: '#e07c4c',
  theme_morning_lake: '#2d7d9a',
  theme_athletic: '#f97316',
  theme_athletic_performance: '#f97316',
  theme_ocean: '#14b8a6',
  theme_ocean_crew: '#14b8a6',
};

function Icon({ name, size = 20, className = '', color, style = {} }) {
  // Use explicit color > mapped color > theme accent fallback
  const resolvedColor = color || ICON_COLORS[name] || 'var(--accent-primary, #00d4aa)';
  const icon = ICONS[name];

  // Fallback: render the key string (graceful degradation for unmapped icons)
  if (!icon) {
    return <span className={`icon-fallback ${className}`} style={{ fontSize: size * 0.8, ...style }}>{name}</span>;
  }

  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={`icon ${className}`}
      style={style}
      role="img"
      aria-hidden="true"
    >
      {typeof icon === 'string' ? (
        <path d={icon} fill={resolvedColor} />
      ) : (
        icon(resolvedColor)
      )}
    </svg>
  );
}

export default Icon;
