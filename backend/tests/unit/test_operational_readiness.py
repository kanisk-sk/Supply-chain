from datetime import datetime
from decimal import Decimal
from types import SimpleNamespace
from unittest.mock import Mock

import pytest
from pydantic import ValidationError

from app.common.exceptions import ForbiddenError
from app.modules.alerts.models import AlertSeverity, AlertType
from app.modules.alerts.service import AlertService
from app.modules.products.schemas import ProductUpdate
from app.modules.suppliers.schemas import SupplierCreate, SupplierUpdate
from app.modules.users.models import UserRole
from app.jobs.scheduler import run_loop


@pytest.mark.parametrize("schema,field", [
    (ProductUpdate, "supplier_id"), (ProductUpdate, "sku"),
    (ProductUpdate, "name"), (ProductUpdate, "unit"),
    (ProductUpdate, "reorder_threshold"), (ProductUpdate, "is_active"),
    (SupplierUpdate, "code"), (SupplierUpdate, "name"), (SupplierUpdate, "is_active"),
])
def test_patch_nonnullable_fields_reject_null(schema, field):
    with pytest.raises(ValidationError):
        schema.model_validate({field: None})
    assert schema().model_dump(exclude_unset=True) == {}


def test_nullable_description_and_contact_can_be_cleared():
    assert ProductUpdate(description=None).model_dump(exclude_unset=True) == {"description": None}
    assert SupplierUpdate(phone=None).model_dump(exclude_unset=True) == {"phone": None}
    with pytest.raises(ValidationError):
        SupplierCreate(name="  ", code="SUP")


def test_low_stock_reconcile_uses_worst_site_and_refreshes_after_restock():
    service = AlertService(Mock())
    service.repo = Mock()
    service._ensure_alert = Mock()
    service._resolve_open = Mock()
    service.repo.lowest_product_stock.return_value = SimpleNamespace(
        quantity=Decimal(0), code="WH-A", reorder_threshold=Decimal(10))
    service.reconcile_low_stock(product_id=7, quantity=Decimal(5), threshold=Decimal(10), warehouse_code="WH-B")
    assert service._ensure_alert.call_args.kwargs["severity"] == AlertSeverity.CRITICAL
    assert "WH-A" in service._ensure_alert.call_args.kwargs["message"]
    service.repo.lowest_product_stock.return_value = SimpleNamespace(
        quantity=Decimal(5), code="WH-B", reorder_threshold=Decimal(10))
    service.reconcile_low_stock(product_id=7, quantity=Decimal(20), threshold=Decimal(10), warehouse_code="WH-A")
    assert service._ensure_alert.call_args.kwargs["severity"] == AlertSeverity.WARNING
    assert "WH-B" in service._ensure_alert.call_args.kwargs["message"]
    service.repo.lowest_product_stock.return_value = SimpleNamespace(
        quantity=Decimal(20), code="WH-B", reorder_threshold=Decimal(10))
    service.reconcile_product_low_stock(product_id=7)
    service._resolve_open.assert_called_once_with(AlertType.LOW_STOCK, "product", 7)


def test_manager_alert_payload_is_local_and_outside_details_denied():
    now = datetime.now()
    alert = SimpleNamespace(id=1, type=AlertType.LOW_STOCK, severity=AlertSeverity.CRITICAL,
        entity_type="product", entity_id=7, message="WH-A zero", is_resolved=False,
        created_at=now, resolved_at=None)
    actor = SimpleNamespace(role=UserRole.WAREHOUSE_MANAGER, warehouse_id=2)
    service = AlertService(Mock()); service.repo = Mock()
    service.repo.get_by_id.return_value = alert
    service.repo.local_low_stock.return_value = SimpleNamespace(quantity=Decimal(5), code="WH-B")
    payload = service.get(1, actor=actor)
    assert payload["severity"] == "WARNING"
    assert "WH-A" not in payload["message"] and "WH-B" in payload["message"]
    service.repo.local_low_stock.return_value = None
    with pytest.raises(ForbiddenError):
        service.get(1, actor=actor)


def test_scheduler_standby_never_evaluates(monkeypatch):
    from app.jobs import scheduler
    stop = Mock()
    stop.is_set.return_value = False
    stop.wait.return_value = True
    ownership = Mock(); ownership.acquire.return_value = False
    tick = Mock(); monkeypatch.setattr(scheduler, "run_once", tick)
    run_loop(stop_event=stop, ownership_factory=lambda factory: ownership)
    tick.assert_not_called()
    ownership.release.assert_called_once()


