import React from 'react';
import html2canvas from 'html2canvas';
import { useApp } from '../context/AppContext';
import { formatMeters } from '../utils';
import Icon from './Icon';

function MonthlyRecapModal() {
  const {
    showMonthlyRecap, setShowMonthlyRecap,
    monthlyRecapSlide, setMonthlyRecapSlide,
    monthlyRecapCardRef,
    currentUser, userProfile,
    getMonthlyRecapStats, showToast,
  } = useApp();

  if (!showMonthlyRecap || !currentUser) return null;

  // Determine which month to recap (previous month)
  const now = new Date();
  const currentMonth = now.getMonth();
  const currentYear = now.getFullYear();
  const recapMonth = currentMonth === 0 ? 11 : currentMonth - 1;
  const recapYear = currentMonth === 0 ? currentYear - 1 : currentYear;
  const recapKey = `monthlyRecap_seen_${recapYear}_${String(recapMonth).padStart(2, '0')}`;

  const stats = getMonthlyRecapStats(currentUser.uid, recapMonth, recapYear);
  if (!stats) return null;

  const handleClose = () => {
    localStorage.setItem(recapKey, 'true');
    setShowMonthlyRecap(false);
    setMonthlyRecapSlide(0);
  };

  // No-data slides (user didn't row that month)
  const noDataSlides = [
    {
      type: 'intro',
      background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
      content: (
        <div className="recap-slide-content intro">
          <div className="recap-month-label">{stats.monthName} {stats.year}</div>
          <div className="recap-logo"><Icon name="ui_rowing" size={20} /> ROW CREW</div>
          <h1>Monthly Recap</h1>
          <p>Let's see how last month went...</p>
          <div className="recap-tap-hint">Tap to continue →</div>
        </div>
      )
    },
    {
      type: 'no-data',
      background: 'linear-gradient(135deg, #0a0e17 0%, #1a1f2e 100%)',
      content: (
        <div className="recap-slide-content">
          <div className="recap-big-text"><Icon name="ui_rowing" size={24} /></div>
          <h2 style={{ marginTop: '1rem' }}>You took a break in {stats.monthName}</h2>
          <div className="recap-fun-fact" style={{ marginBottom: '2rem' }}>The rower awaits!</div>
          <div className="recap-whats-next">
            <h3><Icon name="ui_fire" size={16} /> {stats.nextMonthName} Throwdown</h3>
            <div className="recap-next-label">{stats.nextThrowdown.label}</div>
            <div className="recap-next-target">Target: {stats.nextThrowdown.target.toLocaleString()}{stats.nextThrowdown.unit}</div>
            <h3 style={{ marginTop: '1rem' }}><Icon name="ui_trophy" size={16} /> {stats.nextMonthName} Challenge</h3>
            <div className="recap-next-label">{stats.nextChallenge.label}</div>
            <div className="recap-next-desc">{stats.nextChallenge.description}</div>
          </div>
        </div>
      )
    }
  ];

  // Full slides for users with data
  const slides = stats.hasData ? [
    // Slide 0: Intro
    {
      type: 'intro',
      background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
      content: (
        <div className="recap-slide-content intro">
          <div className="recap-month-label">{stats.monthName} {stats.year}</div>
          <div className="recap-logo"><Icon name="ui_rowing" size={20} /> ROW CREW</div>
          <h1>Monthly Recap</h1>
          <p>Let's see how you did...</p>
          <div className="recap-tap-hint">Tap to continue →</div>
        </div>
      )
    },
    // Slide 1: Throwdown Result
    {
      type: 'throwdown',
      background: stats.throwdownComplete
        ? 'linear-gradient(135deg, #11998e 0%, #38ef7d 100%)'
        : 'linear-gradient(135deg, #ff6b6b 0%, #ffa07a 100%)',
      content: (
        <div className="recap-slide-content">
          <div className="recap-small-label"><Icon name="ui_fire" size={16} /> {stats.monthName} Throwdown</div>
          <div className="recap-big-text">{stats.throwdown.label}</div>
          {stats.throwdownComplete ? (
            <div className="recap-throwdown-result complete">
              <Icon name="ui_check" size={20} /> Completed!
            </div>
          ) : (
            <div className="recap-throwdown-result">
              {Math.round(stats.throwdownPct)}% Complete
            </div>
          )}
          <div className="recap-throwdown-bar">
            <div className="recap-throwdown-fill" style={{ width: `${stats.throwdownPct}%` }} />
          </div>
          <div className="recap-throwdown-progress">
            {stats.throwdown.field === 'meters' ? formatMeters(stats.throwdownCurrent) : stats.throwdownCurrent.toLocaleString()}{stats.throwdown.unit} / {stats.throwdown.field === 'meters' ? formatMeters(stats.throwdown.target) : stats.throwdown.target.toLocaleString()}{stats.throwdown.unit}
          </div>
        </div>
      )
    },
    // Slide 2: Challenge Final Standings
    {
      type: 'challenge',
      background: 'linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)',
      content: (
        <div className="recap-slide-content">
          <div className="recap-small-label"><Icon name="ui_trophy" size={16} /> {stats.monthName} Challenge</div>
          <div className="recap-big-text">{stats.challenge.label}</div>
          {stats.challengeLeaderboard.length > 0 ? (
            <div className="recap-leaderboard">
              {stats.challengeLeaderboard.map((entry, i) => (
                <div key={entry.userId} className={`recap-leader ${entry.userId === currentUser.uid ? 'is-you' : ''}`}>
                  <span className="recap-leader-rank">
                    {i === 0 ? <Icon name="ui_gold" size={16} /> : i === 1 ? <Icon name="ui_silver" size={16} /> : <Icon name="ui_bronze" size={16} />}
                  </span>
                  <span className="recap-leader-name">{entry.user?.name?.split(' ')[0] || 'User'}</span>
                  <span className="recap-leader-score">{entry.display}</span>
                </div>
              ))}
            </div>
          ) : (
            <div className="recap-fun-fact">No one competed this month</div>
          )}
          {stats.userChallengeRank && stats.userChallengeRank > 3 && (
            <div className="recap-your-rank">Your rank: #{stats.userChallengeRank} — {stats.userChallengeScore?.display}</div>
          )}
          {!stats.userChallengeScore && (
            <div className="recap-your-rank muted">You didn't enter this one — next month!</div>
          )}
        </div>
      )
    },
    // Slide 3: Personal Stats
    {
      type: 'stats',
      background: 'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)',
      content: (
        <div className="recap-slide-content">
          <div className="recap-small-label">Your {stats.monthName}</div>
          <div className="recap-stats-grid">
            <div className="recap-stat">
              <span className="recap-stat-value">{formatMeters(stats.totalMeters)}</span>
              <span className="recap-stat-label">meters</span>
            </div>
            <div className="recap-stat">
              <span className="recap-stat-value">{stats.sessionCount}</span>
              <span className="recap-stat-label">sessions</span>
            </div>
            <div className="recap-stat">
              <span className="recap-stat-value">{stats.uniqueDaysRowed}</span>
              <span className="recap-stat-label">days rowed</span>
            </div>
            <div className="recap-stat">
              <span className="recap-stat-value">{formatMeters(stats.bestSingleRow)}</span>
              <span className="recap-stat-label">best row</span>
            </div>
            <div className="recap-stat">
              <span className="recap-stat-value">{stats.bestStreak}</span>
              <span className="recap-stat-label">day streak</span>
            </div>
            <div className="recap-stat">
              <span className="recap-stat-value">{formatMeters(stats.avgMetersPerSession)}</span>
              <span className="recap-stat-label">avg/session</span>
            </div>
          </div>
        </div>
      )
    },
    // Slide 4: Month-over-Month Comparison
    {
      type: 'comparison',
      background: 'linear-gradient(135deg, #a8edea 0%, #fed6e3 100%)',
      content: (
        <div className="recap-slide-content dark-text">
          {stats.comparison ? (
            <>
              <div className="recap-small-label">vs {stats.comparison.prevMonthName}</div>
              <div className="recap-comparison">
                <div className="recap-comparison-row">
                  <span className="recap-comparison-label">Meters</span>
                  <span className={`recap-comparison-delta ${stats.comparison.metersDelta >= 0 ? 'up' : 'down'}`}>
                    {stats.comparison.metersDelta >= 0 ? '↑' : '↓'} {Math.abs(stats.comparison.metersDeltaPct)}%
                  </span>
                  <span className="recap-comparison-detail">
                    {formatMeters(stats.comparison.prevMeters)} → {formatMeters(stats.totalMeters)}
                  </span>
                </div>
                <div className="recap-comparison-row">
                  <span className="recap-comparison-label">Sessions</span>
                  <span className={`recap-comparison-delta ${stats.comparison.sessionsDelta >= 0 ? 'up' : 'down'}`}>
                    {stats.comparison.sessionsDelta >= 0 ? '↑' : '↓'} {Math.abs(stats.comparison.sessionsDeltaPct)}%
                  </span>
                  <span className="recap-comparison-detail">
                    {stats.comparison.prevSessions} → {stats.sessionCount}
                  </span>
                </div>
              </div>
            </>
          ) : (
            <>
              <div className="recap-small-label">Your first month!</div>
              <div className="recap-big-text"><Icon name="ui_fire" size={24} /></div>
              <div className="recap-fun-fact">
                Nothing to compare yet — let's build from here!
              </div>
            </>
          )}
        </div>
      )
    },
    // Slide 5: What's Next (shareable summary)
    {
      type: 'whats-next',
      background: 'linear-gradient(135deg, #0a0e17 0%, #1a1f2e 100%)',
      content: (
        <div className="recap-slide-content summary" ref={monthlyRecapCardRef}>
          <div className="recap-summary-header">
            <span><Icon name="ui_rowing" size={20} /></span> {stats.monthName.toUpperCase()} RECAP
          </div>
          <div className="recap-summary-name">{userProfile?.name}</div>
          <div className="recap-summary-stats">
            <div className="recap-summary-stat">
              <span className="recap-summary-value">{formatMeters(stats.totalMeters)}</span>
              <span className="recap-summary-label">meters</span>
            </div>
            <div className="recap-summary-stat">
              <span className="recap-summary-value">{stats.sessionCount}</span>
              <span className="recap-summary-label">sessions</span>
            </div>
            <div className="recap-summary-stat">
              <span className="recap-summary-value">{stats.bestStreak}</span>
              <span className="recap-summary-label">day streak</span>
            </div>
          </div>
          <div className="recap-whats-next">
            <h3><Icon name="ui_fire" size={16} /> {stats.nextMonthName} Throwdown</h3>
            <div className="recap-next-label">{stats.nextThrowdown.label}</div>
            <div className="recap-next-target">Target: {stats.nextThrowdown.target.toLocaleString()}{stats.nextThrowdown.unit}</div>
            <h3 style={{ marginTop: '0.75rem' }}><Icon name="ui_trophy" size={16} /> {stats.nextMonthName} Challenge</h3>
            <div className="recap-next-label">{stats.nextChallenge.label}</div>
            <div className="recap-next-desc">{stats.nextChallenge.description}</div>
          </div>
          <div className="recap-summary-footer">rowcrew.netlify.app</div>
        </div>
      )
    }
  ] : noDataSlides;

  const currentSlideData = slides[monthlyRecapSlide];
  const isLastSlide = monthlyRecapSlide === slides.length - 1;

  const handleSlideClick = (e) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const isLeftSide = x < rect.width / 3;

    if (isLeftSide && monthlyRecapSlide > 0) {
      setMonthlyRecapSlide(prev => prev - 1);
    } else if (!isLeftSide && monthlyRecapSlide < slides.length - 1) {
      setMonthlyRecapSlide(prev => prev + 1);
    }
  };

  const handleShare = async () => {
    if (!monthlyRecapCardRef.current) return;
    try {
      const canvas = await html2canvas(monthlyRecapCardRef.current, {
        backgroundColor: '#0a0e17',
        scale: 2,
      });
      const blob = await new Promise(resolve => canvas.toBlob(resolve, 'image/png'));
      const file = new File([blob], `row-crew-recap-${stats.monthName.toLowerCase()}-${stats.year}.png`, { type: 'image/png' });
      if (navigator.share && navigator.canShare({ files: [file] })) {
        await navigator.share({
          files: [file],
          title: `My Row Crew ${stats.monthName} Recap`,
          text: `My ${stats.monthName} Row Crew Recap! I rowed ${stats.totalMeters.toLocaleString()}m this month!`,
        });
      } else if (navigator.clipboard?.write) {
        await navigator.clipboard.write([new ClipboardItem({ 'image/png': blob })]);
        showToast('Copied to clipboard!', 'success', 2000);
      }
    } catch (err) {
      console.error('Share failed:', err);
    }
  };

  return (
    <div
      className="wrapped-overlay"
      onClick={handleSlideClick}
      style={{ background: currentSlideData.background }}
    >
      {/* Progress bar */}
      <div className="wrapped-progress">
        {slides.map((_, i) => (
          <div
            key={i}
            className={`wrapped-progress-bar ${i <= monthlyRecapSlide ? 'active' : ''} ${i === monthlyRecapSlide ? 'current' : ''}`}
          />
        ))}
      </div>

      {/* Close button */}
      <button
        className="wrapped-close"
        onClick={(e) => { e.stopPropagation(); handleClose(); }}
      >
        ✕
      </button>

      {/* Slide content */}
      <div className={`wrapped-slide wrapped-slide-${currentSlideData.type}`}>
        {currentSlideData.content}
      </div>

      {/* Navigation hint */}
      <div className="wrapped-nav-hint">
        {monthlyRecapSlide > 0 && <span className="nav-left">‹</span>}
        <span className="nav-dots">
          {monthlyRecapSlide + 1} / {slides.length}
        </span>
        {!isLastSlide && <span className="nav-right">›</span>}
      </div>

      {/* Share button on last slide */}
      {isLastSlide && (
        <div className="wrapped-share-actions" onClick={(e) => e.stopPropagation()}>
          <button className="wrapped-share-btn" onClick={handleShare}>
            <Icon name="ui_share" size={16} /> Share Recap
          </button>
          <button className="wrapped-done-btn" onClick={handleClose}>
            Done
          </button>
        </div>
      )}
    </div>
  );
}

export default MonthlyRecapModal;
