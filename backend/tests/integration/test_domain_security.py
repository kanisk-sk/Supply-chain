"""Production-boundary regressions through HTTP and real MySQL transactions."""
from concurrent.futures import ThreadPoolExecutor
from threading import Barrier

import pytest
from sqlalchemy import func, select

from app.common.exceptions import InvalidStateTransitionError
from app.modules.inventory.models import Inventory, InventoryTransaction, InventoryTransactionType
from app.modules.shipments.schemas import ShipmentDispatchRequest
from app.modules.shipments.service import ShipmentService
from app.modules.users.models import User, UserRole
from tests.integration.test_auth import login
from tests.integration.test_shipments import _setup, _confirmed_order, _create_shipment, _dispatch

pytestmark = pytest.mark.db


def _account_headers(api_client, account):
    return {"Authorization": f"Bearer {login(api_client, account['email'], account['password'])}"}


def test_manager_cannot_read_or_mutate_another_warehouse(api_client, seed, catalog, session_factory):
    ctx = _setup(api_client, seed, catalog)
    other = catalog.warehouse(code="WH-OTHER")
    other_manager = seed.user("other-manager@example.com", role=UserRole.WAREHOUSE_MANAGER)
    with session_factory() as db:
        db.get(User, other_manager["id"]).warehouse_id = other["id"]
        db.commit()
    headers = _account_headers(api_client, other_manager)
    order = _confirmed_order(api_client, ctx, quantity=5)
    shipment = _create_shipment(api_client, ctx, order["id"]).json()["data"]
    for endpoint in (f"/orders/{order['id']}", f"/shipments/{shipment['id']}", f"/shipments/{shipment['id']}/history", f"/warehouses/{ctx['warehouse']['id']}"):
        assert api_client.get("/api/v1" + endpoint, headers=headers).status_code == 403
    assert api_client.post("/api/v1/inventory/adjust", json={"product_id": ctx["product"]["id"], "warehouse_id": ctx["warehouse"]["id"], "delta": 1}, headers=headers).status_code == 403
    assert api_client.post("/api/v1/inventory/transfer", json={"product_id": ctx["product"]["id"], "from_warehouse_id": ctx["warehouse"]["id"], "to_warehouse_id": other["id"], "quantity": 1}, headers=headers).status_code == 403
    assert api_client.post(f"/api/v1/shipments/{shipment['id']}/dispatch", json={"warehouse_id": ctx["warehouse"]["id"]}, headers=headers).status_code == 403
    assert api_client.post(f"/api/v1/shipments/{shipment['id']}/deliver", headers=headers).status_code == 403
    assert api_client.patch(f"/api/v1/warehouses/{ctx['warehouse']['id']}", json={"name": "Unauthorized"}, headers=headers).status_code == 403
    assert api_client.post("/api/v1/warehouses", json={"code": "WH-FORBIDDEN", "name": "No"}, headers=headers).status_code == 403
    visible = api_client.get("/api/v1/warehouses", headers=headers).json()["data"]
    assert [w["id"] for w in visible] == [other["id"]]
    destinations = api_client.get("/api/v1/warehouses/transfer-destinations", headers=headers).json()["data"]
    assert any(w["id"] == ctx["warehouse"]["id"] for w in destinations)
    assert all(set(w) == {"id", "name", "code"} for w in destinations)
    # Network destination is allowed, but source must be assigned to actor.
    transferred = api_client.post("/api/v1/inventory/transfer", json={"product_id": ctx["product"]["id"], "from_warehouse_id": ctx["warehouse"]["id"], "to_warehouse_id": other["id"], "quantity": 1}, headers=ctx["wh"])
    assert transferred.status_code == 200
    assert {row["warehouse_id"] for row in transferred.json()["data"]} == {ctx["warehouse"]["id"]}


def test_order_allows_only_one_full_order_shipment(api_client, seed, catalog):
    ctx = _setup(api_client, seed, catalog)
    order = _confirmed_order(api_client, ctx)
    assert _create_shipment(api_client, ctx, order["id"]).status_code == 201
    assert _create_shipment(api_client, ctx, order["id"]).status_code == 409


def test_cancelled_order_cannot_dispatch_and_dispatched_order_cannot_cancel(api_client, seed, catalog):
    ctx = _setup(api_client, seed, catalog)
    order = _confirmed_order(api_client, ctx)
    shipment = _create_shipment(api_client, ctx, order["id"]).json()["data"]
    assert api_client.post(f"/api/v1/orders/{order['id']}/cancel", headers=ctx["scm"]).status_code == 200
    assert _dispatch(api_client, ctx, shipment["id"]).status_code == 409
    order2 = _confirmed_order(api_client, ctx)
    shipment2 = _create_shipment(api_client, ctx, order2["id"]).json()["data"]
    assert _dispatch(api_client, ctx, shipment2["id"]).status_code == 200
    assert api_client.post(f"/api/v1/orders/{order2['id']}/cancel", headers=ctx["scm"]).status_code == 409


