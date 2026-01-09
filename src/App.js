import React, { useState, useEffect, useCallback, useRef } from 'react';
import Tesseract from 'tesseract.js';
import html2canvas from 'html2canvas';
import confetti from 'canvas-confetti';
import { db, auth, googleProvider, functions } from './firebase';
import { 
  collection, 
  doc, 
  setDoc, 
  getDoc,
  onSnapshot, 
  query, 
  orderBy,
  serverTimestamp,
  where,
  getDocs,
  limit,
  updateDoc,
  deleteDoc,
  arrayUnion,
  arrayRemove
} from 'firebase/firestore';
import { signInWithPopup, signOut, onAuthStateChanged } from 'firebase/auth';
import { httpsCallable } from 'firebase/functions';
import './App.css';

// Constants
const WORLD_CIRCUMFERENCE = 40075000;
const MIN_METERS = 100;
const MAX_METERS = 50000; // Increased for very long sessions
const COOLDOWN_MINUTES = 15;

// Rank titles based on total meters
const RANKS = [
  { minMeters: 0, title: 'Landlubber', emoji: '🚶' },
  { minMeters: 5000, title: 'Novice Rower', emoji: '🚣' },
  { minMeters: 15000, title: 'River Runner', emoji: '🏊' },
  { minMeters: 30000, title: 'Lake Crosser', emoji: '⛵' },
  { minMeters: 50000, title: 'Ocean Voyager', emoji: '🚤' },
  { minMeters: 100000, title: 'Iron Oars', emoji: '💪' },
  { minMeters: 200000, title: 'Sea Champion', emoji: '🏆' },
  { minMeters: 500000, title: 'Row Legend', emoji: '👑' },
  { minMeters: 1000000, title: 'Mythical Rower', emoji: '🔱' },
];

// Achievement definitions
const ACHIEVEMENTS = [
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
];

// Motivational quotes
const QUOTES = [
  { text: "The only bad workout is the one that didn't happen.", author: "Unknown" },
  { text: "Row by row, we go far.", author: "Row Crew" },
  { text: "Your body can stand almost anything. It's your mind you have to convince.", author: "Unknown" },
  { text: "The pain you feel today will be the strength you feel tomorrow.", author: "Unknown" },
  { text: "Champions are made when no one is watching.", author: "Unknown" },
  { text: "Every stroke counts. Every meter matters.", author: "Row Crew" },
  { text: "Sweat is just fat crying.", author: "Unknown" },
  { text: "The harder you work, the luckier you get.", author: "Gary Player" },
  { text: "Don't stop when you're tired. Stop when you're done.", author: "Unknown" },
  { text: "Success is the sum of small efforts repeated daily.", author: "Robert Collier" },
];

// Milestone definitions
const MILESTONES = [
  { meters: 1000, label: '1 km', comparison: 'Length of 10 football fields!' },
  { meters: 5000, label: '5 km', comparison: 'Across Central Park!' },
  { meters: 10000, label: '10 km', comparison: 'Height of a cruising airplane!' },
  { meters: 21097, label: 'Half Marathon', comparison: '21.1 km - Half marathon distance!' },
  { meters: 42195, label: 'Marathon', comparison: '42.2 km - Full marathon!' },
  { meters: 100000, label: '100 km', comparison: 'Length of the Panama Canal!' },
  { meters: 250000, label: '250 km', comparison: 'New York to Washington DC!' },
  { meters: 500000, label: '500 km', comparison: 'Length of California coastline!' },
  { meters: 1000000, label: '1,000 km', comparison: 'Paris to Rome!' },
  { meters: 2500000, label: '2,500 km', comparison: 'Width of Australia!' },
  { meters: 5000000, label: '5,000 km', comparison: 'New York to London!' },
  { meters: 10000000, label: '10,000 km', comparison: 'Quarter around the world!' },
  { meters: 20000000, label: '20,000 km', comparison: 'Halfway around the world!' },
  { meters: 40075000, label: '40,075 km', comparison: '🌍 YOU ROWED AROUND THE WORLD! 🌍' },
];

