import React from 'react';
import { ProgressBar } from '@/components/ui/skeleton';
import { AlertTriangle } from 'lucide-react';
import type { ReportsSummary } from '@/lib/api/types';

interface BlockBreakdownListProps {
  blocks: ReportsSummary['block_breakdown'];
}

export function BlockBreakdownList({ blocks }: BlockBreakdownListProps) {
  if (blocks.length === 0) {
    return <p className="text-text-tertiary text-sm">No blocks available</p>;
  }

  return (
    <div className="bg-surface border border-border-subtle rounded-lg overflow-hidden shadow-sm">
      <div className="px-4 py-3 border-b border-border-subtle bg-surface-raised">
        <h3 className="text-sm font-medium text-text-secondary">Block Breakdown</h3>
      </div>
      <div className="divide-y divide-[var(--border-subtle)]">
        {blocks.map((block) => (
          <div key={block.block} className="p-4 flex flex-col gap-3">
            <div className="flex items-center justify-between">
              <span className="text-body font-medium text-text-primary">
                {block.block}
              </span>
              <span className="text-sm text-mono font-bold text-text-primary">
                {block.avg_score != null ? block.avg_score.toFixed(1) : '-'} / 10
              </span>
            </div>
            
            <div className="flex items-center gap-4">
              <div className="flex-1">
                <ProgressBar value={block.avg_score != null ? (block.avg_score / 10) * 100 : 0} />
              </div>
              <div className="flex gap-3 text-xs">
                <span className="text-text-secondary">
                  {block.room_count} rooms
                </span>
                {block.attention_count > 0 && (
                  <span className="flex items-center gap-1 text-status-attention font-medium">
                    <AlertTriangle size={12} />
                    {block.attention_count} issue{block.attention_count !== 1 ? 's' : ''}
                  </span>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
