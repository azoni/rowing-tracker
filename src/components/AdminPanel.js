import React, { useState } from 'react';
import Icon from './Icon';
import { useApp } from '../context/AppContext';
import { collection, query, where, orderBy, limit, getDocs, doc, updateDoc } from 'firebase/firestore';
import { db } from '../firebase';

import { THROWDOWNS, MONTHLY_CHALLENGES } from '../constants';

const SHORT_MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

function AdminPanel() {
  const {
    showAdminPanel, setShowAdminPanel,
    isAdmin, adminStats, users,
    pendingReviews, loadPendingReviews,
    reviewingEntry, setReviewingEntry,
    adjustedMeters, setAdjustedMeters,
    reviewNote, setReviewNote,
    handleReviewEntry, setShowPhotoModal,
    setShowMonthlyRecap, setMonthlyRecapSlide, setMonthlyRecapMonth,
  } = useApp();

  const [photoEntries, setPhotoEntries] = useState([]);
  const [loadingPhotos, setLoadingPhotos] = useState(false);
  const [showPhotos, setShowPhotos] = useState(false);
  const [recalcStatus, setRecalcStatus] = useState(null);

  const recalcStats = async () => {
    setRecalcStatus('Recalculating...');
    try {
      const usersSnap = await getDocs(collection(db, 'users'));
      const fixed = [];
      for (const userDoc of usersSnap.docs) {
        const uid = userDoc.id;
        const entriesSnap = await getDocs(query(collection(db, 'entries'), where('userId', '==', uid)));
        const nonTest = entriesSnap.docs.filter(d => !d.data().isTest);
        let totalMeters = 0, totalTime = 0, totalCalories = 0;
        nonTest.forEach(e => { const d = e.data(); totalMeters += d.meters || 0; totalTime += d.time || 0; totalCalories += d.calories || 0; });
        const old = userDoc.data();
        if (old.totalMeters !== totalMeters || old.uploadCount !== nonTest.length) {
          await updateDoc(doc(db, 'users', uid), { totalMeters, uploadCount: nonTest.length, totalTime, totalCalories });
          fixed.push(`${old.name}: ${old.totalMeters}→${totalMeters}`);
        }
      }
      setRecalcStatus(fixed.length > 0 ? `Fixed: ${fixed.join(', ')}` : 'All stats correct');
      setTimeout(() => setRecalcStatus(null), 5000);
    } catch (e) {
      setRecalcStatus('Error: ' + e.message);
    }
  };

  const loadPhotos = async () => {
    setLoadingPhotos(true);
    try {
      // Get entries that have images (feedback images + entry images)
      const entriesSnap = await getDocs(
        query(collection(db, 'entries'), where('imageUrl', '!=', null), orderBy('imageUrl'), orderBy('createdAt', 'desc'), limit(50))
      );
      const feedbackSnap = await getDocs(
        query(collection(db, 'ai_feedback'), where('imageUrl', '!=', null), orderBy('imageUrl'), orderBy('createdAt', 'desc'), limit(50))
      );
      const photos = [];
      entriesSnap.docs.forEach(d => {
        const data = d.data();
        if (data.imageUrl) {
          photos.push({ id: d.id, type: 'entry', imageUrl: data.imageUrl, meters: data.meters, status: data.verificationStatus, userId: data.userId, date: data.date, isTest: data.isTest });
        }
      });
      feedbackSnap.docs.forEach(d => {
        const data = d.data();
        if (data.imageUrl) {
          photos.push({ id: d.id, type: 'feedback', imageUrl: data.imageUrl, userId: data.userId, aiMeters: data.aiExtracted?.meters, userMeters: data.userConfirmed?.meters, confidence: data.aiExtracted?.confidence });
        }
      });
      setPhotoEntries(photos);
    } catch (e) {
      console.error('Error loading photos:', e);
    }
    setLoadingPhotos(false);
  };

  if (!showAdminPanel || !isAdmin) return null;

  return (
    <div className="modal-overlay" onClick={() => setShowAdminPanel(false)}>
      <div className="modal admin-modal" onClick={(e) => e.stopPropagation()}>
        <button className="modal-close" onClick={() => setShowAdminPanel(false)}>✕</button>

        <h2><Icon name="ui_shield" size={20} /> Admin Panel</h2>

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

        {/* Recalc Stats */}
        <button className="admin-refresh-btn" onClick={recalcStats} style={{ marginBottom: '1rem' }}>
          <Icon name="ui_refresh" size={16} /> Recalc All Stats
        </button>
        {recalcStatus && <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginBottom: '0.75rem' }}>{recalcStatus}</p>}

        {/* Monthly Throwdowns */}
        <h3><Icon name="ui_fire" size={16} /> Monthly Throwdowns</h3>
        <div className="admin-throwdowns">
          {THROWDOWNS.map((t, i) => {
            const isCurrent = i === new Date().getMonth();
            return (
              <div key={i} className={`admin-throwdown-row ${isCurrent ? 'current' : ''}`}>
                <span className="admin-throwdown-month">{SHORT_MONTHS[i]}</span>
                <span className="admin-throwdown-label">{t.label}</span>
                <span className="admin-throwdown-target">{t.target.toLocaleString()}{t.unit}</span>
                {isCurrent && <span className="admin-throwdown-badge">Active</span>}
              </div>
            );
          })}
        </div>

        {/* Monthly Challenges */}
        <h3><Icon name="ui_trophy" size={16} /> Monthly Challenges</h3>
        <div className="admin-throwdowns">
          {MONTHLY_CHALLENGES.map((c, i) => {
            const isCurrent = i === new Date().getMonth();
            return (
              <div key={i} className={`admin-throwdown-row ${isCurrent ? 'current' : ''}`}>
                <span className="admin-throwdown-month">{SHORT_MONTHS[i]}</span>
                <span className="admin-throwdown-label">{c.label}</span>
                <span className="admin-throwdown-target">{c.description}</span>
                {isCurrent && <span className="admin-throwdown-badge">Active</span>}
              </div>
            );
          })}
        </div>

        <button
          className="admin-refresh-btn"
          style={{ marginBottom: '0.5rem' }}
          onClick={() => { setMonthlyRecapMonth({ month: new Date().getMonth(), year: new Date().getFullYear() }); setShowMonthlyRecap(true); setMonthlyRecapSlide(0); }}
        >
          <Icon name="ui_calendar" size={16} /> Preview Monthly Recap
        </button>

        <button className="admin-refresh-btn" onClick={loadPendingReviews}>
          <Icon name="ui_refresh" size={16} /> Refresh
        </button>

        <h3>Pending Reviews ({pendingReviews.length})</h3>

        {pendingReviews.length === 0 ? (
          <p className="admin-empty">No entries pending review <Icon name="ui_celebrate" size={16} /></p>
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
                  <p><strong>Claimed:</strong> {entry.meters?.toLocaleString()}m{entry.time ? ` • ${Math.floor(entry.time / 60)}:${String(Math.floor(entry.time % 60)).padStart(2, '0')}` : ''}{entry.calories ? ` • ${entry.calories} cal` : ''}</p>
                  <p><strong>Reason:</strong> {entry.verificationDetails?.reason}</p>
                  {entry.verificationDetails?.extractedMeters && (
                    <p><strong>AI Saw:</strong> {entry.verificationDetails.extractedMeters}m</p>
                  )}
                  {entry.verificationDetails?.confidence > 0 && (
                    <p><strong>Confidence:</strong> {entry.verificationDetails.confidence}%</p>
                  )}
                  {entry.verificationDetails?.flags?.length > 0 && (
                    <p><strong>Flags:</strong> {entry.verificationDetails.flags.join(', ')}</p>
                  )}
                  {entry.sessionType && entry.sessionType !== 'free_row' && (
                    <p><strong>Session:</strong> {entry.sessionType.replace('_', ' ')}</p>
                  )}
                  <p><strong>Date:</strong> {new Date(entry.date).toLocaleString()}</p>
                </div>

                {reviewingEntry === entry.id ? (
                  <div className="admin-review-actions-expanded">
                    <div className="admin-adjust-row">
                      <input
                        type="number"
                        placeholder="Meters"
                        value={adjustedMeters}
                        onChange={(e) => setAdjustedMeters(e.target.value)}
                        className="admin-input"
                      />
                      <input
                        type="text"
                        placeholder="Time (mm:ss)"
                        defaultValue={entry.time ? `${Math.floor(entry.time / 60)}:${String(Math.floor(entry.time % 60)).padStart(2, '0')}` : ''}
                        className="admin-input"
                        disabled
                      />
                      <input
                        type="number"
                        placeholder="Calories"
                        defaultValue={entry.calories || ''}
                        className="admin-input"
                        disabled
                      />
                    </div>
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
        {/* Photo Gallery */}
        <h3>
          <Icon name="ui_camera" size={16} /> Photos
          <button className="admin-refresh-btn" onClick={() => { setShowPhotos(true); loadPhotos(); }} style={{ marginLeft: 8, display: 'inline-flex' }}>
            {loadingPhotos ? 'Loading...' : showPhotos ? 'Refresh' : 'Load'}
          </button>
        </h3>

        {showPhotos && (
          photoEntries.length === 0 && !loadingPhotos ? (
            <p className="admin-empty">No photos found</p>
          ) : (
            <div className="admin-photo-grid">
              {photoEntries.map(photo => (
                <div
                  key={photo.id}
                  className={`admin-photo-card ${photo.isTest ? 'test' : ''}`}
                  onClick={() => setShowPhotoModal({ url: photo.imageUrl, entry: photo })}
                >
                  <img src={photo.imageUrl} alt="Row" loading="lazy" />
                  <div className="admin-photo-info">
                    <span className="admin-photo-user">{users[photo.userId]?.name?.split(' ')[0] || 'User'}</span>
                    {photo.type === 'entry' && (
                      <span className={`admin-photo-status ${photo.status}`}>
                        {photo.meters?.toLocaleString()}m • {photo.status}
                        {photo.isTest && ' (test)'}
                      </span>
                    )}
                    {photo.type === 'feedback' && (
                      <span className="admin-photo-status feedback">
                        AI: {photo.aiMeters || '?'}m → User: {photo.userMeters || '?'}m
                      </span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )
        )}
      </div>
    </div>
  );
}

export default AdminPanel;
