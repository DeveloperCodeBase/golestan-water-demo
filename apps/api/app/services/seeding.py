from __future__ import annotations

import math
from datetime import datetime, timedelta, timezone
from typing import Dict, Iterable, List

import numpy as np
from sqlalchemy.orm import Session

from app.core.security import get_password_hash
from app.db.models import (
    AlertRule,
    CropPattern,
    Dataset,
    DatasetVersion,
    DownstreamNode,
    Permission,
    Reservoir,
    Role,
    RolePermission,
    SafetyConstraint,
    Scenario,
    SectorDemand,
    Station,
    TimeseriesPoint,
    User,
    UserRole,
)
from app.db.models import AlertEvent, ForecastRun, OptimizationRun
from app.services.alerts import evaluate_alert_rules
from app.services.forecasting import run_forecast
from app.services.optimization import run_optimization
from app.services.scenario import simulate_scenario

PERMISSIONS: List[Dict[str, str]] = [
    {"name": "overview.read", "module": "overview", "description": "Read overview dashboard"},
    {"name": "live.read", "module": "live", "description": "Read live monitoring"},
    {"name": "data.read", "module": "data", "description": "Read datasets"},
    {"name": "data.write", "module": "data", "description": "Write datasets"},
    {"name": "data.import", "module": "data", "description": "Upload and import datasets"},
    {"name": "forecast.read", "module": "forecast", "description": "Read forecast runs"},
    {"name": "forecast.run", "module": "forecast", "description": "Run forecast"},
    {"name": "optimization.read", "module": "optimization", "description": "Read optimization runs"},
    {"name": "optimization.run", "module": "optimization", "description": "Run optimization"},
    {"name": "scenario.read", "module": "scenario", "description": "Read scenarios"},
    {"name": "scenario.run", "module": "scenario", "description": "Run scenario simulation"},
    {"name": "alerts.read", "module": "alerts", "description": "Read alerts"},
    {"name": "alerts.manage", "module": "alerts", "description": "Manage alert rules"},
    {"name": "report.read", "module": "reports", "description": "Read reports"},
    {"name": "report.export", "module": "reports", "description": "Export reports"},
    {"name": "admin.users.manage", "module": "admin", "description": "Manage users"},
    {"name": "admin.roles.manage", "module": "admin", "description": "Manage roles and policies"},
    {"name": "audit.read", "module": "admin", "description": "Read audit logs"},
    {"name": "settings.manage", "module": "admin", "description": "Manage system settings"},
]

ROLE_MATRIX: Dict[str, Iterable[str]] = {
    "admin": [perm["name"] for perm in PERMISSIONS],
    "operator": [
        "overview.read",
        "live.read",
        "data.read",
        "data.import",
        "forecast.read",
        "optimization.read",
        "optimization.run",
        "scenario.read",
        "alerts.read",
        "report.read",
    ],
    "analyst": [
        "overview.read",
        "data.read",
        "forecast.read",
        "forecast.run",
        "optimization.read",
        "optimization.run",
        "scenario.read",
        "scenario.run",
        "alerts.read",
        "report.read",
        "report.export",
    ],
    "viewer": [
        "overview.read",
        "live.read",
        "data.read",
        "forecast.read",
        "optimization.read",
        "scenario.read",
        "alerts.read",
        "report.read",
    ],
    "auditor": [
        "overview.read",
        "data.read",
        "forecast.read",
        "optimization.read",
        "scenario.read",
        "alerts.read",
        "report.read",
        "audit.read",
    ],
}

DEMO_USERS = [
    {"username": "admin", "password": "admin123", "full_name": "System Admin", "role": "admin"},
    {"username": "operator", "password": "op123", "full_name": "Dam Operator", "role": "operator"},
    {"username": "analyst", "password": "an123", "full_name": "Water Analyst", "role": "analyst"},
    {"username": "viewer", "password": "vi123", "full_name": "Read Only Viewer", "role": "viewer"},
    {"username": "auditor", "password": "au123", "full_name": "Audit Officer", "role": "auditor"},
]


