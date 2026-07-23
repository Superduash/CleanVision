import React from 'react';
import { useRoomHistory } from '@/lib/api/hooks';
import { HistoryTimelineRow } from '@/components/composite/HistoryTimelineRow';
import { TimelineRowSkeleton } from '@/components/ui/skeleton';
import { ErrorState } from '@/components/composite/ErrorState';
import { EmptyState } from '@/components/composite/EmptyState';
import { History, ArrowRight } from 'lucide-react';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';

export function RoomHistorySection({ roomId }: { roomId: number }) {
  const { data: history, isLoading, isError, refetch } = useRoomHistory(roomId, 5);

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-between">
        <h3 className="text-h3 font-semibold text-[var(--text-primary)]">Recent Scans</h3>
        {history && history.length > 0 && (
          <Link to={`/history?room=${String(roomId)}`} className="no-underline">
            <Button variant="ghost" size="sm" className="hidden sm:flex">
              View all <ArrowRight size={16} />
            </Button>
          </Link>
        )}
      </div>

      <div className="bg-[var(--surface-raised)] rounded-[var(--radius-lg)] p-4 sm:p-6 border border-[var(--border-subtle)]">
        {isLoading ? (
          <div className="flex flex-col gap-2">
            {[...Array(3)].map((_, i) => <TimelineRowSkeleton key={i} />)}
          </div>
        ) : isError ? (
          <ErrorState message="Failed to load history" onRetry={refetch} />
        ) : !history || history.length === 0 ? (
          <EmptyState 
            icon={<History />}
            title="No history yet"
            description="Scan this room to start building a cleanliness history."
          />
        ) : (
          <div className="flex flex-col">
            {history.map((scan, i) => (
              <HistoryTimelineRow 
                key={scan.id} 
                scan={scan} 
                isFirst={i === 0} 
                isLast={i === history.length - 1} 
              />
            ))}
          </div>
        )}
      </div>
      
      {history && history.length > 0 && (
        <Link to={`/history?room=${String(roomId)}`} className="sm:hidden no-underline mt-2">
          <Button variant="secondary" className="w-full">
            View full history
          </Button>
        </Link>
      )}
    </div>
  );
}
