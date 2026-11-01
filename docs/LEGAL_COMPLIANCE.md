# Bidar Connect — Legal, Privacy & Regulatory Compliance Framework

**Document Version:** 1.0.0  
**Status:** Approved Legal Blueprint  
**Jurisdiction:** Karnataka & Telangana, India  
**Primary Statutes:** Digital Personal Data Protection (DPDP) Act 2023, Motor Vehicles Act 1988, Consumer Protection (E-Commerce) Rules 2020, Information Technology (Intermediary Guidelines) Rules 2021.

---

## 1. The 20 Mandatory Legal Requirements

Bidar Connect treats these 20 items as a non-negotiable release barrier. Public launch cannot occur without full implementation:

| # | Requirement | Implementation in Bidar Connect | Verification |
| :---: | :--- | :--- | :--- |
| **1** | **Privacy Policy** | Comprehensive policy detailing collection, processing, storage, and retention of personal data. | Document published at `/privacy-policy` |
| **2** | **Terms of Service** | Detailed contract defining carpooling obligations, non-commercial cost-sharing, and liability boundaries. | Document published at `/terms` |
| **3** | **Refund & Cancellation Policy** | Clear, transparent time-based cancellation tiers (100% refund >2h; 50% <2h; full driver cancellation refund). | Document published at `/refund-policy` |
| **4** | **Cookie Policy** | Explicit explanation of essential authentication cookies and analytical tokens. | Document published at `/cookie-policy` |
| **5** | **Cookie Consent Banner** | Non-intrusive consent banner allowing users to accept essential and analytics cookies. | Tested on web frontends |
| **6** | **Form Consent & Privacy Notices** | Explicit opt-in checkboxes during registration and document upload with links to policies. | Enforced in form validators |
| **7** | **Data Minimization** | Collect only necessary attributes (phone, name, vehicle docs, emergency contact). No invasive tracking. | Schema audit passed |
| **8** | **Third-Party SDK Audit** | Thorough inspection of Supabase, Cloudinary, Maps, Sentry, and Payment SDKs for unauthorized telemetry. | Verified in dependencies |
| **9** | **Zero Dark Patterns** | No pre-checked upsells, hidden insurance fees, or deceptive cancellation flows. | Design audit verified |
| **10** | **Zero Hidden Fees** | Per-seat price shown in search is the exact final price charged at checkout. No surprise platform surcharges. | Price engine verified |
| **11** | **No Fake Reviews / Testimonials** | Only genuine passengers who completed verified trips can review. Zero fabricated or seeded testimonials. | Database constraint enforced |
| **12** | **No Unsupported Claims** | No misleading claims like "100% Guaranteed Ride" or "Fastest travel time in India". Honest operational statements only. | Marketing copy verified |
| **13** | **Accessibility Alt Text** | All vehicle and brand images include descriptive `alt` tags for screen readers. | Semantic HTML audit |
| **14** | **Color Contrast Ratios** | Strict compliance with WCAG 2.1 AA standards (minimum 4.5:1 for normal text, 3:1 for large text). | Design token audit |
| **15** | **Keyboard Navigation** | Complete tab indexing and keyboard operability for search forms, modal dialogs, and booking actions. | Accessibility test suite |
| **16** | **Accurate Business Details** | Registered corporate entity name, CIN/LLPIN, registered office address in Bidar/Hyderabad, and support contacts. | Displayed in website footer |
| **17** | **Age & Child Data Safeguards** | Mandatory 18+ declaration during registration. No targeted profiling or collection of minor information. | Age declaration check |
| **18** | **Unsubscribe in Marketing** | One-click unsubscribe headers in transactional and marketing email/SMS dispatches. | Notification service rule |
| **19** | **Fully Licensed Assets** | Professional icons via Lucide React; authentic photography; zero copyright infringements. | Asset provenance checked |
| **20** | **Data Access & Erasure Rights** | Dedicated user self-service mechanism to request data export or account erasure under DPDP Act. | Privacy controller endpoint |

---

## 2. Regional Transport Regulation (Karnataka & Telangana)

### 2.1 Distinction Between Commercial Taxis and Intercity Carpooling
Under the Motor Vehicles Act 1988, operating an unauthorized commercial passenger service (contract carriage without commercial permits/yellow plates) carries strict penalties. Bidar Connect is strictly architected as a **Non-Commercial Cost-Sharing Carpooling Intermediary**:

1. **True Cost-Sharing Limits:** Route pricing is capped to recover only direct journey expenses (fuel, tolls, vehicle wear-and-tear) divided among vehicle occupants. Fares are intentionally pegged below commercial taxi/cab aggregator rates.
2. **Frequency Caps:** A private vehicle is restricted from publishing more than 2 trips per day on the corridor, precluding unauthorized commercial taxi operations.
3. **Driver Profit Preclusion:** Drivers do not earn a wage or profit margin; they offset shared travel costs.

---

## 3. Statutory Grievance Redressal Mechanism

In compliance with the Information Technology (Intermediary Guidelines) Rules 2021 and Consumer Protection (E-Commerce) Rules 2020:
- **Grievance Officer Appointment:** A designated platform Grievance Officer is published with complete contact address, dedicated phone line, and email (`grievance@bidarconnect.in`).
- **Resolution Timeline:** Grievances must be acknowledged within 24 hours and fully investigated/resolved within 15 days.