def _ensure_permissions_roles(db: Session) -> Dict[str, Role]:
    perm_by_name: Dict[str, Permission] = {}
    for perm_payload in PERMISSIONS:
        perm = db.query(Permission).filter(Permission.name == perm_payload["name"]).first()
        if not perm:
            perm = Permission(**perm_payload)
            db.add(perm)
            db.flush()
        perm_by_name[perm.name] = perm

    roles: Dict[str, Role] = {}
    for role_name in ROLE_MATRIX:
        role = db.query(Role).filter(Role.name == role_name).first()
        if not role:
            role = Role(name=role_name, description=f"{role_name.title()} role")
            db.add(role)
            db.flush()
        roles[role_name] = role

    for role_name, perm_names in ROLE_MATRIX.items():
        role = roles[role_name]
        existing = {rp.permission_id for rp in role.permissions}
        for perm_name in perm_names:
            perm = perm_by_name[perm_name]
            if perm.id not in existing:
                db.add(RolePermission(role_id=role.id, permission_id=perm.id))

    db.commit()
    return roles


def _ensure_users(db: Session, roles: Dict[str, Role]) -> None:
    for user_payload in DEMO_USERS:
        user = db.query(User).filter(User.username == user_payload["username"]).first()
        if not user:
            user = User(
                username=user_payload["username"],
                full_name=user_payload["full_name"],
                hashed_password=get_password_hash(user_payload["password"]),
                is_active=True,
            )
            db.add(user)
            db.flush()

        role = roles[user_payload["role"]]
        linked = db.query(UserRole).filter(UserRole.user_id == user.id, UserRole.role_id == role.id).first()
        if not linked:
            db.add(UserRole(user_id=user.id, role_id=role.id))

    db.commit()


def _ensure_static_entities(db: Session) -> None:
    reservoir = db.query(Reservoir).filter(Reservoir.name == "Golestan Dam").first()
    if not reservoir:
        reservoir = Reservoir(name="Golestan Dam", river="Gorganrood", max_level=130.0, min_level=95.0, storage_capacity=1200)
        db.add(reservoir)
        db.flush()

    if not db.query(SafetyConstraint).filter(SafetyConstraint.reservoir_id == reservoir.id).first():
        db.add(
            SafetyConstraint(
                reservoir_id=reservoir.id,
                min_level=97.0,
                max_level=128.0,
                max_release=280.0,
                notes="Demo envelope with flood-season attention",
                season="all",
            )
        )

    stations = [
        ("Golestan Upstream Gauge", "river_gauge", 37.2, 55.5),
        ("Voshmgir Downstream Gauge", "river_gauge", 37.4, 55.9),
        ("Met Station A", "meteorology", 37.3, 55.6),
    ]
    for name, stype, lat, lon in stations:
        if not db.query(Station).filter(Station.name == name).first():
            db.add(Station(name=name, station_type=stype, latitude=lat, longitude=lon))

    nodes = [
        ("Urban Drinking Intake", "drinking", 1),
        ("Environmental Reach-1", "environment", 2),
        ("Industrial Hub", "industry", 3),
        ("Agriculture Canal", "agriculture", 4),
    ]
    for name, ntype, priority in nodes:
        if not db.query(DownstreamNode).filter(DownstreamNode.name == name).first():
            db.add(DownstreamNode(name=name, node_type=ntype, priority=priority))

    crop_patterns = [
        ("Gorgan Plain", "Wheat", 18000, "autumn"),
        ("Gorgan Plain", "Rice", 12000, "summer"),
        ("Aqqala", "Cotton", 9500, "spring"),
    ]
    for region, crop, area, season in crop_patterns:
        if not db.query(CropPattern).filter(CropPattern.region == region, CropPattern.crop == crop, CropPattern.season == season).first():
            db.add(CropPattern(region=region, crop=crop, area=area, season=season))

    for climate in ("Wet", "Normal", "Dry"):
        if not db.query(Scenario).filter(Scenario.name == climate).first():
            db.add(
                Scenario(
                    name=climate,
                    params={"climate": climate.lower(), "horizon_days": 14},
                    status="ready",
                )
            )

    datasets = [
        ("hydrology_daily", "hydrology", "Inflow/outflow and river gauge measurements"),
        ("meteorology_daily", "meteorology", "Temperature, precipitation, evaporation, humidity, snow storage"),
        ("reservoir_daily", "reservoir", "Reservoir level and storage daily status"),
        ("demand_daily", "demand", "Sectoral water demand by day"),
    ]
    for name, category, description in datasets:
        ds = db.query(Dataset).filter(Dataset.name == name).first()
        if not ds:
            ds = Dataset(name=name, category=category, description=description, latest_version=1, current_status="active")
            db.add(ds)
            db.flush()
            db.add(
                DatasetVersion(
                    dataset_id=ds.id,
                    version=1,
                    file_name=f"{name}_seed.csv",
                    record_count=0,
                    quality_report={"rows": 0, "missing_cells": 0, "duplicate_rows": 0, "outliers": 0, "quality_score": 100},
                )
            )

    default_rules = [
        ("Flood Risk Inflow", "inflow", ">", 220.0, "high"),
        ("Low Storage Alert", "storage", "<", 320.0, "high"),
    ]
    for name, metric, op, threshold, severity in default_rules:
        if not db.query(AlertRule).filter(AlertRule.name == name).first():
            db.add(AlertRule(name=name, metric=metric, operator=op, threshold=threshold, severity=severity, is_active=True))

    db.commit()


