"""Naive UTC at the database boundary; explicit UTC in JSON."""
from datetime import datetime, timezone


def normalize_utc(value: datetime | None) -> datetime | None:
    if value is not None and value.tzinfo is not None:
        return value.astimezone(timezone.utc).replace(tzinfo=None)
    return value


def iso_utc(value: datetime | None) -> str | None:
    if value is None:
        return None
    normalized = normalize_utc(value)
    return normalized.isoformat() + "Z"
