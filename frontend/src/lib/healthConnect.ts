import { Capacitor } from "@capacitor/core";

export interface LocalSyncRecord {
  date: string;
  weight?: number;
  body_fat_percentage?: number;
  resting_heart_rate?: number;
  step_count?: number;
  blood_pressure_sys?: number;
  blood_pressure_dia?: number;
}

export type NativeHealthPlatform = "android" | "ios" | "web";

/** Contexte d'exécution pour la sync santé */
export type HealthSyncContext =
  | "native-android"
  | "native-ios"
  | "mobile-browser"
  | "desktop-browser";

const HEALTH_READ_TYPES = ["steps", "weight", "heartRate"] as const;
type HealthReadType = (typeof HEALTH_READ_TYPES)[number];

export function isMobileBrowser(): boolean {
  if (Capacitor.isNativePlatform()) return false;
  if (typeof navigator === "undefined") return false;
  return /Android|iPhone|iPad|iPod/i.test(navigator.userAgent);
}

export function getHealthSyncContext(): HealthSyncContext {
  if (Capacitor.isNativePlatform()) {
    return Capacitor.getPlatform() === "ios" ? "native-ios" : "native-android";
  }
  return isMobileBrowser() ? "mobile-browser" : "desktop-browser";
}

export function getNativeHealthPlatform(): NativeHealthPlatform {
  const ctx = getHealthSyncContext();
  if (ctx === "native-ios") return "ios";
  if (ctx === "native-android") return "android";
  return "web";
}

export function isNativeHealthAvailable(): boolean {
  return Capacitor.isNativePlatform();
}

export function nativePlatformLabel(): string {
  const ctx = getHealthSyncContext();
  if (ctx === "native-android") return "Android (Health Connect)";
  if (ctx === "mobile-browser") return "navigateur mobile (non compatible)";
  return "navigateur ordinateur";
}

function toLocalDateKey(iso: string): string {
  const d = new Date(iso);
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

function ensureDay(map: Map<string, LocalSyncRecord>, date: string): LocalSyncRecord {
  let row = map.get(date);
  if (!row) {
    row = { date };
    map.set(date, row);
  }
  return row;
}

function permissionDeniedMessage(denied: string[]): string {
  const labels: Record<string, string> = {
    steps: "pas",
    weight: "poids",
    heartRate: "fréquence cardiaque",
  };
  const list = denied.map((d) => labels[d] ?? d).join(", ");
  return `Autorisation refusée pour : ${list}. Ouvrez Health Connect → Autorisations des applications → Tableau de bord santé, puis activez la lecture.`;
}

/** Lit Health Connect (Android) ou HealthKit (iOS) — hub unique après config des apps sources. */
export async function readPlatformHealthData(days = 30): Promise<LocalSyncRecord[]> {
  if (!isNativeHealthAvailable()) {
    throw new Error("NATIVE_REQUIRED");
  }

  const { Health } = await import("@capgo/capacitor-health");
  const platform = getNativeHealthPlatform();

  const availability = await Health.isAvailable();
  if (!availability.available) {
    throw new Error(
      platform === "ios"
        ? "Apple Health n'est pas disponible sur cet appareil."
        : "Health Connect n'est pas disponible. Installez « Health Connect by Android » depuis le Play Store.",
    );
  }

  const auth = await Health.requestAuthorization({
    read: [...HEALTH_READ_TYPES],
  });

  const readAuthorized = new Set((auth.readAuthorized ?? []) as HealthReadType[]);
  const readDenied = (auth.readDenied ?? []) as string[];

  if (readAuthorized.size === 0) {
    throw new Error(
      readDenied.length > 0
        ? permissionDeniedMessage(readDenied)
        : "Aucune autorisation Health Connect accordée. Réessayez et acceptez au moins pas, poids ou fréquence cardiaque.",
    );
  }

  const end = new Date();
  const start = new Date();
  start.setDate(start.getDate() - days);
  const startIso = start.toISOString();
  const endIso = end.toISOString();

  const byDate = new Map<string, LocalSyncRecord>();

  if (readAuthorized.has("steps")) {
    try {
      const stepsResult = await Health.readSamples({
        dataType: "steps",
        startDate: startIso,
        endDate: endIso,
        limit: 5000,
      });
      for (const sample of stepsResult.samples ?? []) {
        const key = toLocalDateKey(sample.startDate ?? sample.endDate);
        const row = ensureDay(byDate, key);
        row.step_count = (row.step_count ?? 0) + (sample.value ?? 0);
      }
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      if (/SecurityException|permission/i.test(msg)) {
        throw new Error(permissionDeniedMessage(["steps"]));
      }
      throw err;
    }
  }

  if (readAuthorized.has("weight")) {
    try {
      const weightResult = await Health.readSamples({
        dataType: "weight",
        startDate: startIso,
        endDate: endIso,
        limit: 500,
      });
      for (const sample of weightResult.samples ?? []) {
        const key = toLocalDateKey(sample.startDate ?? sample.endDate);
        const row = ensureDay(byDate, key);
        row.weight = sample.value ?? row.weight;
      }
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      if (/SecurityException|permission/i.test(msg)) {
        throw new Error(permissionDeniedMessage(["weight"]));
      }
      throw err;
    }
  }

  if (readAuthorized.has("heartRate")) {
    try {
      const hrResult = await Health.readSamples({
        dataType: "heartRate",
        startDate: startIso,
        endDate: endIso,
        limit: 500,
      });
      for (const sample of hrResult.samples ?? []) {
        const key = toLocalDateKey(sample.startDate ?? sample.endDate);
        const row = ensureDay(byDate, key);
        if (row.resting_heart_rate == null) {
          row.resting_heart_rate = Math.round(sample.value ?? 0);
        }
      }
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      if (/SecurityException|permission/i.test(msg)) {
        throw new Error(permissionDeniedMessage(["heartRate"]));
      }
      throw err;
    }
  }

  return [...byDate.values()]
    .filter((r) => r.step_count != null || r.weight != null || r.resting_heart_rate != null)
    .sort((a, b) => a.date.localeCompare(b.date));
}

/** @deprecated Utiliser readPlatformHealthData */
export const readHealthConnectData = readPlatformHealthData;
