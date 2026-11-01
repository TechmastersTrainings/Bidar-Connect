# Bidar Connect — Project Status & Phase Tracker

Last Updated: 2026-11-01  
Current Phase: Phase 6 (Passenger Portal)  
Current Status: **PHASE 6 COMPLETE — PASSENGER PORTAL, DIGITAL RIDE PASS, SOS EMERGENCY CONTACTS & ANTI-IDOR VERIFIED**

---

## Phase Status Summary

| Phase | Phase Name | Status | Completion Gate Evidence |
| :--- | :--- | :--- | :--- |
| **Phase 0** | Product Discovery & Project Audit | **VERIFIED** | Clean repo verified, toolchains audited, monorepo tree structured (`fcda9c5`) |
| **Phase 1** | Product Requirements & System Design | **VERIFIED** | Complete PRD, Functional Specs, Invariant Rules, Payments, Ledger & Architecture specifications authored (`7415c6e`) |
| **Phase 2** | UI/UX Design & Design System | **VERIFIED** | Strict brand rules enforced, tokens defined, component specs & portal wireframes authored (`8a2470d`) |
| **Phase 3** | Repository & Development Foundation | **VERIFIED** | Backend (Port 8000), Public Web (Port 3000), Passenger Portal (Port 3001) running; Shared packages & CI ready (`bbc475b`) |
| **Phase 4** | Database Architecture & Backend Foundation | **VERIFIED** | 25 PostgreSQL tables, SQLAlchemy 2.x declarative models, Alembic migrations, atomic seat reservation with `with_for_update()`, 13/13 passing automated tests (`4fd0ccc`) |
| **Phase 5** | Authentication & Authorisation | **VERIFIED** | Cryptographic HS256 JWT tokens, phone OTP login/auto-registration, server-enforced RBAC (`require_roles`, `require_verified_driver`, `require_admin`), suspension checks, Next.js AuthContext & AuthModal (`4bc8818`, `c4eb6c0`) |
| **Phase 6** | Passenger Portal | **VERIFIED** | Full search & corridor ride selection (Bidar ⇄ Hyderabad), atomic seat booking, digital ride pass with reference code, My Bookings tabbed history, safety preferences & SOS emergency contacts, 26/26 passing automated tests |
| **Phase 7** | Driver Portal | **NOT STARTED** | Next Phase: Driver KYC upload, vehicle verification, ride publishing, passenger manifests |
| **Phase 8** | Ride Search & Booking Engine | **NOT STARTED** | Requires Phase 7 approval |
| **Phase 9** | Admin Portal | **NOT STARTED** | Requires Phase 8 approval |
| **Phase 10** | Payment, Commission & Payout System | **NOT STARTED** | Requires Phase 9 approval |
| **Phase 11** | Notifications & External Integrations | **NOT STARTED** | Requires Phase 10 approval |
| **Phase 12** | Public Website | **NOT STARTED** | Requires Phase 11 approval |
| **Phase 13** | Mobile Applications | **NOT STARTED** | Requires Phase 12 approval |
| **Phase 14** | Full Security, Legal & Quality Audit | **NOT STARTED** | Requires Phase 13 approval |
| **Phase 15** | Deployment & Production Launch | **NOT STARTED** | Requires Phase 14 approval |
| **Phase 16** | Post-Launch Monitoring & Expansion | **NOT STARTED** | Requires Phase 15 approval |

---

## Detailed Task Tracker (Phase 6 Deliverables)

- [x] **Task 6.1:** Backend Passenger Safety & Profile API (`apps/backend/app/api/v1/passenger.py`):
  - `GET /api/v1/passenger/profile`: Returns passenger preferences, pickup spots, and SOS contacts.
  - `PUT /api/v1/passenger/profile`: Updates preferred pickup landmark and confidential medical safety notes.
  - `POST /api/v1/passenger/emergency-contacts`: Registers emergency safety contacts. Status: `VERIFIED`.
