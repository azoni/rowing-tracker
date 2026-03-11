// Changelog entries
export const CHANGELOG = [
  {
    version: '4.4.0',
    date: '2026-03-10',
    changes: [
      '🗺️ Tap progress bar to see full Journey — route around the world from Seattle!',
      '📍 21 real-world checkpoints: Portland → SF → Tokyo → Paris → NYC → home',
      '🎯 83 fun milestones — progress bar now fills between each one',
      '🌍 World progress moved to subtle bar at the bottom',
      '🏆 Leaderboard trimmed to 4 tabs (Meters, Weekly, Streaks, Awards)',
      '📊 "More" tab renamed to "Stats"',
      '📸 Upload buttons now appear first on Log tab',
      '🏅 Achievements paginated (8 per page) on Stats tab',
      '📣 Same-day achievements grouped into single feed items',
      '✨ Feed badges cleaned up — less visual clutter',
      '⚙️ Settings reorganized — profile first, theme lower',
    ]
  },
  {
    version: '4.3.0',
    date: '2025-01-17',
    changes: [
      '🔔 Notifications when someone comments on your activity',
      '↩️ Reply to comments with @mentions',
      '💬 Cleaner, more compact comment design',
      '👏 React to posts with emoji (💪🔥👏🎉⚡)',
    ]
  },
  {
    version: '4.2.0',
    date: '2025-01-16',
    changes: [
      '🎨 4 new themes! Pick your vibe in Settings',
      '🏛️ Boathouse Classic - navy & gold collegiate style',
      '🌅 Morning Lake - calm light mode for sunrise rows',
      '🏋️ Athletic Performance - bold orange sports energy',
      '⚓ Ocean Crew - rich maritime club aesthetic',
      '📣 Activity feed: group & challenge events',
      '👑 Group admins: manage members & transfer roles',
      '🚣 New rowing-themed app icon',
    ]
  },
  {
    version: '4.1.0',
    date: '2025-01-15',
    changes: [
      '⏱️ Track time & calories on every row',
      '🤖 AI learns from your corrections to improve',
      '🔥 New leaderboards: Total Time & Calories',
      '☄️ 3 new challenge types: Total Time, Calorie Burn, Team Calories',
      '🏆 12 new achievements for time & calorie milestones',
      '⚡ Pace calculation when time is logged',
    ]
  },
  {
    version: '4.0.0',
    date: '2025-01-08',
    changes: [
      '👥 Groups - Create private groups with friends',
      '🎯 Challenges - 5 types: Collective, Distance Race, Time Trial, Streak, Sessions',
      '🔗 Join groups via invite code',
      '📊 Group-filtered leaderboards & feeds',
      '⏱️ Time trials with verified/unverified times',
      '🏆 Challenge leaderboards & progress tracking',
    ]
  },
  {
    version: '3.2.0',
    date: '2025-12-26',
    changes: [
      '🎁 2025 Wrapped - see your year in rowing!',
      '✏️ Manual meter entry (no photo required)',
      '✗ Unverified badge for manual entries',
      '🎉 All users can view Wrapped (even new ones)',
      '📊 10 story slides with fun stats & comparisons',
      '📤 Share your Wrapped card with friends',
    ]
  },
  {
    version: '3.1.0',
    date: '2025-12-03',
    changes: [
      '👤 Click any user to view their profile card',
      '📋 Session History in settings',
      '🏆 4 leaderboards: All-Time, Weekly, Streak, Achievements',
      '🏅 Weekly champion achievements',
      '🎖️ Click your title to see rank progress & all titles',
      '👑 Weekly leaderboard badges in feed',
      '🆕 New user join notifications in feed',
    ]
  },
  {
    version: '3.0.0',
    date: '2025-12-01',
    changes: [
      '🛡️ AI-powered image verification using Claude Vision',
      '📸 Photos now shown in activity feed (click to enlarge)',
      '✓ Verification badges on all entries',
      '🔒 Multi-layer anti-cheat: AI + duplicate detection + behavioral analysis',
      '👮 Admin review panel for manual verification',
      '🖼️ Images stored securely in Firebase Storage',
      '📊 Verification confidence scores',
    ]
  },
  {
    version: '2.3.0',
    date: '2025-12-01',
    changes: [
      '📱 Install app prompt - add to home screen easily',
      '📊 Achievement progress bars (54/100 style)',
      '📅 Achievement completion dates',
      '🏅 Achievements show in activity feed when unlocked',
      '🎖️ Rank promotions show in activity feed',
      '📜 Feed pagination - load more button',
      '🔍 Search in activity feed',
      '🎨 Progress bars on rank progression',
    ]
  },
  {
    version: '2.2.0',
    date: '2025-12-01',
    changes: [
      '👀 Guest viewing - see everything without signing in',
      '🔍 Search bar in Activity Feed',
      '🏅 New "More" tab with achievements & rank progression',
      '📱 Click achievements to see details on mobile',
      '⚙️ Settings page with profile picture upload',
      '🖼️ Upload custom profile pictures',
      '🔧 Database consistency improvements',
    ]
  },
  {
    version: '2.1.0',
    date: '2025-12-01',
    changes: [
      '🔍 Search bar to find rowers quickly',
      '📊 Enhanced Stats tab with new metrics',
      '🏆 Best single row (Personal Record) displayed',
      '🔥 Longest streak ever achieved shown',
      '📅 Days rowed & member since date',
      '🏅 Achievement badges preview on each card',
      '🎨 Redesigned stats layout with highlight boxes',
    ]
  },
  {
    version: '2.0.0',
    date: '2025-12-01',
    changes: [
      '🎮 Major gamification update!',
      '🏅 16 achievements to unlock (First Strokes, Beast Mode, Week Warrior, etc.)',
      '🎖️ Rank titles: Landlubber → Novice Rower → Iron Oars → Row Legend',
      '📣 Activity Feed - see when friends log rows in real-time',
      '🏆 Personal Records - celebrate when you beat your best',
      '🎉 Confetti celebration on every row logged',
      '💪 Weekly stats with % change from last week',
      '💬 Daily motivational quotes',
      '📊 Your rank progress shown on Log tab',
    ]
  },
  {
    version: '1.8.0',
    date: '2025-11-30',
    changes: [
      'Added Firestore security rules to prevent tampering',
      'Users can only add entries for themselves',
      'Entries are now immutable (no edits/deletes)',
      'Added special surprise for anyone trying to cheat 😏',
    ]
  },
  {
    version: '1.7.2',
    date: '2025-11-28',
    changes: [
      'Native share on mobile - share directly to iMessage, WhatsApp, etc.',
      'More compact share card design',
      'Horizontal share/done buttons',
    ]
  },
  {
    version: '1.7.1',
    date: '2025-11-28',
    changes: [
      'Share button now copies the share card as an image',
      'Clickable link to Row Crew in share card footer',
      'Falls back to downloading image if clipboard not supported',
    ]
  },
  {
    version: '1.7.0',
    date: '2025-11-28',
    changes: [
      'Added shareable card after logging a row',
      'Share your session with friends via copy-paste',
      'Share card shows session meters, streak, total, profile pic, and row photo',
      'Changelog dates now display in PST timezone',
    ]
  },
  {
    version: '1.6.0',
    date: '2025-11-28',
    changes: [
      'Added changelog/updates tab',
      'Added profile pictures to leaderboard and stats',
      'Improved error messages with specific reasons for sign-in failures',
    ]
  },
  {
    version: '1.5.0',
    date: '2025-11-28',
    changes: [
      'Added Google Sign-In authentication',
      'Users can only log rows for their own account',
      'Added entry validation (100-30,000m per session)',
      'Added 15-minute cooldown between entries',
      'Added Firestore security rules',
    ]
  },
  {
    version: '1.4.0',
    date: '2025-11-27',
    changes: [
      'Improved OCR with image preprocessing',
      'Added confirmation modal before submitting',
      'Device now remembers your user selection',
      'Added image preview when logging rows',
      'Editable meters field for corrections',
    ]
  },
  {
    version: '1.3.0',
    date: '2025-11-27',
    changes: [
      'Added PWA support - install as app on your phone',
      'Works offline (view-only when disconnected)',
      'Added app icons and splash screen',
    ]
  },
  {
    version: '1.2.0',
    date: '2025-11-27',
    changes: [
      'Migrated to Firebase Firestore backend',
      'Real-time sync across all devices',
      'Data now persists in the cloud',
      'Admin can edit data via Firebase Console',
    ]
  },
  {
    version: '1.1.0',
    date: '2025-11-26',
    changes: [
      'Deployed to Netlify',
      'Added mobile-responsive design',
      'Fixed ESLint build errors',
    ]
  },
  {
    version: '1.0.0',
    date: '2025-11-26',
    changes: [
      '🎉 Initial release!',
      'Photo upload with OCR to read rowing machine display',
      'Leaderboard with rankings',
      'Streak tracking for consecutive days',
      'Detailed stats per user (avg meters, sessions/week)',
      'World progress - row 40,075km around the world together',
      'Milestone celebrations with fun distance comparisons',
    ]
  },
];
