from __future__ import annotations

from typing import Optional

from fastapi import APIRouter, Depends, HTTPException, Query, Request
from sqlalchemy import desc
from sqlalchemy.orm import Session

from app.api.deps import CurrentUser, require_permission, serialize_user
from app.core.security import PasswordPolicyError, get_password_hash, validate_password_policy
from app.db.models import AuditEvent, Permission, Role, RolePermission, User, UserRole
from app.db.session import get_db
from app.schemas.api import RoleCreate, UserCreate, UserUpdate
from app.services.audit import log_audit_event
from app.utils.pagination import apply_pagination, pagination_params
from app.utils.responses import pagination_payload, success_response

router = APIRouter(tags=["users-rbac"])


@router.get("/users")
def list_users(
    request: Request,
    page_data=Depends(pagination_params),
    db: Session = Depends(get_db),
    _: CurrentUser = Depends(require_permission("admin.users.manage")),
):
    page, page_size = page_data
    query = db.query(User).order_by(User.created_at.desc())
    total = query.count()
    users = apply_pagination(query, page, page_size).all()
    data = [serialize_user(db, user) for user in users]
    return success_response(request, data, pagination_payload(page, page_size, total))


@router.post("/users")
def create_user(
    payload: UserCreate,
    request: Request,
    db: Session = Depends(get_db),
    current_user: CurrentUser = Depends(require_permission("admin.users.manage")),
):
    if db.query(User).filter(User.username == payload.username).first():
        raise HTTPException(status_code=409, detail={"code": "conflict", "message": "Username already exists"})

    if payload.email and db.query(User).filter(User.email == payload.email).first():
        raise HTTPException(status_code=409, detail={"code": "conflict", "message": "Email already exists"})

    try:
        validate_password_policy(payload.password)
    except PasswordPolicyError as exc:
        raise HTTPException(status_code=422, detail={"code": "weak_password", "message": str(exc)}) from exc

    user = User(
        username=payload.username,
        full_name=payload.full_name,
        email=payload.email,
        hashed_password=get_password_hash(payload.password),
        is_active=True,
    )
    db.add(user)
    db.flush()

    if payload.role_names:
        roles = db.query(Role).filter(Role.name.in_(payload.role_names)).all()
        for role in roles:
            db.add(UserRole(user_id=user.id, role_id=role.id))

    db.commit()
    db.refresh(user)

    log_audit_event(
        db,
        actor_user_id=current_user.id,
        action="user.create",
        entity="user",
        entity_id=user.id,
        details={"username": user.username, "roles": payload.role_names},
    )

    return success_response(request, serialize_user(db, user))


@router.get("/users/{user_id}")
def get_user(
    user_id: str,
    request: Request,
    db: Session = Depends(get_db),
    _: CurrentUser = Depends(require_permission("admin.users.manage")),
):
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail={"code": "not_found", "message": "User not found"})
    return success_response(request, serialize_user(db, user))


@router.patch("/users/{user_id}")
def update_user(
    user_id: str,
    payload: UserUpdate,
    request: Request,
    db: Session = Depends(get_db),
    current_user: CurrentUser = Depends(require_permission("admin.users.manage")),
):
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail={"code": "not_found", "message": "User not found"})

    if payload.full_name is not None:
        user.full_name = payload.full_name
    if payload.email is not None:
        existing = db.query(User).filter(User.email == payload.email, User.id != user.id).first()
        if existing:
            raise HTTPException(status_code=409, detail={"code": "conflict", "message": "Email already used"})
        user.email = payload.email
    if payload.is_active is not None:
        user.is_active = payload.is_active

    if payload.role_names is not None:
        db.query(UserRole).filter(UserRole.user_id == user.id).delete()
        roles = db.query(Role).filter(Role.name.in_(payload.role_names)).all()
        for role in roles:
            db.add(UserRole(user_id=user.id, role_id=role.id))

    db.commit()
    db.refresh(user)

    log_audit_event(
        db,
        actor_user_id=current_user.id,
        action="user.update",
        entity="user",
        entity_id=user.id,
        details={"role_names": payload.role_names, "is_active": payload.is_active},
    )

    return success_response(request, serialize_user(db, user))


