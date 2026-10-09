"""Boundary regressions independent of a live database."""
from datetime import datetime
from types import SimpleNamespace

import pytest
from pydantic import ValidationError

from app.common.exceptions import ForbiddenError
from app.core.security import password_token_version
from app.modules.auth.scope import require_warehouse_scope
from app.modules.shipments.schemas import ShipmentCreate, ShipmentDispatchRequest, is_delayed
from app.modules.users.models import UserRole
from app.modules.users.schemas import UserCreate, UserUpdate
from app.modules.warehouses.schemas import WarehouseUpdate


def test_timezone_input_is_normalized_to_utc_before_comparison():
    payload = ShipmentCreate(order_id=1, expected_delivery_at="2026-01-01T10:00:00+05:30")
    assert payload.expected_delivery_at == datetime(2026, 1, 1, 4, 30)
    assert is_delayed(payload.expected_delivery_at, "PACKED", datetime(2026, 1, 1, 5))
    dispatch = ShipmentDispatchRequest(warehouse_id=1, expected_delivery_at="2026-01-01T04:30:00Z")
    assert dispatch.expected_delivery_at == payload.expected_delivery_at


@pytest.mark.parametrize("password", ["A1" + "x" * 71, "A1" + "é" * 36])
def test_admin_password_respects_bcrypt_byte_limit(password):
    with pytest.raises(ValidationError):
        UserCreate(name="Operator", email="ops@example.com", password=password)
    with pytest.raises(ValidationError):
        UserUpdate(password=password)


@pytest.mark.parametrize("field", ["name", "email", "password", "role", "is_active"])
def test_null_required_user_update_rejected(field):
    with pytest.raises(ValidationError):
        UserUpdate(**{field: None})


@pytest.mark.parametrize("field", ["name", "code", "is_active"])
def test_null_required_warehouse_update_rejected(field):
    with pytest.raises(ValidationError):
        WarehouseUpdate(**{field: None})


def test_nullable_assignment_and_optional_address_can_be_cleared():
    assert UserUpdate(warehouse_id=None).model_fields_set == {"warehouse_id"}
    assert WarehouseUpdate(address=None).model_fields_set == {"address"}


def test_warehouse_scope_denies_cross_warehouse_and_unassigned_manager():
    for assignment in (None, 2):
        actor = SimpleNamespace(role=UserRole.WAREHOUSE_MANAGER, warehouse_id=assignment)
        with pytest.raises(ForbiddenError):
            require_warehouse_scope(actor, 1)
    require_warehouse_scope(SimpleNamespace(role=UserRole.WAREHOUSE_MANAGER, warehouse_id=1), 1)
    require_warehouse_scope(SimpleNamespace(role=UserRole.ADMIN, warehouse_id=None), 1)


def test_password_token_fingerprint_changes_with_hash_and_does_not_reveal_it():
    previous = password_token_version("old-bcrypt-hash")
    assert previous != password_token_version("new-bcrypt-hash")
    assert "bcrypt" not in previous
    assert len(previous) == 64
