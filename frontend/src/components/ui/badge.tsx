import React from 'react';
import { CheckCircle2, AlertTriangle, XCircle, Info } from 'lucide-react';
import { cn } from '@/lib/utils/formatters';
import type { Status } from '@/lib/api/types';

type BadgeVariant = Status | 'info';

const config: Record<
  BadgeVariant,
  { icon: React.ReactNode; label: string; color: string; bg: string }
> = {
  clean: {
    icon: <CheckCircle2 size={12} aria-hidden="true" />,
    label: 'Clean',
    color: 'text-status-clean',
    bg: 'bg-status-clean-tint',
  },
  needs_attention: {
    icon: <AlertTriangle size={12} aria-hidden="true" />,
    label: 'Needs Attention',
    color: 'text-status-attention',
    bg: 'bg-status-attention-tint',
  },
  dirty: {
    icon: <XCircle size={12} aria-hidden="true" />,
    label: 'Dirty',
    color: 'text-status-dirty',
    bg: 'bg-status-dirty-tint',
  },
  info: {
    icon: <Info size={12} aria-hidden="true" />,
    label: 'Info',
    color: 'text-status-info',
    bg: 'bg-status-info-tint',
  },
};

interface BadgeProps {
  variant: BadgeVariant;
  label?: string;
  className?: string;
}

/** Status pill with text label + icon — never color alone (accessibility) */
export function Badge({ variant, label, className }: BadgeProps) {
  const c = config[variant];
  return (
    <span
      className={cn(
        'inline-flex items-center gap-1 px-2 py-0.5',
        'rounded-sm',
        'text-caption font-medium',
        c.color,
        c.bg,
        // Minimum 44px touch target via padding expansion when needed
        'min-h-[24px]',
        className,
      )}
    >
      {c.icon}
      {label ?? c.label}
    </span>
  );
}

interface ChipProps {
  label: string;
  onDismiss?: () => void;
  active?: boolean;
  onClick?: () => void;
  className?: string;
}

/** Dismissible filter chip — used for block filters */
export function Chip({ label, onDismiss, active, onClick, className }: ChipProps) {
  return (
    <button
      onClick={onClick}
      className={cn(
        'inline-flex items-center gap-1.5 px-3 py-1.5',
        'rounded-md text-sm font-medium border',
        'transition-all duration-fast',
        'focus-visible:outline-none focus-visible:shadow-glow-focus',
        'touch-manipulation min-h-[44px]',
        active
          ? 'bg-brand-teal-tint text-brand-teal border-[var(--brand-teal)]'
          : 'bg-surface text-text-secondary border-border-strong hover:border-[var(--brand-teal)] hover:text-brand-teal hover:bg-brand-teal-tint/30',
        className,
      )}
    >
      {label}
      {onDismiss ? (
        <span
          role="button"
          aria-label={`Remove ${label} filter`}
          onClick={(e) => {
            e.stopPropagation();
            onDismiss();
          }}
          className="text-text-tertiary hover:text-text-primary leading-none"
        >
          ×
        </span>
      ) : null}
    </button>
  );
}
