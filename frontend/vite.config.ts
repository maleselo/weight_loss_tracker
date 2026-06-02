import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import { VitePWA } from "vite-plugin-pwa";

export default defineConfig({
  plugins: [
    react(),
    VitePWA({
      registerType: "autoUpdate",
      manifest: {
        name: "Tableau de bord santé",
        short_name: "Santé",
        description: "Suivi quotidien poids, tension et bien-être",
        lang: "fr",
        theme_color: "#0f766e",
        background_color: "#f0fdfa",
        display: "standalone",
        start_url: "/",
      },
    }),
  ],
  server: {
    port: 5173,
    proxy: {
      "/api": { target: "http://127.0.0.1:8000", changeOrigin: true },
      "/health": { target: "http://127.0.0.1:8000", changeOrigin: true },
    },
  },
});
