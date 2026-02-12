from __future__ import annotations

from datetime import datetime, timedelta, timezone
from typing import Any, Dict, List

from sqlalchemy import func
from sqlalchemy.orm import Session

from app.db.models import Scenario, ScenarioResult, SectorDemand, TimeseriesPoint


SCENARIO_FACTORS = {
    "wet": {"inflow": 1.25, "demand": 0.92},
    "normal": {"inflow": 1.0, "demand": 1.0},
    "dry": {"inflow": 0.72, "demand": 1.12},
}


def simulate_scenario(db: Session, scenario: Scenario) -> ScenarioResult:
    params = scenario.params or {}
    horizon = int(params.get("horizon_days", 14))
    climate = params.get("climate", "normal")

    manual_inflow_adj = float(params.get("manual_inflow_adjustment", 1.0))
    manual_safety_max_release = float(params.get("manual_max_release", 260.0))

    factors = SCENARIO_FACTORS.get(climate, SCENARIO_FACTORS["normal"])

    inflow_base = float(db.query(func.avg(TimeseriesPoint.value)).filter(TimeseriesPoint.metric == "inflow").scalar() or 120.0)
    demand_base = float(db.query(func.avg(SectorDemand.value)).scalar() or 55.0)
    storage = float(
        db.query(TimeseriesPoint.value)
        .filter(TimeseriesPoint.metric == "storage")
        .order_by(TimeseriesPoint.ts.desc())
        .limit(1)
        .scalar()
        or 700.0
    )

    now = datetime.now(timezone.utc).replace(hour=0, minute=0, second=0, microsecond=0)
    points: List[Dict[str, Any]] = []
    shortage_days = 0
    spill_days = 0

    for i in range(horizon):
        ts = now + timedelta(days=i + 1)
        inflow = inflow_base * factors["inflow"] * manual_inflow_adj
        demand = demand_base * 4 * factors["demand"]
        release = min(manual_safety_max_release, max(50.0, demand))

        storage = storage + inflow - release
        if storage < 300:
            shortage_days += 1
        if storage > 1100:
            spill_days += 1

        points.append(
            {
                "ts": ts.isoformat(),
                "inflow": round(inflow, 3),
                "release": round(release, 3),
                "storage": round(storage, 3),
            }
        )

    result = ScenarioResult(
        scenario_id=scenario.id,
        result={
            "climate": climate,
            "horizon_days": horizon,
            "points": points,
            "summary": {
                "shortage_risk": round(shortage_days / max(horizon, 1), 3),
                "spill_risk": round(spill_days / max(horizon, 1), 3),
            },
        },
    )

    scenario.status = "simulated"
    db.add(result)
    db.commit()
    db.refresh(result)
    return result
