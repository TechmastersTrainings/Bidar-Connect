# Bidar Connect — Invariant Business Rules Engine

**Document Version:** 1.0.0  
**Status:** Approved Non-Negotiable Invariants  
**Enforcement:** Backend Database Constraints, Transactions, and Domain Services

---

## 1. User Identity & Account Governance Rules

### BR-USR-01: Single Identity Dual-Role Rule
- Every person registers under a single master account in the `users` table.
- A user may seamlessly operate as a **Passenger** (booking seats) and a **Driver** (publishing rides with their registered vehicle) without creating multiple logins or switching accounts.
- Profile roles are represented as capabilities/claims (`is_passenger: true`, `is_driver: true`, `is_admin: false`).

### BR-USR-02: Open Registration vs. Administrative Approval
- **Open Registration:** Any user with a valid Indian phone number can register via OTP and immediately access passenger booking functions. There is **no administrative pre-approval prerequisite** for creating an account.
- **Verification Distinction:** Successful phone OTP verification proves possession and ownership of the mobile number; it does **not** constitute official administrative background approval.
- **Administrative Suspension:** Administrators possess authority to restrict, suspend, or ban accounts post-facto for proven safety breaches, fraudulent disputes, or abusive conduct.

### BR-USR-03: Operational Driving Eligibility
- Account registration does not automatically grant ride publishing privileges.
- A user can publish rides only when:
  1. Profile contains full legal name and verified phone number.
  2. Driving Licence is uploaded, unexpired, and verified.
  3. At least one vehicle is registered with valid, unexpired RC, Insurance, and PUC documents.
- If a driver's insurance or licence expires, ride publishing is disabled automatically by the system; however, the user's ability to travel as a passenger remains unaffected.

---

## 2. Pricing & Commission Invariant Rules

### BR-PRC-01: Absolute Administrative Pricing Monopoly
- **Rule:** The driver has **zero authority** to set, discount, or negotiate seat fares.
- All fares are computed deterministically from the central `route_prices` table maintained exclusively by platform administrators.
- If an admin updates a route price, the updated price applies strictly to new ride searches and bookings initiated after the effective timestamp.

### BR-PRC-02: Fare & Commission Snapshotting Rule
- At the exact moment a booking reservation is created:
  1. The applicable **Seat Fare** is snapshotted into `bookings.fare_per_seat`.
  2. The applicable **Total Fare** is snapshotted into `bookings.total_fare`.
  3. The active **Commission Rule ID** and **Commission Amount** are snapshotted into `bookings.commission_amount`.
- **Invariant:** Subsequent modifications to platform pricing or commission schedules will **never** alter existing bookings, payments, or payout commitments.

### BR-PRC-03: Commission Calculation Formula
- The platform retains a configurable commission $C$ per booking:
  $$\text{Net Driver Payable} = \text{Gross Booking Fare} - C$$
- Default baseline working model:
  - Seat fare (Bidar ⇄ Hyderabad): ₹310
  - For 2 seats booked:
    $$\text{Gross Fare} = 2 \times ₹310 = ₹620$$
    $$\text{Company Commission} = 2 \times ₹10 = ₹20$$
    $$\text{Driver Payable} = ₹620 - ₹20 = ₹600$$
- The commission rule engine supports flat per-seat models, percentage models, or tiered segment models through configuration, without requiring code rewrites.

---

## 3. Ride Publishing & Capacity Rules

### BR-PUB-01: Driver Publishing Constraints
- Drivers can publish rides only for registered vehicles linked to their user profile.
- Published available seats cannot exceed the vehicle's legal passenger capacity (maximum 6 passenger seats for personal cars; standard is 3 to 4 seats).
- A driver cannot publish two overlapping rides where scheduled departure times conflict within a 4-hour window for the same vehicle or driver.

### BR-PUB-02: Mandatory Route Waypoints
- Every published ride must define:
  1. Exact departure location landmark (origin).
  2. Intermediate highway stops where the driver is willing to halt.
  3. Exact drop-off location landmark (destination).
  4. Scheduled departure date and time (must be at least 30 minutes in the future).

---

## 4. Seat Reservation & Anti-Overbooking Invariants

### BR-BKG-01: Atomic Seat Reservation & Concurrency Lock
- Seat reservations must occur inside an atomic database transaction with row-level locking:
  ```sql
  SELECT available_seats 
  FROM ride_seat_inventory 
  WHERE ride_id = :ride_id 
  FOR UPDATE;
  ```
- If available seats are $\ge$ requested seats:
  - Inventory is immediately decremented: `available_seats = available_seats - :requested_seats`.
  - A provisional booking record is inserted with status `PENDING_PAYMENT`.
  - A 10-minute payment timer is initiated.
- If available seats are $<$ requested seats:
  - Transaction rolls back immediately with error code `SEAT_INSUFFICIENT`.
- Overbooking under any concurrent load is mathematically impossible under this database invariant.

