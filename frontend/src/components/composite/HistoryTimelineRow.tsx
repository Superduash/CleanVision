import React from 'react';
import { Badge } from '@/components/ui/badge';
import { Link } from 'react-router-dom';
import { relativeTime, formatDate, formatScore, getImageUrl } from '@/lib/utils/formatters';
import type { Scan } from '@/lib/api/types';

interface HistoryTimelineRowProps {
  scan: Scan;
  isFirst?: boolean;
  isLast?: boolean;
}

export function HistoryTimelineRow({ scan, isFirst, isLast }: HistoryTimelineRowProps) {
  return (
    <div className="flex gap-4 relative">
      {/* Timeline connector line */}
      <div className="flex flex-col items-center">
        <div className={`w-0.5 bg-[var(--border-strong)] ${isFirst ? 'h-4' : 'flex-1'} ${isFirst ? 'mt-4' : ''}`} />
        <div className="w-3 h-3 rounded-full bg-[var(--brand-teal)] border-2 border-[var(--surface)] shrink-0 z-10" />
        <div className={`w-0.5 bg-[var(--border-strong)] ${isLast ? 'h-0' : 'flex-1'}`} />
      </div>

      {/* Content card */}
      <div className="flex-1 py-3 group">
        <Link 
          to={`/scan?roomId=${String(scan.room_id)}`}
          className="bg-surface-raised border border-border-elevated rounded-xl p-4 shadow-sm flex flex-col sm:flex-row sm:items-center gap-4 transition-all duration-base hover:-translate-y-0.5 hover:shadow-md cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-teal block no-underline"
        >
          {/* Thumbnail */}
          {scan.image_path ? (
            <div className="w-12 h-12 rounded-lg overflow-hidden shrink-0 bg-canvas border border-border-subtle">
              <img src={getImageUrl(scan.image_path)} alt="Scan thumbnail" className="w-full h-full object-cover" loading="lazy" />
            </div>
          ) : (
            <div className="w-12 h-12 rounded-lg bg-[var(--border-subtle)] shrink-0 border border-border-strong" />
          )}

          {/* Info */}
          <div className="flex-1 min-w-0 flex flex-col justify-center">
            <div className="flex items-center justify-between mb-1">
              <span className="text-body font-medium text-text-primary truncate">
                Score: <span className="font-mono text-mono">{formatScore(scan.cleanliness_score)}</span>
              </span>
              <span className="text-xs text-text-tertiary shrink-0">
                {relativeTime(scan.timestamp)}
              </span>
            </div>
            <div className="flex items-center justify-between">
              <Badge variant={scan.status} />
              <span className="text-xs text-text-tertiary hidden sm:inline">
                {formatDate(scan.timestamp)}
              </span>
            </div>
          </div>
        </Link>
      </div>
    </div>
  );
}
