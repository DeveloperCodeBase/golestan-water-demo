from __future__ import annotations

from typing import Tuple

from fastapi import Query


def pagination_params(
    page: int = Query(default=1, ge=1),
    page_size: int = Query(default=20, ge=1, le=500),
) -> Tuple[int, int]:
    return page, page_size


def apply_pagination(query, page: int, page_size: int):
    return query.offset((page - 1) * page_size).limit(page_size)
