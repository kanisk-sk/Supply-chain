import pytest
from pydantic import ValidationError
from fastapi import FastAPI
from fastapi.testclient import TestClient

from app.core.config import Settings
from app.middleware.production import ProductionMiddleware
from app.main import create_app


def production_settings(**changes):
    return Settings(_env_file=None, ENVIRONMENT="production", JWT_SECRET="random-test-key-" * 4,
                    DATABASE_URL="mysql+pymysql://app:password@db.example.com/supply_chain", CORS_ORIGINS="https://app.example.com", **changes)


def test_production_rejects_development_defaults():
    with pytest.raises(ValidationError):
        Settings(_env_file=None, ENVIRONMENT="production")


def test_production_secure_configuration_accepted():
    assert production_settings().is_production


def test_production_requires_verified_tls():
    with pytest.raises(ValidationError):
        production_settings(DB_REQUIRE_TLS=False)


@pytest.mark.parametrize("origin", ["*", "https://app.example.com/path", "https://app.example.com?x=1"])
def test_cors_rejects_unbounded_or_non_origin_values(origin):
    with pytest.raises(ValidationError):
        Settings(_env_file=None, CORS_ORIGINS=origin)


def test_readiness_reports_unavailable_without_leaking_error(monkeypatch):
    def unavailable():
        raise RuntimeError("confidential database detail")
    monkeypatch.setattr("app.main.check_database_connectivity", unavailable)
    with TestClient(create_app()) as client:
        response = client.get("/ready")
        assert response.status_code == 503
        assert response.json()["data"]["database"] == "error"
        assert "confidential" not in response.text
        assert client.get("/live").status_code == 200
        assert response.headers["x-request-id"]


def test_login_limit_returns_retry_after_and_does_not_call_endpoint(monkeypatch):
    app = FastAPI()
    app.add_middleware(ProductionMiddleware)
    @app.post("/api/v1/auth/login")
    def forbidden_call():
        pytest.fail("limited request reached login")
    monkeypatch.setattr("app.middleware.production.consume_limit", lambda *args: (False, 7))
    with TestClient(app) as client:
        response = client.post("/api/v1/auth/login", json={})
    assert response.status_code == 429
    assert response.headers["retry-after"] == "7"
    assert response.json()["error"]["code"] == "TOO_MANY_REQUESTS"


def test_rate_limit_store_failure_is_closed_and_safe(monkeypatch):
    def unavailable(*args):
        raise RuntimeError("confidential store detail")
    app = FastAPI()
    app.add_middleware(ProductionMiddleware)
    monkeypatch.setattr("app.middleware.production.consume_limit", unavailable)
    with TestClient(app) as client:
        response = client.get("/api/v1/public/tracking/TRK-1234ABCD")
    assert response.status_code == 503
    assert "confidential" not in response.text


def test_streamed_body_limit_ignores_missing_content_length(monkeypatch):
    monkeypatch.setattr("app.middleware.production.settings.MAX_REQUEST_BODY_BYTES", 20)
    app = FastAPI()
    app.add_middleware(ProductionMiddleware)
    @app.post("/echo")
    def echo():
        pytest.fail("oversized request reached endpoint")
    with TestClient(app) as client:
        response = client.post("/echo", content=iter([b"a" * 12, b"b" * 12]))
    assert response.status_code == 413


def test_production_database_enforces_tls_and_utc_even_with_dsn_overrides(monkeypatch):
    import app.core.database as database
    monkeypatch.setattr(database.settings, 'ENVIRONMENT', 'production')
    captured = {}
    monkeypatch.setattr(database, 'create_engine', lambda url, **kw: captured.update(kw))
    database.create_db_engine('mysql+pymysql://app:secret@db.example.com/db?ssl_disabled=true')
    options = captured['connect_args']
    assert options['ssl_disabled'] is False
    assert options['ssl_verify_identity'] is True
    assert options['ssl_verify_cert'] is True
    assert options['init_command'] == "SET time_zone = '+00:00'"


def test_bootstrap_models_register_without_http_application_imports():
    import subprocess
    import sys
    from pathlib import Path
    result = subprocess.run([sys.executable, '-c', 'import app.bootstrap_admin; from sqlalchemy.orm import configure_mappers; configure_mappers()'], cwd=Path(__file__).resolve().parents[2], capture_output=True, text=True, timeout=10)
    assert result.returncode == 0, result.stderr
