import datetime as dt

from fastapi import APIRouter, Depends, HTTPException, Query
from fastapi.responses import Response
from sqlalchemy import select
from sqlalchemy.orm import Session

from app.api.deps import get_current_user
from app.db.session import get_db
from app.models.daily_measurement import DailyMeasurement
from app.models.user import User
from app.services.csv_export import build_measurements_csv
from app.services.pdf_report import build_health_report_pdf

router = APIRouter()


def _load_measurements(
    db: Session,
    user_id: int,
    start: dt.date,
    end: dt.date,
) -> list[DailyMeasurement]:
    stmt = (
        select(DailyMeasurement)
        .where(
            DailyMeasurement.user_id == user_id,
            DailyMeasurement.date >= start,
            DailyMeasurement.date <= end,
        )
        .order_by(DailyMeasurement.date)
    )
    return list(db.scalars(stmt).all())


@router.get("/pdf")
def export_pdf(
    start: dt.date = Query(..., description="Date de début (incluse)"),
    end: dt.date = Query(..., description="Date de fin (incluse)"),
    include_chart: bool = Query(True),
    include_table: bool = Query(True),
    include_context: bool = Query(True),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    if start > end:
        raise HTTPException(
            status_code=400,
            detail="La date de début doit être antérieure ou égale à la date de fin.",
        )

    measurements = _load_measurements(db, current_user.id, start, end)
    if not measurements:
        raise HTTPException(status_code=404, detail="Aucune mesure sur cette période.")

    pdf_bytes = build_health_report_pdf(
        user=current_user,
        measurements=measurements,
        start=start,
        end=end,
        include_chart=include_chart,
        include_table=include_table,
        include_context=include_context,
    )
    filename = f"rapport-sante_{start.isoformat()}_{end.isoformat()}.pdf"
    return Response(
        content=pdf_bytes,
        media_type="application/pdf",
        headers={"Content-Disposition": f'attachment; filename="{filename}"'},
    )


@router.get("/csv")
def export_csv(
    start: dt.date | None = Query(default=None),
    end: dt.date | None = Query(default=None),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
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
    if not measurements:
        raise HTTPException(status_code=404, detail="Aucune mesure à exporter.")

    csv_bytes = build_measurements_csv(measurements)
    suffix = ""
    if start and end:
        suffix = f"_{start.isoformat()}_{end.isoformat()}"
    elif start:
        suffix = f"_depuis_{start.isoformat()}"
    filename = f"mesures-sante{suffix}.csv"
    return Response(
        content=csv_bytes,
        media_type="text/csv; charset=utf-8",
        headers={"Content-Disposition": f'attachment; filename="{filename}"'},
    )
