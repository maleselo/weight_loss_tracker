import { useMemo } from "react";
import { useAuth } from "../context/AuthContext";
import {
  TRACKING_CATALOG_VERSION,
  newTogglesSinceVersion,
  type CatalogToggle,
} from "../lib/trackingCatalog";
import { MEASURE_FIELD_NAMES, type MeasureFieldName } from "../lib/measureFields";
import type { User } from "../types";

export function resolveTrackedFields(user: User | null): MeasureFieldName[] {
  if (!user || user.catalog_version_seen < 1) return [];
  const raw = user.tracked_fields ?? [];
  if (raw.length === 0) return [...MEASURE_FIELD_NAMES];
  const allowed = new Set(MEASURE_FIELD_NAMES);
  return MEASURE_FIELD_NAMES.filter((f) => raw.includes(f) && allowed.has(f));
}

export function needsOnboarding(user: User | null): boolean {
  return !user || user.catalog_version_seen < 1;
}

export function needsWhatsNew(user: User | null): boolean {
  if (!user || user.catalog_version_seen < 1) return false;
  return user.catalog_version_seen < TRACKING_CATALOG_VERSION;
}

export function whatsNewToggles(user: User | null): CatalogToggle[] {
  if (!user) return [];
  return newTogglesSinceVersion(user.catalog_version_seen);
}

export function useTrackedFields() {
  const { user } = useAuth();
  const trackedFields = useMemo(() => resolveTrackedFields(user), [user]);
  const trackedSet = useMemo(() => new Set(trackedFields), [trackedFields]);

  return {
    trackedFields,
    isTracked: (field: MeasureFieldName) => trackedSet.has(field),
    isTensionTracked: () => trackedSet.has("tension_sys_mmhg") || trackedSet.has("tension_dia_mmhg"),
    hasWellbeing: () =>
      trackedSet.has("sommeil") || trackedSet.has("stress") || trackedSet.has("energie") || trackedSet.has("faim"),
    hasHabits: () =>
      trackedSet.has("entrainement") || trackedSet.has("alcool") || trackedSet.has("cheat_meal") || trackedSet.has("notes"),
    hasBodyMetrics: () =>
      trackedSet.has("poids_kg") ||
      trackedSet.has("masse_grasse_pct") ||
      trackedSet.has("tour_taille_cm") ||
      trackedSet.has("fc_repos_bpm") ||
      trackedSet.has("nb_pas"),
  };
}
