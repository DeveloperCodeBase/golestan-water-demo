from __future__ import annotations

import hashlib
import re
from datetime import datetime, timedelta, timezone
from typing import Any, Dict, Optional
from uuid import uuid4

from jose import JWTError, jwt
from jose.exceptions import ExpiredSignatureError
from passlib.context import CryptContext

from app.core.config import get_settings

pwd_context = CryptContext(schemes=["argon2", "bcrypt"], deprecated="auto")


class PasswordPolicyError(ValueError):
    pass


class TokenDecodeError(ValueError):
    def __init__(self, code: str, message: str):
        super().__init__(message)
        self.code = code
        self.message = message


def verify_password(plain_password: str, hashed_password: str) -> bool:
    return pwd_context.verify(plain_password, hashed_password)


def get_password_hash(password: str) -> str:
    return pwd_context.hash(password)


def validate_password_policy(password: str) -> None:
    # Demo policy: compatible with seeded demo credentials (admin123, ...)
    if len(password) < 6:
        raise PasswordPolicyError("Password must be at least 6 characters long")
    if not re.search(r"[A-Za-z]", password):
        raise PasswordPolicyError("Password must include at least one letter")
    if not re.search(r"\d", password):
        raise PasswordPolicyError("Password must include at least one digit")


def create_token(subject: str, token_type: str, expires_delta: timedelta, extra: Optional[Dict[str, Any]] = None) -> str:
    settings = get_settings()
    now = datetime.now(timezone.utc)
    payload: Dict[str, Any] = {
        "sub": subject,
        "type": token_type,
        "jti": str(uuid4()),
        "iat": int(now.timestamp()),
        "exp": int((now + expires_delta).timestamp()),
    }
    if extra:
        payload.update(extra)
    return jwt.encode(payload, settings.secret_key, algorithm="HS256")


def create_access_token(user_id: str, role_names: list[str]) -> str:
    settings = get_settings()
    return create_token(
        subject=user_id,
        token_type="access",
        expires_delta=timedelta(minutes=settings.access_token_expire_minutes),
        extra={"roles": role_names},
    )


def create_refresh_token(user_id: str) -> str:
    settings = get_settings()
    return create_token(
        subject=user_id,
        token_type="refresh",
        expires_delta=timedelta(minutes=settings.refresh_token_expire_minutes),
    )


def decode_token(token: str) -> Dict[str, Any]:
    settings = get_settings()
    try:
        return jwt.decode(token, settings.secret_key, algorithms=["HS256"])
    except ExpiredSignatureError as exc:
        raise TokenDecodeError("token_expired", "Token expired") from exc
    except JWTError as exc:
        raise TokenDecodeError("invalid_token", "Invalid token") from exc


def hash_token(token: str) -> str:
    return hashlib.sha256(token.encode("utf-8")).hexdigest()
