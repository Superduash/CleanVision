import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { BrowserRouter } from "react-router-dom";
import { QueryClientProvider } from "@tanstack/react-query";
import { queryClient } from "@/lib/queryClient";
import { Toaster } from "sonner";
import { App } from "./App";
import { AuthContext, useProvideAuth } from "@/hooks/useAuth";
import { ThemeProvider } from "@/hooks/useTheme";
import { api } from "@/lib/api";
import { DEFAULT_HOSPITAL_CONFIG } from "@/hooks/useHospitalConfig";
import "./styles/globals.css";

// Warm the query cache immediately so pages load without spinners
// Hospital config is public (no auth needed) — prefetch right away
queryClient.prefetchQuery({
  queryKey: ["hospital-config"],
  queryFn: async () => {
    try {
      const res = await api.getHospitalConfig();
      return res?.config ?? DEFAULT_HOSPITAL_CONFIG;
    } catch {
      return DEFAULT_HOSPITAL_CONFIG;
    }
  },
  staleTime: 10 * 60 * 1000,
});

function Root() {
  const auth = useProvideAuth();
  return (
    <AuthContext.Provider value={auth}>
      <App />
    </AuthContext.Provider>
  );
}

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <ThemeProvider>
      <QueryClientProvider client={queryClient}>
        <BrowserRouter>
          <Root />
        </BrowserRouter>
        <Toaster position="top-right" richColors closeButton />
      </QueryClientProvider>
    </ThemeProvider>
  </StrictMode>,
);
