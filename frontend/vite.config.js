import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import viteCompression from "vite-plugin-compression";
import path from "path";
// https://vitejs.dev/config/
export default defineConfig({
    plugins: [
        react(),
        viteCompression({ algorithm: "gzip" }),
        viteCompression({ algorithm: "brotliCompress", ext: ".br" }),
    ],
    resolve: {
        alias: {
            "@": path.resolve(__dirname, "./src"),
        },
    },
    server: {
        port: 5173,
        proxy: {
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
        manifest: true,
        minify: "terser",
        terserOptions: {
            compress: {
                drop_console: true,
                drop_debugger: true,
            },
        },
        rollupOptions: {
            output: {
                manualChunks(id) {
                    if (id.includes("node_modules/react/") || id.includes("node_modules/react-dom/")) {
                        return "react-vendor";
                    }
                    if (id.includes("node_modules/react-router") || id.includes("node_modules/@remix-run")) {
                        return "router";
                    }
                    if (id.includes("node_modules/@tanstack")) {
                        return "query";
                    }
                    if (id.includes("node_modules/firebase")) {
                        return "firebase";
                    }
                    if (id.includes("node_modules/recharts")) {
                        return "charts";
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
