import React, { useEffect, useRef } from 'react';
import { motion, AnimatePresence, useDragControls } from 'motion/react';
import { X } from 'lucide-react';
import { cn } from '@/lib/utils/formatters';
import { Dialog } from './dialog';

interface BottomSheetProps {
  open: boolean;
  onClose: () => void;
  title: string;
  children: React.ReactNode;
  className?: string;
}

export function BottomSheet({
  open,
  onClose,
  title,
  children,
  className,
}: BottomSheetProps) {
  const dragControls = useDragControls();
  const sheetRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [open, onClose]);

  useEffect(() => {
    if (open) document.body.style.overflow = 'hidden';
    else document.body.style.overflow = '';
    return () => { document.body.style.overflow = ''; };
  }, [open]);

  return (
    <AnimatePresence>
      {open ? (
        <>
          {/* Backdrop */}
          <motion.div
            key="bs-backdrop"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="fixed inset-0 z-50 bg-black/40"
            onClick={onClose}
            aria-hidden="true"
          />
          {/* Sheet */}
          <motion.div
            key="bs-sheet"
            ref={sheetRef}
            role="dialog"
            aria-modal="true"
            aria-labelledby="sheet-title"
            drag="y"
            dragControls={dragControls}
            dragConstraints={{ top: 0 }}
            dragElastic={{ top: 0, bottom: 0.3 }}
            onDragEnd={(_e, info) => {
              if (info.offset.y > 100) onClose();
            }}
            initial={{ y: '100%' }}
            animate={{ y: 0 }}
            exit={{ y: '100%' }}
            transition={{ type: 'spring', stiffness: 300, damping: 30 }}
            style={{ paddingBottom: 'max(var(--safe-bottom), 16px)' }}
            className={cn(
              'fixed bottom-0 left-0 right-0 z-50',
              'bg-[var(--surface)] rounded-t-[var(--radius-xl)]',
              'border-t border-[var(--border-subtle)] shadow-[var(--shadow-lg)]',
              'max-h-[90dvh] flex flex-col',
              className,
            )}
          >
            {/* Drag handle */}
            <div
              className="flex justify-center pt-3 pb-1 cursor-grab active:cursor-grabbing"
              onPointerDown={(e) => dragControls.start(e)}
            >
              <div className="w-10 h-1 rounded-full bg-[var(--border-strong)]" />
            </div>
            {/* Header */}
            <div className="flex items-center justify-between px-6 py-4">
              <h2
                id="sheet-title"
                className="text-h3 text-[var(--text-primary)]"
              >
                {title}
              </h2>
              <button
                onClick={onClose}
                aria-label="Close"
                className={cn(
                  'w-8 h-8 flex items-center justify-center',
                  'rounded-[var(--radius-md)] text-[var(--text-secondary)]',
                  'hover:bg-[var(--border-subtle)] transition-colors',
                  'focus-visible:outline-none focus-visible:shadow-[var(--glow-focus)]',
                )}
              >
                <X size={18} aria-hidden="true" />
              </button>
            </div>
            {/* Content */}
            <div className="px-6 pb-4 overflow-y-auto">{children}</div>
          </motion.div>
        </>
      ) : null}
    </AnimatePresence>
  );
}

/**
 * Responsive modal: Dialog on desktop (≥640px), BottomSheet on mobile.
 * This replaces all Dialog usage for forms with more than 2 fields.
 */
export function ResponsiveModal({
  open,
  onClose,
  title,
  children,
  className,
}: BottomSheetProps) {
  const [isMobile, setIsMobile] = React.useState(
    typeof window !== 'undefined' ? window.innerWidth < 640 : false,
  );

  useEffect(() => {
    const mq = window.matchMedia('(max-width: 639px)');
    const handler = (e: MediaQueryListEvent) => setIsMobile(e.matches);
    mq.addEventListener('change', handler);
    setIsMobile(mq.matches);
    return () => mq.removeEventListener('change', handler);
  }, []);

  if (isMobile) {
    return (
      <BottomSheet
        open={open}
        onClose={onClose}
        title={title}
        className={className}
      >
        {children}
      </BottomSheet>
    );
  }

  return (
    <Dialog
      open={open}
      onClose={onClose}
      title={title}
      className={className}
    >
      {children}
    </Dialog>
  );
}
