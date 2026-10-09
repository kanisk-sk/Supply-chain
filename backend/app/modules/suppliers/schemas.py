"""Supplier API schemas.

Deliberately no performance fields: supplier performance is never stored, only
computed from orders/shipments at read time (see docs/DATABASE.md).
"""

from __future__ import annotations

from datetime import datetime
from typing import Any

from app.common.timestamps import iso_utc

from pydantic import field_serializer, BaseModel, ConfigDict, EmailStr, Field, field_validator


class SupplierCreate(BaseModel):
    model_config = ConfigDict(extra="forbid")

    name: str = Field(min_length=1, max_length=120)
    code: str = Field(min_length=1, max_length=32)
    contact_name: str | None = Field(default=None, max_length=120)
    email: EmailStr | None = None
    phone: str | None = Field(default=None, max_length=32)
    address: str | None = Field(default=None, max_length=255)

    @field_validator("name", "code")
    @classmethod
    def _not_blank(cls, value: str) -> str:
        if not value.strip():
            raise ValueError("must not be blank")
        return value.strip()


class SupplierUpdate(BaseModel):
    model_config = ConfigDict(extra="forbid")

    name: str | None = Field(default=None, min_length=1, max_length=120)
    code: str | None = Field(default=None, min_length=1, max_length=32)
    contact_name: str | None = Field(default=None, max_length=120)
    email: EmailStr | None = None
    phone: str | None = Field(default=None, max_length=32)
    address: str | None = Field(default=None, max_length=255)
    is_active: bool | None = None


    @field_validator('name', 'code', 'is_active')
    @classmethod
    def _required_when_present(cls, value):
        if value is None:
            raise ValueError("must not be null")
        return value

    @field_validator('name', 'code')
    @classmethod
    def _not_blank(cls, value: str) -> str:
        if not value.strip():
            raise ValueError("must not be blank")
        return value.strip()


class SupplierRead(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    name: str
    code: str
    contact_name: str | None
    email: str | None
    phone: str | None
    address: str | None
    is_active: bool
    created_at: datetime
    updated_at: datetime


    @field_serializer('created_at', 'updated_at')
    def _serialize_utc(self, value):
        return iso_utc(value)


def supplier_payload(supplier: Any) -> dict:
    return SupplierRead.model_validate(supplier).model_dump(mode="json")