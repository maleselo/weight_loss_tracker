import datetime as dt

from pydantic import BaseModel, Field


class HealthSyncRecord(BaseModel):
    date: dt.date
    weight: float | None = Field(default=None, ge=20, le=300)
    body_fat_percentage: float | None = Field(default=None, ge=1, le=80)
    resting_heart_rate: int | None = Field(default=None, ge=30, le=220)
    step_count: int | None = Field(default=None, ge=0, le=100_000)
    blood_pressure_sys: int | None = Field(default=None, ge=60, le=250)
    blood_pressure_dia: int | None = Field(default=None, ge=30, le=150)
    sleep_quality: int | None = Field(default=None, ge=1, le=3)
    stress_level: int | None = Field(default=None, ge=1, le=3)
    energy_level: int | None = Field(default=None, ge=1, le=3)

    def to_measurement_fields(self) -> dict[str, object]:
        raw = self.model_dump(exclude_unset=True, exclude={"date"})
        mapping = {
            "weight": "poids_kg",
            "body_fat_percentage": "masse_grasse_pct",
            "resting_heart_rate": "fc_repos_bpm",
            "step_count": "nb_pas",
            "blood_pressure_sys": "tension_sys_mmhg",
            "blood_pressure_dia": "tension_dia_mmhg",
            "sleep_quality": "sommeil",
            "stress_level": "stress",
            "energy_level": "energie",
        }
        return {mapping[k]: v for k, v in raw.items() if k in mapping}


class IntegrationSyncIn(BaseModel):
    records: list[HealthSyncRecord] = Field(min_length=1, max_length=366)


class IntegrationStatusOut(BaseModel):
    provider: str
    connected: bool
    connected_at: dt.datetime | None = None
    last_sync_at: dt.datetime | None = None
    last_sync_status: str | None = None
    last_sync_message: str | None = None
    auto_sync: bool = True
    native_app_required: bool = True


class IntegrationSyncOut(BaseModel):
    synced_days: int
    last_sync_at: dt.datetime
    message: str
