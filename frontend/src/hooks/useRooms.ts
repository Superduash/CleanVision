import { useQuery } from "@tanstack/react-query";
import { api } from "@/lib/api";

export function useRooms() {
  return useQuery({
    queryKey: ["rooms"],
    queryFn: api.listRooms,
    refetchOnWindowFocus: true,
    select: (data) => data?.rooms ?? [],
  });
}

export function useRoom(roomId: number) {
  return useQuery({
    queryKey: ["room", roomId],
    queryFn: () => api.getRoom(roomId),
    enabled: !!roomId,
    select: (data) => data?.room,
  });
}

export function useRoomHistory(roomId: number) {
  return useQuery({
    queryKey: ["history", roomId],
    queryFn: () => api.getHistory(roomId),
    enabled: !!roomId,
    refetchOnWindowFocus: true,
    select: (data) => data?.history ?? [],
  });
}

export function useSummary() {
  return useQuery({
    queryKey: ["summary"],
    queryFn: api.getSummary,
    refetchOnWindowFocus: true,
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
