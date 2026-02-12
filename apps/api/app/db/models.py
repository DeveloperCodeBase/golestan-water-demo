from __future__ import annotations

from datetime import datetime, timezone
from typing import Any, Dict, List, Optional
from uuid import uuid4

from sqlalchemy import (
    JSON,
    Boolean,
    DateTime,
    Float,
    ForeignKey,
    Index,
    Integer,
    String,
    Text,
    UniqueConstraint,
)
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.db.base import Base



def now_utc() -> datetime:
    return datetime.now(timezone.utc)


class User(Base):
    __tablename__ = "users"

    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=lambda: str(uuid4()))
    username: Mapped[str] = mapped_column(String(64), unique=True, index=True)
    full_name: Mapped[Optional[str]] = mapped_column(String(128), nullable=True)
    email: Mapped[Optional[str]] = mapped_column(String(128), unique=True, nullable=True)
    hashed_password: Mapped[str] = mapped_column(String(255))
    is_active: Mapped[bool] = mapped_column(Boolean, default=True)
    mfa_enabled: Mapped[bool] = mapped_column(Boolean, default=False)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=now_utc)
    updated_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=now_utc, onupdate=now_utc)

    roles: Mapped[List["UserRole"]] = relationship("UserRole", back_populates="user", cascade="all, delete-orphan")
    refresh_tokens: Mapped[List["RefreshToken"]] = relationship(
        "RefreshToken", back_populates="user", cascade="all, delete-orphan"
    )


class Role(Base):
    __tablename__ = "roles"

    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=lambda: str(uuid4()))
    name: Mapped[str] = mapped_column(String(64), unique=True, index=True)
    description: Mapped[Optional[str]] = mapped_column(String(255), nullable=True)

    users: Mapped[List["UserRole"]] = relationship("UserRole", back_populates="role", cascade="all, delete-orphan")
    permissions: Mapped[List["RolePermission"]] = relationship(
        "RolePermission", back_populates="role", cascade="all, delete-orphan"
    )


class Permission(Base):
    __tablename__ = "permissions"

    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=lambda: str(uuid4()))
    name: Mapped[str] = mapped_column(String(128), unique=True, index=True)
    module: Mapped[str] = mapped_column(String(64), default="general")
    description: Mapped[Optional[str]] = mapped_column(String(255), nullable=True)

    roles: Mapped[List["RolePermission"]] = relationship(
        "RolePermission", back_populates="permission", cascade="all, delete-orphan"
    )


class UserRole(Base):
    __tablename__ = "user_roles"
    __table_args__ = (UniqueConstraint("user_id", "role_id", name="uq_user_role"),)

    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=lambda: str(uuid4()))
    user_id: Mapped[str] = mapped_column(ForeignKey("users.id", ondelete="CASCADE"), index=True)
    role_id: Mapped[str] = mapped_column(ForeignKey("roles.id", ondelete="CASCADE"), index=True)

    user: Mapped["User"] = relationship("User", back_populates="roles")
    role: Mapped["Role"] = relationship("Role", back_populates="users")


class RolePermission(Base):
    __tablename__ = "role_permissions"
    __table_args__ = (UniqueConstraint("role_id", "permission_id", name="uq_role_permission"),)

    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=lambda: str(uuid4()))
    role_id: Mapped[str] = mapped_column(ForeignKey("roles.id", ondelete="CASCADE"), index=True)
    permission_id: Mapped[str] = mapped_column(ForeignKey("permissions.id", ondelete="CASCADE"), index=True)

    role: Mapped["Role"] = relationship("Role", back_populates="permissions")
    permission: Mapped["Permission"] = relationship("Permission", back_populates="roles")


