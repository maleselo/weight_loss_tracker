import datetime as dt

from pydantic import BaseModel, ConfigDict, Field, ValidationError, model_validator


class HealthSyncIn(BaseModel):
    """Payload JSON anglais pour automatisations (Tasker, Samsung Health bridge, etc.)."""

    model_config = ConfigDict(extra="forbid")

    date: dt.date

    weight: float | None = Field(default=None, ge=20, le=300)
    body_fat_percentage: float | None = Field(default=None, ge=1, le=80)
    waist_circumference: float | None = Field(default=None, ge=40, le=200)
    resting_heart_rate: int | None = Field(default=None, ge=30, le=220)
    step_count: int | None = Field(default=None, ge=0, le=100_000)
    blood_pressure_sys: int | None = Field(default=None, ge=60, le=250)
    blood_pressure_dia: int | None = Field(default=None, ge=30, le=150)
    sleep_quality: int | None = Field(default=None, ge=1, le=3)
    stress_level: int | None = Field(default=None, ge=1, le=3)
    energy_level: int | None = Field(default=None, ge=1, le=3)
    hunger_level: int | None = Field(default=None, ge=1, le=3)
    workout: bool | None = None
    alcohol: bool | None = None
    cheat_meal: bool | None = None
    notes: str | None = Field(default=None, max_length=2000)

    @model_validator(mode="after")
    def _tension_coherent(self) -> "HealthSyncIn":
        sys = self.blood_pressure_sys
        dia = self.blood_pressure_dia
        if sys is not None and dia is not None and dia >= sys:
            raise ValueError("blood_pressure_dia doit être inférieure à blood_pressure_sys")
        return self

    def to_measurement_fields(self) -> dict[str, object]:
        """Champs internes présents explicitement dans le payload (upsert partiel)."""
        raw = self.model_dump(exclude_unset=True, exclude={"date"})
        mapping = {
            "weight": "poids_kg",
            "body_fat_percentage": "masse_grasse_pct",
            "waist_circumference": "tour_taille_cm",
            "resting_heart_rate": "fc_repos_bpm",
            "step_count": "nb_pas",
            "blood_pressure_sys": "tension_sys_mmhg",
            "blood_pressure_dia": "tension_dia_mmhg",
            "sleep_quality": "sommeil",
            "stress_level": "stress",
            "energy_level": "energie",
            "hunger_level": "faim",
            "workout": "entrainement",
            "alcohol": "alcool",
            "cheat_meal": "cheat_meal",
            "notes": "notes",
        }
        return {mapping[k]: v for k, v in raw.items() if k in mapping}


def parse_health_sync_payload(data: object) -> HealthSyncIn:
    if not isinstance(data, dict):
        raise ValueError("Le corps de la requête doit être un objet JSON.")
    try:
        return HealthSyncIn.model_validate(data)
    except ValidationError as e:
        raise ValueError(e.errors()) from e
