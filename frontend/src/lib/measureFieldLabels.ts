import type { MeasureFieldName } from "./measureFields";

export const MEASURE_FIELD_LABELS: Record<MeasureFieldName, string> = {
  poids_kg: "Poids",
  masse_grasse_pct: "% masse grasse",
  tour_taille_cm: "Tour de taille",
  tension_sys_mmhg: "Tension SYS",
  tension_dia_mmhg: "Tension DIA",
  fc_repos_bpm: "FC repos",
  nb_pas: "Nombre de pas",
  sommeil: "Qualité du sommeil",
  stress: "Niveau de stress",
  energie: "Niveau d'énergie",
  faim: "Niveau de faim",
  entrainement: "Entraînement",
  alcool: "Alcool",
  cheat_meal: "Repas plaisir",
  notes: "Notes",
};

export function formatFieldList(fields: MeasureFieldName[]): string {
  return fields.map((f) => MEASURE_FIELD_LABELS[f]).join(", ");
}
