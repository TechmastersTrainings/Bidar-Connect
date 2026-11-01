# Bidar Connect — Authentication, Authorization & RBAC Specification

**Document Version:** 1.0.0  
**Status:** Approved Security Specification  
**Architecture:** Supabase Auth (Identity & OTP) + FastAPI Server-Side RBAC & Ownership Enforcement

---

## 1. Authentication Architecture

Bidar Connect utilizes **Supabase Auth** for identity provisioning and phone OTP verification. However, in accordance with core security invariants, **all authorization, business rules, and permissions are strictly enforced server-side by the FastAPI backend**.

```
┌──────────────────┐               1. Request Phone OTP                ┌──────────────────┐
│ Passenger/Driver │ ────────────────────────────────────────────────► │  Supabase Auth   │
│ Client (Web/App) │ ◄──────────────────────────────────────────────── │   Identity Svc   │
└────────┬─────────┘            2. Verify OTP & Issue JWT              └──────────────────┘
         │
         │ 3. API Requests with Authorization: Bearer <JWT>
         ▼
┌─────────────────────────────────────────────────────────────────────────────────────────┐
│ FastAPI Backend Gateway (/api/v1/)                                                      │
│                                                                                         │
│  ┌───────────────────────┐   ┌───────────────────────────┐   ┌───────────────────────┐  │
│  │ Token Signature &     │──►│ User Role & Status Check  │──►│ Resource Ownership    │  │
│  │ Expiry Verification   │   │ (Active, Not Suspended)   │   │ Check (Object-Level)  │  │
│  └───────────────────────┘   └───────────────────────────┘   └───────────────────────┘  │
└─────────────────────────────────────────────────────────────────────────────────────────┘
```

---

## 2. Server-Side Role-Based Access Control (RBAC) Matrix

Users possess granular permissions based on their active identity profile and administrative delegation:

| Capability / API Endpoint | Anonymous Visitor | Passenger | Verified Driver | Admin | Super Admin |
| :--- | :---: | :---: | :---: | :---: | :---: |
| Search Rides (`GET /api/v1/rides/search`) | ✅ | ✅ | ✅ | ✅ | ✅ |
| View Public Routes & Static Info | ✅ | ✅ | ✅ | ✅ | ✅ |
| Book a Ride (`POST /api/v1/bookings`) | ❌ | ✅ | ✅ | ❌ | ❌ |
| View Own Bookings & Receipts | ❌ | ✅ | ✅ | ❌ | ❌ |
| Register Vehicle & Upload Documents | ❌ | ✅ | ✅ | ❌ | ❌ |
| Publish a Ride (`POST /api/v1/rides`) | ❌ | ❌ | ✅* | ❌ | ❌ |
| View Confirmed Manifest for Own Ride | ❌ | ❌ | ✅* | ❌ | ❌ |
| Mark Ride Completed | ❌ | ❌ | ✅* | ❌ | ❌ |
| View Platform Analytics & Metrics | ❌ | ❌ | ❌ | ✅ | ✅ |
| Manage Route Pricing & Stops | ❌ | ❌ | ❌ | ✅ | ✅ |
| Update Commission Rules | ❌ | ❌ | ❌ | ❌ | ✅ |
| Suspend / Reactivate User Accounts | ❌ | ❌ | ❌ | ✅ | ✅ |
| Trigger Bulk Driver Payouts | ❌ | ❌ | ❌ | ❌ | ✅ |
| View Full Audit Trail | ❌ | ❌ | ❌ | ✅ | ✅ |

*\*Note: Verified Driver capability requires valid, unexpired vehicle documents and driving licence.*

---

## 3. Object-Level Ownership Verification (Anti-IDOR)

Frontend route protection is merely aesthetic. Every protected FastAPI endpoint must verify that the authenticated requester owns the target entity before returning data or modifying state:

```python
# Conceptual FastAPI Dependency Pattern
async def get_current_user_booking(
    booking_id: UUID,
    current_user: User = Depends(get_current_active_user),
    db: AsyncSession = Depends(get_db_session)
) -> Booking:
    booking = await booking_repo.get_by_id(db, booking_id)
    if not booking:
        raise HTTPException(status_code=404, detail="Booking not found")
        
    # Prevent Insecure Direct Object Reference (IDOR)
    if booking.passenger_id != current_user.id and not current_user.is_admin:
        raise HTTPException(status_code=403, detail="Access denied to requested booking")
        
    return booking
```

---

## 4. Sensitive Document Access Architecture

Identity and regulatory documents (Driving Licences, RC, Insurance, PUC) uploaded by drivers are strictly confidential.

1. **Storage Isolation:** Files are stored in a dedicated Cloudinary folder (`kyc_documents`) marked with access mode `authenticated`.
2. **Zero Public URLs:** The backend database stores only Cloudinary public IDs (e.g., `kyc/dl_usr_89234`).
3. **Signed Download Access:**
   - When an administrator inspects a document in the Admin Portal, the backend generates an HMAC-SHA1 signed Cloudinary URL with an expiration TTL of 5 minutes.
   - When the TTL expires, the link ceases to function.
   - Every document generation event is logged in `audit_logs` with the administrator's ID and timestamp.

