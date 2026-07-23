import React from 'react';
import { cn } from '@/lib/utils/formatters';
import { useThemeStore } from '@/lib/stores/themeStore';

interface SwitchProps {
  checked: boolean;
  onChange: (checked: boolean) => void;
  label?: string;
  id?: string;
  disabled?: boolean;
}

export function Switch({ checked, onChange, label, id, disabled }: SwitchProps) {
  const switchId = id ?? 'switch';
  return (
    <div className="flex items-center gap-3">
      {label ? (
        <label
          htmlFor={switchId}
          className="text-sm font-medium text-[var(--text-primary)] cursor-pointer select-none"
        >
          {label}
        </label>
      ) : null}
      <button
        id={switchId}
        role="switch"
        aria-checked={checked}
        disabled={disabled}
        onClick={() => onChange(!checked)}
        className={cn(
          'relative inline-flex h-6 w-11 items-center rounded-full',
          'transition-colors duration-[var(--duration-fast)]',
          'focus-visible:outline-none focus-visible:shadow-[var(--glow-focus)]',
          'disabled:opacity-40 disabled:cursor-not-allowed',
          'touch-manipulation',
          checked ? 'bg-[var(--brand-teal)]' : 'bg-[var(--border-strong)]',
        )}
      >
        <span
          className={cn(
            'inline-block h-5 w-5 rounded-full bg-white shadow-sm',
            'transition-transform duration-[var(--duration-fast)]',
            checked ? 'translate-x-5' : 'translate-x-0.5',
          )}
        />
      </button>
    </div>
  );
}

/** Theme switch that hooks directly into the theme store */
export function ThemeSwitch() {
  const { resolvedTheme, toggleTheme } = useThemeStore();
  return (
    <Switch
      checked={resolvedTheme === 'dark'}
      onChange={toggleTheme}
      label={resolvedTheme === 'dark' ? 'Dark mode' : 'Light mode'}
    />
  );
}
