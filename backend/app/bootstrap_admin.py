"""Provision the first administrator without demo accounts or CLI passwords."""
from __future__ import annotations
import argparse
from getpass import getpass
from app.core.database import SessionLocal
from app.core.security import hash_password
from app.common.transactions import transaction
from app.modules.users.models import User, UserRole
from app.modules.warehouses.models import Warehouse  # Register User.warehouse for standalone CLI use.
from app.modules.users.repositories import UserRepository
from app.modules.users.schemas import UserCreate, public_user_payload
from app.modules.audit_logs.service import AuditLogService


def provision(db, payload: UserCreate) -> User:
    with transaction(db):
        repo = UserRepository(db)
        if repo.list(page=1, limit=1, role=UserRole.ADMIN, is_active=True).total:
            raise ValueError('An active administrator already exists; use User management.')
        if repo.exists_by_email(str(payload.email)):
            raise ValueError('Email is already registered.')
        user = User(name=payload.name, email=str(payload.email), password_hash=hash_password(payload.password), role=UserRole.ADMIN, is_active=True)
        repo.add(user)
        AuditLogService(db).record(user_id=user.id, action='USER.CREATE', entity_type='user', entity_id=user.id, new_value=public_user_payload(user))
        return user


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--email', required=True)
    parser.add_argument('--name', required=True)
    args = parser.parse_args()
    password = getpass('Administrator password: ')
    if password != getpass('Confirm password: '):
        raise SystemExit('Passwords do not match.')
    try:
        payload = UserCreate(name=args.name, email=args.email, password=password, role=UserRole.ADMIN)
        with SessionLocal() as db:
            user = provision(db, payload)
            print(f'Administrator created (ID {user.id}).')
    except ValueError:
        raise SystemExit('Provisioning refused: check input requirements or existing administrator/email.') from None

if __name__ == '__main__':
    main()
