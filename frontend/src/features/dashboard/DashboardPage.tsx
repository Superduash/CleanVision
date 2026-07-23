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

export default function DashboardPage() {
  const { staffName } = useStaffNameStore();
  const { data: rooms, isLoading, isError, error, refetch } = useRooms();
  
  const [searchQuery, setSearchQuery] = useState('');
  const [activeBlocks, setActiveBlocks] = useState<Set<string>>(new Set());
  const [isAddRoomOpen, setIsAddRoomOpen] = useState(false);

  // Group rooms by block and filter
  const { groupedRooms, allBlocks } = useMemo(() => {
    if (!rooms) return { groupedRooms: {}, allBlocks: [] };

    const filtered = (rooms || []).filter(room => {
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
      // Sort rooms within block by name
      acc[key] = (grouped[key] || []).sort((a, b) => a.name.localeCompare(b.name));
      return acc;
    }, {} as Record<string, Room[]>);

    // Extract all unique blocks from ALL rooms (ignoring search) for the filter chips
    const blocks = Array.from(new Set((rooms || []).map(r => r.block))).sort();

    return { groupedRooms: sortedGroups, allBlocks: blocks };
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
    <div className="flex flex-col gap-6 p-4 md:p-8 max-w-7xl mx-auto w-full">
      {/* Header */}
      <header className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <h1 className="text-display-lg font-bold tracking-tight text-text-primary">
            {getGreeting()}, {staffName.split(' ')[0]}
          </h1>
          <p className="text-body text-text-secondary mt-1">
            Ready for your rounds?
          </p>
        </div>
        
        <div className="flex items-center gap-3 self-start md:self-auto">
          <StaffChip />
          <Button onClick={() => setIsAddRoomOpen(true)} className="hidden md:flex">
            <Plus size={18} /> Add Room
          </Button>
        </div>
      </header>

      {/* Tools: Search & Filter */}
      <div className="flex flex-col gap-4 sticky top-0 z-10 bg-canvas py-2">
        <div className="relative">
          <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-text-tertiary" />
          <Input 
            placeholder="Search rooms..." 
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-9"
          />
        </div>

        {allBlocks.length > 0 && (
          <div className="flex gap-2 overflow-x-auto pb-2 -mx-4 px-4 md:mx-0 md:px-0 scrollbar-hide">
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