// Changelog entries
const CHANGELOG = [
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

function App() {
  // Auth state
  const [currentUser, setCurrentUser] = useState(null);
  const [userProfile, setUserProfile] = useState(null);
  const [authLoading, setAuthLoading] = useState(true);

  // App state
  const [users, setUsers] = useState({});
  const [entries, setEntries] = useState([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [processingStatus, setProcessingStatus] = useState('');
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [showSetupModal, setShowSetupModal] = useState(false);
  const [detectedMeters, setDetectedMeters] = useState('');
  const [editableMeters, setEditableMeters] = useState('');
  const [manualMeters, setManualMeters] = useState('');
  const [isSubmittingManual, setIsSubmittingManual] = useState(false);
  const [displayName, setDisplayName] = useState('');
  const [recentMilestone, setRecentMilestone] = useState(null);
  const [activeTab, setActiveTab] = useState('feed');
  const [capturedImage, setCapturedImage] = useState(null);
  const [validationError, setValidationError] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [showShareModal, setShowShareModal] = useState(false);
  const [lastSessionMeters, setLastSessionMeters] = useState(0);
  const [shareImageUrl, setShareImageUrl] = useState(null);
  const [linkCopied, setLinkCopied] = useState(false);
  const [isCopying, setIsCopying] = useState(false);
  const [showBustedModal, setShowBustedModal] = useState(false);
  const [, setTestTapCount] = useState(0);
  const [showPRModal, setShowPRModal] = useState(null);
  const [dailyQuote, setDailyQuote] = useState(null);
  const [feedSearchQuery, setFeedSearchQuery] = useState('');
  const [showAchievementModal, setShowAchievementModal] = useState(null);
  const [showSettingsModal, setShowSettingsModal] = useState(false);
  const [isUploadingPhoto, setIsUploadingPhoto] = useState(false);
  const [showInstallPrompt, setShowInstallPrompt] = useState(false);
  const [deferredPrompt, setDeferredPrompt] = useState(null);
  const [isIOS, setIsIOS] = useState(false);
  const [isStandalone, setIsStandalone] = useState(false);
  const [feedPage, setFeedPage] = useState(1);
  const FEED_PAGE_SIZE = 15;
  const [, setVerificationStatus] = useState(null);
  const [showPhotoModal, setShowPhotoModal] = useState(null);
  const [showAdminPanel, setShowAdminPanel] = useState(false);
  const [pendingReviews, setPendingReviews] = useState([]);
  const [adminStats, setAdminStats] = useState(null);
  const [reviewingEntry, setReviewingEntry] = useState(null);
  const [adjustedMeters, setAdjustedMeters] = useState('');
  const [reviewNote, setReviewNote] = useState('');
  const [isAdmin, setIsAdmin] = useState(false);
  const [showUserProfileModal, setShowUserProfileModal] = useState(null);
  const [showRankProgressModal, setShowRankProgressModal] = useState(false);
  const [leaderboardTab, setLeaderboardTab] = useState('alltime'); // alltime, weekly, streak, achievements
  const [showSessionHistory, setShowSessionHistory] = useState(false);
  const [showWrapped, setShowWrapped] = useState(false);
  const [wrappedSlide, setWrappedSlide] = useState(0);
  const [wrappedDismissed, setWrappedDismissed] = useState(() => {
    return localStorage.getItem('wrappedDismissed2025') === 'true';
  });
  
  // Groups & Challenges
  const [groups, setGroups] = useState([]);
  const [selectedGroupId, setSelectedGroupId] = useState(null); // null = global view
  const [challenges, setChallenges] = useState([]);
  const [showGroupSelector, setShowGroupSelector] = useState(false);
  const [showCreateGroupModal, setShowCreateGroupModal] = useState(false);
  const [showJoinGroupModal, setShowJoinGroupModal] = useState(false);
  const [showCreateChallengeModal, setShowCreateChallengeModal] = useState(false);
  const [showChallengeDetail, setShowChallengeDetail] = useState(null);
  const [showTimeTrialModal, setShowTimeTrialModal] = useState(null);
  const [newGroupName, setNewGroupName] = useState('');
  const [newGroupDescription, setNewGroupDescription] = useState('');
  const [joinGroupCode, setJoinGroupCode] = useState('');
  const [isCreatingGroup, setIsCreatingGroup] = useState(false);
  const [isJoiningGroup, setIsJoiningGroup] = useState(false);
  const [groupError, setGroupError] = useState('');
  const [newChallengeName, setNewChallengeName] = useState('');
  const [newChallengeType, setNewChallengeType] = useState('collective');
  const [newChallengeTarget, setNewChallengeTarget] = useState('');
  const [newChallengeStartDate, setNewChallengeStartDate] = useState('');
  const [newChallengeEndDate, setNewChallengeEndDate] = useState('');
  const [isCreatingChallenge, setIsCreatingChallenge] = useState(false);
  const [timeTrialTime, setTimeTrialTime] = useState('');
  const [timeTrialImage, setTimeTrialImage] = useState(null);
  const [isSubmittingTimeTrial, setIsSubmittingTimeTrial] = useState(false);
  
  const wrappedCardRef = useRef(null);
  
  const fileInputRef = useRef(null);
  const previousTotalRef = useRef(0);
  const canvasRef = useRef(null);
  const shareCardRef = useRef(null);
  const profilePicInputRef = useRef(null);

  // Secret test mode: Press "chinh" to trigger busted modal
  useEffect(() => {
    let buffer = '';
    const handleKeyPress = (e) => {
      buffer += e.key.toLowerCase();
      if (buffer.includes('chinh')) {
        setShowBustedModal(true);
        buffer = '';
      }
      // Clear buffer after 2 seconds of no typing
      setTimeout(() => { buffer = ''; }, 2000);
    };
    
    window.addEventListener('keypress', handleKeyPress);
    return () => window.removeEventListener('keypress', handleKeyPress);
  }, []);

  // Service Worker Auto-Update
  useEffect(() => {
    if ('serviceWorker' in navigator) {
      // Listen for messages from service worker
      navigator.serviceWorker.addEventListener('message', (event) => {
        if (event.data && event.data.type === 'SW_UPDATED') {
          console.log('App updated to version:', event.data.version);
          // Automatically reload to get the new version
          window.location.reload();
        }
      });

      // Check for updates periodically (every 5 minutes)
      const checkForUpdates = () => {
        navigator.serviceWorker.getRegistration().then((registration) => {
          if (registration) {
            registration.update();
          }
        });
      };

      // Check immediately on mount
      checkForUpdates();

      // Then check every 5 minutes
      const interval = setInterval(checkForUpdates, 5 * 60 * 1000);

      return () => clearInterval(interval);
    }
  }, []);

  // Secret test mode: Tap footer 5 times quickly (for mobile)
  const handleFooterTap = () => {
    setTestTapCount(prev => {
      const newCount = prev + 1;
      if (newCount >= 5) {
        setShowBustedModal(true);
        return 0;
      }
      // Reset after 2 seconds
      setTimeout(() => setTestTapCount(0), 2000);
      return newCount;
    });
  };

  // PWA Install Prompt Detection
  useEffect(() => {
    // Check if running as installed PWA
    const standalone = window.matchMedia('(display-mode: standalone)').matches || 
                       window.navigator.standalone === true;
    setIsStandalone(standalone);
    
    // Check if iOS
    const iOS = /iPad|iPhone|iPod/.test(navigator.userAgent);
    setIsIOS(iOS);
    
    // Check if user has dismissed the prompt before
    const dismissed = localStorage.getItem('installPromptDismissed');
    const dismissedTime = dismissed ? parseInt(dismissed, 10) : 0;
    const daysSinceDismissed = (Date.now() - dismissedTime) / (1000 * 60 * 60 * 24);
    
    // Show prompt if not standalone, not recently dismissed (1 day)
    if (!standalone && daysSinceDismissed > 1) {
      // Listen for beforeinstallprompt (Android/Desktop Chrome)
      const handleBeforeInstall = (e) => {
        e.preventDefault();
        setDeferredPrompt(e);
        setShowInstallPrompt(true);
      };
      
      window.addEventListener('beforeinstallprompt', handleBeforeInstall);
      
      // For iOS, show prompt after a delay
      if (iOS) {
        setTimeout(() => {
          if (!standalone) setShowInstallPrompt(true);
        }, 3000);
      }
      
      return () => window.removeEventListener('beforeinstallprompt', handleBeforeInstall);
    }
  }, []);

  // Handle install button click
  const handleInstallClick = async () => {
    if (deferredPrompt) {
      deferredPrompt.prompt();
      const { outcome } = await deferredPrompt.userChoice;
      if (outcome === 'accepted') {
        setShowInstallPrompt(false);
      }
      setDeferredPrompt(null);
    }
  };

  // Dismiss install prompt
  const dismissInstallPrompt = () => {
    setShowInstallPrompt(false);
    localStorage.setItem('installPromptDismissed', Date.now().toString());
  };

  // Listen for auth state changes
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      setCurrentUser(user);
      
      if (user) {
        // Check if user has a profile
        const profileRef = doc(db, 'users', user.uid);
        const profileSnap = await getDoc(profileRef);
        
        if (profileSnap.exists()) {
          const profileData = profileSnap.data();
          setUserProfile({ id: user.uid, ...profileData });
          setIsAdmin(profileData.isAdmin === true);
        } else {
          // New user - show setup modal
          setDisplayName(user.displayName || '');
          setShowSetupModal(true);
          setIsAdmin(false);
        }
      } else {
        setUserProfile(null);
        setIsAdmin(false);
      }
      
      setAuthLoading(false);
    });

    return () => unsubscribe();
  }, []);

  // Subscribe to real-time updates from Firebase
  useEffect(() => {
    setIsLoading(true);

    const unsubUsers = onSnapshot(
      collection(db, 'users'),
      (snapshot) => {
        const usersData = {};
        snapshot.forEach((docSnap) => {
          usersData[docSnap.id] = { id: docSnap.id, ...docSnap.data() };
        });
        setUsers(usersData);
        setIsLoading(false);
      },
      (error) => {
        console.error('Error fetching users:', error);
        setIsLoading(false);
      }
    );

    const entriesQuery = query(collection(db, 'entries'), orderBy('date', 'desc'));
    const unsubEntries = onSnapshot(
      entriesQuery,
      (snapshot) => {
        const entriesData = [];
        snapshot.forEach((docSnap) => {
          entriesData.push({ id: docSnap.id, ...docSnap.data() });
        });
        setEntries(entriesData);
      },
      (error) => {
        console.error('Error fetching entries:', error);
      }
    );

    return () => {
      unsubUsers();
      unsubEntries();
    };
  }, []);

  // Load groups for current user
  useEffect(() => {
    if (!currentUser) {
      setGroups([]);
      setChallenges([]);
      setSelectedGroupId(null);
      return;
    }

    // Listen to groups where user is a member
    const groupsQuery = query(
      collection(db, 'groups'),
      where('memberIds', 'array-contains', currentUser.uid)
    );

    const unsubGroups = onSnapshot(
      groupsQuery,
      (snapshot) => {
        const groupsData = [];
        snapshot.forEach((docSnap) => {
          groupsData.push({ id: docSnap.id, ...docSnap.data() });
        });
        setGroups(groupsData);
      },
      (error) => {
        console.error('Error fetching groups:', error);
      }
    );

    return () => unsubGroups();
  }, [currentUser]);

  // Load challenges for selected group
  useEffect(() => {
    if (!selectedGroupId) {
      setChallenges([]);
      return;
    }

    const challengesQuery = query(
      collection(db, 'challenges'),
      where('groupId', '==', selectedGroupId),
      orderBy('createdAt', 'desc')
    );

    const unsubChallenges = onSnapshot(
      challengesQuery,
      (snapshot) => {
        const challengesData = [];
        snapshot.forEach((docSnap) => {
          challengesData.push({ id: docSnap.id, ...docSnap.data() });
        });
        setChallenges(challengesData);
      },
      (error) => {
        console.error('Error fetching challenges:', error);
      }
    );

    return () => unsubChallenges();
  }, [selectedGroupId]);

  // Update user profile when it changes in Firebase
  useEffect(() => {
    if (currentUser && users[currentUser.uid]) {
      setUserProfile(users[currentUser.uid]);
    }
  }, [currentUser, users]);

  // Calculate total meters
  const getTotalMeters = useCallback(() => {
    return Object.values(users).reduce((sum, user) => sum + (user.totalMeters || 0), 0);
  }, [users]);

  // Check for milestones
  useEffect(() => {
    const currentTotal = getTotalMeters();
    const prevTotal = previousTotalRef.current;

    if (prevTotal > 0 && currentTotal > prevTotal) {
      const newMilestone = MILESTONES.find(
        (m) => prevTotal < m.meters && currentTotal >= m.meters
      );

      if (newMilestone) {
        setRecentMilestone(newMilestone);
        setTimeout(() => setRecentMilestone(null), 5000);
      }
    }

    previousTotalRef.current = currentTotal;
  }, [getTotalMeters]);

  // Sign in with Google
  const handleSignIn = async () => {
    try {
      await signInWithPopup(auth, googleProvider);
    } catch (error) {
      console.error('Sign in error:', error);
      
      // Provide specific error messages
      let errorMessage = 'Failed to sign in. Please try again.';
      
      switch (error.code) {
        case 'auth/popup-closed-by-user':
          errorMessage = 'Sign-in was cancelled. Please try again.';
          break;
        case 'auth/popup-blocked':
          errorMessage = 'Pop-up was blocked. Please allow pop-ups for this site.';
          break;
        case 'auth/unauthorized-domain':
          errorMessage = 'This domain is not authorized. Please contact the app admin to add this domain in Firebase Console.';
          break;
        case 'auth/network-request-failed':
          errorMessage = 'Network error. Please check your internet connection.';
          break;
        case 'auth/too-many-requests':
          errorMessage = 'Too many attempts. Please wait a moment and try again.';
          break;
        case 'auth/user-disabled':
          errorMessage = 'This account has been disabled.';
          break;
        case 'auth/operation-not-allowed':
          errorMessage = 'Google sign-in is not enabled. Please contact the app admin.';
          break;
        default:
          errorMessage = `Sign-in failed: ${error.message || error.code || 'Unknown error'}`;
      }
      
      alert(errorMessage);
    }
  };

  // Sign out
  const handleSignOut = async () => {
    try {
      await signOut(auth);
      setUserProfile(null);
    } catch (error) {
      console.error('Sign out error:', error);
    }
  };

  // Create user profile
  const handleCreateProfile = async () => {
    if (!displayName.trim() || !currentUser) return;

    try {
      const userRef = doc(db, 'users', currentUser.uid);
      await setDoc(userRef, {
        name: displayName.trim(),
        email: currentUser.email,
        photoURL: currentUser.photoURL,
        totalMeters: 0,
        uploadCount: 0,
        createdAt: new Date().toISOString(),
      });

      setUserProfile({
        id: currentUser.uid,
        name: displayName.trim(),
        totalMeters: 0,
        uploadCount: 0,
      });

      setShowSetupModal(false);
    } catch (error) {
      console.error('Error creating profile:', error);
      
      if (error.code === 'permission-denied' || 
          error.message?.includes('permission') ||
          error.message?.includes('PERMISSION_DENIED')) {
        setShowBustedModal(true);
        return;
      }
      
      alert('Failed to create profile. Please try again.');
    }
  };

  // Generate random invite code
  const generateInviteCode = () => {
    const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
    let code = '';
    for (let i = 0; i < 6; i++) {
      code += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return code;
  };

  // Create a new group
  const handleCreateGroup = async () => {
    if (!newGroupName.trim() || !currentUser) return;

    setIsCreatingGroup(true);
    setGroupError('');

    try {
      const groupId = `group_${Date.now()}_${currentUser.uid.slice(0, 6)}`;
      const inviteCode = generateInviteCode();

      await setDoc(doc(db, 'groups', groupId), {
        name: newGroupName.trim(),
        description: newGroupDescription.trim(),
        inviteCode,
        createdBy: currentUser.uid,
        adminIds: [currentUser.uid],
        memberIds: [currentUser.uid],
        createdAt: serverTimestamp(),
      });

      setNewGroupName('');
      setNewGroupDescription('');
      setShowCreateGroupModal(false);
      setSelectedGroupId(groupId);
    } catch (error) {
      console.error('Error creating group:', error);
      setGroupError('Failed to create group. Please try again.');
    }

    setIsCreatingGroup(false);
  };

  // Join a group by invite code
  const handleJoinGroup = async () => {
    if (!joinGroupCode.trim() || !currentUser) return;

    setIsJoiningGroup(true);
    setGroupError('');

    try {
      // Find group by invite code
      const groupsQuery = query(
        collection(db, 'groups'),
        where('inviteCode', '==', joinGroupCode.trim().toUpperCase())
      );
      const snapshot = await getDocs(groupsQuery);

      if (snapshot.empty) {
        setGroupError('Invalid invite code. Please check and try again.');
        setIsJoiningGroup(false);
        return;
      }

      const groupDoc = snapshot.docs[0];
      const groupData = groupDoc.data();

      if (groupData.memberIds?.includes(currentUser.uid)) {
        setGroupError('You are already a member of this group!');
        setIsJoiningGroup(false);
        return;
      }

      // Add user to group
      await updateDoc(doc(db, 'groups', groupDoc.id), {
        memberIds: arrayUnion(currentUser.uid)
      });

      setJoinGroupCode('');
      setShowJoinGroupModal(false);
      setSelectedGroupId(groupDoc.id);
    } catch (error) {
      console.error('Error joining group:', error);
      setGroupError('Failed to join group. Please try again.');
    }

    setIsJoiningGroup(false);
  };

  // Leave a group
  const handleLeaveGroup = async (groupId) => {
    if (!currentUser || !groupId) return;

    try {
      const group = groups.find(g => g.id === groupId);
      if (!group) return;

      // Check if user is the only admin
      if (group.adminIds?.length === 1 && group.adminIds[0] === currentUser.uid) {
        if (group.memberIds?.length > 1) {
          alert('You must assign another admin before leaving, or remove all other members first.');
          return;
        }
        // User is last member, delete the group
        await deleteDoc(doc(db, 'groups', groupId));
      } else {
        // Remove user from group
        await updateDoc(doc(db, 'groups', groupId), {
          memberIds: arrayRemove(currentUser.uid),
          adminIds: arrayRemove(currentUser.uid)
        });
      }

      if (selectedGroupId === groupId) {
        setSelectedGroupId(null);
      }
    } catch (error) {
      console.error('Error leaving group:', error);
    }
  };

  // Get selected group
  const getSelectedGroup = () => {
    return groups.find(g => g.id === selectedGroupId);
  };

  // Check if current user is group admin
  const isGroupAdmin = (groupId) => {
    const group = groups.find(g => g.id === groupId);
    return group?.adminIds?.includes(currentUser?.uid);
  };

  // Create a new challenge
  const handleCreateChallenge = async () => {
    if (!newChallengeName.trim() || !selectedGroupId || !currentUser) return;
    if (!newChallengeStartDate || !newChallengeEndDate) {
      setGroupError('Please select start and end dates');
      return;
    }

    setIsCreatingChallenge(true);
    setGroupError('');

    try {
      const challengeId = `challenge_${Date.now()}`;
      const targetValue = parseInt(newChallengeTarget, 10) || 0;

      await setDoc(doc(db, 'challenges', challengeId), {
        groupId: selectedGroupId,
        name: newChallengeName.trim(),
        type: newChallengeType,
        targetMeters: newChallengeType === 'collective' ? targetValue : null,
        targetDistance: newChallengeType === 'time_trial' ? targetValue : null,
        startDate: new Date(newChallengeStartDate).toISOString(),
        endDate: new Date(newChallengeEndDate).toISOString(),
        createdBy: currentUser.uid,
        createdAt: serverTimestamp(),
        participants: {},
      });

      setNewChallengeName('');
      setNewChallengeType('collective');
      setNewChallengeTarget('');
      setNewChallengeStartDate('');
      setNewChallengeEndDate('');
      setShowCreateChallengeModal(false);
    } catch (error) {
      console.error('Error creating challenge:', error);
      setGroupError('Failed to create challenge. Please try again.');
    }

    setIsCreatingChallenge(false);
  };

  // Get challenge status
  const getChallengeStatus = (challenge) => {
    const now = new Date();
    const start = new Date(challenge.startDate);
    const end = new Date(challenge.endDate);

    if (now < start) return 'upcoming';
    if (now > end) return 'completed';
    return 'active';
  };

  // Calculate challenge progress for collective challenges
  const getChallengeProgress = (challenge) => {
    if (challenge.type !== 'collective') return null;

    const group = groups.find(g => g.id === challenge.groupId);
    if (!group) return { current: 0, target: challenge.targetMeters || 0 };

    const start = new Date(challenge.startDate);
    const end = new Date(challenge.endDate);

    // Sum entries from group members during challenge period
    const challengeEntries = entries.filter(e => 
      group.memberIds?.includes(e.userId) &&
      new Date(e.date) >= start &&
      new Date(e.date) <= end
    );

    const currentMeters = challengeEntries.reduce((sum, e) => sum + e.meters, 0);

    return {
      current: currentMeters,
      target: challenge.targetMeters || 0,
      percentage: challenge.targetMeters ? Math.min(100, (currentMeters / challenge.targetMeters) * 100) : 0
    };
  };

  // Get leaderboard for a challenge
  const getChallengeLeaderboard = (challenge) => {
    const group = groups.find(g => g.id === challenge.groupId);
    if (!group) return [];

    const start = new Date(challenge.startDate);
    const end = new Date(challenge.endDate);

    if (challenge.type === 'time_trial') {
      // Get best times from participants
      const attempts = Object.entries(challenge.participants || {})
        .map(([odometer, data]) => ({
          odometer,
          user: users[odometer],
          time: data.bestTime,
          verified: data.verified,
          date: data.date
        }))
        .filter(a => a.time && a.user)
        .sort((a, b) => a.time - b.time);

      return attempts;
    }

    // For distance-based challenges
    const memberProgress = group.memberIds?.map(odometer => {
      const memberEntries = entries.filter(e => 
        e.userId === odometer &&
        new Date(e.date) >= start &&
        new Date(e.date) <= end
      );

      const totalMeters = memberEntries.reduce((sum, e) => sum + e.meters, 0);
      const sessionCount = memberEntries.length;

      // Calculate streak during challenge period
      const uniqueDays = [...new Set(memberEntries.map(e => 
        new Date(e.date).toDateString()
      ))].sort((a, b) => new Date(a) - new Date(b));

      let bestStreak = uniqueDays.length > 0 ? 1 : 0;
      let currentStreak = 1;
      for (let i = 1; i < uniqueDays.length; i++) {
        const prev = new Date(uniqueDays[i - 1]);
        const curr = new Date(uniqueDays[i]);
        const diff = Math.round((curr - prev) / (1000 * 60 * 60 * 24));
        if (diff === 1) {
          currentStreak++;
          bestStreak = Math.max(bestStreak, currentStreak);
        } else {
          currentStreak = 1;
        }
      }

      return {
        odometer,
        user: users[odometer],
        totalMeters,
        sessionCount,
        bestStreak,
      };
    }).filter(m => m.user);

    // Sort based on challenge type
    if (challenge.type === 'distance_race' || challenge.type === 'collective') {
      return memberProgress.sort((a, b) => b.totalMeters - a.totalMeters);
    } else if (challenge.type === 'streak') {
      return memberProgress.sort((a, b) => b.bestStreak - a.bestStreak);
    } else if (challenge.type === 'sessions') {
      return memberProgress.sort((a, b) => b.sessionCount - a.sessionCount);
    }

    return memberProgress;
  };

  // Submit time trial attempt
  const handleSubmitTimeTrial = async () => {
    if (!showTimeTrialModal || !currentUser || !timeTrialTime) return;

    setIsSubmittingTimeTrial(true);

    try {
      const challenge = showTimeTrialModal;
      const timeInSeconds = parseTimeToSeconds(timeTrialTime);

      if (!timeInSeconds || timeInSeconds <= 0) {
        setGroupError('Please enter a valid time (e.g., 1:45.3 or 105.3)');
        setIsSubmittingTimeTrial(false);
        return;
      }

      // Get current best time for this user
      const currentBest = challenge.participants?.[currentUser.uid]?.bestTime;

      // Only update if better time or no previous attempt
      if (!currentBest || timeInSeconds < currentBest) {
        await updateDoc(doc(db, 'challenges', challenge.id), {
          [`participants.${currentUser.uid}`]: {
            bestTime: timeInSeconds,
            verified: !!timeTrialImage,
            date: new Date().toISOString(),
            imageUrl: timeTrialImage || null,
          }
        });
      }

      setTimeTrialTime('');
      setTimeTrialImage(null);
      setShowTimeTrialModal(null);
    } catch (error) {
      console.error('Error submitting time trial:', error);
      setGroupError('Failed to submit. Please try again.');
    }

    setIsSubmittingTimeTrial(false);
  };

  // Parse time string to seconds (e.g., "1:45.3" -> 105.3)
  const parseTimeToSeconds = (timeStr) => {
    if (!timeStr) return null;

    // Handle MM:SS.ms format
    if (timeStr.includes(':')) {
      const parts = timeStr.split(':');
      const minutes = parseInt(parts[0], 10) || 0;
      const seconds = parseFloat(parts[1]) || 0;
      return minutes * 60 + seconds;
    }

    // Handle pure seconds
    return parseFloat(timeStr) || null;
  };

  // Format seconds to time string
  const formatTime = (seconds) => {
    if (!seconds) return '--';
    const mins = Math.floor(seconds / 60);
    const secs = (seconds % 60).toFixed(1);
    if (mins > 0) {
      return `${mins}:${secs.padStart(4, '0')}`;
    }
    return `${secs}s`;
  };

  // Get filtered users/entries for selected group
  const getGroupFilteredUsers = () => {
    if (!selectedGroupId) return users;
    const group = groups.find(g => g.id === selectedGroupId);
    if (!group) return users;

    const filtered = {};
    group.memberIds?.forEach(id => {
      if (users[id]) {
        filtered[id] = users[id];
      }
    });
    return filtered;
  };

  const getGroupFilteredEntries = () => {
    if (!selectedGroupId) return entries;
    const group = groups.find(g => g.id === selectedGroupId);
    if (!group) return entries;

    return entries.filter(e => group.memberIds?.includes(e.userId));
  };

  // Upload profile picture
  const handleProfilePicUpload = async (event) => {
    const file = event.target.files[0];
    if (!file || !currentUser || !userProfile) return;

    setIsUploadingPhoto(true);

    try {
      // Convert to base64 data URL (simple solution without Firebase Storage)
      const reader = new FileReader();
      reader.onload = async (e) => {
        // Resize image to reduce storage size
        const img = new Image();
        img.onload = async () => {
          const canvas = document.createElement('canvas');
          const maxSize = 150;
          let width = img.width;
          let height = img.height;
          
          if (width > height) {
            if (width > maxSize) {
              height *= maxSize / width;
              width = maxSize;
            }
          } else {
            if (height > maxSize) {
              width *= maxSize / height;
              height = maxSize;
            }
          }
          
          canvas.width = width;
          canvas.height = height;
          const ctx = canvas.getContext('2d');
          ctx.drawImage(img, 0, 0, width, height);
          
          const resizedDataUrl = canvas.toDataURL('image/jpeg', 0.8);
          
          // Update user profile in Firestore
          const userRef = doc(db, 'users', currentUser.uid);
          await setDoc(userRef, {
            ...userProfile,
            photoURL: resizedDataUrl,
          }, { merge: true });
          
          setUserProfile(prev => ({ ...prev, photoURL: resizedDataUrl }));
          setIsUploadingPhoto(false);
        };
        img.src = e.target.result;
      };
      reader.readAsDataURL(file);
    } catch (error) {
      console.error('Error uploading profile picture:', error);
      setIsUploadingPhoto(false);
      alert('Failed to upload photo. Please try again.');
    }
    
    if (profilePicInputRef.current) {
      profilePicInputRef.current.value = '';
    }
  };

  // Recalculate user totals from entries (for data consistency)
  const recalculateUserTotals = async (userId) => {
    if (!userId) return;
    
    const userEntries = entries.filter(e => e.userId === userId);
    const totalMeters = userEntries.reduce((sum, e) => sum + (e.meters || 0), 0);
    const uploadCount = userEntries.length;
    
    const user = users[userId];
    if (!user) return;
    
    // Only update if different
    if (user.totalMeters !== totalMeters || user.uploadCount !== uploadCount) {
      try {
        const userRef = doc(db, 'users', userId);
        await setDoc(userRef, {
          ...user,
          totalMeters,
          uploadCount,
        }, { merge: true });
        console.log(`Recalculated totals for ${user.name}: ${totalMeters}m, ${uploadCount} sessions`);
      } catch (error) {
        console.error('Error recalculating totals:', error);
      }
    }
  };

  // Recalculate all users on entries change (admin function - access via console)
  // eslint-disable-next-line no-unused-vars
  const recalculateAllUsers = async () => {
    for (const userId of Object.keys(users)) {
      await recalculateUserTotals(userId);
    }
  };

  // Validate entry
  const validateEntry = async (meters) => {
    // Check meter range
    if (meters < MIN_METERS) {
      return `Minimum entry is ${MIN_METERS} meters`;
    }
    if (meters > MAX_METERS) {
      return `Maximum entry is ${MAX_METERS.toLocaleString()} meters per session. That's a lot of rowing!`;
    }

    // Check cooldown
    if (currentUser) {
      const recentQuery = query(
        collection(db, 'entries'),
        where('userId', '==', currentUser.uid),
        orderBy('date', 'desc'),
        limit(1)
      );
      
      const recentSnap = await getDocs(recentQuery);
      
      if (!recentSnap.empty) {
        const lastEntry = recentSnap.docs[0].data();
        const lastDate = new Date(lastEntry.date);
        const now = new Date();
        const diffMinutes = (now - lastDate) / (1000 * 60);
        
        if (diffMinutes < COOLDOWN_MINUTES) {
          const remaining = Math.ceil(COOLDOWN_MINUTES - diffMinutes);
          return `Please wait ${remaining} minute${remaining > 1 ? 's' : ''} between entries`;
        }
      }
    }

    return null;
  };

  // Preprocess image for OCR
  const preprocessImage = (imageSrc) => {
    return new Promise((resolve) => {
      const img = new Image();
      img.onload = () => {
        const canvas = canvasRef.current || document.createElement('canvas');
        const ctx = canvas.getContext('2d');
        
        const scale = Math.max(1, 1000 / Math.max(img.width, img.height));
        canvas.width = img.width * scale;
        canvas.height = img.height * scale;
        
        ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
        
        const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
        const data = imageData.data;
        
        for (let i = 0; i < data.length; i += 4) {
          const gray = 0.299 * data[i] + 0.587 * data[i + 1] + 0.114 * data[i + 2];
          const contrast = 1.5;
          const factor = (259 * (contrast * 255 + 255)) / (255 * (259 - contrast * 255));
          const newGray = Math.min(255, Math.max(0, factor * (gray - 128) + 128));
          const threshold = newGray > 127 ? 255 : 0;
          
          data[i] = threshold;
          data[i + 1] = threshold;
          data[i + 2] = threshold;
        }
        
        ctx.putImageData(imageData, 0, 0);
        resolve(canvas.toDataURL('image/png'));
      };
      img.src = imageSrc;
    });
  };

  // Extract meters from image
  const extractMetersFromImage = async (imageData) => {
    setProcessingStatus('Preprocessing image...');
    
    try {
      const processedImage = await preprocessImage(imageData);
      
      setProcessingStatus('Reading display...');
      
      const result = await Tesseract.recognize(processedImage, 'eng', {
        logger: (m) => {
          if (m.status === 'recognizing text') {
            setProcessingStatus(`Analyzing: ${Math.round(m.progress * 100)}%`);
          }
        },
      });

      const text = result.data.text;
      console.log('OCR Result:', text);
      
      const resultOriginal = await Tesseract.recognize(imageData, 'eng');
      const combinedText = text + ' ' + resultOriginal.data.text;

      const patterns = [
        /(\d{1,2}[,.]?\d{3})\s*m(?:eters?)?/i,
        /meters?\s*[:\s]*(\d{1,2}[,.]?\d{3})/i,
        /distance\s*[:\s]*(\d{1,2}[,.]?\d{3})/i,
        /total\s*[:\s]*(\d{1,2}[,.]?\d{3})/i,
        /(\d{1,2}[,]\d{3})/,
        /(\d{4,5})(?:\s*m|\s|$)/,
        /(\d{4,5})/,
      ];

      const foundNumbers = [];
      
      for (const pattern of patterns) {
        const matches = combinedText.matchAll(new RegExp(pattern, 'gi'));
        for (const match of matches) {
          const meters = parseInt(match[1].replace(/[,.\s]/g, ''), 10);
          if (meters >= MIN_METERS && meters <= MAX_METERS) {
            foundNumbers.push(meters);
          }
        }
      }

      if (foundNumbers.length > 0) {
        foundNumbers.sort((a, b) => {
          const aScore = (a >= 1000 && a <= 15000) ? 0 : 1;
          const bScore = (b >= 1000 && b <= 15000) ? 0 : 1;
          return aScore - bScore;
        });
        return foundNumbers[0];
      }

      return null;
    } catch (error) {
      console.error('OCR Error:', error);
      return null;
    }
  };

  // Handle image upload - verify with Claude first
  const handleImageUpload = async (event) => {
    const file = event.target.files[0];
    if (!file) return;

    setIsProcessing(true);
    setProcessingStatus('Reading image...');
    setValidationError('');

    const reader = new FileReader();
    reader.onload = async (e) => {
      const imageData = e.target.result;
      setCapturedImage(imageData);

      // Extract base64 for Claude verification
      const imageBase64 = imageData.split(',')[1];
      
      let claudeResult = null;
      let detectedMeterValue = null;
      
      // Try Claude verification first
      setProcessingStatus('AI analyzing image...');
      try {
        const verifyRowEntry = httpsCallable(functions, 'verifyRowEntry');
        const result = await verifyRowEntry({
          imageBase64,
          claimedMeters: 0, // We don't know yet, Claude will extract
        });
        claudeResult = result.data;
        
        // If Claude extracted meters successfully
        if (claudeResult.extractedMeters && claudeResult.confidence >= 60) {
          detectedMeterValue = claudeResult.extractedMeters;
          setProcessingStatus(`AI detected: ${detectedMeterValue}m`);
        } else if (claudeResult.extractedMeters) {
          // Low confidence but has a reading
          detectedMeterValue = claudeResult.extractedMeters;
          setProcessingStatus('AI detected meters (low confidence)');
        }
      } catch (verifyError) {
        console.error('Claude verification error:', verifyError);
        setProcessingStatus('AI unavailable, using OCR...');
        
        // Fallback to Tesseract OCR
        detectedMeterValue = await extractMetersFromImage(imageData);
      }

      setIsProcessing(false);
      
      // Store Claude result for later use
      setCapturedImage({ 
        data: imageData, 
        base64: imageBase64,
        claudeResult 
      });
      
      if (detectedMeterValue) {
        setDetectedMeters(detectedMeterValue.toString());
        setEditableMeters(detectedMeterValue.toString());
      } else {
        setDetectedMeters('');
        setEditableMeters('');
      }
      
      setShowConfirmModal(true);
    };
    reader.readAsDataURL(file);

    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  // Add entry to Firebase
  const addEntry = async (meters, imageData) => {
    if (!currentUser || !userProfile) return false;

    try {
      // Validate
      const error = await validateEntry(meters);
      if (error) {
        setValidationError(error);
        return false;
      }

      const entryId = `${Date.now()}_${currentUser.uid}`;
      let verification = { status: 'unverified' };
      let imageHash = null;

      // Use Claude result from image upload if available
      if (imageData && imageData.claudeResult) {
        const claudeResult = imageData.claudeResult;
        imageHash = claudeResult.imageHash;
        
        // Check if user's meters match what Claude saw
        if (claudeResult.extractedMeters) {
          const difference = Math.abs(meters - claudeResult.extractedMeters);
          const tolerance = claudeResult.extractedMeters * 0.10; // 10% tolerance
          
          if (difference <= tolerance && claudeResult.confidence >= 60) {
            // Meters match and good confidence - verified!
            verification = {
              status: 'verified',
              reason: 'AI verification passed',
              confidence: claudeResult.confidence,
              extractedMeters: claudeResult.extractedMeters,
              displayType: claudeResult.displayType,
            };
          } else if (difference > tolerance) {
            // Meters don't match - needs review
            verification = {
              status: 'pending_review',
              reason: `Entered ${meters}m but AI detected ${claudeResult.extractedMeters}m`,
              confidence: claudeResult.confidence,
              extractedMeters: claudeResult.extractedMeters,
              displayType: claudeResult.displayType,
            };
          } else {
            // Low confidence - needs review
            verification = {
              status: 'pending_review',
              reason: 'Low AI confidence - manual review required',
              confidence: claudeResult.confidence,
              extractedMeters: claudeResult.extractedMeters,
              displayType: claudeResult.displayType,
            };
          }
        } else if (!claudeResult.isRowingMachineDisplay) {
          // Not a rowing machine display
          verification = {
            status: 'pending_review',
            reason: 'Image does not appear to be a rowing machine display',
            confidence: 0,
          };
        } else {
          // Claude couldn't read meters
          verification = {
            status: 'pending_review',
            reason: 'AI could not read meters from display',
            confidence: claudeResult.confidence || 0,
            displayType: claudeResult.displayType,
          };
        }
      } else if (imageData) {
        // Image provided but no Claude result (fallback/error case)
        verification = {
          status: 'pending_review',
          reason: 'AI verification unavailable',
          confidence: 0,
        };
      }
      // If no image at all, stays as 'unverified'

      setProcessingStatus('Saving entry...');
      const entryRef = doc(db, 'entries', entryId);

      await setDoc(entryRef, {
        userId: currentUser.uid,
        meters: meters,
        date: new Date().toISOString(),
        createdAt: serverTimestamp(),
        verificationStatus: verification.status,
        verificationDetails: {
          confidence: verification.confidence || 0,
          extractedMeters: verification.extractedMeters || null,
          displayType: verification.displayType || null,
          reason: verification.reason || null,
          imageHash: imageHash,
        },
      });

      const userRef = doc(db, 'users', currentUser.uid);
      const finalMeters = meters;
      const newTotalMeters = (userProfile.totalMeters || 0) + finalMeters;
      await setDoc(userRef, {
        ...userProfile,
        totalMeters: newTotalMeters,
        uploadCount: (userProfile.uploadCount || 0) + 1,
        lastRowDate: new Date().toISOString(),
      }, { merge: true });

      // Check for Personal Record before adding to entries list
      const isPR = checkForPR(currentUser.uid, finalMeters);
      
      // Store for share card
      setLastSessionMeters(finalMeters);
      
      // Fire confetti for all entries (verified gets full, unverified gets smaller)
      if (verification.status === 'verified' || verification.status === 'pending_review') {
        fireConfetti();
      } else {
        // Smaller confetti for unverified manual entries
        fireConfetti(0.3);
      }
      
      // Show PR celebration if applicable
      if (isPR) {
        setTimeout(() => {
          firePRConfetti();
          setShowPRModal(finalMeters);
        }, 500);
      }

      // Check for new achievements and rank promotion (after a delay to let state update)
      setTimeout(async () => {
        await checkAndSaveNewAchievements(currentUser.uid);
        await checkAndSaveRankPromotion(currentUser.uid, newTotalMeters);
      }, 1000);
      
      return true;
    } catch (error) {
      console.error('Error adding entry:', error);
      
      // Check if it's a permission error (someone being sneaky)
      if (error.code === 'permission-denied' || 
          error.message?.includes('permission') ||
          error.message?.includes('PERMISSION_DENIED')) {
        setShowBustedModal(true);
        return false;
      }
      
      setValidationError('Failed to save entry. Please try again.');
      return false;
    }
  };

  // Handle manual meter entry (no photo)
  const handleManualSubmit = async () => {
    const meters = parseInt(manualMeters, 10);
    
    if (!meters || isNaN(meters)) {
      setValidationError('Please enter a valid number');
      return;
    }
    
    if (meters < 100 || meters > 30000) {
      setValidationError('Meters must be between 100 and 30,000');
      return;
    }

    setIsSubmittingManual(true);
    setValidationError('');
    
    // Add entry without image (will be marked as unverified)
    const success = await addEntry(meters, null);
    
    setIsSubmittingManual(false);
    
    if (success) {
      setManualMeters('');
      setValidationError('');
      // Show share modal without image
      setShareImageUrl(null);
      setShowShareModal(true);
      setLinkCopied(false);
    }
  };

  // Confirm entry
  const handleConfirmEntry = async () => {
    const meters = parseInt(editableMeters, 10);
    
    if (!meters || isNaN(meters)) {
      setValidationError('Please enter a valid number');
      return;
    }

    setIsProcessing(true);
    const success = await addEntry(meters, capturedImage);
    setIsProcessing(false);
    
    if (success) {
      setShowConfirmModal(false);
      setDetectedMeters('');
      setEditableMeters('');
      setValidationError('');
      setVerificationStatus(null);
      // Show share modal (use image data for share card)
      setShareImageUrl(capturedImage?.data || capturedImage);
      setShowShareModal(true);
      setLinkCopied(false);
    }
  };

  // Admin: Load pending reviews
  const loadPendingReviews = async () => {
    if (!isAdmin) return;
    
    try {
      const getPendingReviews = httpsCallable(functions, 'getPendingReviews');
      const result = await getPendingReviews();
      setPendingReviews(result.data.entries || []);
      
      const getVerificationStats = httpsCallable(functions, 'getVerificationStats');
      const statsResult = await getVerificationStats();
      setAdminStats(statsResult.data);
    } catch (error) {
      console.error('Error loading pending reviews:', error);
    }
  };

  // Admin: Approve or reject entry
  const handleReviewEntry = async (entryId, action) => {
    if (!isAdmin) return;
    
    try {
      const reviewEntry = httpsCallable(functions, 'reviewEntry');
      await reviewEntry({
        entryId,
        action,
        adjustedMeters: adjustedMeters ? parseInt(adjustedMeters, 10) : null,
        reviewNote,
      });
      
      // Refresh pending reviews
      await loadPendingReviews();
      setReviewingEntry(null);
      setAdjustedMeters('');
      setReviewNote('');
    } catch (error) {
      console.error('Error reviewing entry:', error);
      alert('Failed to process review');
    }
  };

  // Close share modal
  const handleCloseShare = () => {
    setShowShareModal(false);
    setShareImageUrl(null);
    setCapturedImage(null);
    setLastSessionMeters(0);
    setActiveTab('leaderboard');
  };

  // Copy share card as image
  const handleCopyLink = async () => {
    if (!shareCardRef.current || isCopying) return;
    
    setIsCopying(true);
    
    try {
      // Capture the share card as canvas
      const canvas = await html2canvas(shareCardRef.current, {
        backgroundColor: '#0d1220',
        scale: 2,
        useCORS: true,
        allowTaint: false,
        logging: false,
        imageTimeout: 5000,
        onclone: (clonedDoc) => {
          // Remove external images that might cause CORS issues
          const avatarImg = clonedDoc.querySelector('.share-user-avatar');
          if (avatarImg && avatarImg.src.includes('googleusercontent')) {
            // Replace with placeholder
            const placeholder = clonedDoc.createElement('div');
            placeholder.className = 'share-user-avatar-placeholder';
            placeholder.textContent = userProfile?.name?.charAt(0)?.toUpperCase() || '?';
            placeholder.style.cssText = 'width:36px;height:36px;border-radius:50%;background:linear-gradient(135deg,#00d4aa,#00b894);display:flex;align-items:center;justify-content:center;font-weight:700;color:#0a0e17;';
            avatarImg.parentNode.replaceChild(placeholder, avatarImg);
          }
        }
      });
      
      // Convert to blob
      const blob = await new Promise((resolve) => {
        canvas.toBlob(resolve, 'image/png', 1.0);
      });

      const file = new File([blob], 'row-crew-session.png', { type: 'image/png' });
      
      // Check if native share is available (mobile)
      if (navigator.share && navigator.canShare && navigator.canShare({ files: [file] })) {
        try {
          await navigator.share({
            files: [file],
            title: 'Row Crew Session',
            text: `🚣 Just rowed ${lastSessionMeters.toLocaleString()}m! Join us at rowcrew.netlify.app`,
          });
          setLinkCopied(true);
          setTimeout(() => setLinkCopied(false), 2000);
        } catch (shareError) {
          if (shareError.name !== 'AbortError') {
            console.log('Share failed, trying clipboard:', shareError);
            await copyToClipboard(blob, canvas);
          }
        }
      } else {
        // Desktop: copy to clipboard
        await copyToClipboard(blob, canvas);
      }
    } catch (error) {
      console.error('Failed to capture image:', error);
      // Fallback to text
      fallbackTextShare();
    }
    
    setIsCopying(false);
  };

  // Copy image to clipboard (desktop)
  const copyToClipboard = async (blob, canvas) => {
    if (navigator.clipboard && navigator.clipboard.write) {
      try {
        await navigator.clipboard.write([
          new ClipboardItem({ 'image/png': blob })
        ]);
        setLinkCopied(true);
        setTimeout(() => setLinkCopied(false), 2000);
      } catch (clipboardError) {
        console.log('Clipboard failed, downloading:', clipboardError);
        downloadImage(canvas);
      }
    } else {
      downloadImage(canvas);
    }
  };

  // Fallback text share
  const fallbackTextShare = async () => {
    const shareText = `🚣 Just rowed ${lastSessionMeters.toLocaleString()}m on Row Crew!\n🔥 ${calculateStreak(currentUser?.uid)} day streak\n📊 ${formatMeters((userProfile?.totalMeters || 0) + lastSessionMeters)} total\n\nJoin us! rowcrew.netlify.app`;
    
    if (navigator.share) {
      await navigator.share({ text: shareText });
    } else {
      await navigator.clipboard.writeText(shareText);
    }
    setLinkCopied(true);
    setTimeout(() => setLinkCopied(false), 2000);
  };

  // Download image as fallback
  const downloadImage = (canvas) => {
    const link = document.createElement('a');
    link.download = `row-crew-${new Date().toISOString().split('T')[0]}.png`;
    link.href = canvas.toDataURL('image/png');
    link.click();
    setLinkCopied(true);
    setTimeout(() => setLinkCopied(false), 2000);
  };

  // Calculate streak
  const calculateStreak = (userId) => {
    const userEntries = entries
      .filter((e) => e.userId === userId)
      .sort((a, b) => new Date(b.date) - new Date(a.date));

    if (userEntries.length === 0) return 0;

    let streak = 0;
    let currentDate = new Date();
    currentDate.setHours(0, 0, 0, 0);

    const entryDates = new Set(
      userEntries.map((e) => {
        const d = new Date(e.date);
        d.setHours(0, 0, 0, 0);
        return d.getTime();
      })
    );

    const today = currentDate.getTime();
    const yesterday = today - 86400000;

    if (!entryDates.has(today) && !entryDates.has(yesterday)) {
      return 0;
    }

    let checkDate = entryDates.has(today) ? today : yesterday;

    while (entryDates.has(checkDate)) {
      streak++;
      checkDate -= 86400000;
    }

    return streak;
  };

  // Calculate weekly average
  const calculateWeeklyAverage = (userId) => {
    const userEntries = entries.filter((e) => e.userId === userId);
    if (userEntries.length === 0) return 0;

    const dates = userEntries.map((e) => new Date(e.date));
    const firstDate = new Date(Math.min(...dates));
    const now = new Date();
    const weeks = Math.max(1, (now - firstDate) / (7 * 24 * 60 * 60 * 1000));

    const uniqueDays = new Set(
      userEntries.map((e) => new Date(e.date).toDateString())
    ).size;

    return (uniqueDays / weeks).toFixed(1);
  };

  // Get milestone progress
  const getCurrentMilestone = () => {
    const total = getTotalMeters();
    const nextMilestone = MILESTONES.find((m) => m.meters > total);
    const prevMilestone = MILESTONES.slice().reverse().find((m) => m.meters <= total);
    return { current: prevMilestone, next: nextMilestone, total };
  };

  // Format meters
  const formatMeters = (meters) => {
    if (meters >= 1000000) return `${(meters / 1000000).toFixed(1)}M`;
    if (meters >= 1000) return `${(meters / 1000).toFixed(1)}k`;
    return meters.toString();
  };

  // Format time ago
  const formatTimeAgo = (date) => {
    const seconds = Math.floor((new Date() - date) / 1000);
    
    if (seconds < 60) return 'just now';
    if (seconds < 3600) return `${Math.floor(seconds / 60)}m ago`;
    if (seconds < 86400) return `${Math.floor(seconds / 3600)}h ago`;
    if (seconds < 604800) return `${Math.floor(seconds / 86400)}d ago`;
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  };

  // Get leaderboard
  const getLeaderboard = () => {
    const filteredUsers = getGroupFilteredUsers();
    return Object.values(filteredUsers)
      .map((user) => ({
        ...user,
        streak: calculateStreak(user.id),
        weeklyAvg: calculateWeeklyAverage(user.id),
        avgPerUpload: user.uploadCount > 0 ? Math.round(user.totalMeters / user.uploadCount) : 0,
        rank: getUserRank(user.totalMeters),
        achievementCount: getUserAchievementCount(user.id),
      }))
      .sort((a, b) => b.totalMeters - a.totalMeters);
  };

  // Get weekly leaderboard (this week's meters only)
  const getWeeklyLeaderboard = () => {
    const filteredUsers = getGroupFilteredUsers();
    const filteredEntries = getGroupFilteredEntries();
    const now = new Date();
    const startOfWeek = new Date(now);
    startOfWeek.setDate(now.getDate() - now.getDay()); // Sunday
    startOfWeek.setHours(0, 0, 0, 0);
    
    const weeklyTotals = {};
    filteredEntries.forEach(entry => {
      const entryDate = new Date(entry.date);
      if (entryDate >= startOfWeek) {
        weeklyTotals[entry.userId] = (weeklyTotals[entry.userId] || 0) + entry.meters;
      }
    });
    
    return Object.values(filteredUsers)
      .map((user) => ({
        ...user,
        weeklyMeters: weeklyTotals[user.id] || 0,
        rank: getUserRank(user.totalMeters),
      }))
      .filter(u => u.weeklyMeters > 0)
      .sort((a, b) => b.weeklyMeters - a.weeklyMeters);
  };

  // Get streak leaderboard
  const getStreakLeaderboard = () => {
    const filteredUsers = getGroupFilteredUsers();
    return Object.values(filteredUsers)
      .map((user) => ({
        ...user,
        streak: calculateStreak(user.id),
        longestStreak: calculateLongestStreak(user.id),
        rank: getUserRank(user.totalMeters),
      }))
      .filter(u => u.streak > 0 || u.longestStreak > 0)
      .sort((a, b) => b.streak - a.streak || b.longestStreak - a.longestStreak);
  };

  // Get achievements leaderboard
  const getAchievementsLeaderboard = () => {
    const filteredUsers = getGroupFilteredUsers();
    return Object.values(filteredUsers)
      .map((user) => ({
        ...user,
        achievementCount: getUserAchievementCount(user.id),
        rank: getUserRank(user.totalMeters),
      }))
      .filter(u => u.achievementCount > 0)
      .sort((a, b) => b.achievementCount - a.achievementCount);
  };

  // Get user's achievement count
  const getUserAchievementCount = (userId) => {
    const user = users[userId];
    if (!user) return 0;
    const userEntries = entries.filter(e => e.userId === userId);
    const streak = calculateStreak(userId);
    return ACHIEVEMENTS.filter(a => a.check(user, userEntries, streak)).length;
  };

  // Calculate longest streak ever for a user
  const calculateLongestStreak = (userId) => {
    const userEntries = entries
      .filter(e => e.userId === userId)
      .sort((a, b) => new Date(a.date) - new Date(b.date));
    
    if (userEntries.length === 0) return 0;
    
    let longestStreak = 1;
    let currentStreak = 1;
    
    for (let i = 1; i < userEntries.length; i++) {
      const prevDate = new Date(userEntries[i-1].date);
      const currDate = new Date(userEntries[i].date);
      prevDate.setHours(0, 0, 0, 0);
      currDate.setHours(0, 0, 0, 0);
      
      const dayDiff = (currDate - prevDate) / (1000 * 60 * 60 * 24);
      
      if (dayDiff === 1) {
        currentStreak++;
        longestStreak = Math.max(longestStreak, currentStreak);
      } else if (dayDiff > 1) {
        currentStreak = 1;
      }
    }
    
    return longestStreak;
  };

  // Get user's session history
  const getUserSessionHistory = (userId) => {
    return entries
      .filter(e => e.userId === userId)
      .sort((a, b) => new Date(b.date) - new Date(a.date));
  };

  // Get user's rank based on total meters
  const getUserRank = (totalMeters) => {
    for (let i = RANKS.length - 1; i >= 0; i--) {
      if (totalMeters >= RANKS[i].minMeters) {
        return RANKS[i];
      }
    }
    return RANKS[0];
  };

  // Get next rank
  const getNextRank = (totalMeters) => {
    for (let i = 0; i < RANKS.length; i++) {
      if (totalMeters < RANKS[i].minMeters) {
        return RANKS[i];
      }
    }
    return null;
  };

  // Get user's achievements with progress
  const getUserAchievements = (userId) => {
    const user = users[userId];
    if (!user) return [];
    
    const userEntries = entries.filter(e => e.userId === userId);
    const streak = calculateStreak(userId);
    
    return ACHIEVEMENTS.filter(a => a.check(user, userEntries, streak)).map(a => ({
      ...a,
      progress: a.getProgress(user, userEntries, streak),
      unlockedDate: user.unlockedAchievements?.[a.id] || null,
    }));
  };

  // Get achievement progress for a user (including locked ones)
  const getAchievementProgress = (userId, achievement) => {
    const user = users[userId];
    if (!user) return { current: 0, target: 1 };
    
    const userEntries = entries.filter(e => e.userId === userId);
    const streak = calculateStreak(userId);
    
    return achievement.getProgress(user, userEntries, streak);
  };

  // Check and save new achievements
  const checkAndSaveNewAchievements = async (userId) => {
    const user = users[userId];
    if (!user) return [];
    
    const userEntries = entries.filter(e => e.userId === userId);
    const streak = calculateStreak(userId);
    const existingAchievements = user.unlockedAchievements || {};
    
    const newlyUnlocked = [];
    const updatedAchievements = { ...existingAchievements };
    
    for (const achievement of ACHIEVEMENTS) {
      if (!existingAchievements[achievement.id] && achievement.check(user, userEntries, streak)) {
        updatedAchievements[achievement.id] = new Date().toISOString();
        newlyUnlocked.push(achievement);
      }
    }
    
    if (newlyUnlocked.length > 0) {
      try {
        const userRef = doc(db, 'users', userId);
        await setDoc(userRef, { unlockedAchievements: updatedAchievements }, { merge: true });
      } catch (error) {
        console.error('Error saving achievements:', error);
      }
    }
    
    return newlyUnlocked;
  };

  // Check and save rank promotion
  const checkAndSaveRankPromotion = async (userId, newTotalMeters) => {
    const user = users[userId];
    if (!user) return null;
    
    const oldRank = getUserRank(user.totalMeters || 0);
    const newRank = getUserRank(newTotalMeters);
    
    if (newRank.title !== oldRank.title && newRank.minMeters > oldRank.minMeters) {
      try {
        const userRef = doc(db, 'users', userId);
        const rankHistory = user.rankHistory || [];
        rankHistory.push({
          rank: newRank.title,
          emoji: newRank.emoji,
          date: new Date().toISOString(),
        });
        await setDoc(userRef, { 
          currentRank: newRank.title,
          rankHistory 
        }, { merge: true });
        return newRank;
      } catch (error) {
        console.error('Error saving rank promotion:', error);
      }
    }
    return null;
  };

  // Get user's personal record
  const getPersonalRecord = (userId) => {
    const userEntries = entries.filter(e => e.userId === userId);
    if (userEntries.length === 0) return 0;
    return Math.max(...userEntries.map(e => e.meters));
  };

  // Get total unique days rowed
  const getTotalDaysRowed = (userId) => {
    const userEntries = entries.filter(e => e.userId === userId);
    const uniqueDays = new Set(userEntries.map(e => new Date(e.date).toDateString()));
    return uniqueDays.size;
  };

  // Get first row date
  const getFirstRowDate = (userId) => {
    const userEntries = entries
      .filter(e => e.userId === userId)
      .sort((a, b) => new Date(a.date) - new Date(b.date));
    
    if (userEntries.length === 0) return null;
    return new Date(userEntries[0].date);
  };

  // Check if this session is a PR
  const checkForPR = (userId, newMeters) => {
    const currentPR = getPersonalRecord(userId);
    return newMeters > currentPR && currentPR > 0;
  };

  // Get activity feed (last 20 entries across all users, with optional filter)
  const getActivityFeed = (filterQuery = '', page = 1) => {
    const filteredUsers = getGroupFilteredUsers();
    const filteredEntries = getGroupFilteredEntries();
    
    // Get row entries
    let feedItems = filteredEntries.map(entry => ({
      ...entry,
      type: 'row',
      user: filteredUsers[entry.userId],
      sortDate: new Date(entry.date),
    })).filter(entry => entry.user);

    // Add achievement unlocks from filtered users
    Object.values(filteredUsers).forEach(user => {
      if (user.unlockedAchievements) {
        Object.entries(user.unlockedAchievements).forEach(([achievementId, dateStr]) => {
          const achievement = ACHIEVEMENTS.find(a => a.id === achievementId);
          if (achievement) {
            feedItems.push({
              id: `achievement-${user.id}-${achievementId}`,
              type: 'achievement',
              userId: user.id,
              user,
              achievement,
              date: dateStr,
              sortDate: new Date(dateStr),
            });
          }
        });
      }
      
      // Add rank promotions
      if (user.rankHistory) {
        user.rankHistory.forEach((rankEvent, index) => {
          feedItems.push({
            id: `rank-${user.id}-${index}`,
            type: 'rank',
            userId: user.id,
            user,
            rank: rankEvent,
            date: rankEvent.date,
            sortDate: new Date(rankEvent.date),
          });
        });
      }

      // Add new user join events
      if (user.createdAt) {
        const joinDate = user.createdAt.toDate ? user.createdAt.toDate() : new Date(user.createdAt);
        feedItems.push({
          id: `join-${user.id}`,
          type: 'join',
          userId: user.id,
          user,
          date: joinDate.toISOString(),
          sortDate: joinDate,
        });
      }
    });

    // Sort by date descending
    feedItems.sort((a, b) => b.sortDate - a.sortDate);

    // Filter by search query
    if (filterQuery.trim()) {
      const q = filterQuery.toLowerCase();
      feedItems = feedItems.filter(item => 
        item.user?.name?.toLowerCase().includes(q)
      );
    }

    // Return paginated results
    const startIndex = 0;
    const endIndex = page * FEED_PAGE_SIZE;
    const hasMore = feedItems.length > endIndex;
    
    return {
      items: feedItems.slice(startIndex, endIndex),
      hasMore,
      total: feedItems.length,
    };
  };

  // Calculate 2025 Wrapped stats
  const getWrappedStats = (userId) => {
    if (!userId) return null;
    
    const year = 2025;
    const yearStart = new Date(year, 0, 1);
    const yearEnd = new Date(year, 11, 31, 23, 59, 59);
    
    // Get all 2025 entries for this user
    const yearEntries = entries
      .filter(e => e.userId === userId)
      .filter(e => {
        const d = new Date(e.date);
        return d >= yearStart && d <= yearEnd;
      })
      .sort((a, b) => new Date(a.date) - new Date(b.date));
    
    if (yearEntries.length === 0) {
      // Return default stats for users with no 2025 data
      return {
        totalMeters: 0,
        sessionCount: 0,
        bestRow: 0,
        bestRowDate: null,
        bestStreak: 0,
        favoriteDay: 'Any day',
        favoriteDayCount: 0,
        bestMonth: 'the new year',
        bestMonthMeters: 0,
        monthMeters: Array(12).fill(0),
        achievementsUnlocked: [],
        startRank: getUserRank(0),
        currentRank: getUserRank(users[userId]?.totalMeters || 0),
        rankImproved: false,
        topPercentage: 100,
        bridgeCrossings: 0,
        marathonCount: '0',
        everestClimbs: '0',
        firstRowDate: null,
        daysRowed: 0,
        hasData: false,
      };
    }
    
    // Total meters
    const totalMeters = yearEntries.reduce((sum, e) => sum + e.meters, 0);
    
    // Session count
    const sessionCount = yearEntries.length;
    
    // Best single row
    const bestRow = Math.max(...yearEntries.map(e => e.meters));
    const bestRowEntry = yearEntries.find(e => e.meters === bestRow);
    const bestRowDate = bestRowEntry ? new Date(bestRowEntry.date) : null;
    
    // Calculate best streak in 2025
    const uniqueDays = [...new Set(yearEntries.map(e => 
      new Date(e.date).toDateString()
    ))].sort((a, b) => new Date(a) - new Date(b));
    
    let bestStreak = 1;
    let currentStreak = 1;
    for (let i = 1; i < uniqueDays.length; i++) {
      const prev = new Date(uniqueDays[i - 1]);
      const curr = new Date(uniqueDays[i]);
      const diff = Math.round((curr - prev) / (1000 * 60 * 60 * 24));
      if (diff === 1) {
        currentStreak++;
        bestStreak = Math.max(bestStreak, currentStreak);
      } else {
        currentStreak = 1;
      }
    }
    
    // Favorite day of week
    const dayCount = [0, 0, 0, 0, 0, 0, 0]; // Sun-Sat
    yearEntries.forEach(e => {
      dayCount[new Date(e.date).getDay()]++;
    });
    const favoriteDayIndex = dayCount.indexOf(Math.max(...dayCount));
    const dayNames = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
    const favoriteDay = dayNames[favoriteDayIndex];
    
    // Most active month
    const monthCount = Array(12).fill(0);
    const monthMeters = Array(12).fill(0);
    yearEntries.forEach(e => {
      const month = new Date(e.date).getMonth();
      monthCount[month]++;
      monthMeters[month] += e.meters;
    });
    const bestMonthIndex = monthMeters.indexOf(Math.max(...monthMeters));
    const monthNames = ['January', 'February', 'March', 'April', 'May', 'June', 
                        'July', 'August', 'September', 'October', 'November', 'December'];
    const bestMonth = monthNames[bestMonthIndex];
    const bestMonthMeters = monthMeters[bestMonthIndex];
    
    // Achievements unlocked in 2025
    const user = users[userId];
    const achievementsUnlocked = user?.unlockedAchievements 
      ? Object.entries(user.unlockedAchievements)
          .filter(([_, date]) => {
            const d = new Date(date);
            return d >= yearStart && d <= yearEnd;
          })
          .map(([id]) => ACHIEVEMENTS.find(a => a.id === id))
          .filter(Boolean)
      : [];
    
    // Rank journey - get first and current rank
    const firstEntryMeters = yearEntries.length > 0 ? yearEntries[0].meters : 0;
    const userTotalAtStart = (user?.totalMeters || 0) - totalMeters + firstEntryMeters;
    const startRank = getUserRank(Math.max(0, userTotalAtStart));
    const currentRank = getUserRank(user?.totalMeters || 0);
    const rankImproved = startRank.title !== currentRank.title;
    
    // Top percentage among all rowers
    const allUserMeters = Object.values(users)
      .map(u => u.totalMeters || 0)
      .filter(m => m > 0)
      .sort((a, b) => b - a);
    const userRankIndex = allUserMeters.findIndex(m => m <= (user?.totalMeters || 0));
    const topPercentage = allUserMeters.length > 0 
      ? Math.max(1, Math.round((userRankIndex + 1) / allUserMeters.length * 100))
      : 50;
    
    // Fun equivalents
    const goldenGateBridge = 2737; // meters
    const marathons = 42195; // meters
    const everestHeight = 8849; // meters
    
    const bridgeCrossings = Math.floor(totalMeters / goldenGateBridge);
    const marathonCount = (totalMeters / marathons).toFixed(1);
    const everestClimbs = (totalMeters / everestHeight).toFixed(1);
    
    // First row date
    const firstRowDate = yearEntries.length > 0 ? new Date(yearEntries[0].date) : null;
    
    // Days rowed
    const daysRowed = uniqueDays.length;
    
    return {
      totalMeters,
      sessionCount,
      bestRow,
      bestRowDate,
      bestStreak,
      favoriteDay,
      favoriteDayCount: dayCount[favoriteDayIndex],
      bestMonth,
      bestMonthMeters,
      monthMeters,
      achievementsUnlocked,
      startRank,
      currentRank,
      rankImproved,
      topPercentage,
      bridgeCrossings,
      marathonCount,
      everestClimbs,
      firstRowDate,
      daysRowed,
      hasData: true,
    };
  };

  // Get weekly stats for current user
  const getWeeklyStats = (userId) => {
    const now = new Date();
    const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    const twoWeeksAgo = new Date(now.getTime() - 14 * 24 * 60 * 60 * 1000);
    
    const userEntries = entries.filter(e => e.userId === userId);
    
    const thisWeek = userEntries.filter(e => new Date(e.date) >= weekAgo);
    const lastWeek = userEntries.filter(e => new Date(e.date) >= twoWeeksAgo && new Date(e.date) < weekAgo);
    
    const thisWeekMeters = thisWeek.reduce((sum, e) => sum + e.meters, 0);
    const lastWeekMeters = lastWeek.reduce((sum, e) => sum + e.meters, 0);
    
    const percentChange = lastWeekMeters > 0 
      ? Math.round(((thisWeekMeters - lastWeekMeters) / lastWeekMeters) * 100)
      : thisWeekMeters > 0 ? 100 : 0;
    
    return {
      meters: thisWeekMeters,
      sessions: thisWeek.length,
      percentChange,
      isUp: percentChange >= 0,
    };
  };

  // Fire confetti celebration
  const fireConfetti = (scale = 1) => {
    const duration = Math.round(2000 * scale);
    const particleCount = Math.max(1, Math.round(3 * scale));
    const end = Date.now() + duration;

    const frame = () => {
      confetti({
        particleCount: particleCount,
        angle: 60,
        spread: 55,
        origin: { x: 0, y: 0.7 },
        colors: ['#00d4aa', '#00ffcc', '#ffd700', '#ff6b35'],
      });
      confetti({
        particleCount: particleCount,
        angle: 120,
        spread: 55,
        origin: { x: 1, y: 0.7 },
        colors: ['#00d4aa', '#00ffcc', '#ffd700', '#ff6b35'],
      });

      if (Date.now() < end) {
        requestAnimationFrame(frame);
      }
    };
    frame();
  };

  // Big confetti for PR
  const firePRConfetti = () => {
    confetti({
      particleCount: 150,
      spread: 100,
      origin: { y: 0.6 },
      colors: ['#ffd700', '#ffec8b', '#fff8dc', '#00d4aa'],
    });
  };

  // Set daily quote on load
  useEffect(() => {
    const today = new Date().toDateString();
    const storedDate = localStorage.getItem('quoteDate');
    const storedQuote = localStorage.getItem('dailyQuote');
    
    if (storedDate === today && storedQuote) {
      setDailyQuote(JSON.parse(storedQuote));
    } else {
      const quote = QUOTES[Math.floor(Math.random() * QUOTES.length)];
      setDailyQuote(quote);
      localStorage.setItem('quoteDate', today);
      localStorage.setItem('dailyQuote', JSON.stringify(quote));
    }
  }, []);

  const milestoneProgress = getCurrentMilestone();
  const totalMeters = getTotalMeters();
  const worldProgress = (totalMeters / WORLD_CIRCUMFERENCE) * 100;

  // Auth loading state
  if (authLoading) {
    return (
      <div className="app">
        <div className="loading-screen">
          <div className="spinner" />
          <p>Loading...</p>
        </div>
      </div>
    );
  }

  // Loading data
  if (isLoading) {
    return (
      <div className="app">
        <div className="loading-screen">
          <div className="spinner" />
          <p>Loading Row Crew...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="app">
      <canvas ref={canvasRef} style={{ display: 'none' }} />

      {/* Milestone Celebration */}
      {recentMilestone && (
        <div className="milestone-celebration" onClick={() => setRecentMilestone(null)}>
          <div className="milestone-content">
            <span className="milestone-icon">🏆</span>
            <h2>MILESTONE ACHIEVED!</h2>
            <p className="milestone-label">{recentMilestone.label}</p>
            <p className="milestone-comparison">{recentMilestone.comparison}</p>
          </div>
        </div>
      )}

      {/* Header */}
      <header className="header">
        <div className="header-top">
          <h1>ROW CREW</h1>
          <div className="user-menu">
            {currentUser && userProfile ? (
              <>
                {isAdmin && (
                  <button 
                    className="admin-btn-header" 
                    onClick={() => { setShowAdminPanel(true); loadPendingReviews(); }}
                    title="Admin Panel"
                  >
                    🛡️
                  </button>
                )}
                {userProfile.photoURL && (
                  <img src={userProfile.photoURL} alt="" className="user-avatar" onClick={() => setShowSettingsModal(true)} />
                )}
                <button className="settings-btn" onClick={() => setShowSettingsModal(true)}>⚙️</button>
              </>
            ) : (
              <button className="signin-header-btn" onClick={handleSignIn}>Sign In</button>
            )}
          </div>
        </div>
        <p className="subtitle">Row Around The World Together</p>
      </header>

      {/* World Progress */}
      <section className="world-progress">
        <div className="world-stats">
          <div className="world-total">
            <span className="world-number">{formatMeters(totalMeters)}</span>
            <span className="world-label">meters rowed</span>
          </div>
          <div className="world-percentage">
            <span className="percentage-number">{worldProgress.toFixed(2)}%</span>
            <span className="percentage-label">around the world</span>
          </div>
        </div>
        <div className="progress-bar-container">
          <div className="progress-bar" style={{ width: `${Math.min(worldProgress, 100)}%` }} />
        </div>
        {milestoneProgress.next && (
          <p className="next-milestone">
            Next: {milestoneProgress.next.label} — {formatMeters(milestoneProgress.next.meters - totalMeters)} to go!
          </p>
        )}
        {milestoneProgress.current && (
          <p className="current-achievement">{milestoneProgress.current.comparison}</p>
        )}
      </section>

      {/* Tabs */}
      <nav className="tabs">
        {currentUser && userProfile && (
          <button className={`tab ${activeTab === 'upload' ? 'active' : ''}`} onClick={() => setActiveTab('upload')}>
            📸 Log
          </button>
        )}
        <button className={`tab ${activeTab === 'feed' ? 'active' : ''}`} onClick={() => setActiveTab('feed')}>
          📣 Feed
        </button>
        <button className={`tab ${activeTab === 'leaderboard' ? 'active' : ''}`} onClick={() => setActiveTab('leaderboard')}>
          🏆 Board
        </button>
        <button className={`tab ${activeTab === 'more' ? 'active' : ''}`} onClick={() => setActiveTab('more')}>
          🏅 More
        </button>
      </nav>

      {/* Group Selector */}
      {currentUser && userProfile && (
        <div className="group-selector-container">
          <button 
            className="group-selector-btn"
            onClick={() => setShowGroupSelector(!showGroupSelector)}
          >
            <span className="group-selector-icon">
              {selectedGroupId ? '👥' : '🌍'}
            </span>
            <span className="group-selector-name">
              {selectedGroupId ? getSelectedGroup()?.name || 'Group' : 'Everyone'}
            </span>
            <span className="group-selector-arrow">{showGroupSelector ? '▲' : '▼'}</span>
          </button>

          {showGroupSelector && (
            <>
              <div 
                className="group-selector-backdrop"
                onClick={() => setShowGroupSelector(false)}
              />
              <div className="group-selector-dropdown">
              <button 
                className={`group-option ${!selectedGroupId ? 'active' : ''}`}
                onClick={() => { setSelectedGroupId(null); setShowGroupSelector(false); }}
              >
                <span>🌍</span>
                <span>Everyone</span>
                {!selectedGroupId && <span className="check">✓</span>}
              </button>
              
              {groups.map(group => (
                <button 
                  key={group.id}
                  className={`group-option ${selectedGroupId === group.id ? 'active' : ''}`}
                  onClick={() => { setSelectedGroupId(group.id); setShowGroupSelector(false); }}
                >
                  <span>👥</span>
                  <span>{group.name}</span>
                  <span className="group-member-count">{group.memberIds?.length || 0}</span>
                  {selectedGroupId === group.id && <span className="check">✓</span>}
                </button>
              ))}

              <div className="group-selector-actions">
                <button 
                  className="group-action-btn"
                  onClick={() => { setShowCreateGroupModal(true); setShowGroupSelector(false); }}
                >
                  ➕ Create Group
                </button>
                <button 
                  className="group-action-btn"
                  onClick={() => { setShowJoinGroupModal(true); setShowGroupSelector(false); }}
                >
                  🔗 Join Group
                </button>
              </div>
            </div>
            </>
          )}
        </div>
      )}

      {/* Main Content */}
      <main className="main-content">
        {activeTab === 'upload' && (
          <section className="upload-section">
            {/* Motivational Quote */}
            {dailyQuote && (
              <div className="daily-quote">
                <p className="quote-text">"{dailyQuote.text}"</p>
                <p className="quote-author">— {dailyQuote.author}</p>
              </div>
            )}

            {/* User Rank & Weekly Stats */}
            {userProfile && (
              <div className="user-status-card">
                <div 
                  className="user-rank-display clickable"
                  onClick={() => setShowRankProgressModal(true)}
                >
                  <span className="rank-emoji">{getUserRank(userProfile.totalMeters).emoji}</span>
                  <div className="rank-info">
                    <span className="rank-title">{getUserRank(userProfile.totalMeters).title}</span>
                    {getNextRank(userProfile.totalMeters) && (
                      <span className="rank-next">
                        {formatMeters(getNextRank(userProfile.totalMeters).minMeters - userProfile.totalMeters)}m to {getNextRank(userProfile.totalMeters).title}
                      </span>
                    )}
                  </div>
                  <span className="rank-tap-hint">Tap for all ranks →</span>
                </div>
                <div className="weekly-stats-mini">
                  <div className="weekly-stat">
                    <span className="weekly-stat-value">{formatMeters(getWeeklyStats(currentUser?.uid).meters)}</span>
                    <span className="weekly-stat-label">this week</span>
                  </div>
                  <div className="weekly-stat">
                    <span className={`weekly-stat-change ${getWeeklyStats(currentUser?.uid).isUp ? 'up' : 'down'}`}>
                      {getWeeklyStats(currentUser?.uid).isUp ? '↑' : '↓'} {Math.abs(getWeeklyStats(currentUser?.uid).percentChange)}%
                    </span>
                    <span className="weekly-stat-label">vs last week</span>
                  </div>
                </div>
              </div>
            )}

            <div className="upload-card">
              <h2>Log Your Row</h2>
              <p>Take a photo of your rowing machine display</p>

              <label className="upload-button">
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  capture="environment"
                  onChange={handleImageUpload}
                  disabled={isProcessing || !userProfile}
                />
                <span className="upload-icon">📷</span>
                <span>{isProcessing ? processingStatus : 'Take Photo'}</span>
              </label>

              {isProcessing && (
                <div className="processing-indicator">
                  <div className="spinner" />
                  <p>{processingStatus}</p>
                </div>
              )}

              <div className="entry-limits">
                <p>📏 {MIN_METERS.toLocaleString()} - {MAX_METERS.toLocaleString()} meters per entry</p>
                <p>⏱️ {COOLDOWN_MINUTES} minute cooldown between entries</p>
              </div>

              {/* Divider */}
              <div className="upload-divider">
                <span>or enter manually</span>
              </div>

              {/* Manual Entry */}
              <div className="manual-entry">
                <div className="manual-entry-input">
                  <input
                    type="number"
                    placeholder="Enter meters"
                    value={manualMeters}
                    onChange={(e) => setManualMeters(e.target.value)}
                    disabled={isSubmittingManual || !userProfile}
                    min={MIN_METERS}
                    max={MAX_METERS}
                  />
                  <button 
                    className="manual-submit-btn"
                    onClick={handleManualSubmit}
                    disabled={isSubmittingManual || !userProfile || !manualMeters}
                  >
                    {isSubmittingManual ? 'Saving...' : 'Log'}
                  </button>
                </div>
                <p className="manual-entry-note">
                  ⚠️ Manual entries are marked as unverified
                </p>
              </div>

              {validationError && (
                <div className="validation-error">{validationError}</div>
              )}
            </div>

            {/* Personal Record Display */}
            {userProfile && getPersonalRecord(currentUser?.uid) > 0 && (
              <div className="pr-display">
                <span className="pr-label">🏆 Personal Record</span>
                <span className="pr-value">{getPersonalRecord(currentUser?.uid).toLocaleString()}m</span>
              </div>
            )}
          </section>
        )}

        {/* Activity Feed Tab */}
        {activeTab === 'feed' && (
          <section className="feed-section">
            <h2>
              {selectedGroupId ? `${getSelectedGroup()?.name || 'Group'} Feed` : 'Activity Feed'}
            </h2>
            
            {/* 2025 Wrapped Banner */}
            {currentUser && !wrappedDismissed && !selectedGroupId && getWrappedStats(currentUser.uid) && (
              <div className="wrapped-banner">
                <div className="wrapped-banner-content">
                  <span className="wrapped-banner-icon">🎁</span>
                  <div className="wrapped-banner-text">
                    <strong>Your 2025 Wrapped is here!</strong>
                    <span>See your year in rowing</span>
                  </div>
                </div>
                <div className="wrapped-banner-actions">
                  <button 
                    className="wrapped-banner-view"
                    onClick={() => setShowWrapped(true)}
                  >
                    View
                  </button>
                  <button 
                    className="wrapped-banner-dismiss"
                    onClick={() => {
                      setWrappedDismissed(true);
                      localStorage.setItem('wrappedDismissed2025', 'true');
                    }}
                  >
                    ✕
                  </button>
                </div>
              </div>
            )}

            {/* Group Info & Challenges (when group selected) */}
            {selectedGroupId && getSelectedGroup() && (
              <div className="group-info-section">
                {/* Group Header */}
                <div className="group-header-card">
                  <div className="group-header-info">
                    <h3>{getSelectedGroup()?.name}</h3>
                    {getSelectedGroup()?.description && (
                      <p className="group-description">{getSelectedGroup().description}</p>
                    )}
                    <div className="group-meta">
                      <span>👥 {getSelectedGroup()?.memberIds?.length || 0} members</span>
                      <span className="group-code">Code: {getSelectedGroup()?.inviteCode}</span>
                    </div>
                  </div>
                  <div className="group-header-actions">
                    {isGroupAdmin(selectedGroupId) && (
                      <button 
                        className="group-add-challenge-btn"
                        onClick={() => setShowCreateChallengeModal(true)}
                      >
                        ➕ Challenge
                      </button>
                    )}
                    <button 
                      className="group-leave-btn"
                      onClick={() => {
                        if (window.confirm('Are you sure you want to leave this group?')) {
                          handleLeaveGroup(selectedGroupId);
                        }
                      }}
                    >
                      Leave
                    </button>
                  </div>
                </div>

                {/* Active Challenges */}
                {challenges.length > 0 && (
                  <div className="challenges-section">
                    <h4>Challenges</h4>
                    <div className="challenges-list">
                      {challenges.map(challenge => {
                        const status = getChallengeStatus(challenge);
                        const progress = getChallengeProgress(challenge);
                        
                        return (
                          <div 
                            key={challenge.id} 
                            className={`challenge-card challenge-${status}`}
                            onClick={() => setShowChallengeDetail(challenge)}
                          >
                            <div className="challenge-card-header">
                              <span className="challenge-type-icon">
                                {challenge.type === 'collective' && '🎯'}
                                {challenge.type === 'time_trial' && '⏱️'}
                                {challenge.type === 'distance_race' && '🏃'}
                                {challenge.type === 'streak' && '🔥'}
                                {challenge.type === 'sessions' && '📅'}
                              </span>
                              <span className="challenge-name">{challenge.name}</span>
                              <span className={`challenge-status-badge ${status}`}>
                                {status === 'active' && '🟢 Active'}
                                {status === 'upcoming' && '🟡 Upcoming'}
                                {status === 'completed' && '✅ Done'}
                              </span>
                            </div>
                            
                            {challenge.type === 'collective' && progress && (
                              <div className="challenge-progress">
                                <div className="challenge-progress-bar">
                                  <div 
                                    className="challenge-progress-fill"
                                    style={{ width: `${progress.percentage}%` }}
                                  />
                                </div>
                                <div className="challenge-progress-text">
                                  {formatMeters(progress.current)} / {formatMeters(progress.target)}
                                </div>
                              </div>
                            )}

                            {challenge.type === 'time_trial' && (
                              <div className="challenge-time-trial-info">
                                <span>{challenge.targetDistance}m time trial</span>
                                {challenge.participants?.[currentUser?.uid] && (
                                  <span className="your-time">
                                    Your best: {formatTime(challenge.participants[currentUser.uid].bestTime)}
                                  </span>
                                )}
                              </div>
                            )}

                            <div className="challenge-dates">
                              {new Date(challenge.startDate).toLocaleDateString()} - {new Date(challenge.endDate).toLocaleDateString()}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}

                {challenges.length === 0 && isGroupAdmin(selectedGroupId) && (
                  <div className="no-challenges">
                    <p>No challenges yet!</p>
                    <button 
                      className="create-first-challenge-btn"
                      onClick={() => setShowCreateChallengeModal(true)}
                    >
                      Create First Challenge
                    </button>
                  </div>
                )}
              </div>
            )}
            
            {/* Search Bar */}
            <div className="search-bar">
              <span className="search-icon">🔍</span>
              <input
                type="text"
                placeholder="Search rowers..."
                value={feedSearchQuery}
                onChange={(e) => { setFeedSearchQuery(e.target.value); setFeedPage(1); }}
                className="search-input"
              />
              {feedSearchQuery && (
                <button className="search-clear" onClick={() => { setFeedSearchQuery(''); setFeedPage(1); }}>✕</button>
              )}
            </div>

            {/* Guest Sign In Prompt */}
            {!currentUser && (
              <div className="guest-prompt">
                <p>👋 Sign in to log your rows and compete!</p>
                <button className="signin-prompt-btn" onClick={handleSignIn}>
                  Sign in with Google
                </button>
              </div>
            )}

            {(() => {
              const feedData = getActivityFeed(feedSearchQuery, feedPage);
              return feedData.items.length === 0 ? (
                <div className="empty-state">
                  {feedSearchQuery ? (
                    <p>No activity found for "{feedSearchQuery}"</p>
                  ) : (
                    <>
                      <p>No activity yet!</p>
                      <p>Be the first to log a row.</p>
                    </>
                  )}
                </div>
              ) : (
                <>
                  <div className="activity-feed">
                    {feedData.items.map((item) => {
                      const itemStreak = item.user ? calculateStreak(item.user.id) : 0;
                      const itemRank = item.user ? getUserRank(item.user.totalMeters) : null;
                      
                      return (
                        <div 
                          key={item.id} 
                          className={`feed-item feed-item-${item.type} ${item.userId === currentUser?.uid ? 'is-you' : ''} clickable`}
                          onClick={() => item.user && setShowUserProfileModal(item.user)}
                        >
                          <div className="feed-avatar">
                            {item.user?.photoURL ? (
                              <img src={item.user.photoURL} alt="" />
                            ) : (
                              <div className="feed-avatar-placeholder">
                                {item.user?.name?.charAt(0)?.toUpperCase() || '?'}
                              </div>
                            )}
                          </div>
                          <div className="feed-content">
                            <div className="feed-header">
                              <span className="feed-name">
                                {item.user?.name}
                                {itemRank && <span className="feed-rank-badge">{itemRank.emoji}</span>}
                                {/* Weekly leaderboard position badge */}
                                {(() => {
                                  const weeklyPos = getWeeklyLeaderboard().findIndex(u => u.id === item.userId);
                                  if (weeklyPos === 0) return <span className="feed-weekly-badge gold" title="Weekly Leader">👑</span>;
                                  if (weeklyPos === 1) return <span className="feed-weekly-badge silver" title="2nd This Week">🥈</span>;
                                  if (weeklyPos === 2) return <span className="feed-weekly-badge bronze" title="3rd This Week">🥉</span>;
                                  return null;
                                })()}
                              </span>
                              <span className="feed-time">
                                {formatTimeAgo(new Date(item.date))}
                              </span>
                            </div>
                            <div className="feed-action">
                              {item.type === 'row' && (
                                <>
                                  rowed <span className="feed-meters">{item.meters.toLocaleString()}m</span>
                                  {item.verificationStatus === 'verified' && (
                                    <span className="verification-badge verified" title="Verified with photo">✓</span>
                                  )}
                                  {item.verificationStatus === 'pending_review' && (
                                    <span className="verification-badge pending" title="Pending Review">⏳</span>
                                  )}
                                  {(item.verificationStatus === 'unverified' || !item.verificationStatus) && (
                                    <span className="verification-badge unverified" title="No photo - unverified">✗</span>
                                  )}
                                </>
                              )}
                              {item.type === 'achievement' && (
                                <span className="feed-achievement">
                                  unlocked <span className="feed-achievement-name">{item.achievement.emoji} {item.achievement.name}</span>
                                </span>
                              )}
                              {item.type === 'rank' && (
                                <span className="feed-rank">
                                  reached <span className="feed-rank-name">{item.rank.emoji} {item.rank.rank}</span>
                                </span>
                              )}
                              {item.type === 'join' && (
                                <span className="feed-join">
                                  joined Row Crew! 🎉
                                </span>
                              )}
                            </div>
                            {/* Show streak for row entries */}
                            {item.type === 'row' && itemStreak > 1 && (
                              <div className="feed-streak-badge">🔥 {itemStreak} day streak</div>
                            )}
                          </div>
                          {/* Photo thumbnail for row entries */}
                          {item.type === 'row' && item.imageUrl && (
                            <div 
                              className="feed-photo-thumb"
                              onClick={(e) => { e.stopPropagation(); setShowPhotoModal({ url: item.imageUrl, entry: item }); }}
                            >
                              <img src={item.imageUrl} alt="Row evidence" />
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                  
                  {/* Load More Button */}
                  {feedData.hasMore && (
                    <button 
                      className="load-more-btn"
                      onClick={() => setFeedPage(prev => prev + 1)}
                    >
                      Load More ({feedData.total - feedData.items.length} remaining)
                    </button>
                  )}
                </>
              );
            })()}
          </section>
        )}

        {activeTab === 'leaderboard' && (
          <section className="leaderboard-section">
            <h2>Leaderboard</h2>
            
            {/* Leaderboard Tabs */}
            <div className="leaderboard-tabs">
              <button 
                className={`lb-tab ${leaderboardTab === 'alltime' ? 'active' : ''}`}
                onClick={() => setLeaderboardTab('alltime')}
              >
                🏆 All Time
              </button>
              <button 
                className={`lb-tab ${leaderboardTab === 'weekly' ? 'active' : ''}`}
                onClick={() => setLeaderboardTab('weekly')}
              >
                📅 This Week
              </button>
              <button 
                className={`lb-tab ${leaderboardTab === 'streak' ? 'active' : ''}`}
                onClick={() => setLeaderboardTab('streak')}
              >
                🔥 Streaks
              </button>
              <button 
                className={`lb-tab ${leaderboardTab === 'achievements' ? 'active' : ''}`}
                onClick={() => setLeaderboardTab('achievements')}
              >
                🏅 Achievements
              </button>
            </div>

            {/* All Time Leaderboard */}
            {leaderboardTab === 'alltime' && (
              <>
                {getLeaderboard().length === 0 ? (
                  <div className="empty-state">
                    <p>No rowers yet!</p>
                    <p>Be the first to log a row.</p>
                  </div>
                ) : (
                  <div className="leaderboard">
                    {getLeaderboard().map((user, index) => (
                      <div 
                        key={user.id} 
                        className={`leaderboard-item rank-${index + 1} ${user.id === currentUser?.uid ? 'is-you' : ''}`}
                        onClick={() => setShowUserProfileModal(user)}
                      >
                        <div className="rank">
                          {index === 0 ? '🥇' : index === 1 ? '🥈' : index === 2 ? '🥉' : index + 1}
                        </div>
                        <div className="user-avatar-wrapper">
                          {user.photoURL ? (
                            <img src={user.photoURL} alt="" className="leaderboard-avatar" />
                          ) : (
                            <div className="leaderboard-avatar-placeholder">
                              {user.name?.charAt(0)?.toUpperCase() || '?'}
                            </div>
                          )}
                        </div>
                        <div className="user-info">
                          <span className="user-name">
                            {user.name}
                            {user.id === currentUser?.uid && <span className="you-badge">YOU</span>}
                          </span>
                          <span className="user-rank-label">
                            {user.rank?.emoji} {user.rank?.title}
                          </span>
                          <span className="user-streak">{user.streak > 0 && `🔥 ${user.streak} day streak`}</span>
                        </div>
                        <div className="user-meters">
                          <span className="meters-value">{formatMeters(user.totalMeters)}</span>
                          <span className="meters-label">meters</span>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </>
            )}

            {/* Weekly Leaderboard */}
            {leaderboardTab === 'weekly' && (
              <>
                {getWeeklyLeaderboard().length === 0 ? (
                  <div className="empty-state">
                    <p>No rows this week yet!</p>
                    <p>Be the first to get on the board.</p>
                  </div>
                ) : (
                  <div className="leaderboard">
                    {getWeeklyLeaderboard().map((user, index) => (
                      <div 
                        key={user.id} 
                        className={`leaderboard-item rank-${index + 1} ${user.id === currentUser?.uid ? 'is-you' : ''}`}
                        onClick={() => setShowUserProfileModal(user)}
                      >
                        <div className="rank">
                          {index === 0 ? '🥇' : index === 1 ? '🥈' : index === 2 ? '🥉' : index + 1}
                        </div>
                        <div className="user-avatar-wrapper">
                          {user.photoURL ? (
                            <img src={user.photoURL} alt="" className="leaderboard-avatar" />
                          ) : (
                            <div className="leaderboard-avatar-placeholder">
                              {user.name?.charAt(0)?.toUpperCase() || '?'}
                            </div>
                          )}
                          {index === 0 && <span className="weekly-crown">👑</span>}
                        </div>
                        <div className="user-info">
                          <span className="user-name">
                            {user.name}
                            {user.id === currentUser?.uid && <span className="you-badge">YOU</span>}
                          </span>
                          <span className="user-rank-label">
                            {user.rank?.emoji} {user.rank?.title}
                          </span>
                        </div>
                        <div className="user-meters">
                          <span className="meters-value">{formatMeters(user.weeklyMeters)}</span>
                          <span className="meters-label">this week</span>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </>
            )}

            {/* Streak Leaderboard */}
            {leaderboardTab === 'streak' && (
              <>
                {getStreakLeaderboard().length === 0 ? (
                  <div className="empty-state">
                    <p>No active streaks!</p>
                    <p>Row consistently to build yours.</p>
                  </div>
                ) : (
                  <div className="leaderboard">
                    {getStreakLeaderboard().map((user, index) => (
                      <div 
                        key={user.id} 
                        className={`leaderboard-item rank-${index + 1} ${user.id === currentUser?.uid ? 'is-you' : ''}`}
                        onClick={() => setShowUserProfileModal(user)}
                      >
                        <div className="rank">
                          {index === 0 ? '🔥' : index === 1 ? '🥈' : index === 2 ? '🥉' : index + 1}
                        </div>
                        <div className="user-avatar-wrapper">
                          {user.photoURL ? (
                            <img src={user.photoURL} alt="" className="leaderboard-avatar" />
                          ) : (
                            <div className="leaderboard-avatar-placeholder">
                              {user.name?.charAt(0)?.toUpperCase() || '?'}
                            </div>
                          )}
                        </div>
                        <div className="user-info">
                          <span className="user-name">
                            {user.name}
                            {user.id === currentUser?.uid && <span className="you-badge">YOU</span>}
                          </span>
                          <span className="user-rank-label">
                            Best: {user.longestStreak} days
                          </span>
                        </div>
                        <div className="user-meters streak-display">
                          <span className="meters-value">{user.streak}</span>
                          <span className="meters-label">day streak</span>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </>
            )}

            {/* Achievements Leaderboard */}
            {leaderboardTab === 'achievements' && (
              <>
                {getAchievementsLeaderboard().length === 0 ? (
                  <div className="empty-state">
                    <p>No achievements unlocked yet!</p>
                    <p>Start rowing to earn badges.</p>
                  </div>
                ) : (
                  <div className="leaderboard">
                    {getAchievementsLeaderboard().map((user, index) => (
                      <div 
                        key={user.id} 
                        className={`leaderboard-item rank-${index + 1} ${user.id === currentUser?.uid ? 'is-you' : ''}`}
                        onClick={() => setShowUserProfileModal(user)}
                      >
                        <div className="rank">
                          {index === 0 ? '🏅' : index === 1 ? '🥈' : index === 2 ? '🥉' : index + 1}
                        </div>
                        <div className="user-avatar-wrapper">
                          {user.photoURL ? (
                            <img src={user.photoURL} alt="" className="leaderboard-avatar" />
                          ) : (
                            <div className="leaderboard-avatar-placeholder">
                              {user.name?.charAt(0)?.toUpperCase() || '?'}
                            </div>
                          )}
                        </div>
                        <div className="user-info">
                          <span className="user-name">
                            {user.name}
                            {user.id === currentUser?.uid && <span className="you-badge">YOU</span>}
                          </span>
                          <span className="user-rank-label">
                            {user.rank?.emoji} {user.rank?.title}
                          </span>
                        </div>
                        <div className="user-meters">
                          <span className="meters-value">{user.achievementCount}/{ACHIEVEMENTS.length}</span>
                          <span className="meters-label">badges</span>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </>
            )}
          </section>
        )}


        {activeTab === 'more' && (
          <section className="more-section">
            <h2>Achievements & More</h2>
            
            {/* Achievements Section */}
            <div className="achievements-full-section">
              <h3>🏅 {currentUser ? 'Your Achievements' : 'Achievements'}</h3>
              <div className="achievements-grid-full">
                {ACHIEVEMENTS.map((achievement) => {
                  const unlocked = currentUser ? getUserAchievements(currentUser.uid).some(a => a.id === achievement.id) : false;
                  const progress = currentUser ? getAchievementProgress(currentUser.uid, achievement) : { current: 0, target: 1 };
                  const unlockedAchievement = currentUser ? getUserAchievements(currentUser.uid).find(a => a.id === achievement.id) : null;
                  const progressPercent = Math.min((progress.current / progress.target) * 100, 100);
                  
                  return (
                    <div 
                      key={achievement.id} 
                      className={`achievement-card ${unlocked ? 'unlocked' : 'locked'}`}
                      onClick={() => setShowAchievementModal({ ...achievement, progress, unlockedDate: unlockedAchievement?.unlockedDate })}
                    >
                      <span className="achievement-card-emoji">{achievement.emoji}</span>
                      <span className="achievement-card-name">{achievement.name}</span>
                      {!unlocked && currentUser && (
                        <div className="achievement-card-progress">
                          <div className="achievement-progress-bar">
                            <div className="achievement-progress-fill" style={{ width: `${progressPercent}%` }} />
                          </div>
                          <span className="achievement-progress-text">
                            {progress.target >= 1000 ? `${formatMeters(progress.current)}/${formatMeters(progress.target)}` : `${progress.current}/${progress.target}`}
                          </span>
                        </div>
                      )}
                      {unlocked && <span className="achievement-card-check">✓ Unlocked</span>}
                    </div>
                  );
                })}
              </div>
              {currentUser && (
                <p className="achievements-count">
                  {getUserAchievements(currentUser.uid).length} / {ACHIEVEMENTS.length} unlocked
                </p>
              )}
            </div>

            {/* Rank Progression */}
            <div className="ranks-section">
              <h3>🎖️ Rank Progression</h3>
              <div className="ranks-list">
                {RANKS.map((rank, index) => {
                  const userMeters = userProfile?.totalMeters || 0;
                  const isCurrentRank = getUserRank(userMeters).title === rank.title;
                  const isUnlocked = userMeters >= rank.minMeters;
                  const nextRank = RANKS[index + 1];
                  const progressToNext = nextRank 
                    ? Math.min(((userMeters - rank.minMeters) / (nextRank.minMeters - rank.minMeters)) * 100, 100)
                    : 100;
                  
                  return (
                    <div key={rank.title} className={`rank-item ${isCurrentRank ? 'current' : ''} ${isUnlocked ? 'unlocked' : 'locked'}`}>
                      <span className="rank-item-emoji">{rank.emoji}</span>
                      <div className="rank-item-info">
                        <span className="rank-item-title">{rank.title}</span>
                        <span className="rank-item-meters">{formatMeters(rank.minMeters)}m</span>
                        {isCurrentRank && nextRank && (
                          <div className="rank-progress-bar">
                            <div className="rank-progress-fill" style={{ width: `${progressToNext}%` }} />
                          </div>
                        )}
                      </div>
                      {isCurrentRank && <span className="rank-current-badge">YOU</span>}
                      {isUnlocked && !isCurrentRank && <span className="rank-unlocked-check">✓</span>}
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Account Section */}
            {currentUser && (
              <div className="account-section">
                <h3>👤 Account</h3>
                <div className="account-buttons">
                  <button className="account-btn" onClick={() => setShowSessionHistory(true)}>
                    <span className="account-btn-icon">📋</span>
                    <span className="account-btn-text">Session History</span>
                    <span className="account-btn-arrow">→</span>
                  </button>
                  <button className="account-btn" onClick={() => setShowRankProgressModal(true)}>
                    <span className="account-btn-icon">🎖️</span>
                    <span className="account-btn-text">Rank Progress</span>
                    <span className="account-btn-arrow">→</span>
                  </button>
                  {isAdmin && (
                    <button className="account-btn admin" onClick={() => { setShowAdminPanel(true); loadPendingReviews(); }}>
                      <span className="account-btn-icon">🛡️</span>
                      <span className="account-btn-text">Admin Panel</span>
                      <span className="account-btn-arrow">→</span>
                    </button>
                  )}
                  <button className="account-btn danger" onClick={handleSignOut}>
                    <span className="account-btn-icon">🚪</span>
                    <span className="account-btn-text">Sign Out</span>
                    <span className="account-btn-arrow">→</span>
                  </button>
                </div>
              </div>
            )}

            {/* Session History */}
            {currentUser && (
              <div className="session-history-section">
                <h3>📋 Your Session History</h3>
                <div className="session-history-list">
                  {entries
                    .filter(e => e.userId === currentUser.uid)
                    .sort((a, b) => new Date(b.date) - new Date(a.date))
                    .slice(0, 20)
                    .map((entry, index) => (
                      <div key={entry.id || index} className="session-history-item">
                        <div className="session-history-date">
                          {new Date(entry.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                        </div>
                        <div className="session-history-meters">
                          {entry.meters.toLocaleString()}m
                        </div>
                        <div className={`session-history-status ${entry.verificationStatus || 'unverified'}`}>
                          {entry.verificationStatus === 'verified' ? '✓' : 
                           entry.verificationStatus === 'pending_review' ? '⏳' : '?'}
                        </div>
                      </div>
                    ))}
                  {entries.filter(e => e.userId === currentUser.uid).length === 0 && (
                    <p className="empty-history">No sessions yet. Start rowing!</p>
                  )}
                </div>
              </div>
            )}

            {/* Changelog */}
            <div className="changelog-section">
              <h3>📝 App Updates</h3>
              <div className="changelog">
                {CHANGELOG.map((release, index) => (
                  <div key={release.version} className={`changelog-entry ${index === 0 ? 'latest' : ''}`}>
                    <div className="changelog-header">
                      <span className="changelog-version">v{release.version}</span>
                      <span className="changelog-date">{new Date(release.date + 'T12:00:00-08:00').toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric', timeZone: 'America/Los_Angeles' })}</span>
                      {index === 0 && <span className="latest-badge">LATEST</span>}
                    </div>
                    <ul className="changelog-changes">
                      {release.changes.map((change, i) => (
                        <li key={i}>{change}</li>
                      ))}
                    </ul>
                  </div>
                ))}
              </div>
            </div>
          </section>
        )}
      </main>

      {/* Confirm Modal */}
      {showConfirmModal && (
        <div className="modal-overlay" onClick={() => { setShowConfirmModal(false); setValidationError(''); }}>
          <div className="modal confirm-modal" onClick={(e) => e.stopPropagation()}>
            <h2>Confirm Your Row</h2>
            
            {capturedImage && (
              <div className="captured-image-preview">
                <img src={capturedImage.data || capturedImage} alt="Captured rowing screen" />
              </div>
            )}

            {/* Show AI detection result */}
            {capturedImage?.claudeResult && (
              <div className={`ai-detection-result ${capturedImage.claudeResult.confidence >= 60 ? 'high-confidence' : 'low-confidence'}`}>
                {capturedImage.claudeResult.extractedMeters ? (
                  <>
                    <span className="ai-icon">🤖</span>
                    <span>AI detected: <strong>{capturedImage.claudeResult.extractedMeters.toLocaleString()}m</strong></span>
                    {capturedImage.claudeResult.displayType && capturedImage.claudeResult.displayType !== 'Unknown' && (
                      <span className="ai-machine"> ({capturedImage.claudeResult.displayType})</span>
                    )}
                    {capturedImage.claudeResult.confidence >= 60 && <span className="ai-check">✓</span>}
                  </>
                ) : capturedImage.claudeResult.isRowingMachineDisplay === false ? (
                  <>
                    <span className="ai-icon">⚠️</span>
                    <span>Image doesn't appear to be a rowing machine display</span>
                  </>
                ) : (
                  <>
                    <span className="ai-icon">❓</span>
                    <span>AI couldn't read meters - please enter manually</span>
                  </>
                )}
              </div>
            )}

            <div className="detected-meters-display">
              <span className="detected-label">{detectedMeters ? 'Detected meters:' : 'Enter meters:'}</span>
              <input
                type="number"
                value={editableMeters}
                onChange={(e) => { setEditableMeters(e.target.value); setValidationError(''); }}
                className="meters-input-large"
                placeholder="0"
                autoFocus
                min={MIN_METERS}
                max={MAX_METERS}
              />
            </div>

            {validationError && (
              <div className="validation-error">
                ⚠️ {validationError}
              </div>
            )}

            <p className="confirm-user">Logging as <strong>{userProfile?.name}</strong></p>

            <div className="modal-actions">
              <button className="cancel-button" onClick={() => { setShowConfirmModal(false); setCapturedImage(null); setValidationError(''); }}>
                Cancel
              </button>
              <button
                className="confirm-button"
                onClick={handleConfirmEntry}
                disabled={!editableMeters || parseInt(editableMeters, 10) <= 0}
              >
                Log {editableMeters ? `${parseInt(editableMeters, 10).toLocaleString()}m` : 'Row'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Setup Profile Modal */}
      {showSetupModal && (
        <div className="modal-overlay">
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <h2>Welcome to Row Crew!</h2>
            <p>Set up your profile to start tracking</p>

            {currentUser?.photoURL && (
              <img src={currentUser.photoURL} alt="" className="setup-avatar" />
            )}

            <input
              type="text"
              placeholder="Your display name"
              value={displayName}
              onChange={(e) => setDisplayName(e.target.value)}
              className="name-input"
              autoFocus
            />

            <div className="modal-actions">
              <button className="cancel-button" onClick={handleSignOut}>
                Cancel
              </button>
              <button
                className="confirm-button"
                onClick={handleCreateProfile}
                disabled={!displayName.trim()}
              >
                Join Crew
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Share Card Modal */}
      {showShareModal && (
        <div className="modal-overlay" onClick={handleCloseShare}>
          <div className="share-modal" onClick={(e) => e.stopPropagation()}>
            <button className="share-close-btn" onClick={handleCloseShare}>✕</button>
            
            <div className="share-card" ref={shareCardRef}>
              <div className="share-card-header">
                <div className="share-card-brand">
                  <span className="share-brand-icon">🚣</span>
                  <span className="share-brand-text">ROW CREW</span>
                </div>
                <div className="share-card-date">
                  {new Date().toLocaleDateString('en-US', { 
                    weekday: 'short',
                    month: 'short', 
                    day: 'numeric',
                    year: 'numeric',
                    timeZone: 'America/Los_Angeles'
                  })}
                </div>
              </div>

              <div className="share-card-user">
                {userProfile?.photoURL ? (
                  <img src={userProfile.photoURL} alt="" className="share-user-avatar" crossOrigin="anonymous" />
                ) : (
                  <div className="share-user-avatar-placeholder">
                    {userProfile?.name?.charAt(0)?.toUpperCase() || '?'}
                  </div>
                )}
                <span className="share-user-name">{userProfile?.name}</span>
              </div>

              {shareImageUrl && (
                <div className="share-card-image">
                  <img src={shareImageUrl} alt="Rowing session" crossOrigin="anonymous" />
                </div>
              )}

              <div className="share-card-session">
                <span className="share-session-label">Just rowed</span>
                <span className="share-session-meters">{lastSessionMeters.toLocaleString()}m</span>
              </div>

              <div className="share-card-stats">
                <div className="share-stat">
                  <span className="share-stat-icon">🔥</span>
                  <span className="share-stat-value">{calculateStreak(currentUser?.uid)}</span>
                  <span className="share-stat-label">day streak</span>
                </div>
                <div className="share-stat-divider"></div>
                <div className="share-stat">
                  <span className="share-stat-icon">📊</span>
                  <span className="share-stat-value">{formatMeters((userProfile?.totalMeters || 0) + lastSessionMeters)}</span>
                  <span className="share-stat-label">total meters</span>
                </div>
              </div>

              <div className="share-card-footer">
                <span>Join us rowing around the world! 🌍</span>
                <a 
                  href="https://rowcrew.netlify.app" 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="share-card-url"
                >
                  rowcrew.netlify.app
                </a>
              </div>
            </div>

            <div className="share-actions">
              <button 
                className={`share-copy-btn ${linkCopied ? 'copied' : ''} ${isCopying ? 'copying' : ''}`} 
                onClick={handleCopyLink}
                disabled={isCopying}
              >
                {isCopying ? '⏳ Working...' : linkCopied ? '✓ Done!' : '📤 Share'}
              </button>
              <button className="share-done-btn" onClick={handleCloseShare}>
                Done
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Personal Record Modal */}
      {showPRModal && (
        <div className="modal-overlay pr-overlay" onClick={() => setShowPRModal(null)}>
          <div className="pr-modal" onClick={(e) => e.stopPropagation()}>
            <div className="pr-fireworks">🎆</div>
            <h2 className="pr-title">NEW PR! 🏆</h2>
            <p className="pr-meters">{showPRModal?.toLocaleString()}m</p>
            <p className="pr-subtitle">Personal Record Smashed!</p>
            <div className="pr-message">
              <p>You just beat your previous best!</p>
              <p>Keep pushing those limits! 💪</p>
            </div>
            <button className="pr-btn" onClick={() => setShowPRModal(null)}>
              Let's Go! 🚀
            </button>
          </div>
        </div>
      )}

      {/* Busted Modal - Nice try Chinh! */}
      {showBustedModal && (
        <div className="modal-overlay busted-overlay" onClick={() => setShowBustedModal(false)}>
          <div className="busted-modal" onClick={(e) => e.stopPropagation()}>
            <div className="busted-emoji">🚨</div>
            <h2 className="busted-title">BUSTED!</h2>
            <p className="busted-subtitle">Nice try, Chinh 😏</p>
            <div className="busted-message">
              <p>We see you trying to mess with the database...</p>
              <p>Your sneaky activities have been logged 📝</p>
            </div>
            <div className="busted-gif">
              🕵️ Database Integrity Police 🚔
            </div>
            <button className="busted-btn" onClick={() => setShowBustedModal(false)}>
              I'll behave now 😇
            </button>
          </div>
        </div>
      )}

      {/* Settings Modal */}
      {showSettingsModal && (
        <div className="modal-overlay" onClick={() => setShowSettingsModal(false)}>
          <div className="modal settings-modal" onClick={(e) => e.stopPropagation()}>
            <button className="modal-close" onClick={() => setShowSettingsModal(false)}>✕</button>
            <h2>Settings</h2>
            
            {userProfile && (
              <>
                {/* Profile Picture */}
                <div className="settings-section">
                  <h3>Profile Picture</h3>
                  <div className="settings-photo-section">
                    <div className="settings-photo-preview">
                      {userProfile.photoURL ? (
                        <img src={userProfile.photoURL} alt="" />
                      ) : (
                        <div className="settings-photo-placeholder">
                          {userProfile.name?.charAt(0)?.toUpperCase() || '?'}
                        </div>
                      )}
                    </div>
                    <label className="settings-photo-upload">
                      <input
                        ref={profilePicInputRef}
                        type="file"
                        accept="image/*"
                        onChange={handleProfilePicUpload}
                        disabled={isUploadingPhoto}
                      />
                      {isUploadingPhoto ? 'Uploading...' : 'Change Photo'}
                    </label>
                  </div>
                </div>

                {/* Account Info */}
                <div className="settings-section">
                  <h3>Account</h3>
                  <div className="settings-info-row">
                    <span>Name</span>
                    <span>{userProfile.name}</span>
                  </div>
                  <div className="settings-info-row">
                    <span>Email</span>
                    <span>{currentUser?.email}</span>
                  </div>
                  <div className="settings-info-row">
                    <span>Total Meters</span>
                    <span>{userProfile.totalMeters?.toLocaleString() || 0}m</span>
                  </div>
                  <div className="settings-info-row">
                    <span>Sessions</span>
                    <span>{userProfile.uploadCount || 0}</span>
                  </div>
                </div>

                {/* Session History Button */}
                <div className="settings-section">
                  <h3>History</h3>
                  <button 
                    className="settings-history-btn" 
                    onClick={() => { setShowSessionHistory(true); setShowSettingsModal(false); }}
                  >
                    📋 View Session History
                  </button>
                </div>

                {/* 2025 Wrapped */}
                {getWrappedStats(currentUser?.uid) && (
                  <div className="settings-section">
                    <h3>Year in Review</h3>
                    <button 
                      className="settings-wrapped-btn" 
                      onClick={() => { setShowWrapped(true); setShowSettingsModal(false); setWrappedSlide(0); }}
                    >
                      🎁 View 2025 Wrapped
                    </button>
                  </div>
                )}

                {/* Sign Out */}
                <button className="settings-signout-btn" onClick={() => { handleSignOut(); setShowSettingsModal(false); }}>
                  Sign Out
                </button>
              </>
            )}
          </div>
        </div>
      )}

      {/* Achievement Detail Modal */}
      {showAchievementModal && (
        <div className="modal-overlay" onClick={() => setShowAchievementModal(null)}>
          <div className="modal achievement-modal" onClick={(e) => e.stopPropagation()}>
            <button className="modal-close" onClick={() => setShowAchievementModal(null)}>✕</button>
            
            <div className="achievement-modal-content">
              <span className="achievement-modal-emoji">{showAchievementModal.emoji}</span>
              <h2>{showAchievementModal.name}</h2>
              <p className="achievement-modal-desc">{showAchievementModal.desc}</p>
              
              {currentUser && (() => {
                const isUnlocked = getUserAchievements(currentUser.uid).some(a => a.id === showAchievementModal.id);
                const progress = showAchievementModal.progress || getAchievementProgress(currentUser.uid, showAchievementModal);
                const progressPercent = Math.min((progress.current / progress.target) * 100, 100);
                
                return (
                  <>
                    {/* Progress Bar */}
                    <div className="achievement-modal-progress">
                      <div className="achievement-modal-progress-bar">
                        <div 
                          className={`achievement-modal-progress-fill ${isUnlocked ? 'complete' : ''}`} 
                          style={{ width: `${progressPercent}%` }} 
                        />
                      </div>
                      <span className="achievement-modal-progress-text">
                        {progress.target >= 1000 
                          ? `${formatMeters(progress.current)} / ${formatMeters(progress.target)}`
                          : `${progress.current} / ${progress.target}`
                        }
                      </span>
                    </div>

                    {/* Status */}
                    <div className={`achievement-modal-status ${isUnlocked ? 'unlocked' : 'locked'}`}>
                      {isUnlocked ? (
                        <>
                          <span className="status-icon">✓</span>
                          <span>Unlocked!</span>
                        </>
                      ) : (
                        <>
                          <span className="status-icon">🔒</span>
                          <span>Keep rowing to unlock!</span>
                        </>
                      )}
                    </div>

                    {/* Date Completed */}
                    {isUnlocked && showAchievementModal.unlockedDate && (
                      <p className="achievement-modal-date">
                        Completed on {new Date(showAchievementModal.unlockedDate).toLocaleDateString('en-US', { 
                          month: 'short', 
                          day: 'numeric', 
                          year: 'numeric' 
                        })}
                      </p>
                    )}
                  </>
                );
              })()}
            </div>
            
            <button className="achievement-modal-close-btn" onClick={() => setShowAchievementModal(null)}>
              Got it!
            </button>
          </div>
        </div>
      )}

      {/* Photo Enlargement Modal */}
      {showPhotoModal && (
        <div className="modal-overlay" onClick={() => setShowPhotoModal(null)}>
          <div className="modal photo-modal" onClick={(e) => e.stopPropagation()}>
            <button className="modal-close" onClick={() => setShowPhotoModal(null)}>✕</button>
            
            <div className="photo-modal-content">
              <img src={showPhotoModal.url} alt="Row evidence" className="photo-modal-image" />
              
              <div className="photo-modal-details">
                <p><strong>{showPhotoModal.entry?.user?.name}</strong></p>
                <p>{showPhotoModal.entry?.meters?.toLocaleString()}m</p>
                <p className="photo-modal-date">
                  {new Date(showPhotoModal.entry?.date).toLocaleString()}
                </p>
                
                {showPhotoModal.entry?.verificationDetails && (
                  <div className="photo-modal-verification">
                    <p>
                      <span className={`verification-status-badge ${showPhotoModal.entry.verificationStatus}`}>
                        {showPhotoModal.entry.verificationStatus === 'verified' ? '✓ Verified' : 
                         showPhotoModal.entry.verificationStatus === 'pending_review' ? '⏳ Pending Review' : 
                         '? Unverified'}
                      </span>
                    </p>
                    {showPhotoModal.entry.verificationDetails.displayType && (
                      <p className="photo-modal-detail">Machine: {showPhotoModal.entry.verificationDetails.displayType}</p>
                    )}
                    {showPhotoModal.entry.verificationDetails.confidence > 0 && (
                      <p className="photo-modal-detail">Confidence: {showPhotoModal.entry.verificationDetails.confidence}%</p>
                    )}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Admin Panel Modal */}
      {showAdminPanel && isAdmin && (
        <div className="modal-overlay" onClick={() => setShowAdminPanel(false)}>
          <div className="modal admin-modal" onClick={(e) => e.stopPropagation()}>
            <button className="modal-close" onClick={() => setShowAdminPanel(false)}>✕</button>
            
            <h2>🛡️ Admin Panel</h2>
            
            {/* Stats */}
            {adminStats && (
              <div className="admin-stats">
                <div className="admin-stat">
                  <span className="admin-stat-value">{adminStats.verified}</span>
                  <span className="admin-stat-label">Verified</span>
                </div>
                <div className="admin-stat pending">
                  <span className="admin-stat-value">{adminStats.pending}</span>
                  <span className="admin-stat-label">Pending</span>
                </div>
                <div className="admin-stat rejected">
                  <span className="admin-stat-value">{adminStats.rejected}</span>
                  <span className="admin-stat-label">Rejected</span>
                </div>
              </div>
            )}
            
            <button className="admin-refresh-btn" onClick={loadPendingReviews}>
              🔄 Refresh
            </button>
            
            <h3>Pending Reviews ({pendingReviews.length})</h3>
            
            {pendingReviews.length === 0 ? (
              <p className="admin-empty">No entries pending review 🎉</p>
            ) : (
              <div className="admin-review-list">
                {pendingReviews.map((entry) => (
                  <div key={entry.id} className="admin-review-item">
                    <div className="admin-review-header">
                      <span className="admin-review-user">{entry.userName}</span>
                      <span className="admin-review-meters">{entry.meters?.toLocaleString()}m</span>
                    </div>
                    
                    {entry.imageUrl && (
                      <img 
                        src={entry.imageUrl} 
                        alt="Evidence" 
                        className="admin-review-image"
                        onClick={() => setShowPhotoModal({ url: entry.imageUrl, entry })}
                      />
                    )}
                    
                    <div className="admin-review-details">
                      <p><strong>Reason:</strong> {entry.verificationDetails?.reason}</p>
                      {entry.verificationDetails?.extractedMeters && (
                        <p><strong>AI Saw:</strong> {entry.verificationDetails.extractedMeters}m</p>
                      )}
                      {entry.verificationDetails?.flags?.length > 0 && (
                        <p><strong>Flags:</strong> {entry.verificationDetails.flags.join(', ')}</p>
                      )}
                      <p><strong>Date:</strong> {new Date(entry.date).toLocaleString()}</p>
                    </div>
                    
                    {reviewingEntry === entry.id ? (
                      <div className="admin-review-actions-expanded">
                        <input
                          type="number"
                          placeholder="Adjusted meters (optional)"
                          value={adjustedMeters}
                          onChange={(e) => setAdjustedMeters(e.target.value)}
                          className="admin-input"
                        />
                        <input
                          type="text"
                          placeholder="Review note (optional)"
                          value={reviewNote}
                          onChange={(e) => setReviewNote(e.target.value)}
                          className="admin-input"
                        />
                        <div className="admin-review-buttons">
                          <button 
                            className="admin-btn approve"
                            onClick={() => handleReviewEntry(entry.id, 'approve')}
                          >
                            ✓ Approve
                          </button>
                          <button 
                            className="admin-btn reject"
                            onClick={() => handleReviewEntry(entry.id, 'reject')}
                          >
                            ✕ Reject
                          </button>
                          <button 
                            className="admin-btn cancel"
                            onClick={() => { setReviewingEntry(null); setAdjustedMeters(''); setReviewNote(''); }}
                          >
                            Cancel
                          </button>
                        </div>
                      </div>
                    ) : (
                      <button 
                        className="admin-review-btn"
                        onClick={() => setReviewingEntry(entry.id)}
                      >
                        Review
                      </button>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* User Profile Modal */}
      {showUserProfileModal && (
        <div className="modal-overlay" onClick={() => setShowUserProfileModal(null)}>
          <div className="modal user-profile-modal" onClick={(e) => e.stopPropagation()}>
            <button className="modal-close" onClick={() => setShowUserProfileModal(null)}>✕</button>
            
            {(() => {
              const user = showUserProfileModal;
              const userAchievements = getUserAchievements(user.id);
              const longestStreak = calculateLongestStreak(user.id);
              const personalRecord = getPersonalRecord(user.id);
              const totalDays = getTotalDaysRowed(user.id);
              const firstRow = getFirstRowDate(user.id);
              const streak = calculateStreak(user.id);
              const rank = getUserRank(user.totalMeters);
              const weeklyAvg = calculateWeeklyAverage(user.id);
              const avgPerUpload = user.uploadCount > 0 ? Math.round(user.totalMeters / user.uploadCount) : 0;
              
              return (
                <>
                  {/* Header */}
                  <div className="profile-modal-header">
                    {user.photoURL ? (
                      <img src={user.photoURL} alt="" className="profile-modal-avatar" />
                    ) : (
                      <div className="profile-modal-avatar-placeholder">
                        {user.name?.charAt(0)?.toUpperCase() || '?'}
                      </div>
                    )}
                    <div className="profile-modal-info">
                      <h2>{user.name}</h2>
                      <span className="profile-modal-rank">{rank?.emoji} {rank?.title}</span>
                      {streak > 0 && <span className="profile-modal-streak">🔥 {streak} day streak</span>}
                    </div>
                  </div>

                  {/* Main Stats */}
                  <div className="profile-stats-grid">
                    <div className="profile-stat-box">
                      <span className="profile-stat-value">{formatMeters(user.totalMeters)}</span>
                      <span className="profile-stat-label">Total Meters</span>
                    </div>
                    <div className="profile-stat-box">
                      <span className="profile-stat-value">{user.uploadCount || 0}</span>
                      <span className="profile-stat-label">Sessions</span>
                    </div>
                    <div className="profile-stat-box highlight">
                      <span className="profile-stat-value">{formatMeters(personalRecord)}</span>
                      <span className="profile-stat-label">🏆 Best Row</span>
                    </div>
                    <div className="profile-stat-box highlight">
                      <span className="profile-stat-value">{longestStreak}</span>
                      <span className="profile-stat-label">🔥 Best Streak</span>
                    </div>
                  </div>

                  {/* Secondary Stats */}
                  <div className="profile-secondary-stats">
                    <div className="profile-stat-row">
                      <span>Avg/Session</span>
                      <span>{formatMeters(avgPerUpload)}m</span>
                    </div>
                    <div className="profile-stat-row">
                      <span>Sessions/Week</span>
                      <span>{weeklyAvg}x</span>
                    </div>
                    <div className="profile-stat-row">
                      <span>Days Rowed</span>
                      <span>{totalDays}</span>
                    </div>
                    {firstRow && (
                      <div className="profile-stat-row">
                        <span>Member Since</span>
                        <span>{firstRow.toLocaleDateString('en-US', { month: 'short', year: 'numeric' })}</span>
                      </div>
                    )}
                  </div>

                  {/* Achievements */}
                  <div className="profile-achievements">
                    <div className="profile-achievements-header">
                      <span>Achievements</span>
                      <span>{userAchievements.length}/{ACHIEVEMENTS.length}</span>
                    </div>
                    <div className="profile-badges">
                      {ACHIEVEMENTS.map((achievement) => {
                        const unlocked = userAchievements.some(a => a.id === achievement.id);
                        return (
                          <div 
                            key={achievement.id} 
                            className={`profile-badge ${unlocked ? 'unlocked' : 'locked'}`}
                            title={`${achievement.name}: ${achievement.desc}`}
                          >
                            {achievement.emoji}
                          </div>
                        );
                      })}
                    </div>
                  </div>
                </>
              );
            })()}
          </div>
        </div>
      )}

      {/* Rank Progress Modal */}
      {showRankProgressModal && currentUser && userProfile && (
        <div className="modal-overlay" onClick={() => setShowRankProgressModal(false)}>
          <div className="modal rank-progress-modal" onClick={(e) => e.stopPropagation()}>
            <button className="modal-close" onClick={() => setShowRankProgressModal(false)}>✕</button>
            
            <h2>🎖️ Rank Progress</h2>
            
            {(() => {
              const currentRank = getUserRank(userProfile.totalMeters);
              const nextRank = getNextRank(userProfile.totalMeters);
              const metersToNext = nextRank ? nextRank.minMeters - userProfile.totalMeters : 0;
              const progressPercent = nextRank 
                ? ((userProfile.totalMeters - currentRank.minMeters) / (nextRank.minMeters - currentRank.minMeters)) * 100
                : 100;
              
              return (
                <>
                  {/* Current Rank */}
                  <div className="current-rank-display">
                    <span className="current-rank-emoji">{currentRank.emoji}</span>
                    <div className="current-rank-info">
                      <span className="current-rank-title">{currentRank.title}</span>
                      <span className="current-rank-meters">{formatMeters(userProfile.totalMeters)}m total</span>
                    </div>
                  </div>

                  {/* Progress to Next */}
                  {nextRank && (
                    <div className="next-rank-progress">
                      <div className="progress-header">
                        <span>Next: {nextRank.emoji} {nextRank.title}</span>
                        <span>{formatMeters(metersToNext)}m to go</span>
                      </div>
                      <div className="rank-progress-bar">
                        <div className="rank-progress-fill" style={{ width: `${progressPercent}%` }} />
                      </div>
                    </div>
                  )}

                  {/* All Ranks */}
                  <div className="all-ranks">
                    <h3>All Ranks</h3>
                    <div className="ranks-list">
                      {RANKS.map((rank, index) => {
                        const isCurrentRank = currentRank.title === rank.title;
                        const isUnlocked = userProfile.totalMeters >= rank.minMeters;
                        return (
                          <div key={rank.title} className={`rank-item ${isCurrentRank ? 'current' : ''} ${isUnlocked ? 'unlocked' : 'locked'}`}>
                            <span className="rank-item-emoji">{rank.emoji}</span>
                            <div className="rank-item-info">
                              <span className="rank-item-title">{rank.title}</span>
                              <span className="rank-item-req">{formatMeters(rank.minMeters)}m</span>
                            </div>
                            {isCurrentRank && <span className="rank-current-badge">YOU</span>}
                            {isUnlocked && !isCurrentRank && <span className="rank-check">✓</span>}
                          </div>
                        );
                      })}
                    </div>
                  </div>
                </>
              );
            })()}
          </div>
        </div>
      )}

      {/* Create Group Modal */}
      {showCreateGroupModal && (
        <div className="modal-overlay" onClick={() => setShowCreateGroupModal(false)}>
          <div className="modal group-modal" onClick={(e) => e.stopPropagation()}>
            <button className="modal-close" onClick={() => setShowCreateGroupModal(false)}>✕</button>
            
            <h2>Create Group</h2>
            <p>Create a private group for your crew</p>

            <div className="form-group">
              <label>Group Name</label>
              <input
                type="text"
                placeholder="e.g., Redeemer Rowers"
                value={newGroupName}
                onChange={(e) => setNewGroupName(e.target.value)}
                maxLength={30}
              />
            </div>

            <div className="form-group">
              <label>Description (optional)</label>
              <textarea
                placeholder="What's this group about?"
                value={newGroupDescription}
                onChange={(e) => setNewGroupDescription(e.target.value)}
                maxLength={100}
                rows={2}
              />
            </div>

            {groupError && <div className="form-error">{groupError}</div>}

            <button 
              className="primary-btn"
              onClick={handleCreateGroup}
              disabled={!newGroupName.trim() || isCreatingGroup}
            >
              {isCreatingGroup ? 'Creating...' : 'Create Group'}
            </button>
          </div>
        </div>
      )}

      {/* Join Group Modal */}
      {showJoinGroupModal && (
        <div className="modal-overlay" onClick={() => setShowJoinGroupModal(false)}>
          <div className="modal group-modal" onClick={(e) => e.stopPropagation()}>
            <button className="modal-close" onClick={() => setShowJoinGroupModal(false)}>✕</button>
            
            <h2>Join Group</h2>
            <p>Enter the invite code to join a group</p>

            <div className="form-group">
              <label>Invite Code</label>
              <input
                type="text"
                placeholder="e.g., ABC123"
                value={joinGroupCode}
                onChange={(e) => setJoinGroupCode(e.target.value.toUpperCase())}
                maxLength={6}
                style={{ textTransform: 'uppercase', letterSpacing: '0.2em', textAlign: 'center', fontSize: '1.25rem' }}
              />
            </div>

            {groupError && <div className="form-error">{groupError}</div>}

            <button 
              className="primary-btn"
              onClick={handleJoinGroup}
              disabled={joinGroupCode.length < 6 || isJoiningGroup}
            >
              {isJoiningGroup ? 'Joining...' : 'Join Group'}
            </button>
          </div>
        </div>
      )}

      {/* Create Challenge Modal */}
      {showCreateChallengeModal && selectedGroupId && (
        <div className="modal-overlay" onClick={() => setShowCreateChallengeModal(false)}>
          <div className="modal challenge-modal" onClick={(e) => e.stopPropagation()}>
            <button className="modal-close" onClick={() => setShowCreateChallengeModal(false)}>✕</button>
            
            <h2>Create Challenge</h2>
            <p>Set a challenge for {getSelectedGroup()?.name}</p>

            <div className="form-group">
              <label>Challenge Name</label>
              <input
                type="text"
                placeholder="e.g., January Distance Challenge"
                value={newChallengeName}
                onChange={(e) => setNewChallengeName(e.target.value)}
                maxLength={40}
              />
            </div>

            <div className="form-group">
              <label>Challenge Type</label>
              <div className="challenge-type-options">
                <button 
                  className={`challenge-type-btn ${newChallengeType === 'collective' ? 'active' : ''}`}
                  onClick={() => setNewChallengeType('collective')}
                >
                  <span>🎯</span>
                  <span>Collective Goal</span>
                  <small>Team reaches target together</small>
                </button>
                <button 
                  className={`challenge-type-btn ${newChallengeType === 'distance_race' ? 'active' : ''}`}
                  onClick={() => setNewChallengeType('distance_race')}
                >
                  <span>🏃</span>
                  <span>Distance Race</span>
                  <small>Most meters wins</small>
                </button>
                <button 
                  className={`challenge-type-btn ${newChallengeType === 'time_trial' ? 'active' : ''}`}
                  onClick={() => setNewChallengeType('time_trial')}
                >
                  <span>⏱️</span>
                  <span>Time Trial</span>
                  <small>Fastest time for distance</small>
                </button>
                <button 
                  className={`challenge-type-btn ${newChallengeType === 'streak' ? 'active' : ''}`}
                  onClick={() => setNewChallengeType('streak')}
                >
                  <span>🔥</span>
                  <span>Streak Battle</span>
                  <small>Longest streak wins</small>
                </button>
                <button 
                  className={`challenge-type-btn ${newChallengeType === 'sessions' ? 'active' : ''}`}
                  onClick={() => setNewChallengeType('sessions')}
                >
                  <span>📅</span>
                  <span>Session Count</span>
                  <small>Most sessions wins</small>
                </button>
              </div>
            </div>

            {(newChallengeType === 'collective' || newChallengeType === 'time_trial') && (
              <div className="form-group">
                <label>
                  {newChallengeType === 'collective' ? 'Target Meters' : 'Distance (meters)'}
                </label>
                <input
                  type="number"
                  placeholder={newChallengeType === 'collective' ? 'e.g., 100000' : 'e.g., 500'}
                  value={newChallengeTarget}
                  onChange={(e) => setNewChallengeTarget(e.target.value)}
                />
                {newChallengeType === 'collective' && newChallengeTarget && (
                  <small className="form-hint">
                    That's {formatMeters(parseInt(newChallengeTarget, 10))} for the team
                  </small>
                )}
              </div>
            )}

            <div className="form-row">
              <div className="form-group">
                <label>Start Date</label>
                <input
                  type="date"
                  value={newChallengeStartDate}
                  onChange={(e) => setNewChallengeStartDate(e.target.value)}
                />
              </div>
              <div className="form-group">
                <label>End Date</label>
                <input
                  type="date"
                  value={newChallengeEndDate}
                  onChange={(e) => setNewChallengeEndDate(e.target.value)}
                />
              </div>
            </div>

            {groupError && <div className="form-error">{groupError}</div>}

            <button 
              className="primary-btn"
              onClick={handleCreateChallenge}
              disabled={!newChallengeName.trim() || !newChallengeStartDate || !newChallengeEndDate || isCreatingChallenge}
            >
              {isCreatingChallenge ? 'Creating...' : 'Create Challenge'}
            </button>
          </div>
        </div>
      )}

      {/* Challenge Detail Modal */}
      {showChallengeDetail && (
        <div className="modal-overlay" onClick={() => setShowChallengeDetail(null)}>
          <div className="modal challenge-detail-modal" onClick={(e) => e.stopPropagation()}>
            <button className="modal-close" onClick={() => setShowChallengeDetail(null)}>✕</button>
            
            {(() => {
              const challenge = showChallengeDetail;
              const status = getChallengeStatus(challenge);
              const progress = getChallengeProgress(challenge);
              const leaderboard = getChallengeLeaderboard(challenge);

              return (
                <>
                  <div className="challenge-detail-header">
                    <span className="challenge-type-icon-lg">
                      {challenge.type === 'collective' && '🎯'}
                      {challenge.type === 'time_trial' && '⏱️'}
                      {challenge.type === 'distance_race' && '🏃'}
                      {challenge.type === 'streak' && '🔥'}
                      {challenge.type === 'sessions' && '📅'}
                    </span>
                    <div>
                      <h2>{challenge.name}</h2>
                      <span className={`challenge-status-badge ${status}`}>
                        {status === 'active' && '🟢 Active'}
                        {status === 'upcoming' && '🟡 Starts ' + new Date(challenge.startDate).toLocaleDateString()}
                        {status === 'completed' && '✅ Completed'}
                      </span>
                    </div>
                  </div>

                  <div className="challenge-detail-dates">
                    📅 {new Date(challenge.startDate).toLocaleDateString()} - {new Date(challenge.endDate).toLocaleDateString()}
                  </div>

                  {/* Collective Progress */}
                  {challenge.type === 'collective' && progress && (
                    <div className="challenge-collective-progress">
                      <div className="collective-progress-visual">
                        <div 
                          className="collective-progress-fill"
                          style={{ width: `${progress.percentage}%` }}
                        />
                      </div>
                      <div className="collective-progress-stats">
                        <div className="collective-current">
                          <span className="big-number">{formatMeters(progress.current)}</span>
                          <span>rowed</span>
                        </div>
                        <div className="collective-target">
                          <span>of {formatMeters(progress.target)} goal</span>
                          <span className="percentage">{progress.percentage.toFixed(1)}%</span>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Time Trial - Submit Button */}
                  {challenge.type === 'time_trial' && status === 'active' && (
                    <div className="time-trial-submit-section">
                      <p>🏁 {challenge.targetDistance}m Time Trial</p>
                      {challenge.participants?.[currentUser?.uid] && (
                        <p className="your-best-time">
                          Your best: <strong>{formatTime(challenge.participants[currentUser.uid].bestTime)}</strong>
                          {challenge.participants[currentUser.uid].verified && ' ✓'}
                        </p>
                      )}
                      <button 
                        className="submit-time-btn"
                        onClick={() => setShowTimeTrialModal(challenge)}
                      >
                        {challenge.participants?.[currentUser?.uid] ? 'Submit New Time' : 'Submit Time'}
                      </button>
                    </div>
                  )}

                  {/* Leaderboard */}
                  <div className="challenge-leaderboard">
                    <h3>
                      {challenge.type === 'time_trial' ? 'Best Times' : 'Leaderboard'}
                    </h3>
                    {leaderboard.length === 0 ? (
                      <p className="no-entries">No entries yet. Be the first!</p>
                    ) : (
                      <div className="challenge-leaderboard-list">
                        {leaderboard.map((entry, index) => (
                          <div 
                            key={entry.userId || entry.user?.id} 
                            className={`challenge-lb-item ${entry.userId === currentUser?.uid || entry.user?.id === currentUser?.uid ? 'is-you' : ''}`}
                          >
                            <span className="challenge-lb-rank">
                              {index === 0 ? '🥇' : index === 1 ? '🥈' : index === 2 ? '🥉' : index + 1}
                            </span>
                            <div className="challenge-lb-user">
                              {entry.user?.photoURL ? (
                                <img src={entry.user.photoURL} alt="" className="challenge-lb-avatar" />
                              ) : (
                                <div className="challenge-lb-avatar-placeholder">
                                  {entry.user?.name?.charAt(0) || '?'}
                                </div>
                              )}
                              <span>{entry.user?.name}</span>
                            </div>
                            <span className="challenge-lb-value">
                              {challenge.type === 'time_trial' && formatTime(entry.time)}
                              {challenge.type === 'time_trial' && entry.verified && ' ✓'}
                              {(challenge.type === 'distance_race' || challenge.type === 'collective') && formatMeters(entry.totalMeters)}
                              {challenge.type === 'streak' && `${entry.bestStreak} days`}
                              {challenge.type === 'sessions' && `${entry.sessionCount} sessions`}
                            </span>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </>
              );
            })()}
          </div>
        </div>
      )}

      {/* Time Trial Submission Modal */}
      {showTimeTrialModal && (
        <div className="modal-overlay" onClick={() => setShowTimeTrialModal(null)}>
          <div className="modal time-trial-modal" onClick={(e) => e.stopPropagation()}>
            <button className="modal-close" onClick={() => setShowTimeTrialModal(null)}>✕</button>
            
            <h2>Submit {showTimeTrialModal.targetDistance}m Time</h2>
            <p>Enter your time for the {showTimeTrialModal.name}</p>

            <div className="form-group">
              <label>Your Time</label>
              <input
                type="text"
                placeholder="e.g., 1:45.3 or 105.3"
                value={timeTrialTime}
                onChange={(e) => setTimeTrialTime(e.target.value)}
                className="time-input"
              />
              <small className="form-hint">Format: M:SS.s or just seconds</small>
            </div>

            <div className="form-group">
              <label>Photo (optional - for verification)</label>
              <label className="photo-upload-btn">
                <input
                  type="file"
                  accept="image/*"
                  capture="environment"
                  onChange={(e) => {
                    const file = e.target.files[0];
                    if (file) {
                      const reader = new FileReader();
                      reader.onload = (ev) => setTimeTrialImage(ev.target.result);
                      reader.readAsDataURL(file);
                    }
                  }}
                />
                📷 {timeTrialImage ? 'Photo Added ✓' : 'Add Photo'}
              </label>
              {!timeTrialImage && (
                <small className="form-hint">Times without photos are marked unverified</small>
              )}
            </div>

            {groupError && <div className="form-error">{groupError}</div>}

            <button 
              className="primary-btn"
              onClick={handleSubmitTimeTrial}
              disabled={!timeTrialTime || isSubmittingTimeTrial}
            >
              {isSubmittingTimeTrial ? 'Submitting...' : 'Submit Time'}
            </button>
          </div>
        </div>
      )}

      {/* Session History Modal */}
      {showSessionHistory && currentUser && (
        <div className="modal-overlay" onClick={() => setShowSessionHistory(false)}>
          <div className="modal session-history-modal" onClick={(e) => e.stopPropagation()}>
            <button className="modal-close" onClick={() => setShowSessionHistory(false)}>✕</button>
            
            <h2>📋 Session History</h2>
            
            {(() => {
              const sessions = getUserSessionHistory(currentUser.uid);
              
              if (sessions.length === 0) {
                return <div className="empty-state"><p>No sessions yet!</p></div>;
              }
              
              return (
                <div className="session-list">
                  {sessions.map((session, index) => {
                    const date = new Date(session.date);
                    return (
                      <div key={session.id || index} className="session-item">
                        <div className="session-date">
                          <span className="session-day">{date.toLocaleDateString('en-US', { weekday: 'short' })}</span>
                          <span className="session-full-date">{date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}</span>
                        </div>
                        <div className="session-meters">
                          <span className="session-meters-value">{session.meters.toLocaleString()}m</span>
                          {session.verificationStatus === 'verified' && <span className="session-verified">✓</span>}
                          {session.verificationStatus === 'pending_review' && <span className="session-pending">⏳</span>}
                          {(session.verificationStatus === 'unverified' || !session.verificationStatus) && <span className="session-unverified">✗</span>}
                        </div>
                      </div>
                    );
                  })}
                </div>
              );
            })()}
          </div>
        </div>
      )}

      {/* 2025 Wrapped Modal */}
      {showWrapped && currentUser && (() => {
        const stats = getWrappedStats(currentUser.uid);
        if (!stats) return null;
        
        // Different slides for users with no data
        const noDataSlides = [
          {
            type: 'intro',
            background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
            content: (
              <div className="wrapped-slide-content intro">
                <div className="wrapped-year">2025</div>
                <div className="wrapped-logo">🚣 ROW CREW</div>
                <h1>Your Year Awaits!</h1>
                <p>Let's make it count...</p>
                <div className="wrapped-tap-hint">Tap to continue →</div>
              </div>
            )
          },
          {
            type: 'no-data',
            background: 'linear-gradient(135deg, #11998e 0%, #38ef7d 100%)',
            content: (
              <div className="wrapped-slide-content">
                <div className="wrapped-big-text">🚣</div>
                <h2 style={{ marginTop: '1rem' }}>Your rowing journey starts now!</h2>
                <div className="wrapped-fun-fact">
                  Log your first row and start building your 2025 story
                </div>
              </div>
            )
          },
          {
            type: 'cta',
            background: 'linear-gradient(135deg, #0a0e17 0%, #1a1f2e 100%)',
            content: (
              <div className="wrapped-slide-content summary">
                <div className="wrapped-summary-header">
                  <span>🚣</span> ROW CREW 2025
                </div>
                <div className="wrapped-summary-name">{userProfile?.name}</div>
                <div style={{ padding: '2rem 0', fontSize: '1.1rem', color: 'var(--text-secondary)' }}>
                  Your story is waiting to be written.<br/>Start rowing today!
                </div>
                <div className="wrapped-summary-rank">
                  {stats.currentRank.emoji} {stats.currentRank.title}
                </div>
                <div className="wrapped-summary-footer">
                  rowcrew.netlify.app
                </div>
              </div>
            )
          }
        ];

        const slides = stats.hasData ? [
          // Slide 0: Intro
          {
            type: 'intro',
            background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
            content: (
              <div className="wrapped-slide-content intro">
                <div className="wrapped-year">2025</div>
                <div className="wrapped-logo">🚣 ROW CREW</div>
                <h1>Your Year in Rowing</h1>
                <p>Let's see what you accomplished...</p>
                <div className="wrapped-tap-hint">Tap to continue →</div>
              </div>
            )
          },
          // Slide 1: Total Meters
          {
            type: 'meters',
            background: 'linear-gradient(135deg, #11998e 0%, #38ef7d 100%)',
            content: (
              <div className="wrapped-slide-content">
                <div className="wrapped-small-label">This year, you rowed</div>
                <div className="wrapped-big-number">{stats.totalMeters.toLocaleString()}</div>
                <div className="wrapped-unit">meters</div>
                <div className="wrapped-fun-fact">
                  That's {stats.bridgeCrossings} trips across the Golden Gate Bridge! 🌉
                </div>
              </div>
            )
          },
          // Slide 2: Sessions
          {
            type: 'sessions',
            background: 'linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)',
            content: (
              <div className="wrapped-slide-content">
                <div className="wrapped-small-label">You showed up</div>
                <div className="wrapped-big-number">{stats.sessionCount}</div>
                <div className="wrapped-unit">times</div>
                <div className="wrapped-fun-fact">
                  That's {stats.daysRowed} unique days on the rower! 💪
                </div>
              </div>
            )
          },
          // Slide 3: Best Day
          {
            type: 'favorite-day',
            background: 'linear-gradient(135deg, #fa709a 0%, #fee140 100%)',
            content: (
              <div className="wrapped-slide-content">
                <div className="wrapped-small-label">Your favorite day to row was</div>
                <div className="wrapped-big-text">{stats.favoriteDay}</div>
                <div className="wrapped-fun-fact">
                  You rowed on {stats.favoriteDay}s {stats.favoriteDayCount} times!
                </div>
              </div>
            )
          },
          // Slide 4: Best Month
          {
            type: 'best-month',
            background: 'linear-gradient(135deg, #a8edea 0%, #fed6e3 100%)',
            content: (
              <div className="wrapped-slide-content dark-text">
                <div className="wrapped-small-label">Your most active month was</div>
                <div className="wrapped-big-text">{stats.bestMonth}</div>
                <div className="wrapped-fun-fact">
                  You crushed {stats.bestMonthMeters.toLocaleString()}m that month! 📈
                </div>
              </div>
            )
          },
          // Slide 5: Beast Mode (Best Row)
          {
            type: 'beast-mode',
            background: 'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)',
            content: (
              <div className="wrapped-slide-content">
                <div className="wrapped-small-label">Your beast mode moment 🏆</div>
                <div className="wrapped-big-number">{stats.bestRow.toLocaleString()}</div>
                <div className="wrapped-unit">meters in one session</div>
                {stats.bestRowDate && (
                  <div className="wrapped-fun-fact">
                    On {stats.bestRowDate.toLocaleDateString('en-US', { month: 'long', day: 'numeric' })}
                  </div>
                )}
              </div>
            )
          },
          // Slide 6: Best Streak
          {
            type: 'streak',
            background: 'linear-gradient(135deg, #ff9a9e 0%, #fecfef 100%)',
            content: (
              <div className="wrapped-slide-content dark-text">
                <div className="wrapped-small-label">Your longest streak</div>
                <div className="wrapped-big-number">{stats.bestStreak}</div>
                <div className="wrapped-unit">days in a row 🔥</div>
                <div className="wrapped-fun-fact">
                  Consistency is key!
                </div>
              </div>
            )
          },
          // Slide 7: Rank Journey (if improved)
          ...(stats.rankImproved ? [{
            type: 'rank',
            background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
            content: (
              <div className="wrapped-slide-content">
                <div className="wrapped-small-label">You leveled up!</div>
                <div className="wrapped-rank-journey">
                  <div className="wrapped-rank-from">
                    <span className="wrapped-rank-emoji">{stats.startRank.emoji}</span>
                    <span>{stats.startRank.title}</span>
                  </div>
                  <div className="wrapped-rank-arrow">→</div>
                  <div className="wrapped-rank-to">
                    <span className="wrapped-rank-emoji">{stats.currentRank.emoji}</span>
                    <span>{stats.currentRank.title}</span>
                  </div>
                </div>
              </div>
            )
          }] : []),
          // Slide 8: Achievements
          ...(stats.achievementsUnlocked.length > 0 ? [{
            type: 'achievements',
            background: 'linear-gradient(135deg, #ffecd2 0%, #fcb69f 100%)',
            content: (
              <div className="wrapped-slide-content dark-text">
                <div className="wrapped-small-label">You unlocked</div>
                <div className="wrapped-big-number">{stats.achievementsUnlocked.length}</div>
                <div className="wrapped-unit">achievements</div>
                <div className="wrapped-badges">
                  {stats.achievementsUnlocked.slice(0, 6).map((a, i) => (
                    <span key={i} className="wrapped-badge">{a.emoji}</span>
                  ))}
                </div>
              </div>
            )
          }] : []),
          // Slide 9: Top Percentage
          {
            type: 'top-percent',
            background: 'linear-gradient(135deg, #0f0c29 0%, #302b63 50%, #24243e 100%)',
            content: (
              <div className="wrapped-slide-content">
                <div className="wrapped-small-label">You're in the</div>
                <div className="wrapped-big-number">Top {stats.topPercentage}%</div>
                <div className="wrapped-unit">of all Row Crew rowers</div>
                <div className="wrapped-fun-fact">
                  {stats.topPercentage <= 10 ? "Elite status! 👑" : 
                   stats.topPercentage <= 25 ? "Outstanding! 🌟" : 
                   stats.topPercentage <= 50 ? "Great work! 💪" : "Keep rowing! 🚣"}
                </div>
              </div>
            )
          },
          // Slide 10: Summary (shareable)
          {
            type: 'summary',
            background: 'linear-gradient(135deg, #0a0e17 0%, #1a1f2e 100%)',
            content: (
              <div className="wrapped-slide-content summary" ref={wrappedCardRef}>
                <div className="wrapped-summary-header">
                  <span>🚣</span> ROW CREW 2025
                </div>
                <div className="wrapped-summary-name">{userProfile?.name}</div>
                <div className="wrapped-summary-stats">
                  <div className="wrapped-summary-stat">
                    <span className="wrapped-summary-value">{formatMeters(stats.totalMeters)}</span>
                    <span className="wrapped-summary-label">meters</span>
                  </div>
                  <div className="wrapped-summary-stat">
                    <span className="wrapped-summary-value">{stats.sessionCount}</span>
                    <span className="wrapped-summary-label">sessions</span>
                  </div>
                  <div className="wrapped-summary-stat">
                    <span className="wrapped-summary-value">{stats.bestStreak}</span>
                    <span className="wrapped-summary-label">day streak</span>
                  </div>
                </div>
                <div className="wrapped-summary-rank">
                  {stats.currentRank.emoji} {stats.currentRank.title}
                </div>
                <div className="wrapped-summary-footer">
                  rowcrew.netlify.app
                </div>
              </div>
            )
          }
        ] : noDataSlides;
        
        const currentSlideData = slides[wrappedSlide];
        const isLastSlide = wrappedSlide === slides.length - 1;
        
        const handleSlideClick = (e) => {
          const rect = e.currentTarget.getBoundingClientRect();
          const x = e.clientX - rect.left;
          const isLeftSide = x < rect.width / 3;
          
          if (isLeftSide && wrappedSlide > 0) {
            setWrappedSlide(prev => prev - 1);
          } else if (!isLeftSide && wrappedSlide < slides.length - 1) {
            setWrappedSlide(prev => prev + 1);
          }
        };
        
        const handleShareWrapped = async () => {
          if (!wrappedCardRef.current) return;
          
          try {
            const canvas = await html2canvas(wrappedCardRef.current, {
              backgroundColor: '#0a0e17',
              scale: 2,
            });
            
            const blob = await new Promise(resolve => canvas.toBlob(resolve, 'image/png'));
            const file = new File([blob], 'row-crew-wrapped-2025.png', { type: 'image/png' });
            
            if (navigator.share && navigator.canShare({ files: [file] })) {
              await navigator.share({
                files: [file],
                title: 'My Row Crew 2025 Wrapped',
                text: `🚣 My 2025 Row Crew Wrapped! I rowed ${stats.totalMeters.toLocaleString()}m this year!`,
              });
            } else if (navigator.clipboard?.write) {
              await navigator.clipboard.write([new ClipboardItem({ 'image/png': blob })]);
              alert('Copied to clipboard!');
            }
          } catch (err) {
            console.error('Share failed:', err);
          }
        };
        
        return (
          <div 
            className="wrapped-overlay"
            onClick={handleSlideClick}
            style={{ background: currentSlideData.background }}
          >
            {/* Progress bar */}
            <div className="wrapped-progress">
              {slides.map((_, i) => (
                <div 
                  key={i} 
                  className={`wrapped-progress-bar ${i <= wrappedSlide ? 'active' : ''} ${i === wrappedSlide ? 'current' : ''}`}
                />
              ))}
            </div>
            
            {/* Close button */}
            <button 
              className="wrapped-close"
              onClick={(e) => { e.stopPropagation(); setShowWrapped(false); setWrappedSlide(0); }}
            >
              ✕
            </button>
            
            {/* Slide content */}
            <div className={`wrapped-slide wrapped-slide-${currentSlideData.type}`}>
              {currentSlideData.content}
            </div>
            
            {/* Navigation hint */}
            <div className="wrapped-nav-hint">
              {wrappedSlide > 0 && <span className="nav-left">‹</span>}
              <span className="nav-dots">
                {wrappedSlide + 1} / {slides.length}
              </span>
              {!isLastSlide && <span className="nav-right">›</span>}
            </div>
            
            {/* Share button on last slide */}
            {isLastSlide && (
              <div className="wrapped-share-actions" onClick={(e) => e.stopPropagation()}>
                <button className="wrapped-share-btn" onClick={handleShareWrapped}>
                  📤 Share Your Wrapped
                </button>
                <button 
                  className="wrapped-done-btn"
                  onClick={() => { setShowWrapped(false); setWrappedSlide(0); }}
                >
                  Done
                </button>
              </div>
            )}
          </div>
        );
      })()}

      {/* Install App Prompt */}
      {showInstallPrompt && !isStandalone && (
        <div className="install-prompt">
          <div className="install-prompt-content">
            <span className="install-prompt-icon">📱</span>
            <div className="install-prompt-text">
              <strong>Install Row Crew</strong>
              <p>Add to your home screen for quick access!</p>
            </div>
          </div>
          
          {isIOS ? (
            <div className="install-prompt-ios">
              <p>1. Tap the Share button <span className="ios-share-icon">⬆️</span></p>
              <p>2. Scroll down and tap "Add to Home Screen"</p>
              <button className="install-prompt-dismiss" onClick={dismissInstallPrompt}>Got it!</button>
            </div>
          ) : deferredPrompt ? (
            <div className="install-prompt-actions">
              <button className="install-prompt-btn" onClick={handleInstallClick}>Install</button>
              <button className="install-prompt-dismiss" onClick={dismissInstallPrompt}>Maybe Later</button>
            </div>
          ) : (
            <div className="install-prompt-ios">
              <p>Open browser menu and select "Add to Home Screen"</p>
              <button className="install-prompt-dismiss" onClick={dismissInstallPrompt}>Got it!</button>
            </div>
          )}
        </div>
      )}

      <footer className="footer" onClick={handleFooterTap}>
        <p>🌍 Goal: Row {formatMeters(WORLD_CIRCUMFERENCE)}m around the world!</p>
      </footer>
    </div>
  );
}

export default App;