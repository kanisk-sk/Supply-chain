"""Rehearse migration of legacy rows in the disposable schema only."""
from pathlib import Path
import pytest
from alembic import command
from alembic.config import Config
from sqlalchemy import text
from sqlalchemy.orm import Session
from app.modules.users.models import User, UserRole
from app.modules.orders.models import Order
from app.modules.shipments.models import Shipment
from app.jobs.repositories import SchedulerOwnership

pytestmark = pytest.mark.db


def migration_config(engine):
    root = Path(__file__).resolve().parents[2]
    cfg = Config(str(root / 'alembic.ini'))
    cfg.set_main_option('script_location', str(root / 'alembic'))
    cfg.attributes['database_url'] = engine.url.render_as_string(hide_password=False)
    return cfg


def test_legacy_alert_duplicates_are_resolved_before_unique_index(test_database):
    cfg = migration_config(test_database)
    try:
        command.downgrade(cfg, '8a3965225cfe')
        with test_database.begin() as conn:
            conn.execute(text('DELETE FROM alerts'))
            conn.execute(text("INSERT INTO alerts (type, severity, entity_type, entity_id, message, is_resolved) VALUES ('LOW_STOCK', 'WARNING', 'product', 123, 'legacy warning', 0), ('LOW_STOCK', 'CRITICAL', 'product', 123, 'legacy duplicate', 0)"))
        command.upgrade(cfg, 'head')
        with test_database.connect() as conn:
            rows = conn.execute(text('SELECT is_resolved, active_key FROM alerts ORDER BY id')).all()
            assert len(rows) == 2
            assert rows[0] == (0, 'LOW_STOCK:product:123')
            assert rows[1] == (1, None)
    finally:
        command.upgrade(cfg, 'head')


def test_legacy_shipments_receive_unique_tracking_backfill(test_database):
    cfg = migration_config(test_database)
    try:
        with Session(test_database) as db:
            user = User(name='Legacy migration account', email='legacy-migration@example.com', password_hash='migration-test-only', role=UserRole.ADMIN)
            db.add(user)
            db.flush()
            for index in range(2):
                order = Order(order_number=f'ORD-MIGRATION-{index}', created_by=user.id)
                db.add(order)
                db.flush()
                db.add(Shipment(shipment_number=f'SHP-MIGRATION-{index}', order_id=order.id, created_by=user.id))
            db.commit()
        command.downgrade(cfg, '60265f5dc3cb')
        with test_database.connect() as conn:
            before = conn.execute(text('SELECT COUNT(*) FROM shipments')).scalar_one()
        command.upgrade(cfg, 'head')
        with test_database.connect() as conn:
            rows = conn.execute(text('SELECT tracking_number FROM shipments')).scalars().all()
            assert len(rows) == before and before >= 2
            assert len(set(rows)) == len(rows)
            assert all(value.startswith('TRK-') and len(value) == 12 for value in rows)
    finally:
        command.upgrade(cfg, 'head')


def test_scheduler_competing_connections_and_takeover(session_factory):
    first, second = SchedulerOwnership(session_factory), SchedulerOwnership(session_factory)
    try:
        assert first.acquire()
        assert first.owned()
        assert not second.acquire()
        first.release()
        assert second.acquire()
        assert second.owned()
    finally:
        first.release()
        second.release()