class RefreshToken(Base):
    __tablename__ = "refresh_tokens"

    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=lambda: str(uuid4()))
    user_id: Mapped[str] = mapped_column(ForeignKey("users.id", ondelete="CASCADE"), index=True)
    token_hash: Mapped[str] = mapped_column(String(128), unique=True, index=True)
    expires_at: Mapped[datetime] = mapped_column(DateTime(timezone=True))
    is_revoked: Mapped[bool] = mapped_column(Boolean, default=False)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=now_utc)

    user: Mapped["User"] = relationship("User", back_populates="refresh_tokens")


class AuditEvent(Base):
    __tablename__ = "audit_events"

    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=lambda: str(uuid4()))
    actor_user_id: Mapped[Optional[str]] = mapped_column(ForeignKey("users.id", ondelete="SET NULL"), nullable=True)
    action: Mapped[str] = mapped_column(String(128), index=True)
    entity: Mapped[str] = mapped_column(String(128), index=True)
    entity_id: Mapped[Optional[str]] = mapped_column(String(36), nullable=True)
    details: Mapped[Dict[str, Any]] = mapped_column(JSON, default=dict)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=now_utc, index=True)


class Reservoir(Base):
    __tablename__ = "reservoirs"

    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=lambda: str(uuid4()))
    name: Mapped[str] = mapped_column(String(128), unique=True)
    river: Mapped[Optional[str]] = mapped_column(String(128), nullable=True)
    max_level: Mapped[float] = mapped_column(Float, default=130.0)
    min_level: Mapped[float] = mapped_column(Float, default=95.0)
    storage_capacity: Mapped[float] = mapped_column(Float, default=1200.0)


class Station(Base):
    __tablename__ = "stations"

    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=lambda: str(uuid4()))
    name: Mapped[str] = mapped_column(String(128), unique=True)
    station_type: Mapped[str] = mapped_column(String(64), default="river_gauge")
    latitude: Mapped[Optional[float]] = mapped_column(Float, nullable=True)
    longitude: Mapped[Optional[float]] = mapped_column(Float, nullable=True)


class DownstreamNode(Base):
    __tablename__ = "downstream_nodes"

    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=lambda: str(uuid4()))
    name: Mapped[str] = mapped_column(String(128), unique=True)
    node_type: Mapped[str] = mapped_column(String(64), default="canal")
    priority: Mapped[int] = mapped_column(Integer, default=1)


class Dataset(Base):
    __tablename__ = "datasets"

    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=lambda: str(uuid4()))
    name: Mapped[str] = mapped_column(String(128), unique=True, index=True)
    category: Mapped[str] = mapped_column(String(64), index=True)
    description: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    latest_version: Mapped[int] = mapped_column(Integer, default=0)
    current_status: Mapped[str] = mapped_column(String(32), default="draft")
    created_by: Mapped[Optional[str]] = mapped_column(ForeignKey("users.id", ondelete="SET NULL"), nullable=True)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=now_utc)

    versions: Mapped[List["DatasetVersion"]] = relationship(
        "DatasetVersion", back_populates="dataset", cascade="all, delete-orphan"
    )


class DatasetVersion(Base):
    __tablename__ = "dataset_versions"

    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=lambda: str(uuid4()))
    dataset_id: Mapped[str] = mapped_column(ForeignKey("datasets.id", ondelete="CASCADE"), index=True)
    version: Mapped[int] = mapped_column(Integer)
    file_name: Mapped[Optional[str]] = mapped_column(String(255), nullable=True)
    record_count: Mapped[int] = mapped_column(Integer, default=0)
    quality_report: Mapped[Dict[str, Any]] = mapped_column(JSON, default=dict)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=now_utc)

    dataset: Mapped["Dataset"] = relationship("Dataset", back_populates="versions")


class TimeseriesPoint(Base):
    __tablename__ = "timeseries_points"
    __table_args__ = (
        UniqueConstraint("entity_type", "entity_id", "metric", "ts", name="uq_ts_point"),
        Index("ix_ts_entity_metric_ts", "entity_type", "metric", "ts"),
    )

    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=lambda: str(uuid4()))
    entity_type: Mapped[str] = mapped_column(String(64), index=True)
    entity_id: Mapped[str] = mapped_column(String(64), index=True)
    metric: Mapped[str] = mapped_column(String(64), index=True)
    ts: Mapped[datetime] = mapped_column(DateTime(timezone=True), index=True)
    value: Mapped[float] = mapped_column(Float)
    quality_flag: Mapped[str] = mapped_column(String(32), default="good")
    source: Mapped[Optional[str]] = mapped_column(String(64), nullable=True)


