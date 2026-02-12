from __future__ import annotations

from fastapi import APIRouter, Depends, HTTPException, Request
from sqlalchemy.orm import Session

from app.api.deps import CurrentUser, require_permission
from app.db.models import OptimizationRun
from app.db.session import get_db
from app.schemas.api import LlmExplainRequest
from app.services.llm_stub import explain_release_decision
from app.utils.responses import success_response

router = APIRouter(prefix="/llm", tags=["llm-stub"])


@router.post("/explain")
def explain(
    payload: LlmExplainRequest,
    request: Request,
    db: Session = Depends(get_db),
    _: CurrentUser = Depends(require_permission("optimization.read")),
):
    run = db.query(OptimizationRun).filter(OptimizationRun.id == payload.run_id).first()
    if not run:
        raise HTTPException(status_code=404, detail={"code": "not_found", "message": "Optimization run not found"})

    context = payload.context or {}
    context.setdefault("scenario", run.params.get("scenario", "normal") if run.params else "normal")
    context.setdefault("satisfaction_by_sector", run.summary.get("satisfaction_by_sector", {}) if run.summary else {})
    context.setdefault("drought_risk", run.summary.get("drought_risk", 0.2) if run.summary else 0.2)
    context.setdefault("flood_risk", run.summary.get("flood_risk", 0.2) if run.summary else 0.2)

    result = explain_release_decision(run_id=run.id, context=context)
    return success_response(request, result)
