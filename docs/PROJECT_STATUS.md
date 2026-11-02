# Bidar Connect — Project Status & Phase Tracker

Last Updated: 2026-11-02  
Current Phase: Phase 8 (Ride Search & Booking Engine)  
Current Status: **PHASE 8 COMPLETE — MULTI-CRITERIA SEARCH ENGINE, 10-MINUTE SEAT HOLD RESERVATIONS, TIERED REFUND CALCULATOR & IDEMPOTENCY VERIFIED**

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
| **Phase 7** | Driver Portal | **VERIFIED** | Driver KYC onboarding, vehicle fleet management, ride publishing with fixed ₹310 pricing invariant, live passenger manifests with one-click call, trip lifecycle state transitions, direct payout configuration, 33/33 passing automated tests (`1f53523`) |
| **Phase 8** | Ride Search & Booking Engine | **VERIFIED** | Multi-criteria search filters (time windows, fuel types, waypoints, sorting), atomic 10-minute seat holds with Idempotency-Key, automated hold expiry reaper, tiered cancellation refund engine (Rule BR-REF-01), 100% driver cancellation refunds (Rule BR-REF-02), 38/38 passing automated tests |
| **Phase 9** | Admin Portal | **NOT STARTED** | Next Phase: Admin oversight, driver KYC approvals, price controls & audit review |
| **Phase 10** | Payment, Commission & Payout System | **NOT STARTED** | Requires Phase 9 approval |
| **Phase 11** | Notifications & External Integrations | **NOT STARTED** | Requires Phase 10 approval |
| **Phase 12** | Public Website | **NOT STARTED** | Requires Phase 11 approval |
| **Phase 13** | Mobile Applications | **NOT STARTED** | Requires Phase 12 approval |
| **Phase 14** | Full Security, Legal & Quality Audit | **NOT STARTED** | Requires Phase 13 approval |
| **Phase 15** | Deployment & Production Launch | **NOT STARTED** | Requires Phase 14 approval |
| **Phase 16** | Post-Launch Monitoring & Expansion | **NOT STARTED** | Requires Phase 15 approval |

---

## Detailed Task Tracker (Phase 8 Deliverables)

- [x] **Task 8.1:** Shared Search & Booking Contracts (`packages/shared-types/src/index.ts`):
  - Added `TimeWindow`, `SortByOption`, `ExtendedRideSearchParams`, `HoldSeatPayload`, `HoldSeatResponse`, `CancellationQuoteResponse`. Status: `VERIFIED`.
- [x] **Task 8.2:** Advanced Multi-Criteria Search Engine (`apps/backend/app/api/v1/rides.py`):
  - Implemented multi-criteria search filtering on `/api/v1/rides/search`:
    - Travel date filter (`YYYY-MM-DD`).
    - Departure time window buckets (`MORNING`: 05:00-11:59, `AFTERNOON`: 12:00-16:59, `EVENING`: 17:00-23:59).
    - Vehicle fuel type filter (`EV`, `DIESEL`, `CNG`, `PETROL`).
    - Intermediate waypoint matching along NH 65 corridor (`Humnabad`, `Zaheerabad`, `Sangareddy`, `Miyapur`, `DLF`, `Kukatpally`).
    - Dynamic sorting (`departure_asc`, `rating_desc`, `price_asc`). Status: `VERIFIED`.
- [x] **Task 8.3:** Concurrency-Safe 10-Minute Seat Hold Engine (`apps/backend/app/api/v1/bookings.py`):
  - `POST /api/v1/bookings/hold`: Temporarily reserves seats with atomic inventory decrement. Supports `Idempotency-Key` preventing duplicate holds.
  - `GET /api/v1/bookings/hold/{hold_id}`: Real-time countdown status check with automated expiration trigger.
  - `POST /api/v1/bookings/hold/{hold_id}/confirm`: Finalizes checkout, converting hold into confirmed digital boarding pass.
  - `POST /api/v1/bookings/cleanup-expired`: Automated reaper releasing expired holds back to available corridor seats. Status: `VERIFIED`.
- [x] **Task 8.4:** Tiered Cancellation & Refund Engine (`apps/backend/app/api/v1/bookings.py` & `driver.py`):
  - `GET /api/v1/bookings/{id}/cancellation-quote`: Evaluates Rule `BR-REF-01` before cancellation:
    - $>2$ hours before departure: 100% full refund (`FULL_REFUND`).
    - $\le 2$ hours before departure: 50% partial refund (`PARTIAL_REFUND`, 50% late fee to driver).
    - Post-departure: 0% refund (`NO_REFUND`).
  - `POST /api/v1/bookings/{id}/cancel`: Executes passenger cancellation, restores seat inventory, and applies tiered refund policy.
  - `POST /api/v1/driver/rides/{id}/cancel`: Driver ride cancellation (Rule `BR-REF-02`) triggering 100% automatic full refunds to all confirmed passengers. Status: `VERIFIED`.
