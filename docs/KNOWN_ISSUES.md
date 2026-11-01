# Bidar Connect — Known Issues & Risk Register

## Known Issues Log

*No runtime or code defects identified currently. Project is in baseline repository setup.*

---

## Risk Register

| Risk ID | Category | Description | Severity | Mitigation Strategy |
| :--- | :--- | :--- | :--- | :--- |
| **RSK-001** | Financial | Simultaneous seat booking race conditions leading to overbooking. | Critical | Enforce atomic PostgreSQL transactions (`SELECT ... FOR UPDATE` row locking) on `ride_seat_inventory`. |
| **RSK-002** | Security | Exposure of driving licences or RC identity documents. | High | Use Cloudinary authenticated/private delivery mode with time-bounded signed download URLs generated server-side. |
| **RSK-003** | Operations | Fake payment screenshots claimed by driver. | High | Decouple driver claims from financial verification. Only verified gateway webhooks or reconciled ledger entries mark payment verified. |
| **RSK-004** | Legal | Regional transport department (RTO) carpooling compliance in Karnataka & Telangana. | High | Ensure ride pricing conforms strictly to cost-sharing models rather than commercial taxi operations; document non-commercial nature. |

