import type { CapacitorConfig } from "@capacitor/cli";

const config: CapacitorConfig = {
  appId: "com.healthdashboard.app",
  appName: "Tableau de bord santé",
  webDir: "dist",
  server: {
    androidScheme: "https",
  },
  plugins: {
    // Requêtes natives → pas de blocage CORS depuis le WebView (https://localhost)
    CapacitorHttp: {
      enabled: true,
    },
  },
};

export default config;