def _generate_timeseries(db: Session) -> None:
    has_any = db.query(TimeseriesPoint.id).first()
    if has_any:
        return

    rng = np.random.default_rng(seed=1402)

    start = datetime.now(timezone.utc).replace(hour=0, minute=0, second=0, microsecond=0) - timedelta(days=5 * 365)
    days = 5 * 365
    storage = 760.0

    ts_rows: List[TimeseriesPoint] = []
    demand_rows: List[SectorDemand] = []

    for i in range(days):
        ts = start + timedelta(days=i)
        day_of_year = ts.timetuple().tm_yday
        seasonal = math.sin((2 * math.pi * day_of_year) / 365.0)

        inflow = 120 + (55 * seasonal) + rng.normal(0, 8)
        inflow = max(25.0, inflow)

        temperature = 18 + (14 * seasonal) + rng.normal(0, 2.5)
        precipitation = max(0.0, 3 + (6 * (1 - seasonal)) + rng.normal(0, 1.2))
        evaporation = max(0.5, 2 + (4 * seasonal) + rng.normal(0, 0.8))
        humidity = float(np.clip(58 + (14 * (1 - seasonal)) + rng.normal(0, 5), 20, 98))
        snow_storage = max(0.0, 35 * (1 - max(0, seasonal)) + rng.normal(0, 2.0))

        drinking = max(30.0, 56 + rng.normal(0, 2.0))
        environment = max(18.0, 26 + rng.normal(0, 1.5))
        industry = max(22.0, 34 + rng.normal(0, 3.0))
        agriculture = max(40.0, 85 + (25 * seasonal) + rng.normal(0, 6.0))

        total_release = drinking + environment + industry + agriculture
        outflow = max(35.0, total_release * (0.95 + rng.normal(0, 0.03)))

        storage = storage + inflow - outflow
        storage = float(np.clip(storage, 250, 1180))
        level = 95 + ((storage - 250) / (1180 - 250)) * 35

        network_index = float(np.clip(0.75 + rng.normal(0, 0.08), 0.4, 1.0))

        ts_rows.extend(
            [
                TimeseriesPoint(entity_type="hydrology", entity_id="golestan", metric="inflow", ts=ts, value=round(float(inflow), 3), quality_flag="good", source="seed"),
                TimeseriesPoint(entity_type="hydrology", entity_id="golestan", metric="outflow", ts=ts, value=round(float(outflow), 3), quality_flag="good", source="seed"),
                TimeseriesPoint(entity_type="meteorology", entity_id="met-a", metric="precipitation", ts=ts, value=round(float(precipitation), 3), quality_flag="good", source="seed"),
                TimeseriesPoint(entity_type="meteorology", entity_id="met-a", metric="temperature", ts=ts, value=round(float(temperature), 3), quality_flag="good", source="seed"),
                TimeseriesPoint(entity_type="meteorology", entity_id="met-a", metric="evaporation", ts=ts, value=round(float(evaporation), 3), quality_flag="good", source="seed"),
                TimeseriesPoint(entity_type="meteorology", entity_id="met-a", metric="humidity", ts=ts, value=round(float(humidity), 3), quality_flag="good", source="seed"),
                TimeseriesPoint(entity_type="meteorology", entity_id="met-a", metric="snow_storage", ts=ts, value=round(float(snow_storage), 3), quality_flag="good", source="seed"),
                TimeseriesPoint(entity_type="reservoir", entity_id="golestan", metric="level", ts=ts, value=round(float(level), 3), quality_flag="good", source="seed"),
                TimeseriesPoint(entity_type="reservoir", entity_id="golestan", metric="storage", ts=ts, value=round(float(storage), 3), quality_flag="good", source="seed"),
                TimeseriesPoint(entity_type="downstream", entity_id="network", metric="operation_index", ts=ts, value=round(float(network_index), 3), quality_flag="good", source="seed"),
            ]
        )

        if i % 3 == 0:
            quality_flag = "suspect"
        else:
            quality_flag = "good"

        for sector, value in (
            ("drinking", drinking),
            ("environment", environment),
            ("industry", industry),
            ("agriculture", agriculture),
        ):
            demand_rows.append(
                SectorDemand(
                    sector=sector,
                    ts=ts,
                    value=round(float(value), 3),
                    scenario="normal",
                )
            )

        if i % 180 == 0:
            ts_rows.append(
                TimeseriesPoint(
                    entity_type="hydrology",
                    entity_id="golestan",
                    metric="inflow",
                    ts=ts + timedelta(hours=1),
                    value=round(float(inflow * 1.05), 3),
                    quality_flag=quality_flag,
                    source="seed-duplicate-marker",
                )
            )

    db.bulk_save_objects(ts_rows)
    db.bulk_save_objects(demand_rows)
    db.commit()


