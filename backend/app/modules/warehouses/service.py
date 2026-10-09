"""Warehouse business rules. Unique ``code`` conflicts become ``CONFLICT``."""

from __future__ import annotations

from sqlalchemy.orm import Session

from app.common.exceptions import ConflictError, ForbiddenError, NotFoundError
from app.common.transactions import transaction
from app.modules.audit_logs.service import AuditLogService
from app.modules.users.models import User, UserRole
from app.modules.auth.scope import require_warehouse_scope
from app.modules.warehouses.models import Warehouse
from app.modules.warehouses.repositories import WarehouseRepository
from app.modules.warehouses.schemas import (
    WarehouseCreate,
    WarehouseUpdate,
    warehouse_payload,
)


class WarehouseService:
    def __init__(self, db: Session) -> None:
        self.db = db
        self.repo = WarehouseRepository(db)
        self.audit = AuditLogService(db)

    def list(self, *, page, limit, is_active=None, actor: User | None = None) -> dict:
        warehouse_id = None
        if actor is not None and actor.role == UserRole.WAREHOUSE_MANAGER:
            if actor.warehouse_id is None:
                return {"items": [], "total": 0}
            warehouse_id = actor.warehouse_id
        result = self.repo.list(page=page, limit=limit, is_active=is_active, warehouse_id=warehouse_id)
        return {
            "items": [warehouse_payload(w) for w in result.items],
            "total": result.total,
        }

    def transfer_destinations(self, *, page, limit) -> dict:
        """Explicit network visibility for transfers: active labels only."""
        result = self.repo.list(page=page, limit=limit, is_active=True)
        return {"items": [{"id": w.id, "code": w.code, "name": w.name} for w in result.items], "total": result.total}

    def get(self, warehouse_id: int, *, actor: User | None = None) -> dict:
        require_warehouse_scope(actor, warehouse_id)
        return warehouse_payload(self._get_or_raise(warehouse_id))

    def create(self, payload: WarehouseCreate, *, actor: User) -> dict:
        if actor.role == UserRole.WAREHOUSE_MANAGER:
            raise ForbiddenError("Warehouse managers cannot create warehouses")
        with transaction(self.db):
            data = payload.model_dump()
            if self.repo.exists_by_code(data["code"].strip()):
                raise ConflictError(f"Warehouse code {data['code']!r} already exists")
            warehouse = Warehouse(
                code=data["code"].strip(),
                name=data["name"],
                address=data.get("address"),
            )
            self.repo.add(warehouse)
            self.audit.record(
                user_id=actor.id,
                action="WAREHOUSE.CREATE",
                entity_type="warehouse",
                entity_id=warehouse.id,
                new_value={
                    "id": warehouse.id,
                    "code": warehouse.code,
                    "name": warehouse.name,
                },
            )
            return warehouse_payload(warehouse)

    def update(
        self, warehouse_id: int, payload: WarehouseUpdate, *, actor: User
    ) -> dict:
        require_warehouse_scope(actor, warehouse_id)
        with transaction(self.db):
            warehouse = self._get_or_raise(warehouse_id)
            old_snapshot = {"id": warehouse.id, "code": warehouse.code, "name": warehouse.name, "is_active": warehouse.is_active}
            changes = payload.model_dump(exclude_unset=True)

            if "code" in changes and changes["code"].strip():
                new_code = changes["code"].strip()
                if self.repo.exists_by_code(new_code, exclude_id=warehouse.id):
                    raise ConflictError(
                        f"Warehouse code {new_code!r} already exists"
                    )
                warehouse.code = new_code

            for field in ("name", "address"):
                if field in changes:
                    setattr(warehouse, field, changes[field])
            if "is_active" in changes:
                warehouse.is_active = changes["is_active"]

            self.db.flush()
            self.audit.record(
                user_id=actor.id,
                action="WAREHOUSE.UPDATE",
                entity_type="warehouse",
                entity_id=warehouse.id,
                old_value=old_snapshot,
                new_value={
                    "id": warehouse.id,
                    "code": warehouse.code,
                    "name": warehouse.name,
                    "is_active": warehouse.is_active,
                },
            )
            return warehouse_payload(warehouse)

    def _get_or_raise(self, warehouse_id: int) -> Warehouse:
        warehouse = self.repo.get_by_id(warehouse_id)
        if warehouse is None:
            raise NotFoundError(f"Warehouse {warehouse_id} not found")
        return warehouse