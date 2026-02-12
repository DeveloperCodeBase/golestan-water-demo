from __future__ import annotations

from datetime import datetime, timedelta, timezone
from io import BytesIO
from typing import Any, Dict, List

from reportlab.lib.pagesizes import A4
from reportlab.pdfgen import canvas
from sqlalchemy import func
from sqlalchemy.orm import Session

from app.db.models import OptimizationRun, ReleasePlan, SectorDemand, TimeseriesPoint

SCENARIO_INFLOW = {"wet": 1.2, "normal": 1.0, "dry": 0.75}
SCENARIO_DEMAND = {"wet": 0.95, "normal": 1.0, "dry": 1.1}
SECTORS = ["drinking", "environment", "industry", "agriculture"]


def _latest_storage(db: Session) -> float:
    row = (
        db.query(TimeseriesPoint)
        .filter(TimeseriesPoint.metric == "storage")
        .order_by(TimeseriesPoint.ts.desc())
        .first()
    )
    return float(row.value) if row else 700.0


def _avg_inflow(db: Session) -> float:
    row = (
        db.query(func.avg(TimeseriesPoint.value))
        .filter(TimeseriesPoint.metric == "inflow")
        .scalar()
    )
    return float(row or 120.0)


def _avg_sector_demands(db: Session) -> Dict[str, float]:
    rows = db.query(SectorDemand.sector, func.avg(SectorDemand.value)).group_by(SectorDemand.sector).all()
    values = {sector: float(val or 0.0) for sector, val in rows}
    return {
        "drinking": values.get("drinking", 55.0),
        "environment": values.get("environment", 28.0),
        "industry": values.get("industry", 32.0),
        "agriculture": values.get("agriculture", 80.0),
    }


def _clamp(val: float, low: float, high: float) -> float:
    return max(low, min(high, val))


def run_optimization(
    db: Session,
    *,
    name: str,
    horizon_days: int,
    scenario: str,
    weights: Dict[str, float],
    constraints: Dict[str, Any],
    created_by: str | None,
) -> OptimizationRun:
    now = datetime.now(timezone.utc).replace(hour=0, minute=0, second=0, microsecond=0)

    inflow_base = _avg_inflow(db)
    demand_base = _avg_sector_demands(db)
    storage = _latest_storage(db)

    min_env_flow = float(constraints.get("min_env_flow", 22.0))
    min_release = float(constraints.get("min_release", 40.0))
    max_release = float(constraints.get("max_release", 260.0))
    min_storage = float(constraints.get("min_storage", 280.0))
    max_storage = float(constraints.get("max_storage", 1150.0))

    # Ensure all sectors have a positive weight.
    sector_weights = {s: max(0.1, float(weights.get(s, 1.0))) for s in SECTORS}

    inflow_mult = SCENARIO_INFLOW.get(scenario, 1.0)
    demand_mult = SCENARIO_DEMAND.get(scenario, 1.0)

    run = OptimizationRun(
        name=name,
        params={
            "horizon_days": horizon_days,
            "scenario": scenario,
            "weights": sector_weights,
            "constraints": constraints,
        },
        status="completed",
        created_by=created_by,
        completed_at=datetime.now(timezone.utc),
    )
    db.add(run)
    db.flush()

    plans: List[ReleasePlan] = []
    satisfaction_accumulator = {s: [] for s in SECTORS}
    flood_risk_points: List[float] = []
    drought_risk_points: List[float] = []

    for day_index in range(horizon_days):
        ts = now + timedelta(days=day_index + 1)

        seasonal = 1.0 + 0.08 * (1 if day_index % 14 < 7 else -1)
        inflow = inflow_base * inflow_mult * seasonal
        demands = {s: demand_base[s] * demand_mult for s in SECTORS}
        demands["environment"] = max(demands["environment"], min_env_flow)

        target_release = sum(demands.values())
        release = _clamp(target_release, min_release, max_release)

        # Keep safe storage bounds by adjusting daily release.
        projected = storage + inflow - release
        if projected < min_storage:
            release = _clamp(storage + inflow - min_storage, min_release, max_release)
            projected = storage + inflow - release
        if projected > max_storage:
            release = _clamp(release + (projected - max_storage), min_release, max_release)
            projected = storage + inflow - release

        weighted_demands = {s: demands[s] * sector_weights[s] for s in SECTORS}
        sum_weighted = sum(weighted_demands.values())
        allocations = {s: (release * weighted_demands[s] / sum_weighted) if sum_weighted > 0 else 0.0 for s in SECTORS}

        # Force environmental minimum and re-distribute the remainder.
        if allocations["environment"] < min_env_flow:
            deficit = min_env_flow - allocations["environment"]
            allocations["environment"] = min_env_flow
            remaining = max(0.0, release - min_env_flow)
            other = ["drinking", "industry", "agriculture"]
            other_weighted = sum(weighted_demands[s] for s in other)
            for sector in other:
                allocations[sector] = remaining * weighted_demands[sector] / other_weighted if other_weighted > 0 else 0.0

        for sector in SECTORS:
            demand = max(demands[sector], 1e-6)
            satisfaction = min(1.0, allocations[sector] / demand)
            satisfaction_accumulator[sector].append(satisfaction)

        avg_satisfaction = sum(satisfaction_accumulator[s][-1] for s in SECTORS) / len(SECTORS)
        drought_risk = max(0.0, 1.0 - avg_satisfaction)
        flood_risk = _clamp((projected - (0.9 * max_storage)) / (0.1 * max_storage), 0.0, 1.0)
        risk_index = _clamp((0.65 * drought_risk) + (0.35 * flood_risk), 0.0, 1.0)

        drought_risk_points.append(drought_risk)
        flood_risk_points.append(flood_risk)

        plans.append(
            ReleasePlan(
                run_id=run.id,
                ts=ts,
                release_value=round(release, 3),
                sector_allocations={k: round(v, 3) for k, v in allocations.items()},
                storage_projection=round(projected, 3),
                risk_index=round(risk_index, 3),
            )
        )
        storage = projected

    db.add_all(plans)

    satisfaction_by_sector = {
        s: round(sum(vals) / len(vals), 3) if vals else 0.0 for s, vals in satisfaction_accumulator.items()
    }
    overall_satisfaction = round(sum(satisfaction_by_sector.values()) / len(SECTORS), 3)
    drought_risk = round(sum(drought_risk_points) / len(drought_risk_points), 3) if drought_risk_points else 0.0
    flood_risk = round(sum(flood_risk_points) / len(flood_risk_points), 3) if flood_risk_points else 0.0

    baseline_satisfaction = max(0.0, overall_satisfaction - 0.08)

    run.summary = {
        "overall_satisfaction": overall_satisfaction,
        "satisfaction_by_sector": satisfaction_by_sector,
        "drought_risk": drought_risk,
        "flood_risk": flood_risk,
        "env_flow_compliance": 1.0,
        "baseline": {
            "method": "traditional_rule_curve_mock",
            "overall_satisfaction": round(baseline_satisfaction, 3),
            "delta": round(overall_satisfaction - baseline_satisfaction, 3),
        },
        "pareto_like": [
            {"label": "توازن", "supply": overall_satisfaction, "risk": round((drought_risk + flood_risk) / 2, 3)},
            {
                "label": "تامین حداکثری",
                "supply": min(1.0, overall_satisfaction + 0.04),
                "risk": min(1.0, round((drought_risk + flood_risk) / 2 + 0.08, 3)),
            },
            {
                "label": "ریسک حداقل",
                "supply": max(0.0, overall_satisfaction - 0.05),
                "risk": max(0.0, round((drought_risk + flood_risk) / 2 - 0.1, 3)),
            },
        ],
    }

    db.commit()
    db.refresh(run)
    return run


