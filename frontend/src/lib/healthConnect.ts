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

export function getNativeHealthPlatform(): NativeHealthPlatform {
  if (!Capacitor.isNativePlatform()) return "web";
  return Capacitor.getPlatform() === "ios" ? "ios" : "android";
}

export function isNativeHealthAvailable(): boolean {
  return Capacitor.isNativePlatform();
}

export function nativePlatformLabel(): string {
  const p = getNativeHealthPlatform();
  if (p === "android") return "Android (Health Connect)";
  if (p === "ios") return "iPhone (Apple Health)";
  return "navigateur web";
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

  await Health.requestAuthorization({
    read: ["steps", "weight", "heartRate"],
  });

  const end = new Date();
  const start = new Date();
  start.setDate(start.getDate() - days);
  const startIso = start.toISOString();
  const endIso = end.toISOString();

  const byDate = new Map<string, LocalSyncRecord>();

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

  return [...byDate.values()]
    .filter((r) => r.step_count != null || r.weight != null || r.resting_heart_rate != null)
    .sort((a, b) => a.date.localeCompare(b.date));
}

/** @deprecated Utiliser readPlatformHealthData */
export const readHealthConnectData = readPlatformHealthData;
