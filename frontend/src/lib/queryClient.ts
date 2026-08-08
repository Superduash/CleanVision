import { QueryClient } from "@tanstack/react-query";

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      // Serve cached data immediately — no loading flash on navigation
      staleTime: 5 * 60 * 1000,       // 5 min: data is fresh, won't refetch
      gcTime: 30 * 60 * 1000,         // 30 min: keep in memory after unmount
      refetchOnWindowFocus: false,
      refetchOnMount: false,           // don't refetch if data exists in cache
      refetchOnReconnect: false,
      retry: (failureCount, error: any) => {
        // Never retry on auth errors (401/403) — pointless and slow
        if (error?.status === 401 || error?.status === 403) return false;
        return failureCount < 1;
      },
    },
    mutations: {
      retry: false,
    },
  },
});
