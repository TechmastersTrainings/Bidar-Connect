import time
from fastapi import APIRouter
from apps.backend.app.schemas.common import ApiResponse
from apps.backend.app.core.config import settings

router = APIRouter(tags=["Health"])

START_TIME = time.time()


@router.get("/health", response_model=ApiResponse[dict])
async def health_check():
    """System health and operational telemetry."""
    uptime_seconds = round(time.time() - START_TIME, 2)
    return ApiResponse.ok(
        data={
            "status": "healthy",
            "app_name": settings.APP_NAME,
            "environment": settings.ENVIRONMENT,
            "version": "1.0.0",
            "uptime_seconds": uptime_seconds,
            "corridor": "Bidar ⇄ Hyderabad (NH 65)",
        }
    )
