import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import path from "path";

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
  server: {
    port: 5173,
    proxy: {
      // Forwards /api/* and /uploads/* to the local Flask backend in development.
      // In production, VITE_API_BASE_URL points directly at the Render URL instead.
      "/api": {
        target: "http://localhost:5000",
        changeOrigin: true,
      },
      "/uploads": {
        target: "http://localhost:5000",
        changeOrigin: true,
      },
    },
  },
  build: {
    // Generate a manifest for cache-busting on Vercel
    manifest: true,
    rollupOptions: {
      output: {
        // Split vendor chunks for better long-term caching
        manualChunks(id) {
          if (id.includes("node_modules/react") || id.includes("node_modules/react-dom")) {
            return "react";
          }
          if (id.includes("node_modules/@tanstack")) {
            return "query";
          }
          if (id.includes("node_modules/lucide-react")) {
            return "icons";
          }
          if (id.includes("node_modules/date-fns")) {
            return "date-fns";
          }
        },
      },
    },
  },
});
