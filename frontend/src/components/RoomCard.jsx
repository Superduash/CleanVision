import React from 'react';
import { Link } from 'react-router-dom';
import {
  getStatusBadgeClasses,
  getStatusLabel,
  getStatusTextClass,
  formatRelativeTime,
} from '../utils/status';

/**
 * RoomCard — displays a room's current cleanliness status at a glance.
 *
 * Props:
 *   room  — { id, name, block, latest_score, latest_status, last_scanned }
 */
function RoomCard({ room }) {
  const { id, name, block, latest_score, latest_status, last_scanned } = room;

  const hasScore   = latest_score !== null && latest_score !== undefined;
  const scoreColor = getStatusTextClass(latest_status);
  const badgeCls   = getStatusBadgeClasses(latest_status);

  // Progress bar width (capped 0–100)
  const barWidth = hasScore ? Math.min(100, Math.max(0, latest_score)) : 0;

  return (
    <div className="cv-card p-5 flex flex-col animate-fade-in">
      {/* Header row */}
      <div className="flex items-start justify-between gap-2 mb-4">
        <div className="min-w-0">
          <h3
            className="font-semibold text-base truncate"
            style={{ color: '#e6edf3' }}
            title={name}
          >
            {name}
          </h3>
          <p className="text-xs mt-0.5" style={{ color: '#8b949e' }}>
            Block {block}
          </p>
        </div>
        <span className={`cv-badge flex-shrink-0 ${badgeCls}`}>
          {getStatusLabel(latest_status)}
        </span>
      </div>

      {/* Score section */}
      <div className="mb-4">
        <div className="flex items-end justify-between mb-1.5">
          <span className="text-xs" style={{ color: '#8b949e' }}>
            Cleanliness Score
          </span>
          <span className={`text-2xl font-bold tabular-nums ${scoreColor}`}>
            {hasScore ? `${latest_score}` : '—'}
            {hasScore && (
              <span className="text-sm font-normal ml-0.5" style={{ color: '#8b949e' }}>
                /100
              </span>
            )}
          </span>
        </div>

        {/* Score progress bar */}
        <div
          className="w-full h-1.5 rounded-full overflow-hidden"
          style={{ background: 'rgba(255,255,255,0.06)' }}
        >
          <div
            className="h-full rounded-full transition-all duration-700 ease-out"
            style={{
              width: `${barWidth}%`,
              background:
                latest_status === 'clean'
                  ? 'linear-gradient(90deg,#10b981,#34d399)'
                  : latest_status === 'needs_attention'
                  ? 'linear-gradient(90deg,#f59e0b,#fbbf24)'
                  : latest_status === 'dirty'
                  ? 'linear-gradient(90deg,#ef4444,#f87171)'
                  : 'rgba(255,255,255,0.15)',
            }}
          />
        </div>

        <p className="text-xs mt-1.5" style={{ color: '#6b7280' }}>
          Last scanned: {formatRelativeTime(last_scanned)}
        </p>
      </div>

      {/* Actions */}
      <div className="flex gap-2 mt-auto">
        <Link
          to={`/scan/${id}`}
          id={`scan-room-${id}`}
          className="cv-btn-primary flex-1 text-sm no-underline"
        >
          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
            <circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/>
          </svg>
          Scan Now
        </Link>
        <Link
          to={`/history/${id}`}
          id={`history-room-${id}`}
          className="cv-btn-secondary flex-1 text-sm no-underline"
        >
          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
            <polyline points="22 12 18 12 15 21 9 3 6 12 2 12"/>
          </svg>
          History
        </Link>
      </div>
    </div>
  );
}

export default RoomCard;