import React, { useState, useEffect, useCallback, useRef } from 'react';
import Tesseract from 'tesseract.js';
import html2canvas from 'html2canvas';
import confetti from 'canvas-confetti';
import { db, auth, googleProvider } from './firebase';
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
  limit
} from 'firebase/firestore';
import { signInWithPopup, signOut, onAuthStateChanged } from 'firebase/auth';
import './App.css';

// Constants
const WORLD_CIRCUMFERENCE = 40075000;
const MIN_METERS = 100;
const MAX_METERS = 30000;
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
  { id: 'first_row', name: 'First Strokes', desc: 'Log your first row', emoji: '🎉', check: (u, e) => e.length >= 1 },
  { id: 'ten_sessions', name: 'Getting Serious', desc: 'Complete 10 sessions', emoji: '💪', check: (u, e) => e.length >= 10 },
  { id: 'fifty_sessions', name: 'Dedicated Rower', desc: 'Complete 50 sessions', emoji: '🏅', check: (u, e) => e.length >= 50 },
  { id: 'hundred_sessions', name: 'Centurion', desc: 'Complete 100 sessions', emoji: '💯', check: (u, e) => e.length >= 100 },
  
  // Distance achievements
  { id: 'first_5k', name: '5K Club', desc: 'Row 5,000 meters total', emoji: '🎯', check: (u) => u.totalMeters >= 5000 },
  { id: 'first_10k', name: '10K Crusher', desc: 'Row 10,000 meters total', emoji: '🔥', check: (u) => u.totalMeters >= 10000 },
  { id: 'marathon', name: 'Marathon Rower', desc: 'Row a marathon (42,195m)', emoji: '🏃', check: (u) => u.totalMeters >= 42195 },
  { id: 'hundred_k', name: '100K Legend', desc: 'Row 100,000 meters total', emoji: '⭐', check: (u) => u.totalMeters >= 100000 },
  
  // Single session achievements
  { id: 'big_session', name: 'Power Hour', desc: 'Row 5,000m in one session', emoji: '⚡', check: (u, e) => e.some(x => x.meters >= 5000) },
  { id: 'huge_session', name: 'Beast Mode', desc: 'Row 10,000m in one session', emoji: '🦁', check: (u, e) => e.some(x => x.meters >= 10000) },
  
  // Streak achievements
  { id: 'streak_3', name: 'Hat Trick', desc: 'Maintain a 3-day streak', emoji: '🎩', check: (u, e, s) => s >= 3 },
  { id: 'streak_7', name: 'Week Warrior', desc: 'Maintain a 7-day streak', emoji: '📅', check: (u, e, s) => s >= 7 },
  { id: 'streak_14', name: 'Fortnight Force', desc: 'Maintain a 14-day streak', emoji: '🔥', check: (u, e, s) => s >= 14 },
  { id: 'streak_30', name: 'Monthly Master', desc: 'Maintain a 30-day streak', emoji: '🌟', check: (u, e, s) => s >= 30 },
  
  // Fun achievements
  { id: 'early_bird', name: 'Early Bird', desc: 'Log a row before 7am', emoji: '🌅', check: (u, e) => e.some(x => new Date(x.date).getHours() < 7) },
  { id: 'night_owl', name: 'Night Owl', desc: 'Log a row after 10pm', emoji: '🦉', check: (u, e) => e.some(x => new Date(x.date).getHours() >= 22) },
  { id: 'consistent', name: 'Consistency King', desc: 'Row 4+ days in a week', emoji: '👑', check: (u, e) => {
    const lastWeek = e.filter(x => Date.now() - new Date(x.date).getTime() < 7 * 24 * 60 * 60 * 1000);
    const uniqueDays = new Set(lastWeek.map(x => new Date(x.date).toDateString()));
    return uniqueDays.size >= 4;
  }},
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
    version: '2.0.0',
    date: '2025-11-28',
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
    date: '2025-11-28',
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
  const [displayName, setDisplayName] = useState('');
  const [recentMilestone, setRecentMilestone] = useState(null);
  const [activeTab, setActiveTab] = useState('upload');
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
  
  const fileInputRef = useRef(null);
  const previousTotalRef = useRef(0);
  const canvasRef = useRef(null);
  const shareCardRef = useRef(null);

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

  // Listen for auth state changes
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      setCurrentUser(user);
      
      if (user) {
        // Check if user has a profile
        const profileRef = doc(db, 'users', user.uid);
        const profileSnap = await getDoc(profileRef);
        
        if (profileSnap.exists()) {
          setUserProfile({ id: user.uid, ...profileSnap.data() });
        } else {
          // New user - show setup modal
          setDisplayName(user.displayName || '');
          setShowSetupModal(true);
        }
      } else {
        setUserProfile(null);
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

  // Handle image upload
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

      const meters = await extractMetersFromImage(imageData);

      setIsProcessing(false);
      
      if (meters) {
        setDetectedMeters(meters.toString());
        setEditableMeters(meters.toString());
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
  const addEntry = async (meters) => {
    if (!currentUser || !userProfile) return false;

    try {
      // Validate
      const error = await validateEntry(meters);
      if (error) {
        setValidationError(error);
        return false;
      }

      const entryId = `${Date.now()}_${currentUser.uid}`;
      const entryRef = doc(db, 'entries', entryId);

      await setDoc(entryRef, {
        userId: currentUser.uid,
        meters,
        date: new Date().toISOString(),
        createdAt: serverTimestamp(),
      });

      const userRef = doc(db, 'users', currentUser.uid);
      const newTotalMeters = (userProfile.totalMeters || 0) + meters;
      await setDoc(userRef, {
        ...userProfile,
        totalMeters: newTotalMeters,
        uploadCount: (userProfile.uploadCount || 0) + 1,
        lastRowDate: new Date().toISOString(),
      }, { merge: true });

      // Check for Personal Record before adding to entries list
      const isPR = checkForPR(currentUser.uid, meters);
      
      // Store for share card
      setLastSessionMeters(meters);
      
      // Fire confetti!
      fireConfetti();
      
      // Show PR celebration if applicable
      if (isPR) {
        setTimeout(() => {
          firePRConfetti();
          setShowPRModal(meters);
        }, 500);
      }
      
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

  // Confirm entry
  const handleConfirmEntry = async () => {
    const meters = parseInt(editableMeters, 10);
    
    if (!meters || isNaN(meters)) {
      setValidationError('Please enter a valid number');
      return;
    }

    const success = await addEntry(meters);
    
    if (success) {
      setShowConfirmModal(false);
      setDetectedMeters('');
      setEditableMeters('');
      setValidationError('');
      // Show share modal (keep capturedImage for share card)
      setShareImageUrl(capturedImage);
      setShowShareModal(true);
      setLinkCopied(false);
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
        allowTaint: true,
        logging: false,
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
    return Object.values(users)
      .map((user) => ({
        ...user,
        streak: calculateStreak(user.id),
        weeklyAvg: calculateWeeklyAverage(user.id),
        avgPerUpload: user.uploadCount > 0 ? Math.round(user.totalMeters / user.uploadCount) : 0,
        rank: getUserRank(user.totalMeters),
      }))
      .sort((a, b) => b.totalMeters - a.totalMeters);
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

  // Get user's achievements
  const getUserAchievements = (userId) => {
    const user = users[userId];
    if (!user) return [];
    
    const userEntries = entries.filter(e => e.userId === userId);
    const streak = calculateStreak(userId);
    
    return ACHIEVEMENTS.filter(a => a.check(user, userEntries, streak));
  };

  // Get user's personal record
  const getPersonalRecord = (userId) => {
    const userEntries = entries.filter(e => e.userId === userId);
    if (userEntries.length === 0) return 0;
    return Math.max(...userEntries.map(e => e.meters));
  };

  // Check if this session is a PR
  const checkForPR = (userId, newMeters) => {
    const currentPR = getPersonalRecord(userId);
    return newMeters > currentPR && currentPR > 0;
  };

  // Get activity feed (last 10 entries across all users)
  const getActivityFeed = () => {
    return entries
      .slice(0, 10)
      .map(entry => ({
        ...entry,
        user: users[entry.userId],
      }))
      .filter(entry => entry.user);
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
  const fireConfetti = () => {
    const duration = 2000;
    const end = Date.now() + duration;

    const frame = () => {
      confetti({
        particleCount: 3,
        angle: 60,
        spread: 55,
        origin: { x: 0, y: 0.7 },
        colors: ['#00d4aa', '#00ffcc', '#ffd700', '#ff6b35'],
      });
      confetti({
        particleCount: 3,
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

  // Not signed in
  if (!currentUser) {
    return (
      <div className="app">
        <div className="auth-screen">
          <div className="auth-content">
            <h1 className="auth-title">ROW CREW</h1>
            <p className="auth-subtitle">Row Around The World Together</p>
            
            <div className="auth-features">
              <div className="auth-feature">🏆 Compete with friends</div>
              <div className="auth-feature">🔥 Track your streaks</div>
              <div className="auth-feature">🌍 Row around the world</div>
            </div>

            <button className="google-signin-btn" onClick={handleSignIn}>
              <svg viewBox="0 0 24 24" width="24" height="24">
                <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
              </svg>
              Sign in with Google
            </button>

            <p className="auth-note">Only crew members can log rows</p>
          </div>
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
          {userProfile && (
            <div className="user-menu">
              {userProfile.photoURL && (
                <img src={userProfile.photoURL} alt="" className="user-avatar" />
              )}
              <button className="signout-btn" onClick={handleSignOut}>Sign Out</button>
            </div>
          )}
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
        <button className={`tab ${activeTab === 'upload' ? 'active' : ''}`} onClick={() => setActiveTab('upload')}>
          📸 Log
        </button>
        <button className={`tab ${activeTab === 'feed' ? 'active' : ''}`} onClick={() => setActiveTab('feed')}>
          📣 Feed
        </button>
        <button className={`tab ${activeTab === 'leaderboard' ? 'active' : ''}`} onClick={() => setActiveTab('leaderboard')}>
          🏆 Board
        </button>
        <button className={`tab ${activeTab === 'stats' ? 'active' : ''}`} onClick={() => setActiveTab('stats')}>
          📊 Stats
        </button>
      </nav>

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
                <div className="user-rank-display">
                  <span className="rank-emoji">{getUserRank(userProfile.totalMeters).emoji}</span>
                  <div className="rank-info">
                    <span className="rank-title">{getUserRank(userProfile.totalMeters).title}</span>
                    {getNextRank(userProfile.totalMeters) && (
                      <span className="rank-next">
                        {formatMeters(getNextRank(userProfile.totalMeters).minMeters - userProfile.totalMeters)}m to {getNextRank(userProfile.totalMeters).title}
                      </span>
                    )}
                  </div>
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
            <h2>Activity Feed</h2>
            {getActivityFeed().length === 0 ? (
              <div className="empty-state">
                <p>No activity yet!</p>
                <p>Be the first to log a row.</p>
              </div>
            ) : (
              <div className="activity-feed">
                {getActivityFeed().map((entry) => (
                  <div key={entry.id} className={`feed-item ${entry.userId === currentUser?.uid ? 'is-you' : ''}`}>
                    <div className="feed-avatar">
                      {entry.user?.photoURL ? (
                        <img src={entry.user.photoURL} alt="" />
                      ) : (
                        <div className="feed-avatar-placeholder">
                          {entry.user?.name?.charAt(0)?.toUpperCase() || '?'}
                        </div>
                      )}
                    </div>
                    <div className="feed-content">
                      <div className="feed-header">
                        <span className="feed-name">{entry.user?.name}</span>
                        <span className="feed-time">
                          {formatTimeAgo(new Date(entry.date))}
                        </span>
                      </div>
                      <div className="feed-action">
                        rowed <span className="feed-meters">{entry.meters.toLocaleString()}m</span> 🚣
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
            
            {/* Achievements Section */}
            {userProfile && (
              <div className="achievements-section">
                <h3>🏅 Your Achievements</h3>
                <div className="achievements-grid">
                  {ACHIEVEMENTS.map((achievement) => {
                    const unlocked = getUserAchievements(currentUser?.uid).some(a => a.id === achievement.id);
                    return (
                      <div 
                        key={achievement.id} 
                        className={`achievement-badge ${unlocked ? 'unlocked' : 'locked'}`}
                        title={achievement.desc}
                      >
                        <span className="achievement-emoji">{achievement.emoji}</span>
                        <span className="achievement-name">{achievement.name}</span>
                        {unlocked && <span className="achievement-check">✓</span>}
                      </div>
                    );
                  })}
                </div>
                <p className="achievements-count">
                  {getUserAchievements(currentUser?.uid).length} / {ACHIEVEMENTS.length} unlocked
                </p>
              </div>
            )}

            {/* Link to Updates */}
            <button className="updates-link-btn" onClick={() => setActiveTab('updates')}>
              🆕 View App Updates
            </button>
          </section>
        )}

        {activeTab === 'leaderboard' && (
          <section className="leaderboard-section">
            <h2>Leaderboard</h2>
            {getLeaderboard().length === 0 ? (
              <div className="empty-state">
                <p>No rowers yet!</p>
                <p>Be the first to log a row.</p>
              </div>
            ) : (
              <div className="leaderboard">
                {getLeaderboard().map((user, index) => (
                  <div key={user.id} className={`leaderboard-item rank-${index + 1} ${user.id === currentUser?.uid ? 'is-you' : ''}`}>
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
          </section>
        )}

        {activeTab === 'stats' && (
          <section className="stats-section">
            <h2>Detailed Stats</h2>
            {getLeaderboard().length === 0 ? (
              <div className="empty-state">
                <p>No stats yet!</p>
              </div>
            ) : (
              <div className="stats-grid">
                {getLeaderboard().map((user) => (
                  <div key={user.id} className={`stats-card ${user.id === currentUser?.uid ? 'is-you' : ''}`}>
                    <div className="stats-card-header">
                      {user.photoURL ? (
                        <img src={user.photoURL} alt="" className="stats-avatar" />
                      ) : (
                        <div className="stats-avatar-placeholder">
                          {user.name?.charAt(0)?.toUpperCase() || '?'}
                        </div>
                      )}
                      <h3>{user.name} {user.id === currentUser?.uid && <span className="you-badge">YOU</span>}</h3>
                    </div>
                    <div className="stat-row">
                      <span className="stat-label">Total Distance</span>
                      <span className="stat-value">{formatMeters(user.totalMeters)}m</span>
                    </div>
                    <div className="stat-row">
                      <span className="stat-label">Sessions</span>
                      <span className="stat-value">{user.uploadCount}</span>
                    </div>
                    <div className="stat-row">
                      <span className="stat-label">Avg per Session</span>
                      <span className="stat-value">{formatMeters(user.avgPerUpload)}m</span>
                    </div>
                    <div className="stat-row">
                      <span className="stat-label">Sessions/Week</span>
                      <span className="stat-value">{user.weeklyAvg}x</span>
                    </div>
                    <div className="stat-row highlight">
                      <span className="stat-label">🔥 Streak</span>
                      <span className="stat-value">{user.streak} days</span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </section>
        )}

        {activeTab === 'updates' && (
          <section className="updates-section">
            <h2>Updates & Changelog</h2>
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
                <img src={capturedImage} alt="Captured rowing screen" />
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
                  <img src={userProfile.photoURL} alt="" className="share-user-avatar" />
                ) : (
                  <div className="share-user-avatar-placeholder">
                    {userProfile?.name?.charAt(0)?.toUpperCase() || '?'}
                  </div>
                )}
                <span className="share-user-name">{userProfile?.name}</span>
              </div>

              {shareImageUrl && (
                <div className="share-card-image">
                  <img src={shareImageUrl} alt="Rowing session" />
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

      <footer className="footer" onClick={handleFooterTap}>
        <p>🌍 Goal: Row {formatMeters(WORLD_CIRCUMFERENCE)}m around the world!</p>
      </footer>
    </div>
  );
}

export default App;