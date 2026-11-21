from contextlib import asynccontextmanager
import asyncio
import time
from fastapi import FastAPI, Request, status
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from fastapi.exceptions import RequestValidationError
from starlette.exceptions import HTTPException as StarletteHTTPException
from starlette.responses import FileResponse
import os

from apps.backend.app.core.config import settings
from apps.backend.app.schemas.common import ApiResponse
from apps.backend.app.api.v1.router import api_v1_router
from apps.backend.app.database.session import engine
from apps.backend.app.database.base import Base
import apps.backend.app.models  # Ensure all 25 models are registered with Base.metadata
from apps.backend.app.services.payout_service import PayoutService


async def automated_payout_worker_loop():
    """
    Automated Background Clearing Worker:
    Evaluates pending driver payout requests every 5 seconds.
    If 5-minute safety hold window has elapsed without dispute,
    automatically disburses net earnings to driver's bank account via IMPS.
    """
    while True:
        try:
            await asyncio.sleep(5)
            PayoutService.process_automated_payouts()
        except asyncio.CancelledError:
            break
        except Exception:
            pass


@asynccontextmanager
async def lifespan(app: FastAPI):
    # Initialize database tables on startup in development mode
    if "sqlite" in settings.DATABASE_URL:
        async with engine.begin() as conn:
            await conn.run_sync(Base.metadata.create_all)

    worker_task = asyncio.create_task(automated_payout_worker_loop())
    try:
        yield
    finally:
        worker_task.cancel()
        try:
            await worker_task
        except asyncio.CancelledError:
            pass


app = FastAPI(
    title=settings.APP_NAME,
    version="1.0.0",
    description="Bidar Connect — Central Intercity Carpooling API (Bidar ⇄ Hyderabad)",
    docs_url="/docs",
    redoc_url="/redoc",
    openapi_url="/api/v1/openapi.json",
    lifespan=lifespan,
)

# CORS Middleware - permits all local and network mobile/web clients, including Android WebView null origin
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origins + ["null", "*"],
    allow_origin_regex=r".*",
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# Security Headers Middleware (OWASP Recommendation)
@app.middleware("http")
async def add_security_headers(request: Request, call_next):
    response = await call_next(request)
    response.headers["X-Content-Type-Options"] = "nosniff"
    response.headers["X-Frame-Options"] = "DENY"
    response.headers["X-XSS-Protection"] = "1; mode=block"
    response.headers["Strict-Transport-Security"] = "max-age=31536000; includeSubDomains"
    response.headers["Referrer-Policy"] = "strict-origin-when-cross-origin"
    response.headers["Permissions-Policy"] = "geolocation=(self), camera=(), microphone=()"
    return response


# Root level health endpoint
@app.get("/health", response_model=ApiResponse[dict], tags=["Health"])
async def root_health():
    """Root platform health probe for load balancers and orchestrators."""
    return ApiResponse.ok(
        data={
            "status": "healthy",
            "service": "Bidar Connect Modular Backend",
            "environment": settings.ENVIRONMENT,
            "version": "1.0.0",
            "docs": "/docs"
        }
    )


# Standardized HTTP Exception Handler
@app.exception_handler(StarletteHTTPException)
async def http_exception_handler(request: Request, exc: StarletteHTTPException):
    return JSONResponse(
        status_code=exc.status_code,
        content=ApiResponse.fail(
            code=f"HTTP_{exc.status_code}",
            message=str(exc.detail),
            request_id=request.headers.get("x-request-id")
        ).model_dump()
    )


# Standardized Validation Error Handler
@app.exception_handler(RequestValidationError)
async def validation_exception_handler(request: Request, exc: RequestValidationError):
    raw_errors = exc.errors()
    sanitized_errors = []
    for err in raw_errors:
        err_copy = dict(err)
        if "ctx" in err_copy and isinstance(err_copy["ctx"], dict):
            err_copy["ctx"] = {k: str(v) for k, v in err_copy["ctx"].items()}
        sanitized_errors.append(err_copy)

    first_error = sanitized_errors[0] if sanitized_errors else {}
    field = ".".join(str(loc) for loc in first_error.get("loc", []))
    message = first_error.get("msg", "Invalid request parameter")
    return JSONResponse(
        status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
        content=ApiResponse.fail(
            code="VALIDATION_ERROR",
            message=message,
            field=field,
            details={"all_errors": sanitized_errors},
            request_id=request.headers.get("x-request-id")
        ).model_dump()
    )


# Mount versioned API routes
app.include_router(api_v1_router)

# Direct Public APK Download Endpoint (Supports both GET and HEAD for Android download managers)
@app.api_route("/bidar-connect.apk", methods=["GET", "HEAD"], include_in_schema=False)
async def serve_apk():
    from starlette.responses import Response
    apk_candidates = [
        "/tmp/bidar_apk_build/bidar-connect.apk",
        "/tmp/bidar_apps/public-web/public/bidar-connect.apk",
        "/Volumes/SHIV BHALKE/TECHMASTER/TECHII CAR BOOKING SYS/bidar-connect.apk"
    ]
    for p in apk_candidates:
        if os.path.exists(p):
            with open(p, "rb") as f:
                data = f.read()
            return Response(
                content=data,
                media_type="application/vnd.android.package-archive",
                headers={
                    "Content-Disposition": 'attachment; filename="bidar-connect.apk"',
                    "Content-Length": str(len(data)),
                }
            )
    return JSONResponse(status_code=404, content={"error": "APK build not ready"})


if __name__ == "__main__":
    import uvicorn
    uvicorn.run("apps.backend.app.main:app", host="0.0.0.0", port=8000, reload=True)

