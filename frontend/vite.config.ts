import { defineConfig, type PluginOption } from "vite";
import react from "@vitejs/plugin-react";
import { VitePWA } from "vite-plugin-pwa";
import packageJson from "./package.json";

/** Build web Railway (/) vs APK Capacitor (./, sans service worker). */
const forCapacitor = process.env.CAPACITOR === "true";

export default defineConfig({
  base: forCapacitor ? "./" : "/",
  define: {
    "import.meta.env.VITE_APP_VERSION": JSON.stringify(packageJson.version),
  },
  plugins: [
    react(),
    ...(!forCapacitor
      ? [
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
        ]
      : []),
  ] as PluginOption[],
  build: forCapacitor
    ? {
        // Évite les chunks lazy-load fragiles dans le WebView Capacitor
        rollupOptions: {
          output: {
            inlineDynamicImports: true,
          },
        },
      }
    : undefined,
  server: {
    port: 5173,
    proxy: {
      "/api": { target: "http://127.0.0.1:8000", changeOrigin: true },
      "/health": { target: "http://127.0.0.1:8000", changeOrigin: true },
    },
  },
});