def _ensure_demo_runs(db: Session) -> None:
    admin = db.query(User).filter(User.username == "admin").first()
    admin_id = admin.id if admin else None

    if not db.query(ForecastRun.id).first():
        for entity in ("inflow", "demand", "state"):
            for scenario in ("wet", "normal", "dry"):
                run_forecast(
                    db,
                    entity=entity,
                    horizon_days=14,
                    scenario=scenario,
                    created_by=admin_id,
                )

    if not db.query(OptimizationRun.id).first():
        for scenario in ("wet", "normal", "dry"):
            run_optimization(
                db,
                name=f"Seed Optimization - {scenario}",
                horizon_days=14 if scenario != "dry" else 30,
                scenario=scenario,
                weights={"drinking": 1.3, "environment": 1.2, "industry": 0.9, "agriculture": 0.8},
                constraints={
                    "min_env_flow": 22,
                    "min_release": 40,
                    "max_release": 260,
                    "min_storage": 280,
                    "max_storage": 1150,
                },
                created_by=admin_id,
            )

    # Create a first simulation result for the three default scenarios.
    scenarios = db.query(Scenario).all()
    for scenario in scenarios:
        if not scenario.results:
            simulate_scenario(db, scenario)

    # Generate initial alert events if any rule is triggered by latest data.
    if not db.query(AlertEvent.id).first():
        evaluate_alert_rules(db)


def ensure_seed_data(db: Session) -> None:
    roles = _ensure_permissions_roles(db)
    _ensure_users(db, roles)
    _ensure_static_entities(db)
    _generate_timeseries(db)
    _ensure_demo_runs(db)
