import type { DailyMeasurement } from "../types";

export type MeasureFieldName = keyof Omit<DailyMeasurement, "id" | "date" | "manual_overrides">;

/** Champs réellement mis à jour par la synchronisation Health Connect. */
export const HEALTH_SYNC_FIELD_NAMES: MeasureFieldName[] = [
  "poids_kg",
  "masse_grasse_pct",
  "fc_repos_bpm",
  "nb_pas",
  "tension_sys_mmhg",
  "tension_dia_mmhg",
  "sommeil",
  "stress",
  "energie",
];

export function isHealthSyncField(field: MeasureFieldName): boolean {
  return HEALTH_SYNC_FIELD_NAMES.includes(field);
}

/** Types Health Connect requis pour synchroniser chaque champ (au moins un accordé). */
export const FIELD_HEALTH_PERMISSIONS: Partial<Record<MeasureFieldName, readonly string[]>> = {
  poids_kg: ["weight"],
  masse_grasse_pct: ["bodyFat"],
  fc_repos_bpm: ["restingHeartRate", "heartRate"],
  nb_pas: ["steps"],
  tension_sys_mmhg: ["bloodPressure"],
  tension_dia_mmhg: ["bloodPressure"],
  sommeil: ["sleep"],
  stress: ["heartRateVariability", "restingHeartRate", "heartRate"],
  energie: ["sleep"],
};

export function fieldHasHealthPermission(
  field: MeasureFieldName,
  authorized: ReadonlySet<string>,
): boolean {
  const required = FIELD_HEALTH_PERMISSIONS[field];
  if (!required?.length) return false;
  return required.some((permission) => authorized.has(permission));
}

export const MEASURE_FIELD_NAMES: MeasureFieldName[] = [
  "poids_kg",
  "masse_grasse_pct",
  "tour_taille_cm",
  "tension_sys_mmhg",
  "tension_dia_mmhg",
  "fc_repos_bpm",
  "nb_pas",
  "sommeil",
  "stress",
  "energie",
  "faim",
  "entrainement",
  "alcool",
  "cheat_meal",
  "notes",
];

export type MeasureFormValues = Pick<DailyMeasurement, MeasureFieldName>;

export type FieldOverrideState = "sync" | "pending" | "manual";

function valuesEqual(a: unknown, b: unknown): boolean {
  if (a === b) return true;
  const empty = (v: unknown) => v === null || v === undefined || v === "";
  if (empty(a) && empty(b)) return true;
  return false;
}

export function detectDirtyMeasureFields(
  baseline: MeasureFormValues,
  current: MeasureFormValues,
): MeasureFieldName[] {
  const dirty: MeasureFieldName[] = [];
  for (const key of MEASURE_FIELD_NAMES) {
    if (!valuesEqual(baseline[key], current[key])) {
      dirty.push(key);
    }
  }
  return dirty;
}

export function mergeManualOverrides(existing: string[], dirty: MeasureFieldName[]): string[] {
  return [...new Set([...existing, ...dirty])].sort();
}

export function getFieldOverrideState(
  field: MeasureFieldName,
  baseline: MeasureFormValues,
  current: MeasureFormValues,
  manualOverrides: string[],
): FieldOverrideState {
  if (manualOverrides.includes(field)) return "manual";
  if (!valuesEqual(baseline[field], current[field])) return "pending";
  return "sync";
}

export function overrideFieldClass(state: FieldOverrideState, syncRestored = false): string {
  const classes: string[] = [];
  if (state === "manual") classes.push("field--override-manual");
  if (state === "pending") classes.push("field--override-pending");
  if (syncRestored) classes.push("field--sync-restored");
  return classes.join(" ");
}
