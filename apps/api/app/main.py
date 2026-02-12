from __future__ import annotations

import logging
import time

from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware

from app.api.routes import alerts, auth, chatbot, data, forecast, health, llm, optimization, scenario, users
from app.core.config import get_settings
from app.core.logging import configure_logging
from app.core.rate_limit import RateLimitMiddleware
from app.db.init_db import create_all
from app.db.session import SessionLocal
from app.services.seeding import ensure_seed_data
from app.utils.errors import install_exception_handlers
from app.utils.request_id import RequestIdMiddleware

settings = get_settings()
configure_logging()
logger = logging.getLogger("golestan.api")

app = FastAPI(
    title="Golestan Water DSS API",
    description="Demo Decision Support System for Golestan -> Voshmgir reservoir release planning",
    version="1.0.0",
    docs_url="/docs",
    redoc_url="/redoc",
)

app.add_middleware(RequestIdMiddleware)
app.add_middleware(RateLimitMiddleware, limit_per_minute=settings.rate_limit_per_minute)
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

install_exception_handlers(app)


@app.middleware("http")
async def log_requests(request: Request, call_next):
    start = time.perf_counter()
    response = await call_next(request)
    elapsed_ms = round((time.perf_counter() - start) * 1000, 2)

    logger.info(
        f"{request.method} {request.url.path} -> {response.status_code} ({elapsed_ms}ms)",
        extra={
            "request_id": getattr(request.state, "request_id", "unknown"),
            "method": request.method,
            "path": request.url.path,
            "status_code": response.status_code,
        },
    )
    return response


@app.on_event("startup")
def on_startup() -> None:
    create_all()
    if settings.demo_auto_seed:
        db = SessionLocal()
        try:
            ensure_seed_data(db)
        finally:
            db.close()


app.include_router(health.router)
app.include_router(auth.router)
app.include_router(users.router)
app.include_router(data.router)
app.include_router(forecast.router)
app.include_router(optimization.router)
app.include_router(scenario.router)
app.include_router(alerts.router)
app.include_router(llm.router)
app.include_router(chatbot.router)
