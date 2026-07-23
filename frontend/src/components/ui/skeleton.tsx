import React from 'react';
import { cn } from '@/lib/utils/formatters';

interface SkeletonProps {
  className?: string;
  lines?: number;
}

/** Individual skeleton block with shimmer animation */
export function Skeleton({ className }: { className?: string }) {
  return (
    <div
      className={cn(
        'relative overflow-hidden rounded-[var(--radius-md)]',
        'bg-[var(--surface-raised)]',
        className,
      )}
      aria-hidden="true"
    >
      <div
        className="absolute inset-0 -translate-x-full"
        style={{
          background:
            'linear-gradient(120deg, transparent 30%, rgba(255,255,255,0.15) 50%, transparent 70%)',
          animation: 'shimmer 1.6s ease-in-out infinite',
        }}
      />
    </div>
  );
}

/** Multi-line text skeleton */
export function SkeletonText({ lines = 3, className }: SkeletonProps) {
  return (
    <div className={cn('flex flex-col gap-2', className)}>
      {Array.from({ length: lines }).map((_, i) => (
        <Skeleton
          key={i}
          className={cn('h-4', i === lines - 1 ? 'w-3/4' : 'w-full')}
        />
      ))}
    </div>
  );
}

/** Room card shaped skeleton */
export function RoomCardSkeleton() {
  return (
    <div className="p-4 rounded-[var(--radius-lg)] border border-[var(--border-subtle)] bg-[var(--surface)] flex flex-col gap-3">
      <div className="flex items-center gap-2">
        <Skeleton className="h-4 w-16" />
        <Skeleton className="h-5 w-20 rounded-[var(--radius-sm)]" />
      </div>
      <Skeleton className="h-6 w-3/4" />
      <div className="flex items-center justify-between">
        <Skeleton className="h-8 w-16" />
        <Skeleton className="h-4 w-24" />
      </div>
    </div>
  );
}

/** Block section shaped skeleton */
export function BlockSectionSkeleton() {
  return (
    <div className="flex flex-col gap-3">
      <Skeleton className="h-6 w-48" />
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3">
        {Array.from({ length: 4 }).map((_, i) => (
          <RoomCardSkeleton key={i} />
        ))}
      </div>
    </div>
  );
}

/** Timeline row shaped skeleton */
export function TimelineRowSkeleton() {
  return (
    <div className="flex items-center gap-4 py-3">
      <Skeleton className="w-12 h-12 rounded-[var(--radius-md)] shrink-0" />
      <div className="flex-1 flex flex-col gap-2">
        <Skeleton className="h-4 w-32" />
        <Skeleton className="h-3 w-24" />
      </div>
      <Skeleton className="h-6 w-16 rounded-[var(--radius-sm)]" />
    </div>
  );
}

/** Progress bar */
export function ProgressBar({
  value,
  className,
}: {
  value: number;
  className?: string;
}) {
  const clamped = Math.max(0, Math.min(100, value));
  return (
    <div
      role="progressbar"
      aria-valuenow={clamped}
      aria-valuemin={0}
      aria-valuemax={100}
      className={cn(
        'w-full h-1.5 rounded-full bg-[var(--border-subtle)] overflow-hidden',
        className,
      )}
    >
      <div
        className="h-full rounded-full bg-[var(--brand-teal)] transition-all duration-[var(--duration-base)]"
        style={{ width: `${String(clamped)}%` }}
      />
    </div>
  );
}
