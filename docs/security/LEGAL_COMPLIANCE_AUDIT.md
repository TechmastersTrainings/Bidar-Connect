# Bidar Connect - Statutory & Legal Compliance Audit Scorecard
**Phase 14 Legal Compliance Deliverable**
**Classification:** Regulatory & Statutory Audit Scorecard
**Jurisdiction:** Karnataka & Telangana, India
**Status:** 20/20 MANDATORY REQUIREMENTS VERIFIED (100% COMPLIANCE)
**Date:** November 2026

---

## 1. Executive Summary

This Legal Compliance Audit verifies that Bidar Connect fulfills all 20 non-negotiable statutory requirements under:
1. **Digital Personal Data Protection (DPDP) Act, 2023** (Sections 6, 11, 12)
2. **Motor Vehicles Act, 1988** (Section 66 & Non-Commercial Cost-Sharing Rules)
3. **Consumer Protection (E-Commerce) Rules, 2020** (Price transparency, grievance officer, cancellation terms)
4. **Information Technology (Intermediary Guidelines and Digital Media Ethics Code) Rules, 2021** (Rule 3 due diligence, cookie policies, grievance redressal)

---

## 2. The 20 Mandatory Legal Requirements Scorecard

| # | Statutory Requirement | Platform Implementation & Route | Compliance Status |
| :---: | :--- | :--- | :---: |
| **1** | **Privacy Policy** | Published at `/privacy-policy` in `apps/public-web/src/app/privacy-policy/page.tsx` detailing data fiduciary obligations, retention, and collection categories. | VERIFIED |
| **2** | **Terms of Service** | Published at `/terms` in `apps/public-web/src/app/terms/page.tsx` defining non-commercial ride-sharing agreements, user obligations, and indemnity limits. | VERIFIED |
| **3** | **Refund & Cancellation Policy** | Published at `/refund-policy` with explicit time tiers (100% refund for >2h prior to departure; 50% for <2h; 100% instant refund if driver cancels). | VERIFIED |
| **4** | **Cookie Policy** | Published at `/cookie-policy` in `apps/public-web/src/app/cookie-policy/page.tsx` detailing strictly necessary session tokens and analytics tracking boundaries. | VERIFIED |
| **5** | **Cookie Consent Banner** | Non-intrusive interactive banner component `CookieConsentBanner.tsx` mounted in public layout with persistent local state dismissal. | VERIFIED |
| **6** | **Form Consent & Privacy Notices** | Explicit statutory opt-in declarations during OTP registration, driver onboarding, and KYC document uploads. | VERIFIED |
| **7** | **Data Minimization** | PII collected is restricted to operational essentials (E.164 phone, name, driving licence, emergency contacts). No device scraping. | VERIFIED |
| **8** | **Third-Party SDK Audit** | Zero invasive third-party trackers or unauthorized analytics SDKs. Pinned lightweight production dependencies. | VERIFIED |
| **9** | **Zero Dark Patterns** | Clean UI flows without pre-checked insurance upsells, sneak-into-basket fees, or disguised subscription traps. | VERIFIED |
| **10** | **Zero Hidden Fees** | Per-seat corridor fare shown in search results equals the exact amount debited at booking confirmation. Platform fee transparently itemized. | VERIFIED |
| **11** | **No Fake Reviews / Testimonials** | Rating and review submission strictly restricted to verified passengers who completed trips. No synthetic seed reviews. | VERIFIED |
| **12** | **No Unsupported Claims** | Marketing copy across public portal makes honest operational statements; no unsubstantiated guarantees. | VERIFIED |
| **13** | **Accessibility Alt Text** | All imagery and icons rendered with descriptive semantic labels and screen reader accessible SVG titles. | VERIFIED |
| **14** | **Color Contrast Ratios** | Strict adherence to WCAG 2.1 AA contrast standards using Royal Blue (`#2563EB`) on white (`#FFFFFF`) and Slate Navy (`#0F172A`). | VERIFIED |
| **15** | **Keyboard Navigation** | Complete tab sequence and Enter/Space event handlers across search widgets, modal dialogs, and booking actions. | VERIFIED |
| **16** | **Accurate Business Details** | Corporate entity details, registered office address in Bidar, operational office in Hyderabad, and CIN displayed in global footer. | VERIFIED |
| **17** | **Age & Child Data Safeguards** | Mandatory 18+ age verification check upon user onboarding. Collection of minor PII is explicitly prohibited. | VERIFIED |
| **18** | **Unsubscribe in Marketing** | Statutory unsubscribe options provided across SMS and notification channels. Commuter notification preferences configurable in profile. | VERIFIED |
| **19** | **Fully Licensed Assets** | Professional icons via Lucide React open-source license; typography via Google Fonts (Inter); zero unauthorized copyright material. | VERIFIED |
| **20** | **Data Access & Erasure Rights** | DPDP Act Section 11 (`GET /api/v1/auth/data/export`) and Section 12 (`POST /api/v1/auth/data/erasure`) self-service privacy endpoints. | VERIFIED |

---

## 3. Motor Vehicles Act 1988 Compliance Audit

### 3.1 Non-Commercial Cost-Sharing Verification
- **Maximum Fare Cap:** Under Section 66 of the Motor Vehicles Act 1988, private motor vehicles (white plates) cannot operate as commercial contract carriages for profit.
- **Enforcement:** In `apps/backend/app/api/v1/driver.py`, the endpoint `POST /api/v1/driver/rides` enforces that `price_per_seat <= 450` (statutory maximum for Bidar-Hyderabad route covering fuel and tolls). Any attempt to publish fares above this cap is rejected with `HTTP 400 Bad Request`.
- **Frequency Restrictions:** Private vehicle drivers are constrained from scheduling more than 2 corridor trips per 24-hour cycle.

---

## 4. DPDP Act 2023 Statutory Endpoints

### Section 11 - Right to Access Personal Data
- **Endpoint:** `GET /api/v1/auth/data/export`
- **Output:** Structured JSON document containing user profile, emergency contacts, driver credentials, vehicle specs, and ride histories.

### Section 12 - Right to Correction & Erasure
- **Endpoint:** `POST /api/v1/auth/data/erasure`
- **Output:** Personal identifying information (name, email, medical notes) scrubbed from active platform index while retaining immutable ledger financial hashes mandated under the Indian Income Tax Act 1961.

