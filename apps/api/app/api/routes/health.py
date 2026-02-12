from fastapi import APIRouter, Request
from sqlalchemy import text
from sqlalchemy.orm import Session

from app.db.session import get_db
from app.utils.responses import success_response
from fastapi import Depends

router = APIRouter(tags=["health"])


@router.get("/health")
def health(request: Request):
    return success_response(request, {"status": "ok"})


@router.get("/ready")
def ready(request: Request, db: Session = Depends(get_db)):
    db.execute(text("SELECT 1"))
    return success_response(request, {"status": "ready"})
