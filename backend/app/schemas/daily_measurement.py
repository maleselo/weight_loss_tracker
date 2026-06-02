import datetime as dt

from pydantic import BaseModel, Field


class DailyMeasurementBase(BaseModel):
    date: dt.date

    poids_kg: float | None = Field(default=None, ge=20, le=300)
    masse_grasse_pct: float | None = Field(default=None, ge=1, le=80)
    tour_taille_cm: float | None = Field(default=None, ge=40, le=200)

    tension_sys_mmhg: int | None = Field(default=None, ge=60, le=250)
    tension_dia_mmhg: int | None = Field(default=None, ge=30, le=150)
    fc_repos_bpm: int | None = Field(default=None, ge=30, le=220)
    nb_pas: int | None = Field(default=None, ge=0, le=100_000)

    sommeil: int | None = Field(default=None, ge=1, le=3)
    stress: int | None = Field(default=None, ge=1, le=3)
    energie: int | None = Field(default=None, ge=1, le=3)
    faim: int | None = Field(default=None, ge=1, le=3)

    entrainement: bool = False
    alcool: bool = False
    cheat_meal: bool = False

    notes: str | None = Field(default=None, max_length=2000)


class DailyMeasurementCreate(DailyMeasurementBase):
    pass


class DailyMeasurementUpdate(BaseModel):
    poids_kg: float | None = Field(default=None, ge=20, le=300)
    masse_grasse_pct: float | None = Field(default=None, ge=1, le=80)
    tour_taille_cm: float | None = Field(default=None, ge=40, le=200)

    tension_sys_mmhg: int | None = Field(default=None, ge=60, le=250)
    tension_dia_mmhg: int | None = Field(default=None, ge=30, le=150)
    fc_repos_bpm: int | None = Field(default=None, ge=30, le=220)
    nb_pas: int | None = Field(default=None, ge=0, le=100_000)

    sommeil: int | None = Field(default=None, ge=1, le=3)
    stress: int | None = Field(default=None, ge=1, le=3)
    energie: int | None = Field(default=None, ge=1, le=3)
    faim: int | None = Field(default=None, ge=1, le=3)

    entrainement: bool | None = None
    alcool: bool | None = None
    cheat_meal: bool | None = None

    notes: str | None = Field(default=None, max_length=2000)


class DailyMeasurementOut(DailyMeasurementBase):
    id: int

    model_config = {"from_attributes": True}
