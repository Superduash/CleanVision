import React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { AlertTriangle, CheckCircle, Info } from 'lucide-react';
import type { Status } from '@/lib/api/types';

interface FloatingStatusButtonProps {
  status: Status;
  onClick: () => void;
  visible: boolean;
}

export function FloatingStatusButton({ status, onClick, visible }: FloatingStatusButtonProps) {
  const getProps = () => {
    switch (status) {
      case 'dirty':
      case 'needs_attention':
        return {
          icon: <AlertTriangle size={18} />,
          bg: 'bg-[var(--status-attention)]',
          text: 'text-white',
          label: 'Needs Attention'
        };
      case 'clean':
        return {
          icon: <CheckCircle size={18} />,
          bg: 'bg-[var(--status-clean)]',
          text: 'text-white',
          label: 'Clean'
        };
      default:
        return {
          icon: <Info size={18} />,
          bg: 'bg-[var(--status-info)]',
          text: 'text-white',
          label: 'Info'
        };
    }
  };

  const { icon, bg, text, label } = getProps();

  return (
    <AnimatePresence>
      {visible && (
        <motion.button
          initial={{ y: 50, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: 50, opacity: 0 }}
          whileTap={{ scale: 0.95 }}
          onClick={onClick}
          className={`floating-status fixed z-30 bottom-[calc(env(safe-area-inset-bottom,0px)+5rem)] md:bottom-8 left-1/2 -translate-x-1/2 flex items-center gap-2 px-4 py-2.5 rounded-full shadow-[var(--shadow-md)] ${bg} ${text} font-medium text-sm`}
          style={{ paddingBottom: 'max(10px, env(safe-area-inset-bottom, 0px))' }} // Extra safety for floating on mobile
        >
          {icon}
          {label}
        </motion.button>
      )}
    </AnimatePresence>
  );
}