class SectorDemand(Base):
    __tablename__ = "sector_demands"
    __table_args__ = (Index("ix_sector_demand_ts", "sector", "ts"),)

    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=lambda: str(uuid4()))
    sector: Mapped[str] = mapped_column(String(32), index=True)
    ts: Mapped[datetime] = mapped_column(DateTime(timezone=True), index=True)
    value: Mapped[float] = mapped_column(Float)
    scenario: Mapped[str] = mapped_column(String(32), default="normal")


class CropPattern(Base):
    __tablename__ = "crop_patterns"

    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=lambda: str(uuid4()))
    region: Mapped[str] = mapped_column(String(128), index=True)
    crop: Mapped[str] = mapped_column(String(128), index=True)
    area: Mapped[float] = mapped_column(Float)
    season: Mapped[str] = mapped_column(String(64))
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=now_utc)


class SafetyConstraint(Base):
    __tablename__ = "safety_constraints"

    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=lambda: str(uuid4()))
    reservoir_id: Mapped[str] = mapped_column(ForeignKey("reservoirs.id", ondelete="CASCADE"), index=True)
    min_level: Mapped[float] = mapped_column(Float)
    max_level: Mapped[float] = mapped_column(Float)
    max_release: Mapped[float] = mapped_column(Float)
    notes: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    season: Mapped[str] = mapped_column(String(32), default="all")


class ForecastRun(Base):
    __tablename__ = "forecast_runs"

    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=lambda: str(uuid4()))
    entity: Mapped[str] = mapped_column(String(32), index=True)
    model_name: Mapped[str] = mapped_column(String(128), default="demo_baseline")
    status: Mapped[str] = mapped_column(String(32), default="completed", index=True)
    data_window_start: Mapped[Optional[datetime]] = mapped_column(DateTime(timezone=True), nullable=True)
    data_window_end: Mapped[Optional[datetime]] = mapped_column(DateTime(timezone=True), nullable=True)
    metrics: Mapped[Dict[str, Any]] = mapped_column(JSON, default=dict)
    confidence: Mapped[float] = mapped_column(Float, default=0.8)
    scenario: Mapped[str] = mapped_column(String(16), default="normal")
    created_by: Mapped[Optional[str]] = mapped_column(ForeignKey("users.id", ondelete="SET NULL"), nullable=True)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=now_utc)
    completed_at: Mapped[Optional[datetime]] = mapped_column(DateTime(timezone=True), nullable=True)

    points: Mapped[List["ForecastPoint"]] = relationship(
        "ForecastPoint", back_populates="run", cascade="all, delete-orphan"
    )


class ForecastPoint(Base):
    __tablename__ = "forecast_points"
    __table_args__ = (Index("ix_forecast_point_run_ts", "run_id", "ts"),)

    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=lambda: str(uuid4()))
    run_id: Mapped[str] = mapped_column(ForeignKey("forecast_runs.id", ondelete="CASCADE"), index=True)
    metric: Mapped[str] = mapped_column(String(64), default="value")
    ts: Mapped[datetime] = mapped_column(DateTime(timezone=True), index=True)
    predicted_value: Mapped[float] = mapped_column(Float)
    lower_bound: Mapped[float] = mapped_column(Float)
    upper_bound: Mapped[float] = mapped_column(Float)

    run: Mapped["ForecastRun"] = relationship("ForecastRun", back_populates="points")


