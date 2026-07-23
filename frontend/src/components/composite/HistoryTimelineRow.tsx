import React from 'react';
import { Badge } from '@/components/ui/badge';
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
      <div className="flex-1 py-3">
        <div className="bg-[var(--surface)] border border-[var(--border-subtle)] rounded-[var(--radius-lg)] p-3 shadow-[var(--shadow-sm)] flex items-center gap-4">
          {/* Thumbnail */}
          {scan.image_path ? (
            <div className="w-12 h-12 rounded-[var(--radius-md)] overflow-hidden shrink-0 bg-[var(--canvas)]">
              <img src={getImageUrl(scan.image_path)} alt="Scan thumbnail" className="w-full h-full object-cover" loading="lazy" />
            </div>
          ) : (
            <div className="w-12 h-12 rounded-[var(--radius-md)] bg-[var(--border-subtle)] shrink-0" />
          )}

          {/* Info */}
          <div className="flex-1 min-w-0 flex flex-col justify-center">
            <div className="flex items-center justify-between mb-1">
              <span className="text-body font-medium text-[var(--text-primary)] truncate">
                Score: <span className="font-mono text-mono">{formatScore(scan.cleanliness_score)}</span>
              </span>
              <span className="text-xs text-[var(--text-tertiary)] shrink-0">
                {relativeTime(scan.timestamp)}
              </span>
            </div>
            <div className="flex items-center justify-between">
              <Badge variant={scan.status} />
              <span className="text-xs text-[var(--text-tertiary)] hidden sm:inline">
                {formatDate(scan.timestamp)}
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
