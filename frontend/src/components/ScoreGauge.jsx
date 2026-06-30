import React, { useEffect, useRef } from 'react';
import { getStatusLabel, getStatusTextClass } from '../utils/status';

/**
 * ScoreGauge — circular SVG gauge showing the cleanliness score.
 *
 * Props:
 *   score   — number 0–100
 *   status  — 'clean' | 'needs_attention' | 'dirty'
 */
function ScoreGauge({ score, status }) {
  const circleRef = useRef(null);

  const RADIUS       = 72;
  const CIRCUMFERENCE = 2 * Math.PI * RADIUS;
  const targetOffset  = CIRCUMFERENCE - (score / 100) * CIRCUMFERENCE;

  // Animate stroke-dashoffset from full (hidden) → target value
  useEffect(() => {
    const circle = circleRef.current;
    if (!circle) return;

    // Start fully hidden, then transition to target
    circle.style.transition = 'none';
    circle.style.strokeDashoffset = String(CIRCUMFERENCE);

    // Force a reflow so the browser registers the starting state
    void circle.getBoundingClientRect();

    // Animate
    circle.style.transition = 'stroke-dashoffset 1s cubic-bezier(0.4,0,0.2,1)';
    circle.style.strokeDashoffset = String(targetOffset);
  }, [score, targetOffset, CIRCUMFERENCE]);

  // Stroke colour by status
  const strokeColor =
    status === 'clean'           ? '#10b981' :
    status === 'needs_attention' ? '#f59e0b' :
    status === 'dirty'           ? '#ef4444' :
                                   '#374151';

  // Glow filter id (unique per status to avoid cross-contamination)
  const filterId = `glow-${status}`;

  const textColor = getStatusTextClass(status);

  return (
    <div className="flex flex-col items-center justify-center py-4 animate-fade-in">
      <div className="relative w-52 h-52">
        <svg
          className="w-full h-full"
          viewBox="0 0 160 160"
          aria-label={`Cleanliness score: ${score} out of 100. Status: ${getStatusLabel(status)}`}
        >
          <defs>
            <filter id={filterId} x="-40%" y="-40%" width="180%" height="180%">
              <feGaussianBlur stdDeviation="4" result="blur" />
              <feMerge>
                <feMergeNode in="blur" />
                <feMergeNode in="SourceGraphic" />
              </feMerge>
            </filter>
          </defs>

          {/* Track */}
          <circle
            cx="80" cy="80" r={RADIUS}
            fill="none"
            stroke="rgba(255,255,255,0.06)"
            strokeWidth="12"
          />

          {/* Progress arc — starts at top (−90° rotation applied via transform) */}
          <circle
            ref={circleRef}
            cx="80" cy="80" r={RADIUS}
            fill="none"
            stroke={strokeColor}
            strokeWidth="12"
            strokeLinecap="round"
            strokeDasharray={CIRCUMFERENCE}
            strokeDashoffset={CIRCUMFERENCE}
            transform="rotate(-90 80 80)"
            filter={`url(#${filterId})`}
          />
        </svg>

        {/* Centre content */}
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <span className={`text-5xl font-extrabold tabular-nums leading-none ${textColor}`}>
            {score}
          </span>
          <span className="text-sm mt-1" style={{ color: '#8b949e' }}>
            / 100
          </span>
        </div>
      </div>

      {/* Status label */}
      <p className={`mt-3 text-lg font-semibold tracking-wide ${textColor}`}>
        {getStatusLabel(status)}
      </p>
    </div>
  );
}

export default ScoreGauge;