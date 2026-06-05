from fastapi import Depends, HTTPException, status
from fastapi.security import APIKeyHeader, HTTPAuthorizationCredentials, HTTPBearer, OAuth2PasswordBearer
from sqlalchemy import select
from sqlalchemy.orm import Session

import secrets

from app.core.config import settings
from app.core.security import decode_access_token
from app.db.session import get_db
from app.models.user import User

oauth2_scheme = OAuth2PasswordBearer(tokenUrl="/api/auth/login")
health_sync_api_key = APIKeyHeader(name="X-API-KEY", auto_error=False)
health_sync_bearer = HTTPBearer(auto_error=False)


def get_current_user(
    token: str = Depends(oauth2_scheme),
    db: Session = Depends(get_db),
) -> User:
    user_id = decode_access_token(token)
    if user_id is None:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Session invalide ou expirée.",
            headers={"WWW-Authenticate": "Bearer"},
        )
    try:
        uid = int(user_id)
    except ValueError as e:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Session invalide.",
        ) from e

    user = db.get(User, uid)
    if user is None:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Utilisateur introuvable.",
        )
    return user


def _extract_health_sync_token(
    api_key: str | None,
    bearer: HTTPAuthorizationCredentials | None,
) -> str | None:
    if api_key:
        return api_key.strip()
    if bearer is not None and bearer.credentials:
        return bearer.credentials.strip()
    return None


def verify_health_sync_auth(
    api_key: str | None = Depends(health_sync_api_key),
    bearer: HTTPAuthorizationCredentials | None = Depends(health_sync_bearer),
) -> None:
    expected = settings.health_sync_token.strip()
    if not expected:
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="La synchronisation externe n'est pas configurée (HEALTH_SYNC_TOKEN).",
        )

    token = _extract_health_sync_token(api_key, bearer)
    if not token or not secrets.compare_digest(token, expected):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Token de synchronisation invalide ou manquant.",
            headers={"WWW-Authenticate": "Bearer"},
        )


def get_health_sync_user(
    _: None = Depends(verify_health_sync_auth),
    db: Session = Depends(get_db),
) -> User:
    email = settings.health_sync_user_email.strip().lower()
    if not email:
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="La synchronisation externe n'est pas configurée (HEALTH_SYNC_USER_EMAIL).",
        )

    stmt = select(User).where(User.email == email)
    user = db.scalars(stmt).first()
    if user is None:
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="Utilisateur de synchronisation introuvable.",
        )
    return user
