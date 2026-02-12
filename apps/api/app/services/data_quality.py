from __future__ import annotations

from typing import Any, Dict

import pandas as pd


def quality_report_from_dataframe(df: pd.DataFrame) -> Dict[str, Any]:
    if df.empty:
        return {
            "rows": 0,
            "missing_cells": 0,
            "duplicate_rows": 0,
            "outliers": 0,
            "quality_score": 0,
        }

    numeric_cols = df.select_dtypes(include=["number"]).columns
    missing_cells = int(df.isna().sum().sum())
    duplicate_rows = int(df.duplicated().sum())

    outliers = 0
    for col in numeric_cols:
        series = df[col].dropna()
        if series.empty:
            continue
        q1 = series.quantile(0.25)
        q3 = series.quantile(0.75)
        iqr = q3 - q1
        if iqr == 0:
            continue
        low = q1 - 1.5 * iqr
        high = q3 + 1.5 * iqr
        outliers += int(((series < low) | (series > high)).sum())

    penalty = missing_cells + (duplicate_rows * 2) + outliers
    quality_score = max(0, 100 - min(100, penalty // max(len(df), 1)))

    return {
        "rows": int(len(df)),
        "missing_cells": missing_cells,
        "duplicate_rows": duplicate_rows,
        "outliers": int(outliers),
        "quality_score": int(quality_score),
    }