- [x] **Task 6.2:** Enhanced Booking Endpoints (`apps/backend/app/api/v1/bookings.py`):
  - `POST /api/v1/bookings/initiate`: Supports optional/authenticated passenger identity attachment.
  - `GET /api/v1/bookings/my`: Returns passenger's upcoming and completed bookings list.
  - `GET /api/v1/bookings/{id}`: Enforces Anti-IDOR (prohibits Passenger B from viewing Passenger A's ticket pass).
  - `POST /api/v1/bookings/{id}/cancel`: Enforces booking owner check, cancels booking, computes refund, and releases seat inventory. Status: `VERIFIED`.
- [x] **Task 6.3:** Complete Passenger Portal Frontend Experience (`apps/passenger-web/src/app/page.tsx`):
  - Tabbed interface: "Find a Ride", "My Bookings", and "Safety & Profile".
  - Search controls for NH 65 corridor with seat counter and fixed ₹310 pricing indicator.
  - Driver & vehicle cards with verified KYC badges, ratings, and AC/fuel specs.
  - Booking review modal with snapshotted fare breakdown.
  - Digital Ticket Pass modal with reference code, driver call action, and cancellation flow.
  - Full profile editor and emergency contact manager. Status: `VERIFIED`.
- [x] **Task 6.4:** Automated Test Verification (`apps/backend/tests/test_passenger_api.py`):
  - 4 automated tests verifying booking initiation, `/bookings/my` retrieval, Anti-IDOR protection, seat release on cancellation, and emergency contacts.
  - Total test suite: 26/26 tests passing in 1.529s. Status: `VERIFIED`.

---

## Detailed Task Tracker (Phase 5 Deliverables)

- [x] **Task 5.1:** Shared Auth Contracts (`packages/shared-types/src/index.ts`): `UserRole`, `AuthUser`, `AuthTokenResponse`, `RequestOtpPayload`, `VerifyOtpPayload`. Status: `VERIFIED`.
- [x] **Task 5.2:** Backend Security & JWT Infrastructure (`apps/backend/app/core/security.py`): HS256 token generation, signature validation, expiration checking, claims extraction. Status: `VERIFIED`.
- [x] **Task 5.3:** User Repository with Profile Eager-Loading (`apps/backend/app/repositories/user_repository.py`): Phone/email lookup, profile auto-creation, eager-loading relationships to prevent async greenlet errors. Status: `VERIFIED`.
- [x] **Task 5.4:** Server-Enforced RBAC & Security Dependencies (`apps/backend/app/core/dependencies.py`):
  - `get_current_user`: Cryptographic bearer token decoding with `WWW-Authenticate` response on failure.
  - `get_current_active_user`: Enforces account active state and immediate rejection of suspended accounts.
  - `require_roles`: Role enforcement factory preventing privilege escalation (403 Forbidden).
  - `require_verified_driver`: Enforces KYC approval and licence expiration validation.
  - `require_admin`: Restricts administrative endpoints to administrators. Status: `VERIFIED`.
- [x] **Task 5.5:** Authentication API Endpoints (`apps/backend/app/api/v1/auth.py`):
  - `POST /api/v1/auth/otp/request`: Phone OTP dispatch.
  - `POST /api/v1/auth/otp/verify`: OTP verification, account registration, JWT session issuance.
  - `GET /api/v1/auth/me`: User identity and role verification.
  - `POST /api/v1/auth/driver-onboard`: Driver licence submission.
  - `GET /api/v1/auth/admin/users`: Admin-only user directory.
  - `PATCH /api/v1/auth/admin/users/{id}/suspend`: Admin account suspension control. Status: `VERIFIED`.
- [x] **Task 5.6:** Next.js Auth Context & Modal (`apps/passenger-web/src/contexts/AuthContext.tsx` & `AuthModal.tsx`):
  - Client-side auth provider with persistent `localStorage` session.
  - Interactive phone OTP modal with dev OTP auto-fill for testing ease.
  - Header profile display and Sign In/Sign Out triggers. Status: `VERIFIED`.
- [x] **Task 5.7:** Test Suite Verification (`apps/backend/tests/test_auth.py`):
  - 9 automated tests covering token decoding, expiration, tampered signatures, unauthenticated calls, OTP flow, RBAC violations, driver KYC gate, admin privilege, and suspension blocking.
  - Total test suite: 22/22 tests passing in 1.197s. Status: `VERIFIED`.

---

## Detailed Task Tracker (Phase 4 Deliverables)

- [x] **Task 4.1:** Complete Database ERD & Schema Spec (`docs/DATABASE_ERD.md`) covering all 25 tables across 8 core domains. Status: `VERIFIED`.
- [x] **Task 4.2:** Async Database Engine & Session Factory (`apps/backend/app/database/session.py` & `base.py`). Status: `VERIFIED`.
- [x] **Task 4.3:** SQLAlchemy 2.0 Declarative Mapped Models (`apps/backend/app/models/`):
  - Identity & Users: `User`, `DriverProfile`, `PassengerProfile`, `EmergencyContact`
  - Vehicles & Verification: `Vehicle`, `VehicleDocument`, `VehicleImage`
  - Route Catalog & Admin Pricing: `City`, `Route`, `RouteStop`, `RoutePrice`, `CommissionRule`
  - Ride Management: `Ride`, `RideStop`, `RideSeatInventory`
  - Booking & Passengers: `Booking`, `BookingPassenger`, `BookingStatusHistory`
  - Double-Entry Finance: `Payment`, `PaymentAttempt`, `DriverPayout`, `LedgerEntry`
  - Governance & Trust: `Review`, `Report`, `AuditLog`
- [x] **Task 4.4:** Alembic Migration Framework & Initial Schema Script (`migrations/versions/5b3f8364c569_initial_schema.py`). Status: `VERIFIED`.
- [x] **Task 4.5:** Atomic Seat Locking Repository (`apps/backend/app/repositories/booking_repository.py`) enforcing PostgreSQL row-level locks (`with_for_update()`) preventing race conditions and double-booking. Status: `VERIFIED`.
- [x] **Task 4.6:** Admin Pricing & Booking Coordination Services (`apps/backend/app/services/pricing_service.py` & `booking_service.py`). Status: `VERIFIED`.
- [x] **Task 4.7:** Concurrency & Model Test Suites (`apps/backend/tests/test_database_models.py` & `test_concurrency.py`). 13/13 passing tests. Status: `VERIFIED`.

---

## Live Operational Services

- **Public Marketing Website:** `http://localhost:3000`
- **Passenger Booking Portal:** `http://localhost:3001`
- **FastAPI Modular Backend:** `http://localhost:8000` (Interactive API Docs: `http://localhost:8000/docs`)
