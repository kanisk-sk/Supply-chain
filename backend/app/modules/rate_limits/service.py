import hashlib
import math
from datetime import timedelta

from sqlalchemy.orm import Session

from app.common.transactions import transaction
from app.core.database import utcnow
from app.modules.rate_limits.repositories import RateLimitRepository


class RateLimitService:
    def __init__(self, db: Session):
        self.db = db
        self.repo = RateLimitRepository(db)

    def consume(self, group: str, client: str, limit: int, window_seconds: int) -> tuple[bool, int]:
        key = hashlib.sha256(f"{group}:{client}".encode()).hexdigest()
        now = utcnow()
        with transaction(self.db):
            attempts, expiry = self.repo.consume(key, now, now + timedelta(seconds=window_seconds))
        return attempts <= limit, max(1, math.ceil((expiry - now).total_seconds()))

    def cleanup(self) -> None:
        with transaction(self.db):
            self.repo.cleanup(utcnow())