@router.delete("/users/{user_id}")
def delete_user(
    user_id: str,
    request: Request,
    db: Session = Depends(get_db),
    current_user: CurrentUser = Depends(require_permission("admin.users.manage")),
):
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail={"code": "not_found", "message": "User not found"})

    username = user.username
    db.delete(user)
    db.commit()

    log_audit_event(
        db,
        actor_user_id=current_user.id,
        action="user.delete",
        entity="user",
        entity_id=user_id,
        details={"username": username},
    )

    return success_response(request, {"deleted": True})


@router.get("/roles")
def list_roles(
    request: Request,
    page_data=Depends(pagination_params),
    db: Session = Depends(get_db),
    _: CurrentUser = Depends(require_permission("admin.roles.manage")),
):
    page, page_size = page_data
    query = db.query(Role).order_by(Role.name.asc())
    total = query.count()
    roles = apply_pagination(query, page, page_size).all()
    data = []
    for role in roles:
        perms = (
            db.query(Permission.name)
            .join(RolePermission, RolePermission.permission_id == Permission.id)
            .filter(RolePermission.role_id == role.id)
            .all()
        )
        data.append(
            {
                "id": role.id,
                "name": role.name,
                "description": role.description,
                "permissions": [name for (name,) in perms],
            }
        )
    return success_response(request, data, pagination_payload(page, page_size, total))


@router.post("/roles")
def create_role(
    payload: RoleCreate,
    request: Request,
    db: Session = Depends(get_db),
    current_user: CurrentUser = Depends(require_permission("admin.roles.manage")),
):
    if db.query(Role).filter(Role.name == payload.name).first():
        raise HTTPException(status_code=409, detail={"code": "conflict", "message": "Role already exists"})

    role = Role(name=payload.name, description=payload.description)
    db.add(role)
    db.flush()

    if payload.permission_names:
        perms = db.query(Permission).filter(Permission.name.in_(payload.permission_names)).all()
        for perm in perms:
            db.add(RolePermission(role_id=role.id, permission_id=perm.id))

    db.commit()
    db.refresh(role)

    log_audit_event(
        db,
        actor_user_id=current_user.id,
        action="role.create",
        entity="role",
        entity_id=role.id,
        details={"name": role.name, "permissions": payload.permission_names},
    )

    return success_response(
        request,
        {
            "id": role.id,
            "name": role.name,
            "description": role.description,
            "permissions": payload.permission_names,
        },
    )


@router.get("/permissions")
def list_permissions(
    request: Request,
    page_data=Depends(pagination_params),
    db: Session = Depends(get_db),
    _: CurrentUser = Depends(require_permission("admin.roles.manage")),
):
    page, page_size = page_data
    query = db.query(Permission).order_by(Permission.module.asc(), Permission.name.asc())
    total = query.count()
    perms = apply_pagination(query, page, page_size).all()
    data = [{"id": p.id, "name": p.name, "module": p.module, "description": p.description} for p in perms]
    return success_response(request, data, pagination_payload(page, page_size, total))


@router.get("/audit-logs")
def list_audit_logs(
    request: Request,
    filter: Optional[str] = Query(default=None),
    page_data=Depends(pagination_params),
    db: Session = Depends(get_db),
    _: CurrentUser = Depends(require_permission("audit.read")),
):
    page, page_size = page_data

    query = db.query(AuditEvent)
    if filter:
        query = query.filter(
            (AuditEvent.action.ilike(f"%{filter}%"))
            | (AuditEvent.entity.ilike(f"%{filter}%"))
        )

    query = query.order_by(desc(AuditEvent.created_at))
    total = query.count()
    rows = apply_pagination(query, page, page_size).all()

    data = [
        {
            "id": row.id,
            "actor_user_id": row.actor_user_id,
            "action": row.action,
            "entity": row.entity,
            "entity_id": row.entity_id,
            "details": row.details,
            "created_at": row.created_at.isoformat() if row.created_at else None,
        }
        for row in rows
    ]

    return success_response(request, data, pagination_payload(page, page_size, total))
