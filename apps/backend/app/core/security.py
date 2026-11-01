from datetime import datetime, timedelta, timezone
from typing import Optional, Dict, Any
import jwt
from apps.backend.app.core.config import settings

ALGORITHM = "HS256"
DEFAULT_ACCESS_TOKEN_EXPIRE_MINUTES = 60 * 24 * 7  # 7 days


def get_jwt_secret() -> str:
    """Returns the configured JWT secret key (Supabase secret or platform SECRET_KEY)."""
    if settings.SUPABASE_JWT_SECRET and settings.SUPABASE_JWT_SECRET != "your-supabase-jwt-secret":
        return settings.SUPABASE_JWT_SECRET
    return settings.SECRET_KEY


def create_access_token(
    subject: str,
    claims: Optional[Dict[str, Any]] = None,
    expires_delta: Optional[timedelta] = None,
) -> str:
    """Generates a signed HS256 JWT access token compatible with Supabase Auth schema."""
    now = datetime.now(timezone.utc)
    if expires_delta:
        expire = now + expires_delta
    else:
        expire = now + timedelta(minutes=DEFAULT_ACCESS_TOKEN_EXPIRE_MINUTES)

    payload: Dict[str, Any] = {
        "sub": subject,
        "iat": int(now.timestamp()),
        "exp": int(expire.timestamp()),
        "iss": settings.APP_NAME,
    }
    if claims:
        payload.update(claims)

    return jwt.encode(payload, get_jwt_secret(), algorithm=ALGORITHM)


def decode_access_token(token: str) -> Dict[str, Any]:
    """
    Decodes and validates the cryptographic signature and expiration of a JWT.
    Raises jwt.ExpiredSignatureError if expired.
    Raises jwt.InvalidTokenError on invalid signature or malformed payload.
    """
    secret = get_jwt_secret()
    try:
        payload = jwt.decode(
            token,
            secret,
            algorithms=[ALGORITHM],
            options={"verify_exp": True, "verify_signature": True},
        )
        return payload
    except jwt.InvalidTokenError:
        # Also try settings.SECRET_KEY if SUPABASE_JWT_SECRET was used but token was signed by SECRET_KEY
        if secret != settings.SECRET_KEY:
            return jwt.decode(
                token,
                settings.SECRET_KEY,
                algorithms=[ALGORITHM],
                options={"verify_exp": True, "verify_signature": True},
            )
        raise

