import React from 'react';
import { BlockSectionSkeleton } from '@/components/ui/skeleton';

export function DashboardSkeleton() {
  return (
    <div className="flex flex-col gap-6">
      <BlockSectionSkeleton />
      <BlockSectionSkeleton />
    </div>
  );
}
