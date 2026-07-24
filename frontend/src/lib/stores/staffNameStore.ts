import { create } from 'zustand';
import { persist } from 'zustand/middleware';

interface StaffNameStore {
  staffName: string;
  hasHydrated: boolean;
  setStaffName: (name: string) => void;
  setHasHydrated: (v: boolean) => void;
}

export const useStaffNameStore = create<StaffNameStore>()(
  persist(
    (set) => ({
      staffName: '',
      hasHydrated: false,
      setStaffName: (name) => set({ staffName: name }),
      setHasHydrated: (v) => set({ hasHydrated: v }),
    }),
    {
      name: 'cv-staff-name',
      onRehydrateStorage: () => (state) => {
        if (state) {
          state.setHasHydrated(true);
        }
      },
    },
  ),
);
