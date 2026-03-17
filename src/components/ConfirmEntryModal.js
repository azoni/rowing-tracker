import React from 'react';
import { useApp } from '../context/AppContext';
import { MIN_METERS, MAX_METERS, ROWING_MACHINES, getMachineName } from '../constants';
import { parseTimeInput, calculatePace } from '../utils';
import Icon from './Icon';

function ConfirmEntryModal() {
  const {
    showConfirmModal, setShowConfirmModal,
    capturedImage, setCapturedImage,
    editableMeters, setEditableMeters,
    editableTime, setEditableTime,
    editableCalories, setEditableCalories,
    detectedMeters, detectedTime, detectedCalories,
    aiMachineType, setAiMachineType,
    customMachineName, setCustomMachineName,
    validationError, setValidationError,
    userProfile,
    handleConfirmEntry,
  } = useApp();

  if (!showConfirmModal) return null;

  return (
    <div className="modal-overlay" onClick={() => { setShowConfirmModal(false); setValidationError(''); setAiMachineType(''); }}>
      <div className="modal confirm-modal" onClick={(e) => e.stopPropagation()}>
        <h2>Confirm Your Row</h2>

        {capturedImage && (
          <div className="captured-image-preview">
            <img src={capturedImage.data || capturedImage} alt="Captured rowing screen" />
          </div>
        )}

        {/* AI Status Summary */}
        {capturedImage?.claudeResult && (
          <div className={`ai-status-bar ${capturedImage.claudeResult.confidence >= 60 ? 'high-confidence' : 'low-confidence'}`}>
            <span className="ai-status-icon"><Icon name="ui_robot" size={16} /></span>
            <span className="ai-status-text">
              {capturedImage.claudeResult.extractedMeters ? (
                <>
                  AI read your display {capturedImage.claudeResult.confidence >= 60 ? '✓' : '(uncertain)'}
                  {capturedImage.claudeResult.workoutType === 'interval' && capturedImage.claudeResult.intervalInfo && (
                    <span className="ai-workout-type"> — Interval workout ({capturedImage.claudeResult.intervalInfo.distance}m x{capturedImage.claudeResult.intervalInfo.count || '?'})</span>
                  )}
                  {capturedImage.claudeResult.extractedSplitPace && (
                    <span className="ai-workout-type"> — Pace: {capturedImage.claudeResult.extractedSplitPace}/500m</span>
                  )}
                </>
              ) : capturedImage.claudeResult.isRowingMachineDisplay === false ? (
                <>Doesn't look like a rowing display</>
              ) : (
                <>Couldn't read display - enter manually</>
              )}
            </span>
          </div>
        )}

        {capturedImage?.photoDate && (
          <div className="photo-date-info">
            <span><Icon name="ui_calendar" size={14} /> Photo taken: {capturedImage.photoDate.toLocaleString('en-US', { month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit' })}</span>
          </div>
        )}

        <div className="confirm-entry-form">
          {/* Meters - Required */}
          <div className="confirm-field confirm-field-main">
            <label className="confirm-label-with-ai">
              <span>Meters *</span>
              {detectedMeters && (
                <span className={`ai-field-indicator ${editableMeters !== detectedMeters ? 'edited' : ''}`}>
                  {editableMeters !== detectedMeters ? '✏️ edited' : <><Icon name="ui_robot" size={12} /> AI</>}
                </span>
              )}
            </label>
            <input
              type="number"
              value={editableMeters}
              onChange={(e) => { setEditableMeters(e.target.value); setValidationError(''); }}
              className={`confirm-input-large ${detectedMeters && editableMeters !== detectedMeters ? 'user-edited' : ''}`}
              placeholder="0"
              autoFocus
              min={MIN_METERS}
              max={MAX_METERS}
            />
          </div>

          {/* Time & Calories - Optional */}
          <div className="confirm-field-row">
            <div className="confirm-field">
              <label className="confirm-label-with-ai">
                <span>Time</span>
                {detectedTime ? (
                  <span className={`ai-field-indicator ${editableTime !== detectedTime ? 'edited' : ''}`}>
                    {editableTime !== detectedTime ? '✏️' : <Icon name="ui_robot" size={12} />}
                  </span>
                ) : (
                  <span className="optional-label">(optional)</span>
                )}
              </label>
              <input
                type="text"
                value={editableTime}
                onChange={(e) => setEditableTime(e.target.value)}
                className={`confirm-input ${detectedTime && editableTime !== detectedTime ? 'user-edited' : ''}`}
                placeholder="23:45"
              />
            </div>
            <div className="confirm-field">
              <label className="confirm-label-with-ai">
                <span>Calories</span>
                {detectedCalories ? (
                  <span className={`ai-field-indicator ${editableCalories !== detectedCalories ? 'edited' : ''}`}>
                    {editableCalories !== detectedCalories ? '✏️' : <Icon name="ui_robot" size={12} />}
                  </span>
                ) : (
                  <span className="optional-label">(optional)</span>
                )}
              </label>
              <input
                type="number"
                value={editableCalories}
                onChange={(e) => setEditableCalories(e.target.value)}
                className={`confirm-input ${detectedCalories && editableCalories !== detectedCalories ? 'user-edited' : ''}`}
                placeholder="0"
              />
            </div>
          </div>

          {/* Pace display if time entered */}
          {editableMeters && editableTime && parseTimeInput(editableTime) && (
            <div className="confirm-pace-display">
              <span><Icon name="ui_bolt" size={14} /> Pace: {calculatePace(parseInt(editableMeters, 10), parseTimeInput(editableTime))}/500m</span>
            </div>
          )}

          {/* Machine Type Section - Always show */}
          <div className="confirm-machine-section">
            <div className="confirm-machine-header">
              <span className="confirm-machine-label"><Icon name="ui_rowing" size={14} /> Machine</span>
              {(userProfile?.defaultMachine || userProfile?.lastUsedMachine) && !aiMachineType && (
                <span className="confirm-machine-default">
                  Using: {getMachineName(
                    userProfile.defaultMachine || userProfile.lastUsedMachine,
                    userProfile.customMachineName || userProfile.lastUsedMachineCustomName
                  )}
                </span>
              )}
            </div>

            {/* Show selector if: no default/lastUsed, AI confidence low, user corrected values, or user wants to change */}
            {(!(userProfile?.defaultMachine || userProfile?.lastUsedMachine) ||
              (capturedImage?.claudeResult && capturedImage.claudeResult.confidence < 60) ||
              (detectedMeters && editableMeters !== detectedMeters) ||
              aiMachineType) ? (
              <div className="confirm-machine-select-wrapper">
                <select
                  className="machine-type-select"
                  value={aiMachineType || userProfile?.defaultMachine || userProfile?.lastUsedMachine || ''}
                  onChange={(e) => {
                    setAiMachineType(e.target.value);
                    setCustomMachineName('');
                  }}
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

                {/* Custom machine input */}
                {(aiMachineType === 'other' ||
                  (!aiMachineType && (userProfile?.defaultMachine === 'other' || userProfile?.lastUsedMachine === 'other'))) && (
                  <input
                    type="text"
                    className="custom-machine-inline"
                    placeholder="Machine name..."
                    value={customMachineName || userProfile?.customMachineName || userProfile?.lastUsedMachineCustomName || ''}
                    onChange={(e) => setCustomMachineName(e.target.value)}
                    maxLength={50}
                  />
                )}
              </div>
            ) : (
              <button
                className="confirm-machine-change-btn"
                onClick={() => setAiMachineType(userProfile?.defaultMachine || userProfile?.lastUsedMachine || 'change')}
              >
                Change machine
              </button>
            )}

            {!(userProfile?.defaultMachine || userProfile?.lastUsedMachine) && (
              <small className="confirm-machine-hint">
                <Icon name="ui_info" size={12} /> Set a default in Settings to skip this next time
              </small>
            )}
          </div>
        </div>

        {validationError && (
          <div className="validation-error">
            <Icon name="ui_warning" size={14} /> {validationError}
          </div>
        )}

        <p className="confirm-user">Logging as <strong>{userProfile?.name}</strong></p>

        <div className="modal-actions">
          <button className="cancel-button" onClick={() => { setShowConfirmModal(false); setCapturedImage(null); setValidationError(''); setAiMachineType(''); setCustomMachineName(''); }}>
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
  );
}

export default ConfirmEntryModal;