- [x] **Task 8.5:** Frontend Multi-Criteria & Hold UI (`apps/passenger-web/src/app/page.tsx`):
  - Time window filter pills ("All Times", "Morning", "Afternoon", "Evening").
  - Fuel type filter pills ("All", "EV", "Diesel", "CNG", "Petrol").
  - Sort selector dropdown with immediate client reactivity.
  - 10-Minute Hold Modal with live MM:SS second-by-second countdown timer.
  - Tiered Cancellation Quote Modal displaying refund breakdown before confirming.
  - 100% Lucide React icons, zero emojis. Status: `VERIFIED`.
- [x] **Task 8.6:** Automated Test Verification (`apps/backend/tests/test_search_booking_engine.py`):
  - 5 comprehensive automated tests covering search filtering, seat hold countdown, hold cleanup, tiered cancellation refund calculation, driver ride cancellation with 100% refund, and idempotency protection.
  - Total test suite: **38/38 tests passing in 1.463s**. Status: `VERIFIED`.

---

## Detailed Task Tracker (Phase 7 Deliverables)

- [x] **Task 7.1:** Shared Driver Contracts (`packages/shared-types/src/index.ts`):
  - Added `DriverKYCStatus`, `RideLifecycleStatus`, `DriverProfileData`, `DriverOnboardPayload`, `PayoutSettingsPayload`, `VehicleRegisterPayload`, `VehicleData`, `PassengerManifestItem`, `RideManifestData`, `DriverRideData`, `DriverEarningsSummary`. Status: `VERIFIED`.
- [x] **Task 7.2:** Backend Driver API & Invariant Enforcement (`apps/backend/app/api/v1/driver.py`):
  - `GET /api/v1/driver/profile`: Retrieves driver profile, ratings, vehicle count, KYC status, and payout details.
  - `POST /api/v1/driver/onboard`: Verifies licence validity (future expiry) and registers driver partner.
  - `PUT /api/v1/driver/payout-settings`: Configures UPI ID or bank account/IFSC for automatic trip clearing.
  - `GET /api/v1/driver/vehicles`: Returns list of registered fleet vehicles.
  - `POST /api/v1/driver/vehicles`: Registers vehicle with fuel type, registration number, and seat capacity. Prevents duplicate registrations with 409 Conflict.
  - `GET /api/v1/driver/rides`: Lists driver's published rides with passenger counts and gross earnings estimates.
  - `POST /api/v1/driver/rides`: Publishes corridor ride between Bidar and Hyderabad with admin-controlled fixed ₹310 fare per seat.
  - `GET /api/v1/driver/rides/{id}/manifest`: Returns live passenger manifest with Anti-IDOR security (prohibits Driver B from viewing Driver A's manifest).
  - `POST /api/v1/driver/rides/{id}/status`: Advances journey lifecycle (`SCHEDULED` -> `EN_ROUTE` -> `TRIP_STARTED` -> `ARRIVED` -> `COMPLETED`, `CANCELLED`). Increments driver completed trip count upon completion.
  - `GET /api/v1/driver/earnings`: Aggregates gross fares, company commission (₹20/seat), net payable balance, and disbursement ledger. Status: `VERIFIED`.
- [x] **Task 7.3:** Driver Web Portal Frontend (`apps/driver-web`):
  - Full Next.js 14 App Router application on Port 3002.
  - Tabs: Overview Dashboard, Publish Ride Wizard, My Rides & Manifests, Fleet & Vehicles, KYC & Licence, and Earnings & Settlements.
  - Live Passenger Manifest modal with click-to-call passenger button and emergency contact display.
  - Journey lifecycle transition stepper (`Scheduled` -> `Driver En Route` -> `Trip Started` -> `Completed`).
  - AuthModal with dedicated "Partner Registration" and "Driver Sign In" tabs, test OTP auto-fill (Universal code: 123456).
  - Harmonized brand aesthetic: Royal Blue (`#2563EB`) and Slate Navy (`#0F172A`) palette, zero emojis, 100% Lucide React icons. Status: `VERIFIED`.
- [x] **Task 7.4:** Automated Test Verification (`apps/backend/tests/test_driver_api.py`):
  - 7 comprehensive automated tests covering driver onboarding, expired licence rejection, payout settings, vehicle fleet registration, duplicate prevention, fixed fare snapshot invariant, passenger manifest Anti-IDOR, journey status lifecycle, and earnings aggregation.
  - Total test suite: **33/33 tests passing in 1.338s**. Status: `VERIFIED`.

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
