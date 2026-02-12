from __future__ import annotations

from typing import Any, Dict, List


def explain_release_decision(run_id: str, context: Dict[str, Any]) -> Dict[str, Any]:
    scenario = context.get("scenario", "normal")
    drought_risk = float(context.get("drought_risk", 0.2))
    flood_risk = float(context.get("flood_risk", 0.2))
    satisfaction = context.get("satisfaction_by_sector", {})

    reasons: List[str] = [
        "حداقل دبی محیط‌زیستی در کل افق رعایت شده است.",
        "اولویت تامین شرب بالاتر از سایر بخش‌ها اعمال شده است.",
        f"سناریوی اقلیمی انتخاب‌شده: {scenario}",
    ]

    warnings: List[str] = []
    if drought_risk > 0.6:
        warnings.append("ریسک خشکسالی بالاست؛ پیشنهاد می‌شود سهم کشاورزی بازتنظیم شود.")
    if flood_risk > 0.6:
        warnings.append("ریسک سیلاب/سرریز بالاست؛ سقف رهاسازی بازبینی شود.")

    explanation = (
        "برنامه رهاسازی بر پایه توازن بین قیود ایمنی مخزن، نیاز بخش‌ها و حداقل جریان محیط‌زیستی تولید شده است. "
        "در این دمو، مدل توضیح‌گر قواعدمحور است و برای اتصال به LLM محلی قابل ارتقا است."
    )

    return {
        "run_id": run_id,
        "explanation": explanation,
        "reasons": reasons,
        "warnings": warnings,
        "satisfaction_by_sector": satisfaction,
        "model": "local-rule-based-stub",
    }
