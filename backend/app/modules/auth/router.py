"""Authentication endpoints: login and current-user introspection.

Login is unauthenticated; ``/me`` requires a valid bearer token and is resolved
by the central ``get_current_user`` dependency.
"""

from __future__ import annotations

from fastapi import APIRouter, Depends

from app.common.responses import build_success_response
from app.core.database import get_db
from app.modules.auth.dependencies import get_current_user
from app.modules.auth.schemas import LoginRequest, TokenResponse
from app.modules.auth.service import AuthService
from app.modules.users.models import User
from app.modules.users.schemas import public_user_payload
from app.modules.auth.profile import ProfileUpdate, PasswordUpdate, profile_payload, update_profile, update_password

router = APIRouter(prefix="/auth", tags=["auth"])


@router.post("/login", summary="Authenticate and receive an access token")
def login(payload: LoginRequest, db=Depends(get_db)) -> dict:
    auth = AuthService(db)
    user = auth.authenticate(payload.email, payload.password)
    token = auth.issue_token(user)
    return build_success_response(
        TokenResponse(access_token=token).model_dump(mode="json"),
        message="Login successful",
    )


@router.get("/me", summary="Current authenticated user")
def me(current_user: User = Depends(get_current_user)) -> dict:
    return build_success_response(
        profile_payload(current_user),
        message="Current user",
    )


@router.patch("/me", summary="Update your own profile")
def edit_profile(payload: ProfileUpdate, user: User = Depends(get_current_user), db=Depends(get_db)):
    return build_success_response(update_profile(db, user, payload), message="Profile saved")


@router.post("/me/password", summary="Change your own password")
def change_password(payload: PasswordUpdate, user: User = Depends(get_current_user), db=Depends(get_db)):
    update_password(db, user, payload)
    return build_success_response(None, message="Password changed")
