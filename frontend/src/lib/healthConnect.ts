import { Capacitor } from "@capacitor/core";
import { todayISO } from "./dates";
import { computeSleepQualityScore } from "./sleepScore";
import {
  computeEnergyLevel,
  computeStressLevel,
  medianRestingHrBaseline,
} from "./wellbeingScore";

export interface LocalSyncRecord {
  date: string;
  weight?: number;
  body_fat_percentage?: number;
  resting_heart_rate?: number;
  step_count?: number;
  blood_pressure_sys?: number;
  blood_pressure_dia?: number;
  sleep_quality?: number;
  stress_level?: number;
  energy_level?: number;
}

export type NativeHealthPlatform = "android" | "ios" | "web";

/** Contexte d'exécution pour la sync santé */
export type HealthSyncContext =
  | "native-android"
  | "native-ios"
  | "mobile-browser"
  | "desktop-browser";

// heartRate : la plupart des apps (Samsung Health, Fitbit…) n'écrivent que ce type, pas restingHeartRate.
const HEALTH_READ_TYPES = [
  "steps",
  "weight",
  "restingHeartRate",
  "heartRate",
  "bodyFat",
  "bloodPressure",
  "sleep",
  "heartRateVariability",
] as const;
export type HealthReadType = (typeof HEALTH_READ_TYPES)[number];

