/**
 * Shared status + formatting utilities for CleanVision.
 * Centralised here to avoid duplication across pages and components.
 */

// -------------------------------------------------------------------------- //
// Status helpers                                                               //
// -------------------------------------------------------------------------- //

/**
 * Tailwind classes for the coloured pill/badge used in cards and tables.
 * @param {string|null} status
 * @returns {string}
 */
export function getStatusBadgeClasses(status) {
  switch (status) {
    case 'clean':           return 'bg-emerald-100 text-emerald-800 border border-emerald-200';
    case 'needs_attention': return 'bg-amber-100   text-amber-800   border border-amber-200';
    case 'dirty':           return 'bg-red-100     text-red-800     border border-red-200';
    default:                return 'bg-slate-100   text-slate-500   border border-slate-200';
  }
}

/**
 * Tailwind text-colour class for score numbers and headings.
 * @param {string|null} status
 * @returns {string}
 */
export function getStatusTextClass(status) {
  switch (status) {
    case 'clean':           return 'text-emerald-600';
    case 'needs_attention': return 'text-amber-500';
    case 'dirty':           return 'text-red-500';
    default:                return 'text-slate-400';
  }
}

/**
 * SVG stroke / ring colour class for ScoreGauge.
 * @param {string|null} status
 * @returns {string}
 */
export function getStatusRingClass(status) {
  switch (status) {
    case 'clean':           return 'text-emerald-500';
    case 'needs_attention': return 'text-amber-400';
    case 'dirty':           return 'text-red-500';
    default:                return 'text-slate-300';
  }
}

/**
 * Human-readable label for a status value.
 * @param {string|null} status
 * @returns {string}
 */
export function getStatusLabel(status) {
  switch (status) {
    case 'clean':           return 'Clean';
    case 'needs_attention': return 'Needs Attention';
    case 'dirty':           return 'Dirty';
    default:                return 'Not yet scanned';
  }
}

// -------------------------------------------------------------------------- //
// Date / time helpers                                                           //
// -------------------------------------------------------------------------- //

/**
 * Returns a human-relative time string (e.g. "5m ago", "2d ago").
 * Falls back to the localised date string for anything older than a week.
 * @param {string|null} isoTimestamp
 * @returns {string}
 */
export function formatRelativeTime(isoTimestamp) {
  if (!isoTimestamp) return 'Never';

  // SQLite timestamps are in UTC but stored without the 'Z' suffix.
  const normalised = isoTimestamp.endsWith('Z') ? isoTimestamp : `${isoTimestamp}Z`;
  const date = new Date(normalised);
  if (isNaN(date.getTime())) return 'Unknown';

  const diffMs   = Date.now() - date.getTime();
  const diffMins = Math.floor(diffMs / 60_000);
  const diffHrs  = Math.floor(diffMs / 3_600_000);
  const diffDays = Math.floor(diffMs / 86_400_000);

  if (diffMins < 1)  return 'Just now';
  if (diffMins < 60) return `${diffMins}m ago`;
  if (diffHrs  < 24) return `${diffHrs}h ago`;
  if (diffDays < 7)  return `${diffDays}d ago`;
  return date.toLocaleDateString();
}

/**
 * Returns a full localised date+time string for history tables.
 * @param {string|null} isoTimestamp
 * @returns {string}
 */
export function formatDateTime(isoTimestamp) {
  if (!isoTimestamp) return '—';
  const normalised = isoTimestamp.endsWith('Z') ? isoTimestamp : `${isoTimestamp}Z`;
  const date = new Date(normalised);
  if (isNaN(date.getTime())) return '—';
  return date.toLocaleString(undefined, {
    year:   'numeric',
    month:  'short',
    day:    'numeric',
    hour:   '2-digit',
    minute: '2-digit',
  });
}

// -------------------------------------------------------------------------- //
// Image URL helper                                                              //
// -------------------------------------------------------------------------- //

/**
 * Converts a relative `uploads/…` path from the API into a full URL
 * that the browser can fetch.  Works correctly in both:
 *   - Production  (Flask serves frontend + uploads on the same origin)
 *   - Development (React dev server at :3000, Flask at :5000)
 *
 * @param {string|null} relativePath  e.g. "uploads/baselines/1_baseline.jpg"
 * @param {string} apiBase            The API_BASE value from config.js
 * @returns {string|null}
 */
export function buildImageUrl(relativePath, apiBase) {
  if (!relativePath) return null;

  // Derive the server origin from apiBase.
  // In production, apiBase is '/api' → origin is window.location.origin.
  // In development, apiBase is 'http://localhost:5000/api' → origin is 'http://localhost:5000'.
  let origin;
  if (apiBase.startsWith('http')) {
    try {
      origin = new URL(apiBase).origin;
    } catch {
      origin = window.location.origin;
    }
  } else {
    origin = window.location.origin;
  }

  return `${origin}/${relativePath}`;
}
