# Prompt: Prajeta Website + Web ERP (integrates with existing Prajeta Customer & Driver mobile apps)

Copy everything below the line into a new project.

---

Build the **public website** and a **web-based ERP (operations console)** for **Prajeta**, a personal-driver / chauffeur service where verified drivers drive the **customer's own car**. Both are web apps (React + TypeScript, responsive, desktop-first for ERP, mobile-first for the website). They must **not** have their own database or business logic. They are a second front-end on the **existing Prajeta backend (FastAPI + MongoDB)** that already powers the live Prajeta **Customer** and **Driver** Android/iOS apps. Every booking, driver, payment and status must stay in sync instantly across website, ERP and both mobile apps.

## 1. Integration contract (most important)
- **API base URL:** `<PRAJETA_BACKEND_URL>/api` (the deployed Prajeta app URL; I'll provide it). Read it from an env variable `VITE_API_URL` / `REACT_APP_BACKEND_URL`. Never hard-code it.
- **Auth:** WhatsApp OTP, the same as the mobile apps.
  - `POST /api/auth/otp/send {phone}` → OTP sent on WhatsApp. In demo mode the response includes a preview code.
  - `POST /api/auth/otp/verify {phone, code, role?, name?}` → `{token, user}`.
  - Send `Authorization: Bearer <token>` on every call. `GET /api/auth/me` returns the user and their `role`.
  - Google sign-in (optional): `POST /api/auth/session`.
- **Roles** (from `user.role`):
  - `customer` / `corporate` → website customer area.
  - `owner`, `super_admin`, `ops`, `dispatcher`, `verification`, `finance`, `support` → ERP. Show or hide modules per role.
  - `driver` → redirect to "Use the Prajeta Driver app" with a Play Store link (drivers work only in the mobile app).
- **Real-time:** poll the relevant endpoints every 10–15 s on live screens: dispatch queue, live map, SOS, active trips. No websockets exist.
- **Files/photos:**
  - Driver documents: `GET /api/admin/files/{doc_id}`.
  - Approved driver photos: `GET /api/public/driver-photo/{id}`.
  - Pending photos: `GET /api/driver/photo/file/{id}?token=`.
- **Money:** all amounts are in **paise** (integer). Show them as ₹ with Indian grouping (₹4,82,450).
- **Backend is the single source of truth:** don't reimplement fare, GST, dispatch or OTP logic. Call `/api/public/fare-estimate` for prices.
- **CORS** is already open (`*`). No backend change is needed except optional new endpoints listed in §6.

## 2. Brand & design system ("Executive Mobility")
- **Name / logo:** "PRAJETA" wordmark in **red #E53935** (Inter ExtraBold, letter-spaced) with a red rounded-square shield-check icon. Tagline "Executive chauffeurs · Driver services".
- **Colours:**
  - Canvas #F3F4F6, cards #FFFFFF with 1px #E5E7EB borders, 12px radius.
  - Text #191C1E, muted #6B7280.
  - Primary CTA red #E53935 (pressed #C62828, tint #FEF2F2).
  - Dark "cockpit" surfaces #171717 / #292929 / borders #374151, gold accent #C5A059.
  - Success #059669 / #ECFDF5, warning #D97706.
- **Type:** Inter (400–800). Labels are 11px uppercase with letter-spacing. Numbers are bold, tabular.
- **Components:** status badges, red SOS pill, number-plate chips (bordered, monospace caps), step progress bars, 4-box OTP inputs, KPI tiles with trend tags, segmented controls (dark selected), bottom sheets on mobile / modals on desktop.
- Imagery: professional uniformed chauffeur opening a car door; luxury car cockpit; driver portraits.

## 3. Public website (prajeta.com)
1. **Sticky nav:**
   - Red logo.
   - Links: Services, Corporate, Safety, FAQs, Track booking.
   - "Log in" (dark), plus a "Become a driver" button that links to the Driver app.
2. **Hero:**
   - Badge "Police verified squad · white-glove chauffeurs".
   - H1 "Chauffeurs for Your Own Vehicle", subtitle, chauffeur photo card with "Verified authority" chip.
   - Buttons: "Find a Driver" and "Become a Driver".
3. **Instant Dispatch booking widget** (right column on desktop):
   - Service tabs (Hourly / Outstation / Monthly) plus chips for all services from `GET /api/public/config` (services, cities, settings, FAQs).
   - City, date, time and Manual/Automatic transmission.
   - Live "Guaranteed all-inclusive rate" from `POST /api/public/fare-estimate`.
   - Red CTA "Get Guaranteed Quote & Assign Driver". If not logged in, open the OTP login, then continue to booking.
4. **Rest of the homepage:**
   - **Stats band:** 1,500+ cars handled, OTP secured, police verified, GST invoices.
   - **"Uncompromising Trust" 4-card grid:** Document verified, Police verified, AT/EV specialists, GST 18% ITC.
   - **Safety standard:** chauffeur spotlight card and a 3-step vehicle safety guarantee (walkaround, trip-start OTP, handover PIN).
   - **Tailored Driver Services:** one card per service with price from config. The most popular card has a red border.
   - **How it works:** choose service → pick date/time → pay 20% advance → verified driver arrives (OTP).
   - **Corporate:** comparison table (in-house driver vs Prajeta retainer), retainer cost calculator, and a corporate enquiry form (`POST /api/public/enquiry`).
   - **Testimonials, cities served, FAQ accordion, WhatsApp / call support.**
   - **App download band:** Play Store / App Store links for the Customer app.
   - **Footer:** legal pages from `settings.pages` (About, Contact, Safety, Privacy, Terms, Cancellation & Refunds, Driver Partner Terms).
5. **Track booking page:** `GET /api/public/track/{ref}`. **Shared live trip page:** `/live/{token}` → `GET /api/public/live/{token}` (map plus driver card with approved photo).
6. **Customer web area** (after login, same account as the mobile app):
   - **Book (3 steps):** details → fare breakdown → pay **20% advance**. A booking is confirmed only after the advance is paid. Use `POST /api/bookings` and `POST /api/payments/create`; Razorpay checkout comes later via `/api/payments/{pid}/checkout`, `/verify`.
   - **My bookings:** list and detail with a status step bar, trip-start OTP, trip-end handover PIN, driver card (photo, rating, call), live tracking (`GET /api/bookings/{id}/tracking`), share trip link, SOS, cancel/reschedule, rating, invoice/GST tax invoice download (`GET /api/invoices/{id}`).
   - **Profile:** name/email, vehicle garage (`/api/me/vehicles`), GST billing details (`/api/me/billing`), trusted contacts (`/api/me/contacts`), referral code (`/api/me/referral`), notifications.
- SEO: meta tags, OpenGraph, sitemap, city landing pages ("Driver on hire in Bengaluru"), schema.org LocalBusiness and FAQ.

## 4. Web ERP (erp.prajeta.com), desktop console with left sidebar
**Sidebar:**
- Command Center
- Dispatch
- Bookings
- Live Map
- Drivers & KYC
- Customers
- Enquiries & Quotes
- Payments
- Payouts
- Expenses
- Tariffs & Services
- Cities
- Referrals
- Ratings
- SOS Alerts
- Licences
- Tickets
- Staff
- Audit Log
- Owner P&L
- Settings

The top bar shows a city switcher, a live-ops pill (drivers online, dispatches in progress), a dark "Emergency Dispatch" button with an SOS count badge, notifications and the user menu.

**Command Center** (`GET /api/admin/dashboard?period=&city_id=`):
- **Period chips:** Today, Yesterday, 7d, 30d, Month, Last month, Quarter, FY, All.
- **KPI tiles:** GBV, Duty fulfilment rate (progress bar), Fleet driver utilization, and a red Dispatch Alert ("N Unassigned bookings" → Assign).
- **Live Dispatch Queue table:** ref, status, service, customer, vehicle plate/transmission, pickup/time, fare, driver, and a "Quick Assign" action. Unassigned rows have a red left border. Filter tabs: All / Unassigned / En route / Advance pending.
- **Side panels:** Driver Vetting & KYC queue (+ "Photos to review"), Bookings trend chart, and an Executive Action Plan with recommendations.

**Module details:**
- **Dispatch / Bookings** (`GET /api/admin/bookings?status=&city_id=&q=&date=`):
  - Detail drawer with timeline.
  - Assign/reassign driver: `POST /api/admin/bookings/{id}/assign`, nearest drivers first.
  - Status override, fare adjust, quote for quote-based services, record cash advance (`/cash`), cancel/reschedule.
  - CSV export: `/api/admin/bookings/export.csv`.
- **Live Map** (`GET /api/admin/live-drivers`): online drivers and active trips on a map (Leaflet; tiles via `/api/tiles/{z}/{x}/{y}.png`).
- **Drivers & KYC:**
  - List: `GET /api/admin/drivers?status=&photo_status=`. Profile: `GET /api/admin/drivers/{id}`.
  - Document viewer with approve/reject per doc: `POST /api/admin/drivers/{id}/documents/{doc_id}`.
  - Approve/suspend driver: `POST /api/admin/drivers/{id}/status`.
  - Approve/reject profile photo with a reason: `POST /api/admin/drivers/{id}/photo`.
  - Ratings, earnings and badges.
- **Customers:** list, detail and restrict.
- **Enquiries:** monthly, permanent and corporate leads → quote.
- **Payments:** list, detail and refund.
- **Driver payouts:** payout requests approve/pay (`/api/admin/payout-requests`), payouts and monthly statements.
- **Expenses** and **Owner P&L:** `/api/admin/owner/overview`, `/insights`, `/cities`, `/services`, `/actions`.
- **Configuration:** tariffs/services (`PUT /api/admin/services/{id}`), cities (`PUT /api/admin/cities/{id}`), settings (advance %, GST, support numbers, legal pages).
- **SOS console:** `GET /api/admin/sos`, `POST /api/admin/sos/{id}`. Siren banner across the ERP while an alert is open.
- **Remaining modules:**
  - Licence expiry checks.
  - Support tickets.
  - Referrals leaderboard and rewards.
  - Staff and roles (`/api/admin/staff`, performance).
  - Audit log.
- **Productivity:** tables with search, sort, column filters, pagination, bulk actions, CSV export, keyboard shortcuts (/ search, A assign), toasts, confirm dialogs for destructive actions, and empty/loading/error states.

## 5. Mobile-app parity rules
- Status lifecycle, shared by all apps:
  `QUOTED → PAYMENT_PENDING → AWAITING_ASSIGNMENT → ASSIGNED → ACCEPTED → DRIVER_ARRIVED → IN_PROGRESS → COMPLETED` (or `CANCELLED`).
- Booking refs look like `PRJ-XXXXXXXX`.
- Bookings are confirmed only after the 20% advance (configurable in settings).
- The trip starts only with the customer's 4-digit OTP; the trip ends with the handover PIN.
- Changes made in the ERP (assign driver, cancel, quote) must appear in the Customer/Driver mobile apps automatically. They share the backend.

## 6. Optional backend additions (only if needed; keep backward compatible)
- `GET /api/admin/search?q=` global search.
- Server-sent events for the dispatch queue (fallback to polling).
- A webhook to notify the ERP of new SOS alerts.

## 7. Non-functional
- Responsive website (360px → 1440px). ERP optimised for 1280–1920px, usable on tablet.
- Lighthouse ≥ 90, accessible (WCAG AA contrast, focus states, aria labels).
- Token kept in memory + localStorage (web only), auto-logout on 401.
- Every interactive element gets a `data-testid`.
- Demo logins for testing:
  - Owner 9000000001, Driver 9000000002, Customer 9000000003; OTP 123456 in demo mode.
  - Disable these before go-live.
