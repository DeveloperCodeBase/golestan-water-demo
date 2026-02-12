from __future__ import annotations

from datetime import datetime, timedelta, timezone
from typing import Dict, List, Tuple

import numpy as np
from sqlalchemy import func
from sqlalchemy.orm import Session

from app.db.models import ForecastPoint, ForecastRun, SectorDemand, TimeseriesPoint

SCENARIO_MULTIPLIER = {
    "wet": 1.15,
    "normal": 1.0,
    "dry": 0.82,
}


def _load_series(db: Session, entity: str) -> List[Tuple[datetime, float]]:
    if entity == "demand":
        rows = (
            db.query(SectorDemand.ts, func.sum(SectorDemand.value))
            .group_by(SectorDemand.ts)
            .order_by(SectorDemand.ts.asc())
            .all()
        )
        return [(ts, float(value)) for ts, value in rows]

    metric = "inflow" if entity == "inflow" else "storage"
    rows = (
        db.query(TimeseriesPoint.ts, TimeseriesPoint.value)
        .filter(TimeseriesPoint.metric == metric)
        .order_by(TimeseriesPoint.ts.asc())
        .all()
    )
    return [(ts, float(value)) for ts, value in rows]


def _calc_metrics(values: List[float]) -> Dict[str, float]:
    if len(values) < 3:
        return {"mae": 0.0, "rmse": 0.0, "mape": 0.0}

    arr = np.array(values, dtype=float)
    y_true = arr[1:]
    y_pred = arr[:-1]

    mae = float(np.mean(np.abs(y_true - y_pred)))
    rmse = float(np.sqrt(np.mean((y_true - y_pred) ** 2)))

    non_zero_mask = np.abs(y_true) > 1e-6
    if np.any(non_zero_mask):
        mape = float(np.mean(np.abs((y_true[non_zero_mask] - y_pred[non_zero_mask]) / y_true[non_zero_mask])) * 100)
    else:
        mape = 0.0

    return {"mae": round(mae, 3), "rmse": round(rmse, 3), "mape": round(mape, 3)}


def train_forecast_model(db: Session, entity: str, created_by: str | None = None) -> ForecastRun:
    series = _load_series(db, entity)
    values = [v for _, v in series]
    metrics = _calc_metrics(values)

    run = ForecastRun(
        entity=entity,
        model_name="demo_baseline_v1",
        status="completed",
        data_window_start=series[0][0] if series else None,
        data_window_end=series[-1][0] if series else None,
        metrics=metrics,
        confidence=0.8,
        scenario="normal",
        created_by=created_by,
        completed_at=datetime.now(timezone.utc),
    )
    db.add(run)
    db.commit()
    db.refresh(run)
    return run


def run_forecast(db: Session, entity: str, horizon_days: int, scenario: str, created_by: str | None = None) -> ForecastRun:
    series = _load_series(db, entity)
    values = [v for _, v in series]
    metrics = _calc_metrics(values)

    multiplier = SCENARIO_MULTIPLIER.get(scenario, 1.0)
    now = datetime.now(timezone.utc).replace(hour=0, minute=0, second=0, microsecond=0)

    if len(values) >= 30:
        base = float(np.mean(values[-30:]))
        volatility = float(np.std(values[-30:]))
    elif values:
        base = float(np.mean(values))
        volatility = float(np.std(values)) if len(values) > 1 else max(base * 0.1, 1.0)
    else:
        base = 100.0
        volatility = 10.0

    run = ForecastRun(
        entity=entity,
        model_name="demo_baseline_v1",
        status="completed",
        data_window_start=series[0][0] if series else None,
        data_window_end=series[-1][0] if series else None,
        metrics=metrics,
        confidence=0.8,
        scenario=scenario,
        created_by=created_by,
        completed_at=datetime.now(timezone.utc),
    )
    db.add(run)
    db.flush()

    trend = 0.02 if scenario == "wet" else (-0.02 if scenario == "dry" else 0.0)

    points: List[ForecastPoint] = []
    for i in range(horizon_days):
        day = now + timedelta(days=i + 1)
        growth_factor = 1.0 + trend * (i / max(horizon_days, 1))
        pred = max(0.0, base * multiplier * growth_factor)
        band = max(1.0, volatility * 0.8)

        points.append(
            ForecastPoint(
                run_id=run.id,
                metric="value",
                ts=day,
                predicted_value=round(pred, 3),
                lower_bound=round(max(0.0, pred - band), 3),
                upper_bound=round(pred + band, 3),
            )
        )

    db.add_all(points)
    db.commit()
    db.refresh(run)
    return run
