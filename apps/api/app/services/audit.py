from __future__ import annotations

from typing import Any, Dict, Optional

from sqlalchemy.orm import Session

from app.db.models import AuditEvent


def log_audit_event(
    db: Session,
    *,
    actor_user_id: Optional[str],
    action: str,
    entity: str,
    entity_id: Optional[str] = None,
    details: Optional[Dict[str, Any]] = None,
) -> AuditEvent:
    event = AuditEvent(
        actor_user_id=actor_user_id,
        action=action,
        entity=entity,
        entity_id=entity_id,
        details=details or {},
    )
    db.add(event)
    db.commit()
    db.refresh(event)
    return event