@pytest.mark.parametrize("acquired", [True, False])
def test_external_scheduler_respects_database_ownership(monkeypatch, acquired):
    from app.jobs import scheduler
    ownership = Mock(); ownership.acquire.return_value = acquired
    tick = Mock(return_value={"checked": 0})
    monkeypatch.setattr(scheduler, "run_once", tick)
    result = scheduler.run_owned_once(ownership_factory=lambda factory: ownership)
    assert tick.call_count == int(acquired)
    assert result == ({"checked": 0} if acquired else None)
    ownership.release.assert_called_once()


def test_external_scheduler_propagates_failure_and_releases(monkeypatch):
    from app.jobs import scheduler
    ownership = Mock(); ownership.acquire.return_value = True
    monkeypatch.setattr(scheduler, "run_once", Mock(side_effect=RuntimeError("job failed")))
    with pytest.raises(RuntimeError, match="job failed"):
        scheduler.run_owned_once(ownership_factory=lambda factory: ownership)
    ownership.release.assert_called_once()


def test_scheduler_releases_ownership_after_tick(monkeypatch):
    from app.jobs import scheduler
    stop = Mock(); stop.is_set.return_value = False; stop.wait.return_value = True
    ownership = Mock(); ownership.acquire.return_value = True
    tick = Mock(return_value={"checked": 1})
    monkeypatch.setattr(scheduler, "run_once", tick)
    callback = Mock()
    run_loop(stop_event=stop, ownership_factory=lambda factory: ownership, on_tick=callback)
    tick.assert_called_once(); callback.assert_called_once_with({"checked": 1})
    ownership.release.assert_called_once()


def test_bottleneck_report_runs_three_queries_with_bounded_history():
    from datetime import timedelta
    from sqlalchemy.dialects import mysql
    from app.modules.analytics.repositories import AnalyticsRepository
    db = Mock(); db.execute.return_value.one.return_value = (2, 7200, 3600, 10800, 3600, 10800)
    start = datetime(2026, 1, 1); end = start + timedelta(days=30)
    reports = AnalyticsRepository(db).bottleneck_reports(start=start, end=end)
    assert len(reports) == 3 and db.execute.call_count == 3
    for call in db.execute.call_args_list:
        compiled = call.args[0].compile(dialect=mysql.dialect())
        assert start in compiled.params.values() and end in compiled.params.values()
        assert "percent_rank() OVER" in str(compiled)


def test_scheduler_lock_lifetime_release_and_lost_connection():
    from app.jobs.repositories import SchedulerOwnership
    engine = Mock(); engine.url.database = "isolated"
    connection = engine.connect.return_value
    connection.execute.return_value.scalar_one.side_effect = [1, 1, 0, 1]
    ownership = SchedulerOwnership(SimpleNamespace(kw={"bind": engine}))
    assert ownership.acquire() is True
    assert ownership.owned() is True
    assert ownership.owned() is False
    ownership.release()
    connection.close.assert_called_once()
    assert ownership.connection is None


def test_product_audit_preserves_values_before_patch():
    from app.modules.products.service import ProductService
    now = datetime.now()
    product = SimpleNamespace(id=7, supplier_id=2, sku="OLD-SKU", name="Old name",
        description=None, unit="unit", reorder_threshold=Decimal(10), is_active=True,
        created_at=now, updated_at=now, supplier=SimpleNamespace(id=2, name="Supplier", code="SUP"))
    service = ProductService(Mock()); service.repo = Mock(); service.audit = Mock()
    service.repo.get_by_id.return_value = product; service.repo.exists_by_sku.return_value = False
    service.update(7, ProductUpdate(sku="NEW-SKU", name="New name"), actor=SimpleNamespace(id=1))
    audit = service.audit.record.call_args.kwargs
    assert audit["old_value"]["sku"] == "OLD-SKU" and audit["old_value"]["name"] == "Old name"
    assert audit["new_value"]["sku"] == "NEW-SKU" and audit["new_value"]["name"] == "New name"


def test_supplier_audit_preserves_values_before_patch():
    from app.modules.suppliers.service import SupplierService
    now = datetime.now()
    supplier = SimpleNamespace(id=2, code="OLD", name="Old supplier", contact_name=None,
        email=None, phone=None, address=None, is_active=True, created_at=now, updated_at=now)
    service = SupplierService(Mock()); service.repo = Mock(); service.audit = Mock()
    service.repo.get_by_id.return_value = supplier; service.repo.exists_by_code.return_value = False
    service.update(2, SupplierUpdate(code="NEW", name="New supplier"), actor=SimpleNamespace(id=1))
    audit = service.audit.record.call_args.kwargs
    assert audit["old_value"]["code"] == "OLD" and audit["old_value"]["name"] == "Old supplier"
    assert audit["new_value"]["code"] == "NEW" and audit["new_value"]["name"] == "New supplier"
