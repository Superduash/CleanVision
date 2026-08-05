import { useQuery } from "@tanstack/react-query";
import { api } from "@/lib/api";

export function useRooms(block?: string) {
  return useQuery({
    queryKey: ["rooms", block || "all"],
    queryFn: () => api.listRooms(block),
    staleTime: 30_000,
    refetchOnWindowFocus: false,
    select: (data) => data?.rooms ?? [],
  });
}

export function useRoom(roomId: string | number) {
  return useQuery({
    queryKey: ["room", String(roomId)],
    queryFn: () => api.getRoom(roomId),
    enabled: !!roomId,
    staleTime: 30_000,
    select: (data) => data?.room,
  });
}

export function useRoomHistory(roomId: string | number) {
  return useQuery({
    queryKey: ["history", String(roomId)],
    queryFn: () => api.getHistory(roomId),
    enabled: !!roomId,
    staleTime: 30_000,
    refetchOnWindowFocus: false,
    select: (data) => data?.history ?? [],
  });
}

export function useSummary() {
  return useQuery({
    queryKey: ["summary"],
    queryFn: () => api.getSummary(),
    staleTime: 30_000,
    refetchOnWindowFocus: false,
  });
}

export function useReports(days: number) {
  return useQuery({
    queryKey: ["reports", days],
    queryFn: () => api.getReports(days),
    refetchOnWindowFocus: false,
    staleTime: 60_000,
  });
}
