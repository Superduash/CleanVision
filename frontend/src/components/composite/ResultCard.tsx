import React from 'react';
import { ScoreRing } from './ScoreRing';
import { Badge } from '@/components/ui/badge';
import { getStatusLabel, getImageUrl } from '@/lib/utils/formatters';
import type { ScanResponse, Status } from '@/lib/api/types';

interface ResultCardProps {
  scan: ScanResponse;
}

export function ResultCard({ scan }: ResultCardProps) {
  // Determine if it's a "great job" message based on status
  const getMessage = (status: Status) => {
    switch (status) {
      case 'clean': return 'Excellent work! The room meets cleanliness standards.';
      case 'needs_attention': return 'Some areas need a quick touch-up.';
      case 'dirty': return 'Significant cleaning required.';
    }
  };

  return (
    <div className="bg-surface rounded-xl shadow-lg border border-border-subtle overflow-hidden flex flex-col">
      {/* Image half */}
      <div className="relative h-48 sm:h-64 bg-canvas">
        {scan.image_path ? (
          <img
            src={getImageUrl(scan.image_path)}
            alt="Scan result"
            className="w-full h-full object-cover"
          />
        ) : null}
        <div className="absolute top-4 right-4">
          <Badge variant={scan.status} className="shadow-sm" />
        </div>
      </div>

      {/* Details half */}
      <div className="p-6 flex flex-col items-center text-center gap-4 relative">
        {/* Score Ring pulled up slightly over the image */}
        <div className="absolute -top-16 bg-surface rounded-full p-1 shadow-sm">
          <ScoreRing score={scan.score} status={scan.status} size={100} strokeWidth={8} />
        </div>

        <div className="mt-12 w-full">
          <h2 className="text-h2 font-bold text-text-primary mb-2">
            {getStatusLabel(scan.status)}
          </h2>
          <p className="text-text-secondary text-body">
            {getMessage(scan.status)}
          </p>
        </div>

        {scan.mock && (
          <div className="w-full p-3 bg-[var(--border-subtle)] rounded-md mt-2">
            <p className="text-xs text-text-secondary">
              This is a mock result (AI engine offline).
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
