"""Warehouse API schemas."""

from __future__ import annotations

from app.common.timestamps import iso_utc

from datetime import datetime
from typing import Any

from pydantic import field_serializer, BaseModel, ConfigDict, Field, field_validator


class WarehouseCreate(BaseModel):
    model_config = ConfigDict(extra="forbid")

    code: str = Field(min_length=1, max_length=32)
    name: str = Field(min_length=1, max_length=120)
    address: str | None = Field(default=None, max_length=255)


class WarehouseUpdate(BaseModel):
    model_config = ConfigDict(extra="forbid")

    code: str | None = Field(default=None, min_length=1, max_length=32)
    name: str | None = Field(default=None, min_length=1, max_length=120)
    address: str | None = Field(default=None, max_length=255)
    is_active: bool | None = None

    @field_validator("code", "name", "is_active")
    @classmethod
    def _required_when_present(cls, value):
        if value is None:
            raise ValueError("must not be null")
        return value

    @field_validator("code", "name")
    @classmethod
    def _not_blank(cls, value):
        if not value.strip():
            raise ValueError("must not be blank")
        return value.strip()



class WarehouseRead(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    code: str
    name: str
    address: str | None
    is_active: bool
    created_at: datetime
    updated_at: datetime

    @field_serializer('created_at', 'updated_at')
    def _utc_json(self, value):
        return iso_utc(value)


def warehouse_payload(warehouse: Any) -> dict:
    return WarehouseRead.model_validate(warehouse).model_dump(mode="json")