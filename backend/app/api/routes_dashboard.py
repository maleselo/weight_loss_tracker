import datetime as dt

from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy import select
from sqlalchemy.orm import Session

from app.api.deps import get_current_user
from app.db.session import get_db
from app.models.daily_measurement import DailyMeasurement
from app.models.user import User
from app.schemas.dashboard import DashboardSummary, SeriesOut
from app.services.dashboard import build_metric_summary, build_series, extract_metric_rows

router = APIRouter()

METRICS = {
    "poids_kg": lambda m: m.poids_kg,
    "masse_grasse_pct": lambda m: m.masse_grasse_pct,
    "tour_taille_cm": lambda m: m.tour_taille_cm,
    "tension_sys_mmhg": lambda m: m.tension_sys_mmhg,
    "tension_dia_mmhg": lambda m: m.tension_dia_mmhg,
    "nb_pas": lambda m: m.nb_pas,
}


@router.get("/summary", response_model=DashboardSummary)
def dashboard_summary(
    reference_date: dt.date | None = Query(default=None),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    ref = reference_date or dt.date.today()
    stmt = select(DailyMeasurement).where(DailyMeasurement.user_id == current_user.id)
    measurements = list(db.scalars(stmt.order_by(DailyMeasurement.date)).all())

    def summary(getter):
        return build_metric_summary(extract_metric_rows(measurements, getter), ref)

    return DashboardSummary(
        date_reference=ref,
        poids_kg=summary(METRICS["poids_kg"]),
        masse_grasse_pct=summary(METRICS["masse_grasse_pct"]),
        tour_taille_cm=summary(METRICS["tour_taille_cm"]),
        tension_sys_mmhg=summary(METRICS["tension_sys_mmhg"]),
        tension_dia_mmhg=summary(METRICS["tension_dia_mmhg"]),
        nb_pas=summary(METRICS["nb_pas"]),
    )


@router.get("/series/{metrique}", response_model=SeriesOut)
def dashboard_series(
    metrique: str,
    start: dt.date | None = Query(default=None),
    end: dt.date | None = Query(default=None),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    getter = METRICS.get(metrique)
    if getter is None:
        raise HTTPException(status_code=404, detail="Métrique inconnue.")

    stmt = (
        select(DailyMeasurement)
        .where(DailyMeasurement.user_id == current_user.id)
        .order_by(DailyMeasurement.date)
    )
    if start is not None:
        stmt = stmt.where(DailyMeasurement.date >= start)
    if end is not None:
        stmt = stmt.where(DailyMeasurement.date <= end)

    measurements = list(db.scalars(stmt).all())
    rows = [(m.date, float(v) if (v := getter(m)) is not None else None) for m in measurements]
    return SeriesOut(metrique=metrique, points=build_series(rows))
