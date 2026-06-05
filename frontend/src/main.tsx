import { Capacitor } from "@capacitor/core";
import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import App from "./App";
import "./styles/global.css";

// Le service worker PWA casse les imports dynamiques dans l'APK Capacitor (https://localhost)
if (Capacitor.isNativePlatform() && "serviceWorker" in navigator) {
  void navigator.serviceWorker.getRegistrations().then((regs) => {
    regs.forEach((reg) => void reg.unregister());
  });
}

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
