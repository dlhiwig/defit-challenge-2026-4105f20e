import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";
import { componentTagger } from "lovable-tagger";

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => ({
  base: '/',  // Using Vercel now, not GitHub Pages
  server: {
    host: "::",
    port: 8080,
  },
  plugins: [react(), mode === "development" && componentTagger()].filter(Boolean),
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
  build: {
    assetsInlineLimit: 4096,
    chunkSizeWarningLimit: 600,
    rollupOptions: {
      output: {
        manualChunks(id) {
          if (!id.includes("node_modules")) return;
          if (id.includes("@supabase") || id.includes("@lovable.dev")) return "supabase";
          if (id.includes("recharts")) return "charts";
          if (id.includes("@radix-ui") || id.includes("cmdk") || id.includes("vaul")) return "radix";
          if (id.includes("@tanstack")) return "query";
          if (id.includes("react-dom") || id.includes("react-router") || id.includes("/react/")) return "react";
        },
      },
    },
  },
}));
