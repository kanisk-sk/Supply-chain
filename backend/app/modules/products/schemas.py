"""Product API schemas.

``ProductRead`` intentionally has no quantity field: current stock lives only on
``inventory`` (product × warehouse), never on the product itself.
"""

from __future__ import annotations

from datetime import datetime
from decimal import Decimal
from typing import Any

from app.common.timestamps import iso_utc

from pydantic import field_serializer, BaseModel, ConfigDict, Field, field_validator


class ProductCreate(BaseModel):
    model_config = ConfigDict(extra="forbid")

    supplier_id: int
    sku: str = Field(min_length=1, max_length=64)
    name: str = Field(min_length=1, max_length=120)
    description: str | None = None
    unit: str = Field(default="unit", min_length=1, max_length=24)
    reorder_threshold: Decimal = Decimal("0")

    @field_validator("sku", "name", "unit")
    @classmethod
    def _not_blank(cls, value: str) -> str:
        if not value.strip():
            raise ValueError("must not be blank")
        return value.strip()


class ProductUpdate(BaseModel):
    model_config = ConfigDict(extra="forbid")

    supplier_id: int | None = None
    sku: str | None = Field(default=None, min_length=1, max_length=64)
    name: str | None = Field(default=None, min_length=1, max_length=120)
    description: str | None = None
    unit: str | None = Field(default=None, min_length=1, max_length=24)
    reorder_threshold: Decimal | None = None
    is_active: bool | None = None


    @field_validator('supplier_id', 'sku', 'name', 'unit', 'reorder_threshold', 'is_active')
    @classmethod
    def _required_when_present(cls, value):
        if value is None:
            raise ValueError("must not be null")
        return value

    @field_validator('sku', 'name', 'unit')
    @classmethod
    def _not_blank(cls, value: str) -> str:
        if not value.strip():
            raise ValueError("must not be blank")
        return value.strip()


class _SupplierBrief(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    name: str
    code: str


class ProductRead(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    supplier_id: int
    sku: str
    name: str
    description: str | None
    unit: str
    reorder_threshold: Decimal
    is_active: bool
    created_at: datetime
    updated_at: datetime
    supplier: _SupplierBrief


    @field_serializer('created_at', 'updated_at')
    def _serialize_utc(self, value):
        return iso_utc(value)


def product_payload(product: Any) -> dict:
    """Serialize a product, embedding a supplier brief (joined relation)."""
    return ProductRead.model_validate(product).model_dump(mode="json")