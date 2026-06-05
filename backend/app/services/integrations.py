import datetime as dt

from sqlalchemy import select
from sqlalchemy.exc import IntegrityError
from sqlalchemy.orm import Session

from app.models.health_connection import HealthConnection
from app.schemas.integrations import HealthSyncRecord
from app.services.measurements import upsert_daily_measurement

PROVIDER_HEALTH_CONNECT = "health_connect"


def get_connection(db: Session, user_id: int, provider: str = PROVIDER_HEALTH_CONNECT) -> HealthConnection | None:
    stmt = select(HealthConnection).where(
        HealthConnection.user_id == user_id,
        HealthConnection.provider == provider,
    )
    return db.scalars(stmt).first()


def connect_provider(db: Session, user_id: int, provider: str = PROVIDER_HEALTH_CONNECT) -> HealthConnection:
    conn = get_connection(db, user_id, provider)
    if conn is None:
        conn = HealthConnection(user_id=user_id, provider=provider, auto_sync=True)
        db.add(conn)
    else:
        conn.connected_at = dt.datetime.now(dt.UTC)
        conn.last_sync_status = None
        conn.last_sync_message = None
    db.commit()
    db.refresh(conn)
    return conn


def disconnect_provider(db: Session, user_id: int, provider: str = PROVIDER_HEALTH_CONNECT) -> None:
    conn = get_connection(db, user_id, provider)
    if conn is None:
        return
    db.delete(conn)
    db.commit()


def sync_records(
    db: Session,
    *,
    user_id: int,
    records: list[HealthSyncRecord],
    provider: str = PROVIDER_HEALTH_CONNECT,
) -> tuple[int, HealthConnection]:
    conn = connect_provider(db, user_id, provider)
    synced = 0
    errors: list[str] = []

    for record in records:
        fields = record.to_measurement_fields()
        if not fields:
            continue
        try:
            upsert_daily_measurement(
                db,
                user_id=user_id,
                date=record.date,
                fields=fields,
                source=provider,
            )
            synced += 1
        except IntegrityError:
            db.rollback()
            errors.append(f"{record.date.isoformat()}: contraintes invalides")
            conn = get_connection(db, user_id, provider)
            if conn is None:
                conn = connect_provider(db, user_id, provider)

    conn = get_connection(db, user_id, provider)
    assert conn is not None
    conn.last_sync_at = dt.datetime.now(dt.UTC)
    if errors:
        conn.last_sync_status = "partial"
        conn.last_sync_message = "; ".join(errors[:3])
    elif synced == 0:
        conn.last_sync_status = "empty"
        conn.last_sync_message = "Aucune donnée à importer."
    else:
        conn.last_sync_status = "success"
        conn.last_sync_message = f"{synced} jour(s) synchronisé(s)."
    db.commit()
    db.refresh(conn)
    return synced, conn
