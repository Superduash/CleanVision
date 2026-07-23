import { create } from 'zustand';
import { persist } from 'zustand/middleware';

interface StaffNameStore {
  staffName: string;
  setStaffName: (name: string) => void;
}

export const useStaffNameStore = create<StaffNameStore>()(
  persist(
    (set) => ({
      staffName: '',
      setStaffName: (name) => set({ staffName: name }),
    }),
    { name: 'cv-staff-name' },
  ),
);
