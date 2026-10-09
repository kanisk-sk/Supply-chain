from concurrent.futures import ThreadPoolExecutor
from datetime import timedelta

import pytest
from sqlalchemy import select, update

from app.core.database import utcnow
from app.modules.rate_limits.models import RequestRateLimit
from app.modules.rate_limits.service import RateLimitService

pytestmark = pytest.mark.db


def test_shared_limits_are_atomic_and_expire(session_factory):
    def attempt(_):
        with session_factory() as db:
            return RateLimitService(db).consume("login", "203.0.113.1", 5, 60)[0]
    with ThreadPoolExecutor(max_workers=8) as workers:
        outcomes = list(workers.map(attempt, range(12)))
    assert sum(outcomes) == 5
    with session_factory() as db:
        rows = db.execute(select(RequestRateLimit)).scalars().all()
        assert len(rows) == 1
        assert rows[0].attempts == 12
        assert "203.0.113.1" not in rows[0].key
        db.execute(update(RequestRateLimit).values(expires_at=utcnow() - timedelta(seconds=1)))
        db.commit()
    assert attempt(0) is True


def test_login_and_tracking_have_independent_budgets(session_factory):
    with session_factory() as db:
        service = RateLimitService(db)
        assert service.consume("login", "203.0.113.2", 1, 60)[0]
        assert not service.consume("login", "203.0.113.2", 1, 60)[0]
        assert service.consume("tracking", "203.0.113.2", 1, 60)[0]
