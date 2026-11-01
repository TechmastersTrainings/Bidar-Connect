# Bidar Connect — Architectural & Business Decision Log

| Decision ID | Date | Topic | Decision / Current Stance | Status | Rationale |
| :--- | :--- | :--- | :--- | :--- | :--- |
| **DEC-001** | 2026-11-01 | Architecture Pattern | Modular Monolith (FastAPI + Next.js + RN) | APPROVED | Simplicity, single transactional boundary for booking, no premature microservices. |
| **DEC-002** | 2026-11-01 | Database & ORM | PostgreSQL + SQLAlchemy 2.x + asyncpg | APPROVED | Strong ACID compliance, row-level locking for seat inventory, Alembic migrations. |
| **DEC-003** | 2026-11-01 | Media & Document Storage | Cloudinary with signed backend URLs | APPROVED | Unified media handling; sensitive KYC/RC files served via restricted, signed access. |
| **DEC-004** | 2026-11-01 | Commission Architecture | Dynamic Admin-Configurable Formula | PROPOSED | ₹10–₹20 flat working model; snapshot applied at booking time; open to percentage/tiered rules. |
| **DEC-005** | 2026-11-01 | Payment Model | Central Company Collection | APPROVED | Passengers pay company directly. No driver personal static UPI QRs. Prevents reconciliation failure. |
| **DEC-006** | 2026-11-01 | Driver Payout Timing | Configurable post-trip window | OPEN | 5-minute initial working target, subject to banking provider & anti-fraud safeguards. |
| **DEC-007** | 2026-11-01 | Mobile App Packaging | Single Unified Mobile App vs Two Separate Apps | OPEN | Recommended: Single unified React Native/Expo app with passenger & driver mode switcher. |
| **DEC-008** | 2026-11-01 | Payment Gateway Selection | Razorpay / Cashfree evaluation | OPEN | Evaluation of marketplace split vs manual settlement required in Phase 10. |

