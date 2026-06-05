import datetime as dt

from sqlalchemy import select
from sqlalchemy.exc import IntegrityError
from sqlalchemy.orm import Session

from app.models.daily_measurement import DailyMeasurement


def upsert_daily_measurement(
    db: Session,
    *,
    user_id: int,
    date: dt.date,
    fields: dict[str, object],
    source: str = "manual",
) -> DailyMeasurement:
    stmt = select(DailyMeasurement).where(
        DailyMeasurement.user_id == user_id,
        DailyMeasurement.date == date,
    )
    obj = db.scalars(stmt).first()
    if obj is None:
        obj = DailyMeasurement(date=date, user_id=user_id, source=source)
        db.add(obj)
    else:
        obj.source = source

    for key, value in fields.items():
        setattr(obj, key, value)

    try:
        db.commit()
    except IntegrityError:
        db.rollback()
        raise
    db.refresh(obj)
    return obj
