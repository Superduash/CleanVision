import type { Status } from '@/lib/api/types';

/** Format a timestamp as a relative time string (e.g. "2 min ago") */
export function relativeTime(timestamp: string): string {
  const now = Date.now();
  const then = new Date(timestamp).getTime();
  const diffMs = now - then;
  const diffSec = Math.floor(diffMs / 1000);
  const diffMin = Math.floor(diffSec / 60);
  const diffHr = Math.floor(diffMin / 60);
  const diffDay = Math.floor(diffHr / 24);

  if (diffSec < 60) return 'Just now';
  if (diffMin < 60) return `${String(diffMin)} min ago`;
  if (diffHr < 24) return `${String(diffHr)}h ago`;
  if (diffDay === 1) return 'Yesterday';
  if (diffDay < 7) return `${String(diffDay)} days ago`;
  return formatDate(timestamp);
}

/** Format a timestamp as a human-readable date */
export function formatDate(timestamp: string): string {
  return new Date(timestamp).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
}

/** Format a cleanliness score to one decimal place */
export function formatScore(score: number): string {
  return score.toFixed(1);
}

/** Get the display label for a status value */
export function getStatusLabel(status: Status): string {
  switch (status) {
    case 'clean': return 'Clean';
    case 'needs_attention': return 'Needs Attention';
    case 'dirty': return 'Dirty';
  }
}

/** Get CSS variable references for a given status */
export function getStatusColors(status: Status): {
  color: string;
  tint: string;
} {
  switch (status) {
    case 'clean':
      return { color: 'var(--status-clean)', tint: 'var(--status-clean-tint)' };
    case 'needs_attention':
      return {
        color: 'var(--status-attention)',
        tint: 'var(--status-attention-tint)',
      };
    case 'dirty':
      return { color: 'var(--status-dirty)', tint: 'var(--status-dirty-tint)' };
  }
}

/** Get the Tailwind color class string for a status */
export function getStatusColorClass(status: Status): string {
  switch (status) {
    case 'clean': return 'text-status-clean';
    case 'needs_attention': return 'text-status-attention';
    case 'dirty': return 'text-status-dirty';
  }
}

/** Get the tint background class for a status */
export function getStatusTintClass(status: Status): string {
  switch (status) {
    case 'clean': return 'bg-status-clean-tint';
    case 'needs_attention': return 'bg-status-attention-tint';
    case 'dirty': return 'bg-status-dirty-tint';
  }
}

/** Format a date string for chart x-axis display (short) */
export function formatChartDate(dateStr: string) {
  const d = new Date(dateStr);
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}

export function getImageUrl(path: string | undefined | null) {
  if (!path) return '';
  return path.startsWith('http') ? path : `/api${path}`;
}


/** Merge class names — lightweight cn utility */
export function cn(...classes: (string | undefined | null | false)[]): string {
  return classes.filter(Boolean).join(' ');
}
