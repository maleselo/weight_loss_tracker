import datetime as dt

from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy import select
from sqlalchemy.exc import IntegrityError
from sqlalchemy.orm import Session

from app.api.deps import get_current_user
from app.db.session import get_db
from app.models.daily_measurement import DailyMeasurement
from app.models.user import User
from app.schemas.daily_measurement import (
    DailyMeasurementCreate,
    DailyMeasurementOut,
    DailyMeasurementUpdate,
)
from app.services.manual_overrides import normalize_manual_overrides

router = APIRouter()


def _base_stmt(user: User):
    return select(DailyMeasurement).where(DailyMeasurement.user_id == user.id)


@router.get("", response_model=list[DailyMeasurementOut])
def list_measures(
    start: dt.date | None = Query(default=None),
    end: dt.date | None = Query(default=None),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    stmt = _base_stmt(current_user).order_by(DailyMeasurement.date.desc())
    if start is not None:
        stmt = stmt.where(DailyMeasurement.date >= start)
    if end is not None:
        stmt = stmt.where(DailyMeasurement.date <= end)
    return list(db.scalars(stmt).all())


@router.get("/{date}", response_model=DailyMeasurementOut)
def get_measure(
    date: dt.date,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    stmt = _base_stmt(current_user).where(DailyMeasurement.date == date)
    obj = db.scalars(stmt).first()
    if obj is None:
        raise HTTPException(status_code=404, detail="Mesure introuvable pour cette date.")
    return obj


@router.put("/{date}", response_model=DailyMeasurementOut)
def upsert_measure(
    date: dt.date,
    payload: DailyMeasurementUpdate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    stmt = _base_stmt(current_user).where(DailyMeasurement.date == date)
    obj = db.scalars(stmt).first()
    if obj is None:
        obj = DailyMeasurement(date=date, user_id=current_user.id)
        db.add(obj)

    data = payload.model_dump(exclude_unset=True)
    if "manual_overrides" in data:
        obj.manual_overrides = normalize_manual_overrides(data.pop("manual_overrides"))
    for k, v in data.items():
        setattr(obj, k, v)
    if data:
        obj.source = "manual"

    try:
        db.commit()
    except IntegrityError as e:
        db.rollback()
        raise HTTPException(status_code=409, detail="Conflit d'unicité sur la date.") from e
    db.refresh(obj)
    return obj


@router.post("", response_model=DailyMeasurementOut, status_code=201)
def create_measure(
    payload: DailyMeasurementCreate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    data = payload.model_dump()
    obj = DailyMeasurement(**data, user_id=current_user.id)
    db.add(obj)
    try:
        db.commit()
    except IntegrityError as e:
        db.rollback()
        raise HTTPException(status_code=409, detail="Une mesure existe déjà pour cette date.") from e
    db.refresh(obj)
    return obj


@router.delete("/{date}", status_code=204)
def delete_measure(
    date: dt.date,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    stmt = _base_stmt(current_user).where(DailyMeasurement.date == date)
    obj = db.scalars(stmt).first()
    if obj is None:
        return
    db.delete(obj)
    db.commit()
