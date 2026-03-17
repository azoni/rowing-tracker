import React from 'react';
import Icon from './Icon';
import { useApp } from '../context/AppContext';
import { formatMeters, calculatePace, parseTimeInput } from '../utils';
import { MIN_METERS, MAX_METERS, COOLDOWN_MINUTES, getUserRank, getNextRank, ROWING_MACHINES, getMachineName } from '../constants';

function EntryForm() {
  const {
    dailyQuote, fileInputRef, galleryInputRef,
    handleImageUpload, isProcessing, processingStatus,
    userProfile, currentUser,
    manualMeters, setManualMeters,
    manualTime, setManualTime,
    manualCalories, setManualCalories,
    isSubmittingManual, handleManualSubmit,
    aiMachineType, setAiMachineType,
    customMachineName, setCustomMachineName,
    validationError,
    getWeeklyStats, getPersonalRecord,
    setShowRankProgressModal,
  } = useApp();

  return (
    <section className="upload-section">
      {/* Motivational Quote */}
      {dailyQuote && (
        <div className="daily-quote">
          <p className="quote-text">"{dailyQuote.text}"</p>
          <p className="quote-author">— {dailyQuote.author}</p>
        </div>
      )}

      <div className="upload-card">
        <h2>Log Your Row</h2>
        <p>Take a photo of your rowing machine display</p>

        <div className="upload-buttons-row">
          <label className="upload-button">
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              capture="environment"
              onChange={handleImageUpload}
              disabled={isProcessing || !userProfile}
            />
            <span className="upload-icon"><Icon name="ui_camera" size={20} /></span>
            <span>{isProcessing ? processingStatus : 'Take Photo'}</span>
          </label>

          <label className="upload-button">
            <input
              ref={galleryInputRef}
              type="file"
              accept="image/*"
              onChange={handleImageUpload}
              disabled={isProcessing || !userProfile}
            />
            <span className="upload-icon"><Icon name="ui_gallery" size={20} /></span>
            <span>{isProcessing ? processingStatus : 'Upload Photo'}</span>
          </label>
        </div>

        {isProcessing && (
          <div className="processing-indicator">
            <div className="spinner" />
            <p>{processingStatus}</p>
          </div>
        )}

        <div className="entry-limits">
          <p><Icon name="ui_meters" size={14} /> {MIN_METERS.toLocaleString()} - {MAX_METERS.toLocaleString()} meters per entry</p>
          <p><Icon name="ui_timer" size={14} /> {COOLDOWN_MINUTES} minute cooldown between entries</p>
        </div>

        {/* Divider */}
        <div className="upload-divider">
          <span>or enter manually</span>
        </div>

        {/* Manual Entry */}
        <div className="manual-entry">
          <div className="manual-entry-fields">
            <div className="manual-entry-row">
              <div className="manual-field manual-field-main">
                <label>Meters *</label>
                <input
                  type="number"
                  placeholder="2500"
                  value={manualMeters}
                  onChange={(e) => setManualMeters(e.target.value)}
                  disabled={isSubmittingManual || !userProfile}
                  min={MIN_METERS}
                  max={MAX_METERS}
                />
              </div>
            </div>
            <div className="manual-entry-row">
              <div className="manual-field">
                <label>Time</label>
                <input
                  type="text"
                  placeholder="23:45"
                  value={manualTime}
                  onChange={(e) => setManualTime(e.target.value)}
                  disabled={isSubmittingManual || !userProfile}
                />
              </div>
              <div className="manual-field">
                <label>Calories</label>
                <input
                  type="number"
                  placeholder="385"
                  value={manualCalories}
                  onChange={(e) => setManualCalories(e.target.value)}
                  disabled={isSubmittingManual || !userProfile}
                />
              </div>
            </div>

            {/* Machine Selection */}
            <div className="manual-entry-row">
              <div className="manual-field manual-field-full">
                <label>
                  <Icon name="ui_rowing" size={14} /> Machine
                  {(userProfile?.defaultMachine || userProfile?.lastUsedMachine) && !aiMachineType && (
                    <span className="manual-machine-using">
                      {getMachineName(
                        userProfile.defaultMachine || userProfile.lastUsedMachine,
                        userProfile.customMachineName || userProfile.lastUsedMachineCustomName
                      )}
                    </span>
                  )}
                </label>
                {(!(userProfile?.defaultMachine || userProfile?.lastUsedMachine) || aiMachineType) ? (
                  <>
                    <select
                      className="manual-machine-select"
                      value={aiMachineType || userProfile?.defaultMachine || userProfile?.lastUsedMachine || ''}
                      onChange={(e) => {
                        setAiMachineType(e.target.value);
                        setCustomMachineName('');
                      }}
                      disabled={isSubmittingManual || !userProfile}
                    >
                      <option value="">Select machine...</option>
                      <optgroup label="Popular">
                        {ROWING_MACHINES.filter(m => m.popular && m.id !== 'other').map(machine => (
                          <option key={machine.id} value={machine.id}>{machine.name}</option>
                        ))}
                      </optgroup>
                      <optgroup label="Other">
                        {ROWING_MACHINES.filter(m => !m.popular).map(machine => (
                          <option key={machine.id} value={machine.id}>{machine.name}</option>
                        ))}
                      </optgroup>
                    </select>
                    {(aiMachineType === 'other' ||
                      (!aiMachineType && (userProfile?.defaultMachine === 'other' || userProfile?.lastUsedMachine === 'other'))) && (
                      <input
                        type="text"
                        className="manual-custom-machine"
                        placeholder="Machine name..."
                        value={customMachineName || userProfile?.customMachineName || userProfile?.lastUsedMachineCustomName || ''}
                        onChange={(e) => setCustomMachineName(e.target.value)}
                        maxLength={50}
                        disabled={isSubmittingManual}
                      />
                    )}
                  </>
                ) : (
                  <button
                    type="button"
                    className="manual-machine-change"
                    onClick={() => setAiMachineType(userProfile?.defaultMachine || userProfile?.lastUsedMachine || 'change')}
                    disabled={isSubmittingManual}
                  >
                    Change
                  </button>
                )}
              </div>
            </div>

            {manualMeters && manualTime && parseTimeInput(manualTime) && (
              <div className="manual-pace-display">
                <Icon name="ui_bolt" size={14} /> Pace: {calculatePace(parseInt(manualMeters, 10), parseTimeInput(manualTime))}/500m
              </div>
            )}
            <button
              className="manual-submit-btn-full"
              onClick={handleManualSubmit}
              disabled={isSubmittingManual || !userProfile || !manualMeters}
            >
              {isSubmittingManual ? 'Saving...' : `Log ${manualMeters ? parseInt(manualMeters, 10).toLocaleString() + 'm' : 'Row'}`}
            </button>
          </div>
          <p className="manual-entry-note">
            <Icon name="ui_warning" size={14} /> Manual entries are marked as unverified
          </p>
        </div>

        {validationError && (
          <div className="validation-error">{validationError}</div>
        )}
      </div>

      {/* User Rank & Weekly Stats */}
      {userProfile && (
        <div className="user-status-card">
          <div
            className="user-rank-display clickable"
            onClick={() => setShowRankProgressModal(true)}
          >
            <span className="rank-emoji"><Icon name={getUserRank(userProfile.totalMeters).emoji} size={24} /></span>
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

      {/* Personal Record Display */}
      {userProfile && getPersonalRecord(currentUser?.uid) > 0 && (
        <div className="pr-display">
          <span className="pr-label"><Icon name="ui_trophy" size={16} /> Personal Record</span>
          <span className="pr-value">{getPersonalRecord(currentUser?.uid).toLocaleString()}m</span>
        </div>
      )}
    </section>
  );
}

export default EntryForm;
