from __future__ import annotations

import re
from typing import Any, Dict, List

import httpx

from app.core.config import get_settings

PROJECT_KEYWORDS = {
    "سد",
    "گلستان",
    "وشمگیر",
    "مخزن",
    "رهاسازی",
    "دبی",
    "سناریو",
    "سیلاب",
    "خشک",
    "خشکسالی",
    "هیدرولوژی",
    "هواشناسی",
    "پیش‌بینی",
    "بهینه‌سازی",
    "تقاضا",
    "شرب",
    "کشاورزی",
    "محیط‌زیست",
    "صنعت",
    "بحران",
    "هشدار",
    "گزارش",
    "داده",
    "forecast",
    "optimization",
    "scenario",
    "inflow",
    "outflow",
    "reservoir",
    "water release",
    "demand",
    "dataset",
    "rbac",
    "audit",
    "timeseries",
}

BUILDER_PATTERNS = [
    r"کی\s+ساخت",
    r"چه\s+شرکتی\s+ساخت",
    r"سازنده",
    r"who\s+built\s+you",
    r"who\s+made\s+you",
    r"developer",
]

SCOPE_REJECTION = (
    "من فقط درباره سامانه تصمیم‌یار مدیریت رهاسازی آب سد گلستان به وشمگیر پاسخ می‌دهم. "
    "لطفا سوال را در همین حوزه مطرح کنید."
)

BUILDER_REPLY = "این سامانه توسط شرکت شبکه هوشمند ابتکار ویستا طراحی و ساخته شده است."


def _normalize_text(text: str) -> str:
    return re.sub(r"\s+", " ", text.strip().lower())


def _is_builder_question(message: str) -> bool:
    normalized = _normalize_text(message)
    return any(re.search(pattern, normalized) for pattern in BUILDER_PATTERNS)


def _is_in_scope(message: str) -> bool:
    normalized = _normalize_text(message)
    return any(keyword in normalized for keyword in PROJECT_KEYWORDS)


def _system_prompt() -> str:
    return (
        "شما دستیار تخصصی سامانه تصمیم‌یار مدیریت رهاسازی آب سد گلستان به وشمگیر هستید. "
        "فقط به پرسش‌های مرتبط با این سامانه، داده‌ها، پیش‌بینی، بهینه‌سازی، سناریو، بحران، گزارش، "
        "امنیت و بهره‌برداری پاسخ دهید. اگر سوال خارج از حوزه بود، با احترام رد کنید. "
        "اگر کاربر درباره سازنده سامانه پرسید، دقیقا این جمله را بگویید: "
        f"\"{BUILDER_REPLY}\""
    )


async def generate_chat_response(message: str, history: List[Dict[str, str]] | None = None) -> Dict[str, Any]:
    if _is_builder_question(message):
        return {
            "answer": BUILDER_REPLY,
            "in_scope": True,
            "provider": "rule",
            "model": "ownership-policy",
        }

    if not _is_in_scope(message):
        return {
            "answer": SCOPE_REJECTION,
            "in_scope": False,
            "provider": "rule",
            "model": "scope-guard",
        }

    settings = get_settings()
    if not settings.openrouter_api_key:
        return {
            "answer": (
                "پاسخ این سوال در دامنه پروژه است، اما کلید OpenRouter در سرور تنظیم نشده است. "
                "پس از تنظیم `OPENROUTER_API_KEY` پاسخ مدل زبانی فعال می‌شود."
            ),
            "in_scope": True,
            "provider": "rule",
            "model": "missing-openrouter-key",
        }

    safe_history = []
    for item in (history or [])[-8:]:
        role = item.get("role", "")
        content = item.get("content", "").strip()
        if role in {"user", "assistant"} and content:
            safe_history.append({"role": role, "content": content[:3000]})

    messages = [{"role": "system", "content": _system_prompt()}]
    messages.extend(safe_history)
    messages.append({"role": "user", "content": message})

    headers = {
        "Authorization": f"Bearer {settings.openrouter_api_key}",
        "Content-Type": "application/json",
        "HTTP-Referer": settings.openrouter_site_url,
        "X-Title": settings.openrouter_app_name,
    }
    payload = {
        "model": settings.openrouter_model,
        "messages": messages,
        "temperature": 0.2,
        "max_tokens": 450,
    }

    try:
        async with httpx.AsyncClient(timeout=30) as client:
            response = await client.post("https://openrouter.ai/api/v1/chat/completions", headers=headers, json=payload)
            response.raise_for_status()
            data = response.json()
    except httpx.HTTPError:
        return {
            "answer": "در ارتباط با سرویس مدل زبانی خطا رخ داد. لطفا دوباره تلاش کنید.",
            "in_scope": True,
            "provider": "openrouter",
            "model": settings.openrouter_model,
        }

    answer = (
        data.get("choices", [{}])[0].get("message", {}).get("content", "").strip()
        or "پاسخ معتبری از مدل دریافت نشد."
    )
    return {
        "answer": answer,
        "in_scope": True,
        "provider": "openrouter",
        "model": data.get("model", settings.openrouter_model),
    }
