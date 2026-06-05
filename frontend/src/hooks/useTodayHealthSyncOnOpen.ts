import { useEffect, useRef } from "react";
import { api } from "../api/client";
import {
  HEALTH_TODAY_SYNCED_EVENT,
  isNativeHealthAvailable,
  readTodayHealthRecords,
} from "../lib/healthConnect";

/** Sync silencieuse de la journée en cours à l'ouverture de l'app (native + Health Connect connecté). */
export function useTodayHealthSyncOnOpen(token: string | null) {
  const started = useRef(false);

  useEffect(() => {
    if (!token || started.current || !isNativeHealthAvailable()) return;
    started.current = true;

    let cancelled = false;
    (async () => {
      try {
        const status = await api.integrationStatus(token);
        if (cancelled || !status.connected) return;

        const records = await readTodayHealthRecords();
        if (cancelled || records.length === 0) return;

        await api.syncHealthConnect(token, records);
        if (!cancelled) {
          window.dispatchEvent(new CustomEvent(HEALTH_TODAY_SYNCED_EVENT));
        }
      } catch {
        /* silencieux */
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [token]);
}
