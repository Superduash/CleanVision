import React from 'react';
import { Link } from 'react-router-dom';
import { useQueryClient } from '@tanstack/react-query';
import { motion } from 'motion/react';
import { Badge } from '@/components/ui/badge';
import { relativeTime, formatScore } from '@/lib/utils/formatters';
import { prefetchRoom } from '@/lib/api/hooks';
import { Camera, ArrowRight } from 'lucide-react';
import type { Room } from '@/lib/api/types';

interface RoomCardProps {
  room: Room;
}

export function RoomCard({ room }: RoomCardProps) {
  const queryClient = useQueryClient();

  const handleMouseEnter = () => {
    prefetchRoom(queryClient, room.id);
  };

  const hasScans = room.last_scanned != null;

  return (
    <motion.div
      whileHover={{ y: -2 }}
      whileTap={{ scale: 0.97 }}
      transition={{ duration: 0.12, ease: [0, 0, 0.2, 1] }}
    >
      <Link
        to={`/rooms/${String(room.id)}`}
        onMouseEnter={handleMouseEnter}
        onFocus={handleMouseEnter}
        className={[
          'group flex flex-col gap-4 p-6 rounded-xl',
          'bg-surface-raised border border-border-subtle',
          'shadow-sm hover:shadow-md',
          'hover:border-brand-teal/20',
          'transition-all duration-base ease-out no-underline',
          'focus-visible:outline-none focus-visible:shadow-glow-focus',
          'block min-h-[160px]',
        ].join(' ')}
      >
        {/* Block label */}
        <div className="flex items-center justify-between mb-1">
          <span className="text-caption font-medium tracking-wider text-text-tertiary uppercase">
            Block {room.block}
          </span>
        </div>

        {/* Room name */}
        <h3
          className="text-h3 font-semibold text-text-primary truncate"
          title={room.name}
        >
          {room.name}
        </h3>

        {/* Score + status */}
        <div className="flex items-center justify-between gap-2 flex-1">
          {room.latest_score != null ? (
            <span className="text-display-lg font-bold text-mono text-text-primary">
              {formatScore(room.latest_score)}
            </span>
          ) : (
            <span className="text-sm text-text-tertiary italic">No scans yet</span>
          )}

          {room.latest_status ? (
            <Badge variant={room.latest_status} />
          ) : null}
        </div>

        {/* Footer row: last scanned or "Scan now" CTA */}
        <div className="flex items-center justify-between pt-1 border-t border-border-subtle">
          {hasScans ? (
            <p className="text-xs text-text-tertiary">
              {relativeTime(room.last_scanned!)}
            </p>
          ) : (
            <span className="flex items-center gap-1 text-xs font-medium text-brand-teal group-hover:text-brand-teal-hover transition-colors">
              <Camera size={13} />
              Scan now
            </span>
          )}
          <ArrowRight size={14} className="text-text-tertiary opacity-0 group-hover:opacity-100 transition-opacity" />
        </div>
      </Link>
    </motion.div>
  );
}
