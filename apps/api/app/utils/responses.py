from __future__ import annotations

from typing import Any, Dict, Optional

from fastapi import Request


def success_response(request: Request, data: Any, pagination: Optional[Dict[str, Any]] = None) -> Dict[str, Any]:
    payload: Dict[str, Any] = {
        "request_id": getattr(request.state, "request_id", "unknown"),
        "data": data,
    }
    if pagination is not None:
        payload["pagination"] = pagination
    return payload


def pagination_payload(page: int, page_size: int, total: int) -> Dict[str, Any]:
    total_pages = max((total + page_size - 1) // page_size, 1)
    return {
        "page": page,
        "page_size": page_size,
        "total": total,
        "total_pages": total_pages,
        "has_next": page < total_pages,
        "has_prev": page > 1,
    }
