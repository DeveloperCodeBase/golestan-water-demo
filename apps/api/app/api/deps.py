from __future__ import annotations

from collections import defaultdict
from dataclasses import dataclass
from typing import Dict, List

from fastapi import Depends, HTTPException
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer
from sqlalchemy.orm import Session

from app.core.security import decode_token
from app.db.models import Permission, Role, RolePermission, User, UserRole
from app.db.session import get_db

bearer_scheme = HTTPBearer(auto_error=False)


@dataclass
class CurrentUser:
    id: str
    username: str
    roles: List[str]
    permissions: List[str]


def _load_permissions(db: Session, user_id: str) -> tuple[list[str], list[str]]:
    rows = (
        db.query(Role.name, Permission.name)
        .join(UserRole, UserRole.role_id == Role.id)
        .join(RolePermission, RolePermission.role_id == Role.id)
        .join(Permission, Permission.id == RolePermission.permission_id)
        .filter(UserRole.user_id == user_id)
        .all()
    )

    role_names = set()
    permissions = set()
    for role_name, perm_name in rows:
        role_names.add(role_name)
        permissions.add(perm_name)

    # Include roles even if no direct permission rows exist.
    role_only_rows = db.query(Role.name).join(UserRole, UserRole.role_id == Role.id).filter(UserRole.user_id == user_id).all()
    for role_name, in role_only_rows:
        role_names.add(role_name)

    return sorted(role_names), sorted(permissions)


def get_current_user(
    credentials: HTTPAuthorizationCredentials | None = Depends(bearer_scheme),
    db: Session = Depends(get_db),
) -> CurrentUser:
    if credentials is None:
        raise HTTPException(status_code=401, detail={"code": "unauthorized", "message": "Missing authorization token"})

    payload = decode_token(credentials.credentials)
    if payload.get("type") != "access":
        raise HTTPException(status_code=401, detail={"code": "unauthorized", "message": "Invalid token type"})

    user_id = payload.get("sub")
    if not user_id:
        raise HTTPException(status_code=401, detail={"code": "unauthorized", "message": "Invalid token subject"})

    user = db.query(User).filter(User.id == user_id, User.is_active.is_(True)).first()
    if not user:
        raise HTTPException(status_code=401, detail={"code": "unauthorized", "message": "User is not active"})

    roles, permissions = _load_permissions(db, user.id)
    return CurrentUser(id=user.id, username=user.username, roles=roles, permissions=permissions)


def require_permission(permission_name: str):
    def _dependency(current_user: CurrentUser = Depends(get_current_user)) -> CurrentUser:
        if permission_name not in current_user.permissions and "admin" not in current_user.roles:
            raise HTTPException(
                status_code=403,
                detail={
                    "code": "forbidden",
                    "message": f"Permission '{permission_name}' required",
                },
            )
        return current_user

    return _dependency


def serialize_user(db: Session, user: User) -> Dict[str, object]:
    role_rows = db.query(Role.name).join(UserRole, UserRole.role_id == Role.id).filter(UserRole.user_id == user.id).all()
    role_names = [name for (name,) in role_rows]
    return {
        "id": user.id,
        "username": user.username,
        "full_name": user.full_name,
        "email": user.email,
        "is_active": user.is_active,
        "mfa_enabled": user.mfa_enabled,
        "roles": role_names,
        "created_at": user.created_at.isoformat() if user.created_at else None,
        "updated_at": user.updated_at.isoformat() if user.updated_at else None,
    }
