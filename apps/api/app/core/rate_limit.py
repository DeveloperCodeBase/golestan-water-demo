from __future__ import annotations

import time
from collections import defaultdict, deque
from typing import Deque, Dict

from fastapi import Request
from starlette.middleware.base import BaseHTTPMiddleware
from starlette.responses import JSONResponse


class RateLimitMiddleware(BaseHTTPMiddleware):
    def __init__(self, app, limit_per_minute: int = 120):
        super().__init__(app)
        self.limit = limit_per_minute
        self.windows: Dict[str, Deque[float]] = defaultdict(deque)

    async def dispatch(self, request: Request, call_next):
        client_ip = request.client.host if request.client else "unknown"
        now = time.time()
        window = self.windows[client_ip]
        while window and now - window[0] > 60:
            window.popleft()

        if len(window) >= self.limit:
            request_id = getattr(request.state, "request_id", "unknown")
            return JSONResponse(
                status_code=429,
                content={
                    "request_id": request_id,
                    "error": {
                        "code": "rate_limit_exceeded",
                        "message": "Too many requests",
                        "details": {"limit_per_minute": self.limit},
                    },
                },
            )

        window.append(now)
        return await call_next(request)
