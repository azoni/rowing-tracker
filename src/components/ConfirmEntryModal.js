import React, { useEffect, useRef } from 'react';
import { useApp } from '../context/AppContext';
import { MIN_METERS, MAX_METERS, ROWING_MACHINES } from '../constants';
import { parseTimeInput, calculatePace } from '../utils';
import Icon from './Icon';
import './EntryFlow.css';

function ConfirmEntryModal() {
  const {
    showConfirmModal, setShowConfirmModal, setShowLogModal,
    capturedImage, setCapturedImage,
    editableMeters, setEditableMeters, editableTime, setEditableTime,
    editableCalories, setEditableCalories, detectedMeters, detectedTime, detectedCalories,
    aiMachineType, setAiMachineType, customMachineName, setCustomMachineName,
    validationError, setValidationError, userProfile, handleConfirmEntry, isProcessing,
  } = useApp();
  const dialogRef = useRef(null);
  const busyRef = useRef(isProcessing);
  busyRef.current = isProcessing;

  useEffect(() => {
    if (!showConfirmModal) return undefined;
    const previousFocus = document.activeElement;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    dialogRef.current?.focus();
    const onKeyDown = event => {
      if (event.key === 'Escape') {
        event.preventDefault();
        if (!busyRef.current) {
          setShowConfirmModal(false);
          setCapturedImage(null);
          setValidationError('');
          setAiMachineType('');
          setCustomMachineName('');
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
  }, [showConfirmModal, setShowConfirmModal, setCapturedImage, setValidationError, setAiMachineType, setCustomMachineName]);

  if (!showConfirmModal) return null;
  const meters = Number(editableMeters);
  const validMeters = Number.isInteger(meters) && meters >= MIN_METERS && meters <= MAX_METERS;
  const timeSeconds = parseTimeInput(editableTime);
  const invalidTime = Boolean(editableTime.trim()) && !(timeSeconds > 0);
  const machine = aiMachineType || userProfile?.defaultMachine || userProfile?.lastUsedMachine || '';
  const aiResult = capturedImage?.claudeResult;
  const uncertainReading = aiResult && (!aiResult.extractedMeters || aiResult.confidence < 60);
  const close = (chooseAnother = false) => {
    if (isProcessing) return;
    setShowConfirmModal(false);
    setCapturedImage(null);
    setValidationError('');
    setAiMachineType('');
    setCustomMachineName('');
    if (chooseAnother) setShowLogModal(true);
  };
  const fieldIndicator = (value, detected) => detected ? <span className={`entry-read-label ${String(value) !== String(detected) ? 'is-edited' : ''}`}>
    {String(value) !== String(detected) ? 'Edited' : 'From photo'}
  </span> : null;

  return (
    <div className="modal-overlay entry-flow-overlay" onClick={() => close()}>
      <section className="modal confirm-modal entry-flow entry-review" role="dialog" aria-modal="true"
        aria-labelledby="review-row-title" aria-describedby="review-row-description" aria-busy={isProcessing}
        ref={dialogRef} tabIndex={-1} onClick={event => event.stopPropagation()}>
        <header className="entry-flow-heading">
          <div><p className="entry-eyebrow">One quick check</p><h2 id="review-row-title">Review your row</h2></div>
          <button type="button" className="entry-close" aria-label="Cancel row review" onClick={() => close()} disabled={isProcessing}>×</button>
        </header>
        <p id="review-row-description" className="entry-description">Check these numbers against your monitor. Tap any field to correct it.</p>

        {capturedImage && <details className="entry-photo-review">
          <summary><img src={capturedImage.data || capturedImage} alt="Your rowing monitor" /><span>View your photo<strong>Tap to expand</strong></span></summary>
          <img className="entry-photo-expanded" src={capturedImage.data || capturedImage} alt="Full rowing monitor display" />
        </details>}
        {uncertainReading && <p className="entry-reading-warning" role="status"><Icon name="ui_warning" size={16} />
          {aiResult.isRowingMachineDisplay === false ? 'This may not be a rowing monitor. Check the photo and enter the correct distance.' : 'Some numbers were hard to read. Check and fill in the fields below.'}
        </p>}
        {aiResult?.metersEstimated && <p className="entry-reading-warning" role="status">Distance was estimated from the display. Replace it with the actual meters if available.</p>}
        {aiResult?.workoutType === 'interval' && aiResult.intervalInfo && <p className="entry-field-help">Interval workout detected: {aiResult.intervalInfo.distance} m × {aiResult.intervalInfo.count || '?'}.</p>}
        {capturedImage?.photoDate && <p className="entry-field-help">Photo taken {capturedImage.photoDate.toLocaleString('en-US', { month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit' })}</p>}

        <form onSubmit={event => { event.preventDefault(); if (!isProcessing && validMeters && !invalidTime && userProfile) handleConfirmEntry(); }}>
          <div className="entry-field entry-distance-field">
            <label htmlFor="review-row-meters">Distance <span>meters</span>{fieldIndicator(editableMeters, detectedMeters)}</label>
            <input id="review-row-meters" type="number" inputMode="numeric" value={editableMeters}
              onChange={event => { setEditableMeters(event.target.value); setValidationError(''); }}
              placeholder="Enter meters" min={MIN_METERS} max={MAX_METERS} step="1" required disabled={isProcessing}
              aria-describedby="review-distance-help" />
            <p className="entry-field-help" id="review-distance-help">{MIN_METERS.toLocaleString()}–{MAX_METERS.toLocaleString()} meters per row.</p>
          </div>
          <div className="entry-field-pair">
            <div className="entry-field"><label htmlFor="review-row-time">Time {fieldIndicator(editableTime, detectedTime)}</label>
              <input id="review-row-time" type="text" value={editableTime} onChange={event => { setEditableTime(event.target.value); setValidationError(''); }}
                placeholder="23:45" disabled={isProcessing} aria-invalid={invalidTime} aria-describedby="review-time-help" />
              <p className="entry-field-help" id="review-time-help">Optional · minutes:seconds</p>
            </div>
            <div className="entry-field"><label htmlFor="review-row-calories">Calories {fieldIndicator(editableCalories, detectedCalories)}</label>
              <input id="review-row-calories" type="number" inputMode="numeric" value={editableCalories} onChange={event => setEditableCalories(event.target.value)}
                placeholder="Optional" min="0" step="1" disabled={isProcessing} />
            </div>
          </div>
          {invalidTime && <p className="entry-field-error" role="alert">Use a time such as 23:45 or 1425 seconds.</p>}
          {validMeters && timeSeconds > 0 && <p className="entry-pace"><Icon name="ui_bolt" size={14} /> {calculatePace(meters, timeSeconds)} /500m</p>}
          <details className="entry-details">
            <summary>Rowing machine <span>{machine ? ROWING_MACHINES.find(item => item.id === machine)?.name || 'Selected' : 'Optional'}</span></summary>
            <div className="entry-field"><label htmlFor="review-row-machine">Machine</label>
              <select id="review-row-machine" value={machine} onChange={event => { setAiMachineType(event.target.value); setCustomMachineName(''); }} disabled={isProcessing}>
                <option value="">Select machine (optional)</option>
                <optgroup label="Popular">{ROWING_MACHINES.filter(item => item.popular && item.id !== 'other').map(item => <option key={item.id} value={item.id}>{item.name}</option>)}</optgroup>
                <optgroup label="Other">{ROWING_MACHINES.filter(item => !item.popular).map(item => <option key={item.id} value={item.id}>{item.name}</option>)}</optgroup>
              </select>
            </div>
            {machine === 'other' && <div className="entry-field"><label htmlFor="review-machine-name">Machine name</label>
              <input id="review-machine-name" type="text" value={customMachineName || userProfile?.customMachineName || userProfile?.lastUsedMachineCustomName || ''}
                onChange={event => setCustomMachineName(event.target.value)} maxLength={50} disabled={isProcessing} />
            </div>}
          </details>
          {validationError && <div className="validation-error" role="alert">{validationError}</div>}
          <div className="entry-review-actions">
            <button type="submit" className="entry-save-button" disabled={isProcessing || !validMeters || invalidTime || !userProfile}>
              {isProcessing ? <><span className="spinner-small" aria-hidden="true" /> Saving your row…</> : `Log ${validMeters ? `${meters.toLocaleString()} m` : 'row'}`}
            </button>
            <button type="button" className="entry-back-button" disabled={isProcessing} onClick={() => close(true)}>Choose another photo</button>
          </div>
          <p className="entry-field-help entry-manual-note" role={isProcessing ? 'status' : undefined}>
            {isProcessing ? 'Keep this open while your row saves.' : `Logging as ${userProfile?.name || 'you'}. Nothing saves until you tap Log.`}
          </p>
        </form>
      </section>
    </div>
  );
}

export default ConfirmEntryModal;
