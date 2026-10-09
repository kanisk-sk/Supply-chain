"""Alert data access layer (derived conditions only, never writable by clients)."""

from __future__ import annotations

from dataclasses import dataclass
from decimal import Decimal
from types import SimpleNamespace

from sqlalchemy import Select, and_, or_, func, select
from sqlalchemy.orm import Session
from sqlalchemy.dialects.mysql import insert as mysql_insert

from app.common.pagination import apply_pagination, count_total
from app.core.database import utcnow
from app.modules.alerts.models import Alert, AlertSeverity, AlertType


@dataclass
class AlertListResult:
    items: list[Alert]
    total: int


class AlertRepository:
    def __init__(self, db: Session) -> None:
        self.db = db

    def list(
        self,
        *,
        page: int | None,
        limit: int | None,
        alert_type: AlertType | None = None,
        severity: AlertSeverity | None = None,
        entity_type: str | None = None,
        entity_id: int | None = None,
        is_resolved: bool | None = None,
        warehouse_id: int | None = None,
    ) -> AlertListResult:
        stmt: Select[tuple[Alert]] = select(Alert)
        if alert_type is not None:
            stmt = stmt.where(Alert.type == alert_type)
        if severity is not None:
            if warehouse_id is None:
                stmt = stmt.where(Alert.severity == severity)
            else:
                stmt = stmt.where(or_(Alert.type == AlertType.LOW_STOCK, Alert.severity == severity))
        if entity_type is not None:
            stmt = stmt.where(Alert.entity_type == entity_type)
        if entity_id is not None:
            stmt = stmt.where(Alert.entity_id == entity_id)
        if is_resolved is not None:
            stmt = stmt.where(Alert.is_resolved.is_(is_resolved))
        if warehouse_id is not None:
            from app.modules.inventory.models import Inventory
            from app.modules.products.models import Product
            from app.modules.shipments.models import Shipment

            # Global product alerts have no warehouse history. Expose only a
            # currently-low local condition; never leak another site's message.
            local_low_stock = select(Inventory.id).join(
                Product, Product.id == Inventory.product_id
            ).where(
                Inventory.product_id == Alert.entity_id,
                Inventory.warehouse_id == warehouse_id,
                Inventory.quantity < Product.reorder_threshold,
            ).exists()
            if severity is not None:
                # Match the local severity returned in the manager payload.
                severity_quantity = (Inventory.quantity == 0 if severity == AlertSeverity.CRITICAL
                                     else Inventory.quantity > 0 if severity == AlertSeverity.WARNING
                                     else Inventory.quantity < 0)
                local_low_stock = select(Inventory.id).join(
                    Product, Product.id == Inventory.product_id
                ).where(Inventory.product_id == Alert.entity_id,
                        Inventory.warehouse_id == warehouse_id,
                        Inventory.quantity < Product.reorder_threshold,
                        severity_quantity).exists()
            local_shipment = select(Shipment.id).where(
                Shipment.id == Alert.entity_id,
                Shipment.warehouse_id == warehouse_id,
            ).exists()
            stmt = stmt.where(or_(
                and_(Alert.type == AlertType.LOW_STOCK,
                     Alert.entity_type == "product",
                     Alert.is_resolved.is_(False), local_low_stock),
                and_(Alert.type == AlertType.SHIPMENT_OVERDUE,
                     Alert.entity_type == "shipment", local_shipment),
            ))
        total = count_total(self.db, stmt, Alert.id)
        items = self.db.execute(
            apply_pagination(
                stmt.order_by(Alert.created_at.desc(), Alert.id.desc()), page, limit
            )
        ).scalars().all()
        return AlertListResult(items=items, total=total)

    def get_by_id(self, alert_id: int) -> Alert | None:
        return self.db.execute(
            select(Alert).where(Alert.id == alert_id)
        ).scalar_one_or_none()

    def unresolved_for(self, alert_type: AlertType, entity_type: str, entity_id: int) -> list[Alert]:
        return self.db.execute(
            select(Alert).where(
                Alert.type == alert_type,
                Alert.entity_type == entity_type,
                Alert.entity_id == entity_id,
                Alert.is_resolved.is_(False),
            ).with_for_update().execution_options(populate_existing=True)
        ).scalars().all()

    def has_unresolved(
        self, alert_type: AlertType, entity_type: str, entity_id: int
    ) -> bool:
        stmt = (
            select(func.count())
            .select_from(Alert)
            .where(
                Alert.type == alert_type,
                Alert.entity_type == entity_type,
                Alert.entity_id == entity_id,
                Alert.is_resolved.is_(False),
            )
        )
        return int(self.db.execute(stmt).scalar_one()) > 0

    def unresolve_key(self, alert_type: AlertType, entity_type: str, entity_id: int) -> str:
        """Deterministic storage key for one open (type, entity) episode.

        Non-NULL only while the alert is unresolved; it backs the UNIQUE index
        that guarantees at most one open alert per episode at the InnoDB level.
        """
        return f"{alert_type.value}:{entity_type}:{entity_id}"

    def unresolved_of_type(self, alert_type: AlertType) -> list[Alert]:
        """Open alerts for one rule — the scheduled evaluator's sweep target."""
        return self.db.execute(
            select(Alert)
            .where(Alert.type == alert_type, Alert.is_resolved.is_(False))
            .order_by(Alert.id)
        ).scalars().all()

    def add(
        self,
        *,
        alert_type: AlertType,
        severity,
        entity_type: str,
        entity_id: int,
        message: str,
    ) -> Alert:
        alert = Alert(
            type=alert_type,
            severity=severity,
            entity_type=entity_type,
            entity_id=entity_id,
            message=message,
            active_key=self.unresolve_key(alert_type, entity_type, entity_id),
        )
        self.db.add(alert)
        self.db.flush()
        return alert

    def mark_resolved(self, alert: Alert) -> None:
        alert.is_resolved = True
        alert.resolved_at = utcnow()
        alert.active_key = None
        self.db.flush()

    def product_min_quantity(self, product_id: int) -> Decimal | None:
        """Lowest current inventory quantity for a product (None when no rows).

        Callers (e.g. LOW_STOCK reconciliation) combine this with the threshold
        to decide whether a product has moved back above it. Aggregated in SQL
        so the per-row fetch-and-min in Python is avoided.
        """
        from app.modules.inventory.models import Inventory

        return self.db.execute(
            select(func.min(Inventory.quantity)).where(
                Inventory.product_id == product_id
            )
        ).scalar_one()

    def lowest_product_stock(self, product_id: int):
        from app.modules.inventory.models import Inventory
        from app.modules.products.models import Product
        from app.modules.warehouses.models import Warehouse

        # The product mutex is acquired before stock writes. Lock stock rows
        # separately: joining Warehouse here would also lock shared warehouse
        # rows on MySQL and introduce unnecessary cross-product deadlocks.
        threshold = self.db.execute(select(Product.reorder_threshold).where(
            Product.id == product_id
        ).with_for_update()).scalar_one_or_none()
        rows = self.db.execute(
            select(Inventory.quantity, Inventory.warehouse_id)
            .where(Inventory.product_id == product_id)
            .order_by(Inventory.warehouse_id).with_for_update()
        ).all()
        if not rows or threshold is None:
            return None
        lowest = min(rows, key=lambda row: (row.quantity, row.warehouse_id))
        code = self.db.execute(select(Warehouse.code).where(
            Warehouse.id == lowest.warehouse_id
        )).scalar_one()
        return SimpleNamespace(quantity=lowest.quantity, code=code, reorder_threshold=threshold)

    def local_low_stock(self, product_id: int, warehouse_id: int):
        return self.local_low_stocks([product_id], warehouse_id).get(product_id)

    def local_low_stocks(self, product_ids: list[int], warehouse_id: int) -> dict:
        from app.modules.inventory.models import Inventory
        from app.modules.products.models import Product
        from app.modules.warehouses.models import Warehouse
        if not product_ids:
            return {}
        rows = self.db.execute(
            select(Inventory.product_id, Inventory.quantity, Warehouse.code)
            .join(Warehouse, Warehouse.id == Inventory.warehouse_id)
            .join(Product, Product.id == Inventory.product_id)
            .where(Inventory.product_id.in_(product_ids),
                   Inventory.warehouse_id == warehouse_id,
                   Inventory.quantity < Product.reorder_threshold)
        ).all()
        return {row.product_id: row for row in rows}

    def shipment_in_warehouse(self, shipment_id: int, warehouse_id: int) -> bool:
        from app.modules.shipments.models import Shipment
        return self.db.execute(select(Shipment.id).where(
            Shipment.id == shipment_id, Shipment.warehouse_id == warehouse_id
        )).scalar_one_or_none() is not None

    def unresolved_overdue_ids(self) -> set[int]:
        return set(self.db.execute(select(Alert.id).where(
            Alert.type == AlertType.SHIPMENT_OVERDUE,
            Alert.is_resolved.is_(False),
        )).scalars())


    def ensure_alert(self, *, alert_type, severity, entity_type, entity_id, message):
        stmt = mysql_insert(Alert).values(
            type=alert_type,
            severity=severity,
            entity_type=entity_type,
            entity_id=entity_id,
            message=message,
            is_resolved=False,
            active_key=self.unresolve_key(alert_type, entity_type, entity_id),
            created_at=utcnow(),
        )
        stmt = stmt.on_duplicate_key_update(
            severity=stmt.inserted.severity,
            message=stmt.inserted.message,
        )
        self.db.execute(stmt)
