/* ============================================================================
   CleanVision TanStack Query Hooks
   Exact hook-to-endpoint mapping from UIPrompt.md §11.
   ============================================================================ */

import {
  useQuery,
  useMutation,
  useQueryClient,
  type QueryClient,
} from '@tanstack/react-query';
import { apiGet, apiPostFormData } from './client';
import type {
  Room,
  Scan,
  ScanResponse,
  HealthResponse,
  ReportsSummary,
  CreateRoomResponse,
  BaselineUploadResponse,
} from './types';

/* ---------- GET hooks ---------- */

/** Load dashboard — GET /api/rooms → useQuery(['rooms']) */
export function useRooms() {
  return useQuery({
    queryKey: ['rooms'],
    queryFn: ({ signal }) =>
      apiGet<{ rooms: Room[] }>('/api/rooms', signal).then((r) => r.rooms),
  });
}

/** Open room — GET /api/rooms/:id → useQuery(['room', id]) */
export function useRoom(id: number) {
  return useQuery({
    queryKey: ['room', id],
    queryFn: ({ signal }) =>
      apiGet<{ room: Room }>(`/api/rooms/${String(id)}`, signal).then(
        (r) => r.room,
      ),
    enabled: id > 0,
  });
}

/** Room history — GET /api/rooms/:id/history?limit= → useQuery(['history', id, limit]) */
export function useRoomHistory(id: number, limit = 20) {
  return useQuery({
    queryKey: ['history', id, limit],
    queryFn: ({ signal }) =>
      apiGet<{ history: Scan[] }>(
        `/api/rooms/${String(id)}/history?limit=${String(limit)}`,
        signal,
      ).then((r) => r.history),
    enabled: id > 0,
  });
}

/** Health/mock-mode — GET /api/health → useQuery(['health']), refetchInterval 60s */
export function useHealth() {
  return useQuery({
    queryKey: ['health'],
    queryFn: ({ signal }) => apiGet<HealthResponse>('/api/health', signal),
    refetchInterval: 60_000,
    retry: 1,
  });
}

/** Reports summary — GET /api/reports/summary?days= → useQuery(['reports', 'summary', days]) */
export function useReportsSummary(days = 7) {
  return useQuery({
    queryKey: ['reports', 'summary', days],
    queryFn: ({ signal }) =>
      apiGet<ReportsSummary>(
        `/api/reports/summary?days=${String(days)}`,
        signal,
      ),
  });
}

/* ---------- Mutation hooks ---------- */

import { useToast } from '@/components/ui/toast';

/** Create room — POST /api/rooms → useMutation, invalidates ['rooms'], optimistic insert */
export function useCreateRoom() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: (data: { name: string; block: string }) => {
      const formData = new FormData();
      formData.append('name', data.name);
      formData.append('block', data.block);
      return apiPostFormData<CreateRoomResponse>('/api/rooms', formData);
    },
    onMutate: async (newRoom) => {
      await queryClient.cancelQueries({ queryKey: ['rooms'] });
      const previousRooms = queryClient.getQueryData<Room[]>(['rooms']);

      queryClient.setQueryData<Room[]>(['rooms'], (old) => {
        const optimistic: Room = {
          id: -Date.now(), // temporary negative ID
          name: newRoom.name,
          block: newRoom.block,
          baseline_image_path: null,
          created_at: new Date().toISOString(),
          latest_score: null,
          latest_status: null,
          last_scanned: null,
        };
        return [optimistic, ...(old ?? [])];
      });

      return { previousRooms };
    },
    onError: (err, _newRoom, context) => {
      if (context?.previousRooms) {
        queryClient.setQueryData(['rooms'], context.previousRooms);
      }
      toast(err instanceof Error ? err.message : 'Failed to create room', 'error');
    },
    onSuccess: () => {
      toast('Room created successfully', 'success');
    },
    onSettled: () => {
      void queryClient.invalidateQueries({ queryKey: ['rooms'] });
    },
  });
}

/** Upload baseline — POST /api/rooms/:id/baseline → useMutation, invalidates ['room', id] */
export function useUploadBaseline(roomId: number) {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: (file: File) => {
      const formData = new FormData();
      formData.append('image', file);
      return apiPostFormData<BaselineUploadResponse>(
        `/api/rooms/${String(roomId)}/baseline`,
        formData,
      );
    },
    onError: (err) => {
      toast(err instanceof Error ? err.message : 'Failed to upload baseline', 'error');
    },
    onSuccess: () => {
      toast('Baseline image uploaded', 'success');
    },
    onSettled: () => {
      void queryClient.invalidateQueries({ queryKey: ['room', roomId] });
      void queryClient.invalidateQueries({ queryKey: ['rooms'] });
    },
  });
}

/** Submit scan — POST /api/scan → useMutation, invalidates ['room', id] and ['history', id] */
export function useSubmitScan() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: (data: { roomId: number; image: File }) => {
      const formData = new FormData();
      formData.append('room_id', String(data.roomId));
      formData.append('image', data.image);
      return apiPostFormData<ScanResponse>('/api/scan', formData);
    },
    onError: (err) => {
      toast(err instanceof Error ? err.message : 'Scan failed', 'error');
    },
    onSuccess: () => {
      toast('Scan analyzed successfully', 'success');
    },
    onSettled: (_data, _error, variables) => {
      void queryClient.invalidateQueries({
        queryKey: ['room', variables.roomId],
      });
      void queryClient.invalidateQueries({
        queryKey: ['history', variables.roomId],
      });
      void queryClient.invalidateQueries({ queryKey: ['rooms'] });
      void queryClient.invalidateQueries({
        queryKey: ['reports'],
      });
    },
  });
}

/** Prefetch room data on hover/focus for smooth navigation */
export function prefetchRoom(queryClient: QueryClient, id: number) {
  void queryClient.prefetchQuery({
    queryKey: ['room', id],
    queryFn: () =>
      apiGet<{ room: Room }>(`/api/rooms/${String(id)}`).then((r) => r.room),
    staleTime: 30_000,
  });
}
