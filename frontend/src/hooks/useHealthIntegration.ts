import { useCallback, useEffect, useState } from "react";
import { api, ApiError } from "../api/client";
import {
  getNativeHealthPlatform,
  isNativeHealthAvailable,
  readPlatformHealthData,
} from "../lib/healthConnect";
import type { IntegrationStatus } from "../types";

function emptyDataHint(): string {
  const platform = getNativeHealthPlatform();
  if (platform === "ios") {
    return "Aucune donnée trouvée. Vérifiez que vos apps (Apple Watch, Fitbit, Oura…) partagent vers Apple Health, puis Réglages → Santé → Données d'accès.";
  }
  return "Aucune donnée trouvée. Configurez d'abord votre app santé vers Health Connect (voir les guides ci-dessous), puis réessayez.";
}

function nativeRequiredHint(): string {
  const platform = getNativeHealthPlatform();
  if (platform === "web") {
    return "Ouvrez cette page depuis l'application mobile installée sur votre téléphone (Android ou iPhone).";
  }
  return "Disponible uniquement dans l'application mobile installée.";
}

export function useHealthIntegration(token: string | null) {
  const [status, setStatus] = useState<IntegrationStatus | null>(null);
  const [loading, setLoading] = useState(true);
  const [syncing, setSyncing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);

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
      const records = await readPlatformHealthData(30);
      if (records.length === 0) {
        setError(emptyDataHint());
        return;
      }
      await api.connectHealthConnect(token);
      const result = await api.syncHealthConnect(token, records);
      setMessage(result.message);
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
  }, [token, refresh]);

  const syncNow = useCallback(async () => {
    if (!token) return;
    setSyncing(true);
    setError(null);
    setMessage(null);
    try {
      if (!isNativeHealthAvailable()) {
        setError("La synchronisation nécessite l'application mobile (Android ou iPhone).");
        return;
      }
      const records = await readPlatformHealthData(30);
      if (records.length === 0) {
        setError(emptyDataHint());
        return;
      }
      const result = await api.syncHealthConnect(token, records);
      setMessage(result.message);
      await refresh();
    } catch (err) {
      if (err instanceof ApiError) setError(err.message);
      else if (err instanceof Error) setError(err.message);
      else setError("Synchronisation impossible.");
    } finally {
      setSyncing(false);
    }
  }, [token, refresh]);

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
    isNative: isNativeHealthAvailable(),
    platform: getNativeHealthPlatform(),
  };
}

/** Sync silencieuse au démarrage si déjà connecté (app native uniquement). */
export function useAutoHealthSync(token: string | null, connected: boolean | undefined) {
  useEffect(() => {
    if (!token || !connected || !isNativeHealthAvailable()) return;
    let cancelled = false;
    (async () => {
      try {
        const records = await readPlatformHealthData(7);
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
