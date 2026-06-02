import datetime as dt

from sqlalchemy import Boolean, CheckConstraint, Date, ForeignKey, Integer, Numeric, String, Text, UniqueConstraint
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.db.base import Base


class DailyMeasurement(Base):
    __tablename__ = "daily_measurements"

    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    user_id: Mapped[int] = mapped_column(ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)
    date: Mapped[dt.date] = mapped_column(Date, nullable=False)

    poids_kg: Mapped[float | None] = mapped_column(Numeric(5, 1), nullable=True)
    masse_grasse_pct: Mapped[float | None] = mapped_column(Numeric(4, 1), nullable=True)
    tour_taille_cm: Mapped[float | None] = mapped_column(Numeric(5, 1), nullable=True)

    tension_sys_mmhg: Mapped[int | None] = mapped_column(Integer, nullable=True)
    tension_dia_mmhg: Mapped[int | None] = mapped_column(Integer, nullable=True)
    fc_repos_bpm: Mapped[int | None] = mapped_column(Integer, nullable=True)
    nb_pas: Mapped[int | None] = mapped_column(Integer, nullable=True)

    sommeil: Mapped[int | None] = mapped_column(Integer, nullable=True)
    stress: Mapped[int | None] = mapped_column(Integer, nullable=True)
    energie: Mapped[int | None] = mapped_column(Integer, nullable=True)
    faim: Mapped[int | None] = mapped_column(Integer, nullable=True)

    entrainement: Mapped[bool] = mapped_column(Boolean, nullable=False, default=False)
    alcool: Mapped[bool] = mapped_column(Boolean, nullable=False, default=False)
    cheat_meal: Mapped[bool] = mapped_column(Boolean, nullable=False, default=False)

    notes: Mapped[str | None] = mapped_column(Text, nullable=True)
    source: Mapped[str] = mapped_column(String(32), nullable=False, default="manual")

    user = relationship("User", back_populates="measurements")

    __table_args__ = (
        UniqueConstraint("user_id", "date", name="uq_daily_measurements_user_date"),
        CheckConstraint(
            "(tension_sys_mmhg IS NULL AND tension_dia_mmhg IS NULL) OR (tension_dia_mmhg < tension_sys_mmhg)",
            name="ck_tension_dia_lt_sys",
        ),
        CheckConstraint(
            "sommeil IS NULL OR (sommeil BETWEEN 1 AND 3)",
            name="ck_sommeil_1_3",
        ),
        CheckConstraint(
            "stress IS NULL OR (stress BETWEEN 1 AND 3)",
            name="ck_stress_1_3",
        ),
        CheckConstraint(
            "energie IS NULL OR (energie BETWEEN 1 AND 3)",
            name="ck_energie_1_3",
        ),
        CheckConstraint(
            "faim IS NULL OR (faim BETWEEN 1 AND 3)",
            name="ck_faim_1_3",
        ),
        CheckConstraint(
            "nb_pas IS NULL OR (nb_pas BETWEEN 0 AND 100000)",
            name="ck_nb_pas_range",
        ),
    )

