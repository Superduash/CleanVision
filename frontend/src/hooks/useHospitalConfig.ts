import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
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
      // Backend handles Firestore read server-side — no need for client-side Firestore call
      try {
        const res = await api.getHospitalConfig();
        if (res?.config) return res.config as HospitalConfig;
      } catch {}
      return DEFAULT_HOSPITAL_CONFIG;
    },
    staleTime: 10 * 60 * 1000,  // 10 min: hospital config rarely changes
    gcTime: 60 * 60 * 1000,     // 60 min in memory
    placeholderData: () => DEFAULT_HOSPITAL_CONFIG,
  });

  const updateMutation = useMutation({
    mutationFn: async (updated: Partial<HospitalConfig>) => {
      await api.updateHospitalConfig(updated);
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
