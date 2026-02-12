from __future__ import annotations

from fastapi import APIRouter, Depends, Request

from app.api.deps import CurrentUser, get_current_user
from app.schemas.api import ChatMessageRequest
from app.services.openrouter_chat import generate_chat_response
from app.utils.responses import success_response

router = APIRouter(prefix="/chatbot", tags=["chatbot"])


@router.post("/message")
async def chat_message(
    payload: ChatMessageRequest,
    request: Request,
    _: CurrentUser = Depends(get_current_user),
):
    data = await generate_chat_response(
        message=payload.message,
        history=[{"role": item.role, "content": item.content} for item in payload.history],
    )
    return success_response(request, data)

