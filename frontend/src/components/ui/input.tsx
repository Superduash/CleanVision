import React from 'react';
import { cn } from '@/lib/utils/formatters';

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  hint?: string;
}

export const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ label, error, hint, className, id, ...props }, ref) => {
    const inputId = id ?? label?.toLowerCase().replace(/\s+/g, '-');
    return (
      <div className="flex flex-col gap-1.5">
        {label ? (
          <label
            htmlFor={inputId}
            className="text-sm font-medium text-text-primary"
          >
            {label}
          </label>
        ) : null}
        <input
          ref={ref}
          id={inputId}
          className={cn(
            // font-size 16px minimum prevents iOS Safari zoom on focus
            'w-full px-3 py-2.5 rounded-md',
            'bg-surface border border-border-strong',
            'text-text-primary placeholder:text-text-tertiary',
            'text-[16px] leading-normal font-sans',
            'transition-all duration-fast',
            'focus:outline-none focus:border-brand-teal focus:shadow-glow-focus',
            'disabled:opacity-40 disabled:cursor-not-allowed',
            error
              ? 'border-status-dirty focus:shadow-[0_0_0_3px_var(--color-status-dirty-tint)]'
              : '',
            'min-h-[44px]', // minimum touch target
            className,
          )}
          {...props}
        />
        {error ? (
          <p className="text-xs text-status-dirty" role="alert">
            {error}
          </p>
        ) : hint ? (
          <p className="text-xs text-text-tertiary">{hint}</p>
        ) : null}
      </div>
    );
  },
);
Input.displayName = 'Input';
