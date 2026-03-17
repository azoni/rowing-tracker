import React from 'react';
import { useApp } from '../context/AppContext';
import { formatMeters, formatTime, formatTimeDisplay } from '../utils';
import Icon from './Icon';

function ChallengeDetailModal() {
  const {
    showChallengeDetail, setShowChallengeDetail,
    getChallengeStatus, getChallengeProgress, getChallengeLeaderboard,
    currentUser,
    setShowTimeTrialModal, showTimeTrialModal,
    timeTrialTime, setTimeTrialTime,
    timeTrialImage, setTimeTrialImage,
    handleSubmitTimeTrial, isSubmittingTimeTrial,
    groupError,
    showSessionHistory, setShowSessionHistory,
    getUserSessionHistory, handleDeleteEntry, deletingEntryId,
  } = useApp();

  return (
    <>
      {/* Challenge Detail Modal */}
      {showChallengeDetail && (
        <div className="modal-overlay" onClick={() => setShowChallengeDetail(null)}>
          <div className="modal challenge-detail-modal" onClick={(e) => e.stopPropagation()}>
            <button className="modal-close" onClick={() => setShowChallengeDetail(null)}>✕</button>

            {(() => {
              const challenge = showChallengeDetail;
              const status = getChallengeStatus(challenge);
              const progress = getChallengeProgress(challenge);
              const leaderboard = getChallengeLeaderboard(challenge);

              return (
                <>
                  <div className="challenge-detail-header">
                    <span className="challenge-type-icon-lg">
                      {challenge.type === 'collective' && <Icon name="ui_target" size={24} />}
                      {challenge.type === 'collective_calories' && <Icon name="ui_bolt" size={24} />}
                      {challenge.type === 'time_trial' && <Icon name="ui_records" size={24} />}
                      {challenge.type === 'distance_race' && <Icon name="ui_streak" size={24} />}
                      {challenge.type === 'total_time' && <Icon name="ui_timer" size={24} />}
                      {challenge.type === 'calories' && <Icon name="ui_fire" size={24} />}
                      {challenge.type === 'streak' && <Icon name="ui_streak" size={24} />}
                      {challenge.type === 'sessions' && <Icon name="ui_calendar" size={24} />}
                    </span>
                    <div>
                      <h2>{challenge.name}</h2>
                      <span className={`challenge-status-badge ${status}`}>
                        {status === 'active' && <><Icon name="ui_check" size={14} /> Active</>}
                        {status === 'upcoming' && <><Icon name="ui_pending" size={14} /> Starts {new Date(challenge.startDate).toLocaleDateString()}</>}
                        {status === 'completed' && <><Icon name="ui_success" size={14} /> Completed</>}
                      </span>
                    </div>
                  </div>

                  <div className="challenge-detail-dates">
                    <Icon name="ui_calendar" size={16} /> {new Date(challenge.startDate).toLocaleDateString()} - {new Date(challenge.endDate).toLocaleDateString()}
                  </div>

                  {/* Collective Progress (meters or calories) */}
                  {(challenge.type === 'collective' || challenge.type === 'collective_calories') && progress && (
                    <div className="challenge-collective-progress">
                      <div className="collective-progress-visual">
                        <div
                          className="collective-progress-fill"
                          style={{ width: `${progress.percentage}%` }}
                        />
                      </div>
                      <div className="collective-progress-stats">
                        <div className="collective-current">
                          <span className="big-number">
                            {challenge.type === 'collective_calories'
                              ? progress.current.toLocaleString()
                              : formatMeters(progress.current)
                            }
                          </span>
                          <span>{challenge.type === 'collective_calories' ? 'calories burned' : 'rowed'}</span>
                        </div>
                        <div className="collective-target">
                          <span>of {challenge.type === 'collective_calories'
                            ? progress.target.toLocaleString() + ' cal'
                            : formatMeters(progress.target)
                          } goal</span>
                          <span className="percentage">{progress.percentage.toFixed(1)}%</span>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Time Trial - Submit Button */}
                  {challenge.type === 'time_trial' && status === 'active' && (
                    <div className="time-trial-submit-section">
                      <p><Icon name="ui_records" size={16} /> {challenge.targetDistance}m Time Trial</p>
                      {challenge.participants?.[currentUser?.uid] && (
                        <p className="your-best-time">
                          Your best: <strong>{formatTime(challenge.participants[currentUser.uid].bestTime)}</strong>
                          {challenge.participants[currentUser.uid].verified && <> <Icon name="ui_check" size={14} /></>}
                        </p>
                      )}
                      <button
                        className="submit-time-btn"
                        onClick={() => setShowTimeTrialModal(challenge)}
                      >
                        {challenge.participants?.[currentUser?.uid] ? 'Submit New Time' : 'Submit Time'}
                      </button>
                    </div>
                  )}

                  {/* Leaderboard */}
                  <div className="challenge-leaderboard">
                    <h3>
                      {challenge.type === 'time_trial' ? 'Best Times' : 'Leaderboard'}
                    </h3>
                    {leaderboard.length === 0 ? (
                      <p className="no-entries">No entries yet. Be the first!</p>
                    ) : (
                      <div className="challenge-leaderboard-list">
                        {leaderboard.map((entry, index) => (
                          <div
                            key={entry.userId || entry.user?.id}
                            className={`challenge-lb-item ${entry.userId === currentUser?.uid || entry.user?.id === currentUser?.uid ? 'is-you' : ''}`}
                          >
                            <span className="challenge-lb-rank">
                              {index === 0 ? <Icon name="ui_gold" size={20} /> : index === 1 ? <Icon name="ui_silver" size={20} /> : index === 2 ? <Icon name="ui_bronze" size={20} /> : index + 1}
                            </span>
                            <div className="challenge-lb-user">
                              {entry.user?.photoURL ? (
                                <img src={entry.user.photoURL} alt="" className="challenge-lb-avatar" />
                              ) : (
                                <div className="challenge-lb-avatar-placeholder">
                                  {entry.user?.name?.charAt(0) || '?'}
                                </div>
                              )}
                              <span>{entry.user?.name}</span>
                            </div>
                            <span className="challenge-lb-value">
                              {challenge.type === 'time_trial' && formatTime(entry.time)}
                              {challenge.type === 'time_trial' && entry.verified && <> <Icon name="ui_check" size={14} /></>}
                              {(challenge.type === 'distance_race' || challenge.type === 'collective') && formatMeters(entry.totalMeters)}
                              {challenge.type === 'total_time' && formatTimeDisplay(entry.totalTime)}
                              {(challenge.type === 'calories' || challenge.type === 'collective_calories') && `${entry.totalCalories.toLocaleString()} cal`}
                              {challenge.type === 'streak' && `${entry.bestStreak} days`}
                              {challenge.type === 'sessions' && `${entry.sessionCount} sessions`}
                            </span>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </>
              );
            })()}
          </div>
        </div>
      )}

      {/* Time Trial Submission Modal */}
      {showTimeTrialModal && (
        <div className="modal-overlay" onClick={() => setShowTimeTrialModal(null)}>
          <div className="modal time-trial-modal" onClick={(e) => e.stopPropagation()}>
            <button className="modal-close" onClick={() => setShowTimeTrialModal(null)}>✕</button>

            <h2>Submit {showTimeTrialModal.targetDistance}m Time</h2>
            <p>Enter your time for the {showTimeTrialModal.name}</p>

            <div className="form-group">
              <label>Your Time</label>
              <input
                type="text"
                placeholder="e.g., 1:45.3 or 105.3"
                value={timeTrialTime}
                onChange={(e) => setTimeTrialTime(e.target.value)}
                className="time-input"
              />
              <small className="form-hint">Format: M:SS.s or just seconds</small>
            </div>

            <div className="form-group">
              <label>Photo (optional - for verification)</label>
              <label className="photo-upload-btn">
                <input
                  type="file"
                  accept="image/*"
                  capture="environment"
                  onChange={(e) => {
                    const file = e.target.files[0];
                    if (file) {
                      const reader = new FileReader();
                      reader.onload = (ev) => setTimeTrialImage(ev.target.result);
                      reader.readAsDataURL(file);
                    }
                  }}
                />
                <Icon name="ui_camera" size={16} /> {timeTrialImage ? <>Photo Added <Icon name="ui_check" size={14} /></> : 'Add Photo'}
              </label>
              {!timeTrialImage && (
                <small className="form-hint">Times without photos are marked unverified</small>
              )}
            </div>

            {groupError && <div className="form-error">{groupError}</div>}

            <button
              className="primary-btn"
              onClick={handleSubmitTimeTrial}
              disabled={!timeTrialTime || isSubmittingTimeTrial}
            >
              {isSubmittingTimeTrial ? 'Submitting...' : 'Submit Time'}
            </button>
          </div>
        </div>
      )}

      {/* Session History Modal */}
      {showSessionHistory && currentUser && (
        <div className="modal-overlay" onClick={() => setShowSessionHistory(false)}>
          <div className="modal session-history-modal" onClick={(e) => e.stopPropagation()}>
            <button className="modal-close" onClick={() => setShowSessionHistory(false)}>✕</button>

            <h2><Icon name="ui_history" size={20} /> Session History</h2>

            {(() => {
              const sessions = getUserSessionHistory(currentUser.uid);

              if (sessions.length === 0) {
                return <div className="empty-state"><p>No sessions yet!</p></div>;
              }

              return (
                <div className="session-list">
                  {sessions.map((session, index) => {
                    const date = new Date(session.date);
                    return (
                      <div key={session.id || index} className="session-item">
                        <div className="session-date">
                          <span className="session-day">{date.toLocaleDateString('en-US', { weekday: 'short' })}</span>
                          <span className="session-full-date">{date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}</span>
                        </div>
                        <div className="session-meters">
                          <span className="session-meters-value">{session.meters.toLocaleString()}m</span>
                          {session.verificationStatus === 'verified' && <span className="session-verified"><Icon name="ui_check" size={14} /></span>}
                          {session.verificationStatus === 'pending_review' && <span className="session-pending"><Icon name="ui_pending" size={14} /></span>}
                          {(session.verificationStatus === 'unverified' || !session.verificationStatus) && <span className="session-unverified"><Icon name="ui_unverified" size={14} /></span>}
                        </div>
                        <button
                          className="session-delete-btn"
                          onClick={() => handleDeleteEntry(session.id, session.meters)}
                          disabled={deletingEntryId === session.id}
                          title="Delete entry"
                        >
                          {deletingEntryId === session.id ? '...' : '🗑️'}
                        </button>
                      </div>
                    );
                  })}
                </div>
              );
            })()}
          </div>
        </div>
      )}
    </>
  );
}

export default ChallengeDetailModal;
