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
