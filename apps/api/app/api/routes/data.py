from __future__ import annotations

from datetime import datetime, timezone
from io import BytesIO
from typing import Optional

import pandas as pd
from fastapi import APIRouter, BackgroundTasks, Depends, File, HTTPException, Query, Request, UploadFile
from sqlalchemy.orm import Session

from app.api.deps import CurrentUser, require_permission
from app.db.models import Dataset, DatasetVersion, TimeseriesPoint
from app.db.session import SessionLocal, get_db
from app.schemas.api import DatasetCreate, TimeseriesBulkRequest
from app.services.audit import log_audit_event
from app.services.data_quality import quality_report_from_dataframe
from app.utils.pagination import apply_pagination, pagination_params
from app.utils.responses import pagination_payload, success_response

router = APIRouter(tags=["data-management"])


def _dataset_payload(ds: Dataset) -> dict:
    return {
        "id": ds.id,
        "name": ds.name,
        "category": ds.category,
        "description": ds.description,
        "latest_version": ds.latest_version,
        "current_status": ds.current_status,
        "created_by": ds.created_by,
        "created_at": ds.created_at.isoformat() if ds.created_at else None,
    }


@router.get("/datasets")
def list_datasets(
    request: Request,
    category: Optional[str] = Query(default=None),
    page_data=Depends(pagination_params),
    db: Session = Depends(get_db),
    _: CurrentUser = Depends(require_permission("data.read")),
):
    page, page_size = page_data
    query = db.query(Dataset)
    if category:
        query = query.filter(Dataset.category == category)

    query = query.order_by(Dataset.created_at.desc())
    total = query.count()
    rows = apply_pagination(query, page, page_size).all()
    return success_response(request, [_dataset_payload(ds) for ds in rows], pagination_payload(page, page_size, total))


@router.post("/datasets")
def create_dataset(
    payload: DatasetCreate,
    request: Request,
    db: Session = Depends(get_db),
    current_user: CurrentUser = Depends(require_permission("data.write")),
):
    if db.query(Dataset).filter(Dataset.name == payload.name).first():
        raise HTTPException(status_code=409, detail={"code": "conflict", "message": "Dataset already exists"})

    ds = Dataset(
        name=payload.name,
        category=payload.category,
        description=payload.description,
        latest_version=0,
        current_status="draft",
        created_by=current_user.id,
    )
    db.add(ds)
    db.commit()
    db.refresh(ds)

    log_audit_event(
        db,
        actor_user_id=current_user.id,
        action="dataset.create",
        entity="dataset",
        entity_id=ds.id,
        details={"name": ds.name},
    )

    return success_response(request, _dataset_payload(ds))


def _parse_uploaded_file(file: UploadFile) -> pd.DataFrame:
    if file.filename is None:
        raise HTTPException(status_code=400, detail={"code": "bad_request", "message": "Filename is required"})

    content = file.file.read()
    buffer = BytesIO(content)

    lower_name = file.filename.lower()
    if lower_name.endswith(".csv"):
        return pd.read_csv(buffer)
    if lower_name.endswith(".xlsx") or lower_name.endswith(".xls"):
        return pd.read_excel(buffer)

    raise HTTPException(
        status_code=400,
        detail={"code": "unsupported_file", "message": "Only CSV or Excel files are supported"},
    )


@router.post("/datasets/{dataset_id}/upload")
def upload_dataset(
    dataset_id: str,
    request: Request,
    file: UploadFile = File(...),
    db: Session = Depends(get_db),
    current_user: CurrentUser = Depends(require_permission("data.import")),
):
    ds = db.query(Dataset).filter(Dataset.id == dataset_id).first()
    if not ds:
        raise HTTPException(status_code=404, detail={"code": "not_found", "message": "Dataset not found"})

    df = _parse_uploaded_file(file)
    report = quality_report_from_dataframe(df)

    next_version = ds.latest_version + 1
    version = DatasetVersion(
        dataset_id=ds.id,
        version=next_version,
        file_name=file.filename,
        record_count=int(len(df)),
        quality_report=report,
    )
    ds.latest_version = next_version
    ds.current_status = "active"

    db.add(version)
    db.commit()

    log_audit_event(
        db,
        actor_user_id=current_user.id,
        action="dataset.upload",
        entity="dataset",
        entity_id=ds.id,
        details={"file_name": file.filename, "version": next_version, "quality": report},
    )

    return success_response(
        request,
        {
            "dataset_id": ds.id,
            "version": next_version,
            "file_name": file.filename,
            "quality_report": report,
        },
    )


