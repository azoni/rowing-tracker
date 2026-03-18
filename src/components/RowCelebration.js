import React, { useEffect, useState } from 'react';
import Icon from './Icon';

function RowCelebration({ meters, onComplete }) {
  const [count, setCount] = useState(0);
  const [phase, setPhase] = useState('rowing'); // rowing → complete

  // Animate the meters counter
  useEffect(() => {
    if (!meters) return;
    const duration = 2000;
    const steps = 30;
    const increment = meters / steps;
    let current = 0;
    let step = 0;
    const interval = setInterval(() => {
      step++;
      current = Math.min(Math.round(increment * step), meters);
      setCount(current);
      if (step >= steps) {
        clearInterval(interval);
        setPhase('complete');
        setTimeout(() => onComplete?.(), 1500);
      }
    }, duration / steps);
    return () => clearInterval(interval);
  }, [meters, onComplete]);

  return (
    <div className={`row-celebration ${phase}`} onClick={() => phase === 'complete' && onComplete?.()}>
      {/* Sky gradient */}
      <div className="rc-sky" />

      {/* Scene */}
      <svg className="rc-scene" viewBox="0 0 400 200" preserveAspectRatio="xMidYMid slice">
        {/* Water */}
        <rect x="0" y="100" width="400" height="100" className="rc-water-bg" />

        {/* Waves - back layer */}
        <path className="rc-wave rc-wave-1" d="M-400,130 C-350,120 -300,140 -250,130 C-200,120 -150,140 -100,130 C-50,120 0,140 50,130 C100,120 150,140 200,130 C250,120 300,140 350,130 C400,120 450,140 500,130 C550,120 600,140 650,130 C700,120 750,140 800,130 L800,200 L-400,200 Z" />

        {/* Waves - front layer */}
        <path className="rc-wave rc-wave-2" d="M-400,140 C-350,135 -300,150 -250,140 C-200,135 -150,150 -100,140 C-50,135 0,150 50,140 C100,135 150,150 200,140 C250,135 300,150 350,140 C400,135 450,150 500,140 C550,135 600,150 650,140 C700,135 750,150 800,140 L800,200 L-400,200 Z" />

        {/* Wake trail */}
        <g className="rc-wake">
          <ellipse cx="155" cy="132" rx="20" ry="3" className="rc-wake-1" />
          <ellipse cx="140" cy="135" rx="15" ry="2" className="rc-wake-2" />
          <ellipse cx="125" cy="133" rx="10" ry="2" className="rc-wake-3" />
        </g>

        {/* Boat hull */}
        <g className="rc-boat">
          <path d="M170,125 L210,125 L205,135 L165,135 Z" className="rc-hull" />
          {/* Rower body */}
          <circle cx="190" cy="118" r="5" className="rc-rower-head" />
          <line x1="190" y1="123" x2="190" y2="115" className="rc-rower-body" />
          {/* Oar left */}
          <line x1="180" y1="126" x2="160" y2="118" className="rc-oar rc-oar-left" />
          {/* Oar right */}
          <line x1="200" y1="126" x2="220" y2="118" className="rc-oar rc-oar-right" />
        </g>

        {/* Splash particles */}
        <g className="rc-splashes">
          <circle cx="165" cy="128" r="1.5" className="rc-splash rc-splash-1" />
          <circle cx="160" cy="131" r="1" className="rc-splash rc-splash-2" />
          <circle cx="158" cy="126" r="1.5" className="rc-splash rc-splash-3" />
          <circle cx="213" cy="128" r="1.5" className="rc-splash rc-splash-4" />
          <circle cx="216" cy="131" r="1" className="rc-splash rc-splash-5" />
        </g>
      </svg>

      {/* Meters counter overlay */}
      <div className="rc-overlay">
        <div className="rc-meters">
          <span className="rc-meters-value">{count.toLocaleString()}</span>
          <span className="rc-meters-unit">meters</span>
        </div>
        {phase === 'complete' && (
          <div className="rc-complete-msg">
            <Icon name="ui_check" size={18} /> Row Logged!
          </div>
        )}
        {phase === 'complete' && (
          <div className="rc-tap-hint">Tap to continue</div>
        )}
      </div>
    </div>
  );
}

export default RowCelebration;
