import type { MeasureFieldName } from "./measureFields";
import { MEASURE_FIELD_NAMES } from "./measureFields";

export const TRACKING_CATALOG_VERSION = 1;

export interface CatalogToggle {
  id: string;
  label: string;
  description?: string;
  fields: MeasureFieldName[];
  sensitive?: boolean;
  newInVersion?: number;
}

export interface TrackingCategory {
  id: string;
  label: string;
  toggles: CatalogToggle[];
}

export const TRACKING_PRESETS: Record<string, { label: string; description: string; fields: MeasureFieldName[] }> = {
  poids: {
    label: "Perte de poids",
    description: "Poids, composition, habitudes et notes.",
    fields: [
      "poids_kg",
      "masse_grasse_pct",
      "tour_taille_cm",
      "entrainement",
      "alcool",
      "cheat_meal",
      "notes",
    ],
  },
  activite: {
    label: "Activité & forme",
    description: "Poids + pas, fréquence cardiaque et bien-être.",
    fields: [
      "poids_kg",
      "masse_grasse_pct",
      "nb_pas",
      "fc_repos_bpm",
      "sommeil",
      "stress",
      "energie",
      "entrainement",
      "notes",
    ],
  },
  complet: {
    label: "Suivi complet",
    description: "Tous les indicateurs disponibles.",
    fields: [...MEASURE_FIELD_NAMES],
  },
};

export const TRACKING_CATEGORIES: TrackingCategory[] = [
  {
    id: "corps",
    label: "Corps & composition",
    toggles: [
      { id: "poids_kg", label: "Poids", fields: ["poids_kg"] },
      { id: "masse_grasse_pct", label: "% masse grasse", fields: ["masse_grasse_pct"] },
      { id: "tour_taille_cm", label: "Tour de taille", fields: ["tour_taille_cm"] },
    ],
  },
  {
    id: "cardio",
    label: "Cardio & activité",
    toggles: [
      { id: "fc_repos_bpm", label: "FC repos", fields: ["fc_repos_bpm"] },
      { id: "nb_pas", label: "Nombre de pas", fields: ["nb_pas"] },
      {
        id: "tension",
        label: "Tension artérielle",
        description: "SYS et DIA",
        fields: ["tension_sys_mmhg", "tension_dia_mmhg"],
        sensitive: true,
      },
    ],
  },
  {
    id: "bienetre",
    label: "Bien-être",
    toggles: [
      { id: "sommeil", label: "Qualité du sommeil", fields: ["sommeil"] },
      { id: "stress", label: "Niveau de stress", fields: ["stress"], sensitive: true },
      { id: "energie", label: "Niveau d'énergie", fields: ["energie"] },
      { id: "faim", label: "Niveau de faim", fields: ["faim"], sensitive: true },
    ],
  },
  {
    id: "habitudes",
    label: "Habitudes & notes",
    toggles: [
      { id: "entrainement", label: "Entraînement", fields: ["entrainement"] },
      { id: "alcool", label: "Alcool", fields: ["alcool"], sensitive: true },
      { id: "cheat_meal", label: "Repas plaisir", fields: ["cheat_meal"] },
      { id: "notes", label: "Notes", fields: ["notes"] },
    ],
  },
];

export const ALL_CATALOG_TOGGLES: CatalogToggle[] = TRACKING_CATEGORIES.flatMap((c) => c.toggles);

export function fieldsFromToggles(selectedToggleIds: ReadonlySet<string>): MeasureFieldName[] {
  const out = new Set<MeasureFieldName>();
  for (const toggle of ALL_CATALOG_TOGGLES) {
    if (selectedToggleIds.has(toggle.id)) {
      for (const f of toggle.fields) out.add(f);
    }
  }
  return MEASURE_FIELD_NAMES.filter((f) => out.has(f));
}

export function toggleIdsFromFields(fields: ReadonlySet<MeasureFieldName> | MeasureFieldName[]): Set<string> {
  const fieldSet = new Set(fields);
  const ids = new Set<string>();
  for (const toggle of ALL_CATALOG_TOGGLES) {
    if (toggle.fields.every((f) => fieldSet.has(f))) ids.add(toggle.id);
  }
  return ids;
}

export function newTogglesSinceVersion(fromVersion: number): CatalogToggle[] {
  return ALL_CATALOG_TOGGLES.filter(
    (t) => t.newInVersion != null && t.newInVersion > fromVersion && t.newInVersion <= TRACKING_CATALOG_VERSION,
  );
}

export function isFieldTracked(field: MeasureFieldName, tracked: ReadonlySet<MeasureFieldName>): boolean {
  return tracked.has(field);
}
