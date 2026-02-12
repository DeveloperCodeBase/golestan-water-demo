from __future__ import annotations

from datetime import datetime
from typing import Any, Dict, List, Literal, Optional

from pydantic import BaseModel, Field


class LoginRequest(BaseModel):
    username: str
    password: str


class RefreshRequest(BaseModel):
    refresh_token: str


class LogoutRequest(BaseModel):
    refresh_token: str


class ForgotPasswordRequest(BaseModel):
    username: str


class ResetPasswordRequest(BaseModel):
    username: str
    new_password: str


class UserCreate(BaseModel):
    username: str
    password: str
    full_name: Optional[str] = None
    email: Optional[str] = None
    role_names: List[str] = Field(default_factory=list)


class UserUpdate(BaseModel):
    full_name: Optional[str] = None
    email: Optional[str] = None
    is_active: Optional[bool] = None
    role_names: Optional[List[str]] = None


class RoleCreate(BaseModel):
    name: str
    description: Optional[str] = None
    permission_names: List[str] = Field(default_factory=list)


class DatasetCreate(BaseModel):
    name: str
    category: str
    description: Optional[str] = None


class TimeseriesBulkPoint(BaseModel):
    entity_type: str
    entity_id: str
    metric: str
    ts: datetime
    value: float
    quality_flag: str = "good"
    source: Optional[str] = None


class TimeseriesBulkRequest(BaseModel):
    points: List[TimeseriesBulkPoint]


class ForecastTrainRequest(BaseModel):
    entity: Literal["inflow", "demand", "state"]


class ForecastRunRequest(BaseModel):
    entity: Literal["inflow", "demand", "state"]
    horizon_days: int = Field(ge=1, le=90, default=14)
    scenario: Literal["wet", "normal", "dry"] = "normal"


class OptimizationRunRequest(BaseModel):
    name: str = "Demo Optimization Run"
    horizon_days: int = Field(ge=1, le=90, default=14)
    scenario: Literal["wet", "normal", "dry"] = "normal"
    weights: Dict[str, float] = Field(
        default_factory=lambda: {
            "drinking": 1.2,
            "environment": 1.0,
            "industry": 0.9,
            "agriculture": 0.8,
        }
    )
    constraints: Dict[str, Any] = Field(
        default_factory=lambda: {
            "min_env_flow": 22,
            "min_release": 40,
            "max_release": 260,
            "min_storage": 280,
            "max_storage": 1150,
        }
    )


class ScenarioCreateRequest(BaseModel):
    name: str
    params: Dict[str, Any] = Field(default_factory=dict)


class AlertRuleCreateRequest(BaseModel):
    name: str
    metric: str
    operator: str = ">"
    threshold: float
    severity: str = "medium"
    is_active: bool = True


class LlmExplainRequest(BaseModel):
    run_id: str
    context: Dict[str, Any] = Field(default_factory=dict)


class ChatHistoryItem(BaseModel):
    role: Literal["user", "assistant"]
    content: str = Field(min_length=1, max_length=3000)


class ChatMessageRequest(BaseModel):
    message: str = Field(min_length=1, max_length=3000)
    history: List[ChatHistoryItem] = Field(default_factory=list)