class OptimizationRun(Base):
    __tablename__ = "optimization_runs"

    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=lambda: str(uuid4()))
    name: Mapped[str] = mapped_column(String(128), default="run")
    params: Mapped[Dict[str, Any]] = mapped_column(JSON, default=dict)
    status: Mapped[str] = mapped_column(String(32), default="completed", index=True)
    summary: Mapped[Dict[str, Any]] = mapped_column(JSON, default=dict)
    created_by: Mapped[Optional[str]] = mapped_column(ForeignKey("users.id", ondelete="SET NULL"), nullable=True)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=now_utc)
    completed_at: Mapped[Optional[datetime]] = mapped_column(DateTime(timezone=True), nullable=True)

    release_plans: Mapped[List["ReleasePlan"]] = relationship(
        "ReleasePlan", back_populates="run", cascade="all, delete-orphan"
    )


class ReleasePlan(Base):
    __tablename__ = "release_plans"
    __table_args__ = (Index("ix_release_plan_run_ts", "run_id", "ts"),)

    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=lambda: str(uuid4()))
    run_id: Mapped[str] = mapped_column(ForeignKey("optimization_runs.id", ondelete="CASCADE"), index=True)
    ts: Mapped[datetime] = mapped_column(DateTime(timezone=True), index=True)
    release_value: Mapped[float] = mapped_column(Float)
    sector_allocations: Mapped[Dict[str, Any]] = mapped_column(JSON, default=dict)
    storage_projection: Mapped[float] = mapped_column(Float, default=0.0)
    risk_index: Mapped[float] = mapped_column(Float, default=0.0)

    run: Mapped["OptimizationRun"] = relationship("OptimizationRun", back_populates="release_plans")


class Scenario(Base):
    __tablename__ = "scenarios"

    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=lambda: str(uuid4()))
    name: Mapped[str] = mapped_column(String(128), unique=True)
    params: Mapped[Dict[str, Any]] = mapped_column(JSON, default=dict)
    status: Mapped[str] = mapped_column(String(32), default="ready")
    created_by: Mapped[Optional[str]] = mapped_column(ForeignKey("users.id", ondelete="SET NULL"), nullable=True)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=now_utc)

    results: Mapped[List["ScenarioResult"]] = relationship(
        "ScenarioResult", back_populates="scenario", cascade="all, delete-orphan"
    )


class ScenarioResult(Base):
    __tablename__ = "scenario_results"

    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=lambda: str(uuid4()))
    scenario_id: Mapped[str] = mapped_column(ForeignKey("scenarios.id", ondelete="CASCADE"), index=True)
    result: Mapped[Dict[str, Any]] = mapped_column(JSON, default=dict)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=now_utc)

    scenario: Mapped["Scenario"] = relationship("Scenario", back_populates="results")


class AlertRule(Base):
    __tablename__ = "alert_rules"

    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=lambda: str(uuid4()))
    name: Mapped[str] = mapped_column(String(128), unique=True)
    metric: Mapped[str] = mapped_column(String(64), index=True)
    operator: Mapped[str] = mapped_column(String(8), default=">")
    threshold: Mapped[float] = mapped_column(Float)
    severity: Mapped[str] = mapped_column(String(16), default="medium")
    is_active: Mapped[bool] = mapped_column(Boolean, default=True)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=now_utc)

    events: Mapped[List["AlertEvent"]] = relationship(
        "AlertEvent", back_populates="rule", cascade="all, delete-orphan"
    )


class AlertEvent(Base):
    __tablename__ = "alert_events"

    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=lambda: str(uuid4()))
    rule_id: Mapped[str] = mapped_column(ForeignKey("alert_rules.id", ondelete="CASCADE"), index=True)
    metric: Mapped[str] = mapped_column(String(64), index=True)
    value: Mapped[float] = mapped_column(Float)
    severity: Mapped[str] = mapped_column(String(16), default="medium")
    message: Mapped[str] = mapped_column(Text)
    status: Mapped[str] = mapped_column(String(16), default="open")
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=now_utc)

    rule: Mapped["AlertRule"] = relationship("AlertRule", back_populates="events")
