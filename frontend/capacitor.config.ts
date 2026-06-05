import type { CapacitorConfig } from "@capacitor/cli";

const config: CapacitorConfig = {
  appId: "com.healthdashboard.app",
  appName: "Tableau de bord santé",
  webDir: "dist",
  server: {
    androidScheme: "https",
  },
};

export default config;
