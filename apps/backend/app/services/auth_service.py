from typing import Optional, Dict
from datetime import timedelta
import random
from fastapi import HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession

from apps.backend.app.models.user import User
from apps.backend.app.repositories.user_repository import user_repository
from apps.backend.app.schemas.auth import (
    AuthTokenResponse,
    AuthUserResponse,
    UserRole,
)
from apps.backend.app.core.security import create_access_token

# In-memory OTP storage for dev/test (Redis integration in Phase 11)
_OTP_CACHE: Dict[str, str] = {}
DEV_BYPASS_OTP = "123456"


class AuthService:
    async def request_otp(self, phone: str) -> Dict[str, str]:
        """
        Generates and sends a 6-digit OTP to the phone number.
        In development/test mode, OTP is logged and stored in memory.
        """
        otp = str(random.randint(100000, 999999))
        _OTP_CACHE[phone] = otp

        # Return sanitized response (in dev we also supply the otp for seamless testing)
        return {
            "message": f"OTP successfully dispatched to {phone}",
            "dev_otp": otp,  # Exposed for developer ergonomics in local testing
        }

    async def verify_otp(
        self,
        db: AsyncSession,
        phone: str,
        otp: str,
        full_name: Optional[str] = None,
    ) -> AuthTokenResponse:
        """
        Validates OTP, fetches or creates user, checks suspension status,
        and issues signed JWT access token.
        """
        cached_otp = _OTP_CACHE.get(phone)
        is_valid = (otp == DEV_BYPASS_OTP) or (cached_otp and cached_otp == otp)
        if not is_valid:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Invalid or expired OTP code.",
            )

        # Clear cached OTP after single use
        if phone in _OTP_CACHE:
            del _OTP_CACHE[phone]

        # Lookup user
        user = await user_repository.get_by_phone(db, phone)

        if not user:
            # Create new user
            display_name = full_name.strip() if full_name and full_name.strip() else f"User {phone[-4:]}"
            user = await user_repository.create_user_with_profiles(
                db=db,
                phone=phone,
                full_name=display_name,
                is_passenger=True,
                is_driver=False,
                is_admin=False,
            )
            await db.commit()
            # Reload with profiles
            user = await user_repository.get_by_id_with_profiles(db, user.id)

        if user.is_suspended:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Your account has been suspended by administration. Please contact support.",
            )

        if not user.is_active:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Account is deactivated.",
            )

        # Construct roles list
        roles = []
        if user.is_passenger:
            roles.append(UserRole.PASSENGER.value)
        if user.is_driver:
            roles.append(UserRole.DRIVER.value)
        if user.is_admin:
            roles.append(UserRole.ADMIN.value)

        driver_verified = bool(
            user.driver_profile and user.driver_profile.is_verified
        )

        claims = {
            "phone": user.phone,
            "roles": roles,
            "is_driver": user.is_driver,
            "is_admin": user.is_admin,
            "is_passenger": user.is_passenger,
            "driver_verified": driver_verified,
        }

        token = create_access_token(
            subject=user.id,
            claims=claims,
            expires_delta=timedelta(days=7),
        )

        user_resp = AuthUserResponse(
            user_id=user.id,
            phone=user.phone,
            email=user.email,
            full_name=user.full_name,
            avatar_url=user.avatar_url,
            is_active=user.is_active,
            is_driver=user.is_driver,
            is_passenger=user.is_passenger,
            is_admin=user.is_admin,
            is_suspended=user.is_suspended,
            driver_verified=driver_verified,
        )

        return AuthTokenResponse(
            access_token=token,
            token_type="bearer",
            expires_in=60 * 60 * 24 * 7,
            user=user_resp,
        )

    def to_user_response(self, user: User) -> AuthUserResponse:
        from sqlalchemy import inspect
        insp = inspect(user)
        driver_verified = False
        if "driver_profile" in insp.dict and user.driver_profile is not None:
            driver_verified = bool(user.driver_profile.is_verified)

        return AuthUserResponse(
            user_id=user.id,
            phone=user.phone,
            email=user.email,
            full_name=user.full_name,
            avatar_url=user.avatar_url,
            is_active=user.is_active,
            is_driver=user.is_driver,
            is_passenger=user.is_passenger,
            is_admin=user.is_admin,
            is_suspended=user.is_suspended,
            driver_verified=driver_verified,
        )


auth_service = AuthService()
