# Bidar Connect

> Intercity Carpooling and Ride-Sharing Platform (Initial Route: Bidar ⇄ Hyderabad)

Bidar Connect transforms informal WhatsApp-based intercity ride-sharing into an organised, transparent, secure digital platform.

---

## Ecosystem Architecture

A Modular Monolith architecture sharing a single FastAPI backend and single PostgreSQL database across five interfaces:

```
bidar-connect/
├── apps/
│   ├── public-web/         # Next.js: Marketing, discovery, safety, routes, legal
│   ├── passenger-web/      # Next.js: Passenger booking, journey tracking, receipts
│   ├── driver-web/         # Next.js: Driver fleet, ride publishing, earnings
│   ├── admin-web/          # Next.js: Central control, pricing, reconciliations, audit
│   ├── mobile/             # React Native / Expo: Mobile client
│   │   ├── passenger/      # Passenger native workflows
│   │   └── driver/         # Driver native workflows
│   └── backend/            # Python / FastAPI: Core business logic & REST APIs (/api/v1/)
│       ├── app/
│       │   ├── api/v1/     # REST endpoints
│       │   ├── core/       # Config, security, dependencies
│       │   ├── database/   # Session management, engine setup
│       │   ├── models/     # SQLAlchemy 2.x declarative models
│       │   ├── schemas/    # Pydantic v2 validation contracts
│       │   ├── services/   # Business logic & transaction boundaries
│       │   ├── repositories/# Data access layer
│       │   ├── integrations/# External service clients (Cloudinary, Supabase, Maps)
│       │   └── modules/    # Domain-bounded modular services
│       ├── migrations/     # Alembic schema versions
│       └── tests/          # Pytest backend test suite
├── packages/
│   ├── shared-types/       # Common TypeScript definitions & schemas
│   ├── api-client/         # Strongly typed HTTP client for frontend & mobile
│   ├── validation/         # Shared form & input validators
│   └── design-system/      # Design tokens, clean UI components (Lucide React)
├── infrastructure/         # Deployment manifests & Docker configurations
└── docs/                   # Complete architectural, product, & security documentation
```

---

## Fixed Technology Stack

- **Frontend & Web Portals:** Next.js, React, TypeScript, Tailwind CSS, Lucide React
- **Mobile Apps:** React Native, Expo, TypeScript
- **Backend API:** Python, FastAPI, Pydantic v2 (REST API prefix `/api/v1/`)
- **Database & ORM:** PostgreSQL, SQLAlchemy 2.x, Alembic, asyncpg
- **Authentication:** Supabase Auth + Phone OTP (Server-side enforced RBAC)
- **Object Storage:** Cloudinary (Signed upload parameters, restricted document access)
- **Caching & Coordination:** Redis (Caching, rate-limiting, OTP throttling)

---

## Development & Phase Governance

Bidar Connect follows a strict 17-phase gated lifecycle (**Phase 0 to Phase 16**). No phase is bypassed. All progress, decisions, and verification proofs are documented under `docs/`.
