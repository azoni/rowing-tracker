import React from 'react';

export const ICONS = {
  // ============================================================
  // RANK ICONS
  // ============================================================

  // Person walking/standing (beginner)
  rank_landlubber: 'M12 2a2 2 0 1 1 0 4 2 2 0 0 1 0-4zm2 6h-4a1 1 0 0 0-1 1v5h2v7h2v-7h2V9a1 1 0 0 0-1-1z',

  // Simple rowing oar
  rank_novice: 'M4.93 4.93a1 1 0 0 1 1.41 0l12.73 12.73a1 1 0 0 1-1.41 1.41L4.93 6.34a1 1 0 0 1 0-1.41zM3 9a3 3 0 0 0 3-3H3v3zm12 12a3 3 0 0 0 3-3h-3v3z',

  // Wavy water/river
  rank_river: 'M2 12c1.5-2 3-2 4.5 0s3 2 4.5 0 3-2 4.5 0 3 2 4.5 0v3c-1.5-2-3-2-4.5 0s-3 2-4.5 0-3-2-4.5 0-3 2-4.5 0v-3zm0-5c1.5-2 3-2 4.5 0s3 2 4.5 0 3-2 4.5 0 3 2 4.5 0v3c-1.5-2-3-2-4.5 0s-3 2-4.5 0-3-2-4.5 0-3 2-4.5 0V7z',

  // Sailboat on water
  rank_lake: 'M12 3l-5 9h10L12 3zm-8 11c1.5-1.5 3-1.5 4.5 0s3 1.5 4.5 0 3-1.5 4.5 0 3 1.5 4.5 0v2c-1.5-1.5-3-1.5-4.5 0s-3 1.5-4.5 0-3-1.5-4.5 0-3 1.5-4.5 0v-2zm0 4c1.5-1.5 3-1.5 4.5 0s3 1.5 4.5 0 3-1.5 4.5 0 3 1.5 4.5 0v2c-1.5-1.5-3-1.5-4.5 0s-3 1.5-4.5 0-3-1.5-4.5 0-3 1.5-4.5 0v-2z',

  // Speedboat
  rank_ocean: 'M20 18c-1.5-1.5-3-1.5-4.5 0s-3 1.5-4.5 0-3-1.5-4.5 0-3 1.5-4.5 0v2c1.5-1.5 3-1.5 4.5 0s3 1.5 4.5 0 3-1.5 4.5 0 3 1.5 4.5 0v-2zM4 15l2-4h5V8h4l5 7H4z',

  // Flexed bicep/muscle arm
  rank_iron: 'M5 19l1.5-5L8 11l2-3 3-2h2l1 2-1 3-2 3h4l2 1v2l-3 2H5z',

  // Trophy cup
  rank_champion: 'M7 4h10v2c0 3-2 5.5-5 6v2h6v-2a4 4 0 0 0-4-4V4h1V2H7v2h1v2a4 4 0 0 0-4 4v2h6V8C7.5 7.5 7 6 7 6V4zm-3 4h2c0 1.1.9 2 2 2H6a2 2 0 0 1-2-2zm12 0c0 1.1.9 2 2 2h-2a2 2 0 0 0 2-2zM8 16h8v1H8v-1zm-1 2h10a1 1 0 0 1 1 1v1H6v-1a1 1 0 0 1 1-1z',

  // Crown
  rank_legend: 'M2 18l3-10 4 5 3-8 3 8 4-5 3 10H2zm2 1h16v2H4v-2z',

  // Trident
  rank_mythical: (color) => (
    <>
      <path d="M12 2v20M8 2v5l4 3 4-3V2M6 6l6 5 6-5" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M11 22h2v-8h-2v8zm-3-18h1v4l3 2.25V7L8 4zm6 0h1l-3 3v3.25L15 8V4z" fill={color} />
    </>
  ),

  // ============================================================
  // UI ICONS
  // ============================================================

  // Camera
  ui_camera: 'M12 15a3 3 0 1 0 0-6 3 3 0 0 0 0 6zm8-8h-3.2L15 5H9L7.2 7H4a2 2 0 0 0-2 2v9a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2V9a2 2 0 0 0-2-2z',

  // Image/photo frame
  ui_gallery: 'M21 3H3a1 1 0 0 0-1 1v16a1 1 0 0 0 1 1h18a1 1 0 0 0 1-1V4a1 1 0 0 0-1-1zM4 19l4-5 2 2 4-5 6 8H4zm14-8a2 2 0 1 1 0-4 2 2 0 0 1 0 4z',

  // Share/export arrow
  ui_share: 'M18 8a3 3 0 1 0-2.18-5.06L8.56 7.44a3 3 0 1 0 0 9.12l7.26 4.5a3 3 0 1 0 1.04-1.72l-7.26-4.5a3.07 3.07 0 0 0 0-1.68l7.26-4.5A3 3 0 0 0 18 8z',

  // Shield (admin)
  ui_shield: 'M12 2L4 6v5c0 5.25 3.4 10.15 8 11.25C16.6 21.15 20 16.25 20 11V6l-8-4z',

  // Notification bell
  ui_bell: 'M12 22c1.1 0 2-.9 2-2h-4c0 1.1.9 2 2 2zm6-6V11c0-3.07-1.63-5.64-4.5-6.32V4a1.5 1.5 0 1 0-3 0v.68C7.63 5.36 6 7.92 6 11v5l-2 2v1h16v-1l-2-2z',

  // Info circle (i)
  ui_info: 'M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 15h-2v-6h2v6zm0-8h-2V7h2v2z',

  // Gear/cog
  ui_settings: 'M19.14 12.94a7.07 7.07 0 0 0 .06-.94c0-.32-.02-.64-.07-.94l2.03-1.58a.49.49 0 0 0 .12-.61l-1.92-3.32a.49.49 0 0 0-.59-.22l-2.39.96a7.04 7.04 0 0 0-1.62-.94l-.36-2.54a.48.48 0 0 0-.48-.41h-3.84a.48.48 0 0 0-.48.41l-.36 2.54c-.59.24-1.13.57-1.62.94L5.17 5.33a.48.48 0 0 0-.59.22L2.66 8.87a.48.48 0 0 0 .12.61l2.03 1.58c-.05.3-.07.63-.07.94s.02.64.07.94L2.78 14.52a.49.49 0 0 0-.12.61l1.92 3.32c.12.22.37.29.59.22l2.39-.96c.5.38 1.03.7 1.62.94l.36 2.54c.05.24.26.41.48.41h3.84c.24 0 .44-.17.48-.41l.36-2.54c.59-.24 1.13-.56 1.62-.94l2.39.96c.22.08.47 0 .59-.22l1.92-3.32a.49.49 0 0 0-.12-.61l-2.03-1.58zM12 15.6A3.6 3.6 0 1 1 12 8.4a3.6 3.6 0 0 1 0 7.2z',

  // Ruler/measuring
  ui_meters: 'M3 5v14h18V5H3zm16 12H5V7h14v10zM7 13h2v-2H7v2zm4 0h2v-2h-2v2zm4 0h2v-2h-2v2zm-8-4h2V7H7v2zm8 0h2V7h-2v2z',

  // Stopwatch/timer
  ui_timer: 'M15 1H9v2h6V1zm-4 13h2V8h-2v6zm8.03-6.61l1.42-1.42A10.9 10.9 0 0 0 18 3.91l-1.42 1.42A8.96 8.96 0 0 0 12 4a9 9 0 1 0 9 9c0-2.12-.74-4.07-1.97-5.61zM12 20a7 7 0 1 1 0-14 7 7 0 0 1 0 14z',

  // Flame (streak)
  ui_fire: 'M12 23c-4.97 0-7-3.58-7-7 0-3.5 2.5-6.5 4-8 0 3 1.5 5 3.5 5.5-.5-2-1-4.5.5-7.5 1 2 2 3 3 3.5-.5-2 0-4 1-6 1 2.5 2 5 2 8 0 3.42-2.03 7-7 11.5z',

  // Trophy
  ui_trophy: 'M19 5h-2V3H7v2H5c-1.1 0-2 .9-2 2v1c0 2.55 1.92 4.63 4.39 4.94A5.01 5.01 0 0 0 11 15.9V18H8v2h8v-2h-3v-2.1a5.01 5.01 0 0 0 3.61-2.96C19.08 12.63 21 10.55 21 8V7c0-1.1-.9-2-2-2zM5 8V7h2v3.82C5.84 10.4 5 9.3 5 8zm14 0c0 1.3-.84 2.4-2 2.82V7h2v1z',

  // Medal/award
  ui_medal: 'M12 2l2.4 4.8L20 7.6l-4 3.9.9 5.5L12 14.4 7.1 17l.9-5.5-4-3.9 5.6-.8L12 2z',

  // Bar chart/stats
  ui_chart: 'M5 20h14v2H5v-2zm2-8h2v7H7v-7zm4-4h2v11h-2V8zm4-4h2v15h-2V4z',

  // Megaphone/announcement
  ui_feed: 'M18 11v2h4v-2h-4zm-2 6.61c.96.71 2.21 1.65 3.2 2.39.49-.67 1-1.34 1.48-2.01-.99-.74-2.24-1.68-3.2-2.4l-1.48 2.02zM20.4 4.34l-1.48-2.01c-.99.73-2.24 1.68-3.2 2.4l1.48 2.01c.96-.72 2.21-1.66 3.2-2.4zM4 9c-1.1 0-2 .9-2 2v2c0 1.1.9 2 2 2h1l5 4V5L5 9H4z',

  // Upload arrow
  ui_upload: 'M9 16h6v-6h4l-7-7-7 7h4v6zm-4 4h14v2H5v-2z',

  // Trending up line
  ui_streak: 'M16 6l2.29 2.29-4.88 4.88-4-4L2 16.59 3.41 18l6-6 4 4 6.3-6.29L22 12V6h-6z',

  // Bullseye/target
  ui_target: 'M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 18c-4.42 0-8-3.58-8-8s3.58-8 8-8 8 3.58 8 8-3.58 8-8 8zm0-14c-3.31 0-6 2.69-6 6s2.69 6 6 6 6-2.69 6-6-2.69-6-6-6zm0 10c-2.21 0-4-1.79-4-4s1.79-4 4-4 4 1.79 4 4-1.79 4-4 4zm0-6a2 2 0 1 0 0 4 2 2 0 0 0 0-4z',

  // Star
  ui_star: 'M12 2l3.09 6.26L22 9.27l-5 4.87L18.18 22 12 18.27 5.82 22 7 14.14 2 9.27l6.91-1.01L12 2z',

  // Lightning bolt
  ui_bolt: 'M7 2v11h3v9l7-12h-4l4-8H7z',

  // Calendar
  ui_calendar: 'M19 3h-1V1h-2v2H8V1H6v2H5a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V5a2 2 0 0 0-2-2zm0 16H5V9h14v10zm0-12H5V5h14v2z',

  // Clock face
  ui_clock: 'M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 18c-4.42 0-8-3.58-8-8s3.58-8 8-8 8 3.58 8 8-3.58 8-8 8zm.5-13H11v6l5.25 3.15.75-1.23-4.5-2.67V7z',

  // Globe/earth
  ui_globe: 'M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-1 17.93c-3.95-.49-7-3.85-7-7.93 0-.62.08-1.22.21-1.79L9 15v1c0 1.1.9 2 2 2v1.93zm6.9-2.54c-.26-.81-1-1.39-1.9-1.39h-1v-3c0-.55-.45-1-1-1H8v-2h2c.55 0 1-.45 1-1V7h2c1.1 0 2-.9 2-2v-.41c2.93 1.19 5 4.06 5 7.41 0 2.08-.8 3.97-2.1 5.39z',

  // Map pin/location
  ui_pin: 'M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5a2.5 2.5 0 1 1 0-5 2.5 2.5 0 0 1 0 5z',

  // Rowing person/oar
  ui_rowing: (color) => (
    <>
      <circle cx="12" cy="4" r="2" fill={color} />
      <path d="M22 22l-5-5-3 1-4-4-5 3 1 2 4-2.5 3.5 3.5-2 1 5 5 1.5-1.5L15 17l2-1 3.5 3.5L22 22zM9 10l-2 4h4l1-2-3-2z" fill={color} />
    </>
  ),

  // Robot face (AI)
  ui_robot: 'M12 2a2 2 0 0 1 2 2h2a3 3 0 0 1 3 3v3a1 1 0 0 1 1 1v2a1 1 0 0 1-1 1v2a3 3 0 0 1-3 3h-2v2h-4v-2H8a3 3 0 0 1-3-3v-2a1 1 0 0 1-1-1v-2a1 1 0 0 1 1-1V7a3 3 0 0 1 3-3h2a2 2 0 0 1 2-2zm-3 8a1.5 1.5 0 1 0 0 3 1.5 1.5 0 0 0 0-3zm6 0a1.5 1.5 0 1 0 0 3 1.5 1.5 0 0 0 0-3zm-5 5h4v1h-4v-1z',

  // Sparkle/magic
  ui_sparkle: 'M12 2l1.5 5.5L19 9l-5.5 1.5L12 16l-1.5-5.5L5 9l5.5-1.5L12 2zm6 12l1 3 3 1-3 1-1 3-1-3-3-1 3-1 1-3zM5 16l.75 2.25L8 19l-2.25.75L5 22l-.75-2.25L2 19l2.25-.75L5 16z',

  // Small crown
  ui_crown: 'M2 17l3-10 4 5 3-7 3 7 4-5 3 10H2zm2 1h16v2H4v-2z',

  // Checkmark
  ui_check: 'M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41L9 16.17z',

  // Hourglass
  ui_pending: 'M6 2v6h.01L6 8.01 10 12 6 16l.01.01H6V22h12v-5.99h-.01L18 16l-4-4 4-3.99-.01-.01H18V2H6zm10 14.5V20H8v-3.5l4-4 4 4zm-4-5l-4-4V4h8v3.5l-4 4z',

  // X mark
  ui_unverified: 'M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12 19 6.41z',

  // Warning triangle
  ui_warning: 'M1 21h22L12 2 1 21zm12-3h-2v-2h2v2zm0-4h-2v-4h2v4z',

  // Check circle
  ui_success: 'M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z',

  // Info circle (duplicate alias)
  ui_info_circle: 'M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 15h-2v-6h2v6zm0-8h-2V7h2v2z',

  // Gift box
  ui_gift: 'M20 6h-2.18c.11-.31.18-.65.18-1a3 3 0 0 0-3-3c-1.05 0-1.95.54-2.47 1.35L12 4l-.53-.65A2.97 2.97 0 0 0 9 2a3 3 0 0 0-3 3c0 .35.07.69.18 1H4c-1.11 0-1.99.89-1.99 2L2 20a2 2 0 0 0 2 2h16c1.1 0 2-.9 2-2V8a2 2 0 0 0-2-2zm-5-2c.55 0 1 .45 1 1s-.45 1-1 1-1-.45-1-1 .45-1 1-1zM9 4c.55 0 1 .45 1 1s-.45 1-1 1-1-.45-1-1 .45-1 1-1zm11 16H4v-2h16v2zm0-5H4V8h5.08L7 10.83 8.62 12 12 7.4l3.38 4.6L17 10.83 14.92 8H20v7z',

  // Refresh arrows
  ui_refresh: 'M17.65 6.35A7.96 7.96 0 0 0 12 4c-4.42 0-7.99 3.58-7.99 8s3.57 8 7.99 8c3.73 0 6.84-2.55 7.73-6h-2.08A5.99 5.99 0 0 1 12 18c-3.31 0-6-2.69-6-6s2.69-6 6-6c1.66 0 3.14.69 4.22 1.78L13 11h7V4l-2.35 2.35z',

  // Celebration/party
  ui_celebrate: 'M2 22l1-6 4.5 4.5L2 22zm7.5-3.5L5 14l9-9 4.5 4.5-9 9zm7-12L14 4l1-1c1-1 3-1 4 0l1 1c1 1 1 3 0 4l-1 1-2.5-2.5zM19 15l2 2-2 2M15 19l2 2-2 2',

  // Fireworks/explosion
  ui_fireworks: (color) => (
    <>
      <path d="M12 7V2M12 7l3-3M12 7l-3-3M12 7l4 1M12 7l-4 1M12 7l2 4M12 7l-2 4" fill="none" stroke={color} strokeWidth="1.5" strokeLinecap="round" />
      <circle cx="12" cy="7" r="1.5" fill={color} />
      <circle cx="5" cy="16" r="1" fill={color} />
      <circle cx="19" cy="14" r="1" fill={color} />
      <path d="M5 16l-2-2M5 16l-2 1M5 16l1-2M19 14l2-1M19 14l1 2M19 14l-1-2" fill="none" stroke={color} strokeWidth="1.5" strokeLinecap="round" />
    </>
  ),

  // Rocket
  ui_rocket: 'M12 2c-2 4-2 8-1 10l-3 2-2 4 4-2 2-3c2 1 6 1 10-1C18 8 14 4 12 2zm1 10a2 2 0 1 1 0-4 2 2 0 0 1 0 4zM5 18l1.5-1.5L5 18zm1-3l-2 4 4-2-2-2z',

  // Police car/siren light
  ui_police: (color) => (
    <>
      <path d="M20 13H4l1.5-5h13L20 13zm-1 5a1.5 1.5 0 1 0 0-3 1.5 1.5 0 0 0 0 3zM5 18a1.5 1.5 0 1 0 0-3 1.5 1.5 0 0 0 0 3z" fill={color} />
      <path d="M3 13v5a1 1 0 0 0 1 1h1.5a1 1 0 0 0 0-2H4v-4h16v4h-.5a1 1 0 0 0 0 2H20a1 1 0 0 0 1-1v-5H3z" fill={color} />
      <rect x="10" y="4" width="4" height="4" rx="1" fill={color} />
      <path d="M10 6H6l1-2h3v2zm4 0h4l-1-2h-3v2z" fill={color} />
    </>
  ),

  // Person/user
  ui_user: 'M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z',

  // Group of people
  ui_users: 'M16 11c1.66 0 2.99-1.34 2.99-3S17.66 5 16 5c-1.66 0-3 1.34-3 3s1.34 3 3 3zm-8 0c1.66 0 2.99-1.34 2.99-3S9.66 5 8 5C6.34 5 5 6.34 5 8s1.34 3 3 3zm0 2c-2.33 0-7 1.17-7 3.5V19h14v-2.5c0-2.33-4.67-3.5-7-3.5zm8 0c-.29 0-.62.02-.97.05 1.16.84 1.97 1.97 1.97 3.45V19h6v-2.5c0-2.33-4.67-3.5-7-3.5z',

  // Clock with arrow (history)
  ui_history: 'M13 3a9 9 0 0 0-9 9H1l3.89 3.89.07.14L9 12H6c0-3.87 3.13-7 7-7s7 3.13 7 7-3.13 7-7 7a6.98 6.98 0 0 1-4.95-2.05l-1.41 1.41A8.96 8.96 0 0 0 13 21a9 9 0 0 0 0-18zm-1 5v5l4.28 2.54.72-1.21-3.5-2.08V8H12z',

  // Logout/door
  ui_signout: 'M17 7l-1.41 1.41L18.17 11H8v2h10.17l-2.58 2.58L17 17l5-5-5-5zM4 5h8V3H4c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h8v-2H4V5z',

  // Chain link
  ui_link: 'M3.9 12c0-1.71 1.39-3.1 3.1-3.1h4V7H7c-2.76 0-5 2.24-5 5s2.24 5 5 5h4v-1.9H7c-1.71 0-3.1-1.39-3.1-3.1zM8 13h8v-2H8v2zm9-6h-4v1.9h4c1.71 0 3.1 1.39 3.1 3.1s-1.39 3.1-3.1 3.1h-4V17h4c2.76 0 5-2.24 5-5s-2.24-5-5-5z',

  // Plus in circle
  ui_plus: 'M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm5 11h-4v4h-2v-4H7v-2h4V7h2v4h4v2z',

  // Gold medal (1st)
  ui_gold: 'M12 2l3 6h6l-5 4 2 6-6-4-6 4 2-6-5-4h6l3-6zm-1 14h2v6h-2v-6z',

  // Silver medal (2nd)
  ui_silver: 'M12 2l2.5 5h5.5l-4.5 3.5 1.5 5.5L12 13l-5 3 1.5-5.5L4 7h5.5L12 2zm-1 14h2v6h-2v-6z',

  // Bronze medal (3rd)
  ui_bronze: 'M12 2l2 4.5h5l-4 3 1.5 5L12 11.5 7.5 14.5l1.5-5-4-3h5L12 2zm-1 14h2v6h-2v-6z',

  // Stopwatch with star (records)
  ui_records: (color) => (
    <>
      <path d="M15 1H9v2h6V1zm-4 13h2V8h-2v6zm8.03-6.61l1.42-1.42A10.9 10.9 0 0 0 18 3.91l-1.42 1.42A8.96 8.96 0 0 0 12 4a9 9 0 1 0 9 9c0-2.12-.74-4.07-1.97-5.61zM12 20a7 7 0 1 1 0-14 7 7 0 0 1 0 14z" fill={color} />
      <path d="M12 8l1 2.5 2.5.5-2 1.5.5 2.5-2-1.5-2 1.5.5-2.5-2-1.5 2.5-.5L12 8z" fill={color} />
    </>
  ),

  // ============================================================
  // ACHIEVEMENT ICONS
  // ============================================================

  // Celebration/party popper
  achievement_first_strokes: 'M2 22l1-6 4.5 4.5L2 22zm7.5-3.5L5 14l9-9 4.5 4.5-9 9zm7-12L14 4l1-1c1-1 3-1 4 0l1 1c1 1 1 3 0 4l-1 1-2.5-2.5z',

  // Flexed arm
  achievement_getting_serious: 'M5 19l1.5-5L8 11l2-3 3-2h2l1 2-1 3-2 3h4l2 1v2l-3 2H5z',

  // Medal
  achievement_dedicated: 'M12 2l3.09 6.26L22 9.27l-5 4.87L18.18 22 12 18.27 5.82 22 7 14.14 2 9.27l6.91-1.01L12 2z',

  // 100 badge
  achievement_centurion: (color) => (
    <>
      <rect x="2" y="6" width="20" height="12" rx="3" fill={color} />
      <path d="M6 10h1v5H6v-5zm3 0c1.1 0 2 .9 2 2v1c0 1.1-.9 2-2 2s-2-.9-2-2v-1c0-1.1.9-2 2-2zm0 1a1 1 0 0 0-1 1v1a1 1 0 0 0 2 0v-1a1 1 0 0 0-1-1zm4 -1c1.1 0 2 .9 2 2v1c0 1.1-.9 2-2 2s-2-.9-2-2v-1c0-1.1.9-2 2-2zm0 1a1 1 0 0 0-1 1v1a1 1 0 0 0 2 0v-1a1 1 0 0 0-1-1z" fill="rgba(0,0,0,0.6)" />
    </>
  ),

  // Target/bullseye
  achievement_5k: 'M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 18c-4.42 0-8-3.58-8-8s3.58-8 8-8 8 3.58 8 8-3.58 8-8 8zm0-14c-3.31 0-6 2.69-6 6s2.69 6 6 6 6-2.69 6-6-2.69-6-6-6zm0 10c-2.21 0-4-1.79-4-4s1.79-4 4-4 4 1.79 4 4-1.79 4-4 4zm0-6a2 2 0 1 0 0 4 2 2 0 0 0 0-4z',

  // Flame
  achievement_10k: 'M12 23c-4.97 0-7-3.58-7-7 0-3.5 2.5-6.5 4-8 0 3 1.5 5 3.5 5.5-.5-2-1-4.5.5-7.5 1 2 2 3 3 3.5-.5-2 0-4 1-6 1 2.5 2 5 2 8 0 3.42-2.03 7-7 11.5z',

  // Running person
  achievement_half_marathon: 'M13.5 5.5a2 2 0 1 0 0-4 2 2 0 0 0 0 4zM9.8 8.9L7 23h2.1l1.8-8 2.1 2v6h2v-7.5l-2.1-2 .6-3A7.3 7.3 0 0 0 19 13v-2c-1.9 0-3.5-1-4.3-2.4l-1-1.6a2 2 0 0 0-1.7-1c-.3 0-.5.1-.8.1L7 8.3V13h2V9.6l.8-.7z',

  // Running person with flag
  achievement_marathon: (color) => (
    <>
      <path d="M13.5 5.5a2 2 0 1 0 0-4 2 2 0 0 0 0 4zM9.8 8.9L7 23h2.1l1.8-8 2.1 2v6h2v-7.5l-2.1-2 .6-3A7.3 7.3 0 0 0 19 13v-2c-1.9 0-3.5-1-4.3-2.4l-1-1.6a2 2 0 0 0-1.7-1c-.3 0-.5.1-.8.1L7 8.3V13h2V9.6l.8-.7z" fill={color} />
      <path d="M18 3h-3v5h3l1-2.5L18 3z" fill={color} />
    </>
  ),

  // Star
  achievement_100k: 'M12 2l3.09 6.26L22 9.27l-5 4.87L18.18 22 12 18.27 5.82 22 7 14.14 2 9.27l6.91-1.01L12 2z',

  // Sparkle star
  achievement_250k: 'M12 2l1.5 5.5L19 9l-5.5 1.5L12 16l-1.5-5.5L5 9l5.5-1.5L12 2zm6 12l1 3 3 1-3 1-1 3-1-3-3-1 3-1 1-3z',

  // Superhero cape
  achievement_half_million: 'M12 2a3 3 0 0 1 3 3v1h2l1 4-4 2v3l4 6H6l4-6v-3L6 10l1-4h2V5a3 3 0 0 1 3-3z',

  // Diamond/gem
  achievement_million: 'M6 3l-4 7 10 12L22 10l-4-7H6zm1.5 1h9l3 5.5L12 20 4.5 9.5l3-5.5z',

  // Lightning bolt
  achievement_power_hour: 'M7 2v11h3v9l7-12h-4l4-8H7z',

  // Lion face
  achievement_beast_mode: (color) => (
    <>
      <path d="M12 2C7 2 4 5 3 8c2-1 4-1 5 0-2 0-3 2-3 4s2 5 7 5 7-3 7-5-1-4-3-4c1-1 3-1 5 0-1-3-4-6-9-6z" fill={color} />
      <circle cx="9.5" cy="11" r="1" fill="rgba(0,0,0,0.5)" />
      <circle cx="14.5" cy="11" r="1" fill="rgba(0,0,0,0.5)" />
      <path d="M10 14h4l-2 2-2-2z" fill="rgba(0,0,0,0.5)" />
    </>
  ),

  // Top hat
  achievement_hat_trick: 'M7 14v2c0 1 2 2 5 2s5-1 5-2v-2H7zM7 12h10v2H7v-2zM9 4h6v8H9V4z',

  // Calendar check
  achievement_week_warrior: (color) => (
    <>
      <path d="M19 3h-1V1h-2v2H8V1H6v2H5a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V5a2 2 0 0 0-2-2zm0 16H5V9h14v10z" fill={color} />
      <path d="M10.5 16.5l-3-3 1.4-1.4 1.6 1.6 4.6-4.6 1.4 1.4-6 6z" fill={color} />
    </>
  ),

  // Double flame
  achievement_fortnight: (color) => (
    <>
      <path d="M8 22c-3 0-5-2.5-5-5 0-2.5 1.8-4.5 3-5.5 0 2 1 3.5 2.5 4-.4-1.5-.7-3 .5-5.5.7 1.5 1.5 2 2 2.5-.3-1.5 0-3 .7-4.5.7 2 1.5 3.5 1.3 5.5 0 2.5-1.5 5-5 8.5z" fill={color} />
      <path d="M16 21c-2.5 0-4-2-4-4 0-2 1.5-3.5 2.5-4.5 0 1.5.8 3 2 3.5-.3-1.2-.5-2.5.3-4.5.6 1.2 1.2 1.8 1.6 2-.2-1.2 0-2.5.6-3.5.6 1.5 1 3 1 4.5 0 2-1.3 4-4 6.5z" fill={color} />
    </>
  ),

  // Glowing star
  achievement_monthly_master: (color) => (
    <>
      <path d="M12 2l3.09 6.26L22 9.27l-5 4.87L18.18 22 12 18.27 5.82 22 7 14.14 2 9.27l6.91-1.01L12 2z" fill={color} />
      <path d="M12 6l1.8 3.6 4 .6-2.9 2.8.7 4-3.6-1.9-3.6 1.9.7-4-2.9-2.8 4-.6L12 6z" fill={color} opacity="0.6" />
    </>
  ),

  // Double fire
  achievement_60_day: (color) => (
    <>
      <path d="M9 22c-3.5 0-5-2.5-5-5 0-3 2-5.5 3.5-7 0 2.5 1 4 3 4.5-.5-1.5-.5-3.5.5-6 .8 1.5 1.5 2.5 2.5 3-.5-1.5 0-3.5 1-5 .8 2 1.5 4.5 1.5 7 0 3-1.5 5.5-7 8.5z" fill={color} />
      <path d="M17 20c-2 0-3-1.5-3-3.5 0-2 1.2-3 2-4 0 1.5.6 2.5 1.5 3-.3-1 0-2 .5-3.5.5 1.5 1 3 1 4.5 0 1.5-1 3.5-2 3.5z" fill={color} opacity="0.8" />
    </>
  ),

  // 100 + fire
  achievement_century_streak: (color) => (
    <>
      <path d="M12 20c-3 0-4.5-2-4.5-4.5 0-2.5 2-4.5 3-5.5 0 2 1 3 2 3.5-.3-1-.5-2.5.5-4.5.5 1 1 2 1.5 2.5-.3-1 0-2.5.5-3.5.5 1.5 1 3 1 5 0 2.5-1.5 4.5-4 7z" fill={color} />
      <path d="M4 7h1.5v4H4V7zm2.5 0a2 2 0 0 1 2 2v0a2 2 0 0 1-2 2 2 2 0 0 1-2-2v0a2 2 0 0 1 2-2zm0 1a1 1 0 0 0-1 1v0a1 1 0 0 0 2 0v0a1 1 0 0 0-1-1zm3.5-1a2 2 0 0 1 2 2v0a2 2 0 0 1-2 2 2 2 0 0 1-2-2v0a2 2 0 0 1 2-2zm0 1a1 1 0 0 0-1 1v0a1 1 0 0 0 2 0v0a1 1 0 0 0-1-1z" fill={color} />
    </>
  ),

  // Sunrise
  achievement_early_bird: (color) => (
    <>
      <path d="M12 7V3M5.64 8.64L3.51 6.51M18.36 8.64l2.13-2.13M3 14h3M18 14h3M12 14a4 4 0 0 1 4 4H8a4 4 0 0 1 4-4z" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" />
      <path d="M2 20h20v2H2v-2z" fill={color} />
    </>
  ),

  // Owl/moon
  achievement_night_owl: (color) => (
    <>
      <path d="M12 3c-1 0-4 1-5 4-2 0-3 2-3 4 0 3 2 6 4 7v2h2v-1.5c.6.3 1.3.5 2 .5s1.4-.2 2-.5V20h2v-2c2-1 4-4 4-7 0-2-1-4-3-4-1-3-4-4-5-4z" fill={color} />
      <circle cx="9" cy="11" r="2.5" fill="rgba(0,0,0,0.4)" />
      <circle cx="15" cy="11" r="2.5" fill="rgba(0,0,0,0.4)" />
      <circle cx="9" cy="11" r="1.2" fill={color} />
      <circle cx="15" cy="11" r="1.2" fill={color} />
      <path d="M11 14.5l1 1 1-1" fill="none" stroke="rgba(0,0,0,0.4)" strokeWidth="1" />
    </>
  ),

  // Fork and knife
  achievement_lunch_legend: (color) => (
    <>
      <path d="M11 2v7a3 3 0 0 1-2 2.83V22H7V11.83A3 3 0 0 1 5 9V2h1.5v5.5h1V2H9v5.5h1V2h1z" fill={color} />
      <path d="M16 2c-1.5 0-3 1.34-3 4v3c0 1.3.84 2.4 2 2.82V22h2V11.82c1.16-.42 2-1.52 2-2.82V6c0-2.66-1.5-4-3-4z" fill={color} />
    </>
  ),

  // Crown (consistency)
  achievement_consistency: 'M2 17l3-10 4 5 3-7 3 7 4-5 3 10H2zm2 1h16v2H4v-2z',

  // Peace sign/two fingers
  achievement_double_trouble: (color) => (
    <>
      <path d="M9 3a1.5 1.5 0 0 1 1.5 1.5V11h1V4a1.5 1.5 0 0 1 3 0v7h1V6a1.5 1.5 0 0 1 3 0v8c0 4-2.5 7-6.5 7S5 18 5 14V9.5a1.5 1.5 0 0 1 3 0V11h1V4.5A1.5 1.5 0 0 1 9 3z" fill={color} />
    </>
  ),

  // Rainbow arc
  achievement_perfect_week: (color) => (
    <>
      <path d="M4 18a8 8 0 0 1 16 0h-2.5a5.5 5.5 0 0 0-11 0H4z" fill={color} />
      <path d="M7 18a5 5 0 0 1 10 0h-2.5a2.5 2.5 0 0 0-5 0H7z" fill={color} opacity="0.6" />
    </>
  ),

  // Party/celebration
  achievement_weekend_warrior: 'M2 22l1-6 4.5 4.5L2 22zm7.5-3.5L5 14l9-9 4.5 4.5-9 9zm7-12L14 4l1-1c1-1 3-1 4 0l1 1c1 1 1 3 0 4l-1 1-2.5-2.5z',

  // Military badge
  achievement_veteran: 'M12 2l3 4h4v4l3 3-3 3v4h-4l-3 4-3-4H5v-4l-3-3 3-3V6h4l3-4zm0 6a4 4 0 1 0 0 8 4 4 0 0 0 0-8z',

  // Triple target
  achievement_triple_threat: (color) => (
    <>
      <circle cx="7" cy="14" r="4" fill={color} opacity="0.5" />
      <circle cx="17" cy="14" r="4" fill={color} opacity="0.5" />
      <circle cx="12" cy="9" r="4" fill={color} />
      <circle cx="12" cy="9" r="1.5" fill="rgba(0,0,0,0.4)" />
    </>
  ),

  // Crown (weekly champion)
  achievement_weekly_champion: 'M2 17l3-10 4 5 3-7 3 7 4-5 3 10H2zm2 1h16v2H4v-2z',

  // Trophy
  achievement_triple_crown: 'M19 5h-2V3H7v2H5c-1.1 0-2 .9-2 2v1c0 2.55 1.92 4.63 4.39 4.94A5.01 5.01 0 0 0 11 15.9V18H8v2h8v-2h-3v-2.1a5.01 5.01 0 0 0 3.61-2.96C19.08 12.63 21 10.55 21 8V7c0-1.1-.9-2-2-2zM5 8V7h2v3.82C5.84 10.4 5 9.3 5 8zm14 0c0 1.3-.84 2.4-2 2.82V7h2v1z',

  // Diamond
  achievement_dynasty: 'M12 2l-4 7 4 13 4-13-4-7zm-5 7l5-6-3 6H7zm10 0h-2l-3-6 5 6z',

  // Stopwatch
  achievement_first_hour: 'M15 1H9v2h6V1zm-4 13h2V8h-2v6zm8.03-6.61l1.42-1.42A10.9 10.9 0 0 0 18 3.91l-1.42 1.42A8.96 8.96 0 0 0 12 4a9 9 0 1 0 9 9c0-2.12-.74-4.07-1.97-5.61zM12 20a7 7 0 1 1 0-14 7 7 0 0 1 0 14z',

  // Hourglass
  achievement_time_investor: 'M6 2v6h.01L6 8.01 10 12 6 16l.01.01H6V22h12v-5.99h-.01L18 16l-4-4 4-3.99-.01-.01H18V2H6zm10 14.5V20H8v-3.5l4-4 4 4zm-4-5l-4-4V4h8v3.5l-4 4z',

  // Clock
  achievement_time_lord: 'M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 18c-4.42 0-8-3.58-8-8s3.58-8 8-8 8 3.58 8 8-3.58 8-8 8zm.5-13H11v6l5.25 3.15.75-1.23-4.5-2.67V7z',

  // Sparkle
  achievement_century_timer: 'M12 2l1.5 5.5L19 9l-5.5 1.5L12 16l-1.5-5.5L5 9l5.5-1.5L12 2zm6 12l1 3 3 1-3 1-1 3-1-3-3-1 3-1 1-3z',

  // Target
  achievement_half_hour_hero: 'M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 18c-4.42 0-8-3.58-8-8s3.58-8 8-8 8 3.58 8 8-3.58 8-8 8zm0-14c-3.31 0-6 2.69-6 6s2.69 6 6 6 6-2.69 6-6-2.69-6-6-6zm0 10c-2.21 0-4-1.79-4-4s1.79-4 4-4 4 1.79 4 4-1.79 4-4 4zm0-6a2 2 0 1 0 0 4 2 2 0 0 0 0-4z',

  // Muscle arm
  achievement_hour_power: 'M5 19l1.5-5L8 11l2-3 3-2h2l1 2-1 3-2 3h4l2 1v2l-3 2H5z',

  // Small flame
  achievement_calorie_crusher: 'M12 21c-3.5 0-5-2.5-5-5 0-2.5 1.8-4.5 3-5.5 0 2 1 3.5 2.5 4-.4-1.5-.7-3 .5-5.5.7 1.5 1.5 2 2 2.5-.3-1.5 0-3 .7-4 .7 1.5 1.3 3.5 1.3 5 0 2.5-1.5 5-5 8.5z',

  // Pizza slice
  achievement_pizza_burner: 'M12 2C8.5 2 5.5 4 4 7l8 15 8-15c-1.5-3-4.5-5-8-5zm0 3c2 0 3.8.9 5 2.3L12 17 7 7.3A6 6 0 0 1 12 5zm0 3a2 2 0 1 0 0 4 2 2 0 0 0 0-4z',

  // Volcano
  achievement_furnace: 'M12 2l-2 5h-1l-5 7h4l-4 8h16l-4-8h4l-5-7h-1L12 2zm0 3l1.5 3.5h1L18 14h-3l3 6H6l3-6H6l3.5-5.5h1L12 5z',

  // Comet
  achievement_inferno: 'M2 10l5-3c1 3 3 5 6 6l-3 5c-4-1-7-4-8-8zm8-6c1-1 3-2 5-2 4 0 7 3 7 7 0 2-1 4-2 5l-3-3a4 4 0 0 0-4-4l-3-3z',

  // Explosion
  achievement_calorie_destroyer: 'M12 2l2 4 4-1-2 4 4 2-4 2 2 4-4-1-2 4-2-4-4 1 2-4-4-2 4-2-2-4 4 1 2-4z',

  // Sweat/heat face
  achievement_big_burn: (color) => (
    <>
      <circle cx="12" cy="12" r="9" fill={color} />
      <circle cx="9" cy="10" r="1.2" fill="rgba(0,0,0,0.5)" />
      <circle cx="15" cy="10" r="1.2" fill="rgba(0,0,0,0.5)" />
      <path d="M8 15c1 1.5 2.5 2 4 2s3-.5 4-2" fill="none" stroke="rgba(0,0,0,0.5)" strokeWidth="1.5" strokeLinecap="round" />
      <path d="M17 7c.5 1 .5 2 0 3-.5-1-.5-2 0-3z" fill="rgba(0,0,0,0.3)" />
    </>
  ),

  // Lightning double
  achievement_speed_demon: (color) => (
    <>
      <path d="M5 2v9h2.5v9l5.5-10H9.5l3-8H5z" fill={color} />
      <path d="M12 2v9h2.5v9l5.5-10h-3.5l3-8H12z" fill={color} opacity="0.7" />
    </>
  ),

  // Bolt with speed lines
  achievement_lightning_pace: (color) => (
    <>
      <path d="M9 2v11h3v9l7-12h-4l4-8H9z" fill={color} />
      <path d="M2 8h4M2 12h3M2 16h4" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" />
    </>
  ),

  // Briefcase
  achievement_nine_to_five: 'M20 7h-4V5c0-1.1-.9-2-2-2h-4c-1.1 0-2 .9-2 2v2H4c-1.1 0-2 .9-2 2v10c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V9c0-1.1-.9-2-2-2zM10 5h4v2h-4V5z',

  // Sunrise mountain
  achievement_dawn_patrol: (color) => (
    <>
      <path d="M12 7V3M8 9l-1-1M16 9l1-1M5 13h14" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" />
      <path d="M2 21l5-8 4 5 3-4 4 3 4-5v9H2z" fill={color} />
    </>
  ),

  // Camel
  achievement_hump_day: 'M4 17v3h2v-2h12v2h2v-3l-2-4V9l-1-2h-2l-1 2v1l-2-1h-2l-2 1V9L8 7H6L5 9v4l-1 4zm6-7c.5-.5 1.5-.5 2 0l1 1h-4l1-1z',

  // Alarm clock
  achievement_creature_habit: (color) => (
    <>
      <path d="M12 4a9 9 0 1 0 0 18 9 9 0 0 0 0-18zm0 16a7 7 0 1 1 0-14 7 7 0 0 1 0 14z" fill={color} />
      <path d="M12.5 8H11v6l4.75 2.85.75-1.23-4-2.37V8z" fill={color} />
      <path d="M7.88 3.39L6.6 1.86 2 5.71l1.29 1.53 4.59-3.85zM22 5.72l-4.6-3.86-1.29 1.53 4.6 3.86L22 5.72z" fill={color} />
    </>
  ),

  // Gold medal star
  achievement_record_breaker: (color) => (
    <>
      <circle cx="12" cy="10" r="8" fill={color} />
      <path d="M12 5l1.5 3 3.5.5-2.5 2.5.5 3.5-3-1.5-3 1.5.5-3.5L7 8.5l3.5-.5L12 5z" fill="rgba(0,0,0,0.3)" />
      <path d="M10 18h4v4h-4v-4z" fill={color} />
    </>
  ),

  // Ascending chart
  achievement_escalation: 'M3 20h18v2H3v-2zm2-4h2v3H5v-3zm4-3h2v6H9v-6zm4-4h2v10h-2V9zm4-5h2v15h-2V4z',

  // Robot arm
  achievement_iron_will: 'M18 4h-2l-2 3v3h-4V7L8 4H6l3 5v2H5v2h4v2l-3 5h2l2-3v-2h4v2l2 3h2l-3-5v-2h4v-2h-4V9l3-5z',

  // Mirror/reverse arrows
  achievement_palindrome: 'M9 4l-4 4 4 4V9h2c2.21 0 4 1.79 4 4s-1.79 4-4 4H9v2h2c3.31 0 6-2.69 6-6s-2.69-6-6-6H9V4zm6 16l4-4-4-4v3h-2a4 4 0 0 1-4-4 4 4 0 0 1 4-4h2V4h-2a6 6 0 0 0-6 6 6 6 0 0 0 6 6h2v3z',

  // Four leaf clover
  achievement_lucky_sevens: 'M12 12c-1-3-4-4-4-7a3 3 0 0 1 6 0c0 3-1 4-2 7zm0 0c3-1 4-4 7-4a3 3 0 0 1 0 6c-3 0-4-1-7-2zm0 0c1 3 4 4 4 7a3 3 0 0 1-6 0c0-3 1-4 2-7zm0 0c-3 1-4 4-7 4a3 3 0 0 1 0-6c3 0 4 1 7 2z',

  // Bullseye
  achievement_round_roller: 'M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 18c-4.42 0-8-3.58-8-8s3.58-8 8-8 8 3.58 8 8-3.58 8-8 8zm0-14c-3.31 0-6 2.69-6 6s2.69 6 6 6 6-2.69 6-6-2.69-6-6-6zm0 10c-2.21 0-4-1.79-4-4s1.79-4 4-4 4 1.79 4 4-1.79 4-4 4zm0-6a2 2 0 1 0 0 4 2 2 0 0 0 0-4z',

  // Coffee cup
  achievement_coffee_powered: 'M18 6h2c1.1 0 2 .9 2 2v2c0 1.1-.9 2-2 2h-2v2c0 1.1-.9 2-2 2H6c-1.1 0-2-.9-2-2V6h14zm0 4h2V8h-2v2zM2 20h20v2H2v-2z',

  // Medal with star
  achievement_ultramarathon: (color) => (
    <>
      <path d="M12 2l2.4 4.8L20 7.6l-4 3.9.9 5.5L12 14.4 7.1 17l.9-5.5-4-3.9 5.6-.8L12 2z" fill={color} />
      <path d="M10 17h4v5l-2-1.5L10 22v-5z" fill={color} />
    </>
  ),

  // Timer with star
  achievement_century_session: (color) => (
    <>
      <path d="M15 1H9v2h6V1zm4.03 6.39l1.42-1.42A10.9 10.9 0 0 0 18 3.91l-1.42 1.42A8.96 8.96 0 0 0 12 4a9 9 0 1 0 9 9c0-2.12-.74-4.07-1.97-5.61zM12 20a7 7 0 1 1 0-14 7 7 0 0 1 0 14z" fill={color} />
      <path d="M12 8l1.2 2.4 2.8.4-2 2 .5 2.7L12 14l-2.5 1.5.5-2.7-2-2 2.8-.4L12 8z" fill={color} />
    </>
  ),

  // Muscle flex
  achievement_big_day: 'M5 19l1.5-5L8 11l2-3 3-2h2l1 2-1 3-2 3h4l2 1v2l-3 2H5z',

  // Sun
  achievement_summer_grind: 'M12 7a5 5 0 1 0 0 10 5 5 0 0 0 0-10zm0-5l1.5 3h-3L12 2zm0 20l-1.5-3h3L12 22zM4.22 5.64l2.12 2.12-1.06 1.06-2.12-2.12 1.06-1.06zm15.56 12.72l-2.12-2.12 1.06-1.06 2.12 2.12-1.06 1.06zM2 12l3 1.5v-3L2 12zm20 0l-3-1.5v3L22 12zM4.22 18.36l1.06-1.06 2.12 2.12-1.06 1.06-2.12-2.12zm15.56-12.72l-1.06 1.06-2.12-2.12 1.06-1.06 2.12 2.12z',

  // Snowflake
  achievement_winter_warrior: 'M12 2v4l-2-2-1.4 1.4L12 8.8l3.4-3.4L14 4l-2 2V2zm0 20v-4l2 2 1.4-1.4L12 15.2l-3.4 3.4L10 20l2-2v4zM2 12h4l-2-2 1.4-1.4L8.8 12l-3.4 3.4L4 14l2-2H2zm20 0h-4l2 2-1.4 1.4L15.2 12l3.4-3.4L20 10l-2 2h4zM5.64 4.22l1.06 1.06-2.12 2.12L3.52 6.34 5.64 4.22zm12.72 15.56l-1.06-1.06 2.12-2.12 1.06 1.06-2.12 2.12zM4.22 18.36l2.12-2.12 1.06 1.06-2.12 2.12-1.06-1.06zm15.56-12.72l-2.12 2.12-1.06-1.06 2.12-2.12 1.06 1.06z',

  // Trophy with star
  achievement_top_10: (color) => (
    <>
      <path d="M19 5h-2V3H7v2H5c-1.1 0-2 .9-2 2v1c0 2.55 1.92 4.63 4.39 4.94A5.01 5.01 0 0 0 11 15.9V18H8v2h8v-2h-3v-2.1a5.01 5.01 0 0 0 3.61-2.96C19.08 12.63 21 10.55 21 8V7c0-1.1-.9-2-2-2z" fill={color} />
      <path d="M12 6l1.2 2.4 2.8.4-2 2 .5 2.6L12 12l-2.5 1.4.5-2.6-2-2 2.8-.4L12 6z" fill="rgba(0,0,0,0.3)" />
    </>
  ),

  // ============================================================
  // MILESTONE ICONS
  // ============================================================

  // Tall building/skyscraper
  milestone_building: 'M5 2h6v20H5V2zm2 2v2h2V4H7zm0 4v2h2V8H7zm0 4v2h2v-2H7zm6-10h6v18h-6V2zm2 2v2h2V4h-2zm0 4v2h2V8h-2zm0 4v2h2v-2h-2z',

  // Football field
  milestone_football: 'M2 6v12h20V6H2zm18 10H4V8h16v8zM7 10v4M12 10v4M17 10v4',

  // Roller coaster loop
  milestone_coaster: 'M2 20c0-6 3-10 6-10 4 0 4 6 8 6 3 0 4-3 6-8M2 20h20',

  // Swimming pool/waves
  milestone_pool: 'M2 8c1.5-1.5 3-1.5 4.5 0s3 1.5 4.5 0 3-1.5 4.5 0 3 1.5 4.5 0M2 13c1.5-1.5 3-1.5 4.5 0s3 1.5 4.5 0 3-1.5 4.5 0 3 1.5 4.5 0M2 18c1.5-1.5 3-1.5 4.5 0s3 1.5 4.5 0 3-1.5 4.5 0 3 1.5 4.5 0',

  // Bridge
  milestone_bridge: 'M2 18h20M4 18c0-4 3.5-8 8-8s8 4 8 8M4 14h16M8 14v4M16 14v4M12 10v4',

  // Pi symbol
  milestone_pi: 'M6 7h12M9 7v13M15 7c0 4-1 9-3 13',

  // Tower (Eiffel-style)
  milestone_tower: 'M12 2l-4 10h2l-3 10h10l-3-10h2L12 2zm0 4l1.5 4h-3L12 6z',

  // Tree
  milestone_park: 'M12 2l-6 8h3l-4 6h4l-3 6h12l-3-6h4l-4-6h3L12 2z',

  // Giraffe
  milestone_giraffe: 'M14 2v6l1 2v3h2v2h-2v7h-2v-7h-2v7H9v-7H7v-2h2v-3l1-3V4l2-2h2z',

  // Airplane
  milestone_plane: 'M21 16v-2l-8-5V3.5a1.5 1.5 0 0 0-3 0V9l-8 5v2l8-2.5V19l-2 1.5V22l3.5-1 3.5 1v-1.5L13 19v-5.5l8 2.5z',

  // Mountain peak
  milestone_mountain: 'M2 20l7-14 3 5 4-7 6 16H2z',

  // TV/screen
  milestone_tv: 'M21 3H3c-1.1 0-2 .9-2 2v12c0 1.1.9 2 2 2h7v2H8v2h8v-2h-2v-2h7c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zm0 14H3V5h18v12z',

  // Cloud
  milestone_cloud: 'M19.35 10.04A7.49 7.49 0 0 0 12 4C9.11 4 6.6 5.64 5.35 8.04A5.99 5.99 0 0 0 0 14c0 3.31 2.69 6 6 6h13c2.76 0 5-2.24 5-5 0-2.64-2.05-4.78-4.65-4.96z',

  // Fish
  milestone_fish: 'M12 6c-4 0-7 2.5-9 6 2 3.5 5 6 9 6 1 0 2-.2 3-.5l3 2.5v-5c1.5-1 2.5-2 3-3-1.5-2-4-4.5-6-5.3V4l-3 2.5c-.3 0-.7-.5-0-.5zM9 12a1.5 1.5 0 1 1 0-3 1.5 1.5 0 0 1 0 3z',

  // Beaver
  milestone_beaver: 'M4 10c0-3 2-6 5-7l1 2c-2 .5-3 2.5-3 5 0 3 2 5 5 5s5-2 5-5c0-2.5-1-4.5-3-5l1-2c3 1 5 4 5 7 0 4-3.5 7-8 7s-8-3-8-7zm4 0a1 1 0 1 0 0-2 1 1 0 0 0 0 2zm7-1a1 1 0 1 0 0-2 1 1 0 0 0 0 2zM9 13h6l-3 3-3-3z',

  // Running person
  milestone_runner: 'M13.5 5.5a2 2 0 1 0 0-4 2 2 0 0 0 0 4zM9.8 8.9L7 23h2.1l1.8-8 2.1 2v6h2v-7.5l-2.1-2 .6-3A7.3 7.3 0 0 0 19 13v-2c-1.9 0-3.5-1-4.3-2.4l-1-1.6a2 2 0 0 0-1.7-1c-.3 0-.5.1-.8.1L7 8.3V13h2V9.6l.8-.7z',

  // Pizza slice
  milestone_pizza: 'M12 2C8.5 2 5.5 4 4 7l8 15 8-15c-1.5-3-4.5-5-8-5zm0 3c2 0 3.8.9 5 2.3L12 17 7 7.3A6 6 0 0 1 12 5z',

  // Train/subway
  milestone_subway: 'M12 2c-4 0-8 1-8 5v9.5C4 18.43 5.57 20 7.5 20L6 22v1h12v-1l-1.5-2c1.93 0 3.5-1.57 3.5-3.5V7c0-4-4-5-8-5zm-4 15a1.5 1.5 0 1 1 0-3 1.5 1.5 0 0 1 0 3zm8 0a1.5 1.5 0 1 1 0-3 1.5 1.5 0 0 1 0 3zm2-7H6V7h12v3z',

  // Guitar
  milestone_guitar: 'M20 2l-2.5 2.5L16 3l-3 3 1.5 1.5L11 11c-2-1-4.5-.5-6 1s-2 4-1 6l-1 3 3-1c2 1 4.5.5 6-1s2-4 1-6l3.5-3.5L18 11l3-3-1.5-1.5L22 4l-2-2z',

  // Beach/palm tree
  milestone_beach: 'M14 6c1.5-2.5 4-4 7-4-1 3-3 5-5 6l2 12H8l2-12C8 7 6 5 5 2c3 0 5.5 1.5 7 4l1-2 1 2z',

  // Medal
  milestone_medal: 'M12 2l2.4 4.8L20 7.6l-4 3.9.9 5.5L12 14.4 7.1 17l.9-5.5-4-3.9 5.6-.8L12 2z',

  // Dinosaur
  milestone_dinosaur: 'M18 4h-2v2h-2V4h-2v3l-1 2H8l-4 4v5h3v-3l2 3h3v-3l2-1v4h3v-5l2-2V8l1-2v-2h-2z',

  // Shopping cart
  milestone_cart: 'M7 18c-1.1 0-2 .9-2 2s.9 2 2 2 2-.9 2-2-.9-2-2-2zm10 0c-1.1 0-2 .9-2 2s.9 2 2 2 2-.9 2-2-.9-2-2-2zM7.16 14.26l.04-.12L8.1 12h7.45c.75 0 1.41-.41 1.75-1.03l3.58-6.49A1 1 0 0 0 20 3H5.21l-.94-2H1v2h2l3.6 7.59-1.35 2.44C4.52 13.9 5.17 15 6.25 15H19v-2H6.25l.91-1.74z',

  // Bowling pins
  milestone_bowling: (color) => (
    <>
      <path d="M9 4a1.5 1.5 0 1 0 0-3 1.5 1.5 0 0 0 0 3zm0 0c-1 0-2 2-2 4s1 4 2 4 2-2 2-4-1-4-2-4z" fill={color} />
      <path d="M15 4a1.5 1.5 0 1 0 0-3 1.5 1.5 0 0 0 0 3zm0 0c-1 0-2 2-2 4s1 4 2 4 2-2 2-4-1-4-2-4z" fill={color} />
      <circle cx="12" cy="18" r="3.5" fill={color} />
    </>
  ),

  // Pasta/noodles
  milestone_pasta: 'M2 8c1 4 4 7 8 8v4h4v-4c4-1 7-4 8-8H2zm10 6c-3 0-5.5-2-6.7-4h13.4c-1.2 2-3.7 4-6.7 4z',

  // Dog
  milestone_dog: 'M18 4l-2 3h-4V5L10 4 8 6v4l-3 1-1 3v4l2 2h3v-3h6v3h3l2-2v-4l-1-3-3-1V5l-2-1h2z',

  // Winking face
  milestone_grin: (color) => (
    <>
      <circle cx="12" cy="12" r="10" fill={color} />
      <circle cx="8" cy="10" r="1.5" fill="rgba(0,0,0,0.5)" />
      <path d="M14 9l3 1.5-3 1.5" fill="none" stroke="rgba(0,0,0,0.5)" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M8 15c1 2 3 3 4 3s3-1 4-3" fill="none" stroke="rgba(0,0,0,0.5)" strokeWidth="1.5" strokeLinecap="round" />
    </>
  ),

  // Castle
  milestone_castle: 'M3 21V10l2 1V8l2 1V6h2v3l2-1v3l2-1v-1l2 1v-3l2-1V6h2v3l2-1v3l2-1v11H3zm4-7v7h4v-7H7zm6 0v7h4v-7h-4z',

  // Shark
  milestone_shark: 'M2 14c2-1 5-3 9-3V8l3 3h7c0 2-2 4-5 4l2 3-4-2c-3 1-7 1-10 0l-2-2z',

  // Train
  milestone_train: 'M12 2c-4 0-8 1-8 5v9.5C4 18.43 5.57 20 7.5 20L6 22v1h12v-1l-1.5-2c1.93 0 3.5-1.57 3.5-3.5V7c0-4-4-5-8-5zm-4 15a1.5 1.5 0 1 1 0-3 1.5 1.5 0 0 1 0 3zm8 0a1.5 1.5 0 1 1 0-3 1.5 1.5 0 0 1 0 3zm2-7H6V7h12v3z',

  // Sailboat
  milestone_sailboat: 'M12 3L6 15h12L12 3zm-8 14c1.5-1 3-1 4.5 0s3 1 4.5 0 3-1 4.5 0 3 1 4.5 0v2c-1.5-1-3-1-4.5 0s-3 1-4.5 0-3-1-4.5 0-3 1-4.5 0v-2z',

  // Ski
  milestone_ski: (color) => (
    <>
      <circle cx="14" cy="4" r="2" fill={color} />
      <path d="M8 22l1-1 6-8-2-2-4 5-3-2L5 16l3 2 2.5-3 1.5 1.5-3 4L8 22z" fill={color} />
      <path d="M18 6l-3 4M6 10l14 8" fill="none" stroke={color} strokeWidth="1.5" strokeLinecap="round" />
    </>
  ),

  // Hot dog
  milestone_hotdog: 'M5.5 16.5a4.5 4.5 0 0 1 0-6.36l4.64-4.64a4.5 4.5 0 0 1 6.36 0l2 2a4.5 4.5 0 0 1 0 6.36l-4.64 4.64a4.5 4.5 0 0 1-6.36 0l-2-2zM9 9l6 6',

  // Snail
  milestone_snail: 'M3 17c0 1.5 1.5 3 3.5 3H18c2.5 0 4-1.5 4-3s-1.5-3-4-3H8l-1-2c-1-2 .5-5 3-5 2 0 3.5 1.5 3.5 3.5S12 13 10 13H8',

  // Banana
  milestone_banana: 'M18 5c-1.5 0-3 1-4 3-1.5 3-3 6-7 7l-1 2c5-1 8-3 10-7 1-2 2-3 3-3l1-2h-2z',

  // Race car
  milestone_racecar: 'M18.9 8c-.5-1.5-1.4-2-2.4-2H7.5c-1 0-1.9.5-2.4 2L3 13v6a1 1 0 0 0 1 1h1a1 1 0 0 0 1-1v-1h12v1a1 1 0 0 0 1 1h1a1 1 0 0 0 1-1v-6l-2.1-5zM6.5 16a1.5 1.5 0 1 1 0-3 1.5 1.5 0 0 1 0 3zm11 0a1.5 1.5 0 1 1 0-3 1.5 1.5 0 0 1 0 3zM5 12l1.5-4.5h11L19 12H5z',

  // Statue of liberty
  milestone_statue: 'M12 2l-1 4h-1l-1-2H8l1 3H8v2h1l-1 4H7v1h10v-1h-1l-1-4h1V8h-1l1-3h-1l-1 2h-1l-1-4-1-1zm0 14H9v6h6v-6h-3z',

  // Forest/trees
  milestone_trees: (color) => (
    <>
      <path d="M8 2l-5 8h3l-3 5h3l-3 5h10l-3-5h3l-3-5h3L8 2z" fill={color} opacity="0.7" />
      <path d="M16 6l-4 6h2.5l-2.5 4h2l-2 4h8l-2-4h2l-2.5-4H20L16 6z" fill={color} />
    </>
  ),

  // Game controller
  milestone_gamepad: 'M21 6H3a2 2 0 0 0-2 2v8a2 2 0 0 0 2 2h18a2 2 0 0 0 2-2V8a2 2 0 0 0-2-2zM7 13H5v-2h2v-2h2v2h2v2H7zm7.5 2a1.5 1.5 0 1 1 0-3 1.5 1.5 0 0 1 0 3zm3-3a1.5 1.5 0 1 1 0-3 1.5 1.5 0 0 1 0 3z',

  // Rocket
  milestone_rocket: 'M12 2c-2 4-2 8-1 10l-3 2-2 4 4-2 2-3c2 1 6 1 10-1C18 8 14 4 12 2zm1 10a2 2 0 1 1 0-4 2 2 0 0 1 0 4z',

  // Leaf/herb
  milestone_leaf: 'M17 8C8 10 5.9 16.17 3.82 21.34l1.89.66c.59-1.5 1.3-3 2.29-4.25C9.5 19.5 12 21 16 21c0-4-2-7.5-4-9.5C15 11 18 9 22 8c-1-4-7-4-5-0z',

  // Cheese wedge
  milestone_cheese: 'M3 20l9-16 9 16H3zm4-2h10l-5-9-5 9zm3 0a1.5 1.5 0 1 1 3 0H10z',

  // Ocean wave
  milestone_wave: 'M2 12c2-4 4-6 6-6s4 4 6 4 4-3 6-6c0 4-1 8-3 10-1.5 1.5-3 2-5 2s-3.5-.5-5-2C4 12 3 10 2 12zm0 5c1.5-1.5 3-1.5 4.5 0s3 1.5 4.5 0 3-1.5 4.5 0 3 1.5 4.5 0v2c-1.5-1.5-3-1.5-4.5 0s-3 1.5-4.5 0-3-1.5-4.5 0-3 1.5-4.5 0v-2z',

  // Hamburger
  milestone_burger: 'M4 18h16a2 2 0 0 0 2-2H2a2 2 0 0 0 2 2zM2 14h20l-1-2H3l-1 2zM4 6a2 2 0 0 0-2 2h20a2 2 0 0 0-2-2H4zm-2 4h20v1H2v-1z',

  // Kangaroo
  milestone_kangaroo: 'M16 3c-1 0-2 1-2 3v3l-3 2-3-1v2l2 1-2 4v3H6v2h3v-2l2-4 1 1v5h2v-6l2 1v5h2v-5l2-3V9c0-2-1-4-3-5l-1-1z',

  // Music notes
  milestone_music: 'M12 3v10.55A4 4 0 1 0 14 17V7h4V3h-6zM10 19a2 2 0 1 1 0-4 2 2 0 0 1 0 4z',

  // Bear
  milestone_bear: (color) => (
    <>
      <circle cx="7" cy="6" r="3" fill={color} />
      <circle cx="17" cy="6" r="3" fill={color} />
      <circle cx="12" cy="13" r="7" fill={color} />
      <circle cx="9.5" cy="11.5" r="1" fill="rgba(0,0,0,0.5)" />
      <circle cx="14.5" cy="11.5" r="1" fill="rgba(0,0,0,0.5)" />
      <path d="M10 15a2 2 0 0 0 4 0" fill="none" stroke="rgba(0,0,0,0.5)" strokeWidth="1" />
    </>
  ),

  // Waffle
  milestone_waffle: 'M4 4h16a2 2 0 0 1 2 2v12a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2zm0 4h16M4 12h16M4 16h16M8 4v16M12 4v16M16 4v16',

  // City skyline
  milestone_city: 'M3 21V11h4V8h2v3h2V5h2v6h2V9h2V6h2v3h2v12H3zm2-2h2v-3H5v3zm4 0h2v-5H9v5zm4 0h2v-7h-2v7zm4 0h2v-4h-2v4z',

  // Whale
  milestone_whale: 'M3 13c0 3 3 6 7 6h4c4 0 7-2 7-5 0-2-1.5-3.5-3-4l1-4-4 3c-1-.5-2-.5-3 0L8 6l1 4c-2 .5-4 2-4 4l-2-1zm6 0a1.5 1.5 0 1 1 0-3 1.5 1.5 0 0 1 0 3z',

  // Desert/cactus
  milestone_desert: 'M12 2v20M9 8H7V6h2V2h6v6h2v2h-2v12M2 22h20',

  // Movie clapperboard
  milestone_movie: 'M18 4l2 4H3l1-4h14zM4 3l-1 2h1l1-2H4zm3 0l-1 2h2l1-2H7zm3 0l-1 2h2l1-2h-2zm3 0l-1 2h2l1-2h-2zm3 0l-1 2h2l1-2h-2zM2 10h20v11a1 1 0 0 1-1 1H3a1 1 0 0 1-1-1V10z',

  // Noodle bowl
  milestone_noodles: 'M3 11h18a1 1 0 0 1 1 1c0 5-4.03 9-9 9h-2C6.03 21 2 17 2 12a1 1 0 0 1 1-1zm2-5c1 2 3 3 5 3M14 6c-1 2-3 3-5 3M17 4c-1 3-3 5-5 5',

  // Eagle/bird
  milestone_eagle: 'M3 10l3-2 2-4 2 3 3-1 2 2h4l3-3v4l-3 3-1 3-3-1-2 3-2-2-3 1-2-3L3 10z',

  // Football
  milestone_americanfootball: 'M6.41 6.41a9.5 9.5 0 0 1 13.44 0c-1.34 5.36-5.04 9.06-10.4 10.4a9.5 9.5 0 0 1-3.04-10.4zM4 4c-.54.54-1 1.12-1.4 1.74a11.5 11.5 0 0 0 15.66 15.66A11.5 11.5 0 0 0 4 4zm5 7l5-5 1.4 1.4-5 5L9 11z',

  // Flower/hibiscus
  milestone_flower: (color) => (
    <>
      <circle cx="12" cy="12" r="3" fill={color} />
      <path d="M12 2c1.5 0 2.5 2 2.5 4S13.5 9 12 9 9.5 8 9.5 6 10.5 2 12 2z" fill={color} opacity="0.7" />
      <path d="M19.07 5.93c.53 1.41-.84 3.15-2.37 3.72-1.53.57-3.1-.07-3.63-1.48.53-1.41 2.1-2.05 3.63-1.48 1.53.57 2.9-.35 2.37.76z" fill={color} opacity="0.7" />
      <path d="M22 12c0 1.5-2 2.5-4 2.5S15 13.5 15 12s.5-2.5 3-2.5 4 1 4 2.5z" fill={color} opacity="0.7" />
      <path d="M19.07 18.07c-1.41.53-3.15-.84-3.72-2.37-.57-1.53.07-3.1 1.48-3.63 1.41.53 2.05 2.1 1.48 3.63-.57 1.53.35 2.9-.76 2.37z" fill={color} opacity="0.7" />
      <path d="M12 22c-1.5 0-2.5-2-2.5-4S10.5 15 12 15s2.5.5 2.5 3-1 4-2.5 4z" fill={color} opacity="0.7" />
      <path d="M4.93 18.07c-.53-1.41.84-3.15 2.37-3.72 1.53-.57 3.1.07 3.63 1.48-.53 1.41-2.1 2.05-3.63 1.48-1.53-.57-2.9.35-2.37-.76z" fill={color} opacity="0.7" />
      <path d="M2 12c0-1.5 2-2.5 4-2.5S9 10.5 9 12s-.5 2.5-3 2.5S2 13.5 2 12z" fill={color} opacity="0.7" />
      <path d="M4.93 5.93c1.41-.53 3.15.84 3.72 2.37.57 1.53-.07 3.1-1.48 3.63-1.41-.53-2.05-2.1-1.48-3.63.57-1.53-.35-2.9.76-2.37z" fill={color} opacity="0.7" />
    </>
  ),

  // Taco
  milestone_taco: 'M3 16c0 2 4 4 9 4s9-2 9-4L12 4 3 16zm3-1c1-2 3-5 6-9 3 4 5 7 6 9H6z',

  // Polar bear
  milestone_polarbear: (color) => (
    <>
      <circle cx="7" cy="7" r="2.5" fill={color} />
      <circle cx="17" cy="7" r="2.5" fill={color} />
      <circle cx="12" cy="13" r="7" fill={color} />
      <circle cx="9.5" cy="11.5" r="1" fill="rgba(0,0,0,0.4)" />
      <circle cx="14.5" cy="11.5" r="1" fill="rgba(0,0,0,0.4)" />
      <circle cx="12" cy="14" r="1.5" fill="rgba(0,0,0,0.3)" />
    </>
  ),

  // Palm island
  milestone_island: (color) => (
    <>
      <path d="M12 4c-3 0-5 2-5 2l5 8 5-8s-2-2-5-2z" fill={color} />
      <path d="M12 4c3 0 6 1 6 1l-6 9V4z" fill={color} opacity="0.7" />
      <path d="M11.5 12v6" fill="none" stroke={color} strokeWidth="2" />
      <path d="M4 20c2-2 5-3 8-3s6 1 8 3" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" />
    </>
  ),

  // World map
  milestone_map: 'M20.5 3l-.16.03L15 5.1 9 3 3.36 4.9A.5.5 0 0 0 3 5.38V20.5a.5.5 0 0 0 .5.5l.16-.03L9 18.9l6 2.1 5.64-1.9a.5.5 0 0 0 .36-.48V3.5a.5.5 0 0 0-.5-.5zM15 19l-6-2.11V5l6 2.11V19z',

  // Volcano
  milestone_volcano: 'M12 2l-2 5-6 13h16L14 7l-2-5zm0 4l3.5 8h-7L12 6z',

  // Pagoda/tower
  milestone_tokyotower: 'M11 2h2v2h-2V2zM8 6h8l-1 3H9L8 6zM7 11h10l-1 4H8l-1-4zM6 17h12l-1 5H7l-1-5z',

  // Dumpling
  milestone_dumpling: 'M12 6C7 6 3 9.5 3 14h18c0-4.5-4-8-9-8zm-6 9c0 2 2.5 3 6 3s6-1 6-3H6z',

  // Bowl
  milestone_bowl: 'M2 10h20c0 5-4 9-10 9S2 15 2 10zm3 0c.5 4 3.5 7 7 7s6.5-3 7-7H5z',

  // Dome/mosque
  milestone_mosque: 'M12 2c-4 0-7 5-7 10h14c0-5-3-10-7-10zm-9 12h18v2H3v-2zm1 4h16v2H4v-2zm2 4h12v2H6v-2z',

  // Camel
  milestone_camel: 'M4 17v3h2v-2h12v2h2v-3l-2-4V9l-1-2h-2l-1 2v1l-2-1h-2l-2 1V9L8 7H6L5 9v4l-1 4zm6-7c.5-.5 1.5-.5 2 0l1 1h-4l1-1z',

  // Pyramid
  milestone_pyramid: 'M12 3L2 21h20L12 3zm0 5l5.5 11h-11L12 8z',

  // Plate of pasta (Italian)
  milestone_italian: 'M2 14h20c0 3-4 6-10 6S2 17 2 14zm1-2c.5-1 1.5-3 3-3s2 2 3 2 1.5-2 3-2 2 2 3 2 1.5-2 3-2 2.5 2 3 3H3z',

  // Croissant
  milestone_croissant: 'M4 16c2-4 5-7 8-7s6 1 8 3l-1 2c-2-1.5-4-2-6-2-3 0-5 2-7 5L4 16zm2 1c1.5-2 3.5-4 6-4 2 0 4 .5 6 2l-1 2c-1.5-1-3-1.5-5-1.5-2 0-4 1.5-5 3L6 17z',

  // Coffee cup
  milestone_coffee: 'M18 6h2c1.1 0 2 .9 2 2v2c0 1.1-.9 2-2 2h-2v2c0 1.1-.9 2-2 2H6c-1.1 0-2-.9-2-2V6h14zm0 4h2V8h-2v2zM2 20h20v2H2v-2z',

  // Volcano with ice
  milestone_iceland: (color) => (
    <>
      <path d="M12 3l-2 4-6 13h16L14 7l-2-4z" fill={color} />
      <path d="M8 14l2-1 2 1 2-1 2 1" fill="none" stroke="rgba(255,255,255,0.5)" strokeWidth="1.5" strokeLinecap="round" />
    </>
  ),

  // Statue/skyscraper (New York)
  milestone_newyork: 'M10 2l1 3h2l1-3h-4zm1 4v1H9l-1 5H7v1h10v-1h-1l-1-5h-2V6h-2zm-2 8h6v8h-2v-4h-2v4H9v-8z',

  // Surfboard
  milestone_surfing: 'M19 2c-2 0-5 3-7 7-2 4-4 8-4 11 0 1 .5 2 1.5 2S11 21 12 19c2-4 5-8 7-11V2z',

  // Sombrero/taco (Mexico)
  milestone_mexico: 'M12 4c-2 0-4 2-4 5h8c0-3-2-5-4-5zM4 11c0 1 3 2 8 2s8-1 8-2-3.5-2-8-2-8 1-8 2zm2 3c2 2 4 3 6 3s4-1 6-3H6z',

  // Bullseye (target)
  milestone_target: 'M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 18c-4.42 0-8-3.58-8-8s3.58-8 8-8 8 3.58 8 8-3.58 8-8 8zm0-14c-3.31 0-6 2.69-6 6s2.69 6 6 6 6-2.69 6-6-2.69-6-6-6zm0 10c-2.21 0-4-1.79-4-4s1.79-4 4-4 4 1.79 4 4-1.79 4-4 4zm0-6a2 2 0 1 0 0 4 2 2 0 0 0 0-4z',

  // Llama
  milestone_llama: 'M16 3v4l1 2v3h2v2h-2v6h-2v-6h-2v6h-2v-6H9v6H7v-6H5v-2h2v-3l2-4V3h2v3l1 1 1-1V3h3z',

  // Wine glass
  milestone_wine: 'M8 2h8l-1 6c-.2 1.5-1.2 3-3 3.5V16h3v2H9v-2h3v-4.5c-1.8-.5-2.8-2-3-3.5L8 2zm2 1.5l.5 3c.2.8.8 1.5 1.5 1.5s1.3-.7 1.5-1.5l.5-3h-4z',

  // House
  milestone_home: 'M10 20v-6h4v6h5v-8h3L12 3 2 12h3v8h5z',

  // ============================================================
  // THEME ICONS
  // ============================================================

  // Boathouse Classic - collegiate boathouse
  theme_boathouse_classic: 'M3 21V11l9-7 9 7v10H3zm2-2h14v-7l-7-5.25L5 12v7zm3-5h8v4H8v-4z',

  // Morning Lake - sunrise over lake
  theme_morning_lake: (color) => (
    <>
      <path d="M12 7V3M5.64 8.64L3.51 6.51M18.36 8.64l2.13-2.13M3 14h3M18 14h3" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" />
      <path d="M8 14a4 4 0 0 1 8 0H8z" fill={color} />
      <path d="M2 17c1.5-1 3-1 4.5 0s3 1 4.5 0 3-1 4.5 0 3 1 4.5 0v2c-1.5-1-3-1-4.5 0s-3 1-4.5 0-3-1-4.5 0-3 1-4.5 0v-2z" fill={color} />
    </>
  ),

  // Athletic Performance - dumbbell/weight
  theme_athletic_performance: 'M6.5 6.5a1.5 1.5 0 0 1 1.5 1.5v8a1.5 1.5 0 0 1-3 0V8A1.5 1.5 0 0 1 6.5 6.5zm11 0A1.5 1.5 0 0 1 19 8v8a1.5 1.5 0 0 1-3 0V8a1.5 1.5 0 0 1 1.5-1.5zM3.5 9A1.5 1.5 0 0 1 5 10.5v3a1.5 1.5 0 0 1-3 0v-3A1.5 1.5 0 0 1 3.5 9zm17 0a1.5 1.5 0 0 1 1.5 1.5v3a1.5 1.5 0 0 1-3 0v-3A1.5 1.5 0 0 1 20.5 9zM8 11h8v2H8v-2z',

  // Ocean Crew - anchor
  theme_ocean_crew: 'M12 2a3 3 0 0 0-3 3c0 1.3.8 2.4 2 2.82V11H8v2h3v6.95A5 5 0 0 1 7 15H5a7 7 0 0 0 14 0h-2a5 5 0 0 1-4 4.95V13h3v-2h-3V7.82A3 3 0 0 0 12 2zm0 2a1 1 0 1 1 0 2 1 1 0 0 1 0-2z',

  // Theme aliases (short keys used in themes.js)
  get theme_boathouse() { return this.theme_boathouse_classic; },
  get theme_sunrise() { return this.theme_morning_lake; },
  get theme_athletic() { return this.theme_athletic_performance; },
  get theme_ocean() { return this.theme_ocean_crew; },
};
