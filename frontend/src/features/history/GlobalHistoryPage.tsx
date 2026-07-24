import React, { useState } from 'react';
import { History, Filter, Download, TrendingUp } from 'lucide-react';
import { useRoomHistory, useRooms } from '@/lib/api/hooks';
import { HistoryTimelineRow } from '@/components/composite/HistoryTimelineRow';
import { HistoryChart } from '@/components/composite/HistoryChart';
import { TimelineRowSkeleton } from '@/components/ui/skeleton';
import { ErrorState } from '@/components/composite/ErrorState';
import { EmptyState } from '@/components/composite/EmptyState';
import { Select } from '@/components/ui/select';
import { Button } from '@/components/ui/button';

export default function GlobalHistoryPage() {
  const [selectedRoomId, setSelectedRoomId] = useState<number>(0); // 0 means all

  const { data: rooms } = useRooms();
  const { data: history, isLoading, isError, refetch } = useRoomHistory(selectedRoomId, 50);

  const roomOptions = [
    { label: 'Select a room to view history...', value: '0' },
    ...(rooms?.map(r => ({ label: `${r.block} – ${r.name}`, value: String(r.id) })) || [])
  ];

  return (
    <div className="flex flex-col gap-10 w-full pb-24 md:pb-12">
      <header className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <h1 className="text-display-lg font-bold text-text-primary tracking-tight">Scan History</h1>
          <p className="text-body text-text-secondary mt-1">
            Review past inspections and cleanliness trends.
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="secondary" className="hidden sm:flex shadow-sm" disabled={!history || history.length === 0}>
            <Download size={18} /> Export CSV
          </Button>
        </div>
      </header>

      {/* Filter bar */}
      <div className="bg-canvas border-b border-border-strong pb-4 flex flex-col sm:flex-row gap-4 items-center z-20 sticky top-0">
        <div className="w-full sm:max-w-md flex items-center gap-3">
          <Filter size={18} className="text-text-tertiary shrink-0" />
          <Select
            options={roomOptions}
            value={String(selectedRoomId)}
            onChange={(e) => setSelectedRoomId(parseInt(e.target.value, 10))}
            className="flex-1 shadow-sm"
          />
        </div>
      </div>

      {/* Content */}
      {selectedRoomId === 0 ? (
        <div className="bg-surface-raised rounded-xl border border-border-elevated shadow-sm min-h-[400px] flex items-center justify-center">
          <EmptyState
            icon={<History />}
            title="Select a Room"
            description="Choose a room from the dropdown above to view its scan history."
          />
        </div>
      ) : isLoading ? (
        <div className="bg-surface-raised rounded-xl border border-border-elevated shadow-sm p-6 flex flex-col gap-4">
          {[...Array(5)].map((_, i) => <TimelineRowSkeleton key={i} />)}
        </div>
      ) : isError ? (
        <ErrorState message="Failed to load history" onRetry={refetch} />
      ) : !history || history.length === 0 ? (
        <div className="bg-surface-raised rounded-xl border border-border-elevated shadow-sm min-h-[300px] flex items-center justify-center">
          <EmptyState
            icon={<History />}
            title="No history found"
            description="This room hasn't been scanned yet."
          />
        </div>
      ) : (
        <div className="flex flex-col gap-8">
          {/* Chart */}
          {history.length >= 2 && (
            <div className="bg-surface-raised border border-border-elevated rounded-xl shadow-sm p-6">
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
              {history.map((scan, i) => (
                <HistoryTimelineRow
                  key={scan.id}
                  scan={scan}
                  isFirst={i === 0}
                  isLast={i === history.length - 1}
                />
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
