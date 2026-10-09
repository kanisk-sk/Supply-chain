from datetime import datetime

from sqlalchemy import case, delete, select
from sqlalchemy.dialects.mysql import insert
from sqlalchemy.orm import Session

from app.modules.rate_limits.models import RequestRateLimit


class RateLimitRepository:
    def __init__(self, db: Session):
        self.db = db

    def consume(self, key: str, now: datetime, expires_at: datetime) -> tuple[int, datetime]:
        row = RequestRateLimit
        stmt = insert(row).values(key=key, attempts=1, expires_at=expires_at)
        # Evaluate count before expiry changes (MySQL assignments are ordered).
        stmt = stmt.on_duplicate_key_update(
            attempts=case((row.expires_at <= now, 1), else_=row.attempts + 1),
            expires_at=case((row.expires_at <= now, expires_at), else_=row.expires_at),
        )
        self.db.execute(stmt)
        result = self.db.execute(select(row.attempts, row.expires_at).where(row.key == key)).one()
        return result.attempts, result.expires_at

    def cleanup(self, now: datetime) -> None:
        self.db.execute(delete(RequestRateLimit).where(RequestRateLimit.expires_at < now))
