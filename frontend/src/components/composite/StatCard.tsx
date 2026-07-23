import React from 'react';
import { cn } from '@/lib/utils/formatters';

interface StatCardProps {
  label: string;
  value: string | number;
  subValue?: string;
  trend?: 'up' | 'down' | 'neutral';
  trendValue?: string;
  icon?: React.ReactNode;
  className?: string;
}

export function StatCard({
  label,
  value,
  subValue,
  trend,
  trendValue,
  icon,
  className,
}: StatCardProps) {
  return (
    <div
      className={cn(
        'flex flex-col gap-2 p-4 rounded-[var(--radius-lg)]',
        'bg-[var(--surface)] border border-[var(--border-subtle)]',
        'shadow-[var(--shadow-sm)]',
        className,
      )}
    >
      <div className="flex items-center justify-between text-[var(--text-secondary)]">
        <span className="text-sm font-medium">{label}</span>
        {icon && <span className="text-[var(--text-tertiary)]">{icon}</span>}
      </div>
      <div className="flex items-baseline gap-2">
        <span className="text-h1 font-bold text-mono text-[var(--text-primary)]">
          {value}
        </span>
        {subValue && (
          <span className="text-sm text-[var(--text-tertiary)]">{subValue}</span>
        )}
      </div>
      {trend && trendValue && (
        <div className="flex items-center gap-1.5 mt-1">
          <span
            className={cn(
              'text-xs font-medium px-1.5 py-0.5 rounded-[var(--radius-sm)]',
              trend === 'up'
                ? 'text-[var(--status-clean)] bg-[var(--status-clean-tint)]'
                : trend === 'down'
                ? 'text-[var(--status-dirty)] bg-[var(--status-dirty-tint)]'
                : 'text-[var(--text-secondary)] bg-[var(--border-subtle)]',
            )}
          >
            {trend === 'up' ? '↑' : trend === 'down' ? '↓' : '→'} {trendValue}
          </span>
          <span className="text-xs text-[var(--text-tertiary)]">vs last period</span>
        </div>
      )}
    </div>
  );
}
