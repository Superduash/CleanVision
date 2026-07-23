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
    color: 'text-[var(--status-clean)]',
    bg: 'bg-[var(--status-clean-tint)]',
  },
  needs_attention: {
    icon: <AlertTriangle size={12} aria-hidden="true" />,
    label: 'Needs Attention',
    color: 'text-[var(--status-attention)]',
    bg: 'bg-[var(--status-attention-tint)]',
  },
  dirty: {
    icon: <XCircle size={12} aria-hidden="true" />,
    label: 'Dirty',
    color: 'text-[var(--status-dirty)]',
    bg: 'bg-[var(--status-dirty-tint)]',
  },
  info: {
    icon: <Info size={12} aria-hidden="true" />,
    label: 'Info',
    color: 'text-[var(--status-info)]',
    bg: 'bg-[var(--status-info-tint)]',
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
        'rounded-[var(--radius-sm)]',
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
        'rounded-[var(--radius-sm)] text-sm font-medium border',
        'transition-all duration-[var(--duration-fast)]',
        'focus-visible:outline-none focus-visible:shadow-[var(--glow-focus)]',
        'touch-manipulation min-h-[36px]',
        active
          ? 'bg-[var(--brand-teal-tint)] text-[var(--brand-teal)] border-[var(--brand-teal)]'
          : 'bg-[var(--surface)] text-[var(--text-secondary)] border-[var(--border-strong)] hover:border-[var(--brand-teal)] hover:text-[var(--brand-teal)]',
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
          className="text-[var(--text-tertiary)] hover:text-[var(--text-primary)] leading-none"
        >
          ×
        </span>
      ) : null}
    </button>
  );
}
