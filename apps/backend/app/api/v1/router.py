from fastapi import APIRouter
from apps.backend.app.api.v1.health import router as health_router
from apps.backend.app.api.v1.auth import router as auth_router
from apps.backend.app.api.v1.passenger import router as passenger_router
from apps.backend.app.api.v1.pricing import router as pricing_router
from apps.backend.app.api.v1.rides import router as rides_router
from apps.backend.app.api.v1.bookings import router as bookings_router

api_v1_router = APIRouter(prefix="/api/v1")

api_v1_router.include_router(health_router)
api_v1_router.include_router(auth_router)
api_v1_router.include_router(passenger_router)
api_v1_router.include_router(pricing_router)
api_v1_router.include_router(rides_router)
api_v1_router.include_router(bookings_router)



