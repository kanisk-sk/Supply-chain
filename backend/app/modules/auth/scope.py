"""Object-level warehouse authorization, independent of UI visibility."""
from app.common.exceptions import ForbiddenError
from app.modules.users.models import User, UserRole


def require_warehouse_scope(actor: User | None, warehouse_id: int | None) -> None:
    if actor is not None and actor.role == UserRole.WAREHOUSE_MANAGER:
        if actor.warehouse_id is None or warehouse_id != actor.warehouse_id:
            raise ForbiddenError("Warehouse manager cannot access this warehouse")
