# Bidar Connect — UI/UX Design System & Wireframe Specifications

**Document Version:** 1.0.0  
**Status:** Approved Design Specification  
**Design Philosophy:** Clean, Trustworthy, Light-Themed, Functional Utility  
**Brand Route:** Bidar ⇄ Hyderabad (NH 65 Corridor)  
**Iconography Standard:** Lucide React (Strictly Zero Emoji Icons)  

---

## 1. Strict Brand & Visual Governance

In direct accordance with **Section 18 (Strict Design and Brand Rules)**, the following constraints are strictly enforced across all five portals and applications:

### 1.1 Prohibited Visual Elements (Never Use)
- ❌ **No Purple or Random Gradients:** No rainbow gradients, no purple-to-pink blends, no mesh gradients.
- ❌ **No Pill-Shaped Buttons:** All buttons must use standard rectangular or moderately rounded geometry (`rounded-md` / `rounded-lg`).
- ❌ **No Emoji Icons:** Emojis are strictly banned as UI icons (e.g., no 🚗, 📍, 💰). Professional SVG icons from **Lucide React** must be used exclusively.
- ❌ **No Fake Reviews or Testimonials:** Zero fabricated user quotes, zero placeholder 5-star ratings without real completed trips.
- ❌ **No Artificial Urgency or Fake Metrics:** No "Only 1 seat left - 42 people looking right now!" or fake countdown clocks.
- ❌ **No AI-Slop Photography:** Authentic vehicle photos or clean vector representations only.
- ❌ **No Disorienting Animations:** No crazy cursor effects, no excessive scroll-jacking.

### 1.2 Mandatory Aesthetic Direction
- **Theme:** Clean, bright, light interface with white or light neutral canvases.
- **Palette:** Deep Navy typography for high legibility, restrained professional Blue primary accents, crisp neutral borders.
- **Visual Weight:** Flat panels with subtle 1px borders (`border-slate-200`) and soft, natural drop shadows (`shadow-sm`).
- **Hierarchy:** High information density without visual clutter; clear label-to-input associations.

---

## 2. Design Tokens & Color System

All colors adhere to **WCAG 2.1 AA** accessibility contrast standards (minimum 4.5:1 for body copy against backgrounds).

```
┌────────────────────────────────────────────────────────────────────────┐
│ BIDAR CONNECT COLOR TOKEN PALETTE                                      │
├───────────────────┬───────────────────┬────────────────────────────────┤
│ Token Name        │ Hex Code          │ Tailwind Class & Role          │
├───────────────────┼───────────────────┼────────────────────────────────┤
│ Primary Navy      │ #0F172A           │ text-slate-900 (Main Headings) │
│ Brand Blue (Main) │ #1E40AF           │ bg-blue-800 / text-blue-800    │
│ Interactive Blue  │ #2563EB           │ bg-blue-600 (Primary CTAs)     │
│ Hover Blue        │ #1D4ED8           │ bg-blue-700 (Button Hover)     │
│ Surface Canvas    │ #F8FAFC           │ bg-slate-50 (Page Background)  │
│ Surface Card      │ #FFFFFF           │ bg-white (Panels & Modals)     │
│ Border Subtle     │ #E2E8F0           │ border-slate-200 (Dividers)    │
│ Border Focus      │ #3B82F6           │ focus:border-blue-500 (Inputs) │
│ Text Body         │ #334155           │ text-slate-700 (Body Paragraph)│
│ Text Muted        │ #64748B           │ text-slate-500 (Captions/Meta) │
│ Success Emerald   │ #16A34A           │ text-emerald-600 / bg-emerald-50│
│ Warning Amber     │ #D97706           │ text-amber-600 / bg-amber-50   │
│ Error Crimson     │ #DC2626           │ text-red-600 / bg-red-50       │
└───────────────────┴───────────────────┴────────────────────────────────┘
```

---

## 3. Typography Scale & Spatial System

### 3.1 Typography (Font Family: `Inter`, system-ui, sans-serif)

