import React, { useState, useMemo } from 'react';
import { Plus, Search } from 'lucide-react';
import { useRooms } from '@/lib/api/hooks';
import { useStaffNameStore } from '@/lib/stores/staffNameStore';
import { BlockSection } from '@/components/composite/BlockSection';
import { DashboardSkeleton } from './DashboardSkeleton';
import { AddRoomDialog } from './AddRoomDialog';
import { ErrorState } from '@/components/composite/ErrorState';
import { EmptyState } from '@/components/composite/EmptyState';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Chip } from '@/components/ui/badge';
import { StaffChip } from '@/components/composite/StaffChip';
import type { Room } from '@/lib/api/types';
import { StatCard } from '@/components/composite/StatCard';
import { Activity, AlertTriangle, CheckCircle, BarChart2 } from 'lucide-react';



export default function DashboardPage() {
  const { staffName } = useStaffNameStore();
  const { data: rooms, isLoading, isError, error, refetch } = useRooms();
  
  const [searchQuery, setSearchQuery] = useState('');
  const [activeBlocks, setActiveBlocks] = useState<Set<string>>(new Set());
  const [isAddRoomOpen, setIsAddRoomOpen] = useState(false);

  // Group rooms by block and filter
  const { groupedRooms, allBlocks, stats } = useMemo(() => {
    if (!rooms) return { groupedRooms: {}, allBlocks: [], stats: { total: 0, clean: 0, attention: 0, avgScore: null as number | null } };

    let clean = 0;
    let attention = 0;
    let scoreSum = 0;
    let scoreCount = 0;

    const filtered = (rooms || []).filter(room => {
      if (room.latest_status === 'clean') clean++;
      else if (room.latest_status === 'needs_attention' || room.latest_status === 'dirty') attention++;
      if (room.latest_score != null) { scoreSum += room.latest_score; scoreCount++; }

      const matchesSearch = room.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
                            room.block.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesBlock = activeBlocks.size === 0 || activeBlocks.has(room.block);
      return matchesSearch && matchesBlock;
    });

    const grouped = (filtered || []).reduce((acc, room) => {
      (acc[room.block] = acc[room.block] || []).push(room);
      return acc;
    }, {} as Record<string, Room[]>);

    // Sort blocks alphabetically
    const sortedGroups = Object.keys(grouped).sort().reduce((acc, key) => {
      acc[key] = (grouped[key] || []).sort((a, b) => a.name.localeCompare(b.name));
      return acc;
    }, {} as Record<string, Room[]>);

    const blocks = Array.from(new Set((rooms || []).map(r => r.block))).sort();

    return { 
      groupedRooms: sortedGroups, 
      allBlocks: blocks,
      stats: { total: rooms.length, clean, attention, avgScore: scoreCount > 0 ? Math.round(scoreSum / scoreCount * 10) / 10 : null }
    };
  }, [rooms, searchQuery, activeBlocks]);

  const toggleBlockFilter = (block: string) => {
    setActiveBlocks(prev => {
      const next = new Set(prev);
      if (next.has(block)) next.delete(block);
      else next.add(block);
      return next;
    });
  };

  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Good morning';
    if (hour < 18) return 'Good afternoon';
    return 'Good evening';
  };

  return (
    <div className="flex flex-col gap-10 w-full pb-24 md:pb-12">
      {/* Header */}
      <header className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <h1 className="text-display-lg font-bold tracking-tight text-text-primary">
            {getGreeting()}, {staffName.split(' ')[0]}
          </h1>
          <p className="text-body text-text-secondary mt-1">
            Here's the current state of your facility.
          </p>
        </div>
        
        <div className="flex items-center gap-3 self-start md:self-auto">
          <StaffChip />
          <Button onClick={() => setIsAddRoomOpen(true)} className="hidden md:flex">
            <Plus size={18} /> Add Room
          </Button>
        </div>
      </header>

      {/* Hero Stats */}
      {!isLoading && !isError && rooms && rooms.length > 0 && (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          <StatCard 
            label="Total Rooms" 
            value={stats.total} 
            icon={<Activity size={20} />} 
          />
          <StatCard 
            label="Need Attention" 
            value={stats.attention} 
            icon={<AlertTriangle size={20} className={stats.attention > 0 ? "text-status-attention" : ""} />} 
            trend={stats.attention > 0 ? "down" : undefined}
          />
          <StatCard 
            label="Clean" 
            value={stats.clean} 
            icon={<CheckCircle size={20} className="text-status-clean" />} 
          />
          <StatCard 
            label="Avg Score" 
            value={stats.avgScore != null ? `${stats.avgScore}` : '—'} 
            icon={<BarChart2 size={20} />} 
          />
        </div>
      )}

      {/* Tools: Search & Filter */}
      <div className="flex flex-col md:flex-row gap-4 items-start md:items-center sticky top-0 z-10 bg-canvas py-2">
        <div className="relative w-full max-w-md">
          <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-text-tertiary" />
          <Input 
            placeholder="Search rooms..." 
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-9 w-full"
          />
        </div>

        {allBlocks.length > 0 && (
          <div className="flex gap-2 overflow-x-auto w-full md:w-auto scrollbar-hide pb-2 md:pb-0">
            {allBlocks.map(block => (
              <Chip
                key={block}
                label={`Block ${block}`}
                active={activeBlocks.has(block)}
                onClick={() => toggleBlockFilter(block)}
                className="shrink-0"
              />
            ))}
          </div>
        )}
      </div>

      {/* Content */}
      {isLoading ? (
        <DashboardSkeleton />
      ) : isError ? (
        <ErrorState 
          message={error?.message || 'Failed to load rooms'} 
          onRetry={refetch} 
        />
      ) : Object.keys(groupedRooms).length === 0 ? (
        <EmptyState 
          icon={<Search />}
          title={searchQuery ? 'No rooms found' : 'No rooms yet'}
          description={searchQuery ? 'Try adjusting your search or filters.' : 'Add your first room to start scanning.'}
          action={
            <Button onClick={() => {
              if (searchQuery || activeBlocks.size > 0) {
                setSearchQuery('');
                setActiveBlocks(new Set());
              } else {
                setIsAddRoomOpen(true);
              }
            }}>
              {searchQuery || activeBlocks.size > 0 ? 'Clear Filters' : 'Add Room'}
            </Button>
          }
        />
      ) : (
        <div className="flex flex-col gap-8">
          {Object.entries(groupedRooms).map(([block, blockRooms]) => (
            <BlockSection key={block} block={block} rooms={blockRooms} />
          ))}
        </div>
      )}

      {/* Modals */}
      <AddRoomDialog open={isAddRoomOpen} onClose={() => setIsAddRoomOpen(false)} />
    </div>
  );
}