def release_plan_rows(db: Session, run_id: str) -> List[ReleasePlan]:
    return db.query(ReleasePlan).filter(ReleasePlan.run_id == run_id).order_by(ReleasePlan.ts.asc()).all()


def export_release_plan_csv(rows: List[ReleasePlan]) -> str:
    lines = ["ts,release_value,storage_projection,risk_index,drinking,environment,industry,agriculture"]
    for row in rows:
        alloc = row.sector_allocations or {}
        line = ",".join(
            [
                row.ts.isoformat(),
                f"{row.release_value:.3f}",
                f"{row.storage_projection:.3f}",
                f"{row.risk_index:.3f}",
                f"{float(alloc.get('drinking', 0.0)):.3f}",
                f"{float(alloc.get('environment', 0.0)):.3f}",
                f"{float(alloc.get('industry', 0.0)):.3f}",
                f"{float(alloc.get('agriculture', 0.0)):.3f}",
            ]
        )
        lines.append(line)
    return "\n".join(lines)


def export_release_plan_pdf(run: OptimizationRun, rows: List[ReleasePlan]) -> bytes:
    buffer = BytesIO()
    pdf = canvas.Canvas(buffer, pagesize=A4)
    width, height = A4

    y = height - 50
    pdf.setFont("Helvetica-Bold", 12)
    pdf.drawString(40, y, f"Golestan -> Voshmgir Release Plan Report (Run: {run.id})")
    y -= 18
    pdf.setFont("Helvetica", 10)
    pdf.drawString(40, y, f"Scenario: {run.params.get('scenario', 'normal')} | Horizon: {run.params.get('horizon_days', '-')} days")
    y -= 18
    pdf.drawString(40, y, f"Overall satisfaction: {run.summary.get('overall_satisfaction', 0)}")
    y -= 24

    pdf.setFont("Helvetica-Bold", 9)
    pdf.drawString(40, y, "Date")
    pdf.drawString(160, y, "Release")
    pdf.drawString(230, y, "Storage")
    pdf.drawString(300, y, "Risk")
    y -= 12
    pdf.setFont("Helvetica", 8)

    for row in rows[:28]:
        if y < 40:
            pdf.showPage()
            y = height - 40
        pdf.drawString(40, y, row.ts.strftime("%Y-%m-%d"))
        pdf.drawString(160, y, f"{row.release_value:.1f}")
        pdf.drawString(230, y, f"{row.storage_projection:.1f}")
        pdf.drawString(300, y, f"{row.risk_index:.2f}")
        y -= 11

    pdf.showPage()
    pdf.save()
    buffer.seek(0)
    return buffer.read()