| Level | Size / Line Height | Weight | Tailwind Class | Usage |
| :--- | :--- | :--- | :--- | :--- |
| **Display 1** | 36px / 44px | Bold (700) | `text-4xl font-bold tracking-tight` | Homepage Hero Title |
| **Heading 1** | 28px / 36px | SemiBold (600) | `text-2xl font-semibold` | Page Headers, Section Titles |
| **Heading 2** | 20px / 28px | SemiBold (600) | `text-xl font-semibold` | Card Titles, Modal Headers |
| **Subheading**| 16px / 24px | Medium (500) | `text-base font-medium` | Form Section Headers |
| **Body Regular**| 15px / 22px | Normal (400) | `text-[15px] font-normal` | Main Body Text, Descriptions |
| **Label / Action**| 14px / 20px | Medium (500) | `text-sm font-medium` | Button Text, Form Labels |
| **Microcopy** | 12px / 16px | Normal (400) | `text-xs text-slate-500` | Timestamps, Disclaimers |

### 3.2 Spacing & Layout Grid
- **Base Grid Unit:** 4px (Tailwind standard: `p-2` = 8px, `p-4` = 16px, `p-6` = 24px, `p-8` = 32px).
- **Container Max-Width:**
  - Public Website & Marketing: `max-w-6xl` (1152px) centered.
  - Dashboards & Portals: `max-w-7xl` (1280px) with responsive fluid padding (`px-4 sm:px-6 lg:px-8`).
  - Forms & Dialogs: `max-w-md` (448px) to `max-w-xl` (576px).

---

## 4. UI Component Library Specifications

### 4.1 Buttons
- **Geometry:** Strictly rectangular with moderate rounding (`rounded-md` / 6px border radius). **Never pill-shaped.**
- **Minimum Touch Target:** 44px height (`h-11` or `py-2.5 px-4`).
- **Variants:**
  - *Primary:* `bg-blue-600 hover:bg-blue-700 text-white font-medium shadow-sm transition-colors`
  - *Secondary / Outline:* `bg-white hover:bg-slate-50 text-slate-700 border border-slate-300 font-medium`
  - *Destructive:* `bg-red-600 hover:bg-red-700 text-white font-medium`
  - *Ghost / Link:* `text-blue-600 hover:text-blue-800 hover:underline bg-transparent`
- **States:** Hover, Active (`scale-[0.99]`), Focus (`focus:ring-2 focus:ring-blue-500 focus:ring-offset-2`), Disabled (`opacity-50 cursor-not-allowed`), and Loading (replaces label with inline SVG spinner).

### 4.2 Form Inputs & Controls
- **Text & Number Inputs:**
  - Height: 42px (`h-10.5 px-3.5`).
  - Border: 1px solid `#CBD5E1` (`border-slate-300`), active focus state `border-blue-600 ring-1 ring-blue-600`.
  - Labels: Always placed explicitly above input (`text-sm font-medium text-slate-700 mb-1`).
  - Error Feedback: Red 1px border (`border-red-500`) with error icon and text directly below input.
- **Select Dropdowns:** Standard native accessible select or styled popover with chevron icon (`ChevronDown` from Lucide).

### 4.3 Data Cards & Panels
- **Container:** `bg-white border border-slate-200 rounded-lg p-5 shadow-sm`.
- **Hoverable Variant (Ride Cards):** `hover:border-blue-300 hover:shadow-md transition-all cursor-pointer`.

### 4.4 Status Badges
- Compact tags with moderate rounding (`rounded px-2.5 py-0.5 text-xs font-medium`):
  - *Confirmed / Captured:* `bg-emerald-50 text-emerald-700 border border-emerald-200`
  - *Pending / Hold:* `bg-amber-50 text-amber-700 border border-amber-200`
  - *Cancelled / Expired:* `bg-slate-100 text-slate-600 border border-slate-200`
  - *Disputed:* `bg-red-50 text-red-700 border border-red-200`

---

## 5. Responsive Portal Wireframes & Layout Blueprints

### 5.1 Component 1: Public Website (`apps/public-web`)

