import React from 'react';
import { WifiOff, UploadCloud } from 'lucide-react';
import { useOfflineQueueStore } from '@/lib/stores/offlineQueueStore';
import { motion, AnimatePresence } from 'motion/react';

export function OfflineBanner() {
  const { isOnline, pendingScans } = useOfflineQueueStore();

  return (
    <AnimatePresence>
      {!isOnline && (
        <motion.div
          initial={{ height: 0, opacity: 0 }}
          animate={{ height: 'auto', opacity: 1 }}
          exit={{ height: 0, opacity: 0 }}
          className="bg-[var(--status-attention)] text-white overflow-hidden z-50 relative"
        >
          <div className="px-4 py-2 flex items-center justify-between max-w-7xl mx-auto text-sm font-medium">
            <div className="flex items-center gap-2">
              <WifiOff size={16} aria-hidden="true" />
              <span>You are offline</span>
            </div>
            
            {pendingScans > 0 && (
              <div className="flex items-center gap-1.5 bg-black/20 px-2 py-0.5 rounded-full text-xs">
                <UploadCloud size={14} />
                <span>{pendingScans} pending</span>
              </div>
            )}
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
