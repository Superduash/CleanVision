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
      <div className="w-20 h-20 rounded-full bg-brand-teal-tint flex items-center justify-center text-brand-teal mb-5 shadow-sm border border-[var(--brand-teal-tint)]">
        {React.cloneElement(icon as React.ReactElement<{ size?: number }>, { size: 36 })}
      </div>
      <h3 className="text-h3 font-semibold text-text-primary mb-2">
        {title}
      </h3>
      <p className="text-body text-text-secondary max-w-sm mx-auto mb-6">
        {description}
      </p>
      {action && <div>{action}</div>}
    </div>
  );
}
