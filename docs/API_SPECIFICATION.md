# Bidar Connect — REST API Specifications (`/api/v1/`)

**Document Version:** 1.0.0  
**Status:** Approved API Contract  
**Base URL:** `https://api.bidarconnect.in/api/v1` (Local: `http://localhost:8000/api/v1`)

---

## 1. Authentication & User Profile (`/auth`, `/users`)

### 1.1 Request Phone OTP
- **Endpoint:** `POST /api/v1/auth/request-otp`
- **Auth:** None (Public)
- **Rate Limit:** 3 requests per 10 minutes per IP/Phone
- **Request Body:**
  ```json
  {
    "phone": "+919876543210"
  }
  ```
- **Response (200 OK):**
  ```json
  {
    "success": true,
    "data": {
      "message": "OTP sent successfully to +919876543210",
      "retry_after_seconds": 60
    },
    "error": null,
    "metadata": { "timestamp": "2026-11-01T16:30:00Z" }
  }
  ```

### 1.2 Verify Phone OTP
- **Endpoint:** `POST /api/v1/auth/verify-otp`
- **Auth:** None (Public)
- **Request Body:**
  ```json
  {
    "phone": "+919876543210",
    "otp": "482910"
  }
  ```
- **Response (200 OK):**
  ```json
  {
    "success": true,
    "data": {
      "access_token": "eyJhbGciOi...",
      "token_type": "Bearer",
      "expires_in": 86400,
      "user": {
        "id": "e2c3a5b8-1f4d-4a9c-8b7a-9e1f2a3b4c5d",
        "phone": "+919876543210",
        "full_name": "Shiva Bhalke",
        "is_driver": true,
        "is_passenger": true
      }
    },
    "error": null,
    "metadata": { "timestamp": "2026-11-01T16:30:05Z" }
  }
  ```

### 1.3 Get Current User Profile
- **Endpoint:** `GET /api/v1/users/me`
- **Auth:** Bearer Token

---

## 2. Vehicles & Document Management (`/vehicles`)

### 2.1 Register Vehicle
- **Endpoint:** `POST /api/v1/vehicles`
- **Auth:** Bearer Token (Driver)
- **Request Body:**
  ```json
  {
    "make": "Maruti Suzuki",
    "model": "Dzire",
    "registration_number": "KA38M1234",
    "color": "White",
    "year": 2023,
    "fuel_type": "PETROL",
    "passenger_capacity": 4
  }
  ```

### 2.2 Upload Vehicle Documents
- **Endpoint:** `POST /api/v1/vehicles/{vehicle_id}/documents`
- **Auth:** Bearer Token (Owner)
- **Request Body:**
  ```json
  {
    "document_type": "RC",
    "cloudinary_public_id": "kyc/rc_ka38m1234_abc89",
    "document_number": "KA3820230001234",
    "expiry_date": "2038-04-15"
  }
  ```

---

## 3. Ride Discovery & Publishing (`/rides`)

### 3.1 Search Rides
- **Endpoint:** `GET /api/v1/rides/search`
- **Auth:** Optional (Public)
- **Query Parameters:**
  - `origin_city` (string, required): `Bidar`
  - `destination_city` (string, required): `Hyderabad`
  - `travel_date` (date string, required): `2026-11-05`
  - `seats` (integer, default: 1): `2`
  - `pickup_stop_id` (UUID, optional)
  - `drop_stop_id` (UUID, optional)
- **Response (200 OK):**
  ```json
  {
    "success": true,
    "data": [
      {
        "ride_id": "a1b2c3d4-e5f6-7a8b-9c0d-1e2f3a4b5c6d",
        "driver": {
          "name": "Ramesh Patil",
          "avatar_url": "https://res.cloudinary.com/.../avatar.jpg",
          "rating": 4.9,
          "total_trips": 42
        },
        "vehicle": {
          "make": "Hyundai",
          "model": "Creta",
          "color": "Silver",
          "plate_number": "TS08FA5678"
        },
        "departure_time": "2026-11-05T07:30:00+05:30",
        "origin": "Bidar (New Bus Stand)",
        "destination": "Hyderabad (Gachibowli DLF)",
        "available_seats": 3,
        "fare_per_seat": 310.00
      }
    ],
    "error": null,
    "metadata": { "total_count": 1 }
  }
  ```

### 3.2 Publish Ride
- **Endpoint:** `POST /api/v1/rides`
- **Auth:** Bearer Token (Verified Driver)
- **Request Body:**
  ```json
  {
    "vehicle_id": "v1e2c3a5-b81f-4d4a-9c8b-7a9e1f2a3b4c",
    "origin_stop_id": "stop_bidar_nbs",
    "destination_stop_id": "stop_hyd_gachibowli",
    "intermediate_stop_ids": ["stop_humnabad_cross", "stop_zaheerabad_bypass"],
    "departure_time": "2026-11-05T07:30:00+05:30",
    "available_seats": 3,
    "driver_notes": "Departing on time. Boot space available for 2 medium bags."
  }
  ```
  *(Note: Fare is automatically computed and snapshotted by the backend).*

---

## 4. Bookings & Instant Reservations (`/bookings`)

### 4.1 Initiate Booking Reservation
- **Endpoint:** `POST /api/v1/bookings/initiate`
- **Auth:** Bearer Token (Passenger)
- **Headers:** `Idempotency-Key: <unique-uuid>`
- **Request Body:**
  ```json
  {
    "ride_id": "a1b2c3d4-e5f6-7a8b-9c0d-1e2f3a4b5c6d",
    "requested_seats": 2,
    "pickup_stop_id": "stop_bidar_nbs",
    "drop_stop_id": "stop_hyd_gachibowli"
  }
  ```
- **Response (201 Created):**
  ```json
  {
    "success": true,
    "data": {
      "booking_id": "b1b2c3d4-e5f6-7a8b-9c0d-1e2f3a4b5c6d",
      "status": "PENDING_PAYMENT",
      "reserved_until": "2026-11-01T16:40:00Z",
      "seat_count": 2,
      "fare_per_seat": 310.00,
      "total_fare": 620.00,
      "payment_order": {
        "gateway": "RAZORPAY",
        "order_id": "order_OG928kZ88a",
        "amount": 62000,
        "currency": "INR"
      }
    },
    "error": null,
    "metadata": { "timestamp": "2026-11-01T16:30:00Z" }
  }
  ```

---

## 5. Webhooks & Payments (`/webhooks`, `/payments`)

### 5.1 Gateway Webhook Receiver
- **Endpoint:** `POST /api/v1/webhooks/payment`
- **Auth:** Cryptographic HMAC Signature Header (`X-Razorpay-Signature`)
- **Action:** Validates signature, verifies payment, transitions booking to `CONFIRMED`, deducts seat inventory, credits ledger.

---

## 6. Admin Portal Endpoints (`/admin`)

- `GET /api/v1/admin/analytics/overview` — Platform dashboard metrics.
- `GET /api/v1/admin/pricing/routes` — List route price matrix.
- `PUT /api/v1/admin/pricing/routes/{route_id}` — Update seat fare (applies to future bookings).
- `POST /api/v1/admin/commission/rules` — Deploy new versioned commission rule.
- `POST /api/v1/admin/users/{user_id}/suspend` — Suspend abusive user account.
- `POST /api/v1/admin/payouts/batch-process` — Dispatch approved driver payout batch.

