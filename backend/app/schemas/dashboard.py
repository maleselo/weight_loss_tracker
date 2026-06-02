import datetime as dt

from pydantic import BaseModel


class MetricSummary(BaseModel):
    valeur_actuelle: float | None = None
    delta_7j: float | None = None
    delta_30j: float | None = None
    tendance_14j_par_jour: float | None = None
    moyenne_mobile_7j: float | None = None


class DashboardSummary(BaseModel):
    date_reference: dt.date
    poids_kg: MetricSummary
    masse_grasse_pct: MetricSummary
    tour_taille_cm: MetricSummary
    tension_sys_mmhg: MetricSummary
    tension_dia_mmhg: MetricSummary
    nb_pas: MetricSummary


class SeriesPoint(BaseModel):
    date: dt.date
    valeur: float | None
    moyenne_mobile_7j: float | None = None


class SeriesOut(BaseModel):
    metrique: str
    points: list[SeriesPoint]
