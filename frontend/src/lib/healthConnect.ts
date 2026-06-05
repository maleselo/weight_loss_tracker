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

const HEALTH_READ_TYPES = ["steps", "weight", "restingHeartRate", "bodyFat"] as const;
type HealthReadType = (typeof HEALTH_READ_TYPES)[number];

const PERMISSION_LABELS: Record<string, string> = {
  steps: "pas",
  weight: "poids",
  restingHeartRate: "fréquence cardiaque au repos",
  bodyFat: "masse grasse (%)",
};

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
  const list = denied.map((d) => PERMISSION_LABELS[d] ?? d).join(", ");
  return `Autorisation refusée pour : ${list}. Ouvrez Health Connect → Autorisations des applications → Tableau de bord santé, puis activez la lecture.`;
}

async function readSamplesSafe(
  Health: Awaited<typeof import("@capgo/capacitor-health")>["Health"],
  dataType: HealthReadType,
  startIso: string,
  endIso: string,
  limit: number,
) {
  try {
    return await Health.readSamples({
      dataType,
      startDate: startIso,
      endDate: endIso,
      limit,
    });
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    if (/SecurityException|permission/i.test(msg)) {
      throw new Error(permissionDeniedMessage([dataType]));
    }
    throw err;
  }
}

/** Lit Health Connect (Android) — hub unique après config des apps sources. */
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
        : "Aucune autorisation Health Connect accordée. Réessayez et acceptez au moins pas, poids, FC repos ou masse grasse.",
    );
  }

  const end = new Date();
  const start = new Date();
  start.setDate(start.getDate() - days);
  const startIso = start.toISOString();
  const endIso = end.toISOString();

  const byDate = new Map<string, LocalSyncRecord>();
  const restingHrByDay = new Map<string, number[]>();

  if (readAuthorized.has("steps")) {
    const stepsResult = await readSamplesSafe(Health, "steps", startIso, endIso, 5000);
    for (const sample of stepsResult.samples ?? []) {
      const key = toLocalDateKey(sample.startDate ?? sample.endDate);
      const row = ensureDay(byDate, key);
      row.step_count = (row.step_count ?? 0) + (sample.value ?? 0);
    }
  }

  if (readAuthorized.has("weight")) {
    const weightResult = await readSamplesSafe(Health, "weight", startIso, endIso, 500);
    for (const sample of weightResult.samples ?? []) {
      const key = toLocalDateKey(sample.startDate ?? sample.endDate);
      const row = ensureDay(byDate, key);
      row.weight = sample.value ?? row.weight;
    }
  }

  if (readAuthorized.has("bodyFat")) {
    const bfResult = await readSamplesSafe(Health, "bodyFat", startIso, endIso, 500);
    for (const sample of bfResult.samples ?? []) {
      const key = toLocalDateKey(sample.startDate ?? sample.endDate);
      const row = ensureDay(byDate, key);
      // Health Connect : percent (0–100)
      row.body_fat_percentage = sample.value ?? row.body_fat_percentage;
    }
  }

  if (readAuthorized.has("restingHeartRate")) {
    const hrResult = await readSamplesSafe(Health, "restingHeartRate", startIso, endIso, 500);
    for (const sample of hrResult.samples ?? []) {
      const key = toLocalDateKey(sample.startDate ?? sample.endDate);
      const values = restingHrByDay.get(key) ?? [];
      values.push(sample.value ?? 0);
      restingHrByDay.set(key, values);
    }
    for (const [key, values] of restingHrByDay) {
      const row = ensureDay(byDate, key);
      const avg = values.reduce((sum, v) => sum + v, 0) / values.length;
      row.resting_heart_rate = Math.round(avg);
    }
  }

  return [...byDate.values()]
    .filter(
      (r) =>
        r.step_count != null ||
        r.weight != null ||
        r.body_fat_percentage != null ||
        r.resting_heart_rate != null,
    )
    .sort((a, b) => a.date.localeCompare(b.date));
}

/** @deprecated Utiliser readPlatformHealthData */
export const readHealthConnectData = readPlatformHealthData;
