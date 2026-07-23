import React, { createContext, useContext, useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { CheckCircle2, AlertTriangle, XCircle, Info, X } from 'lucide-react';
import { cn } from '@/lib/utils/formatters';

type ToastType = 'success' | 'error' | 'warning' | 'info';

interface Toast {
  id: string;
  message: string;
  type: ToastType;
  duration?: number;
}

interface ToastContextValue {
  toast: (message: string, type?: ToastType, duration?: number) => void;
}

const ToastContext = createContext<ToastContextValue | null>(null);

export function useToast() {
  const ctx = useContext(ToastContext);
  if (!ctx) throw new Error('useToast must be used within ToastProvider');
  return ctx;
}

const typeConfig: Record<ToastType, { icon: React.ReactNode; bg: string; border: string }> = {
  success: {
    icon: <CheckCircle2 size={16} className="text-[var(--brand-teal)]" aria-hidden="true" />,
    bg: 'bg-[var(--surface)]',
    border: 'border-[var(--brand-teal-tint)]',
  },
  error: {
    icon: <XCircle size={16} className="text-[var(--status-dirty)]" aria-hidden="true" />,
    bg: 'bg-[var(--surface)]',
    border: 'border-[var(--status-dirty-tint)]',
  },
  warning: {
    icon: <AlertTriangle size={16} className="text-[var(--status-attention)]" aria-hidden="true" />,
    bg: 'bg-[var(--surface)]',
    border: 'border-[var(--status-attention-tint)]',
  },
  info: {
    icon: <Info size={16} className="text-[var(--status-info)]" aria-hidden="true" />,
    bg: 'bg-[var(--surface)]',
    border: 'border-[var(--status-info-tint)]',
  },
};

function ToastItem({
  toast: t,
  onDismiss,
}: {
  toast: Toast;
  onDismiss: (id: string) => void;
}) {
  const config = typeConfig[t.type];
  const duration = t.duration ?? 4000;

  React.useEffect(() => {
    const timer = setTimeout(() => onDismiss(t.id), duration);
    return () => clearTimeout(timer);
  }, [t.id, duration, onDismiss]);

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 20, scale: 0.95 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, y: 10, scale: 0.95 }}
      transition={{ type: 'spring', stiffness: 300, damping: 30 }}
      role="status"
      aria-live="polite"
      className={cn(
        'relative flex items-start gap-3 px-4 py-3',
        'rounded-[var(--radius-lg)] border shadow-[var(--shadow-md)]',
        'min-w-[260px] max-w-[360px]',
        config.bg,
        config.border,
        'overflow-hidden',
      )}
    >
      <span className="mt-0.5 shrink-0">{config.icon}</span>
      <p className="text-sm text-[var(--text-primary)] flex-1">{t.message}</p>
      <button
        onClick={() => onDismiss(t.id)}
        aria-label="Dismiss notification"
        className={cn(
          'shrink-0 text-[var(--text-tertiary)] hover:text-[var(--text-primary)]',
          'transition-colors duration-[var(--duration-fast)]',
          'focus-visible:outline-none focus-visible:shadow-[var(--glow-focus)]',
          'rounded-sm',
        )}
      >
        <X size={14} aria-hidden="true" />
      </button>
      {/* Auto-dismiss progress bar */}
      <motion.div
        className="absolute bottom-0 left-0 h-0.5 bg-[var(--brand-teal)] opacity-40"
        initial={{ width: '100%' }}
        animate={{ width: '0%' }}
        transition={{ duration: duration / 1000, ease: 'linear' }}
      />
    </motion.div>
  );
}

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([]);

  const dismiss = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const toast = useCallback(
    (message: string, type: ToastType = 'success', duration?: number) => {
      const id = `toast-${String(Date.now())}-${String(Math.random())}`;
      setToasts((prev) => [...prev.slice(-4), { id, message, type, duration }]);
    },
    [],
  );

  return (
    <ToastContext.Provider value={{ toast }}>
      {children}
      {/* Toast stack — bottom-right on desktop, bottom-center on mobile */}
      <div
        aria-label="Notifications"
        className={cn(
          'fixed z-[100] flex flex-col gap-2 pointer-events-none',
          'bottom-safe right-4 items-end',
          // Mobile: center
          'max-sm:right-1/2 max-sm:translate-x-1/2 max-sm:items-center',
        )}
        style={{ paddingBottom: 'max(var(--safe-bottom), 80px)' }}
      >
        <AnimatePresence mode="popLayout">
          {toasts.map((t) => (
            <div key={t.id} className="pointer-events-auto">
              <ToastItem toast={t} onDismiss={dismiss} />
            </div>
          ))}
        </AnimatePresence>
      </div>
    </ToastContext.Provider>
  );
}
