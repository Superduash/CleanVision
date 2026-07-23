import React from 'react';
import { cn } from '@/lib/utils/formatters';

interface EmptyStateProps {
  icon: React.ReactNode;
  title: string;
  description: string;
  action?: React.ReactNode;
  className?: string;
}

export function EmptyState({ icon, title, description, action, className }: EmptyStateProps) {
  return (
    <div className={cn('flex flex-col items-center justify-center p-8 text-center', className)}>
      <div className="w-16 h-16 rounded-full bg-[var(--surface-raised)] flex items-center justify-center text-[var(--text-tertiary)] mb-4 shadow-sm border border-[var(--border-subtle)]">
        {React.cloneElement(icon as React.ReactElement<any>, { size: 32 })}
      </div>
      <h3 className="text-h3 font-semibold text-[var(--text-primary)] mb-2">
        {title}
      </h3>
      <p className="text-body text-[var(--text-secondary)] max-w-sm mx-auto mb-6">
        {description}
      </p>
      {action && <div>{action}</div>}
    </div>
  );
}
