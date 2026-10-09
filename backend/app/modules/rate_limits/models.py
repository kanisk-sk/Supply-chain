from datetime import datetime

from sqlalchemy import Integer, String, Index
from sqlalchemy.dialects.mysql import DATETIME
from sqlalchemy.orm import Mapped, mapped_column

from app.core.database import Base


class RequestRateLimit(Base):
    """Shared fixed-window counters; only hashed client identifiers persist."""

    __tablename__ = "request_rate_limits"
    __table_args__ = (Index("ix_request_rate_limits_expires_at", "expires_at"),)

    key: Mapped[str] = mapped_column(String(64), primary_key=True)
    attempts: Mapped[int] = mapped_column(Integer, nullable=False)
    expires_at: Mapped[datetime] = mapped_column(DATETIME(fsp=6), nullable=False)