def test_admin_assigns_warehouse_and_password_reset_revokes_session(api_client, seed, catalog):
    ctx = _setup(api_client, seed, catalog)
    admin = seed.user("provision-admin@example.com", role=UserRole.ADMIN)
    headers = _account_headers(api_client, admin)
    body = {"name": "Warehouse Operator", "email": "new-manager@example.com", "password": "ValidPassword1", "role": "WAREHOUSE_MANAGER"}
    assert api_client.post("/api/v1/users", json=body, headers=headers).status_code == 400
    response = api_client.post("/api/v1/users", json={**body, "warehouse_id": ctx["warehouse"]["id"]}, headers=headers)
    assert response.status_code == 201
    manager = response.json()["data"]
    old_headers = {"Authorization": "Bearer " + login(api_client, body["email"], body["password"])}
    assert api_client.get("/api/v1/auth/me", headers=old_headers).status_code == 200
    assert api_client.patch(f"/api/v1/users/{manager['id']}", json={"password": "DifferentPassword2"}, headers=headers).status_code == 200
    assert api_client.get("/api/v1/auth/me", headers=old_headers).status_code == 401
    assert login(api_client, body["email"], "DifferentPassword2")


def test_self_service_password_change_revokes_previous_session(api_client, seed):
    account = seed.user("reset-me@example.com")
    headers = _account_headers(api_client, account)
    result = api_client.post("/api/v1/auth/me/password", headers=headers, json={"current_password": account["password"], "new_password": "NewPassword2"})
    assert result.status_code == 200
    assert api_client.get("/api/v1/auth/me", headers=headers).status_code == 401
    assert login(api_client, account["email"], "NewPassword2")


def test_concurrent_dispatch_consumes_inventory_once(api_client, seed, catalog, session_factory):
    ctx = _setup(api_client, seed, catalog, stock=50)
    order = _confirmed_order(api_client, ctx, quantity=5)
    shipment = _create_shipment(api_client, ctx, order["id"]).json()["data"]
    barrier = Barrier(2)

    def dispatch():
        with session_factory() as db:
            actor = db.execute(select(User).where(User.role == UserRole.WAREHOUSE_MANAGER)).scalar_one()
            barrier.wait(timeout=10)
            try:
                ShipmentService(db).dispatch(shipment["id"], ShipmentDispatchRequest(warehouse_id=ctx["warehouse"]["id"]), actor=actor)
                return "success"
            except InvalidStateTransitionError:
                return "conflict"

    with ThreadPoolExecutor(max_workers=2) as pool:
        futures = [pool.submit(dispatch) for _ in range(2)]
        results = [f.result(timeout=30) for f in futures]
    assert sorted(results) == ["conflict", "success"]
    with session_factory() as db:
        stock = db.execute(select(Inventory.quantity).where(Inventory.product_id == ctx["product"]["id"], Inventory.warehouse_id == ctx["warehouse"]["id"])).scalar_one()
        assert stock == 45
        count = db.execute(select(func.count()).select_from(InventoryTransaction).where(InventoryTransaction.reference_id == shipment["id"], InventoryTransaction.type == InventoryTransactionType.SHIPMENT_DISPATCH)).scalar_one()
        assert count == 1


def test_concurrent_shipment_creation_cannot_duplicate_full_order(api_client, seed, catalog, session_factory):
    from app.common.exceptions import ConflictError
    from app.modules.shipments.models import Shipment
    from app.modules.shipments.schemas import ShipmentCreate
    ctx = _setup(api_client, seed, catalog)
    order = _confirmed_order(api_client, ctx, quantity=5)
    barrier = Barrier(2)

    def create():
        with session_factory() as db:
            actor = db.execute(select(User).where(User.role == UserRole.SUPPLY_CHAIN_MANAGER)).scalar_one()
            barrier.wait(timeout=10)
            try:
                ShipmentService(db).create(ShipmentCreate(order_id=order["id"], warehouse_id=ctx["warehouse"]["id"]), actor=actor)
                return "success"
            except ConflictError:
                return "conflict"

    with ThreadPoolExecutor(max_workers=2) as pool:
        futures = [pool.submit(create) for _ in range(2)]
        results = [f.result(timeout=30) for f in futures]
    assert sorted(results) == ["conflict", "success"]
    with session_factory() as db:
        assert db.execute(select(func.count()).select_from(Shipment).where(Shipment.order_id == order["id"])).scalar_one() == 1


def test_offset_timestamp_creation_returns_explicit_utc(api_client, seed, catalog):
    ctx = _setup(api_client, seed, catalog)
    order = _confirmed_order(api_client, ctx)
    response = api_client.post("/api/v1/shipments", headers=ctx["scm"], json={"order_id": order["id"], "warehouse_id": ctx["warehouse"]["id"], "expected_delivery_at": "2099-01-01T10:00:00+05:30"})
    assert response.status_code == 201
    shipment = response.json()["data"]
    assert shipment["expected_delivery_at"] == "2099-01-01T04:30:00Z"
    public = api_client.get(f"/api/v1/public/tracking/{shipment['tracking_number']}").json()["data"]
    assert public["expected_delivery_at"] == shipment["expected_delivery_at"]
    assert public["timeline"][0]["changed_at"].endswith("Z")
