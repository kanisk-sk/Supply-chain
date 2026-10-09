"""Application configuration.

All runtime configuration is read from environment variables (optionally loaded
from a `.env` file). Values are validated eagerly wherever possible so that an
invalid configuration fails clearly at startup instead of at request time.

Never hardcode passwords, database credentials, JWT secrets, or production URLs
in application code — everything comes from this settings object.
"""

from functools import lru_cache
from pathlib import Path

from pydantic import Field, field_validator, model_validator
from pydantic_settings import BaseSettings, SettingsConfigDict
from sqlalchemy.engine import make_url
from urllib.parse import urlsplit

VALID_ENVIRONMENTS = {"development", "test", "staging", "production"}

_BACKEND_DIR = Path(__file__).resolve().parents[2]


class Settings(BaseSettings):
    model_config = SettingsConfigDict(
        env_file=_BACKEND_DIR / ".env",
        env_file_encoding="utf-8",
        case_sensitive=False,
        extra="ignore",
        hide_input_in_errors=True,
    )

    # Runtime
    ENVIRONMENT: str = "development"
    LOG_LEVEL: str = "INFO"

    # Database
    DATABASE_URL: str = "mysql+pymysql://root@127.0.0.1:3306/supply_chain?charset=utf8mb4"
    TEST_DATABASE_URL: str | None = None
    DB_POOL_SIZE: int = Field(default=5, ge=1, le=100)
    DB_MAX_OVERFLOW: int = Field(default=10, ge=0, le=100)
    DB_POOL_RECYCLE: int = Field(default=1800, ge=30)
    DB_CONNECT_TIMEOUT: int = Field(default=5, ge=1, le=60)
    DB_READ_TIMEOUT: int = Field(default=15, ge=1, le=120)
    DB_WRITE_TIMEOUT: int = Field(default=15, ge=1, le=120)
    DB_REQUIRE_TLS: bool = True
    DB_SSL_CA: str | None = None

    # Security / JWT (activated in Stage 2)
    JWT_SECRET: str = "change-this-in-production"
    JWT_ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = Field(default=60, ge=1, le=1440)

    # CORS — comma-separated list of allowed origins
    CORS_ORIGINS: str = (
        "http://localhost:3000,http://127.0.0.1:3000,"
        "http://localhost:3001,http://127.0.0.1:3001"
    )

    # Scheduled alert evaluator (Stage 4). A lightweight in-process daemon
    # polls for time-based conditions (e.g. overdue shipments) every
    # SCHEDULER_INTERVAL_SECONDS. Enabled only when explicitly turned on; the
    # same check is also exposed as ``python -m app.jobs.scheduler``.
    SCHEDULER_ENABLED: bool = False
    SCHEDULER_INTERVAL_SECONDS: int = Field(default=300, ge=5, le=3600)
    LOGIN_RATE_LIMIT: int = Field(default=10, ge=1, le=100)
    TRACKING_RATE_LIMIT: int = Field(default=30, ge=1, le=1000)
    RATE_LIMIT_WINDOW_SECONDS: int = Field(default=60, ge=1, le=3600)
    MAX_REQUEST_BODY_BYTES: int = Field(default=1_048_576, ge=16_384, le=5_242_880)

    @field_validator("ENVIRONMENT")
    @classmethod
    def _validate_environment(cls, value: str) -> str:
        if value.lower() not in VALID_ENVIRONMENTS:
            raise ValueError(
                f"ENVIRONMENT must be one of {sorted(VALID_ENVIRONMENTS)}, got {value!r}"
            )
        return value.lower()

    @field_validator("DATABASE_URL", "TEST_DATABASE_URL")
    @classmethod
    def _validate_mysql_dsn(cls, value: str | None) -> str | None:
        if value is None:
            return None
        if not value.startswith("mysql+pymysql://"):
            raise ValueError(
                "DATABASE_URL must use the mysql+pymysql:// scheme "
                f"(got a value not starting with that scheme). SQLAlchemy engines "
                f"are created from a single canonical DSN; drivers other than "
                f"PyMySQL are not supported."
            )
        return value

    @model_validator(mode="after")
    def _secure_deployment(self):
        origins = self.cors_origins_list
        for origin in origins:
            parsed = urlsplit(origin)
            if "*" in origin or parsed.scheme not in {"http", "https"} or not parsed.hostname or parsed.path or parsed.query or parsed.fragment or parsed.username:
                raise ValueError("CORS_ORIGINS must contain exact HTTP(S) origins without paths or wildcards")
        if self.ENVIRONMENT in {"staging", "production"}:
            if self.JWT_SECRET == type(self).model_fields["JWT_SECRET"].default or len(self.JWT_SECRET.encode()) < 32:
                raise ValueError("Staging/production requires a unique JWT_SECRET of at least 32 bytes")
            url = make_url(self.DATABASE_URL)
            if not url.database or not url.username or not url.password or url.username == "root" or url.host in {"localhost", "127.0.0.1", "::1"}:
                raise ValueError("Staging/production requires a remote database and dedicated password-protected account")
            if not self.DB_REQUIRE_TLS:
                raise ValueError("Staging/production database connections must use verified TLS")
            if not origins or any(urlsplit(o).scheme != "https" or urlsplit(o).hostname in {"localhost", "127.0.0.1", "::1"} for o in origins):
                raise ValueError("Staging/production requires explicit HTTPS frontend CORS origins")
        if self.JWT_ALGORITHM != "HS256":
            raise ValueError("This application supports JWT_ALGORITHM=HS256")
        if self.LOG_LEVEL.upper() not in {"DEBUG", "INFO", "WARNING", "ERROR", "CRITICAL"}:
            raise ValueError("LOG_LEVEL must be a standard logging level")
        return self

    @field_validator("JWT_SECRET")
    @classmethod
    def _validate_jwt_secret(cls, value: str) -> str:
        if len(value) < 8:
            raise ValueError("JWT_SECRET must be at least 8 characters long")
        return value

    @property
    def is_production(self) -> bool:
        return self.ENVIRONMENT == "production"

    @property
    def cors_origins_list(self) -> list[str]:
        """Parse the comma-separated CORS_ORIGINS value into a list.

        Empty entries are dropped so a trailing comma does not introduce an
        empty origin. Unrestricted cross-origin access is never allowed.
        """
        return [o.strip() for o in self.CORS_ORIGINS.split(",") if o.strip()]


@lru_cache
def get_settings() -> Settings:
    """Return a cached Settings instance (pydantic-settings + lru_cache)."""
    return Settings()


settings = get_settings()
