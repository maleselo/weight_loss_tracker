import datetime as dt

from fastapi import APIRouter, Depends, HTTPException, Query
from fastapi.responses import Response
from sqlalchemy import select
from sqlalchemy.orm import Session

from app.api.deps import get_current_user
from app.db.session import get_db
from app.models.daily_measurement import DailyMeasurement
from app.models.user import User
from app.services.pdf_report import build_health_report_pdf

router = APIRouter()


@router.get("/pdf")
def export_pdf(
    start: dt.date = Query(..., description="Date de début (incluse)"),
    end: dt.date = Query(..., description="Date de fin (incluse)"),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    if start > end:
        raise HTTPException(
            status_code=400,
            detail="La date de début doit être antérieure ou égale à la date de fin.",
        )

    stmt = (
        select(DailyMeasurement)
        .where(
            DailyMeasurement.user_id == current_user.id,
            DailyMeasurement.date >= start,
            DailyMeasurement.date <= end,
        )
        .order_by(DailyMeasurement.date)
    )
    measurements = list(db.scalars(stmt).all())
    if not measurements:
        raise HTTPException(status_code=404, detail="Aucune mesure sur cette période.")

    pdf_bytes = build_health_report_pdf(
        user=current_user,
        measurements=measurements,
        start=start,
        end=end,
    )
    filename = f"rapport-sante_{start.isoformat()}_{end.isoformat()}.pdf"
    return Response(
        content=pdf_bytes,
        media_type="application/pdf",
        headers={"Content-Disposition": f'attachment; filename="{filename}"'},
    )
