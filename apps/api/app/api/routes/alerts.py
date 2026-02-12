from __future__ import annotations

from fastapi import APIRouter, Depends, Request
from sqlalchemy.orm import Session

from app.api.deps import CurrentUser, require_permission
from app.db.models import AlertEvent, AlertRule
from app.db.session import get_db
from app.schemas.api import AlertRuleCreateRequest
from app.services.alerts import evaluate_alert_rules
from app.services.audit import log_audit_event
from app.utils.pagination import apply_pagination, pagination_params
from app.utils.responses import pagination_payload, success_response

router = APIRouter(prefix="/alerts", tags=["alerts"])


@router.post("/rules")
def create_rule(
    payload: AlertRuleCreateRequest,
    request: Request,
    db: Session = Depends(get_db),
    current_user: CurrentUser = Depends(require_permission("alerts.manage")),
):
    rule = AlertRule(
        name=payload.name,
        metric=payload.metric,
        operator=payload.operator,
        threshold=payload.threshold,
        severity=payload.severity,
        is_active=payload.is_active,
    )
    db.add(rule)
    db.commit()
    db.refresh(rule)

    log_audit_event(
        db,
        actor_user_id=current_user.id,
        action="alert_rule.create",
        entity="alert_rule",
        entity_id=rule.id,
        details={"name": rule.name, "metric": rule.metric, "threshold": rule.threshold},
    )

    return success_response(
        request,
        {
            "id": rule.id,
            "name": rule.name,
            "metric": rule.metric,
            "operator": rule.operator,
            "threshold": rule.threshold,
            "severity": rule.severity,
            "is_active": rule.is_active,
        },
    )


@router.get("")
def list_alerts(
    request: Request,
    page_data=Depends(pagination_params),
    db: Session = Depends(get_db),
    _: CurrentUser = Depends(require_permission("alerts.read")),
):
    page, page_size = page_data
    query = db.query(AlertEvent).order_by(AlertEvent.created_at.desc())
    total = query.count()
    rows = apply_pagination(query, page, page_size).all()

    data = [
        {
            "id": row.id,
            "rule_id": row.rule_id,
            "metric": row.metric,
            "value": row.value,
            "severity": row.severity,
            "message": row.message,
            "status": row.status,
            "created_at": row.created_at.isoformat() if row.created_at else None,
        }
        for row in rows
    ]

    return success_response(request, data, pagination_payload(page, page_size, total))


@router.post("/evaluate")
def evaluate(
    request: Request,
    db: Session = Depends(get_db),
    current_user: CurrentUser = Depends(require_permission("alerts.read")),
):
    events = evaluate_alert_rules(db)

    log_audit_event(
        db,
        actor_user_id=current_user.id,
        action="alerts.evaluate",
        entity="alert_event",
        details={"created_events": len(events)},
    )

    data = [
        {
            "id": ev.id,
            "rule_id": ev.rule_id,
            "metric": ev.metric,
            "value": ev.value,
            "severity": ev.severity,
            "message": ev.message,
            "status": ev.status,
            "created_at": ev.created_at.isoformat() if ev.created_at else None,
        }
        for ev in events
    ]
    return success_response(request, {"created": len(events), "events": data})
