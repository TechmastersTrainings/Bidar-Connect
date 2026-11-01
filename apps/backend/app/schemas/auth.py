from enum import Enum
from typing import Optional, List
from pydantic import BaseModel, Field, field_validator
import re


class UserRole(str, Enum):
    PASSENGER = "PASSENGER"
    DRIVER = "DRIVER"
    ADMIN = "ADMIN"
    SUPER_ADMIN = "SUPER_ADMIN"


class RequestOtpRequest(BaseModel):
    phone: str = Field(..., description="10-digit Indian phone number or E.164 formatted number")

    @field_validator("phone")
    @classmethod
    def validate_phone(cls, v: str) -> str:
        # Strip spaces and hyphens
        cleaned = re.sub(r"[\s\-]", "", v)
        if cleaned.startswith("+91"):
            cleaned = cleaned[3:]
        elif cleaned.startswith("91") and len(cleaned) == 12:
            cleaned = cleaned[2:]
        if not re.match(r"^[6-9]\d{9}$", cleaned):
            raise ValueError("Invalid phone number. Must be a valid 10-digit Indian mobile number.")
        return f"+91{cleaned}"


class VerifyOtpRequest(BaseModel):
    phone: str = Field(..., description="Phone number matching OTP request")
    otp: str = Field(..., min_length=4, max_length=6, description="4 to 6 digit verification code")
    full_name: Optional[str] = Field(None, min_length=2, max_length=100, description="Full legal name for new registrations")

    @field_validator("phone")
    @classmethod
    def validate_phone(cls, v: str) -> str:
        cleaned = re.sub(r"[\s\-]", "", v)
        if cleaned.startswith("+91"):
            cleaned = cleaned[3:]
        elif cleaned.startswith("91") and len(cleaned) == 12:
            cleaned = cleaned[2:]
        if not re.match(r"^[6-9]\d{9}$", cleaned):
            raise ValueError("Invalid phone number.")
        return f"+91{cleaned}"


class AuthUserResponse(BaseModel):
    user_id: str
    phone: str
    email: Optional[str] = None
    full_name: str
    avatar_url: Optional[str] = None
    is_active: bool
    is_driver: bool
    is_passenger: bool
    is_admin: bool
    is_suspended: bool
    driver_verified: bool = False


class AuthTokenResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"
    expires_in: int
    user: AuthUserResponse


class TokenPayload(BaseModel):
    sub: str
    phone: Optional[str] = None
    email: Optional[str] = None
    roles: List[str] = []
    is_driver: bool = False
    is_admin: bool = False
    is_passenger: bool = True
    exp: Optional[int] = None
