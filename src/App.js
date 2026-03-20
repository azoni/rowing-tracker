import React, { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import Tesseract from 'tesseract.js';
import html2canvas from 'html2canvas';
import confetti from 'canvas-confetti';
import exifr from 'exifr';
import { db, auth, googleProvider, functions, storage } from './firebase';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
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

// Import constants
import {
  APP_VERSION,
  WORLD_CIRCUMFERENCE,
  MIN_METERS,
  MAX_METERS,
  COOLDOWN_MINUTES,
  RANKS,
  getUserRank,
  getNextRank,
  ACHIEVEMENTS,
  normalizeMachineName,
  getMachineName,
  QUOTES,
  MILESTONES,
  getMilestoneIndex,
  THEMES,
  DEFAULT_THEME,
  STANDARD_DISTANCES,
  getDistanceCategory,
  getActiveHoliday,
} from './constants';

// Import utilities
import {
  formatMeters,
  parseTimeInput,
} from './utils';

// Import context
import { AppContext } from './context/AppContext';

// Import components
import Header from './components/Header';
import EntryForm from './components/EntryForm';
import HomeTab from './components/HomeTab';
import ActivityFeed from './components/ActivityFeed';
import Leaderboard from './components/Leaderboard';
import StatsTab from './components/StatsTab';
import ConfirmEntryModal from './components/ConfirmEntryModal';
import ShareCardModal from './components/ShareCardModal';
import RowCelebration from './components/RowCelebration';
import AvatarBuilder from './components/AvatarBuilder';
import CrewMap from './components/CrewMap';
import SettingsModal from './components/SettingsModal';
import AdminPanel from './components/AdminPanel';
import UserProfileModal from './components/UserProfileModal';
import ChallengeDetailModal from './components/ChallengeDetailModal';
import WrappedModal from './components/WrappedModal';
import { CreateGroupModal, JoinGroupModal, InviteUserModal, ManageMembersModal, CreateChallengeModal } from './components/GroupModals';
import { PRModal, BustedModal, JourneyModal, AchievementModal, PhotoModal, InstallPrompt, WelcomeModal, ChangelogModal } from './components/SmallModals';
import MilestoneCelebration from './components/MilestoneCelebration';
import Icon from './components/Icon';

function App() {
  // Log visit once per session
  useEffect(() => {
    if (!sessionStorage.getItem('_av')) {
      sessionStorage.setItem('_av', '1');
      fetch('/.netlify/functions/log-visit', { method: 'POST' }).catch(() => {});
    }
  }, []);

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
  const [detectedTime, setDetectedTime] = useState('');
  const [detectedCalories, setDetectedCalories] = useState('');
  const [editableMeters, setEditableMeters] = useState('');
  const [editableTime, setEditableTime] = useState('');
  const [editableCalories, setEditableCalories] = useState('');
  const [manualMeters, setManualMeters] = useState('');
  const [manualTime, setManualTime] = useState('');
  const [manualCalories, setManualCalories] = useState('');
  const [isSubmittingManual, setIsSubmittingManual] = useState(false);
  const [displayName, setDisplayName] = useState('');
  const [newUsername, setNewUsername] = useState('');
  const [usernameStatus, setUsernameStatus] = useState(null); // null, 'checking', 'available', 'taken', 'invalid'
  const [recentMilestone, setRecentMilestone] = useState(null);
  const [showMilestoneCelebration, setShowMilestoneCelebration] = useState(null);
  const [activeTab, setActiveTab] = useState('feed'); // Will be set to 'home' after auth
  const [showLogModal, setShowLogModal] = useState(false);
  const [capturedImage, setCapturedImage] = useState(null);
  const [sessionType, setSessionType] = useState('free_row');
  const [testMode, setTestMode] = useState(false);
  const [showRowCelebration, setShowRowCelebration] = useState(false);
  const [showAvatarBuilder, setShowAvatarBuilder] = useState(false);
  const [showCrewMap, setShowCrewMap] = useState(false);
  const [validationError, setValidationError] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [showShareModal, setShowShareModal] = useState(false);
  const [lastSessionMeters, setLastSessionMeters] = useState(0);
  const [, setLastSessionTime] = useState(null); // For future share card enhancement
  const [, setLastSessionCalories] = useState(null); // For future share card enhancement
  const [shareImageUrl, setShareImageUrl] = useState(null);
  const [linkCopied, setLinkCopied] = useState(false);
  const [isCopying, setIsCopying] = useState(false);
  const [showBustedModal, setShowBustedModal] = useState(false);
  const [, setTestTapCount] = useState(0);
  const [showPRModal, setShowPRModal] = useState(null);
  const [dailyQuote, setDailyQuote] = useState(null);
  const [feedSearchQuery, setFeedSearchQuery] = useState('');
  const [feedTypeFilter, setFeedTypeFilter] = useState('row');
  const [showAchievementModal, setShowAchievementModal] = useState(null);
  const [showJourneyModal, setShowJourneyModal] = useState(false);
  const [showSettingsModal, setShowSettingsModal] = useState(false);
  const [isUploadingPhoto, setIsUploadingPhoto] = useState(false);
  const [showInstallPrompt, setShowInstallPrompt] = useState(false);
  const [deferredPrompt, setDeferredPrompt] = useState(null);
  const [isIOS, setIsIOS] = useState(false);
  const [isStandalone, setIsStandalone] = useState(false);
  const [feedPage, setFeedPage] = useState(1);
  const FEED_PAGE_SIZE = 15;
  const [achievementsPage, setAchievementsPage] = useState(0);
  const ACHIEVEMENTS_PAGE_SIZE = 12;
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
  const [leaderboardTab, setLeaderboardTab] = useState('alltime'); // alltime, weekly, streak, achievements, time, calories
  const [showSessionHistory, setShowSessionHistory] = useState(false);
  const [showWrapped, setShowWrapped] = useState(false);
  const [wrappedSlide, setWrappedSlide] = useState(0);
  const [wrappedDismissed, setWrappedDismissed] = useState(() => {
    return localStorage.getItem('wrappedDismissed2025') === 'true';
  });
  
  // AI Training
  const [aiMachineType, setAiMachineType] = useState('');
  const [customMachineName, setCustomMachineName] = useState('');
  const [showAiFeedbackToast, setShowAiFeedbackToast] = useState(false);
  const [toasts, setToasts] = useState([]);
  const toastIdRef = useRef(0);
  
  // Groups & Challenges
  const [groups, setGroups] = useState([]);
  const [selectedGroupId, setSelectedGroupId] = useState(null); // null = global view
  const [challenges, setChallenges] = useState([]);
  const [activities, setActivities] = useState([]); // Group/challenge activities for feed
  const [reactions, setReactions] = useState([]); // Reactions on feed items
  const [comments, setComments] = useState([]); // Comments on feed items
  const [expandedComments, setExpandedComments] = useState({}); // Track which items have comments expanded
  const [showReactionPicker, setShowReactionPicker] = useState(null); // Which item's picker is open
  const [newComment, setNewComment] = useState({}); // Comment input per item
  const [replyingTo, setReplyingTo] = useState({}); // Track which comment we're replying to per item
  const [notifications, setNotifications] = useState([]); // User notifications
  const [showNotifications, setShowNotifications] = useState(false); // Notification dropdown
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
  const [showInviteUserModal, setShowInviteUserModal] = useState(false);
  const [inviteUsername, setInviteUsername] = useState('');
  const [showManageMembersModal, setShowManageMembersModal] = useState(false);
  const [showWelcomeModal, setShowWelcomeModal] = useState(false);
  const [showChangelogModal, setShowChangelogModal] = useState(false);
  
  // Theme state
  const [currentTheme, setCurrentTheme] = useState(() => {
    return localStorage.getItem('rowcrew_theme') || DEFAULT_THEME;
  });
  
  const wrappedCardRef = useRef(null);
  
  const fileInputRef = useRef(null);
  const galleryInputRef = useRef(null);
  const previousTotalRef = useRef(0);
  const canvasRef = useRef(null);
  const shareCardRef = useRef(null);
  const profilePicInputRef = useRef(null);

  // Toast notification helper
  const showToast = useCallback((message, type = 'error', duration = 4000) => {
    const id = ++toastIdRef.current;
    setToasts(prev => [...prev, { id, message, type }]);
    setTimeout(() => {
      setToasts(prev => prev.filter(t => t.id !== id));
    }, duration);
  }, []);

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
      try {
        setCurrentUser(user);
        
        if (user) {
          // Check if user has a profile
          const profileRef = doc(db, 'users', user.uid);
          const profileSnap = await getDoc(profileRef);
          
          if (profileSnap.exists()) {
            const profileData = profileSnap.data();
            setUserProfile({ id: user.uid, ...profileData });
            setIsAdmin(profileData.isAdmin === true);
            setActiveTab('home');
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
      } catch (error) {
        console.error('Error loading user profile:', error);
        // Still allow app to load even if profile fetch fails
        setUserProfile(null);
        setIsAdmin(false);
      } finally {
        setAuthLoading(false);
      }
    });

    return () => unsubscribe();
  }, []);

  // Subscribe to real-time updates from Firebase
  useEffect(() => {
    setIsLoading(true);

    // Timeout fallback - if data doesn't load in 10 seconds, stop loading spinner
    const timeoutId = setTimeout(() => {
      setIsLoading(false);
      console.warn('Data loading timeout - Firebase may be unreachable');
      showToast('Slow connection. Some data may not have loaded.', 'info', 6000);
    }, 10000);

    const unsubUsers = onSnapshot(
      collection(db, 'users'),
      (snapshot) => {
        clearTimeout(timeoutId);
        const usersData = {};
        snapshot.forEach((docSnap) => {
          usersData[docSnap.id] = { id: docSnap.id, ...docSnap.data() };
        });
        setUsers(usersData);
        setIsLoading(false);
      },
      (error) => {
        clearTimeout(timeoutId);
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
      clearTimeout(timeoutId);
      unsubUsers();
      unsubEntries();
    };
  }, [showToast]);

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

  // Load activities for feed (group/challenge events)
  useEffect(() => {
    const activitiesQuery = query(
      collection(db, 'activities'),
      orderBy('createdAt', 'desc'),
      limit(100)
    );

    const unsubActivities = onSnapshot(
      activitiesQuery,
      (snapshot) => {
        const activitiesData = [];
        snapshot.forEach((docSnap) => {
          activitiesData.push({ id: docSnap.id, ...docSnap.data() });
        });
        setActivities(activitiesData);
      },
      (error) => {
        console.error('Error fetching activities:', error);
      }
    );

    return () => unsubActivities();
  }, []);

  // Load reactions for feed items
  useEffect(() => {
    const reactionsQuery = query(
      collection(db, 'reactions'),
      orderBy('createdAt', 'desc'),
      limit(500)
    );

    const unsubReactions = onSnapshot(
      reactionsQuery,
      (snapshot) => {
        const reactionsData = [];
        snapshot.forEach((docSnap) => {
          reactionsData.push({ id: docSnap.id, ...docSnap.data() });
        });
        setReactions(reactionsData);
      },
      (error) => {
        console.error('Error fetching reactions:', error);
      }
    );

    return () => unsubReactions();
  }, []);

  // Load comments for feed items
  useEffect(() => {
    const commentsQuery = query(
      collection(db, 'comments'),
      orderBy('createdAt', 'desc'),
      limit(500)
    );

    const unsubComments = onSnapshot(
      commentsQuery,
      (snapshot) => {
        const commentsData = [];
        snapshot.forEach((docSnap) => {
          commentsData.push({ id: docSnap.id, ...docSnap.data() });
        });
        setComments(commentsData);
      },
      (error) => {
        console.error('Error fetching comments:', error);
      }
    );

    return () => unsubComments();
  }, []);

  // Load notifications for current user
  useEffect(() => {
    if (!currentUser) {
      setNotifications([]);
      return;
    }

    const notificationsQuery = query(
      collection(db, 'notifications'),
      where('recipientId', '==', currentUser.uid),
      orderBy('createdAt', 'desc'),
      limit(50)
    );

    const unsubNotifications = onSnapshot(
      notificationsQuery,
      (snapshot) => {
        const notificationsData = [];
        snapshot.forEach((docSnap) => {
          notificationsData.push({ id: docSnap.id, ...docSnap.data() });
        });
        setNotifications(notificationsData);
      },
      (error) => {
        console.error('Error fetching notifications:', error);
      }
    );

    return () => unsubNotifications();
  }, [currentUser]);

  // Update user profile when it changes in Firebase
  useEffect(() => {
    if (currentUser && users[currentUser.uid]) {
      setUserProfile(users[currentUser.uid]);
    }
  }, [currentUser, users]);

  // Auto-generate username for existing users who don't have one
  useEffect(() => {
    const autoGenerateUsername = async () => {
      if (!currentUser || !userProfile || userProfile.username) return;
      
      // User exists but doesn't have a username - auto-generate one
      try {
        const baseUsername = generateUsernameFromName(userProfile.name || 'user');
        const username = await findAvailableUsername(baseUsername);
        
        await updateDoc(doc(db, 'users', currentUser.uid), {
          username: username
        });
        
        console.log('Auto-generated username:', username);
      } catch (error) {
        console.error('Error auto-generating username:', error);
      }
    };

    autoGenerateUsername();
  }, [currentUser, userProfile]);

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
        localStorage.setItem('rowcrew_lastSeenMilestone', getMilestoneIndex(currentTotal).toString());
        setTimeout(() => setRecentMilestone(null), 5000);
      }
    }

    previousTotalRef.current = currentTotal;
  }, [getTotalMeters]);

  // Check for first visit or new version
  useEffect(() => {
    const hasVisited = localStorage.getItem('rowcrew_visited');
    const lastSeenVersion = localStorage.getItem('rowcrew_version');

    // First time visitor - show welcome
    if (!hasVisited) {
      setShowWelcomeModal(true);
      localStorage.setItem('rowcrew_visited', 'true');
      localStorage.setItem('rowcrew_version', APP_VERSION);
      return;
    }

    // Returning user with new version - show changelog
    if (lastSeenVersion !== APP_VERSION) {
      setShowChangelogModal(true);
      localStorage.setItem('rowcrew_version', APP_VERSION);
    }
  }, []);

  // Check if user missed a milestone celebration (shows on next visit)
  useEffect(() => {
    if (isLoading || authLoading) return;
    const total = getTotalMeters();
    if (total === 0) return;

    const currentMilestoneIdx = getMilestoneIndex(total);
    const lastSeen = parseInt(localStorage.getItem('rowcrew_lastSeenMilestone') || '0', 10);

    if (currentMilestoneIdx > lastSeen && currentMilestoneIdx > 0) {
      // User missed a milestone — show celebration for the latest one
      const achievedMilestone = MILESTONES[currentMilestoneIdx - 1]; // -1 because getMilestoneIndex returns count
      if (achievedMilestone) {
        setShowMilestoneCelebration(achievedMilestone);
      }
    }
  }, [isLoading, authLoading, getTotalMeters]);

  // Apply theme to document (with holiday override)
  useEffect(() => {
    const theme = THEMES[currentTheme];
    if (!theme) return;

    const holiday = getActiveHoliday();
    const colors = holiday
      ? { ...theme.colors, ...holiday.colorOverrides }
      : theme.colors;

    const root = document.documentElement;
    root.setAttribute('data-theme', currentTheme);
    root.setAttribute('data-holiday', holiday?.id || '');

    // Apply CSS variables
    root.style.setProperty('--bg-dark', colors.bgDark);
    root.style.setProperty('--bg-card', colors.bgCard);
    root.style.setProperty('--bg-card-hover', colors.bgCardHover);
    root.style.setProperty('--accent-primary', colors.accentPrimary);
    root.style.setProperty('--accent-secondary', colors.accentSecondary);
    root.style.setProperty('--accent-gold', colors.accentGold);
    root.style.setProperty('--text-primary', colors.textPrimary);
    root.style.setProperty('--text-secondary', colors.textSecondary);
    root.style.setProperty('--text-muted', colors.textMuted);
    root.style.setProperty('--border-color', colors.borderColor);
    root.style.setProperty('--success', colors.success);
    root.style.setProperty('--error', colors.error || '#ef4444');
    root.style.setProperty('--warning', colors.warning || '#ffc107');
    root.style.setProperty('--shadow-glow', colors.shadowGlow);
    root.style.setProperty('--gradient-start', colors.gradientStart);
    root.style.setProperty('--gradient-end', colors.gradientEnd);
    root.style.setProperty('--header-glow', colors.headerGlow);
    root.style.setProperty('--progress-gradient', colors.progressGradient);
    root.style.setProperty('--progress-glow', colors.progressGlow);

    // Save preference
    localStorage.setItem('rowcrew_theme', currentTheme);
  }, [currentTheme]);

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
      
      showToast(errorMessage);
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

  // Validate username format
  const isValidUsername = (username) => {
    // 3-20 chars, lowercase letters, numbers, underscores only
    const regex = /^[a-z0-9_]{3,20}$/;
    return regex.test(username);
  };

  // Generate username from display name
  const generateUsernameFromName = (name) => {
    return name
      .toLowerCase()
      .trim()
      .replace(/\s+/g, '_')           // spaces to underscores
      .replace(/[^a-z0-9_]/g, '')     // remove special chars
      .slice(0, 20);                   // max 20 chars
  };

  // Find available username (adds numbers if taken)
  const findAvailableUsername = async (baseUsername) => {
    let username = baseUsername;
    if (username.length < 3) {
      username = username.padEnd(3, '0');
    }

    // Check if base username is available
    const usernameQuery = query(
      collection(db, 'users'),
      where('username', '==', username),
      limit(1)
    );
    const snapshot = await getDocs(usernameQuery);
    
    if (snapshot.empty) {
      return username;
    }

    // Try adding numbers
    for (let i = 1; i <= 99; i++) {
      const candidate = `${baseUsername.slice(0, 17)}_${i}`;
      const checkQuery = query(
        collection(db, 'users'),
        where('username', '==', candidate),
        limit(1)
      );
      const checkSnapshot = await getDocs(checkQuery);
      if (checkSnapshot.empty) {
        return candidate;
      }
    }

    // Fallback: random suffix
    return `${baseUsername.slice(0, 14)}_${Date.now().toString(36).slice(-5)}`;
  };

  // Check if username is available
  const checkUsernameAvailable = async (username) => {
    if (!username || !isValidUsername(username)) {
      setUsernameStatus('invalid');
      return false;
    }

    setUsernameStatus('checking');

    try {
      // Check if any user has this username
      const usernameQuery = query(
        collection(db, 'users'),
        where('username', '==', username.toLowerCase()),
        limit(1)
      );
      const snapshot = await getDocs(usernameQuery);

      if (snapshot.empty) {
        setUsernameStatus('available');
        return true;
      } else {
        setUsernameStatus('taken');
        return false;
      }
    } catch (error) {
      console.error('Error checking username:', error);
      setUsernameStatus(null);
      return false;
    }
  };

  // Debounced username check
  const handleUsernameChange = (value) => {
    const cleaned = value.toLowerCase().replace(/[^a-z0-9_]/g, '');
    setNewUsername(cleaned);
    
    if (cleaned.length < 3) {
      setUsernameStatus(cleaned.length > 0 ? 'invalid' : null);
      return;
    }

    // Debounce the check
    const timeoutId = setTimeout(() => {
      checkUsernameAvailable(cleaned);
    }, 500);

    return () => clearTimeout(timeoutId);
  };

  // Create user profile
  const handleCreateProfile = async () => {
    if (!displayName.trim() || !currentUser) return;

    try {
      // Auto-generate username from display name
      const baseUsername = generateUsernameFromName(displayName.trim());
      const username = await findAvailableUsername(baseUsername);

      const userRef = doc(db, 'users', currentUser.uid);
      await setDoc(userRef, {
        name: displayName.trim(),
        username: username,
        email: currentUser.email,
        photoURL: currentUser.photoURL,
        totalMeters: 0,
        uploadCount: 0,
        createdAt: new Date().toISOString(),
      });

      setUserProfile({
        id: currentUser.uid,
        name: displayName.trim(),
        username: username,
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
      
      showToast('Failed to create profile. Please try again.');
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

  // Log activity to feed (groups, challenges, etc.)
  const logActivity = async (type, data) => {
    if (!currentUser) return;

    try {
      const activityId = `activity_${Date.now()}_${currentUser.uid.slice(0, 6)}`;
      await setDoc(doc(db, 'activities', activityId), {
        type,
        userId: currentUser.uid,
        createdAt: serverTimestamp(),
        ...data
      });
      // Fire-and-forget to ecosystem feed
      const title = type === 'row_completed'
        ? `Rowed ${data.meters || '?'}m`
        : (data.groupName || data.challengeName || type);
      fetch('/.netlify/functions/log-activity', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ type, title: title.slice(0, 120) }),
      }).catch(() => {});
    } catch (error) {
      console.error('Error logging activity:', error);
    }
  };

  // Available reaction emojis
  const REACTION_EMOJIS = ['💪', '🔥', '👏', '🎉', '⚡'];

  // Memoized reaction counts by item
  const reactionCountsByItem = useMemo(() => {
    const map = {};
    reactions.forEach(r => {
      if (!map[r.targetId]) map[r.targetId] = {};
      map[r.targetId][r.emoji] = (map[r.targetId][r.emoji] || 0) + 1;
    });
    return map;
  }, [reactions]);

  // Memoized user reactions lookup
  const userReactionsByItem = useMemo(() => {
    if (!currentUser) return {};
    const map = {};
    reactions.forEach(r => {
      if (r.userId === currentUser.uid) {
        if (!map[r.targetId]) map[r.targetId] = new Set();
        map[r.targetId].add(r.emoji);
      }
    });
    return map;
  }, [reactions, currentUser]);

  const getReactionCounts = useCallback((itemId) => reactionCountsByItem[itemId] || {}, [reactionCountsByItem]);

  const hasUserReacted = useCallback((itemId, emoji) => {
    return userReactionsByItem[itemId]?.has(emoji) || false;
  }, [userReactionsByItem]);

  // Toggle a reaction on a feed item
  const toggleReaction = async (itemId, emoji) => {
    if (!currentUser) return;

    try {
      const existingReaction = reactions.find(r => 
        r.targetId === itemId && 
        r.userId === currentUser.uid && 
        r.emoji === emoji
      );

      if (existingReaction) {
        // Remove reaction
        await deleteDoc(doc(db, 'reactions', existingReaction.id));
      } else {
        // Add reaction
        const reactionId = `reaction_${Date.now()}_${currentUser.uid.slice(0, 6)}`;
        await setDoc(doc(db, 'reactions', reactionId), {
          targetId: itemId,
          userId: currentUser.uid,
          emoji,
          createdAt: serverTimestamp()
        });
      }
    } catch (error) {
      console.error('Error toggling reaction:', error);
      showToast('Couldn\'t save reaction. Try again.');
    }
  };

  // Memoized comments grouped by item
  const commentsByItem = useMemo(() => {
    const map = {};
    comments.forEach(c => {
      if (!map[c.targetId]) map[c.targetId] = [];
      map[c.targetId].push(c);
    });
    Object.values(map).forEach(arr => arr.sort((a, b) => {
      const dateA = a.createdAt?.toDate ? a.createdAt.toDate() : new Date(a.createdAt);
      const dateB = b.createdAt?.toDate ? b.createdAt.toDate() : new Date(b.createdAt);
      return dateA - dateB;
    }));
    return map;
  }, [comments]);

  const getItemComments = useCallback((itemId) => commentsByItem[itemId] || [], [commentsByItem]);

  // Add a comment to a feed item
  const addComment = async (itemId, feedItemOwnerId) => {
    if (!currentUser || !newComment[itemId]?.trim()) return;

    try {
      const commentId = `comment_${Date.now()}_${currentUser.uid.slice(0, 6)}`;
      const commentText = newComment[itemId].trim();
      const replyTo = replyingTo[itemId];
      
      // Build comment data
      const commentData = {
        targetId: itemId,
        userId: currentUser.uid,
        text: commentText,
        createdAt: serverTimestamp()
      };
      
      // If replying to another comment, add reply info
      if (replyTo) {
        commentData.replyToId = replyTo.commentId;
        commentData.replyToUserId = replyTo.userId;
        commentData.replyToName = replyTo.userName;
      }
      
      await setDoc(doc(db, 'comments', commentId), commentData);
      
      // Create notification for reply
      if (replyTo && replyTo.userId !== currentUser.uid) {
        const notifId = `notif_${Date.now()}_${currentUser.uid.slice(0, 6)}`;
        await setDoc(doc(db, 'notifications', notifId), {
          type: 'reply',
          recipientId: replyTo.userId,
          fromUserId: currentUser.uid,
          fromUserName: userProfile?.name || 'Someone',
          targetId: itemId,
          commentId: commentId,
          commentText: commentText.slice(0, 50),
          read: false,
          createdAt: serverTimestamp()
        });
      }
      // Create notification for comment on feed item (if not replying and not own post)
      else if (!replyTo && feedItemOwnerId && feedItemOwnerId !== currentUser.uid) {
        const notifId = `notif_${Date.now()}_${currentUser.uid.slice(0, 6)}`;
        await setDoc(doc(db, 'notifications', notifId), {
          type: 'comment',
          recipientId: feedItemOwnerId,
          fromUserId: currentUser.uid,
          fromUserName: userProfile?.name || 'Someone',
          targetId: itemId,
          commentId: commentId,
          commentText: commentText.slice(0, 50),
          read: false,
          createdAt: serverTimestamp()
        });
      }
      
      // Clear input and reply state
      setNewComment(prev => ({ ...prev, [itemId]: '' }));
      setReplyingTo(prev => ({ ...prev, [itemId]: null }));
    } catch (error) {
      console.error('Error adding comment:', error);
      showToast('Comment failed to send. Try again.');
    }
  };

  // Mark notification as read
  const markNotificationRead = async (notificationId) => {
    if (!currentUser) return;
    
    try {
      await updateDoc(doc(db, 'notifications', notificationId), {
        read: true
      });
    } catch (error) {
      console.error('Error marking notification read:', error);
    }
  };

  // Mark all notifications as read
  const markAllNotificationsRead = async () => {
    if (!currentUser) return;
    
    try {
      const unreadNotifs = notifications.filter(n => !n.read);
      await Promise.all(
        unreadNotifs.map(n => 
          updateDoc(doc(db, 'notifications', n.id), { read: true })
        )
      );
    } catch (error) {
      console.error('Error marking all notifications read:', error);
    }
  };

  // Get unread notification count
  const unreadNotificationCount = notifications.filter(n => !n.read).length;

  // Delete a comment (only own comments)
  const deleteComment = async (commentId, commentUserId) => {
    if (!currentUser || currentUser.uid !== commentUserId) return;

    try {
      await deleteDoc(doc(db, 'comments', commentId));
    } catch (error) {
      console.error('Error deleting comment:', error);
      showToast('Couldn\'t delete comment. Try again.');
    }
  };

  // Create a new group
  const handleCreateGroup = async () => {
    if (!newGroupName.trim() || !currentUser) return;

    setIsCreatingGroup(true);
    setGroupError('');

    try {
      const groupId = `group_${Date.now()}_${currentUser.uid.slice(0, 6)}`;
      const inviteCode = generateInviteCode();
      const groupName = newGroupName.trim();

      await setDoc(doc(db, 'groups', groupId), {
        name: groupName,
        description: newGroupDescription.trim(),
        inviteCode,
        createdBy: currentUser.uid,
        adminIds: [currentUser.uid],
        memberIds: [currentUser.uid],
        createdAt: serverTimestamp(),
      });

      // Log activity
      await logActivity('group_created', {
        groupId,
        groupName
      });

      setNewGroupName('');
      setNewGroupDescription('');
      setShowCreateGroupModal(false);
      setSelectedGroupId(groupId);
    } catch (error) {
      console.error('Error creating group:', error);
      showToast('Couldn\'t create group. Try again.');
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

      // Log activity
      await logActivity('group_joined', {
        groupId: groupDoc.id,
        groupName: groupData.name
      });

      setJoinGroupCode('');
      setShowJoinGroupModal(false);
      setSelectedGroupId(groupDoc.id);
    } catch (error) {
      console.error('Error joining group:', error);
      showToast('Couldn\'t join group. Try again.');
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

      const isLastMember = group.memberIds?.length <= 1;
      const isOnlyAdmin = group.adminIds?.length === 1 && group.adminIds[0] === currentUser.uid;
      const hasOtherMembers = group.memberIds?.length > 1;

      if (isLastMember) {
        // Last member leaving - delete the group
        await deleteDoc(doc(db, 'groups', groupId));
      } else if (isOnlyAdmin && hasOtherMembers) {
        // Only admin leaving but others exist - transfer admin to next member
        const nextAdmin = group.memberIds.find(id => id !== currentUser.uid);
        
        await updateDoc(doc(db, 'groups', groupId), {
          memberIds: arrayRemove(currentUser.uid),
          adminIds: arrayRemove(currentUser.uid)
        });
        
        // Add new admin
        await updateDoc(doc(db, 'groups', groupId), {
          adminIds: arrayUnion(nextAdmin)
        });
      } else {
        // Regular member or one of multiple admins - just leave
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
      showToast('Couldn\'t leave group. Try again.');
    }
  };

  // Remove a member from group (admin only)
  const handleRemoveMember = async (groupId, memberId) => {
    if (!currentUser || !groupId || !memberId) return;
    if (!isGroupAdmin(groupId)) return;

    try {
      const group = groups.find(g => g.id === groupId);
      if (!group) return;

      // Can't remove yourself using this function
      if (memberId === currentUser.uid) {
        showToast('Use "Leave Group" to remove yourself.', 'info');
        return;
      }

      // Remove member from group
      await updateDoc(doc(db, 'groups', groupId), {
        memberIds: arrayRemove(memberId),
        adminIds: arrayRemove(memberId)
      });
    } catch (error) {
      console.error('Error removing member:', error);
      showToast('Couldn\'t remove member. Try again.');
    }
  };

  // Transfer admin role to another member
  const handleTransferAdmin = async (groupId, newAdminId) => {
    if (!currentUser || !groupId || !newAdminId) return;
    if (!isGroupAdmin(groupId)) return;

    try {
      const group = groups.find(g => g.id === groupId);
      if (!group) return;

      // Add new admin
      await updateDoc(doc(db, 'groups', groupId), {
        adminIds: arrayUnion(newAdminId)
      });

      // Log activity
      const newAdmin = users[newAdminId];
      await logActivity('admin_transferred', {
        groupId,
        groupName: group.name,
        newAdminId,
        newAdminName: newAdmin?.name || 'Unknown'
      });
    } catch (error) {
      console.error('Error transferring admin:', error);
      showToast('Admin transfer failed. Try again.');
    }
  };

  // Remove admin role from a member (keep them as member)
  const handleRemoveAdmin = async (groupId, adminId) => {
    if (!currentUser || !groupId || !adminId) return;
    if (!isGroupAdmin(groupId)) return;

    try {
      const group = groups.find(g => g.id === groupId);
      if (!group) return;

      // Must have at least one admin
      if (group.adminIds?.length <= 1) {
        showToast('Group must have at least one admin.', 'info');
        return;
      }

      // Remove admin role
      await updateDoc(doc(db, 'groups', groupId), {
        adminIds: arrayRemove(adminId)
      });
    } catch (error) {
      console.error('Error removing admin:', error);
      showToast('Couldn\'t update admin role. Try again.');
    }
  };

  // Search users by username or name (partial match)
  const searchUsers = (searchTerm) => {
    if (!searchTerm || searchTerm.length < 1) {
      return [];
    }

    const term = searchTerm.toLowerCase();
    const group = getSelectedGroup();
    
    return Object.values(users)
      .filter(user => {
        const matchesName = user.name?.toLowerCase().includes(term);
        const matchesUsername = user.username?.toLowerCase().includes(term);
        return matchesName || matchesUsername;
      })
      .map(user => ({
        ...user,
        isAlreadyMember: group?.memberIds?.includes(user.id)
      }))
      .slice(0, 10); // Limit results
  };

  // Invite user to group
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
      const challengeName = newChallengeName.trim();
      const group = groups.find(g => g.id === selectedGroupId);

      await setDoc(doc(db, 'challenges', challengeId), {
        groupId: selectedGroupId,
        name: challengeName,
        type: newChallengeType,
        targetMeters: newChallengeType === 'collective' ? targetValue : null,
        targetCalories: newChallengeType === 'collective_calories' ? targetValue : null,
        targetDistance: newChallengeType === 'time_trial' ? targetValue : null,
        startDate: new Date(newChallengeStartDate).toISOString(),
        endDate: new Date(newChallengeEndDate).toISOString(),
        createdBy: currentUser.uid,
        createdAt: serverTimestamp(),
        participants: {},
      });

      // Log activity
      await logActivity('challenge_created', {
        challengeId,
        challengeName,
        challengeType: newChallengeType,
        groupId: selectedGroupId,
        groupName: group?.name || 'Unknown Group'
      });

      setNewChallengeName('');
      setNewChallengeType('collective');
      setNewChallengeTarget('');
      setNewChallengeStartDate('');
      setNewChallengeEndDate('');
      setShowCreateChallengeModal(false);
    } catch (error) {
      console.error('Error creating challenge:', error);
      showToast('Couldn\'t create challenge. Try again.');
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
    if (challenge.type !== 'collective' && challenge.type !== 'collective_calories') return null;

    const group = groups.find(g => g.id === challenge.groupId);
    if (!group) return { current: 0, target: challenge.targetMeters || challenge.targetCalories || 0 };

    const start = new Date(challenge.startDate);
    const end = new Date(challenge.endDate);

    // Sum entries from group members during challenge period
    const challengeEntries = entries.filter(e => 
      group.memberIds?.includes(e.userId) &&
      new Date(e.date) >= start &&
      new Date(e.date) <= end
    );

    if (challenge.type === 'collective_calories') {
      const currentCalories = challengeEntries.reduce((sum, e) => sum + (e.calories || 0), 0);
      return {
        current: currentCalories,
        target: challenge.targetCalories || 0,
        percentage: challenge.targetCalories ? Math.min(100, (currentCalories / challenge.targetCalories) * 100) : 0,
        unit: 'cal'
      };
    }

    const currentMeters = challengeEntries.reduce((sum, e) => sum + e.meters, 0);

    return {
      current: currentMeters,
      target: challenge.targetMeters || 0,
      percentage: challenge.targetMeters ? Math.min(100, (currentMeters / challenge.targetMeters) * 100) : 0,
      unit: 'm'
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

    // For other challenge types - calculate metrics
    const memberProgress = group.memberIds?.map(odometer => {
      const memberEntries = entries.filter(e => 
        e.userId === odometer &&
        new Date(e.date) >= start &&
        new Date(e.date) <= end
      );

      const totalMeters = memberEntries.reduce((sum, e) => sum + e.meters, 0);
      const totalTime = memberEntries.reduce((sum, e) => sum + (e.time || 0), 0);
      const totalCalories = memberEntries.reduce((sum, e) => sum + (e.calories || 0), 0);
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
        totalTime,
        totalCalories,
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
    } else if (challenge.type === 'total_time') {
      return memberProgress.filter(m => m.totalTime > 0).sort((a, b) => b.totalTime - a.totalTime);
    } else if (challenge.type === 'calories' || challenge.type === 'collective_calories') {
      return memberProgress.filter(m => m.totalCalories > 0).sort((a, b) => b.totalCalories - a.totalCalories);
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
      showToast('Couldn\'t submit time trial. Try again.');
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
      showToast('Photo upload failed. Try again.');
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

    // Extract photo date from EXIF metadata
    let photoDate = null;
    try {
      const exif = await exifr.parse(file, ['DateTimeOriginal']);
      if (exif?.DateTimeOriginal) {
        photoDate = new Date(exif.DateTimeOriginal);
      }
    } catch (exifError) {
      console.error('EXIF parse error:', exifError);
    }

    const reader = new FileReader();
    reader.onload = async (e) => {
      const imageData = e.target.result;
      setCapturedImage(imageData);

      // Extract base64 for Claude verification
      const imageBase64 = imageData.split(',')[1];

      let claudeResult = null;
      let detectedMeterValue = null;
      let detectedTimeValue = null;
      let detectedCalorieValue = null;

      try {
        // Try Claude verification first
        setProcessingStatus('AI analyzing image...');
        try {
          const verifyRowEntry = httpsCallable(functions, 'verifyRowEntry');
          // Race the Cloud Function against a 30s timeout
          const result = await Promise.race([
            verifyRowEntry({
              imageBase64,
              claimedMeters: 0,
              sessionType: sessionType,
            }),
            new Promise((_, reject) => setTimeout(() => reject(new Error('AI analysis timed out')), 30000)),
          ]);
          claudeResult = result.data;
          console.log('[RowCrew] Claude result:', JSON.stringify({ meters: claudeResult.extractedMeters, time: claudeResult.extractedTime, cal: claudeResult.extractedCalories, confidence: claudeResult.confidence, display: claudeResult.displayType, status: claudeResult.status }));

          // If Claude extracted meters successfully
          if (claudeResult.extractedMeters && claudeResult.confidence >= 60) {
            detectedMeterValue = claudeResult.extractedMeters;
            const typeLabel = claudeResult.workoutType === 'interval' ? ' (interval)' : '';
            const estLabel = claudeResult.metersEstimated ? ' (estimated)' : '';
            setProcessingStatus(`AI detected: ${detectedMeterValue}m${typeLabel}${estLabel}`);
          } else if (claudeResult.extractedMeters) {
            detectedMeterValue = claudeResult.extractedMeters;
            const estLabel = claudeResult.metersEstimated ? ' (estimated from calories)' : ' (low confidence)';
            setProcessingStatus(`AI detected meters${estLabel}`);
          }

          // Also grab time and calories if AI detected them
          if (claudeResult.extractedTime) {
            detectedTimeValue = claudeResult.extractedTime;
          }
          if (claudeResult.extractedCalories) {
            detectedCalorieValue = claudeResult.extractedCalories;
          }
        } catch (verifyError) {
          console.error('[RowCrew] Claude verification error:', verifyError?.message || verifyError);
          setProcessingStatus('AI unavailable, using OCR...');

          // Fallback to Tesseract OCR
          try {
            detectedMeterValue = await extractMetersFromImage(imageData);
          } catch (ocrError) {
            console.error('[RowCrew] OCR fallback also failed:', ocrError);
          }
        }

        // Store Claude result for later use
        setCapturedImage({
          data: imageData,
          base64: imageBase64,
          claudeResult,
          photoDate
        });

        // Set detected values
        if (detectedMeterValue) {
          setDetectedMeters(detectedMeterValue.toString());
          setEditableMeters(detectedMeterValue.toString());
        } else {
          setDetectedMeters('');
          setEditableMeters('');
        }

        // Set detected time (format as MM:SS if it's in seconds)
        if (detectedTimeValue) {
          const mins = Math.floor(detectedTimeValue / 60);
          const secs = Math.floor(detectedTimeValue % 60);
          const timeStr = `${mins}:${secs.toString().padStart(2, '0')}`;
          setDetectedTime(timeStr);
          setEditableTime(timeStr);
        } else {
          setDetectedTime('');
          setEditableTime('');
        }

        // Set detected calories
        if (detectedCalorieValue) {
          setDetectedCalories(detectedCalorieValue.toString());
          setEditableCalories(detectedCalorieValue.toString());
        } else {
          setDetectedCalories('');
          setEditableCalories('');
        }

        // Reset machine type selection
        setAiMachineType('');

        console.log('[RowCrew] Opening confirm modal. Meters:', detectedMeterValue, 'Time:', detectedTimeValue, 'Cal:', detectedCalorieValue);
        setShowLogModal(false);
        setTimeout(() => setShowConfirmModal(true), 100);
      } catch (outerError) {
        console.error('[RowCrew] Image processing failed:', outerError);
        showToast('Something went wrong processing your image. Try again.');
      } finally {
        setIsProcessing(false);
      }
    };
    reader.readAsDataURL(file);

    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
    if (galleryInputRef.current) {
      galleryInputRef.current.value = '';
    }
  };

  // Convert data URL to Blob for Storage upload
  const dataUrlToBlob = (dataUrl) => {
    const [header, base64] = dataUrl.split(',');
    const mime = header.match(/:(.*?);/)[1];
    const bytes = atob(base64);
    const arr = new Uint8Array(bytes.length);
    for (let i = 0; i < bytes.length; i++) arr[i] = bytes.charCodeAt(i);
    return new Blob([arr], { type: mime });
  };

  // Add entry to Firebase
  const addEntry = async (meters, imageData, timeSeconds = null, calories = null, machineInfo = null) => {
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

      // Upload photo to Firebase Storage if present
      let imageUrl = null;
      console.log('[RowCrew] Image data present:', !!imageData?.data, 'length:', imageData?.data?.length || 0);
      if (imageData?.data) {
        try {
          const blob = dataUrlToBlob(imageData.data);
          console.log('[RowCrew] Blob created:', blob.size, 'bytes, type:', blob.type);
          const imageRef = ref(storage, `row-images/${currentUser.uid}/${entryId}.jpg`);
          await uploadBytes(imageRef, blob, { contentType: 'image/jpeg' });
          imageUrl = await getDownloadURL(imageRef);
          console.log('[RowCrew] Upload success:', imageUrl);
        } catch (uploadErr) {
          console.error('[RowCrew] Image upload FAILED:', uploadErr?.code, uploadErr?.message || uploadErr);
        }
      }

      await setDoc(entryRef, {
        userId: currentUser.uid,
        meters: meters,
        time: timeSeconds || null,
        calories: calories || null,
        date: (imageData?.photoDate || new Date()).toISOString(),
        localHour: new Date().getHours(),
        createdAt: serverTimestamp(),
        verificationStatus: verification.status,
        verificationDetails: {
          confidence: verification.confidence || 0,
          extractedMeters: verification.extractedMeters || null,
          displayType: verification.displayType || null,
          reason: verification.reason || null,
          imageHash: imageHash,
        },
        imageUrl: imageUrl,
        sessionType: sessionType || 'free_row',
        machineType: machineInfo?.type || null,
        machineCustomName: machineInfo?.customName || null,
      });

      const userRef = doc(db, 'users', currentUser.uid);
      const finalMeters = meters;
      const newTotalMeters = (userProfile.totalMeters || 0) + finalMeters;
      const newTotalTime = (userProfile.totalTime || 0) + (timeSeconds || 0);
      const newTotalCalories = (userProfile.totalCalories || 0) + (calories || 0);
      
      // Build user update object
      const userUpdate = {
        ...userProfile,
        totalMeters: newTotalMeters,
        totalTime: newTotalTime,
        totalCalories: newTotalCalories,
        uploadCount: (userProfile.uploadCount || 0) + 1,
        lastRowDate: new Date().toISOString(),
      };
      
      // Save last used machine (for users who haven't set a default)
      if (machineInfo?.type) {
        userUpdate.lastUsedMachine = machineInfo.type;
        userUpdate.lastUsedMachineCustomName = machineInfo.customName || null;
      }

      // Auto-set default machine on first use
      if (machineInfo?.type && !userProfile.defaultMachine) {
        userUpdate.defaultMachine = machineInfo.type;
        userUpdate.customMachineName = machineInfo.customName || null;
      }
      
      await setDoc(userRef, userUpdate, { merge: true });

      // Check for Personal Record before adding to entries list
      const isPR = checkForPR(currentUser.uid, finalMeters);
      
      // Store for share card
      setLastSessionMeters(finalMeters);
      setLastSessionTime(timeSeconds);
      setLastSessionCalories(calories);
      
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

      // Log row completion to activity feed
      logActivity('row_completed', {
        meters: finalMeters,
        time: timeSeconds || null,
        calories: calories || null,
        verification: verification.status,
        totalMeters: newTotalMeters,
      });

      // Sync to BenchOnly if enabled (fire-and-forget)
      if (userProfile?.syncToBenchOnly && currentUser?.email) {
        fetch('https://benchpressonly.com/.netlify/functions/log-external-cardio', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            secret: 'rowcrew-benchonly-sync-2026',
            email: currentUser.email,
            meters: finalMeters,
            time: timeSeconds || null,
            calories: calories || null,
            date: new Date().toISOString(),
            source: 'rowcrew',
          }),
        }).catch(() => {});

        // Log sync event to portfolio dashboard (triggers avatar walk to benchpress station)
        fetch('https://azoni.netlify.app/.netlify/functions/log-agent-activity', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            type: 'cross_app_sync',
            title: `Synced ${finalMeters.toLocaleString()}m to BenchOnly`,
            source: 'rowcrew',
            description: 'Row Crew → BenchOnly cardio sync',
            metadata: { targetStation: 'benchpress' },
            secret: 'moltbook-azoni-secret-123',
          }),
        }).catch(() => {});
      }

      // Check for new distance record (500m, 1K, 2K, 5K, 10K, 15K)
      if (timeSeconds && timeSeconds > 0 && verification.status !== 'unverified') {
        const distCat = getDistanceCategory(finalMeters);
        if (distCat) {
          // Check if this is the user's best time for this distance
          const previousBest = entries
            .filter(e => e.userId === currentUser.uid && e.time && e.time > 0
              && getDistanceCategory(e.meters)?.meters === distCat.meters
              && ['verified', 'pending_review'].includes(e.verificationStatus))
            .reduce((best, e) => (!best || e.time < best) ? e.time : best, null);

          if (!previousBest || timeSeconds < previousBest) {
            logActivity('distance_record', {
              meters: finalMeters,
              time: timeSeconds,
              distanceLabel: distCat.label,
              distanceMeters: distCat.meters,
              previousBest: previousBest || null,
              isFirstRecord: !previousBest,
            });
          }
        }
      }

      // Check for new achievements and rank promotion (after a delay to let state update)
      setTimeout(async () => {
        await checkAndSaveNewAchievements(currentUser.uid);
        await checkAndSaveRankPromotion(currentUser.uid, newTotalMeters);
      }, 1000);

      return true;
    } catch (error) {
      console.error('Error adding entry:', error);
      showToast('Failed to save entry. Try again.');
      
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

    // Parse optional time
    const timeSeconds = parseTimeInput(manualTime);
    
    // Parse optional calories
    const calories = manualCalories ? parseInt(manualCalories, 10) : null;

    // Determine machine type
    const effectiveMachineType = aiMachineType || userProfile?.defaultMachine || userProfile?.lastUsedMachine || null;
    const effectiveCustomName = customMachineName || 
      (effectiveMachineType === 'other' ? (userProfile?.customMachineName || userProfile?.lastUsedMachineCustomName) : null);

    setIsSubmittingManual(true);
    setValidationError('');
    
    // Add entry without image (will be marked as unverified)
    const machineInfo = effectiveMachineType ? {
      type: effectiveMachineType,
      customName: effectiveCustomName,
    } : null;
    
    if (testMode === 'dry' || testMode === 'review') {
      setIsSubmittingManual(false);
      showToast('Manual entries skip test mode', 'info');
      setShowLogModal(false);
      setTestMode(false);
      return;
    }

    const success = await addEntry(meters, null, timeSeconds, calories, machineInfo);

    setIsSubmittingManual(false);
    
    if (success) {
      setManualMeters('');
      setManualTime('');
      setManualCalories('');
      setAiMachineType('');
      setCustomMachineName('');
      setValidationError('');
      // Close log modal and show celebration
      setShowLogModal(false);
      setShareImageUrl(null);
      setLastSessionMeters(parseInt(manualMeters, 10) || 0);
      setShowRowCelebration(true);
      setLinkCopied(false);
    }
  };

  // Confirm entry
  const handleConfirmEntry = async () => {
    if (isProcessing) return; // Prevent double submit
    const meters = parseInt(editableMeters, 10);

    if (!meters || isNaN(meters)) {
      setValidationError('Please enter a valid number');
      return;
    }

    // Parse optional time and calories
    const timeSeconds = parseTimeInput(editableTime);
    const calories = editableCalories ? parseInt(editableCalories, 10) : null;

    setIsProcessing(true);
    
    // Determine machine type to use (priority: selected > default > lastUsed)
    const effectiveMachineType = aiMachineType || userProfile?.defaultMachine || userProfile?.lastUsedMachine || null;
    const effectiveCustomName = customMachineName || 
      (effectiveMachineType === 'other' ? (userProfile?.customMachineName || userProfile?.lastUsedMachineCustomName) : null);
    
    // Save AI feedback for training
    if (capturedImage?.claudeResult) {
      const aiResult = capturedImage.claudeResult;
      
      // Check what changed
      const metersDiffer = aiResult.extractedMeters && Math.abs(meters - aiResult.extractedMeters) > 10;
      const aiDetectedTime = aiResult.extractedTime || null;
      const aiDetectedCalories = aiResult.extractedCalories || null;
      const timeDiffer = aiDetectedTime && timeSeconds && Math.abs(timeSeconds - aiDetectedTime) > 5;
      const caloriesDiffer = aiDetectedCalories && calories && Math.abs(calories - aiDetectedCalories) > 5;
      
      // Track when user provides data AI missed
      const userProvidedMissingTime = !aiDetectedTime && timeSeconds;
      const userProvidedMissingCalories = !aiDetectedCalories && calories;
      
      // Determine if corrections were made (for toast)
      const hasCorrections = metersDiffer || timeDiffer || caloriesDiffer;

      // Fire-and-forget: save feedback without blocking the entry submission
      saveAiFeedback({
        aiExtracted: {
          meters: aiResult.extractedMeters || null,
          time: aiDetectedTime,
          calories: aiDetectedCalories,
          confidence: aiResult.confidence,
          displayType: aiResult.displayType,
          isRowingMachine: aiResult.isRowingMachineDisplay,
        },
        userConfirmed: {
          meters,
          time: timeSeconds,
          calories,
        },
        corrections: {
          meters: metersDiffer,
          time: timeDiffer,
          calories: caloriesDiffer,
          providedMissingTime: userProvidedMissingTime,
          providedMissingCalories: userProvidedMissingCalories,
        },
        machine: {
          type: effectiveMachineType,
          customName: effectiveCustomName,
          displayName: getMachineName(effectiveMachineType, effectiveCustomName),
          normalizedId: normalizeMachineName(effectiveCustomName) || effectiveMachineType,
        },
        imageHash: aiResult.imageHash,
      }).then(() => {
        if (hasCorrections) {
          setShowAiFeedbackToast(true);
          setTimeout(() => setShowAiFeedbackToast(false), 3000);
        }
      }).catch((error) => {
        console.error('Error saving AI feedback:', error);
      });
    }
    
    // Pass machine info to addEntry
    const machineInfo = effectiveMachineType ? {
      type: effectiveMachineType,
      customName: effectiveCustomName,
    } : null;
    
    if (testMode === 'dry') {
      setIsProcessing(false);
      setShowConfirmModal(false);
      setDetectedMeters(''); setDetectedTime(''); setDetectedCalories('');
      setEditableMeters(''); setEditableTime(''); setEditableCalories('');
      setAiMachineType(''); setCustomMachineName('');
      setValidationError('');
      setShowLogModal(false);
      setLastSessionMeters(meters);
      setShowRowCelebration(true);
      setTestMode(false);
      return;
    }

    if (testMode === 'review') {
      // Save entry + photo as pending_review but don't update user stats
      try {
        const entryId = `test_${Date.now()}_${currentUser.uid}`;
        const entryRef = doc(db, 'entries', entryId);
        let imageUrl = null;
        if (capturedImage?.data) {
          try {
            const imageRef = ref(storage, `row-images/${currentUser.uid}/${entryId}.jpg`);
            await uploadBytes(imageRef, dataUrlToBlob(capturedImage.data), { contentType: 'image/jpeg' });
            imageUrl = await getDownloadURL(imageRef);
          } catch (e) { console.error('Test upload error:', e); }
        }
        await setDoc(entryRef, {
          userId: currentUser.uid,
          meters, time: timeSeconds || null, calories: calories || null,
          date: new Date().toISOString(),
          createdAt: serverTimestamp(),
          verificationStatus: 'pending_review',
          verificationDetails: { reason: 'Admin test upload', confidence: 0 },
          imageUrl, sessionType: sessionType || 'free_row',
          isTest: true,
        });
        showToast('Saved to review (no stats counted)', 'success');
      } catch (e) {
        console.error('Test review save error:', e);
        showToast('Failed to save test entry');
      }
      setIsProcessing(false);
      setShowConfirmModal(false);
      setDetectedMeters(''); setDetectedTime(''); setDetectedCalories('');
      setEditableMeters(''); setEditableTime(''); setEditableCalories('');
      setAiMachineType(''); setCustomMachineName('');
      setValidationError('');
      setShowLogModal(false);
      setLastSessionMeters(meters);
      setShowRowCelebration(true);
      setTestMode(false);
      return;
    }

    const success = await addEntry(meters, capturedImage, timeSeconds, calories, machineInfo);
    setIsProcessing(false);

    if (success) {
      setShowConfirmModal(false);
      setDetectedMeters('');
      setDetectedTime('');
      setDetectedCalories('');
      setEditableMeters('');
      setEditableTime('');
      setEditableCalories('');
      setAiMachineType('');
      setCustomMachineName('');
      setSessionType('free_row');
      setValidationError('');
      setVerificationStatus(null);
      // Close log modal and show celebration
      setShowLogModal(false);
      setShareImageUrl(capturedImage?.data || capturedImage);
      setLastSessionMeters(parseInt(editableMeters, 10) || 0);
      setShowRowCelebration(true);
      setLinkCopied(false);
    }
  };

  // Admin delete any activity from feed (via cloud function to bypass rules)
  const deleteActivity = async (itemId, itemType) => {
    if (!isAdmin) return;
    try {
      const adminDeleteFn = httpsCallable(functions, 'adminDeleteFeedItem');
      const result = await adminDeleteFn({ itemId, itemType });
      if (result.data.success) {
        showToast(result.data.message, 'success');
      } else {
        showToast(result.data.message || 'Item not found.', 'info');
      }
    } catch (error) {
      console.error('Error deleting activity:', error);
      showToast('Failed to delete. Try again.');
    }
  };

  // Delete own entry
  const [deletingEntryId, setDeletingEntryId] = useState(null);

  const handleDeleteEntry = async (entryId, meters) => {
    if (!window.confirm(`Delete this ${meters.toLocaleString()}m entry? This cannot be undone.`)) return;

    setDeletingEntryId(entryId);
    try {
      const deleteEntryFn = httpsCallable(functions, 'deleteEntry');
      await deleteEntryFn({ entryId });

      // Re-check achievements — remove any the user no longer qualifies for
      if (currentUser) {
        const user = users[currentUser.uid];
        if (user?.unlockedAchievements) {
          const remainingEntries = entries.filter(e => e.id !== entryId && e.userId === currentUser.uid);
          const updatedUser = {
            ...user,
            totalMeters: (user.totalMeters || 0) - meters,
            uploadCount: (user.uploadCount || 0) - 1,
          };
          const streak = calculateStreak(currentUser.uid);
          const toRemove = [];
          for (const achievement of ACHIEVEMENTS) {
            if (user.unlockedAchievements[achievement.id] && !achievement.check(updatedUser, remainingEntries, streak)) {
              toRemove.push(achievement.id);
            }
          }
          if (toRemove.length > 0) {
            const cleaned = { ...user.unlockedAchievements };
            toRemove.forEach(id => delete cleaned[id]);
            const userRef = doc(db, 'users', currentUser.uid);
            await setDoc(userRef, { unlockedAchievements: cleaned }, { merge: true });
          }
        }
      }
    } catch (error) {
      console.error('Delete entry error:', error);
      showToast('Failed to delete entry. Try again.');
    }
    setDeletingEntryId(null);
  };

  // Save AI feedback for training
  // Save custom avatar to user profile
  const saveAvatar = async (avatarConfig) => {
    if (!currentUser) return;
    try {
      const userRef = doc(db, 'users', currentUser.uid);
      await setDoc(userRef, { avatar: avatarConfig }, { merge: true });
      showToast('Avatar saved!', 'success');
    } catch (error) {
      console.error('Error saving avatar:', error);
      showToast('Failed to save avatar');
    }
  };

  const saveAiFeedback = async (feedback) => {
    if (!currentUser) return;

    const feedbackId = `feedback_${Date.now()}_${currentUser.uid}`;

    // Upload the image to Storage for visual reference
    let feedbackImageUrl = null;
    if (capturedImage?.data) {
      try {
        const fbRef = ref(storage, `row-images/${currentUser.uid}/feedback_${feedbackId}.jpg`);
        await uploadBytes(fbRef, dataUrlToBlob(capturedImage.data), { contentType: 'image/jpeg' });
        feedbackImageUrl = await getDownloadURL(fbRef);
      } catch (e) {
        console.error('Feedback image upload error:', e);
      }
    }

    await setDoc(doc(db, 'ai_feedback', feedbackId), {
      ...feedback,
      imageUrl: feedbackImageUrl,
      userId: currentUser.uid,
      createdAt: serverTimestamp(),
    });
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
      showToast('Failed to process review.');
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

  // Memoized streak cache - computes all user streaks in one pass
  const streakCache = useMemo(() => {
    const toKey = (d) => `${d.getFullYear()}-${d.getMonth()}-${d.getDate()}`;
    const cache = {};
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const todayStr = toKey(today);
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);
    const yesterdayStr = toKey(yesterday);

    Object.keys(users).forEach(userId => {
      const dates = new Set(
        entries.filter(e => e.userId === userId).map(e => toKey(new Date(e.date)))
      );
      if (dates.size === 0 || (!dates.has(todayStr) && !dates.has(yesterdayStr))) {
        cache[userId] = 0;
        return;
      }
      let streak = 0;
      let checkDate = new Date(dates.has(todayStr) ? today : yesterday);
      while (dates.has(toKey(checkDate))) {
        streak++;
        checkDate.setDate(checkDate.getDate() - 1);
      }
      cache[userId] = streak;
    });
    return cache;
  }, [entries, users]);

  const calculateStreak = useCallback((userId) => streakCache[userId] || 0, [streakCache]);

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

  // Memoized achievement counts
  const achievementCountCache = useMemo(() => {
    const cache = {};
    Object.keys(users).forEach(userId => {
      const user = users[userId];
      if (!user) { cache[userId] = 0; return; }
      const userEntries = entries.filter(e => e.userId === userId);
      const streak = streakCache[userId] || 0;
      cache[userId] = ACHIEVEMENTS.filter(a => a.check(user, userEntries, streak)).length;
    });
    return cache;
  }, [users, entries, streakCache]);

  // Memoized group-filtered data
  // eslint-disable-next-line react-hooks/exhaustive-deps
  const filteredUsers = useMemo(() => getGroupFilteredUsers(), [users, selectedGroupId, groups]);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  const filteredEntries = useMemo(() => getGroupFilteredEntries(), [entries, selectedGroupId, groups]);

  // Memoized longest streak cache
  const longestStreakCache = useMemo(() => {
    const toKey = (d) => `${d.getFullYear()}-${d.getMonth()}-${d.getDate()}`;
    const cache = {};
    Object.keys(users).forEach(userId => {
      const userEntries = entries
        .filter(e => e.userId === userId)
        .sort((a, b) => new Date(a.date) - new Date(b.date));
      if (userEntries.length === 0) { cache[userId] = 0; return; }

      const uniqueDays = [];
      const seen = new Set();
      for (const entry of userEntries) {
        const d = new Date(entry.date);
        const key = toKey(d);
        if (!seen.has(key)) { seen.add(key); uniqueDays.push(d); }
      }
      if (uniqueDays.length === 0) { cache[userId] = 0; return; }

      let longest = 1, current = 1;
      for (let i = 1; i < uniqueDays.length; i++) {
        const prev = new Date(uniqueDays[i - 1]);
        prev.setHours(0, 0, 0, 0);
        const nextDay = new Date(prev);
        nextDay.setDate(nextDay.getDate() + 1);
        const curr = new Date(uniqueDays[i]);
        curr.setHours(0, 0, 0, 0);
        if (curr.getTime() === nextDay.getTime()) {
          current++;
          longest = Math.max(longest, current);
        } else if (curr.getTime() > nextDay.getTime()) {
          current = 1;
        }
      }
      cache[userId] = longest;
    });
    return cache;
  }, [entries, users]);

  const calculateLongestStreak = useCallback((userId) => longestStreakCache[userId] || 0, [longestStreakCache]);

  // eslint-disable-next-line react-hooks/exhaustive-deps
  const getLeaderboard = useMemo(() => {
    return Object.values(filteredUsers)
      .map((user) => ({
        ...user,
        streak: streakCache[user.id] || 0,
        weeklyAvg: calculateWeeklyAverage(user.id),
        avgPerUpload: user.uploadCount > 0 ? Math.round(user.totalMeters / user.uploadCount) : 0,
        rank: getUserRank(user.totalMeters),
        achievementCount: achievementCountCache[user.id] || 0,
      }))
      .sort((a, b) => {
        if (b.totalMeters !== a.totalMeters) return b.totalMeters - a.totalMeters;
        // Tiebreaker: whoever reached this total first (earlier last entry date)
        const aLatest = entries.filter(e => e.userId === a.id).reduce((max, e) => { const d = new Date(e.date); return d > max ? d : max; }, new Date(0));
        const bLatest = entries.filter(e => e.userId === b.id).reduce((max, e) => { const d = new Date(e.date); return d > max ? d : max; }, new Date(0));
        return aLatest - bLatest;
      });
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filteredUsers, streakCache, achievementCountCache, entries]);

  const getWeeklyLeaderboard = useMemo(() => {
    const now = new Date();
    const startOfWeek = new Date(now);
    startOfWeek.setDate(now.getDate() - now.getDay());
    startOfWeek.setHours(0, 0, 0, 0);

    const weeklyTotals = {};
    filteredEntries.forEach(entry => {
      if (new Date(entry.date) >= startOfWeek) {
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
      .sort((a, b) => {
        if (b.weeklyMeters !== a.weeklyMeters) return b.weeklyMeters - a.weeklyMeters;
        const aLatest = filteredEntries.filter(e => e.userId === a.id).reduce((max, e) => { const d = new Date(e.date); return d > max ? d : max; }, new Date(0));
        const bLatest = filteredEntries.filter(e => e.userId === b.id).reduce((max, e) => { const d = new Date(e.date); return d > max ? d : max; }, new Date(0));
        return aLatest - bLatest;
      });
  }, [filteredUsers, filteredEntries]);


  const getStreakLeaderboard = useMemo(() => {
    return Object.values(filteredUsers)
      .map((user) => ({
        ...user,
        streak: streakCache[user.id] || 0,
        longestStreak: longestStreakCache[user.id] || 0,
        rank: getUserRank(user.totalMeters),
      }))
      .filter(u => u.streak > 0 || u.longestStreak > 0)
      .sort((a, b) => {
        if (b.streak !== a.streak) return b.streak - a.streak;
        if (b.longestStreak !== a.longestStreak) return b.longestStreak - a.longestStreak;
        // Tiebreaker: earlier account
        const aCreated = a.createdAt?.toDate ? a.createdAt.toDate() : new Date(a.createdAt || 0);
        const bCreated = b.createdAt?.toDate ? b.createdAt.toDate() : new Date(b.createdAt || 0);
        return aCreated - bCreated;
      });
  }, [filteredUsers, streakCache, longestStreakCache]);

  const getAchievementsLeaderboard = useMemo(() => {
    return Object.values(filteredUsers)
      .map((user) => ({
        ...user,
        achievementCount: achievementCountCache[user.id] || 0,
        rank: getUserRank(user.totalMeters),
      }))
      .filter(u => u.achievementCount > 0)
      .sort((a, b) => b.achievementCount - a.achievementCount);
  }, [filteredUsers, achievementCountCache]);

  const getDistanceRecords = useMemo(() => {
    const records = {};
    STANDARD_DISTANCES.forEach(dist => { records[dist.meters] = []; });

    const qualifyingEntries = filteredEntries.filter(entry =>
      entry.time && entry.time > 0 &&
      ['verified', 'pending_review'].includes(entry.verificationStatus) &&
      getDistanceCategory(entry.meters)
    );

    qualifyingEntries.forEach(entry => {
      const category = getDistanceCategory(entry.meters);
      if (category) {
        records[category.meters].push({
          ...entry,
          user: filteredUsers[entry.userId],
          pace: entry.time && entry.meters ? (entry.time / entry.meters) * 500 : null,
        });
      }
    });

    // Keep only best time per user per distance, sort fastest first
    Object.keys(records).forEach(dist => {
      const bestByUser = {};
      records[dist].forEach(entry => {
        if (!bestByUser[entry.userId] || entry.time < bestByUser[entry.userId].time) {
          bestByUser[entry.userId] = entry;
        }
      });
      records[dist] = Object.values(bestByUser)
        .filter(e => e.user)
        .sort((a, b) => a.time - b.time || new Date(a.date) - new Date(b.date));
    });

    return records;
  }, [filteredEntries, filteredUsers]);

  // Get user's session history
  const getUserSessionHistory = (userId) => {
    return entries
      .filter(e => e.userId === userId)
      .sort((a, b) => new Date(b.date) - new Date(a.date));
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
          tier: newRank.tier || 'bronze',
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

  // Memoized feed base - builds and sorts all feed items once
  const activityFeedBase = useMemo(() => {
    let feedItems = filteredEntries.map(entry => ({
      ...entry,
      type: 'row',
      user: filteredUsers[entry.userId],
      sortDate: new Date(entry.date),
    })).filter(entry => entry.user && !entry.isTest);

    Object.values(filteredUsers).forEach(user => {
      if (user.unlockedAchievements) {
        // Group achievements by day for each user
        // Only show achievements unlocked in the last 30 days to avoid bulk retroactive dumps
        const cutoff = new Date();
        cutoff.setDate(cutoff.getDate() - 30);
        const byDay = {};
        Object.entries(user.unlockedAchievements).forEach(([achievementId, dateStr]) => {
          const achievement = ACHIEVEMENTS.find(a => a.id === achievementId);
          if (achievement) {
            const d = new Date(dateStr);
            if (d < cutoff) return; // Skip old retroactive unlocks
            const dayKey = `${d.getFullYear()}-${d.getMonth()}-${d.getDate()}`;
            if (!byDay[dayKey]) byDay[dayKey] = { achievements: [], date: dateStr, sortDate: d };
            byDay[dayKey].achievements.push(achievement);
            if (d > byDay[dayKey].sortDate) {
              byDay[dayKey].date = dateStr;
              byDay[dayKey].sortDate = d;
            }
          }
        });
        Object.entries(byDay).forEach(([dayKey, group]) => {
          // Skip if too many unlocked on same day (likely bulk retroactive)
          if (group.achievements.length > 5) return;
          feedItems.push({
            id: `achievement-${user.id}-${dayKey}`,
            type: 'achievement',
            userId: user.id,
            user,
            achievements: group.achievements,
            achievement: group.achievements[0],
            date: group.date,
            sortDate: group.sortDate,
          });
        });
      }
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

    activities.forEach(activity => {
      // Skip row_completed — already shown from entries collection as 'row' type
      if (activity.type === 'row_completed') return;
      const activityUser = users[activity.userId];
      if (!activityUser) return;
      if (selectedGroupId && activity.groupId && activity.groupId !== selectedGroupId) return;
      const activityDate = activity.createdAt?.toDate ? activity.createdAt.toDate() : new Date(activity.createdAt);
      feedItems.push({
        id: activity.id,
        type: activity.type,
        userId: activity.userId,
        user: activityUser,
        groupId: activity.groupId,
        groupName: activity.groupName,
        challengeId: activity.challengeId,
        challengeName: activity.challengeName,
        challengeType: activity.challengeType,
        date: activityDate.toISOString(),
        sortDate: activityDate,
      });
    });

    // Detect monthly throwdown completions
    const now = new Date();
    const throwdowns = [
      { target: 50000, label: 'Row 50K', field: 'meters' },
      { target: 14, label: '14-Day Streak', field: 'streak' },
      { target: 20, label: '20 Sessions', field: 'sessions' },
      { target: 75000, label: 'Row 75K', field: 'meters' },
      { target: 10000, label: 'Burn 10K Cal', field: 'calories' },
      { target: 100000, label: 'Row 100K', field: 'meters' },
      { target: 25, label: '25 Sessions', field: 'sessions' },
      { target: 21, label: '21-Day Streak', field: 'streak' },
      { target: 60000, label: 'Row 60K', field: 'meters' },
      { target: 15000, label: 'Burn 15K Cal', field: 'calories' },
      { target: 22, label: '22 Sessions', field: 'sessions' },
      { target: 80000, label: 'Row 80K', field: 'meters' },
    ];
    const currentMonth = now.getMonth();
    const throwdown = throwdowns[currentMonth];
    const monthStart = new Date(now.getFullYear(), currentMonth, 1);
    const monthName = now.toLocaleDateString('en-US', { month: 'long' });

    Object.values(filteredUsers).forEach(user => {
      const userMonthEntries = filteredEntries.filter(e => e.userId === user.id && new Date(e.date) >= monthStart);
      if (userMonthEntries.length === 0) return;
      let current = 0;
      if (throwdown.field === 'meters') current = userMonthEntries.reduce((s, e) => s + e.meters, 0);
      else if (throwdown.field === 'sessions') current = userMonthEntries.length;
      else if (throwdown.field === 'calories') current = userMonthEntries.reduce((s, e) => s + (e.calories || 0), 0);
      else if (throwdown.field === 'streak') current = calculateStreak(user.id);
      if (current >= throwdown.target) {
        // Find the entry that pushed them over
        let runningTotal = 0;
        let completionDate = null;
        if (throwdown.field === 'meters' || throwdown.field === 'calories') {
          const sorted = [...userMonthEntries].sort((a, b) => new Date(a.date) - new Date(b.date));
          for (const e of sorted) {
            runningTotal += throwdown.field === 'meters' ? e.meters : (e.calories || 0);
            if (runningTotal >= throwdown.target) { completionDate = new Date(e.date); break; }
          }
        } else if (throwdown.field === 'sessions') {
          const sorted = [...userMonthEntries].sort((a, b) => new Date(a.date) - new Date(b.date));
          if (sorted.length >= throwdown.target) completionDate = new Date(sorted[throwdown.target - 1].date);
        }
        if (!completionDate) completionDate = new Date(userMonthEntries[userMonthEntries.length - 1].date);
        feedItems.push({
          id: `throwdown-${user.id}-${currentMonth}`,
          type: 'throwdown_completed',
          userId: user.id,
          user,
          throwdownLabel: throwdown.label,
          monthName,
          date: completionDate.toISOString(),
          sortDate: completionDate,
        });
      }
    });

    feedItems.sort((a, b) => b.sortDate - a.sortDate);
    return feedItems;
  }, [filteredEntries, filteredUsers, activities, users, selectedGroupId, calculateStreak]);

  // Lightweight filter/paginate on the memoized base
  const getActivityFeed = useCallback((filterQuery = '', page = 1, typeFilter = 'all') => {
    let feedItems = activityFeedBase;

    if (filterQuery.trim()) {
      const q = filterQuery.toLowerCase();
      feedItems = feedItems.filter(item =>
        item.user?.name?.toLowerCase().includes(q) ||
        item.groupName?.toLowerCase().includes(q) ||
        item.challengeName?.toLowerCase().includes(q)
      );
    }

    if (typeFilter && typeFilter !== 'all') {
      if (typeFilter === 'milestone') {
        feedItems = feedItems.filter(item => ['achievement', 'rank', 'distance_record', 'join', 'group_created', 'group_joined', 'challenge_created', 'throwdown_completed'].includes(item.type));
      } else {
        feedItems = feedItems.filter(item => item.type === typeFilter);
      }
    }

    const endIndex = page * FEED_PAGE_SIZE;
    return {
      items: feedItems.slice(0, endIndex),
      hasMore: feedItems.length > endIndex,
      total: feedItems.length,
    };
  }, [activityFeedBase]);

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
      prev.setHours(0, 0, 0, 0);
      const nextDay = new Date(prev);
      nextDay.setDate(nextDay.getDate() + 1);
      const curr = new Date(uniqueDays[i]);
      curr.setHours(0, 0, 0, 0);
      if (curr.getTime() === nextDay.getTime()) {
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

  const milestoneSegmentData = useMemo(() => {
    if (!showMilestoneCelebration) return null;
    const milestone = showMilestoneCelebration;
    const milestoneIdx = MILESTONES.indexOf(milestone);
    const prevMilestone = milestoneIdx > 0 ? MILESTONES[milestoneIdx - 1] : { meters: 0 };
    const segmentMeters = milestone.meters - prevMilestone.meters;

    // Find entries that contributed to this segment
    // Sort oldest first, track cumulative total to find date range
    const allSorted = [...entries].sort((a, b) => new Date(a.date) - new Date(b.date));
    let cumulative = 0;
    let segmentStartDate = null;
    let segmentEndDate = null;
    const segmentEntries = [];

    for (const entry of allSorted) {
      const prevCum = cumulative;
      cumulative += entry.meters;

      // This entry is in the segment if cumulative was between prev and current milestone
      if (prevCum < milestone.meters && cumulative >= prevMilestone.meters) {
        if (!segmentStartDate && prevCum >= prevMilestone.meters) {
          segmentStartDate = new Date(entry.date);
        }
        if (prevCum >= prevMilestone.meters) {
          segmentEntries.push(entry);
        }
        if (cumulative >= milestone.meters && !segmentEndDate) {
          segmentEndDate = new Date(entry.date);
        }
      } else if (prevCum >= prevMilestone.meters && prevCum < milestone.meters) {
        if (!segmentStartDate) segmentStartDate = new Date(entry.date);
        segmentEntries.push(entry);
        if (cumulative >= milestone.meters && !segmentEndDate) {
          segmentEndDate = new Date(entry.date);
        }
      }
    }

    // Top rowers in segment
    const rowerMap = {};
    segmentEntries.forEach(e => {
      if (!rowerMap[e.userId]) rowerMap[e.userId] = { meters: 0, sessions: 0 };
      rowerMap[e.userId].meters += e.meters;
      rowerMap[e.userId].sessions += 1;
    });

    const topRowers = Object.entries(rowerMap)
      .map(([userId, data]) => ({
        userId,
        name: users[userId]?.name || 'Unknown',
        meters: data.meters,
        sessions: data.sessions,
      }))
      .sort((a, b) => b.meters - a.meters)
      .slice(0, 3);

    // Duration
    let duration = null;
    if (segmentStartDate && segmentEndDate) {
      const days = Math.round((segmentEndDate - segmentStartDate) / 86400000);
      if (days < 1) duration = 'less than a day';
      else if (days === 1) duration = '1 day';
      else if (days < 7) duration = `${days} days`;
      else if (days < 30) duration = `${Math.round(days / 7)} weeks`;
      else duration = `${Math.round(days / 30)} months`;
    }

    return { topRowers, duration, segmentMeters };
  }, [showMilestoneCelebration, entries, users]);

  // Build context value with all state and handlers
  const contextValue = {
    // Auth
    currentUser, userProfile, authLoading, isAdmin,
    handleSignIn, handleSignOut, handleCreateProfile,
    displayName, setDisplayName,
    generateUsernameFromName,

    // Core data
    users, entries, isLoading,

    // Processing
    isProcessing, setIsProcessing, processingStatus, setProcessingStatus,
    capturedImage, setCapturedImage,
    detectedMeters, setDetectedMeters, detectedTime, setDetectedTime, detectedCalories, setDetectedCalories,
    editableMeters, setEditableMeters, editableTime, setEditableTime, editableCalories, setEditableCalories,
    manualMeters, setManualMeters, manualTime, setManualTime, manualCalories, setManualCalories,
    isSubmittingManual,
    validationError, setValidationError,
    setVerificationStatus,

    // Image upload
    handleImageUpload, handleManualSubmit, handleConfirmEntry,
    fileInputRef, galleryInputRef, canvasRef,

    // Entry management
    handleDeleteEntry, deletingEntryId,

    // Tabs & Navigation
    activeTab, setActiveTab,
    feedPage, setFeedPage, FEED_PAGE_SIZE,
    feedSearchQuery, setFeedSearchQuery,
    feedTypeFilter, setFeedTypeFilter,
    achievementsPage, setAchievementsPage, ACHIEVEMENTS_PAGE_SIZE,

    // Modals
    showLogModal, setShowLogModal,
    showConfirmModal, setShowConfirmModal,
    showSetupModal, setShowSetupModal,
    showShareModal, setShowShareModal,
    showBustedModal, setShowBustedModal,
    showPRModal, setShowPRModal,
    showAchievementModal, setShowAchievementModal,
    showJourneyModal, setShowJourneyModal,
    showSettingsModal, setShowSettingsModal,
    showAvatarBuilder, setShowAvatarBuilder, saveAvatar,
    showCrewMap, setShowCrewMap,
    showInstallPrompt, setShowInstallPrompt,
    showPhotoModal, setShowPhotoModal,
    showAdminPanel, setShowAdminPanel,
    showUserProfileModal, setShowUserProfileModal,
    showRankProgressModal, setShowRankProgressModal,
    showSessionHistory, setShowSessionHistory,
    showWrapped, setShowWrapped,
    wrappedSlide, setWrappedSlide,
    showWelcomeModal, setShowWelcomeModal,
    showChangelogModal, setShowChangelogModal,
    showNotifications, setShowNotifications,
    showGroupSelector, setShowGroupSelector,
    showCreateGroupModal, setShowCreateGroupModal,
    showJoinGroupModal, setShowJoinGroupModal,
    showCreateChallengeModal, setShowCreateChallengeModal,
    showChallengeDetail, setShowChallengeDetail,
    showTimeTrialModal, setShowTimeTrialModal,
    showInviteUserModal, setShowInviteUserModal,
    showManageMembersModal, setShowManageMembersModal,

    // Share
    shareCardRef, shareImageUrl, lastSessionMeters,
    linkCopied, isCopying, handleCopyLink, handleCloseShare,

    // Notifications
    notifications, unreadNotificationCount,
    markNotificationRead, markAllNotificationsRead,

    // Feed interactions
    REACTION_EMOJIS,
    getReactionCounts, hasUserReacted, toggleReaction,
    getItemComments, commentsByItem,
    expandedComments, setExpandedComments,
    showReactionPicker, setShowReactionPicker,
    newComment, setNewComment,
    replyingTo, setReplyingTo,
    addComment, deleteComment,

    // Groups & Challenges
    groups, selectedGroupId, setSelectedGroupId,
    challenges,
    getSelectedGroup, isGroupAdmin,
    handleCreateGroup, handleJoinGroup, handleLeaveGroup,
    handleRemoveMember, handleTransferAdmin, handleRemoveAdmin,
    handleCreateChallenge, handleSubmitTimeTrial,
    newGroupName, setNewGroupName,
    newGroupDescription, setNewGroupDescription,
    joinGroupCode, setJoinGroupCode,
    groupError, setGroupError,
    isCreatingGroup, isJoiningGroup,
    newChallengeName, setNewChallengeName,
    newChallengeType, setNewChallengeType,
    newChallengeTarget, setNewChallengeTarget,
    newChallengeStartDate, setNewChallengeStartDate,
    newChallengeEndDate, setNewChallengeEndDate,
    isCreatingChallenge,
    timeTrialTime, setTimeTrialTime,
    timeTrialImage, setTimeTrialImage,
    isSubmittingTimeTrial,
    inviteUsername, setInviteUsername,
    searchUsers,
    getChallengeStatus, getChallengeProgress, getChallengeLeaderboard,

    // Leaderboards & Stats
    leaderboardTab, setLeaderboardTab,
    getLeaderboard, getWeeklyLeaderboard, getStreakLeaderboard, getAchievementsLeaderboard, getDistanceRecords,
    calculateStreak, calculateLongestStreak, calculateWeeklyAverage,
    getPersonalRecord, getTotalDaysRowed, getFirstRowDate,
    getUserAchievements, getAchievementProgress,
    getUserSessionHistory, getActivityFeed, getWeeklyStats, getWrappedStats,

    // Machine
    aiMachineType, setAiMachineType,
    sessionType, setSessionType,
    testMode, setTestMode,
    customMachineName, setCustomMachineName,

    // Theme
    currentTheme, setCurrentTheme,

    // Profile
    profilePicInputRef, handleProfilePicUpload, isUploadingPhoto,
    newUsername, handleUsernameChange, usernameStatus,

    // Admin
    deleteActivity,
    pendingReviews, adminStats, loadPendingReviews,
    reviewingEntry, setReviewingEntry,
    adjustedMeters, setAdjustedMeters,
    reviewNote, setReviewNote,
    handleReviewEntry,

    // PWA
    deferredPrompt, isIOS, isStandalone,
    handleInstallClick, dismissInstallPrompt,

    // Misc
    dailyQuote, showToast,
    wrappedDismissed, setWrappedDismissed,
    wrappedCardRef,
    totalMeters, milestoneProgress, worldProgress,
    showAiFeedbackToast, toasts, setToasts,
    recentMilestone, setRecentMilestone,
    showMilestoneCelebration, setShowMilestoneCelebration,
    milestoneSegmentData,
    handleFooterTap,
  };

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
          <p className="loading-subtitle">Connecting to the crew...</p>
        </div>
      </div>
    );
  }

  return (
    <AppContext.Provider value={contextValue}>
    <div className="app">
      <canvas ref={canvasRef} style={{ display: 'none' }} />

      {/* Milestone Celebration */}
      {recentMilestone && (
        <div className="milestone-celebration" onClick={() => setRecentMilestone(null)}>
          <div className="milestone-content">
            <span className="milestone-icon"><Icon name="ui_trophy" size={32} /></span>
            <h2>MILESTONE ACHIEVED!</h2>
            <p className="milestone-label">{recentMilestone.label}</p>
            <p className="milestone-comparison">{recentMilestone.comparison}</p>
          </div>
        </div>
      )}

      <MilestoneCelebration />

      <Header />

      {/* Tabs */}
      <nav className="tabs">
        {currentUser && userProfile && (
          <button className={`tab ${activeTab === 'home' ? 'active' : ''}`} onClick={() => setActiveTab('home')}>
            <Icon name="ui_rowing" size={14} /> Home
          </button>
        )}
        <button className={`tab ${activeTab === 'feed' ? 'active' : ''}`} onClick={() => setActiveTab('feed')}>
          <Icon name="ui_feed" size={14} /> Feed
        </button>
        <button className={`tab ${activeTab === 'leaderboard' ? 'active' : ''}`} onClick={() => setActiveTab('leaderboard')}>
          <Icon name="ui_trophy" size={14} /> Board
        </button>
        <button className={`tab ${activeTab === 'more' ? 'active' : ''}`} onClick={() => setActiveTab('more')}>
          <Icon name="ui_chart" size={14} /> Stats
        </button>
      </nav>

      {/* Group Selector — hidden for now */}
      {false && currentUser && userProfile && (
        <div className="group-selector-container">
          <button
            className="group-selector-btn"
            onClick={() => setShowGroupSelector(!showGroupSelector)}
          >
            <span className="group-selector-icon">
              {selectedGroupId ? <Icon name="ui_users" size={14} /> : <Icon name="ui_globe" size={14} />}
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
                <span><Icon name="ui_globe" size={14} /></span>
                <span>Everyone</span>
                {!selectedGroupId && <span className="check">✓</span>}
              </button>

              {groups.map(group => (
                <button
                  key={group.id}
                  className={`group-option ${selectedGroupId === group.id ? 'active' : ''}`}
                  onClick={() => { setSelectedGroupId(group.id); setShowGroupSelector(false); }}
                >
                  <span><Icon name="ui_users" size={14} /></span>
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
                  <Icon name="ui_plus" size={14} /> Create Group
                </button>
                <button
                  className="group-action-btn"
                  onClick={() => { setShowJoinGroupModal(true); setShowGroupSelector(false); }}
                >
                  <Icon name="ui_link" size={14} /> Join Group
                </button>
              </div>
            </div>
            </>
          )}
        </div>
      )}

      {/* Main Content */}
      <main className="main-content">
        {activeTab === 'home' && <HomeTab />}
        {activeTab === 'feed' && <ActivityFeed />}
        {activeTab === 'leaderboard' && <Leaderboard />}
        {activeTab === 'more' && <StatsTab />}
      </main>

      {/* Modals */}
      <ConfirmEntryModal />

      {/* AI Feedback Toast */}
      {showAiFeedbackToast && (
        <div className="ai-feedback-toast">
          <span><Icon name="ui_robot" size={16} /></span>
          <span>Thanks! Your correction helps our AI improve</span>
        </div>
      )}

      {/* Toast notifications */}
      {toasts.map((toast, i) => (
        <div
          key={toast.id}
          className={`app-toast app-toast-${toast.type}`}
          style={{ bottom: `${80 + i * 56}px` }}
          onClick={() => setToasts(prev => prev.filter(t => t.id !== toast.id))}
        >
          <span className="toast-icon">
            {toast.type === 'error' ? <Icon name="ui_warning" size={16} /> : toast.type === 'success' ? <Icon name="ui_success" size={16} /> : <Icon name="ui_info" size={16} />}
          </span>
          <span>{toast.message}</span>
        </div>
      ))}

      {/* Setup Profile Modal */}
      {showSetupModal && (
        <div className="modal-overlay">
          <div className="modal setup-modal" onClick={(e) => e.stopPropagation()}>
            <h2>Welcome to Row Crew!</h2>
            <p>Set up your profile to start tracking</p>
            {currentUser?.photoURL && (
              <img src={currentUser.photoURL} alt="" className="setup-avatar" />
            )}
            <div className="setup-form">
              <div className="form-group">
                <label>Display Name</label>
                <input type="text" placeholder="How should we call you?" value={displayName} onChange={(e) => setDisplayName(e.target.value)} className="name-input" autoFocus />
                {displayName.trim() && (
                  <small className="username-preview">Your username will be: @{generateUsernameFromName(displayName.trim()) || 'your_name'}</small>
                )}
              </div>
            </div>
            <div className="modal-actions">
              <button className="cancel-button" onClick={handleSignOut}>Cancel</button>
              <button className="confirm-button" onClick={handleCreateProfile} disabled={!displayName.trim()}>Join Crew</button>
            </div>
          </div>
        </div>
      )}

      {showRowCelebration && (
        <RowCelebration
          meters={lastSessionMeters}
          onComplete={() => {
            setShowRowCelebration(false);
            setShowShareModal(true);
          }}
        />
      )}
      <AvatarBuilder />
      <CrewMap />
      <ShareCardModal />
      <PRModal />
      <BustedModal />
      <SettingsModal />
      <JourneyModal />
      <AchievementModal />
      <PhotoModal />
      <AdminPanel />
      <UserProfileModal />

      {/* Rank Progress Modal */}
      {showRankProgressModal && currentUser && userProfile && (() => {
        const currentRank = getUserRank(userProfile.totalMeters);
        const nextRank = getNextRank(userProfile.totalMeters);
        const metersToNext = nextRank ? nextRank.minMeters - userProfile.totalMeters : 0;
        const progressPercent = nextRank
          ? ((userProfile.totalMeters - currentRank.minMeters) / (nextRank.minMeters - currentRank.minMeters)) * 100
          : 100;
        return (
          <div className="modal-overlay" onClick={() => setShowRankProgressModal(false)}>
            <div className="modal rank-progress-modal" onClick={(e) => e.stopPropagation()}>
              <button className="modal-close" onClick={() => setShowRankProgressModal(false)}>✕</button>
              <h2><Icon name="ui_medal" size={20} /> Rank Progress</h2>
              <div className="current-rank-display">
                <span className="current-rank-emoji"><Icon name={currentRank.emoji} /></span>
                <div className="current-rank-info">
                  <span className="current-rank-title">{currentRank.title}</span>
                  <span className="current-rank-meters">{formatMeters(userProfile.totalMeters)}m total</span>
                </div>
              </div>
              {nextRank && (
                <div className="next-rank-progress">
                  <div className="progress-header">
                    <span>Next: <Icon name={nextRank.emoji} /> {nextRank.title}</span>
                    <span>{formatMeters(metersToNext)}m to go</span>
                  </div>
                  <div className="rank-progress-bar">
                    <div className="rank-progress-fill" style={{ width: `${progressPercent}%` }} />
                  </div>
                </div>
              )}
              <div className="all-ranks">
                <h3>All Ranks</h3>
                <div className="ranks-list">
                  {RANKS.map((rank) => {
                    const isCurrentRank = currentRank.title === rank.title;
                    const isUnlocked = userProfile.totalMeters >= rank.minMeters;
                    return (
                      <div key={rank.title} className={`rank-item ${isCurrentRank ? 'current' : ''} ${isUnlocked ? 'unlocked' : 'locked'}`}>
                        <span className="rank-item-emoji"><Icon name={rank.emoji} /></span>
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
            </div>
          </div>
        );
      })()}

      <CreateGroupModal />
      <JoinGroupModal />
      <InviteUserModal />
      <ManageMembersModal />
      <CreateChallengeModal />
      <ChallengeDetailModal />
      <WrappedModal />
      <InstallPrompt />
      <WelcomeModal />
      <ChangelogModal />

      {/* Floating Action Button — Log a Row */}
      {currentUser && userProfile && !showLogModal && !showConfirmModal && (
        <button className="fab" onClick={() => setShowLogModal(true)} title="Log a Row">
          <Icon name="ui_plus" size={24} color="#fff" />
        </button>
      )}

      {/* Log Modal (replaces old Log tab) */}
      <EntryForm />

      <footer className="footer" onClick={handleFooterTap}>
        <p><Icon name="ui_globe" size={14} /> Goal: Row {formatMeters(WORLD_CIRCUMFERENCE)}m around the world!</p>
      </footer>
    </div>
    </AppContext.Provider>
  );
}

export default App;
/* END OF FILE - old JSX removed, components used instead */
