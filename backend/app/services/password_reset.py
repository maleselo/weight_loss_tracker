import datetime as dt
import hashlib
import logging
import secrets
import smtplib
from email.message import EmailMessage

from sqlalchemy import delete, select
from sqlalchemy.orm import Session

from app.core.config import settings
from app.core.security import hash_password
from app.models.password_reset_token import PasswordResetToken
from app.models.user import User

logger = logging.getLogger(__name__)

FORGOT_PASSWORD_MESSAGE = (
    "Si un compte existe avec cet email, un lien de réinitialisation vient d'être envoyé."
)


def _hash_token(token: str) -> str:
    return hashlib.sha256(token.encode("utf-8")).hexdigest()


def _reset_url(token: str) -> str:
    base = settings.frontend_url.rstrip("/")
    return f"{base}/reinitialiser-mot-de-passe?token={token}"


def _smtp_configured() -> bool:
    return bool(settings.smtp_host and settings.smtp_from)


def send_password_reset_email(to_email: str, reset_url: str) -> bool:
    """Envoie l'email. Retourne True si envoyé, False si SMTP absent ou échec."""
    if not _smtp_configured():
        if settings.environment == "production":
            logger.warning(
                "SMTP non configuré (SMTP_HOST / SMTP_FROM) — aucun email envoyé pour %s",
                to_email,
            )
        else:
            logger.info("SMTP non configuré — lien de réinitialisation : %s", reset_url)
        return False

    msg = EmailMessage()
    msg["Subject"] = "Réinitialisation de votre mot de passe"
    msg["From"] = settings.smtp_from
    msg["To"] = to_email
    msg.set_content(
        "Bonjour,\n\n"
        "Vous avez demandé à réinitialiser le mot de passe de votre tableau de bord santé.\n\n"
        f"Cliquez sur ce lien (valide {settings.password_reset_expire_minutes} min) :\n"
        f"{reset_url}\n\n"
        "Si vous n'êtes pas à l'origine de cette demande, ignorez cet email.\n"
    )

    try:
        with smtplib.SMTP(settings.smtp_host, settings.smtp_port, timeout=30) as smtp:
            if settings.smtp_use_tls:
                smtp.starttls()
            if settings.smtp_user:
                smtp.login(settings.smtp_user, settings.smtp_password)
            smtp.send_message(msg)
    except Exception:
        logger.exception(
            "Échec envoi email de réinitialisation vers %s (host=%s port=%s)",
            to_email,
            settings.smtp_host,
            settings.smtp_port,
        )
        return False
    return True


def request_password_reset(db: Session, email: str) -> str | None:
    """Crée un token et envoie l'email. Retourne l'URL de reset en dev si SMTP absent."""
    stmt = select(User).where(User.email == email.lower())
    user = db.scalars(stmt).first()
    if user is None:
        return None

    db.execute(delete(PasswordResetToken).where(PasswordResetToken.user_id == user.id))

    raw_token = secrets.token_urlsafe(32)
    expires_at = dt.datetime.now(dt.UTC) + dt.timedelta(minutes=settings.password_reset_expire_minutes)
    db.add(
        PasswordResetToken(
            user_id=user.id,
            token_hash=_hash_token(raw_token),
            expires_at=expires_at,
        )
    )
    db.commit()

    reset_url = _reset_url(raw_token)
    sent = send_password_reset_email(user.email, reset_url)

    if settings.environment == "dev" and not sent:
        return reset_url
    return None


def reset_password(db: Session, token: str, new_password: str) -> bool:
    token_hash = _hash_token(token)
    now = dt.datetime.now(dt.UTC)
    stmt = select(PasswordResetToken).where(
        PasswordResetToken.token_hash == token_hash,
        PasswordResetToken.used_at.is_(None),
        PasswordResetToken.expires_at > now,
    )
    row = db.scalars(stmt).first()
    if row is None:
        return False

    user = db.get(User, row.user_id)
    if user is None:
        return False

    user.password_hash = hash_password(new_password)
    row.used_at = now
    db.execute(delete(PasswordResetToken).where(PasswordResetToken.user_id == user.id))
    db.commit()
    return True
