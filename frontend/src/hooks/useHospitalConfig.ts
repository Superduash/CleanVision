import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { doc, getDoc, setDoc, serverTimestamp } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { api } from "@/lib/api";

export interface HospitalConfig {
  hospitalName: string;
  hospitalCode: string;
  blocks: string[];
  supportEmail: string;
  logoUrl: string | null;
  updatedAt?: string;
}

export const DEFAULT_HOSPITAL_CONFIG: HospitalConfig = {
  hospitalName: "City General Hospital",
  hospitalCode: "CGH",
  blocks: ["Block A", "Block B", "Block C", "Block D"],
  supportEmail: "support@cleanvision.com",
  logoUrl: null,
};

export const CURRENT_HOSPITAL_ID = "default";

export function useHospitalConfig() {
  const queryClient = useQueryClient();

  const query = useQuery<HospitalConfig>({
    queryKey: ["hospital-config"],
    queryFn: async () => {
      // 1. Try Firestore client read
      try {
        if (db) {
          const docRef = doc(db, "hospitalConfig", "main");
          const snap = await getDoc(docRef);
          if (snap.exists()) {
            return snap.data() as HospitalConfig;
          }
        }
      } catch (err) {
        console.warn("Firestore hospitalConfig read failed, falling back to backend API:", err);
      }

      // 2. Fallback to backend endpoint
      try {
        const res = await api.getHospitalConfig();
        if (res?.config) return res.config;
      } catch {}

      return DEFAULT_HOSPITAL_CONFIG;
    },
    staleTime: 60_000,
    gcTime: 10 * 60 * 1000,
  });

  const updateMutation = useMutation({
    mutationFn: async (updated: Partial<HospitalConfig>) => {
      // Send write through backend endpoint to ensure server authorization
      await api.updateHospitalConfig(updated);

      // Also mirror to local Firestore if available
      try {
        if (db) {
          const docRef = doc(db, "hospitalConfig", "main");
          await setDoc(
            docRef,
            {
              ...updated,
              updatedAt: serverTimestamp(),
            },
            { merge: true }
          );
        }
      } catch {}
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["hospital-config"] });
    },
  });

  return {
    config: query.data ?? DEFAULT_HOSPITAL_CONFIG,
    isLoading: query.isLoading,
    updateConfig: updateMutation.mutateAsync,
    isUpdating: updateMutation.isPending,
  };
}