### BR-BKG-02: Instant Confirmation Invariant
- Once payment is successfully captured by the gateway within the 10-minute hold:
  - Booking transitions to `CONFIRMED`.
  - Driver cannot reject, unassign, or refuse confirmed passengers.
  - Driver receives an instant push/SMS alert displaying passenger details and pickup landmark.

### BR-BKG-03: Idempotency Enforcement
- All booking creation API calls must provide an `Idempotency-Key` HTTP header.
- If a client retries a request due to a network glitch with the same idempotency key, the backend returns the existing booking record without creating a duplicate charge or decrementing additional seats.

### BR-BKG-04: Seat Release on Expiry or Cancellation
- If a passenger fails to complete payment within the 10-minute provisional window, a background worker or database check automatically expires the booking (`EXPIRED`) and increments `ride_seat_inventory.available_seats`.
- If a confirmed booking is cancelled, reserved seats are immediately returned to available inventory, making them visible to other travelers.

---

## 5. Financial Custody & Verification Invariants

### BR-FIN-01: Centralized Payment Custody (No Personal UPI)
- All passenger payments are made directly to the platform's registered payment gateway account.
- **Prohibition:** Drivers are strictly prohibited from collecting cash or presenting personal static UPI QR codes to passengers. Doing so constitutes a breach of platform terms and grounds for immediate account suspension.

### BR-FIN-02: Decoupled State Machine
- Ride status, Booking status, Payment status, and Driver Payout status are maintained as independent state machines:

| Domain | Valid State Transitions |
| :--- | :--- |
| **Ride Status** | `PUBLISHED` → `ACTIVE` → `COMPLETED` / `CANCELLED` |
| **Booking Status** | `PENDING` → `CONFIRMED` → `COMPLETED` / `CANCELLED` / `EXPIRED` |
| **Payment Status** | `INITIATED` → `CAPTURED` → `RECONCILED` / `REFUNDED` / `FAILED` |
| **Payout Status** | `PENDING_ELIGIBILITY` → `QUEUED` → `PROCESSING` → `SETTLED` / `FAILED` |

### BR-FIN-03: Anti-Fraud Payment Proof Rule
- A driver's verbal statement or tap claiming "Passenger has paid" **never** transitions a payment to `CAPTURED`.
- A screenshot of a UPI screen uploaded by a user is treated strictly as unverified dispute evidence.
- **Only** an authentic cryptographic signature verification on a payment gateway webhook or an official bank settlement API payload can mark a payment as `CAPTURED` or `RECONCILED`.

### BR-FIN-04: Driver Payout Settlement Pipeline
1. **Trigger:** Driver taps "Ride Completed" in the Driver Portal at the destination.
2. **Backend Validation:**
   - Validates ride status transition (`ACTIVE` → `COMPLETED`).
   - Verifies all associated bookings have `Payment Status == CAPTURED`.
   - Checks for open critical safety or non-arrival disputes from passengers.
3. **Calculation:** Computes net driver payable balance:
   $$\sum \text{Passenger Fares Captured} - \sum \text{Company Commission}$$
4. **Safety Buffer Delay:** A configurable buffer delay (initial proposal: 5 minutes; configurable up to 2 hours) elapses to allow passengers to report safety emergencies or non-completion.
5. **Disbursement:** System triggers payout to driver's registered bank/UPI account via gateway payout API.
6. **Confirmation:** Driver payout status updates to `SETTLED` **only** upon receiving gateway/bank confirmation webhook.

---

## 6. Cancellation & Refund Policy Rules

### BR-REF-01: Passenger-Initiated Cancellation
- **More than 2 hours before scheduled departure:** 100% refund of fare to original payment method (minus statutory gateway handling fee if applicable).
- **Within 2 hours of scheduled departure:** 50% refund to passenger; remaining 50% retained (credited to driver as late-cancellation inconvenience fee, minus platform commission).
- **After departure time (No-Show):** 0% refund.

### BR-REF-02: Driver-Initiated Cancellation
- **Any time prior to departure:**
  - 100% full refund issued automatically to all confirmed passengers.
  - Passenger notified immediately via high-priority SMS/Push with alternate available rides.
  - Driver account incurs a cancellation penalty strike. Three unexcused cancellations within 30 days trigger automatic 14-day ride publishing suspension.

---

## 7. Data Privacy & Passenger Safety Rules

### BR-SAF-01: Selective Contact Disclosure
- A passenger's phone number and full identity are hidden from public view.
- A driver can view a passenger's contact details **only after** the passenger's booking is confirmed.
- A passenger can view the driver's phone number and complete vehicle plate **only after** booking confirmation.

### BR-SAF-02: Document Security & Signed CDN Access
- Identity papers (Driving Licence, RC, Insurance, PUC) uploaded to Cloudinary must be marked `type: authenticated` or `type: private`.
- No public URL can ever be generated for KYC assets. All administrative viewing requires backend-generated HMAC-signed URLs with a 5-minute time-to-live (TTL).

