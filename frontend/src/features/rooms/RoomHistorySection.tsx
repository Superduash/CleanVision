import React from 'react';
import { useRoomHistory } from '@/lib/api/hooks';
import { HistoryTimelineRow } from '@/components/composite/HistoryTimelineRow';
import { HistoryChart } from '@/components/composite/HistoryChart';
import { TimelineRowSkeleton } from '@/components/ui/skeleton';
import { ErrorState } from '@/components/composite/ErrorState';
import { EmptyState } from '@/components/composite/EmptyState';
import { History, ArrowRight, TrendingUp } from 'lucide-react';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';

export function RoomHistorySection({ roomId }: { roomId: number }) {
  const { data: history, isLoading, isError, refetch } = useRoomHistory(roomId, 20);

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <h3 className="text-h3 font-semibold text-text-primary">Recent Scans</h3>
        {history && history.length > 0 && (
          <Link to={`/history?room=${String(roomId)}`} className="no-underline">
            <Button variant="ghost" size="sm" className="hidden sm:flex">
              View all <ArrowRight size={16} />
            </Button>
          </Link>
        )}
      </div>

      {isLoading ? (
        <div className="flex flex-col gap-2">
          {[...Array(3)].map((_, i) => <TimelineRowSkeleton key={i} />)}
        </div>
      ) : isError ? (
        <ErrorState message="Failed to load history" onRetry={refetch} />
      ) : !history || history.length === 0 ? (
        <div className="bg-surface-raised rounded-xl p-6 border border-border-elevated shadow-sm">
          <EmptyState
            icon={<History />}
            title="No history yet"
            description="Scan this room to start building a cleanliness history."
          />
        </div>
      ) : (
        <>
          {/* Chart — only show when there are ≥2 scans to make it meaningful */}
          {history.length >= 2 && (
            <div className="bg-surface-raised border border-border-elevated rounded-xl shadow-sm p-5">
              <div className="flex items-center gap-2 mb-4">
                <TrendingUp size={16} className="text-brand-teal" />
                <span className="text-sm font-medium text-text-secondary">Cleanliness Trend</span>
              </div>
              <HistoryChart data={history} />
            </div>
          )}

          {/* Timeline */}
          <div className="bg-surface-raised rounded-xl p-4 sm:p-6 border border-border-elevated shadow-sm">
            <div className="flex flex-col">
              {history.slice(0, 10).map((scan, i) => (
                <HistoryTimelineRow
                  key={scan.id}
                  scan={scan}
                  isFirst={i === 0}
                  isLast={i === Math.min(history.length, 10) - 1}
                />
              ))}
            </div>
          </div>

          <Link to={`/history?room=${String(roomId)}`} className="sm:hidden no-underline mt-2">
            <Button variant="secondary" className="w-full">
              View full history
            </Button>
          </Link>
        </>
      )}
    </div>
  );
}
