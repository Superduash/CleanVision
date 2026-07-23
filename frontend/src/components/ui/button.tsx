import React from 'react';
import { cn } from '@/lib/utils/formatters';
import { Loader2 } from 'lucide-react';

type ButtonVariant = 'primary' | 'secondary' | 'ghost' | 'destructive' | 'icon-only';
type ButtonSize = 'sm' | 'md' | 'lg' | 'icon-only';

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  size?: ButtonSize;
  loading?: boolean;
  children: React.ReactNode;
}

const variantStyles: Record<ButtonVariant, string> = {
  primary: [
    'bg-[var(--brand-teal)] text-white',
    'hover:bg-[var(--brand-teal-hover)] hover:-translate-y-0.5',
    'active:scale-[0.97]',
    'focus-visible:outline-none focus-visible:shadow-[var(--glow-focus)]',
    'disabled:opacity-40 disabled:cursor-not-allowed disabled:transform-none',
  ].join(' '),

  secondary: [
    'bg-[var(--surface)] text-[var(--text-primary)] border border-[var(--border-strong)]',
    'hover:bg-[var(--brand-teal-tint)] hover:border-[var(--brand-teal)] hover:-translate-y-0.5',
    'active:scale-[0.97]',
    'focus-visible:outline-none focus-visible:shadow-[var(--glow-focus)]',
    'disabled:opacity-40 disabled:cursor-not-allowed disabled:transform-none',
  ].join(' '),

  ghost: [
    'bg-transparent text-[var(--text-secondary)]',
    'hover:bg-[var(--border-subtle)] hover:text-[var(--text-primary)]',
    'active:scale-[0.97]',
    'focus-visible:outline-none focus-visible:shadow-[var(--glow-focus)]',
    'disabled:opacity-40 disabled:cursor-not-allowed disabled:transform-none',
  ].join(' '),

  destructive: [
    'bg-[var(--status-dirty)] text-white',
    'hover:opacity-90 hover:-translate-y-0.5',
    'active:scale-[0.97]',
    'focus-visible:outline-none focus-visible:shadow-[0_0_0_3px_var(--status-dirty-tint)]',
    'disabled:opacity-40 disabled:cursor-not-allowed disabled:transform-none',
  ].join(' '),

  'icon-only': [
    'bg-transparent text-[var(--text-secondary)] p-0',
    'hover:text-[var(--text-primary)] hover:bg-[var(--border-subtle)]',
    'active:scale-[0.97]',
    'focus-visible:outline-none focus-visible:shadow-[var(--glow-focus)]',
    'disabled:opacity-40 disabled:cursor-not-allowed disabled:transform-none',
  ].join(' '),
};

const sizeStyles: Record<ButtonSize, string> = {
  sm: 'px-3 py-1.5 text-sm min-h-[36px]',
  md: 'px-4 py-2 text-sm min-h-[44px]',
  lg: 'px-6 py-3 text-base min-h-[52px]',
  'icon-only': 'w-11 h-11',
};

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  (
    {
      variant = 'primary',
      size = 'md',
      loading = false,
      disabled,
      children,
      className,
      ...props
    },
    ref,
  ) => {
    return (
      <button
        ref={ref}
        disabled={disabled || loading}
        className={cn(
          'inline-flex items-center justify-center gap-2 font-medium',
          'rounded-[var(--radius-md)] transition-all',
          'duration-[var(--duration-fast)] ease-[var(--ease-out)]',
          'select-none whitespace-nowrap touch-manipulation',
          variantStyles[variant],
          variant !== 'icon-only' ? sizeStyles[size] : 'w-11 h-11 rounded-[var(--radius-md)]',
          className,
        )}
        {...props}
      >
        {loading ? (
          <Loader2
            className="animate-spin"
            size={16}
            aria-hidden="true"
          />
        ) : null}
        {children}
      </button>
    );
  },
);
Button.displayName = 'Button';
