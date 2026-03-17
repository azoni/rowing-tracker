import React from 'react';
import Icon from './Icon';
import { useApp } from '../context/AppContext';

const MONTH_NAMES = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
const THROWDOWNS = [
  { label: 'Row 50K', target: '50,000m' },
  { label: '14-Day Streak', target: '14 days' },
  { label: '20 Sessions', target: '20 sessions' },
  { label: 'Row 75K', target: '75,000m' },
  { label: 'Burn 10K Cal', target: '10,000 cal' },
  { label: 'Row 100K', target: '100,000m' },
  { label: '25 Sessions', target: '25 sessions' },
  { label: '21-Day Streak', target: '21 days' },
  { label: 'Row 60K', target: '60,000m' },
  { label: 'Burn 15K Cal', target: '15,000 cal' },
  { label: '22 Sessions', target: '22 sessions' },
  { label: 'Row 80K', target: '80,000m' },
];

function AdminPanel() {
  const {
    showAdminPanel, setShowAdminPanel,
    isAdmin, adminStats,
    pendingReviews, loadPendingReviews,
    reviewingEntry, setReviewingEntry,
    adjustedMeters, setAdjustedMeters,
    reviewNote, setReviewNote,
    handleReviewEntry, setShowPhotoModal,
  } = useApp();

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

        {/* Monthly Throwdowns */}
        <h3><Icon name="ui_fire" size={16} /> Monthly Throwdowns</h3>
        <div className="admin-throwdowns">
          {THROWDOWNS.map((t, i) => {
            const isCurrent = i === new Date().getMonth();
            return (
              <div key={i} className={`admin-throwdown-row ${isCurrent ? 'current' : ''}`}>
                <span className="admin-throwdown-month">{MONTH_NAMES[i]}</span>
                <span className="admin-throwdown-label">{t.label}</span>
                <span className="admin-throwdown-target">{t.target}</span>
                {isCurrent && <span className="admin-throwdown-badge">Active</span>}
              </div>
            );
          })}
        </div>

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
  );
}

export default AdminPanel;
