# Bidar Connect — Product Requirements Document (PRD)

**Document Version:** 1.0.0  
**Status:** Approved Baseline  
**Target Corridor:** Bidar ⇄ Hyderabad (NH 65 / Bidar-Humnabad route)  
**Author:** Product & Architecture Team  

---

## 1. Executive Summary & Vision

### 1.1 Problem Statement
Currently, intercity travel between Bidar (Karnataka) and Hyderabad (Telangana) relies heavily on informal, fragmented communication channels (primarily unmoderated WhatsApp and Telegram groups). This informal ecosystem suffers from:
- **Zero Accountability:** Last-minute driver cancellations leave passengers stranded without recourse.
- **Opaque & Inconsistent Pricing:** Variable fares, price gouging during peak demand/festivals, and unpredictable luggage charges.
- **Severe Safety & Verification Deficits:** Passengers enter unverified vehicles with unvetted drivers; women commuters and families face heightened anxiety due to lack of identity tracking.
- **Payment & Financial Friction:** Cash or direct unverified UPI transfers cause constant payment disputes, non-payment, and fraud claims.
- **Zero Legal & Operational Transparency:** Informal operators risk friction with regional transport regulations (RTO), and drivers have no guaranteed cost-recovery mechanism.

### 1.2 Product Vision
**Bidar Connect** is an organized, trustworthy digital intercity carpooling and ride-sharing platform that connects drivers travelling between Bidar and Hyderabad with passengers heading the same way. By formalizing booking, enforcing admin-controlled fixed pricing, verifying identities, providing live journey safety, and automating financial clearing, Bidar Connect delivers an affordable, safe, and dignified intercity transit experience.

### 1.3 Key Ecosystem Stakeholders
1. **Passengers:** Daily/weekly commuters, IT professionals, university students, and medical travelers seeking punctual, verified, and comfortable transport.
2. **Drivers (Vehicle Owners):** Private car owners travelling between Bidar and Hyderabad who wish to share journey costs (fuel, tolls, vehicle maintenance) within legal non-commercial cost-sharing limits.
3. **Platform Operations & Administrators:** System operators enforcing route safety, managing pricing rules, auditing KYC/documents, handling reconciliations, and resolving disputes.

---

## 2. Core Business Invariants & Principles

1. **Centralized Admin Pricing (No Driver Surge/Bargaining):** Drivers have zero permission to modify the fare per seat. All prices are calculated deterministically by admin-configured route/stop pricing.
2. **Instant Seat Reservation (No Driver Cherry-Picking):** Seat reservations are confirmed immediately upon successful checkout. Drivers cannot reject already confirmed bookings.
3. **Centralized Financial Custody:** All passenger payments flow directly to the company. The company retains its configured commission and disburses the remainder to the driver post-completion. Drivers are never allowed to show personal static UPI QR codes to passengers.
4. **Single Unified Account Identity:** A user registers once with phone OTP and can seamlessly act as both a passenger and a driver under one identity.
5. **Open Registration vs. Operational Eligibility:** Any user can register without administrative delay. However, offering a ride requires vehicle registration, document upload (RC, Insurance, PUC, Driving Licence), and system eligibility checks.
6. **Immutable Financial Traceability:** Every financial movement is recorded in a double-entry ledger. No financial record can be updated in-place or deleted.

---

## 3. Product Ecosystem & Component Scope

Bidar Connect consists of five distinct interfaces powered by a single central backend and database:

```
                                  ┌───────────────────────────┐
                                  │   FastAPI Modular Monolith │
                                  │        (/api/v1/)         │
                                  └─────────────┬─────────────┘
                                                │
         ┌──────────────────┬───────────────────┼───────────────────┬──────────────────┐
         ▼                  ▼                   ▼                   ▼                  ▼
┌─────────────────┐ ┌───────────────┐ ┌───────────────────┐ ┌───────────────┐ ┌────────────────┐
│   Component 1   │ │  Component 2  │ │    Component 3    │ │  Component 4  │ │  Component 5   │
│   Public Web    │ │Passenger Web  │ │    Driver Web     │ │   Admin Web   │ │  Mobile Apps   │
│  Marketing/SEO  │ │Booking Engine │ │Rides & Fleet Mgmt │ │Financial & Ops│ │React Native/Expo│
└─────────────────┘ └───────────────┘ └───────────────────┘ └───────────────┘ └────────────────┘
```

### 3.1 Component 1: Public Website (`apps/public-web`)
- **Mission:** Brand authority, user education, high-conversion ride discovery funnels, SEO, and regulatory compliance.
- **Pages & Modules:**
  - Homepage with instant origin/destination search widget.
  - Route Information: Bidar ⇄ Hyderabad (stopping points: Humnabad, Zaheerabad, Sangareddy, Miyapur, Gachibowli, Secunderabad).
  - How It Works (separate tabs for Passengers and Car Owners).
  - Safety & Verification Standards (ID checks, emergency contacts, community rules).
  - Real, transparent Pricing explanations (no hidden platform fees).
  - Legal: Privacy Policy, Terms of Service, Refund & Cancellation Policy, Cookie Policy.
  - Contact & Grievance Support form with direct ticketing integration.

