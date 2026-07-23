import React from 'react';
import { Link } from 'react-router-dom';
import { useQueryClient } from '@tanstack/react-query';
import { motion } from 'motion/react';
import { Badge } from '@/components/ui/badge';
import { relativeTime, formatScore } from '@/lib/utils/formatters';
import { prefetchRoom } from '@/lib/api/hooks';
import type { Room } from '@/lib/api/types';

interface RoomCardProps {
  room: Room;
}

export function RoomCard({ room }: RoomCardProps) {
  const queryClient = useQueryClient();

  const handleMouseEnter = () => {
    prefetchRoom(queryClient, room.id);
  };

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
          'group flex flex-col gap-3 p-4 rounded-lg',
          'bg-surface border border-border-subtle',
          'shadow-sm hover:shadow-md',
          'hover:border-brand-teal/15',
          'transition-all duration-fast no-underline',
          'focus-visible:outline-none focus-visible:shadow-glow-focus',
          'block',
        ].join(' ')}
      >
        {/* Block label */}
        <span className="text-caption text-text-tertiary">
          {room.block}
        </span>

        {/* Room name */}
        <h3
          className="text-body-lg font-semibold text-text-primary truncate"
          title={room.name}
        >
          {room.name}
        </h3>

        {/* Score + status */}
        <div className="flex items-center justify-between gap-2">
          {room.latest_score != null ? (
            <span
              className="text-display-lg font-bold text-mono text-text-primary"
            >
              {formatScore(room.latest_score)}
            </span>
          ) : (
            <span className="text-sm text-text-tertiary">No scans yet</span>
          )}

          {room.latest_status ? (
            <Badge variant={room.latest_status} />
          ) : null}
        </div>

        {/* Last scanned */}
        {room.last_scanned ? (
          <p className="text-xs text-text-tertiary">
            {relativeTime(room.last_scanned)}
          </p>
        ) : (
          <p className="text-xs text-text-tertiary">Never scanned</p>
        )}
      </Link>
    </motion.div>
  );
}
