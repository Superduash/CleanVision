import React from 'react';
import { StatCard } from './StatCard';
import { Skeleton } from '@/components/ui/skeleton';
import { ClipboardList, CheckCircle2, AlertTriangle, XCircle } from 'lucide-react';
import type { ReportsSummary } from '@/lib/api/types';

interface SummaryStatRowProps {
  summary?: ReportsSummary;
  isLoading: boolean;
}

export function SummaryStatRow({ summary, isLoading }: SummaryStatRowProps) {
  if (isLoading || !summary) {
    return (
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[...Array(4)].map((_, i) => (
          <Skeleton key={i} className="h-28 rounded-lg" />
        ))}
      </div>
    );
  }

  const { today_count, avg_score_today, status_counts } = summary;

  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
      <StatCard
        label="Today's Scans"
        value={today_count}
        icon={<ClipboardList size={18} />}
      />
      <StatCard
        label="Clean Rooms"
        value={status_counts.clean}
        icon={<CheckCircle2 size={18} className="text-status-clean" />}
      />
      <StatCard
        label="Needs Attention"
        value={status_counts.needs_attention}
        icon={<AlertTriangle size={18} className="text-status-attention" />}
      />
      <StatCard
        label="Avg Score"
        value={avg_score_today.toFixed(1)}
        subValue="/10"
      />
    </div>
  );
}
