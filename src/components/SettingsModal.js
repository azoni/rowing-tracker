import React from 'react';
import { useApp } from '../context/AppContext';
import { db } from '../firebase';
import { doc, updateDoc } from 'firebase/firestore';
import { ROWING_MACHINES, getMachineName, normalizeMachineName, THEMES, THEME_LIST } from '../constants';
import Icon from './Icon';

function SettingsModal() {
  const {
    showSettingsModal, setShowSettingsModal,
    setShowAvatarBuilder,
    userProfile, currentUser,
    profilePicInputRef, handleProfilePicUpload, isUploadingPhoto,
    newUsername, handleUsernameChange, usernameStatus,
    currentTheme, setCurrentTheme,
    setShowSessionHistory, setShowWrapped, setWrappedSlide,
    setShowMonthlyRecap, setMonthlyRecapSlide,
    getWrappedStats, handleSignOut,
    setNewUsername, setUsernameStatus,
  } = useApp();

  if (!showSettingsModal) return null;

  return (
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
                <button
                  className="settings-avatar-btn"
                  onClick={() => { setShowAvatarBuilder(true); setShowSettingsModal(false); }}
                >
                  <Icon name="ui_user" size={16} /> Create Avatar
                </button>
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
                <span>Username</span>
                <span className="settings-username">@{userProfile.username || 'not set'}</span>
              </div>
            </div>

            {/* Change Username */}
            <div className="settings-section">
              <h3>Change Username</h3>
              <div className="username-change-form">
                <div className="username-input-wrapper">
                  <span className="username-prefix">@</span>
                  <input
                    type="text"
                    placeholder={userProfile.username || 'new_username'}
                    value={newUsername}
                    onChange={(e) => handleUsernameChange(e.target.value)}
                    className="username-input"
                    maxLength={20}
                  />
                  <span className="username-status">
                    {usernameStatus === 'checking' && <Icon name="ui_pending" size={14} />}
                    {usernameStatus === 'available' && <Icon name="ui_check" size={14} />}
                    {usernameStatus === 'taken' && <Icon name="ui_unverified" size={14} />}
                    {usernameStatus === 'invalid' && <Icon name="ui_warning" size={14} />}
                  </span>
                </div>
                <button
                  className="username-save-btn"
                  onClick={async () => {
                    if (usernameStatus !== 'available' || !newUsername) return;
                    try {
                      await updateDoc(doc(db, 'users', currentUser.uid), {
                        username: newUsername.toLowerCase()
                      });
                      setNewUsername('');
                      setUsernameStatus(null);
                    } catch (error) {
                      console.error('Error updating username:', error);
                    }
                  }}
                  disabled={usernameStatus !== 'available'}
                >
                  Save
                </button>
              </div>
              <small className="username-hint">
                {!usernameStatus && 'Enter a new username (3-20 chars, a-z, 0-9, _)'}
                {usernameStatus === 'checking' && 'Checking availability...'}
                {usernameStatus === 'available' && 'Username is available!'}
                {usernameStatus === 'taken' && 'Username is already taken'}
                {usernameStatus === 'invalid' && 'Invalid format'}
              </small>
            </div>

            {/* Default Rowing Machine */}
            <div className="settings-section">
              <h3><Icon name="ui_rowing" size={16} /> My Rower</h3>
              <p className="settings-section-desc">Set your default machine to help our AI learn</p>
              <div className="rower-select-wrapper">
                <select
                  className="rower-select"
                  value={userProfile.defaultMachine || ''}
                  onChange={async (e) => {
                    const newMachine = e.target.value;
                    try {
                      await updateDoc(doc(db, 'users', currentUser.uid), {
                        defaultMachine: newMachine,
                        customMachineName: newMachine === 'other' ? userProfile.customMachineName : null
                      });
                    } catch (error) {
                      console.error('Error updating default machine:', error);
                    }
                  }}
                >
                  <option value="">Select your machine...</option>
                  <optgroup label="Popular">
                    {ROWING_MACHINES.filter(m => m.popular && m.id !== 'other').map(machine => (
                      <option key={machine.id} value={machine.id}>{machine.name}</option>
                    ))}
                  </optgroup>
                  <optgroup label="Other Machines">
                    {ROWING_MACHINES.filter(m => !m.popular && m.id !== 'other').map(machine => (
                      <option key={machine.id} value={machine.id}>{machine.name}</option>
                    ))}
                  </optgroup>
                  <option value="other">Other / Custom...</option>
                </select>
              </div>

              {/* Custom machine name input */}
              {userProfile.defaultMachine === 'other' && (
                <div className="custom-machine-input">
                  <input
                    type="text"
                    placeholder="Enter your machine name..."
                    value={userProfile.customMachineName || ''}
                    onChange={async (e) => {
                      const inputValue = e.target.value;
                      try {
                        await updateDoc(doc(db, 'users', currentUser.uid), {
                          customMachineName: inputValue
                        });
                      } catch (error) {
                        console.error('Error updating custom machine name:', error);
                      }
                    }}
                    maxLength={50}
                  />
                  {/* Smart suggestion if input matches a known machine */}
                  {userProfile.customMachineName && (() => {
                    const matchedId = normalizeMachineName(userProfile.customMachineName);
                    if (matchedId && matchedId !== 'other') {
                      const matchedMachine = ROWING_MACHINES.find(m => m.id === matchedId);
                      return (
                        <div className="machine-suggestion">
                          <span>Did you mean <strong>{matchedMachine?.name}</strong>?</span>
                          <button
                            type="button"
                            onClick={async () => {
                              try {
                                await updateDoc(doc(db, 'users', currentUser.uid), {
                                  defaultMachine: matchedId,
                                  customMachineName: null
                                });
                              } catch (error) {
                                console.error('Error updating machine:', error);
                              }
                            }}
                          >
                            Use {matchedMachine?.name}
                          </button>
                        </div>
                      );
                    }
                    return null;
                  })()}
                  <small>e.g., "Planet Fitness Rower", "Hotel Gym LifeSpan"</small>
                </div>
              )}

              {userProfile.defaultMachine && (
                <div className="rower-current">
                  ✓ Default: <strong>{getMachineName(userProfile.defaultMachine, userProfile.customMachineName)}</strong>
                </div>
              )}

              {/* Show last used machine if no default set */}
              {!userProfile.defaultMachine && userProfile.lastUsedMachine && (
                <div className="rower-last-used">
                  <div className="rower-last-used-info">
                    <span>Last used: <strong>{getMachineName(userProfile.lastUsedMachine, userProfile.lastUsedMachineCustomName)}</strong></span>
                  </div>
                  <button
                    className="rower-make-default-btn"
                    onClick={async () => {
                      try {
                        await updateDoc(doc(db, 'users', currentUser.uid), {
                          defaultMachine: userProfile.lastUsedMachine,
                          customMachineName: userProfile.lastUsedMachineCustomName || null
                        });
                      } catch (error) {
                        console.error('Error setting default machine:', error);
                      }
                    }}
                  >
                    Make Default
                  </button>
                </div>
              )}
            </div>

            {/* Theme Selector */}
            <div className="settings-section">
              <h3><Icon name="ui_settings" size={16} /> Theme</h3>
              <div className="theme-selector">
                {THEME_LIST.map((theme) => (
                  <button
                    key={theme.id}
                    className={`theme-option ${currentTheme === theme.id ? 'active' : ''}`}
                    onClick={() => setCurrentTheme(theme.id)}
                    data-theme-preview={theme.id}
                  >
                    <span className="theme-emoji"><Icon name={theme.emoji} size={20} /></span>
                    <span className="theme-name">{theme.name}</span>
                    {currentTheme === theme.id && <span className="theme-check">✓</span>}
                  </button>
                ))}
              </div>
              <p className="settings-section-desc">{THEMES[currentTheme]?.description}</p>
            </div>

            {/* Session History Button */}
            <div className="settings-section">
              <h3>History</h3>
              <button
                className="settings-history-btn"
                onClick={() => { setShowSessionHistory(true); setShowSettingsModal(false); }}
              >
                <Icon name="ui_history" size={16} /> View Session History
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
                  <Icon name="ui_gift" size={16} /> View 2025 Wrapped
                </button>
              </div>
            )}

            {/* Monthly Recap */}
            <div className="settings-section">
              <h3>Monthly Recap</h3>
              <button
                className="settings-wrapped-btn"
                onClick={() => { setShowMonthlyRecap(true); setShowSettingsModal(false); setMonthlyRecapSlide(0); }}
              >
                <Icon name="ui_calendar" size={16} /> View Last Month's Recap
              </button>
            </div>

            {/* App Sync */}
            <div className="settings-section">
              <h3>App Sync</h3>
              <label className="settings-toggle-row">
                <span className="settings-toggle-label">
                  <Icon name="ui_bolt" size={16} /> Sync rows to BenchOnly
                </span>
                <input
                  type="checkbox"
                  checked={userProfile?.syncToBenchOnly || false}
                  onChange={async (e) => {
                    try {
                      await updateDoc(doc(db, 'users', currentUser.uid), { syncToBenchOnly: e.target.checked });
                    } catch (err) {
                      console.error('Sync toggle error:', err);
                    }
                  }}
                />
              </label>
              <p className="settings-hint">Automatically log rowing sessions as cardio on BenchOnly (uses your Google email to match accounts)</p>
            </div>

            {/* Sign Out */}
            <button className="settings-signout-btn" onClick={() => { handleSignOut(); setShowSettingsModal(false); }}>
              Sign Out
            </button>
          </>
        )}
      </div>
    </div>
  );
}

export default SettingsModal;
