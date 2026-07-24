import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { ChevronDown, AlertTriangle } from 'lucide-react';
import { RoomCard } from './RoomCard';
import { cn } from '@/lib/utils/formatters';
import type { Room } from '@/lib/api/types';

interface BlockSectionProps {
  block: string;
  rooms: Room[];
}

export function BlockSection({ block, rooms }: BlockSectionProps) {
  const [collapsed, setCollapsed] = useState(false);

  const attentionCount = rooms.filter(
    (r) => r.latest_status === 'needs_attention' || r.latest_status === 'dirty',
  ).length;

  return (
    <section aria-label={`Block ${block}`} className="flex flex-col gap-3">
      {/* Section header */}
      <button
        onClick={() => setCollapsed((c) => !c)}
        className={cn(
          'flex items-center gap-2 text-left w-full group',
          'focus-visible:outline-none focus-visible:rounded-sm focus-visible:shadow-glow-focus',
          'touch-manipulation',
        )}
        aria-expanded={!collapsed}
      >
        <span className="text-h3 text-text-primary">{block}</span>
        <span className="text-sm text-text-tertiary">
          · {rooms.length} room{rooms.length !== 1 ? 's' : ''}
        </span>
        {attentionCount > 0 ? (
          <span className="flex items-center gap-1 text-xs text-status-attention bg-status-attention-tint px-2 py-0.5 rounded-sm">
            <AlertTriangle size={11} aria-hidden="true" />
            {attentionCount} need attention
          </span>
        ) : null}
        <motion.span
          animate={{ rotate: collapsed ? -90 : 0 }}
          transition={{ duration: 0.15 }}
          className="ml-auto text-text-tertiary group-hover:text-text-secondary"
        >
          <ChevronDown size={18} aria-hidden="true" />
        </motion.span>
      </button>

      {/* Room grid */}
      <AnimatePresence initial={false}>
        {!collapsed ? (
          <motion.div
            key="rooms"
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.2, ease: [0.22, 1, 0.36, 1] }}
            className="overflow-hidden"
          >
            <div className="grid grid-cols-[repeat(auto-fill,minmax(320px,1fr))] gap-4">
              {rooms.map((room) => (
                <RoomCard key={room.id} room={room} />
              ))}
            </div>
          </motion.div>
        ) : null}
      </AnimatePresence>
    </section>
  );
}
