from fastapi import APIRouter, Depends, HTTPException, Request, status
from sqlalchemy.exc import IntegrityError
from sqlalchemy.orm import Session

from app.api.deps import get_health_sync_user
from app.db.session import get_db
from app.models.user import User
from app.schemas.daily_measurement import DailyMeasurementOut
from app.schemas.health_sync import parse_health_sync_payload
from app.services.measurements import upsert_daily_measurement

router = APIRouter()


@router.post("/health-sync", response_model=DailyMeasurementOut)
async def sync_health_data(
    request: Request,
    sync_user: User = Depends(get_health_sync_user),
    db: Session = Depends(get_db),
):
    """
    Upsert de mesures quotidiennes depuis une automatisation externe.

    Authentification : en-tête `X-API-KEY` ou `Authorization: Bearer <token>`.
    Seuls les champs présents dans le JSON sont mis à jour (sync partielle).
    """
    try:
        body = await request.json()
        payload = parse_health_sync_payload(body)
    except ValueError as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=e.args[0] if e.args else "Données invalides.",
        ) from e

    fields = payload.to_measurement_fields()
    if not fields:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Au moins un champ de mesure doit être fourni en plus de la date.",
        )

    try:
        obj = upsert_daily_measurement(
            db,
            user_id=sync_user.id,
            date=payload.date,
            fields=fields,
            source="health_sync",
        )
    except IntegrityError as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Contraintes de données non respectées (ex. tension DIA < SYS).",
        ) from e

    return obj