const PERMISSION_LABELS: Record<string, string> = {
  steps: "pas",
  weight: "poids",
  restingHeartRate: "fréquence cardiaque au repos",
  heartRate: "fréquence cardiaque",
  bodyFat: "masse grasse (%)",
  bloodPressure: "tension",
  sleep: "sommeil",
  heartRateVariability: "variabilité cardiaque (HRV)",
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

/** Résumé lisible des métriques importées (pour message utilisateur). */
export function summarizeHealthRecords(records: LocalSyncRecord[]): string {
  const count = (fn: (r: LocalSyncRecord) => boolean) => records.filter(fn).length;
  const parts: string[] = [];
  const steps = count((r) => r.step_count != null);
  const weight = count((r) => r.weight != null);
  const bf = count((r) => r.body_fat_percentage != null);
  const hr = count((r) => r.resting_heart_rate != null);
  const bp = count((r) => r.blood_pressure_sys != null && r.blood_pressure_dia != null);
  const sleep = count((r) => r.sleep_quality != null);
  const stress = count((r) => r.stress_level != null);
  const energy = count((r) => r.energy_level != null);
  if (steps) parts.push(`${steps} j. de pas`);
  if (weight) parts.push(`${weight} j. de poids`);
  if (bf) parts.push(`${bf} j. de masse grasse`);
  if (hr) parts.push(`${hr} j. de FC`);
  if (bp) parts.push(`${bp} j. de tension`);
  if (sleep) parts.push(`${sleep} j. de sommeil`);
  if (stress) parts.push(`${stress} j. de stress`);
  if (energy) parts.push(`${energy} j. d'énergie`);
  return parts.length ? parts.join(", ") : "aucune métrique";
}

function toLocalDateKey(iso: string): string {
  const d = new Date(iso);
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

function sampleTimestamp(sample: { startDate?: string; endDate?: string }): number {
  const iso = sample.endDate ?? sample.startDate;
  return iso ? Date.parse(iso) : 0;
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

/** Certaines sources envoient 0.22 au lieu de 22 %. */
function normalizeBodyFatPercent(value: number | undefined): number | undefined {
  if (value == null || Number.isNaN(value)) return undefined;
  const pct = value > 0 && value <= 1 ? value * 100 : value;
  if (pct < 1 || pct > 80) return undefined;
  return Math.round(pct * 10) / 10;
}

function setLatestSample(
  latest: Map<string, { value: number; at: number }>,
  date: string,
  value: number | undefined,
  at: number,
) {
  if (value == null || Number.isNaN(value)) return;
  const prev = latest.get(date);
  if (!prev || at >= prev.at) {
    latest.set(date, { value, at });
  }
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

type DailyAggregatedType = "restingHeartRate" | "heartRate" | "steps";
type DailyAggregation = "average" | "min" | "sum";

/** Agrégation journalière — couvre toute la période (pas de plafond d'échantillons). */
async function queryDailyAggregatedSafe(
  Health: Awaited<typeof import("@capgo/capacitor-health")>["Health"],
  dataType: DailyAggregatedType,
  startIso: string,
  endIso: string,
  aggregation: DailyAggregation,
) {
  try {
    return await Health.queryAggregated({
      dataType,
      startDate: startIso,
      endDate: endIso,
      bucket: "day",
      aggregation,
    });
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    if (/SecurityException|permission/i.test(msg)) {
      throw new Error(permissionDeniedMessage([dataType]));
    }
    throw err;
  }
}

/** Autorisations Health Connect accordées (sans ouvrir la fenêtre de permission). */
export async function getHealthConnectAuthorizedTypes(): Promise<Set<HealthReadType>> {
  if (!isNativeHealthAvailable()) {
    return new Set();
  }

  const { Health } = await import("@capgo/capacitor-health");
  const availability = await Health.isAvailable();
  if (!availability.available) {
    return new Set();
  }

  const auth = await Health.checkAuthorization({ read: [...HEALTH_READ_TYPES] });
  return new Set((auth.readAuthorized ?? []) as HealthReadType[]);
}

/** Lit Health Connect (Android) — hub unique après config des apps sources. */
export async function readPlatformHealthData(days = 7): Promise<LocalSyncRecord[]> {
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
        : "Aucune autorisation Health Connect accordée. Réessayez et acceptez au moins pas, poids, FC ou masse grasse.",
    );
  }

  const end = new Date();
  const start = new Date();
  start.setHours(0, 0, 0, 0);
  start.setDate(start.getDate() - days);
  const startIso = start.toISOString();
  const endIso = end.toISOString();

  const byDate = new Map<string, LocalSyncRecord>();
  const restingHrByDay = new Map<string, number[]>();
  const heartRateMinByDay = new Map<string, number>();
  const latestWeight = new Map<string, { value: number; at: number }>();
  const latestBodyFat = new Map<string, { value: number; at: number }>();
  const latestBp = new Map<string, { sys: number; dia: number; at: number }>();
  const sleepByWakeDate = new Map<
    string,
    { durationMinutes: number; hasStageData?: boolean; stages?: { stage: string; durationMinutes: number }[] }
  >();

  if (readAuthorized.has("steps")) {
    const stepsResult = await queryDailyAggregatedSafe(Health, "steps", startIso, endIso, "sum");
    for (const sample of stepsResult.samples ?? []) {
      const count = sample.value;
      if (count == null || Number.isNaN(count)) continue;
      const key = toLocalDateKey(sample.startDate ?? sample.endDate);
      ensureDay(byDate, key).step_count = Math.round(count);
    }
  }

  if (readAuthorized.has("weight")) {
    const weightResult = await readSamplesSafe(Health, "weight", startIso, endIso, 500);
    for (const sample of weightResult.samples ?? []) {
      const key = toLocalDateKey(sample.startDate ?? sample.endDate);
      setLatestSample(latestWeight, key, sample.value, sampleTimestamp(sample));
    }
  }

  if (readAuthorized.has("bodyFat")) {
    const bfResult = await readSamplesSafe(Health, "bodyFat", startIso, endIso, 500);
    for (const sample of bfResult.samples ?? []) {
      const key = toLocalDateKey(sample.startDate ?? sample.endDate);
      const pct = normalizeBodyFatPercent(sample.value);
      if (pct != null) {
        setLatestSample(latestBodyFat, key, pct, sampleTimestamp(sample));
      }
    }
  }

  if (readAuthorized.has("restingHeartRate")) {
    const hrResult = await queryDailyAggregatedSafe(
      Health,
      "restingHeartRate",
      startIso,
      endIso,
      "average",
    );
    for (const sample of hrResult.samples ?? []) {
      const bpm = sample.value;
      if (bpm == null || Number.isNaN(bpm)) continue;
      const key = toLocalDateKey(sample.startDate ?? sample.endDate);
      const values = restingHrByDay.get(key) ?? [];
      values.push(bpm);
      restingHrByDay.set(key, values);
    }
  }

  if (readAuthorized.has("heartRate")) {
    const hrResult = await queryDailyAggregatedSafe(Health, "heartRate", startIso, endIso, "min");
    for (const sample of hrResult.samples ?? []) {
      const bpm = sample.value;
      if (bpm == null || Number.isNaN(bpm)) continue;
      const key = toLocalDateKey(sample.startDate ?? sample.endDate);
      heartRateMinByDay.set(key, bpm);
    }
  }

  if (readAuthorized.has("bloodPressure")) {
    const bpResult = await readSamplesSafe(Health, "bloodPressure", startIso, endIso, 500);
    for (const sample of bpResult.samples ?? []) {
      const sys = sample.systolic ?? sample.value;
      const dia = sample.diastolic;
      if (sys == null || dia == null) continue;
      const key = toLocalDateKey(sample.startDate ?? sample.endDate);
      const at = sampleTimestamp(sample);
      const prev = latestBp.get(key);
      if (!prev || at >= prev.at) {
        latestBp.set(key, { sys: Math.round(sys), dia: Math.round(dia), at });
      }
    }
  }

  for (const [key, entry] of latestWeight) {
    ensureDay(byDate, key).weight = entry.value;
  }
  for (const [key, entry] of latestBodyFat) {
    ensureDay(byDate, key).body_fat_percentage = entry.value;
  }
  for (const [key, values] of restingHrByDay) {
    const row = ensureDay(byDate, key);
    const avg = values.reduce((sum, v) => sum + v, 0) / values.length;
    row.resting_heart_rate = Math.round(avg);
  }
  for (const [key, minBpm] of heartRateMinByDay) {
    const row = ensureDay(byDate, key);
    if (row.resting_heart_rate == null) {
      row.resting_heart_rate = Math.round(minBpm);
    }
  }
  for (const [key, entry] of latestBp) {
    const row = ensureDay(byDate, key);
    row.blood_pressure_sys = entry.sys;
    row.blood_pressure_dia = entry.dia;
  }

  if (readAuthorized.has("sleep")) {
    const sleepResult = await readSamplesSafe(Health, "sleep", startIso, endIso, 500);
    for (const sample of sleepResult.samples ?? []) {
      const durationMinutes = sample.value ?? 0;
      if (durationMinutes < 30) continue;
      const wakeDate = toLocalDateKey(sample.endDate ?? sample.startDate);
      const prev = sleepByWakeDate.get(wakeDate);
      if (!prev || durationMinutes > prev.durationMinutes) {
        sleepByWakeDate.set(wakeDate, {
          durationMinutes,
          hasStageData: sample.hasStageData,
          stages: sample.stages?.map((stage) => ({
            stage: stage.stage,
            durationMinutes: stage.durationMinutes ?? 0,
          })),
        });
      }
    }
  }

  for (const [key, session] of sleepByWakeDate) {
    ensureDay(byDate, key).sleep_quality = computeSleepQualityScore(session);
  }

  const hrvByDay = new Map<string, number[]>();
  if (readAuthorized.has("heartRateVariability")) {
    const hrvResult = await readSamplesSafe(Health, "heartRateVariability", startIso, endIso, 0);
    for (const sample of hrvResult.samples ?? []) {
      const ms = sample.value;
      if (ms == null || Number.isNaN(ms) || ms <= 0) continue;
      const key = toLocalDateKey(sample.startDate ?? sample.endDate);
      const values = hrvByDay.get(key) ?? [];
      values.push(ms);
      hrvByDay.set(key, values);
    }
  }

  const restingByDate = new Map<string, number>();
  for (const [date, row] of byDate) {
    if (row.resting_heart_rate != null) {
      restingByDate.set(date, row.resting_heart_rate);
    }
  }

  for (const [date, row] of byDate) {
    const hrvValues = hrvByDay.get(date);
    const hrvAvgMs =
      hrvValues && hrvValues.length > 0
        ? hrvValues.reduce((sum, v) => sum + v, 0) / hrvValues.length
        : undefined;
    const baseline = medianRestingHrBaseline(restingByDate, date);
    const baselineMedianHr = baseline?.median;
    const baselineDayCount = baseline?.count ?? 0;

    const stress = computeStressLevel({
      hrvAvgMs,
      restingHeartRate: row.resting_heart_rate,
      baselineMedianHr,
      baselineDayCount,
    });
    if (stress != null) row.stress_level = stress;

    const energy = computeEnergyLevel({
      sleepQuality: row.sleep_quality,
      hrvAvgMs,
      restingHeartRate: row.resting_heart_rate,
      baselineMedianHr,
      baselineDayCount,
    });
    if (energy != null) row.energy_level = energy;
  }

  return [...byDate.values()]
    .filter(
      (r) =>
        r.step_count != null ||
        r.weight != null ||
        r.body_fat_percentage != null ||
        r.resting_heart_rate != null ||
        (r.blood_pressure_sys != null && r.blood_pressure_dia != null) ||
        r.sleep_quality != null ||
        r.stress_level != null ||
        r.energy_level != null,
    )
    .sort((a, b) => a.date.localeCompare(b.date));
}

/** Données Health Connect pour la journée en cours (lit 7 j. pour le calcul stress/énergie). */
export async function readTodayHealthRecords(): Promise<LocalSyncRecord[]> {
  const today = todayISO();
  const records = await readPlatformHealthData(7);
  return records.filter((record) => record.date === today);
}

export const HEALTH_TODAY_SYNCED_EVENT = "health-today-synced";

/** @deprecated Utiliser readPlatformHealthData */
export const readHealthConnectData = readPlatformHealthData;
