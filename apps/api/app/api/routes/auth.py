from __future__ import annotations

from datetime import datetime, timedelta, timezone

from fastapi import APIRouter, Depends, HTTPException, Request
from sqlalchemy.orm import Session

from app.api.deps import serialize_user
from app.core.config import get_settings
from app.core.security import (
    PasswordPolicyError,
    TokenDecodeError,
    create_access_token,
    create_refresh_token,
    decode_token,
    get_password_hash,
    hash_token,
    validate_password_policy,
    verify_password,
)
from app.db.models import RefreshToken, Role, User, UserRole
from app.db.session import get_db
from app.schemas.api import (
    ForgotPasswordRequest,
    LoginRequest,
    LogoutRequest,
    RefreshRequest,
    ResetPasswordRequest,
)
from app.services.audit import log_audit_event
from app.utils.responses import success_response

router = APIRouter(prefix="/auth", tags=["auth"])


def _user_roles(db: Session, user_id: str) -> list[str]:
    rows = db.query(Role.name).join(UserRole, UserRole.role_id == Role.id).filter(UserRole.user_id == user_id).all()
    return [name for (name,) in rows]


@router.post("/login")
def login(payload: LoginRequest, request: Request, db: Session = Depends(get_db)):
    user = db.query(User).filter(User.username == payload.username).first()
    if not user or not verify_password(payload.password, user.hashed_password):
        raise HTTPException(status_code=401, detail={"code": "invalid_credentials", "message": "Invalid username or password"})

    if not user.is_active:
        raise HTTPException(status_code=403, detail={"code": "inactive_user", "message": "User is inactive"})

    roles = _user_roles(db, user.id)
    access_token = create_access_token(user_id=user.id, role_names=roles)
    refresh_token = create_refresh_token(user_id=user.id)

    settings = get_settings()
    expires_at = datetime.now(timezone.utc) + timedelta(minutes=settings.refresh_token_expire_minutes)
    db.add(
        RefreshToken(
            user_id=user.id,
            token_hash=hash_token(refresh_token),
            expires_at=expires_at,
            is_revoked=False,
        )
    )
    db.commit()

    log_audit_event(
        db,
        actor_user_id=user.id,
        action="auth.login",
        entity="user",
        entity_id=user.id,
        details={"username": user.username},
    )

    return success_response(
        request,
        {
            "access_token": access_token,
            "refresh_token": refresh_token,
            "token_type": "bearer",
            "user": serialize_user(db, user),
        },
    )


@router.post("/refresh")
def refresh(payload: RefreshRequest, request: Request, db: Session = Depends(get_db)):
    try:
        token_data = decode_token(payload.refresh_token)
    except TokenDecodeError as exc:
        raise HTTPException(status_code=401, detail={"code": exc.code, "message": exc.message}) from exc

    if token_data.get("type") != "refresh":
        raise HTTPException(status_code=401, detail={"code": "invalid_token", "message": "Invalid refresh token"})

    token_hash = hash_token(payload.refresh_token)
    record = db.query(RefreshToken).filter(RefreshToken.token_hash == token_hash).first()
    if not record or record.is_revoked or record.expires_at < datetime.now(timezone.utc):
        raise HTTPException(status_code=401, detail={"code": "invalid_token", "message": "Refresh token expired or revoked"})

    user = db.query(User).filter(User.id == record.user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail={"code": "not_found", "message": "User not found"})

    roles = _user_roles(db, user.id)
    new_access = create_access_token(user_id=user.id, role_names=roles)
    return success_response(request, {"access_token": new_access, "token_type": "bearer"})


@router.post("/logout")
def logout(payload: LogoutRequest, request: Request, db: Session = Depends(get_db)):
    token_hash = hash_token(payload.refresh_token)
    record = db.query(RefreshToken).filter(RefreshToken.token_hash == token_hash).first()
    if record:
        record.is_revoked = True
        db.commit()
    return success_response(request, {"logged_out": True})


@router.post("/forgot-password")
def forgot_password(payload: ForgotPasswordRequest, request: Request, db: Session = Depends(get_db)):
    user = db.query(User).filter(User.username == payload.username).first()
    # Demo behavior: always return success to avoid user enumeration.
    if user:
        log_audit_event(
            db,
            actor_user_id=user.id,
            action="auth.forgot_password",
            entity="user",
            entity_id=user.id,
            details={"username": user.username},
        )
    return success_response(request, {"message": "If account exists, reset instructions were generated (demo)."})


@router.post("/reset-password")
def reset_password(payload: ResetPasswordRequest, request: Request, db: Session = Depends(get_db)):
    user = db.query(User).filter(User.username == payload.username).first()
    if not user:
        raise HTTPException(status_code=404, detail={"code": "not_found", "message": "User not found"})

    try:
        validate_password_policy(payload.new_password)
    except PasswordPolicyError as exc:
        raise HTTPException(status_code=422, detail={"code": "weak_password", "message": str(exc)}) from exc

    user.hashed_password = get_password_hash(payload.new_password)
    db.commit()

    log_audit_event(
        db,
        actor_user_id=user.id,
        action="auth.reset_password",
        entity="user",
        entity_id=user.id,
        details={"username": user.username},
    )
    return success_response(request, {"message": "Password reset completed"})
