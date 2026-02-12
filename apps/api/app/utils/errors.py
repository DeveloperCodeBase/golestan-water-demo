from __future__ import annotations

from typing import Any, Dict

from fastapi import FastAPI, HTTPException, Request
from fastapi.responses import JSONResponse
from pydantic import ValidationError


def error_payload(request: Request, code: str, message: str, details: Dict[str, Any] | None = None) -> Dict[str, Any]:
    return {
        "request_id": getattr(request.state, "request_id", "unknown"),
        "error": {
            "code": code,
            "message": message,
            "details": details or {},
        },
    }


def install_exception_handlers(app: FastAPI) -> None:
    @app.exception_handler(HTTPException)
    async def http_exception_handler(request: Request, exc: HTTPException):
        code = "http_error"
        message = str(exc.detail)
        details = {}
        if isinstance(exc.detail, dict):
            code = exc.detail.get("code", code)
            message = exc.detail.get("message", message)
            details = exc.detail.get("details", {})
        return JSONResponse(status_code=exc.status_code, content=error_payload(request, code, message, details))

    @app.exception_handler(ValidationError)
    async def validation_error_handler(request: Request, exc: ValidationError):
        return JSONResponse(
            status_code=422,
            content=error_payload(request, "validation_error", "Validation failed", {"errors": exc.errors()}),
        )

    @app.exception_handler(Exception)
    async def generic_exception_handler(request: Request, exc: Exception):
        return JSONResponse(
            status_code=500,
            content=error_payload(request, "internal_error", "Internal server error", {"exception": str(exc)}),
        )
