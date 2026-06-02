from pydantic import BaseModel, EmailStr, Field


class UserCreate(BaseModel):
    email: EmailStr
    password: str = Field(min_length=8, max_length=128)
    taille_cm: float | None = Field(default=None, ge=120, le=230)
    poids_cible_kg: float | None = Field(default=None, ge=20, le=300)


class UserOut(BaseModel):
    id: int
    email: EmailStr
    taille_cm: float | None
    poids_cible_kg: float | None
    timezone: str

    model_config = {"from_attributes": True}


class UserUpdate(BaseModel):
    taille_cm: float | None = Field(default=None, ge=120, le=230)
    poids_cible_kg: float | None = Field(default=None, ge=20, le=300)