```
┌────────────────────────────────────────────────────────────────────────┐
│ [Logo] BIDAR CONNECT         Find Ride   Offer Ride   How it Works   [Login]│
├────────────────────────────────────────────────────────────────────────┤
│                                                                        │
│   Organised Intercity Carpooling on Bidar ⇄ Hyderabad Route            │
│   Travel comfortably, split travel costs legally, zero price gouging. │
│                                                                        │
│   ┌────────────────────────────────────────────────────────────────┐   │
│   │ [MapPin] From: Bidar   [MapPin] To: Hyderabad   [Calendar] Date  │   │
│   │ [Users] 1 Seat   [Button: Search Available Rides]              │   │
│   └────────────────────────────────────────────────────────────────┘   │
│                                                                        │
├────────────────────────────────────────────────────────────────────────┤
│ HOW IT WORKS: (Tabs: For Passengers | For Car Owners)                  │
│  [1. Search & Select] ──► [2. Instant Seat Lock] ──► [3. Travel Safe]  │
├────────────────────────────────────────────────────────────────────────┤
│ THE BIDAR ⇄ HYDERABAD CORRIDOR:                                       │
│  • Fixed Fare: ₹310 per seat (Admin controlled, no surge pricing)      │
│  • Stops: New Bus Stand, Humnabad, Zaheerabad, Sangareddy, Gachibowli  │
│  • Verified drivers with valid RC and Driving Licence                  │
├────────────────────────────────────────────────────────────────────────┤
│ SAFETY FIRST:                                                          │
│  • 100% Phone & Document Verification                                  │
│  • Real-Time Journey Tracking Shareable with Family                    │
│  • Emergency SOS Button & 24/7 Grievance Support                       │
├────────────────────────────────────────────────────────────────────────┤
│ FOOTER: Corporate Info | Privacy | Terms | Refund Policy | Grievance   │
└────────────────────────────────────────────────────────────────────────┘
```

---

### 5.2 Component 2: Passenger Portal (`apps/passenger-web`)

```
┌────────────────────────────────────────────────────────────────────────┐
│ [Logo] BIDAR CONNECT   Find Rides   My Bookings   [Profile: Shiva]    │
├────────────────────────────────────────────────────────────────────────┤
│ RIDE SEARCH RESULTS (Bidar ➔ Hyderabad | 2026-11-05 | 2 Seats)         │
│ Filter: [Departure Time: Morning ▼]  [Vehicle: Any ▼]  [Sort: Fare]   │
├────────────────────────────────────────────────────────────────────────┤
│ ┌────────────────────────────────────────────────────────────────────┐ │
│ │ 07:30 AM  Bidar (New Bus Stand) ────────► 10:15 AM Hyderabad (DLF)│ │
│ │ Driver: Ramesh Patil (★ 4.9 • 48 trips)  Car: Hyundai Creta Silver │ │
│ │ Seats Available: 3 of 4    • ₹310 / seat                           │ │
│ │ [Button: Reserve 2 Seats — ₹620]                                   │ │
│ └────────────────────────────────────────────────────────────────────┘ │
│ ┌────────────────────────────────────────────────────────────────────┐ │
│ │ 09:00 AM  Bidar (Mailoor Cross) ────────► 11:45 AM Miyapur Junction│ │
│ │ Driver: Suresh Kulkarni (★ 4.8)          Car: Maruti Dzire White   │ │
│ │ Seats Available: 2 of 4    • ₹310 / seat                           │ │
│ │ [Button: Reserve 2 Seats — ₹620]                                   │ │
│ └────────────────────────────────────────────────────────────────────┘ │
├────────────────────────────────────────────────────────────────────────┤
│ CHECKOUT MODAL:                                                        │
│  Total Fare: ₹620 (₹310 x 2 seats) • Company Commission Included       │
│  Seats held for 10:00 minutes • Instant Confirmation Guaranteed        │
│  [Pay ₹620 via Company UPI / Card]                                     │
└────────────────────────────────────────────────────────────────────────┘
```

---

### 5.3 Component 3: Driver Portal (`apps/driver-web`)

