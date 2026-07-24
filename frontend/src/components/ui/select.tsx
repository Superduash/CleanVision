import React from 'react';
import { cn } from '@/lib/utils/formatters';

interface SelectProps extends React.SelectHTMLAttributes<HTMLSelectElement> {
  label?: string;
  error?: string;
  options: { value: string; label: string }[];
  placeholder?: string;
}

export const Select = React.forwardRef<HTMLSelectElement, SelectProps>(
  ({ label, error, options, placeholder, className, id, ...props }, ref) => {
    const selectId = id ?? label?.toLowerCase().replace(/\s+/g, '-');
    return (
      <div className="flex flex-col gap-1.5">
        {label ? (
          <label
            htmlFor={selectId}
            className="text-sm font-medium text-text-primary"
          >
            {label}
          </label>
        ) : null}
        <select
          ref={ref}
          id={selectId}
          className={cn(
            'w-full px-3 py-2.5 rounded-md',
            'bg-surface border border-border-strong',
            'text-text-primary text-[16px] leading-normal',
            'font-sans cursor-pointer',
            'transition-all duration-fast',
            'focus:outline-none focus:border-brand-teal focus:shadow-glow-focus',
            'disabled:opacity-40 disabled:cursor-not-allowed',
            'min-h-[44px]',
            error ? 'border-[var(--status-dirty)]' : '',
            className,
          )}
          {...props}
        >
          {placeholder ? (
            <option value="" disabled>
              {placeholder}
            </option>
          ) : null}
          {options.map((opt) => (
            <option key={opt.value} value={opt.value}>
              {opt.label}
            </option>
          ))}
        </select>
        {error ? (
          <p className="text-xs text-status-dirty" role="alert">
            {error}
          </p>
        ) : null}
      </div>
    );
  },
);
Select.displayName = 'Select';
