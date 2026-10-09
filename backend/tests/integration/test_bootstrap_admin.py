"""Initial administrator provisioning on the isolated migrated test database."""
import pytest
from sqlalchemy import select, func

from app.bootstrap_admin import provision
from app.core.security import verify_password
from app.modules.audit_logs.models import AuditLog
from app.modules.users.models import User, UserRole
from app.modules.users.schemas import UserCreate, public_user_payload

pytestmark = pytest.mark.db


def test_provisions_first_admin_without_exposing_password(db_session):
    password = "InitialStrongPassword1"
    admin = provision(db_session, UserCreate(name="Initial administrator", email="initial-admin@example.com", password=password, role=UserRole.ADMIN))
    assert admin.role == UserRole.ADMIN
    assert admin.is_active
    assert verify_password(password, admin.password_hash)
    assert admin.password_hash != password
    public = public_user_payload(admin)
    assert "password_hash" not in public
    assert "password" not in public
    audit = db_session.execute(select(AuditLog).where(AuditLog.entity_id == admin.id)).scalar_one()
    assert password not in str(audit.new_value)
    assert admin.password_hash not in str(audit.new_value)


def test_existing_active_admin_refuses_bootstrap_without_creating_user(db_session, seed):
    seed.user("existing-admin@example.com", role=UserRole.ADMIN)
    with pytest.raises(ValueError, match="active administrator already exists"):
        provision(db_session, UserCreate(name="Another admin", email="another-admin@example.com", password="ValidPassword1", role=UserRole.ADMIN))
    assert db_session.execute(select(func.count()).select_from(User)).scalar_one() == 1
