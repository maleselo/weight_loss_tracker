from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.api.deps import get_current_user
from app.db.session import get_db
from app.models.user import User
from app.schemas.integrations import IntegrationStatusOut, IntegrationSyncIn, IntegrationSyncOut
from app.services.integrations import (
    PROVIDER_HEALTH_CONNECT,
    disconnect_provider,
    get_connection,
    connect_provider,
    sync_records,
)

router = APIRouter()


def _status_for(user_id: int, db: Session) -> IntegrationStatusOut:
    conn = get_connection(db, user_id, PROVIDER_HEALTH_CONNECT)
    if conn is None:
        return IntegrationStatusOut(
            provider=PROVIDER_HEALTH_CONNECT,
            connected=False,
            native_app_required=True,
        )
    return IntegrationStatusOut(
        provider=conn.provider,
        connected=True,
        connected_at=conn.connected_at,
        last_sync_at=conn.last_sync_at,
        last_sync_status=conn.last_sync_status,
        last_sync_message=conn.last_sync_message,
        auto_sync=conn.auto_sync,
        native_app_required=True,
    )


@router.get("/status", response_model=IntegrationStatusOut)
def integration_status(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    return _status_for(current_user.id, db)


@router.post("/health-connect/connect", response_model=IntegrationStatusOut)
def connect_health_connect(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Marque la connexion Health Connect comme active (après autorisation sur l'appareil)."""
    connect_provider(db, current_user.id, PROVIDER_HEALTH_CONNECT)
    return _status_for(current_user.id, db)


@router.delete("/health-connect", response_model=IntegrationStatusOut)
def disconnect_health_connect(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    disconnect_provider(db, current_user.id, PROVIDER_HEALTH_CONNECT)
    return _status_for(current_user.id, db)


@router.post("/health-connect/sync", response_model=IntegrationSyncOut)
def sync_health_connect(
    payload: IntegrationSyncIn,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Importe les mesures lues depuis Health Connect (Samsung Health → Health Connect sur Android)."""
    try:
        synced, conn = sync_records(
            db,
            user_id=current_user.id,
            records=payload.records,
            provider=PROVIDER_HEALTH_CONNECT,
        )
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Synchronisation impossible : {e}",
        ) from e

    assert conn.last_sync_at is not None
    return IntegrationSyncOut(
        synced_days=synced,
        last_sync_at=conn.last_sync_at,
        message=conn.last_sync_message or f"{synced} jour(s) synchronisé(s).",
    )