```
┌────────────────────────────────────────────────────────────────────────┐
│ [Logo] BIDAR CONNECT (Driver Mode)   My Rides  Vehicles  Earnings [Me] │
├────────────────────────────────────────────────────────────────────────┤
│ TODAY'S ACTIVE RIDE (Scheduled: Today, 05:30 PM | Bidar ➔ Hyderabad)   │
│ Vehicle: Hyundai Creta (KA 38 M 5678) • Booked Seats: 3 / 4           │
│ [Button: Start Journey]   [Button: Passenger Manifest (3)]             │
├────────────────────────────────────────────────────────────────────────┤
│ CONFIRMED PASSENGERS:                                                  │
│ 1. Shiva Bhalke (2 Seats) • Pickup: New Bus Stand • Paid: Verified    │
│    [Call Passenger]  [Mark Boarded]                                    │
│ 2. Anand Rao (1 Seat)     • Pickup: Humnabad Cross• Paid: Verified    │
│    [Call Passenger]  [Mark Boarded]                                    │
├────────────────────────────────────────────────────────────────────────┤
│ EARNINGS SUMMARY (This Month):                                         │
│ Gross Trip Share: ₹9,300  | Platform Commission: ₹300 | Net: ₹9,000   │
│ Next Payout: ₹600 (Queued for settlement post-completion)              │
├────────────────────────────────────────────────────────────────────────┤
│ PUBLISH A RIDE:                                                        │
│  Origin: [Bidar ▼]  Destination: [Hyderabad ▼]  Date: [2026-11-06]     │
│  Vehicle: [KA 38 M 5678 ▼]  Seats: [3 ▼]                              │
│  Calculated Route Fare: ₹310 / seat (Fixed by Admin - Read Only)       │
│  [Button: Publish Ride]                                                │
└────────────────────────────────────────────────────────────────────────┘
```

---

### 5.4 Component 4: Admin Portal (`apps/admin-web`)

```
┌────────────────────────────────────────────────────────────────────────┐
│ [Logo] BIDAR CONNECT ADMIN   Dashboard  Users  Fleet  Pricing  Ledger  │
├────────────────────────────────────────────────────────────────────────┤
│ PLATFORM HEALTH OVERVIEW:                                              │
│  Gross Booking Value: ₹1,48,200   Platform Commission: ₹4,780          │
│  Active Rides Today: 18           Active Confirmed Seats: 54           │
├────────────────────────────────────────────────────────────────────────┤
│ ROUTE PRICING & COMMISSION MANAGER:                                    │
│  Route: Bidar ⇄ Hyderabad (140 km)                                     │
│  Current Seat Fare: [ ₹310.00 ]  [Save Future Price]                   │
│  Active Commission: [ ₹10.00 per seat ] (Rule: comm_v1_fixed)          │
├────────────────────────────────────────────────────────────────────────┤
│ DOCUMENT VERIFICATION QUEUE (3 Pending Review):                        │
│  • Ramesh Patil: Driving Licence (Exp: 2031)  [View Image] [Approve/Reject]│
│  • Suresh K: RC Book for TS 08 FA 1234        [View Image] [Approve/Reject]│
├────────────────────────────────────────────────────────────────────────┤
│ FINANCIAL RECONCILIATION LEDGER:                                       │
│  Gateway Captures vs Local Bookings: 100% Matched                     │
│  Pending Driver Payouts: 2 (₹1,200 total)  [Review & Dispatch Batch]   │
└────────────────────────────────────────────────────────────────────────┘
```

---

### 5.5 Component 5: Mobile Applications (`apps/mobile`)

```
┌─────────────────────────────────┐
│ 17:00                     📶 🔋 │
│ [Logo] Bidar Connect    [🔔] [⚙️]│
│ ─────────────────────────────── │
│ [Toggle: Passenger  | Driver]   │
│                                 │
│ WHERE ARE YOU HEADING?          │
│ ┌─────────────────────────────┐ │
│ │ 🟢 From: Bidar (New Bus)    │ │
│ │ 🔴 To:   Hyderabad (DLF)    │ │
│ │ 📅 Today, Nov 05 • 2 Seats  │ │
│ │ [Find Rides]                │ │
│ └─────────────────────────────┘ │
│                                 │
│ UPCOMING TRIP                   │
│ ┌─────────────────────────────┐ │
│ │ Bidar ➔ Hyderabad           │ │
│ │ Today • 07:30 AM (In 2h 30m)│ │
│ │ Driver: Ramesh (Creta Silver)││
│ │ [View Ticket & QR]          │ │
│ │ [Share Live Trip with Family]││
│ └─────────────────────────────┘ │
│                                 │
│ ─────────────────────────────── │
│ [Search]  [Trips]  [Inbox] [Me] │
└─────────────────────────────────┘
```
