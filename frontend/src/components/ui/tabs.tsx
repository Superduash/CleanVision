import React, { useState } from 'react';
import { cn } from '@/lib/utils/formatters';

interface TabsProps {
  tabs: { label: string; value: string }[];
  value: string;
  onChange: (value: string) => void;
  className?: string;
}

export function Tabs({ tabs, value, onChange, className }: TabsProps) {
  return (
    <div
      role="tablist"
      className={cn(
        'inline-flex bg-[var(--border-subtle)] rounded-[var(--radius-md)] p-0.5 gap-0.5',
        className,
      )}
    >
      {tabs.map((tab) => {
        const isActive = tab.value === value;
        return (
          <button
            key={tab.value}
            role="tab"
            aria-selected={isActive}
            onClick={() => onChange(tab.value)}
            className={cn(
              'px-3 py-1.5 rounded-[var(--radius-sm)] text-sm font-medium',
              'transition-all duration-[var(--duration-fast)]',
              'focus-visible:outline-none focus-visible:shadow-[var(--glow-focus)]',
              'min-h-[36px] touch-manipulation',
              isActive
                ? 'bg-[var(--surface)] text-[var(--text-primary)] shadow-[var(--shadow-sm)]'
                : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)]',
            )}
          >
            {tab.label}
          </button>
        );
      })}
    </div>
  );
}

interface TextareaProps extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  label?: string;
  error?: string;
}

export const Textarea = React.forwardRef<HTMLTextAreaElement, TextareaProps>(
  ({ label, error, className, id, ...props }, ref) => {
    const textareaId = id ?? label?.toLowerCase().replace(/\s+/g, '-');
    return (
      <div className="flex flex-col gap-1.5">
        {label ? (
          <label
            htmlFor={textareaId}
            className="text-sm font-medium text-[var(--text-primary)]"
          >
            {label}
          </label>
        ) : null}
        <textarea
          ref={ref}
          id={textareaId}
          className={cn(
            'w-full px-3 py-2.5 rounded-[var(--radius-md)] resize-y min-h-[100px]',
            'bg-[var(--surface)] border border-[var(--border-strong)]',
            'text-[var(--text-primary)] placeholder:text-[var(--text-tertiary)]',
            'text-[16px] leading-normal font-[var(--font-body)]',
            'transition-all duration-[var(--duration-fast)]',
            'focus:outline-none focus:border-[var(--brand-teal)] focus:shadow-[var(--glow-focus)]',
            'disabled:opacity-40 disabled:cursor-not-allowed',
            error ? 'border-[var(--status-dirty)]' : '',
            className,
          )}
          {...props}
        />
        {error ? (
          <p className="text-xs text-[var(--status-dirty)]" role="alert">
            {error}
          </p>
        ) : null}
      </div>
    );
  },
);
Textarea.displayName = 'Textarea';

interface PopoverProps {
  trigger: React.ReactNode;
  children: React.ReactNode;
  align?: 'left' | 'right';
}

export function Popover({ trigger, children, align = 'right' }: PopoverProps) {
  const [open, setOpen] = useState(false);

  return (
    <div className="relative">
      <div onClick={() => setOpen((o) => !o)}>{trigger}</div>
      {open ? (
        <>
          <div
            className="fixed inset-0 z-30"
            onClick={() => setOpen(false)}
            aria-hidden="true"
          />
          <div
            className={cn(
              'absolute z-40 mt-2 w-max min-w-[200px]',
              'bg-[var(--surface-raised)] rounded-[var(--radius-lg)]',
              'border border-[var(--border-subtle)] shadow-[var(--shadow-lg)]',
              'p-2',
              align === 'right' ? 'right-0' : 'left-0',
            )}
          >
            {children}
          </div>
        </>
      ) : null}
    </div>
  );
}

interface TooltipProps {
  content: string;
  children: React.ReactNode;
}

export function Tooltip({ content, children }: TooltipProps) {
  const [visible, setVisible] = useState(false);
  return (
    <div
      className="relative inline-flex"
      onMouseEnter={() => setVisible(true)}
      onMouseLeave={() => setVisible(false)}
      onFocus={() => setVisible(true)}
      onBlur={() => setVisible(false)}
    >
      {children}
      {visible ? (
        <div
          role="tooltip"
          className={cn(
            'absolute bottom-full left-1/2 -translate-x-1/2 mb-2 z-50',
            'px-2 py-1 rounded-[var(--radius-sm)]',
            'bg-[var(--text-primary)] text-[var(--canvas)] text-xs',
            'whitespace-nowrap pointer-events-none',
          )}
        >
          {content}
        </div>
      ) : null}
    </div>
  );
}
