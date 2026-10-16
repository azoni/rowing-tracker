import React, { useEffect, useRef, useState } from 'react';
import Icon from './Icon';
import { useApp } from '../context/AppContext';
import { calculatePace, parseTimeInput } from '../utils';
import { MIN_METERS, MAX_METERS, COOLDOWN_MINUTES, ROWING_MACHINES, getMachineName } from '../constants';
import './EntryFlow.css';

const WORKOUT_TYPES = [
  { key: 'free_row', label: 'Free row' },
  { key: 'timed', label: 'Timed' },
  { key: 'distance', label: 'Distance' },
  { key: 'interval', label: 'Intervals' },
];

function EntryForm() {
  const {
    showLogModal, setShowLogModal, fileInputRef, galleryInputRef,
    handleImageUpload, isProcessing, processingStatus, userProfile, isAdmin,
    manualMeters, setManualMeters, manualTime, setManualTime,
    manualCalories, setManualCalories, isSubmittingManual, handleManualSubmit,
    aiMachineType, setAiMachineType, customMachineName, setCustomMachineName,
    sessionType, setSessionType, testMode, setTestMode, validationError, setValidationError,
  } = useApp();
  const [method, setMethod] = useState('photo');
  const dialogRef = useRef(null);
  const busy = isProcessing || isSubmittingManual;
  const busyRef = useRef(busy);
  busyRef.current = busy;

  useEffect(() => {
    if (!showLogModal) return undefined;
    const previousFocus = document.activeElement;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    dialogRef.current?.focus();
    const onKeyDown = (event) => {
      if (event.key === 'Escape') {
        event.preventDefault();
        if (!busyRef.current) {
          setShowLogModal(false);
          setValidationError('');
        }
      }
      if (event.key === 'Tab') {
        const controls = Array.from(dialogRef.current?.querySelectorAll('button:not(:disabled), input:not(:disabled), select:not(:disabled), summary, [tabindex="0"]') || []).filter(el => el.getClientRects().length);
        const first = controls[0];
        const last = controls[controls.length - 1];
        if (!first) { event.preventDefault(); return; }
        const focusOutside = !dialogRef.current?.contains(document.activeElement);
        if (event.shiftKey && (document.activeElement === first || document.activeElement === dialogRef.current || focusOutside)) {
          event.preventDefault(); last.focus();
        } else if (!event.shiftKey && (document.activeElement === last || document.activeElement === dialogRef.current || focusOutside)) {
          event.preventDefault(); first.focus();
        }
      }
    };
    document.addEventListener('keydown', onKeyDown);
    return () => {
      document.removeEventListener('keydown', onKeyDown);
      document.body.style.overflow = previousOverflow;
      if (previousFocus?.isConnected) previousFocus.focus();
    };
  }, [showLogModal, setShowLogModal, setValidationError]);

  if (!showLogModal) return null;
  const disabled = busy || !userProfile;
  const meters = Number(manualMeters);
  const validMeters = Number.isInteger(meters) && meters >= MIN_METERS && meters <= MAX_METERS;
  const timeSeconds = parseTimeInput(manualTime);
  const invalidTime = Boolean(manualTime.trim()) && !(timeSeconds > 0);
  const defaultMachine = userProfile?.defaultMachine || userProfile?.lastUsedMachine || '';
  const machine = aiMachineType || defaultMachine;
  const close = () => {
    if (busy) return;
    setShowLogModal(false);
    setValidationError('');
  };
  const workoutOptions = (
    <div className="entry-workout-options" role="group" aria-label="Workout type">
      {WORKOUT_TYPES.map(type => (
        <button type="button" key={type.key} aria-pressed={sessionType === type.key}
          disabled={disabled} onClick={() => setSessionType(type.key)}>{type.label}</button>
      ))}
    </div>
  );

  return (
    <div className="modal-overlay entry-flow-overlay" onClick={close}>
      <section className="log-modal entry-flow" role="dialog" aria-modal="true" aria-labelledby="entry-title"
        aria-describedby="entry-description" aria-busy={busy} tabIndex={-1} ref={dialogRef} onClick={e => e.stopPropagation()}>
        <header className="entry-flow-heading">
          <div><p className="entry-eyebrow">Make it count</p><h2 id="entry-title">Log your row</h2></div>
          <button type="button" className="entry-close" aria-label="Close log row" onClick={close} disabled={busy}>×</button>
        </header>
        <p className="entry-description" id="entry-description">Add a photo of your monitor, or enter your distance.</p>

        <div className="entry-methods" role="group" aria-label="Entry method">
          <button type="button" aria-pressed={method === 'photo'} disabled={busy} onClick={() => { setMethod('photo'); setValidationError(''); }}>
            <Icon name="ui_camera" size={18} /> Photo <span>Quickest</span>
          </button>
          <button type="button" aria-pressed={method === 'manual'} disabled={busy} onClick={() => { setMethod('manual'); setValidationError(''); }}>
            <Icon name="ui_meters" size={18} /> Manual
          </button>
        </div>

        {!userProfile && <p className="entry-inline-message" role="status">Sign in and finish your profile to log a row.</p>}

        {method === 'photo' ? (
          <div className="entry-photo-panel">
            <div className="entry-upload-actions">
              <button type="button" className="entry-camera-action" disabled={disabled} onClick={() => fileInputRef.current?.click()}>
                <Icon name="ui_camera" size={28} /><strong>Take a photo</strong><span>Open your camera</span>
              </button>
              <button type="button" className="entry-gallery-action" disabled={disabled} onClick={() => galleryInputRef.current?.click()}>
                <Icon name="ui_gallery" size={28} /><strong>Choose a photo</strong><span>From your library</span>
              </button>
            </div>
            <input ref={fileInputRef} className="entry-file-input" aria-label="Take a photo of your rowing monitor" type="file" accept="image/*" capture="environment" onChange={handleImageUpload} disabled={disabled} />
            <input ref={galleryInputRef} className="entry-file-input" aria-label="Choose a rowing monitor photo" type="file" accept="image/*" onChange={handleImageUpload} disabled={disabled} />
            {isProcessing ? (
              <div className="entry-processing" role="status" aria-live="polite">
                <span className="spinner-small" aria-hidden="true" /><div><strong>{processingStatus || 'Reading your photo…'}</strong><p>Keep this open. You’ll review the numbers before saving.</p></div>
              </div>
            ) : (
              <p className="entry-photo-tip">Keep the whole monitor in view and the numbers sharp. You can check and edit everything before saving.</p>
            )}
            <details className="entry-details">
              <summary>Workout type <span>{WORKOUT_TYPES.find(type => type.key === sessionType)?.label || 'Free row'}</span></summary>
              <p className="entry-field-help">Choose intervals if your monitor shows repeated work and rest sets.</p>
              {workoutOptions}
            </details>
          </div>
        ) : (
          <form className="entry-manual-panel" onSubmit={event => { event.preventDefault(); if (!disabled && validMeters && !invalidTime) handleManualSubmit(); }}>
            <div className="entry-field entry-distance-field">
              <label htmlFor="manual-row-meters">Distance <span>meters</span></label>
              <input id="manual-row-meters" type="number" inputMode="numeric" placeholder="e.g. 5000" value={manualMeters}
                onChange={e => { setManualMeters(e.target.value); setValidationError(''); }} disabled={disabled}
                min={MIN_METERS} max={MAX_METERS} step="1" required aria-describedby="manual-distance-help" />
              <p className="entry-field-help" id="manual-distance-help">{MIN_METERS.toLocaleString()}–{MAX_METERS.toLocaleString()} meters per row.</p>
            </div>
            <details className="entry-details">
              <summary>Add workout details <span>Optional</span></summary>
              <div className="entry-field-pair">
                <div className="entry-field"><label htmlFor="manual-row-time">Time</label>
                  <input id="manual-row-time" type="text" placeholder="23:45" value={manualTime} disabled={disabled}
                    onChange={e => { setManualTime(e.target.value); setValidationError(''); }} aria-invalid={invalidTime} aria-describedby="manual-time-help" />
                  <p className="entry-field-help" id="manual-time-help">Minutes:seconds, or total seconds.</p>
                </div>
                <div className="entry-field"><label htmlFor="manual-row-calories">Calories</label>
                  <input id="manual-row-calories" type="number" inputMode="numeric" placeholder="Optional" min="0" step="1"
                    value={manualCalories} onChange={e => setManualCalories(e.target.value)} disabled={disabled} />
                </div>
              </div>
              {invalidTime && <p className="entry-field-error" role="alert">Use a time such as 23:45 or 1425 seconds.</p>}
              <div className="entry-field">
                <label htmlFor="manual-row-machine">Rowing machine</label>
                <select id="manual-row-machine" value={machine} disabled={disabled} onChange={e => { setAiMachineType(e.target.value); setCustomMachineName(''); }}>
                  <option value="">Select machine (optional)</option>
                  <optgroup label="Popular">{ROWING_MACHINES.filter(item => item.popular && item.id !== 'other').map(item => <option key={item.id} value={item.id}>{item.name}</option>)}</optgroup>
                  <optgroup label="Other">{ROWING_MACHINES.filter(item => !item.popular).map(item => <option key={item.id} value={item.id}>{item.name}</option>)}</optgroup>
                </select>
              </div>
              {machine === 'other' && <div className="entry-field"><label htmlFor="manual-machine-name">Machine name</label>
                <input id="manual-machine-name" type="text" maxLength={50} value={customMachineName || userProfile?.customMachineName || userProfile?.lastUsedMachineCustomName || ''} onChange={e => setCustomMachineName(e.target.value)} disabled={disabled} />
              </div>}
              <p className="entry-field-label">Workout type</p>{workoutOptions}
            </details>
            {defaultMachine && !aiMachineType && <p className="entry-field-help">Using {getMachineName(defaultMachine, userProfile?.customMachineName || userProfile?.lastUsedMachineCustomName)}. Change it in workout details.</p>}
            {validMeters && timeSeconds > 0 && <p className="entry-pace"><Icon name="ui_bolt" size={14} /> {calculatePace(meters, timeSeconds)} /500m</p>}
            <button type="submit" className="entry-save-button" disabled={disabled || !validMeters || invalidTime}>
              {isSubmittingManual ? 'Saving your row…' : `Log ${validMeters ? `${meters.toLocaleString()} m` : 'row'}`}
            </button>
            <p className="entry-field-help entry-manual-note">Manual rows count toward your distance and are marked unverified.</p>
          </form>
        )}

        {validationError && <div className="validation-error" role="alert">{validationError}</div>}
        <p className="entry-limits-note">{COOLDOWN_MINUTES}-minute cooldown between entries.</p>

        {isAdmin && <details className="entry-details entry-admin-details"><summary>Admin testing <span>{testMode ? (testMode === 'dry' ? 'Dry run' : 'To review') : 'Off'}</span></summary>
          <div className="entry-workout-options" role="group" aria-label="Admin test mode">
            {[{ key: false, label: 'Off' }, { key: 'dry', label: 'Dry run' }, { key: 'review', label: 'To review' }].map(option => (
              <button type="button" key={String(option.key)} aria-pressed={testMode === option.key} disabled={busy} onClick={() => setTestMode(option.key)}>{option.label}</button>
            ))}
          </div>
          {testMode === 'dry' && <p className="entry-field-help">Photo analysis runs; nothing saves.</p>}
          {testMode === 'review' && <p className="entry-field-help">Saves photo and entry for review without changing stats.</p>}
        </details>}
      </section>
    </div>
  );
}

export default EntryForm;
