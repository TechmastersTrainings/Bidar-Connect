from typing import Optional, List, Callable
from datetime import date
import jwt
from fastapi import Depends, HTTPException, status, Request
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from sqlalchemy.ext.asyncio import AsyncSession

from apps.backend.app.database.session import get_db_session
from apps.backend.app.models.user import User
from apps.backend.app.repositories.user_repository import user_repository
from apps.backend.app.core.security import decode_access_token
from apps.backend.app.schemas.auth import UserRole

bearer_scheme = HTTPBearer(auto_error=False)


async def get_current_user(
    credentials: Optional[HTTPAuthorizationCredentials] = Depends(bearer_scheme),
    db: AsyncSession = Depends(get_db_session),
) -> User:
    """
    Extracts and cryptographically verifies the Bearer JWT token from HTTP request header.
    Loads user and attached profiles from database.
    """
    if not credentials or not credentials.credentials:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Authentication credentials were not provided. Include 'Authorization: Bearer <token>'.",
            headers={"WWW-Authenticate": "Bearer"},
        )

    token = credentials.credentials
    try:
        payload = decode_access_token(token)
    except jwt.ExpiredSignatureError:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Authentication token has expired. Please re-authenticate.",
            headers={"WWW-Authenticate": "Bearer"},
        )
    except jwt.InvalidTokenError:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid authentication token signature or payload.",
            headers={"WWW-Authenticate": "Bearer"},
        )

    user_id = payload.get("sub")
    if not user_id:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Token subject identifier (sub) missing.",
            headers={"WWW-Authenticate": "Bearer"},
        )

    user = await user_repository.get_by_id_with_profiles(db, user_id)
    if not user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="User associated with this token no longer exists.",
            headers={"WWW-Authenticate": "Bearer"},
        )

    if user.is_suspended:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Account suspended by administration. Access denied.",
        )

    if not user.is_active:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Account is currently inactive.",
        )

    return user


async def get_current_active_user(
    current_user: User = Depends(get_current_user),
) -> User:
    """Ensures user is active and non-suspended."""
    return current_user


def require_roles(*allowed_roles: UserRole) -> Callable:
    """
    Server-enforced Role-Based Access Control (RBAC) dependency factory.
    Verifies that the authenticated user possesses at least one of the required roles.
    """
    async def role_checker(current_user: User = Depends(get_current_active_user)) -> User:
        has_role = False
        for role in allowed_roles:
            if role == UserRole.PASSENGER and current_user.is_passenger:
                has_role = True
                break
            elif role == UserRole.DRIVER and current_user.is_driver:
                has_role = True
                break
            elif role in (UserRole.ADMIN, UserRole.SUPER_ADMIN) and current_user.is_admin:
                has_role = True
                break

        if not has_role:
            allowed_names = [r.value for r in allowed_roles]
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail=f"Access forbidden: requires one of {allowed_names} roles.",
            )
        return current_user

    return role_checker


async def require_verified_driver(
    current_user: User = Depends(require_roles(UserRole.DRIVER)),
) -> User:
    """
    Enforces that driver has completed KYC, been approved by an administrator,
    and holds an unexpired driving licence.
    """
    driver_profile = current_user.driver_profile
    if not driver_profile:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Driver profile not initialized. Submit vehicle & licence documents.",
        )

    if not driver_profile.is_verified:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Driver profile pending verification by Bidar Connect administration.",
        )

    if driver_profile.licence_expiry < date.today():
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Driving licence has expired. Please renew and submit updated credentials.",
        )

    return current_user


async def require_admin(
    current_user: User = Depends(require_roles(UserRole.ADMIN, UserRole.SUPER_ADMIN)),
) -> User:
    """Enforces administrator role."""
    return current_user
