import React, { useState } from 'react';
import { History, Filter, Download } from 'lucide-react';
import { useRoomHistory, useRooms } from '@/lib/api/hooks';
import { HistoryTimelineRow } from '@/components/composite/HistoryTimelineRow';
import { TimelineRowSkeleton } from '@/components/ui/skeleton';
import { ErrorState } from '@/components/composite/ErrorState';
import { EmptyState } from '@/components/composite/EmptyState';
import { Select } from '@/components/ui/select';
import { Button } from '@/components/ui/button';

export default function GlobalHistoryPage() {
  const [selectedRoomId, setSelectedRoomId] = useState<number>(0); // 0 means all
  
  // Since we only have room history in the backend currently, 
  // if no room is selected, we could either map over all rooms or ask to select.
  // We'll ask to select a room for now, as global history requires heavy client aggregation otherwise.
  const { data: rooms } = useRooms();
  const { data: history, isLoading, isError, refetch } = useRoomHistory(selectedRoomId, 50);

  const roomOptions = [
    { label: 'Select a room to view history...', value: '0' },
    ...(rooms?.map(r => ({ label: `${r.block} - ${r.name}`, value: String(r.id) })) || [])
  ];

  return (
    <div className="flex flex-col gap-6 p-4 md:p-8 max-w-4xl mx-auto w-full pb-24 md:pb-8">
      <header className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <h1 className="text-h1 font-bold text-[var(--text-primary)]">Scan History</h1>
          <p className="text-body text-[var(--text-secondary)] mt-1">
            Review past inspections and cleanliness trends.
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="secondary" className="hidden sm:flex" disabled={!history || history.length === 0}>
            <Download size={18} /> Export CSV
          </Button>
        </div>
      </header>

      <div className="bg-[var(--surface)] p-4 rounded-[var(--radius-lg)] border border-[var(--border-subtle)] shadow-[var(--shadow-sm)] flex flex-col sm:flex-row gap-4 items-center z-20">
        <div className="w-full sm:max-w-xs flex items-center gap-2">
          <Filter size={18} className="text-[var(--text-tertiary)] shrink-0" />
          <Select 
            options={roomOptions}
            value={String(selectedRoomId)}
            onChange={(e) => setSelectedRoomId(parseInt(e.target.value, 10))}
            className="flex-1"
          />
        </div>
      </div>

      <div className="bg-[var(--surface)] rounded-[var(--radius-lg)] p-4 sm:p-6 border border-[var(--border-subtle)] shadow-[var(--shadow-sm)] min-h-[400px]">
        {selectedRoomId === 0 ? (
          <div className="h-full flex items-center justify-center">
            <EmptyState 
              icon={<History />}
              title="Select a Room"
              description="Choose a room from the dropdown above to view its scan history."
            />
          </div>
        ) : isLoading ? (
          <div className="flex flex-col gap-4">
            {[...Array(5)].map((_, i) => <TimelineRowSkeleton key={i} />)}
          </div>
        ) : isError ? (
          <ErrorState message="Failed to load history" onRetry={refetch} />
        ) : !history || history.length === 0 ? (
          <EmptyState 
            icon={<History />}
            title="No history found"
            description="This room hasn't been scanned yet."
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
    </div>
  );
}
