from __future__ import annotations

from fastapi import APIRouter, Depends, HTTPException, Query, Request
from fastapi.responses import Response
from sqlalchemy.orm import Session

from app.api.deps import CurrentUser, require_permission
from app.db.models import OptimizationRun
from app.db.session import get_db
from app.schemas.api import OptimizationRunRequest
from app.services.audit import log_audit_event
from app.services.optimization import (
    export_release_plan_csv,
    export_release_plan_pdf,
    release_plan_rows,
    run_optimization,
)
from app.utils.pagination import apply_pagination, pagination_params
from app.utils.responses import pagination_payload, success_response

router = APIRouter(tags=["optimization"])


def _run_payload(run: OptimizationRun) -> dict:
    return {
        "id": run.id,
        "name": run.name,
        "params": run.params,
        "status": run.status,
        "summary": run.summary,
        "created_by": run.created_by,
        "created_at": run.created_at.isoformat() if run.created_at else None,
        "completed_at": run.completed_at.isoformat() if run.completed_at else None,
    }


@router.post("/optimization/run")
def create_run(
    payload: OptimizationRunRequest,
    request: Request,
    db: Session = Depends(get_db),
    current_user: CurrentUser = Depends(require_permission("optimization.run")),
):
    run = run_optimization(
        db,
        name=payload.name,
        horizon_days=payload.horizon_days,
        scenario=payload.scenario,
        weights=payload.weights,
        constraints=payload.constraints,
        created_by=current_user.id,
    )

    log_audit_event(
        db,
        actor_user_id=current_user.id,
        action="optimization.run",
        entity="optimization_run",
        entity_id=run.id,
        details={
            "scenario": payload.scenario,
            "horizon_days": payload.horizon_days,
            "weights": payload.weights,
            "constraints": payload.constraints,
        },
    )
    return success_response(request, _run_payload(run))


@router.get("/optimization/runs")
def list_runs(
    request: Request,
    page_data=Depends(pagination_params),
    db: Session = Depends(get_db),
    _: CurrentUser = Depends(require_permission("optimization.read")),
):
    page, page_size = page_data
    query = db.query(OptimizationRun).order_by(OptimizationRun.created_at.desc())
    total = query.count()
    rows = apply_pagination(query, page, page_size).all()
    data = [_run_payload(r) for r in rows]
    return success_response(request, data, pagination_payload(page, page_size, total))


@router.get("/optimization/runs/{run_id}")
def get_run(
    run_id: str,
    request: Request,
    db: Session = Depends(get_db),
    _: CurrentUser = Depends(require_permission("optimization.read")),
):
    run = db.query(OptimizationRun).filter(OptimizationRun.id == run_id).first()
    if not run:
        raise HTTPException(status_code=404, detail={"code": "not_found", "message": "Optimization run not found"})
    return success_response(request, _run_payload(run))


@router.get("/release-plans/{run_id}")
def get_release_plan(
    run_id: str,
    request: Request,
    db: Session = Depends(get_db),
    _: CurrentUser = Depends(require_permission("optimization.read")),
):
    run = db.query(OptimizationRun).filter(OptimizationRun.id == run_id).first()
    if not run:
        raise HTTPException(status_code=404, detail={"code": "not_found", "message": "Optimization run not found"})

    rows = release_plan_rows(db, run_id)
    data = [
        {
            "id": row.id,
            "ts": row.ts.isoformat(),
            "release_value": row.release_value,
            "sector_allocations": row.sector_allocations,
            "storage_projection": row.storage_projection,
            "risk_index": row.risk_index,
        }
        for row in rows
    ]

    return success_response(request, {"run": _run_payload(run), "rows": data})


@router.get("/release-plans/{run_id}/export")
def export_release_plan(
    run_id: str,
    request: Request,
    format: str = Query(default="csv", pattern="^(csv|pdf)$"),
    db: Session = Depends(get_db),
    _: CurrentUser = Depends(require_permission("report.export")),
):
    run = db.query(OptimizationRun).filter(OptimizationRun.id == run_id).first()
    if not run:
        raise HTTPException(status_code=404, detail={"code": "not_found", "message": "Optimization run not found"})

    rows = release_plan_rows(db, run_id)

    if format == "csv":
        content = export_release_plan_csv(rows)
        return Response(
            content=content,
            media_type="text/csv",
            headers={
                "Content-Disposition": f"attachment; filename=release-plan-{run_id}.csv",
                "X-Request-Id": getattr(request.state, "request_id", "unknown"),
            },
        )

    pdf_bytes = export_release_plan_pdf(run, rows)
    return Response(
        content=pdf_bytes,
        media_type="application/pdf",
        headers={
            "Content-Disposition": f"attachment; filename=release-plan-{run_id}.pdf",
            "X-Request-Id": getattr(request.state, "request_id", "unknown"),
        },
    )
