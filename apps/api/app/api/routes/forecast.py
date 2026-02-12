from __future__ import annotations

from fastapi import APIRouter, Depends, HTTPException, Request
from sqlalchemy.orm import Session

from app.api.deps import CurrentUser, require_permission
from app.db.models import ForecastPoint, ForecastRun
from app.db.session import get_db
from app.schemas.api import ForecastRunRequest, ForecastTrainRequest
from app.services.audit import log_audit_event
from app.services.forecasting import run_forecast, train_forecast_model
from app.utils.pagination import apply_pagination, pagination_params
from app.utils.responses import pagination_payload, success_response

router = APIRouter(prefix="/forecast", tags=["forecasting"])


def _entity_name(entity: str) -> str:
    if entity == "state":
        return "state"
    return entity


def _run_payload(run: ForecastRun, include_points: bool = False) -> dict:
    payload = {
        "id": run.id,
        "entity": run.entity,
        "model_name": run.model_name,
        "status": run.status,
        "scenario": run.scenario,
        "metrics": run.metrics,
        "confidence": run.confidence,
        "data_window_start": run.data_window_start.isoformat() if run.data_window_start else None,
        "data_window_end": run.data_window_end.isoformat() if run.data_window_end else None,
        "created_at": run.created_at.isoformat() if run.created_at else None,
        "completed_at": run.completed_at.isoformat() if run.completed_at else None,
    }
    if include_points:
        payload["points"] = [
            {
                "id": p.id,
                "metric": p.metric,
                "ts": p.ts.isoformat(),
                "predicted_value": p.predicted_value,
                "lower_bound": p.lower_bound,
                "upper_bound": p.upper_bound,
            }
            for p in sorted(run.points, key=lambda x: x.ts)
        ]
    return payload


@router.post("/train")
def train(
    payload: ForecastTrainRequest,
    request: Request,
    db: Session = Depends(get_db),
    current_user: CurrentUser = Depends(require_permission("forecast.run")),
):
    run = train_forecast_model(db, entity=_entity_name(payload.entity), created_by=current_user.id)

    log_audit_event(
        db,
        actor_user_id=current_user.id,
        action="forecast.train",
        entity="forecast_run",
        entity_id=run.id,
        details={"entity": payload.entity, "model": run.model_name},
    )

    return success_response(request, _run_payload(run))


@router.post("/run")
def run(
    payload: ForecastRunRequest,
    request: Request,
    db: Session = Depends(get_db),
    current_user: CurrentUser = Depends(require_permission("forecast.run")),
):
    run = run_forecast(
        db,
        entity=_entity_name(payload.entity),
        horizon_days=payload.horizon_days,
        scenario=payload.scenario,
        created_by=current_user.id,
    )

    log_audit_event(
        db,
        actor_user_id=current_user.id,
        action="forecast.run",
        entity="forecast_run",
        entity_id=run.id,
        details={"entity": payload.entity, "horizon_days": payload.horizon_days, "scenario": payload.scenario},
    )

    return success_response(request, _run_payload(run, include_points=True))


@router.get("/runs")
def list_runs(
    request: Request,
    page_data=Depends(pagination_params),
    db: Session = Depends(get_db),
    _: CurrentUser = Depends(require_permission("forecast.read")),
):
    page, page_size = page_data
    query = db.query(ForecastRun).order_by(ForecastRun.created_at.desc())
    total = query.count()
    rows = apply_pagination(query, page, page_size).all()
    data = [_run_payload(r) for r in rows]
    return success_response(request, data, pagination_payload(page, page_size, total))


@router.get("/runs/{run_id}")
def get_run(
    run_id: str,
    request: Request,
    db: Session = Depends(get_db),
    _: CurrentUser = Depends(require_permission("forecast.read")),
):
    run = db.query(ForecastRun).filter(ForecastRun.id == run_id).first()
    if not run:
        raise HTTPException(status_code=404, detail={"code": "not_found", "message": "Forecast run not found"})

    run.points = db.query(ForecastPoint).filter(ForecastPoint.run_id == run.id).order_by(ForecastPoint.ts.asc()).all()
    return success_response(request, _run_payload(run, include_points=True))