### 3.2 Component 2: Passenger Portal (`apps/passenger-web`)
- **Mission:** Streamlined ride discovery, instant seat booking, journey safety, and booking management.
- **Core Modules:**
  - Phone OTP Authentication & Profile setup (emergency contacts, medical notes).
  - Search Engine: Filters for date, time window, pickup/drop landmarks, luggage allowance, vehicle type.
  - Ride Results: Comprehensive driver cards showing vehicle photo, color, registration number, rating, available seats, exact departure time, and fixed fare.
  - Checkout & Instant Reservation: Real-time seat inventory hold, payment execution, and digital ticket with QR code.
  - Active Journey Tracking: Driver live location sharing, emergency SOS contact trigger, share journey link with family.
  - Booking History: Downloadable GST-compliant receipts, cancellation request with automated refund calculation.
  - Post-Trip Experience: Driver review (1-5 stars with structured tags) and complaint reporting.

### 3.3 Component 3: Driver Portal (`apps/driver-web`)
- **Mission:** Vehicle onboarding, ride publishing, journey status lifecycle management, and earnings transparency.
- **Core Modules:**
  - Multi-Vehicle Fleet Management: Vehicle make, model, registration number, fuel type, seating capacity, exterior & interior photos.
  - Document Upload & Validity: Driving licence, RC book, vehicle insurance policy, PUC certificate. Automatic expiry warnings.
  - Ride Publishing Wizard: Origin, destination, intermediate stop selection, travel date, departure time, vehicle selection, seat count. Automatic fare calculation from admin tables.
  - Passenger Manifest: Live list of confirmed passengers, pickup point details, mask-protected contact access.
  - Journey Execution State Machine: `Scheduled` → `Driver En Route` → `Trip Started` → `Arrived` → `Trip Completed`.
  - Earnings & Payouts: Detailed ride settlement breakdown (Gross Fare - Platform Commission = Driver Payable), payout status, payout bank/UPI configuration.

### 3.4 Component 4: Admin Portal (`apps/admin-web`)
- **Mission:** Complete platform governance, route management, pricing configuration, financial reconciliation, and safety auditing.
- **Core Modules:**
  - Executive Overview: Real-time GMV, Net Platform Commission, Active Rides, Open Disputes, Pending Payouts.
  - User & Driver Governance: User profile search, suspension/ban controls, activity audit trail.
  - Vehicle & Document Verification: Document inspection queue for driving licences, RC books, and insurance; eligibility toggle.
  - Route & Stop Manager: Definition of city nodes, intermediate highway waypoints, geofenced pickup/drop zones.
  - Pricing & Commission Engine: Per-seat pricing matrix for route segments; versioned commission policies (flat ₹10–₹20/seat or percentage).
  - Financial Ledger & Payout Approval: Gateway webhook reconciliation, payout queue review, dispute refund processing, exportable financial reports.
  - Support & Incident Desk: Ticket triage, safety incidents, lost-and-found claims.

### 3.5 Component 5: Mobile Applications (`apps/mobile`)
- **Mission:** Native on-the-go experience for both passengers and drivers using React Native & Expo.
- **Unified Mobile Architecture:** Single codebase supporting fluid switching between Passenger and Driver modes.
- **Native Capabilities:** Push notifications (FCM) for booking confirmations, trip reminders, and arrival alerts; GPS background location for live trip tracking; offline ticket access.

---

## 4. Key Performance Indicators (KPIs) & Target Metrics

| Metric | Target (First 90 Days) | Measurement Method |
| :--- | :--- | :--- |
| **Gross Booking Value (GBV)** | Tracked daily in INR | Total payments successfully captured |
| **Net Commission Revenue** | Tracked daily in INR | Platform fee retained after payment fees |
| **Seat Fill Rate** | > 70% on published rides | Booked seats / Total published seats |
| **Overbooking Incident Rate** | **0.00%** (Strict Zero Tolerance) | Concurrency test logs and database constraints |
| **Payout Latency** | < 15 minutes post-ride completion | Time delta between trip completion and payout webhook confirmation |
| **Dispute Rate** | < 1.5% of total bookings | Support tickets flagged as disputes / Total completed rides |
| **Driver Cancellation Rate** | < 2.0% of published rides | Cancelled rides initiated by drivers / Total published rides |

---

## 5. System Quality Attributes & Guardrails

1. **Concurrency & Correctness:** Under no circumstances may two passengers book the same seat simultaneously. PostgreSQL row locks (`SELECT ... FOR UPDATE`) are mandatory.
2. **Security & Data Privacy:** All identity and vehicle documents stored in Cloudinary must use signed, time-bounded delivery. No unauthenticated public links are ever emitted for KYC records.
3. **High Availability:** 99.9% uptime target for passenger search and booking workflows.
4. **Auditability:** Every administrative modification (price change, account suspension, refund issuance) creates an immutable `audit_logs` record.
