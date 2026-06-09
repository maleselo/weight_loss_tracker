from sqlalchemy import Integer, JSON, Numeric, String
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.db.base import Base


class User(Base):
    __tablename__ = "users"

    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    email: Mapped[str] = mapped_column(String(320), nullable=False, unique=True, index=True)
    password_hash: Mapped[str] = mapped_column(String(255), nullable=False)
    taille_cm: Mapped[float | None] = mapped_column(Numeric(5, 1), nullable=True)
    poids_cible_kg: Mapped[float | None] = mapped_column(Numeric(5, 1), nullable=True)
    timezone: Mapped[str] = mapped_column(String(64), nullable=False, default="Europe/Paris")
    tracked_fields: Mapped[list] = mapped_column(JSON, nullable=False, default=list)
    catalog_version_seen: Mapped[int] = mapped_column(Integer, nullable=False, default=0)

    measurements = relationship("DailyMeasurement", back_populates="user")
    health_connections = relationship("HealthConnection", back_populates="user")
    password_reset_tokens = relationship("PasswordResetToken", back_populates="user")
