import React from 'react';

/**
 * Full-viewport centered loading spinner.
 * @param {object} props
 * @param {string} [props.label='Loading…'] - Text shown below the spinner.
 * @param {boolean} [props.fullPage=true]   - If true, uses fixed overlay positioning.
 */
function LoadingSpinner({ label = 'Loading…', fullPage = false }) {
  const wrapper = fullPage
    ? 'fixed inset-0 flex flex-col items-center justify-center z-50'
    : 'flex flex-col items-center justify-center py-20';

  return (
    <div className={wrapper} role="status" aria-live="polite">
      <div className="relative w-14 h-14 mb-4">
        {/* Outer ring */}
        <div
          className="absolute inset-0 rounded-full animate-spin-slow"
          style={{
            border: '3px solid rgba(16,185,129,0.15)',
            borderTopColor: '#10b981',
          }}
        />
        {/* Inner ring (counter-rotate for effect) */}
        <div
          className="absolute inset-2 rounded-full"
          style={{
            border: '2px solid rgba(16,185,129,0.08)',
            borderBottomColor: 'rgba(16,185,129,0.5)',
            animation: 'spin-slow 0.9s linear infinite reverse',
          }}
        />
        {/* Centre dot */}
        <div
          className="absolute inset-0 flex items-center justify-center"
        >
          <div
            className="w-2 h-2 rounded-full"
            style={{ background: '#10b981' }}
          />
        </div>
      </div>
      <p
        className="text-sm font-medium tracking-wide"
        style={{ color: '#8b949e' }}
      >
        {label}
      </p>
    </div>
  );
}

export default LoadingSpinner;