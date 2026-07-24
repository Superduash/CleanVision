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
        'flex flex-col gap-2 p-4 rounded-lg',
        'bg-surface border border-border-subtle',
        'shadow-sm',
        className,
      )}
    >
      <div className="flex items-center justify-between text-text-secondary">
        <span className="text-sm font-medium">{label}</span>
        {icon && <span className="text-text-tertiary">{icon}</span>}
      </div>
      <div className="flex items-baseline gap-2">
        <span className="text-h1 font-bold text-mono text-text-primary">
          {value}
        </span>
        {subValue && (
          <span className="text-sm text-text-tertiary">{subValue}</span>
        )}
      </div>
      {trend && trendValue && (
        <div className="flex items-center gap-1.5 mt-1">
          <span
            className={cn(
              'text-xs font-medium px-1.5 py-0.5 rounded-sm',
              trend === 'up'
                ? 'text-status-clean bg-status-clean-tint'
                : trend === 'down'
                ? 'text-status-dirty bg-status-dirty-tint'
                : 'text-text-secondary bg-[var(--border-subtle)]',
            )}
          >
            {trend === 'up' ? '↑' : trend === 'down' ? '↓' : '→'} {trendValue}
          </span>
          <span className="text-xs text-text-tertiary">vs last period</span>
        </div>
      )}
    </div>
  );
}