@router.get("/timeseries")
def list_timeseries(
    request: Request,
    entity: Optional[str] = Query(default=None, description="entity_type filter"),
    metric: Optional[str] = Query(default=None),
    from_ts: Optional[datetime] = Query(default=None, alias="from"),
    to_ts: Optional[datetime] = Query(default=None, alias="to"),
    page_data=Depends(pagination_params),
    db: Session = Depends(get_db),
    _: CurrentUser = Depends(require_permission("data.read")),
):
    page, page_size = page_data

    query = db.query(TimeseriesPoint)
    if entity:
        query = query.filter(TimeseriesPoint.entity_type == entity)
    if metric:
        query = query.filter(TimeseriesPoint.metric == metric)
    if from_ts:
        query = query.filter(TimeseriesPoint.ts >= from_ts)
    if to_ts:
        query = query.filter(TimeseriesPoint.ts <= to_ts)

    query = query.order_by(TimeseriesPoint.ts.desc())
    total = query.count()
    rows = apply_pagination(query, page, page_size).all()

    data = [
        {
            "id": row.id,
            "entity_type": row.entity_type,
            "entity_id": row.entity_id,
            "metric": row.metric,
            "ts": row.ts.isoformat(),
            "value": row.value,
            "quality_flag": row.quality_flag,
            "source": row.source,
        }
        for row in rows
    ]
    return success_response(request, data, pagination_payload(page, page_size, total))


@router.post("/timeseries/bulk")
def bulk_upsert_timeseries(
    payload: TimeseriesBulkRequest,
    request: Request,
    db: Session = Depends(get_db),
    current_user: CurrentUser = Depends(require_permission("data.write")),
):
    inserted = 0
    skipped = 0

    for point in payload.points:
        existing = (
            db.query(TimeseriesPoint)
            .filter(
                TimeseriesPoint.entity_type == point.entity_type,
                TimeseriesPoint.entity_id == point.entity_id,
                TimeseriesPoint.metric == point.metric,
                TimeseriesPoint.ts == point.ts,
            )
            .first()
        )
        if existing:
            skipped += 1
            continue

        db.add(
            TimeseriesPoint(
                entity_type=point.entity_type,
                entity_id=point.entity_id,
                metric=point.metric,
                ts=point.ts,
                value=point.value,
                quality_flag=point.quality_flag,
                source=point.source,
            )
        )
        inserted += 1

    db.commit()

    log_audit_event(
        db,
        actor_user_id=current_user.id,
        action="timeseries.bulk_insert",
        entity="timeseries",
        details={"inserted": inserted, "skipped": skipped},
    )

    return success_response(request, {"inserted": inserted, "skipped": skipped})


def _scheduled_import_job(dataset_id: str, actor_id: str | None) -> None:
    db = SessionLocal()
    try:
        ds = db.query(Dataset).filter(Dataset.id == dataset_id).first()
        if not ds:
            return

        now = datetime.now(timezone.utc)
        quality = {
            "rows": 40,
            "missing_cells": 1,
            "duplicate_rows": 0,
            "outliers": 2,
            "quality_score": 95,
            "scheduled": True,
            "imported_at": now.isoformat(),
        }

        next_version = ds.latest_version + 1
        db.add(
            DatasetVersion(
                dataset_id=dataset_id,
                version=next_version,
                file_name=f"scheduled_import_{now.strftime('%Y%m%d_%H%M%S')}.csv",
                record_count=40,
                quality_report=quality,
            )
        )
        ds.latest_version = next_version
        ds.current_status = "active"
        db.commit()

        log_audit_event(
            db,
            actor_user_id=actor_id,
            action="dataset.scheduled_import",
            entity="dataset",
            entity_id=dataset_id,
            details={"version": next_version},
        )
    finally:
        db.close()


@router.post("/datasets/{dataset_id}/scheduled-import/mock")
def trigger_scheduled_import(
    dataset_id: str,
    request: Request,
    bg: BackgroundTasks,
    db: Session = Depends(get_db),
    current_user: CurrentUser = Depends(require_permission("data.import")),
):
    if not db.query(Dataset).filter(Dataset.id == dataset_id).first():
        raise HTTPException(status_code=404, detail={"code": "not_found", "message": "Dataset not found"})

    # DEMO: run background task immediately.
    bg.add_task(_scheduled_import_job, dataset_id, current_user.id)
    return success_response(request, {"scheduled": True, "dataset_id": dataset_id})
