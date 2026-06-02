export interface User {
  id: number;
  email: string;
  taille_cm: number | null;
  poids_cible_kg: number | null;
  timezone: string;
}

export interface UserUpdate {
  taille_cm?: number | null;
  poids_cible_kg?: number | null;
}

export interface DailyMeasurement {
  id: number;
  date: string;
  poids_kg: number | null;
  masse_grasse_pct: number | null;
  tour_taille_cm: number | null;
  tension_sys_mmhg: number | null;
  tension_dia_mmhg: number | null;
  fc_repos_bpm: number | null;
  nb_pas: number | null;
  sommeil: number | null;
  stress: number | null;
  energie: number | null;
  faim: number | null;
  entrainement: boolean;
  alcool: boolean;
  cheat_meal: boolean;
  notes: string | null;
}

export interface MetricSummary {
  valeur_actuelle: number | null;
  delta_7j: number | null;
  delta_30j: number | null;
  tendance_14j_par_jour: number | null;
  moyenne_mobile_7j: number | null;
}

export interface DashboardSummary {
  date_reference: string;
  poids_kg: MetricSummary;
  masse_grasse_pct: MetricSummary;
  tour_taille_cm: MetricSummary;
  tension_sys_mmhg: MetricSummary;
  tension_dia_mmhg: MetricSummary;
  nb_pas: MetricSummary;
}

export interface SeriesPoint {
  date: string;
  valeur: number | null;
  moyenne_mobile_7j: number | null;
}

export interface SeriesOut {
  metrique: string;
  points: SeriesPoint[];
}

export type MeasurementForm = Omit<DailyMeasurement, "id" | "date">;
