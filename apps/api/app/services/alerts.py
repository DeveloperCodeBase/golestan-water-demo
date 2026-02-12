from __future__ import annotations

from typing import List

from sqlalchemy.orm import Session

from app.db.models import AlertEvent, AlertRule, TimeseriesPoint


OPERATORS = {
    ">": lambda a, b: a > b,
    ">=": lambda a, b: a >= b,
    "<": lambda a, b: a < b,
    "<=": lambda a, b: a <= b,
    "==": lambda a, b: a == b,
}


def evaluate_alert_rules(db: Session) -> List[AlertEvent]:
    rules = db.query(AlertRule).filter(AlertRule.is_active.is_(True)).all()
    created_events: List[AlertEvent] = []

    for rule in rules:
        latest = (
            db.query(TimeseriesPoint)
            .filter(TimeseriesPoint.metric == rule.metric)
            .order_by(TimeseriesPoint.ts.desc())
            .first()
        )
        if not latest:
            continue

        comparator = OPERATORS.get(rule.operator, OPERATORS[">"])
        if comparator(float(latest.value), float(rule.threshold)):
            event = AlertEvent(
                rule_id=rule.id,
                metric=rule.metric,
                value=float(latest.value),
                severity=rule.severity,
                message=f"Rule '{rule.name}' triggered: {latest.value} {rule.operator} {rule.threshold}",
                status="open",
            )
            db.add(event)
            created_events.append(event)

    db.commit()
    for ev in created_events:
        db.refresh(ev)
    return created_events
