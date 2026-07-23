import { create } from 'zustand';

interface OfflineQueueStore {
  pendingScans: number;
  isOnline: boolean;
  setPendingScans: (count: number) => void;
  incrementPending: () => void;
  decrementPending: () => void;
  setOnline: (online: boolean) => void;
}

export const useOfflineQueueStore = create<OfflineQueueStore>((set, get) => ({
  pendingScans: 0,
  isOnline: typeof navigator !== 'undefined' ? navigator.onLine : true,

  setPendingScans: (count) => set({ pendingScans: count }),
  incrementPending: () => set({ pendingScans: get().pendingScans + 1 }),
  decrementPending: () =>
    set({ pendingScans: Math.max(0, get().pendingScans - 1) }),
  setOnline: (online) => set({ isOnline: online }),
}));

// Wire up online/offline events
if (typeof window !== 'undefined') {
  window.addEventListener('online', () => {
    useOfflineQueueStore.getState().setOnline(true);
  });
  window.addEventListener('offline', () => {
    useOfflineQueueStore.getState().setOnline(false);
  });
}
