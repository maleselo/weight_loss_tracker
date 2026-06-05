import { useCallback, useEffect, useState } from "react";
import { api, ApiError } from "../api/client";
import {
  getHealthSyncContext,
  isNativeHealthAvailable,
  readPlatformHealthData,
  summarizeHealthRecords,
} from "../lib/healthConnect";
import {
  getStoredHealthSyncDays,
  storeHealthSyncDays,
  type HealthSyncPeriodDays,
} from "../lib/healthSyncPeriod";
import type { IntegrationStatus } from "../types";

function nativeRequiredHint(): string {
  const ctx = getHealthSyncContext();
  if (ctx === "mobile-browser") {
    return "Impossible depuis le navigateur du téléphone. Installez l'application native (APK), ouvrez-la, puis revenez dans Connexions.";
  }
  if (ctx === "desktop-browser") {
    return "Ouvrez l'application installée sur votre téléphone, pas le navigateur de l'ordinateur.";
  }
  return "Disponible uniquement dans l'application mobile installée.";
}

function emptyDataHint(): string {
  return "Aucune donnée trouvée. Configurez d'abord votre app santé vers Health Connect (voir les guides ci-dessous), puis réessayez.";
}

export function useHealthIntegration(token: string | null) {
  const [status, setStatus] = useState<IntegrationStatus | null>(null);
  const [loading, setLoading] = useState(true);
  const [syncing, setSyncing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [syncDays, setSyncDaysState] = useState<HealthSyncPeriodDays>(getStoredHealthSyncDays);

  const setSyncDays = useCallback((days: HealthSyncPeriodDays) => {
    setSyncDaysState(days);
    storeHealthSyncDays(days);
  }, []);

  const refresh = useCallback(async () => {
    if (!token) return;
    setLoading(true);
    try {
      const s = await api.integrationStatus(token);
      setStatus(s);
    } catch {
      setError("Impossible de charger l'état de la connexion.");
    } finally {
      setLoading(false);
    }
  }, [token]);

  useEffect(() => {
    refresh();
  }, [refresh]);

  const connectAndSync = useCallback(async () => {
    if (!token) return;
    setSyncing(true);
    setError(null);
    setMessage(null);
    try {
      if (!isNativeHealthAvailable()) {
        setError(nativeRequiredHint());
        return;
      }
      const records = await readPlatformHealthData(syncDays);
      if (records.length === 0) {
        setError(emptyDataHint());
        return;
      }
      await api.connectHealthConnect(token);
      const result = await api.syncHealthConnect(token, records);
      setMessage(`${result.message} — ${syncDays} j. : ${summarizeHealthRecords(records)}`);
      await refresh();
    } catch (err) {
      if (err instanceof Error && err.message === "NATIVE_REQUIRED") {
        setError(nativeRequiredHint());
      } else if (err instanceof ApiError) {
        setError(err.message);
      } else if (err instanceof Error) {
        setError(err.message);
      } else {
        setError("Connexion impossible.");
      }
    } finally {
      setSyncing(false);
    }
  }, [token, refresh, syncDays]);

  const syncNow = useCallback(async () => {
    if (!token) return;
    setSyncing(true);
    setError(null);
    setMessage(null);
    try {
      if (!isNativeHealthAvailable()) {
        setError(nativeRequiredHint());
        return;
      }
      const records = await readPlatformHealthData(syncDays);
      if (records.length === 0) {
        setError(emptyDataHint());
        return;
      }
      const result = await api.syncHealthConnect(token, records);
      setMessage(`${result.message} — ${syncDays} j. : ${summarizeHealthRecords(records)}`);
      await refresh();
    } catch (err) {
      if (err instanceof ApiError) setError(err.message);
      else if (err instanceof Error) setError(err.message);
      else setError("Synchronisation impossible.");
    } finally {
      setSyncing(false);
    }
  }, [token, refresh, syncDays]);

  const disconnect = useCallback(async () => {
    if (!token) return;
    setSyncing(true);
    setError(null);
    setMessage(null);
    try {
      await api.disconnectHealthConnect(token);
      setMessage("Connexion supprimée.");
      await refresh();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Déconnexion impossible.");
    } finally {
      setSyncing(false);
    }
  }, [token, refresh]);

  return {
    status,
    loading,
    syncing,
    error,
    message,
    refresh,
    connectAndSync,
    syncNow,
    disconnect,
    syncDays,
    setSyncDays,
    isNative: isNativeHealthAvailable(),
    syncContext: getHealthSyncContext(),
  };
}

/** Sync silencieuse au démarrage si déjà connecté (app native uniquement). */
export function useAutoHealthSync(token: string | null, connected: boolean | undefined) {
  useEffect(() => {
    if (!token || !connected || !isNativeHealthAvailable()) return;
    let cancelled = false;
    (async () => {
      try {
        const records = await readPlatformHealthData(getStoredHealthSyncDays());
        if (cancelled || records.length === 0) return;
        await api.syncHealthConnect(token, records);
      } catch {
        /* silencieux */
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [token, connected]);
}
