"""Database-owned scheduler lease, tied to a dedicated connection lifetime."""
from __future__ import annotations

import hashlib
from sqlalchemy import text


class SchedulerOwnership:
    def __init__(self, session_factory):
        self.engine = session_factory.kw["bind"]
        scope = str(self.engine.url.database or "default")
        self.name = "supply-chain-overdue:" + hashlib.sha256(scope.encode()).hexdigest()[:32]
        self.connection = None

    def acquire(self) -> bool:
        self.release()
        connection = self.engine.connect()
        try:
            acquired = connection.execute(
                text("SELECT GET_LOCK(:name, 0)"), {"name": self.name}
            ).scalar_one()
            if acquired != 1:
                connection.close()
                return False
            self.connection = connection
            return True
        except BaseException:
            connection.close()
            raise

    def owned(self) -> bool:
        if self.connection is None:
            return False
        # A disconnected/reconnected connection no longer owns the lock.
        return bool(self.connection.execute(text(
            "SELECT IS_USED_LOCK(:name) = CONNECTION_ID()"
        ), {"name": self.name}).scalar_one())

    def release(self) -> None:
        connection, self.connection = self.connection, None
        if connection is not None:
            try:
                connection.execute(text("SELECT RELEASE_LOCK(:name)"), {"name": self.name})
            finally:
                connection.close()
