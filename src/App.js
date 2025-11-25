import React, { useState, useEffect, useCallback, useRef } from 'react';
import Tesseract from 'tesseract.js';
import './App.css';

// World circumference in meters
const WORLD_CIRCUMFERENCE = 40075000;

// Milestone definitions with fun comparisons
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

function App() {
  const [users, setUsers] = useState({});
  const [entries, setEntries] = useState([]);
  const [machineSignatures, setMachineSignatures] = useState({});
  const [isProcessing, setIsProcessing] = useState(false);
  const [processingStatus, setProcessingStatus] = useState('');
  const [showNewUserModal, setShowNewUserModal] = useState(false);
  const [pendingImage, setPendingImage] = useState(null);
  const [pendingMeters, setPendingMeters] = useState(null);
  const [newUserName, setNewUserName] = useState('');
  const [recentMilestone, setRecentMilestone] = useState(null);
  const [activeTab, setActiveTab] = useState('upload');
  const [manualMeters, setManualMeters] = useState('');
  const [selectedUser, setSelectedUser] = useState('');
  const fileInputRef = useRef(null);

  // Load data from localStorage
  useEffect(() => {
    const savedUsers = localStorage.getItem('rowingUsers');
    const savedEntries = localStorage.getItem('rowingEntries');
    const savedSignatures = localStorage.getItem('machineSignatures');
    
    if (savedUsers) setUsers(JSON.parse(savedUsers));
    if (savedEntries) setEntries(JSON.parse(savedEntries));
    if (savedSignatures) setMachineSignatures(JSON.parse(savedSignatures));
  }, []);

  // Save data to localStorage
  useEffect(() => {
    localStorage.setItem('rowingUsers', JSON.stringify(users));
  }, [users]);

  useEffect(() => {
    localStorage.setItem('rowingEntries', JSON.stringify(entries));
  }, [entries]);

  useEffect(() => {
    localStorage.setItem('machineSignatures', JSON.stringify(machineSignatures));
  }, [machineSignatures]);

  // Generate a simple image signature for machine recognition
  const generateImageSignature = async (imageData) => {
    return new Promise((resolve) => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');
        // Sample a small grid for signature
        canvas.width = 8;
        canvas.height = 8;
        ctx.drawImage(img, 0, 0, 8, 8);
        const data = ctx.getImageData(0, 0, 8, 8).data;
        // Create simple hash from pixel data
        let signature = '';
        for (let i = 0; i < data.length; i += 16) {
          signature += Math.floor(data[i] / 32).toString();
        }
        resolve(signature);
      };
      img.src = imageData;
    });
  };

  // Find matching user based on image signature
  const findMatchingUser = (signature) => {
    let bestMatch = null;
    let bestScore = 0;
    
    Object.entries(machineSignatures).forEach(([userId, userSignature]) => {
      let matches = 0;
      for (let i = 0; i < Math.min(signature.length, userSignature.length); i++) {
        if (signature[i] === userSignature[i]) matches++;
      }
      const score = matches / Math.max(signature.length, userSignature.length);
      if (score > bestScore && score > 0.6) {
        bestScore = score;
        bestMatch = userId;
      }
    });
    
    return bestMatch;
  };

  // Extract meters from image using OCR
  const extractMetersFromImage = async (imageData) => {
    setProcessingStatus('Analyzing image...');
    
    try {
      const result = await Tesseract.recognize(imageData, 'eng', {
        logger: (m) => {
          if (m.status === 'recognizing text') {
            setProcessingStatus(`Processing: ${Math.round(m.progress * 100)}%`);
          }
        },
      });

      const text = result.data.text;
      console.log('OCR Result:', text);

      // Look for meter patterns - rowing machines typically show large numbers
      const patterns = [
        /(\d{1,2}[,.]?\d{3,4})\s*m/i,  // Matches "1,234m" or "12345 m"
        /meters?\s*[:\s]*(\d{1,2}[,.]?\d{3,4})/i,  // "meters: 1234"
        /distance\s*[:\s]*(\d{1,2}[,.]?\d{3,4})/i,  // "distance: 1234"
        /(\d{4,6})(?:\s|$)/,  // Just a 4-6 digit number
        /(\d{1,3}[,]\d{3})/,  // Comma separated thousands
      ];

      for (const pattern of patterns) {
        const match = text.match(pattern);
        if (match) {
          const meters = parseInt(match[1].replace(/[,.\s]/g, ''), 10);
          if (meters >= 100 && meters <= 100000) {
            return meters;
          }
        }
      }

      // If no clear pattern, look for any reasonable number
      const numbers = text.match(/\d+/g);
      if (numbers) {
        for (const num of numbers) {
          const meters = parseInt(num, 10);
          if (meters >= 500 && meters <= 50000) {
            return meters;
          }
        }
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

    const reader = new FileReader();
    reader.onload = async (e) => {
      const imageData = e.target.result;
      
      // Generate signature and find user
      const signature = await generateImageSignature(imageData);
      const matchedUser = findMatchingUser(signature);
      
      // Extract meters
      const meters = await extractMetersFromImage(imageData);
      
      if (meters) {
        if (matchedUser) {
          // Known user - add entry directly
          addEntry(matchedUser, meters, signature);
        } else {
          // Unknown machine - ask for user name
          setPendingImage(signature);
          setPendingMeters(meters);
          setShowNewUserModal(true);
        }
      } else {
        setProcessingStatus('Could not read meters. Please enter manually.');
        setPendingImage(signature);
        setShowNewUserModal(true);
      }
      
      setIsProcessing(false);
    };
    reader.readAsDataURL(file);
    
    // Reset file input
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  // Add a new entry
  const addEntry = useCallback((userId, meters, signature = null) => {
    const prevTotal = getTotalMeters();
    
    const entry = {
      id: Date.now(),
      userId,
      meters,
      date: new Date().toISOString(),
    };
    
    setEntries((prev) => [...prev, entry]);
    
    // Update user stats
    setUsers((prev) => ({
      ...prev,
      [userId]: {
        ...prev[userId],
        totalMeters: (prev[userId]?.totalMeters || 0) + meters,
        uploadCount: (prev[userId]?.uploadCount || 0) + 1,
      },
    }));
    
    // Update signature if provided
    if (signature) {
      setMachineSignatures((prev) => ({
        ...prev,
        [userId]: signature,
      }));
    }
    
    // Check for new milestones
    const newTotal = prevTotal + meters;
    const newMilestone = MILESTONES.find(
      (m) => prevTotal < m.meters && newTotal >= m.meters
    );
    
    if (newMilestone) {
      setRecentMilestone(newMilestone);
      setTimeout(() => setRecentMilestone(null), 5000);
    }
    
    setProcessingStatus('');
    setActiveTab('leaderboard');
  }, [getTotalMeters]);

  // Handle new user registration
  const handleNewUser = () => {
    if (!newUserName.trim()) return;
    
    const userId = newUserName.toLowerCase().replace(/\s+/g, '_');
    const metersToAdd = pendingMeters || parseInt(manualMeters, 10) || 0;
    
    if (metersToAdd <= 0) {
      alert('Please enter valid meters');
      return;
    }
    
    // Create new user
    setUsers((prev) => ({
      ...prev,
      [userId]: {
        name: newUserName.trim(),
        totalMeters: 0,
        uploadCount: 0,
        createdAt: new Date().toISOString(),
      },
    }));
    
    // Add entry and signature
    setTimeout(() => {
      addEntry(userId, metersToAdd, pendingImage);
    }, 100);
    
    // Reset modal state
    setShowNewUserModal(false);
    setPendingImage(null);
    setPendingMeters(null);
    setNewUserName('');
    setManualMeters('');
  };

  // Handle manual entry for existing user
  const handleManualEntry = () => {
    if (!selectedUser || !manualMeters) return;
    
    const meters = parseInt(manualMeters, 10);
    if (meters <= 0 || meters > 100000) {
      alert('Please enter valid meters (1-100,000)');
      return;
    }
    
    addEntry(selectedUser, meters);
    setManualMeters('');
    setSelectedUser('');
  };

  // Calculate total meters
  const getTotalMeters = useCallback(() => {
    return Object.values(users).reduce((sum, user) => sum + (user.totalMeters || 0), 0);
  }, [users]);

  // Calculate streak for a user
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
    
    // Check if there's an entry today or yesterday to start the streak
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

  // Calculate average sessions per week
  const calculateWeeklyAverage = (userId) => {
    const userEntries = entries.filter((e) => e.userId === userId);
    if (userEntries.length === 0) return 0;
    
    const dates = userEntries.map((e) => new Date(e.date));
    const firstDate = new Date(Math.min(...dates));
    const now = new Date();
    const weeks = Math.max(1, (now - firstDate) / (7 * 24 * 60 * 60 * 1000));
    
    // Count unique days
    const uniqueDays = new Set(
      userEntries.map((e) => new Date(e.date).toDateString())
    ).size;
    
    return (uniqueDays / weeks).toFixed(1);
  };

  // Get current milestone progress
  const getCurrentMilestone = () => {
    const total = getTotalMeters();
    const nextMilestone = MILESTONES.find((m) => m.meters > total);
    const prevMilestone = MILESTONES.slice().reverse().find((m) => m.meters <= total);
    
    return { current: prevMilestone, next: nextMilestone, total };
  };

  // Format meters for display
  const formatMeters = (meters) => {
    if (meters >= 1000000) {
      return `${(meters / 1000000).toFixed(1)}M`;
    }
    if (meters >= 1000) {
      return `${(meters / 1000).toFixed(1)}k`;
    }
    return meters.toString();
  };

  // Get sorted leaderboard
  const getLeaderboard = () => {
    return Object.entries(users)
      .map(([id, user]) => ({
        id,
        ...user,
        streak: calculateStreak(id),
        weeklyAvg: calculateWeeklyAverage(id),
        avgPerUpload: user.uploadCount > 0 
          ? Math.round(user.totalMeters / user.uploadCount) 
          : 0,
      }))
      .sort((a, b) => b.totalMeters - a.totalMeters);
  };

  const milestoneProgress = getCurrentMilestone();
  const totalMeters = getTotalMeters();
  const worldProgress = (totalMeters / WORLD_CIRCUMFERENCE) * 100;

  return (
    <div className="app">
      {/* Milestone Celebration */}
      {recentMilestone && (
        <div className="milestone-celebration">
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
        <h1>ROW CREW</h1>
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
          <div 
            className="progress-bar" 
            style={{ width: `${Math.min(worldProgress, 100)}%` }}
          />
          <div className="progress-markers">
            {MILESTONES.filter(m => m.meters <= WORLD_CIRCUMFERENCE / 4).slice(0, 5).map((m, i) => (
              <div 
                key={i}
                className={`marker ${totalMeters >= m.meters ? 'achieved' : ''}`}
                style={{ left: `${(m.meters / WORLD_CIRCUMFERENCE) * 100}%` }}
                title={m.label}
              />
            ))}
          </div>
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

      {/* Navigation Tabs */}
      <nav className="tabs">
        <button 
          className={`tab ${activeTab === 'upload' ? 'active' : ''}`}
          onClick={() => setActiveTab('upload')}
        >
          📸 Log Row
        </button>
        <button 
          className={`tab ${activeTab === 'leaderboard' ? 'active' : ''}`}
          onClick={() => setActiveTab('leaderboard')}
        >
          🏆 Board
        </button>
        <button 
          className={`tab ${activeTab === 'stats' ? 'active' : ''}`}
          onClick={() => setActiveTab('stats')}
        >
          📊 Stats
        </button>
      </nav>

      {/* Main Content */}
      <main className="main-content">
        {/* Upload Tab */}
        {activeTab === 'upload' && (
          <section className="upload-section">
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
                  disabled={isProcessing}
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
            </div>

            {Object.keys(users).length > 0 && (
              <div className="manual-entry-card">
                <h3>Manual Entry</h3>
                <p>Or enter meters manually</p>
                <select 
                  value={selectedUser} 
                  onChange={(e) => setSelectedUser(e.target.value)}
                  className="user-select"
                >
                  <option value="">Select Rower</option>
                  {Object.entries(users).map(([id, user]) => (
                    <option key={id} value={id}>{user.name}</option>
                  ))}
                </select>
                <input
                  type="number"
                  placeholder="Meters rowed"
                  value={manualMeters}
                  onChange={(e) => setManualMeters(e.target.value)}
                  className="meters-input"
                />
                <button 
                  onClick={handleManualEntry}
                  disabled={!selectedUser || !manualMeters}
                  className="submit-button"
                >
                  Add Entry
                </button>
              </div>
            )}
          </section>
        )}

        {/* Leaderboard Tab */}
        {activeTab === 'leaderboard' && (
          <section className="leaderboard-section">
            <h2>Leaderboard</h2>
            {getLeaderboard().length === 0 ? (
              <div className="empty-state">
                <p>No rowers yet!</p>
                <p>Upload your first row to get started.</p>
              </div>
            ) : (
              <div className="leaderboard">
                {getLeaderboard().map((user, index) => (
                  <div key={user.id} className={`leaderboard-item rank-${index + 1}`}>
                    <div className="rank">
                      {index === 0 ? '🥇' : index === 1 ? '🥈' : index === 2 ? '🥉' : index + 1}
                    </div>
                    <div className="user-info">
                      <span className="user-name">{user.name}</span>
                      <span className="user-streak">
                        {user.streak > 0 && `🔥 ${user.streak} day streak`}
                      </span>
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

        {/* Stats Tab */}
        {activeTab === 'stats' && (
          <section className="stats-section">
            <h2>Detailed Stats</h2>
            {getLeaderboard().length === 0 ? (
              <div className="empty-state">
                <p>No stats yet!</p>
                <p>Start rowing to see your progress.</p>
              </div>
            ) : (
              <div className="stats-grid">
                {getLeaderboard().map((user) => (
                  <div key={user.id} className="stats-card">
                    <h3>{user.name}</h3>
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
      </main>

      {/* New User Modal */}
      {showNewUserModal && (
        <div className="modal-overlay" onClick={() => setShowNewUserModal(false)}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <h2>New Rower Detected!</h2>
            <p>We don't recognize this machine. Enter your name to register it.</p>
            
            {pendingMeters && (
              <div className="detected-meters">
                <span className="detected-label">Detected:</span>
                <span className="detected-value">{pendingMeters.toLocaleString()} meters</span>
              </div>
            )}
            
            <input
              type="text"
              placeholder="Your name"
              value={newUserName}
              onChange={(e) => setNewUserName(e.target.value)}
              className="name-input"
              autoFocus
            />
            
            {!pendingMeters && (
              <input
                type="number"
                placeholder="Meters rowed"
                value={manualMeters}
                onChange={(e) => setManualMeters(e.target.value)}
                className="meters-input"
              />
            )}
            
            <div className="modal-actions">
              <button 
                className="cancel-button"
                onClick={() => {
                  setShowNewUserModal(false);
                  setPendingImage(null);
                  setPendingMeters(null);
                  setNewUserName('');
                  setManualMeters('');
                }}
              >
                Cancel
              </button>
              <button 
                className="confirm-button"
                onClick={handleNewUser}
                disabled={!newUserName.trim() || (!pendingMeters && !manualMeters)}
              >
                Join Crew
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Footer */}
      <footer className="footer">
        <p>🌍 Goal: Row {formatMeters(WORLD_CIRCUMFERENCE)}m around the world!</p>
      </footer>
    </div>
  );
}

export default App;