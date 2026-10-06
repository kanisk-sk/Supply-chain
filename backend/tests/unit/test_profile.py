from datetime import datetime
from types import SimpleNamespace
from unittest.mock import Mock, patch
import pytest
from fastapi.testclient import TestClient
from pydantic import ValidationError
from app.main import create_app
from app.core.database import get_db
from app.core.security import hash_password, verify_password
from app.modules.auth.dependencies import get_current_user
from app.modules.auth.profile import ProfileUpdate, PasswordUpdate
from app.modules.users.models import UserRole

@pytest.fixture
def account():
    user = SimpleNamespace(id=42, name="Analyst", email="analyst@example.com", role=UserRole.ANALYST, is_active=True, avatar_data=None, password_hash=hash_password("Original123"), created_at=datetime.now(), updated_at=datetime.now())
    db = Mock()
    app = create_app()
    app.dependency_overrides[get_current_user] = lambda: user
    app.dependency_overrides[get_db] = lambda: db
    with patch("app.modules.auth.profile.AuditLogService"), TestClient(app) as client:
        yield client, user, db

def test_non_admin_can_save_own_name(account):
    client, user, db = account
    res = client.patch("/api/v1/auth/me", json={"name":" New name "})
    assert res.status_code == 200
    assert user.name == res.json()["data"]["name"] == "New name"
    db.commit.assert_called_once()

def test_me_includes_warehouse_assignment(account):
    client, user, db = account
    user.warehouse_id = 7
    assert client.get("/api/v1/auth/me").json()["data"]["warehouse_id"] == 7
    user.warehouse_id = None
    assert client.get("/api/v1/auth/me").json()["data"]["warehouse_id"] is None

@pytest.mark.parametrize("field,value", [("role","ADMIN"),("id",1),("email","other@example.com"),("name",None)])
def test_reject_protected_fields(account, field, value):
    client, user, db = account
    assert client.patch("/api/v1/auth/me",json={field:value}).status_code == 422
    db.commit.assert_not_called()

def test_wrong_current_password(account):
    client, user, db = account
    original = user.password_hash
    assert client.post("/api/v1/auth/me/password",json={"current_password":"Wrong123","new_password":"Changed123"}).status_code == 400
    assert user.password_hash == original
    db.commit.assert_not_called()

def test_password_saved_as_hash(account):
    client, user, db = account
    assert client.post("/api/v1/auth/me/password",json={"current_password":"Original123","new_password":"Changed123"}).status_code == 200
    assert verify_password("Changed123",user.password_hash)
    assert not verify_password("Original123",user.password_hash)
    db.commit.assert_called_once()

def test_remove_photo(account):
    client, user, db = account
    user.avatar_data="old"
    assert client.patch("/api/v1/auth/me",json={"avatar_data":None}).status_code == 200
    assert user.avatar_data is None

@pytest.mark.parametrize("photo",["data:image/svg+xml;base64,PHN2Zz4=","data:image/jpeg;base64,abc!","data:image/jpeg;base64,YWJj"])
def test_invalid_photo(photo):
    with pytest.raises(ValidationError): ProfileUpdate(avatar_data=photo)

def test_unauthenticated_denied():
    with TestClient(create_app()) as client:
        assert client.patch("/api/v1/auth/me",json={"name":"Another"}).status_code == 401

def test_bcrypt_byte_limit():
    with pytest.raises(ValidationError): PasswordUpdate(current_password="Original123",new_password="a1"+"é"*40)
