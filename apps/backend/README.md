# Central FastAPI Backend (`apps/backend`)

## Architecture
Modular Monolith architecture hosting all business logic, transactional boundaries, and `/api/v1/` REST endpoints.

## Directory Layout
```
backend/
├── app/
│   ├── api/v1/         # Versioned REST API routers
│   ├── core/           # Configuration, security, logging, dependencies
│   ├── database/       # Async engine, session factories, transaction helpers
│   ├── models/         # SQLAlchemy 2.x declarative entity models
│   ├── schemas/        # Pydantic v2 validation contracts & DTOs
│   ├── services/       # Domain business logic (Booking, Pricing, Commission, Payout)
│   ├── repositories/   # Async database access layer
│   ├── integrations/   # Adapters: Supabase Auth, Cloudinary, Maps, Payments
│   └── modules/        # Domain-scoped modules
├── migrations/         # Alembic database migrations
└── tests/              # Pytest test suites (unit, integration, concurrency)
```

## Technology
- Python 3.14
- FastAPI & Pydantic v2
- SQLAlchemy 2.x & asyncpg
- Alembic
- Redis

