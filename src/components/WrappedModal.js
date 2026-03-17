import React from 'react';
import html2canvas from 'html2canvas';
import { useApp } from '../context/AppContext';
import { formatMeters } from '../utils';
import Icon from './Icon';
// constants imported via context

function WrappedModal() {
  const {
    showWrapped, setShowWrapped,
    currentUser, userProfile,
    getWrappedStats,
    wrappedSlide, setWrappedSlide,
    wrappedCardRef, showToast,
  } = useApp();

  if (!showWrapped || !currentUser) return null;

  const stats = getWrappedStats(currentUser.uid);
  if (!stats) return null;

  // Different slides for users with no data
  const noDataSlides = [
    {
      type: 'intro',
      background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
      content: (
        <div className="wrapped-slide-content intro">
          <div className="wrapped-year">2025</div>
          <div className="wrapped-logo"><Icon name="ui_rowing" size={20} /> ROW CREW</div>
          <h1>Your Year Awaits!</h1>
          <p>Let's make it count...</p>
          <div className="wrapped-tap-hint">Tap to continue →</div>
        </div>
      )
    },
    {
      type: 'no-data',
      background: 'linear-gradient(135deg, #11998e 0%, #38ef7d 100%)',
      content: (
        <div className="wrapped-slide-content">
          <div className="wrapped-big-text"><Icon name="ui_rowing" size={20} /></div>
          <h2 style={{ marginTop: '1rem' }}>Your rowing journey starts now!</h2>
          <div className="wrapped-fun-fact">
            Log your first row and start building your 2025 story
          </div>
        </div>
      )
    },
    {
      type: 'cta',
      background: 'linear-gradient(135deg, #0a0e17 0%, #1a1f2e 100%)',
      content: (
        <div className="wrapped-slide-content summary">
          <div className="wrapped-summary-header">
            <span><Icon name="ui_rowing" size={20} /></span> ROW CREW 2025
          </div>
          <div className="wrapped-summary-name">{userProfile?.name}</div>
          <div style={{ padding: '2rem 0', fontSize: '1.1rem', color: 'var(--text-secondary)' }}>
            Your story is waiting to be written.<br/>Start rowing today!
          </div>
          <div className="wrapped-summary-rank">
            <Icon name={stats.currentRank.emoji} size={32} /> {stats.currentRank.title}
          </div>
          <div className="wrapped-summary-footer">
            rowcrew.netlify.app
          </div>
        </div>
      )
    }
  ];

  const slides = stats.hasData ? [
    // Slide 0: Intro
    {
      type: 'intro',
      background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
      content: (
        <div className="wrapped-slide-content intro">
          <div className="wrapped-year">2025</div>
          <div className="wrapped-logo"><Icon name="ui_rowing" size={20} /> ROW CREW</div>
          <h1>Your Year in Rowing</h1>
          <p>Let's see what you accomplished...</p>
          <div className="wrapped-tap-hint">Tap to continue →</div>
        </div>
      )
    },
    // Slide 1: Total Meters
    {
      type: 'meters',
      background: 'linear-gradient(135deg, #11998e 0%, #38ef7d 100%)',
      content: (
        <div className="wrapped-slide-content">
          <div className="wrapped-small-label">This year, you rowed</div>
          <div className="wrapped-big-number">{stats.totalMeters.toLocaleString()}</div>
          <div className="wrapped-unit">meters</div>
          <div className="wrapped-fun-fact">
            That's {stats.bridgeCrossings} trips across the Golden Gate Bridge! <Icon name="milestone_bridge" size={16} />
          </div>
        </div>
      )
    },
    // Slide 2: Sessions
    {
      type: 'sessions',
      background: 'linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)',
      content: (
        <div className="wrapped-slide-content">
          <div className="wrapped-small-label">You showed up</div>
          <div className="wrapped-big-number">{stats.sessionCount}</div>
          <div className="wrapped-unit">times</div>
          <div className="wrapped-fun-fact">
            That's {stats.daysRowed} unique days on the rower! <Icon name="ui_fire" size={16} />
          </div>
        </div>
      )
    },
    // Slide 3: Best Day
    {
      type: 'favorite-day',
      background: 'linear-gradient(135deg, #fa709a 0%, #fee140 100%)',
      content: (
        <div className="wrapped-slide-content">
          <div className="wrapped-small-label">Your favorite day to row was</div>
          <div className="wrapped-big-text">{stats.favoriteDay}</div>
          <div className="wrapped-fun-fact">
            You rowed on {stats.favoriteDay}s {stats.favoriteDayCount} times!
          </div>
        </div>
      )
    },
    // Slide 4: Best Month
    {
      type: 'best-month',
      background: 'linear-gradient(135deg, #a8edea 0%, #fed6e3 100%)',
      content: (
        <div className="wrapped-slide-content dark-text">
          <div className="wrapped-small-label">Your most active month was</div>
          <div className="wrapped-big-text">{stats.bestMonth}</div>
          <div className="wrapped-fun-fact">
            You crushed {stats.bestMonthMeters.toLocaleString()}m that month!
          </div>
        </div>
      )
    },
    // Slide 5: Beast Mode (Best Row)
    {
      type: 'beast-mode',
      background: 'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)',
      content: (
        <div className="wrapped-slide-content">
          <div className="wrapped-small-label">Your beast mode moment <Icon name="ui_trophy" size={20} /></div>
          <div className="wrapped-big-number">{stats.bestRow.toLocaleString()}</div>
          <div className="wrapped-unit">meters in one session</div>
          {stats.bestRowDate && (
            <div className="wrapped-fun-fact">
              On {stats.bestRowDate.toLocaleDateString('en-US', { month: 'long', day: 'numeric' })}
            </div>
          )}
        </div>
      )
    },
    // Slide 6: Best Streak
    {
      type: 'streak',
      background: 'linear-gradient(135deg, #ff9a9e 0%, #fecfef 100%)',
      content: (
        <div className="wrapped-slide-content dark-text">
          <div className="wrapped-small-label">Your longest streak</div>
          <div className="wrapped-big-number">{stats.bestStreak}</div>
          <div className="wrapped-unit">days in a row <Icon name="ui_fire" size={16} /></div>
          <div className="wrapped-fun-fact">
            Consistency is key!
          </div>
        </div>
      )
    },
    // Slide 7: Rank Journey (if improved)
    ...(stats.rankImproved ? [{
      type: 'rank',
      background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
      content: (
        <div className="wrapped-slide-content">
          <div className="wrapped-small-label">You leveled up!</div>
          <div className="wrapped-rank-journey">
            <div className="wrapped-rank-from">
              <span className="wrapped-rank-emoji"><Icon name={stats.startRank.emoji} size={32} /></span>
              <span>{stats.startRank.title}</span>
            </div>
            <div className="wrapped-rank-arrow">→</div>
            <div className="wrapped-rank-to">
              <span className="wrapped-rank-emoji"><Icon name={stats.currentRank.emoji} size={32} /></span>
              <span>{stats.currentRank.title}</span>
            </div>
          </div>
        </div>
      )
    }] : []),
    // Slide 8: Achievements
    ...(stats.achievementsUnlocked.length > 0 ? [{
      type: 'achievements',
      background: 'linear-gradient(135deg, #ffecd2 0%, #fcb69f 100%)',
      content: (
        <div className="wrapped-slide-content dark-text">
          <div className="wrapped-small-label">You unlocked</div>
          <div className="wrapped-big-number">{stats.achievementsUnlocked.length}</div>
          <div className="wrapped-unit">achievements</div>
          <div className="wrapped-badges">
            {stats.achievementsUnlocked.slice(0, 6).map((a, i) => (
              <span key={i} className="wrapped-badge"><Icon name={a.emoji} size={20} /></span>
            ))}
          </div>
        </div>
      )
    }] : []),
    // Slide 9: Top Percentage
    {
      type: 'top-percent',
      background: 'linear-gradient(135deg, #0f0c29 0%, #302b63 50%, #24243e 100%)',
      content: (
        <div className="wrapped-slide-content">
          <div className="wrapped-small-label">You're in the</div>
          <div className="wrapped-big-number">Top {stats.topPercentage}%</div>
          <div className="wrapped-unit">of all Row Crew rowers</div>
          <div className="wrapped-fun-fact">
            {stats.topPercentage <= 10 ? <>Elite status! <Icon name="ui_crown" size={16} /></> :
             stats.topPercentage <= 25 ? <>Outstanding! <Icon name="ui_star" size={16} /></> :
             stats.topPercentage <= 50 ? <>Great work! <Icon name="ui_fire" size={16} /></> : <>Keep rowing! <Icon name="ui_rowing" size={16} /></>}
          </div>
        </div>
      )
    },
    // Slide 10: Summary (shareable)
    {
      type: 'summary',
      background: 'linear-gradient(135deg, #0a0e17 0%, #1a1f2e 100%)',
      content: (
        <div className="wrapped-slide-content summary" ref={wrappedCardRef}>
          <div className="wrapped-summary-header">
            <span><Icon name="ui_rowing" size={20} /></span> ROW CREW 2025
          </div>
          <div className="wrapped-summary-name">{userProfile?.name}</div>
          <div className="wrapped-summary-stats">
            <div className="wrapped-summary-stat">
              <span className="wrapped-summary-value">{formatMeters(stats.totalMeters)}</span>
              <span className="wrapped-summary-label">meters</span>
            </div>
            <div className="wrapped-summary-stat">
              <span className="wrapped-summary-value">{stats.sessionCount}</span>
              <span className="wrapped-summary-label">sessions</span>
            </div>
            <div className="wrapped-summary-stat">
              <span className="wrapped-summary-value">{stats.bestStreak}</span>
              <span className="wrapped-summary-label">day streak</span>
            </div>
          </div>
          <div className="wrapped-summary-rank">
            <Icon name={stats.currentRank.emoji} size={32} /> {stats.currentRank.title}
          </div>
          <div className="wrapped-summary-footer">
            rowcrew.netlify.app
          </div>
        </div>
      )
    }
  ] : noDataSlides;

  const currentSlideData = slides[wrappedSlide];
  const isLastSlide = wrappedSlide === slides.length - 1;

  const handleSlideClick = (e) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const isLeftSide = x < rect.width / 3;

    if (isLeftSide && wrappedSlide > 0) {
      setWrappedSlide(prev => prev - 1);
    } else if (!isLeftSide && wrappedSlide < slides.length - 1) {
      setWrappedSlide(prev => prev + 1);
    }
  };

  const handleShareWrapped = async () => {
    if (!wrappedCardRef.current) return;

    try {
      const canvas = await html2canvas(wrappedCardRef.current, {
        backgroundColor: '#0a0e17',
        scale: 2,
      });

      const blob = await new Promise(resolve => canvas.toBlob(resolve, 'image/png'));
      const file = new File([blob], 'row-crew-wrapped-2025.png', { type: 'image/png' });

      if (navigator.share && navigator.canShare({ files: [file] })) {
        await navigator.share({
          files: [file],
          title: 'My Row Crew 2025 Wrapped',
          text: `🚣 My 2025 Row Crew Wrapped! I rowed ${stats.totalMeters.toLocaleString()}m this year!`,
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
            className={`wrapped-progress-bar ${i <= wrappedSlide ? 'active' : ''} ${i === wrappedSlide ? 'current' : ''}`}
          />
        ))}
      </div>

      {/* Close button */}
      <button
        className="wrapped-close"
        onClick={(e) => { e.stopPropagation(); setShowWrapped(false); setWrappedSlide(0); }}
      >
        ✕
      </button>

      {/* Slide content */}
      <div className={`wrapped-slide wrapped-slide-${currentSlideData.type}`}>
        {currentSlideData.content}
      </div>

      {/* Navigation hint */}
      <div className="wrapped-nav-hint">
        {wrappedSlide > 0 && <span className="nav-left">‹</span>}
        <span className="nav-dots">
          {wrappedSlide + 1} / {slides.length}
        </span>
        {!isLastSlide && <span className="nav-right">›</span>}
      </div>

      {/* Share button on last slide */}
      {isLastSlide && (
        <div className="wrapped-share-actions" onClick={(e) => e.stopPropagation()}>
          <button className="wrapped-share-btn" onClick={handleShareWrapped}>
            <Icon name="ui_share" size={16} /> Share Your Wrapped
          </button>
          <button
            className="wrapped-done-btn"
            onClick={() => { setShowWrapped(false); setWrappedSlide(0); }}
          >
            Done
          </button>
        </div>
      )}
    </div>
  );
}

export default WrappedModal;
