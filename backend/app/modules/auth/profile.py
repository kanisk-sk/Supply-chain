"""Self-service account changes; never accept another account's ID or role."""
import base64
import binascii
import re

from pydantic import BaseModel, ConfigDict, Field, field_validator, model_validator

from app.common.exceptions import ValidationError
from app.common.transactions import transaction
from app.core.security import hash_password, verify_password
from app.modules.audit_logs.service import AuditLogService
from app.modules.users.schemas import public_user_payload


class ProfileUpdate(BaseModel):
    model_config = ConfigDict(extra="forbid")
    name: str | None = Field(default=None, min_length=1, max_length=120)
    avatar_data: str | None = Field(default=None, max_length=180000)

    @field_validator("name")
    @classmethod
    def name_valid(cls, value):
        if value is None or not value.strip():
            raise ValueError("Name must not be blank")
        return value.strip()

    @field_validator("avatar_data")
    @classmethod
    def avatar_valid(cls, value):
        if value is None:
            return value
        prefix = "data:image/jpeg;base64,"
        if not value.startswith(prefix):
            raise ValueError("Photo must be a JPEG image")
        try:
            image = base64.b64decode(value[len(prefix):], validate=True)
        except (ValueError, binascii.Error):
            raise ValueError("Invalid photo data")
        if not image.startswith(b"\xff\xd8\xff") or not image.endswith(b"\xff\xd9"):
            raise ValueError("Invalid JPEG photo")
        return value


class PasswordUpdate(BaseModel):
    model_config = ConfigDict(extra="forbid")
    current_password: str = Field(min_length=1, max_length=128)
    new_password: str = Field(min_length=8, max_length=128)

    @field_validator("new_password")
    @classmethod
    def password_valid(cls, value):
        if not re.search(r"[A-Za-z]", value) or not re.search(r"\d", value):
            raise ValueError("Password must contain a letter and a digit")
        # bcrypt supports at most 72 bytes, including multibyte characters.
        if len(value.encode("utf-8")) > 72:
            raise ValueError("Password must be at most 72 UTF-8 bytes")
        return value

    @model_validator(mode="after")
    def password_changed(self):
        if self.current_password == self.new_password:
            raise ValueError("Choose a different new password")
        return self


def profile_payload(user):
    return {**public_user_payload(user), "avatar_data": user.avatar_data}


def update_profile(db, user, payload):
    changes = payload.model_dump(exclude_unset=True)
    with transaction(db):
        old_name = user.name
        for key, value in changes.items():
            setattr(user, key, value)
        db.flush()
        AuditLogService(db).record(
            user_id=user.id, action="USER.PROFILE_UPDATE", entity_type="user", entity_id=user.id,
            old_value={"name": old_name},
            new_value={"name": user.name, "photo_changed": "avatar_data" in changes},
        )
        result = profile_payload(user)
    return result


def update_password(db, user, payload):
    if len(payload.current_password.encode("utf-8")) > 72 or not verify_password(payload.current_password, user.password_hash):
        raise ValidationError("Current password is incorrect")
    with transaction(db):
        user.password_hash = hash_password(payload.new_password)
        db.flush()
        AuditLogService(db).record(
            user_id=user.id, action="USER.PASSWORD_CHANGE", entity_type="user", entity_id=user.id,
            old_value=None, new_value={"password_changed": True},
        )
