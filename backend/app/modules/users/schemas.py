"""Users API schemas.

The user representation deliberately never contains ``password_hash`` — that
column is internal and must not be serialized to clients.
"""

from __future__ import annotations

from app.common.timestamps import iso_utc

import re
from datetime import datetime

from pydantic import field_serializer, BaseModel, ConfigDict, EmailStr, Field, field_validator, model_validator

from app.modules.users.models import UserRole


class UserCreate(BaseModel):
    model_config = ConfigDict(extra="forbid")

    name: str = Field(min_length=1, max_length=120)
    email: EmailStr
    password: str = Field(min_length=8, max_length=128)
    role: UserRole = UserRole.ANALYST
    is_active: bool = True
    warehouse_id: int | None = Field(default=None, gt=0)

    @field_validator("name")
    @classmethod
    def _name_not_blank(cls, value: str) -> str:
        if not value.strip():
            raise ValueError("name must not be blank")
        return value.strip()

    @field_validator("email")
    @classmethod
    def _email_normalized(cls, value: EmailStr) -> str:
        return str(value).lower()

    @field_validator("password")
    @classmethod
    def _password_strength(cls, value: str) -> str:
        if len(value.encode("utf-8")) > 72:
            raise ValueError("password must be at most 72 UTF-8 bytes")
        if not re.search(r"[A-Za-z]", value) or not re.search(r"\d", value):
            raise ValueError(
                "password must contain at least one letter and one digit"
            )
        return value


class UserUpdate(BaseModel):
    model_config = ConfigDict(extra="forbid")

    name: str | None = Field(default=None, min_length=1, max_length=120)
    email: EmailStr | None = None
    password: str | None = Field(default=None, min_length=8, max_length=128)
    role: UserRole | None = None
    is_active: bool | None = None
    warehouse_id: int | None = Field(default=None, gt=0)

    @model_validator(mode="before")
    @classmethod
    def _required_fields_not_null(cls, data):
        if isinstance(data, dict) and any(data.get(k) is None for k in ("name", "email", "password", "role", "is_active") if k in data):
            raise ValueError("Required user fields cannot be null")
        return data


    @field_validator("name")
    @classmethod
    def _name_not_blank(cls, value: str | None) -> str | None:
        if value is not None and not value.strip():
            raise ValueError("name must not be blank")
        return value.strip() if value is not None else None

    @field_validator("email")
    @classmethod
    def _email_normalized(cls, value: EmailStr | None) -> str | None:
        return str(value).lower() if value is not None else None

    @field_validator("password")
    @classmethod
    def _password_strength(cls, value: str | None) -> str | None:
        if value is None:
            return None
        if len(value.encode("utf-8")) > 72:
            raise ValueError("password must be at most 72 UTF-8 bytes")
        if not re.search(r"[A-Za-z]", value) or not re.search(r"\d", value):
            raise ValueError(
                "password must contain at least one letter and one digit"
            )
        return value


class UserRead(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    name: str
    email: str
    role: UserRole
    is_active: bool
    warehouse_id: int | None = None
    created_at: datetime
    updated_at: datetime

    @classmethod
    def from_user(cls, user) -> "UserRead":
        return cls.model_validate(user)

    @field_serializer('created_at', 'updated_at')
    def _utc_json(self, value):
        return iso_utc(value)


def public_user_payload(user) -> dict:
    """JSON-safe dict representation of a user, never exposing the hash."""
    return UserRead.from_user(user).model_dump(mode="json")
