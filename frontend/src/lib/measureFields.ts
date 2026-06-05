import type { DailyMeasurement } from "../types";

export type MeasureFieldName = keyof Omit<DailyMeasurement, "id" | "date" | "manual_overrides">;

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
