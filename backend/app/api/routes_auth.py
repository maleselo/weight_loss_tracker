from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.security import OAuth2PasswordRequestForm
from sqlalchemy import select
from sqlalchemy.exc import IntegrityError
from sqlalchemy.orm import Session

from app.api.deps import get_current_user
from app.core.security import create_access_token, hash_password, verify_password
from app.db.session import get_db
from app.models.user import User
from app.schemas.auth import (
    ForgotPasswordRequest,
    ForgotPasswordResponse,
    MessageResponse,
    ResetPasswordRequest,
    Token,
)
from app.services.password_reset import FORGOT_PASSWORD_MESSAGE, request_password_reset, reset_password
from app.schemas.user import UserCreate, UserOut, UserUpdate

router = APIRouter()


@router.post("/register", response_model=UserOut, status_code=201)
def register(payload: UserCreate, db: Session = Depends(get_db)):
    user = User(
        email=payload.email.lower(),
        password_hash=hash_password(payload.password),
        taille_cm=payload.taille_cm,
    )
    db.add(user)
    try:
        db.commit()
    except IntegrityError as e:
        db.rollback()
        raise HTTPException(status_code=409, detail="Cet email est déjà utilisé.") from e
    db.refresh(user)
    return user


@router.post("/login", response_model=Token)
def login(form: OAuth2PasswordRequestForm = Depends(), db: Session = Depends(get_db)):
    stmt = select(User).where(User.email == form.username.lower())
    user = db.scalars(stmt).first()
    if user is None or not verify_password(form.password, user.password_hash):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Email ou mot de passe incorrect.",
            headers={"WWW-Authenticate": "Bearer"},
        )
    return Token(access_token=create_access_token(str(user.id)))


@router.post("/forgot-password", response_model=ForgotPasswordResponse)
def forgot_password(payload: ForgotPasswordRequest, db: Session = Depends(get_db)):
    debug_url = request_password_reset(db, payload.email)
    return ForgotPasswordResponse(message=FORGOT_PASSWORD_MESSAGE, debug_reset_url=debug_url)


@router.post("/reset-password", response_model=MessageResponse)
def reset_password_route(payload: ResetPasswordRequest, db: Session = Depends(get_db)):
    if not reset_password(db, payload.token, payload.password):
        raise HTTPException(status_code=400, detail="Lien invalide ou expiré. Demandez un nouveau lien.")
    return MessageResponse(message="Mot de passe mis à jour. Vous pouvez vous connecter.")


@router.get("/me", response_model=UserOut)
def me(current_user: User = Depends(get_current_user)):
    return current_user


@router.patch("/me", response_model=UserOut)
def update_me(
    payload: UserUpdate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    data = payload.model_dump(exclude_unset=True)
    for key, value in data.items():
        setattr(current_user, key, value)
    db.commit()
    db.refresh(current_user)
    return current_user
