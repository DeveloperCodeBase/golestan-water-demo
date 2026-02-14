import os

os.environ.setdefault("DATABASE_URL", "sqlite:///./test.db")
os.environ.setdefault("DEMO_AUTO_SEED", "false")
os.environ.setdefault("RATE_LIMIT_PER_MINUTE", "1000")

from fastapi.testclient import TestClient

from app.db.init_db import create_all
from app.db.session import SessionLocal
from app.main import app
from app.services.seeding import ensure_seed_data


create_all()
db = SessionLocal()
try:
    ensure_seed_data(db)
finally:
    db.close()

client = TestClient(app)


def _login(username: str = "admin", password: str = "admin123"):
    response = client.post("/auth/login", json={"username": username, "password": password})
    assert response.status_code == 200
    token = response.json()["data"]["access_token"]
    return {"Authorization": f"Bearer {token}"}


def test_health_and_ready():
    health = client.get("/health")
    assert health.status_code == 200
    body = health.json()
    assert "request_id" in body
    assert body["data"]["status"] == "ok"

    ready = client.get("/ready")
    assert ready.status_code == 200


def test_login_can_repeat_without_refresh_token_collision():
    first = client.post("/auth/login", json={"username": "viewer", "password": "vi123"})
    second = client.post("/auth/login", json={"username": "viewer", "password": "vi123"})

    assert first.status_code == 200
    assert second.status_code == 200
    assert first.json()["data"]["refresh_token"] != second.json()["data"]["refresh_token"]


def test_auth_and_core_endpoints():
    headers = _login()

    runs = client.get("/optimization/runs", headers=headers)
    assert runs.status_code == 200
    assert "data" in runs.json()

    forecast = client.post(
        "/forecast/run",
        json={"entity": "inflow", "horizon_days": 7, "scenario": "normal"},
        headers=headers,
    )
    assert forecast.status_code == 200
    forecast_data = forecast.json()["data"]
    assert forecast_data["entity"] == "inflow"
    assert len(forecast_data["points"]) == 7

    optimization = client.post(
        "/optimization/run",
        json={"name": "smoke run", "horizon_days": 7, "scenario": "normal", "weights": {}, "constraints": {}},
        headers=headers,
    )
    assert optimization.status_code == 200
    run_id = optimization.json()["data"]["id"]

    release_plan = client.get(f"/release-plans/{run_id}", headers=headers)
    assert release_plan.status_code == 200
    assert len(release_plan.json()["data"]["rows"]) == 7

    out_of_scope_chat = client.post(
        "/chatbot/message",
        json={"message": "بهترین فیلم سال چیست؟", "history": []},
        headers=headers,
    )
    assert out_of_scope_chat.status_code == 200
    assert out_of_scope_chat.json()["data"]["in_scope"] is False

    owner_chat = client.post(
        "/chatbot/message",
        json={"message": "کی ساختت؟", "history": []},
        headers=headers,
    )
    assert owner_chat.status_code == 200
    answer = owner_chat.json()["data"]["answer"]
    assert "مرکز راهبری پژوهش و پیشرفت هوش مصنوعی جهاددانشگاهی" in answer


def test_invalid_or_expired_token_returns_401_not_500():
    bad_headers = {"Authorization": "Bearer invalid.token.value"}

    timeseries = client.get("/timeseries?metric=inflow&page=1&page_size=20", headers=bad_headers)
    assert timeseries.status_code == 401
    body = timeseries.json()
    assert body["error"]["code"] in {"invalid_token", "token_expired"}

    refresh = client.post("/auth/refresh", json={"refresh_token": "invalid.token.value"})
    assert refresh.status_code == 401
    refresh_body = refresh.json()
    assert refresh_body["error"]["code"] in {"invalid_token", "token_expired"}
