import time
from fastapi import FastAPI, Request, status
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from fastapi.exceptions import RequestValidationError
from starlette.exceptions import HTTPException as StarletteHTTPException

from apps.backend.app.core.config import settings
from apps.backend.app.schemas.common import ApiResponse
from apps.backend.app.api.v1.router import api_v1_router

app = FastAPI(
    title=settings.APP_NAME,
    version="1.0.0",
    description="Bidar Connect — Central Intercity Carpooling API (Bidar ⇄ Hyderabad)",
    docs_url="/docs",
    redoc_url="/redoc",
    openapi_url="/api/v1/openapi.json"
)

# CORS Middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


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
    errors = exc.errors()
    first_error = errors[0] if errors else {}
    field = ".".join(str(loc) for loc in first_error.get("loc", []))
    message = first_error.get("msg", "Invalid request parameter")
    return JSONResponse(
        status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
        content=ApiResponse.fail(
            code="VALIDATION_ERROR",
            message=message,
            field=field,
            details={"all_errors": errors},
            request_id=request.headers.get("x-request-id")
        ).model_dump()
    )


# Mount versioned API routes
app.include_router(api_v1_router)

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("apps.backend.app.main:app", host="0.0.0.0", port=8000, reload=True)

