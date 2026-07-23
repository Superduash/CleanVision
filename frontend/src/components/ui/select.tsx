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
            className="text-sm font-medium text-[var(--text-primary)]"
          >
            {label}
          </label>
        ) : null}
        <select
          ref={ref}
          id={selectId}
          className={cn(
            'w-full px-3 py-2.5 rounded-[var(--radius-md)]',
            'bg-[var(--surface)] border border-[var(--border-strong)]',
            'text-[var(--text-primary)] text-[16px] leading-normal',
            'font-[var(--font-body)] cursor-pointer',
            'transition-all duration-[var(--duration-fast)]',
            'focus:outline-none focus:border-[var(--brand-teal)] focus:shadow-[var(--glow-focus)]',
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
          <p className="text-xs text-[var(--status-dirty)]" role="alert">
            {error}
          </p>
        ) : null}
      </div>
    );
  },
);
Select.displayName = 'Select';
