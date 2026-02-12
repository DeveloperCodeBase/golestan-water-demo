from __future__ import annotations

from fastapi import APIRouter, Depends, HTTPException, Request
from sqlalchemy.orm import Session

from app.api.deps import CurrentUser, require_permission
from app.db.models import Scenario, ScenarioResult
from app.db.session import get_db
from app.schemas.api import ScenarioCreateRequest
from app.services.audit import log_audit_event
from app.services.scenario import simulate_scenario
from app.utils.pagination import apply_pagination, pagination_params
from app.utils.responses import pagination_payload, success_response

router = APIRouter(tags=["scenario"])


@router.post("/scenarios")
def create_scenario(
    payload: ScenarioCreateRequest,
    request: Request,
    db: Session = Depends(get_db),
    current_user: CurrentUser = Depends(require_permission("scenario.run")),
):
    if db.query(Scenario).filter(Scenario.name == payload.name).first():
        raise HTTPException(status_code=409, detail={"code": "conflict", "message": "Scenario already exists"})

    scenario = Scenario(name=payload.name, params=payload.params, status="ready", created_by=current_user.id)
    db.add(scenario)
    db.commit()
    db.refresh(scenario)

    log_audit_event(
        db,
        actor_user_id=current_user.id,
        action="scenario.create",
        entity="scenario",
        entity_id=scenario.id,
        details={"name": scenario.name},
    )

    return success_response(
        request,
        {
            "id": scenario.id,
            "name": scenario.name,
            "params": scenario.params,
            "status": scenario.status,
            "created_at": scenario.created_at.isoformat() if scenario.created_at else None,
        },
    )


@router.get("/scenarios")
def list_scenarios(
    request: Request,
    page_data=Depends(pagination_params),
    db: Session = Depends(get_db),
    _: CurrentUser = Depends(require_permission("scenario.read")),
):
    page, page_size = page_data
    query = db.query(Scenario).order_by(Scenario.created_at.desc())
    total = query.count()
    rows = apply_pagination(query, page, page_size).all()
    data = [
        {
            "id": s.id,
            "name": s.name,
            "params": s.params,
            "status": s.status,
            "created_by": s.created_by,
            "created_at": s.created_at.isoformat() if s.created_at else None,
        }
        for s in rows
    ]
    return success_response(request, data, pagination_payload(page, page_size, total))


@router.post("/scenarios/{scenario_id}/simulate")
def simulate(
    scenario_id: str,
    request: Request,
    db: Session = Depends(get_db),
    current_user: CurrentUser = Depends(require_permission("scenario.run")),
):
    scenario = db.query(Scenario).filter(Scenario.id == scenario_id).first()
    if not scenario:
        raise HTTPException(status_code=404, detail={"code": "not_found", "message": "Scenario not found"})

    result = simulate_scenario(db, scenario)

    log_audit_event(
        db,
        actor_user_id=current_user.id,
        action="scenario.simulate",
        entity="scenario",
        entity_id=scenario.id,
        details={"result_id": result.id},
    )

    return success_response(
        request,
        {
            "scenario_id": scenario.id,
            "result_id": result.id,
            "result": result.result,
            "created_at": result.created_at.isoformat() if result.created_at else None,
        },
    )


@router.get("/scenarios/{scenario_id}/results")
def list_results(
    scenario_id: str,
    request: Request,
    page_data=Depends(pagination_params),
    db: Session = Depends(get_db),
    _: CurrentUser = Depends(require_permission("scenario.read")),
):
    if not db.query(Scenario).filter(Scenario.id == scenario_id).first():
        raise HTTPException(status_code=404, detail={"code": "not_found", "message": "Scenario not found"})

    page, page_size = page_data
    query = db.query(ScenarioResult).filter(ScenarioResult.scenario_id == scenario_id).order_by(ScenarioResult.created_at.desc())
    total = query.count()
    rows = apply_pagination(query, page, page_size).all()
    data = [
        {
            "id": r.id,
            "scenario_id": r.scenario_id,
            "result": r.result,
            "created_at": r.created_at.isoformat() if r.created_at else None,
        }
        for r in rows
    ]

    return success_response(request, data, pagination_payload(page, page_size, total))
