# Prajeta API reference

**Base URL (live backend used by the Driver app):** `https://fleetride-hub.emergent.host`  
Every route below is relative to that URL, e.g. `https://fleetride-hub.emergent.host/api/auth/me`.

**Auth:** send `Authorization: Bearer <token>` (token comes from `POST /api/auth/otp/verify` or `POST /api/auth/session`).  
Money values are in **paise** (e.g. `50000` = ₹500). Errors look like `{"detail": "message"}`.

Response examples for GET routes are real responses captured from the sandbox copy of the backend (demo data, lists cut to 1 item). For write routes the response shown is what the code returns.

Total endpoints: **125**

## Index

| # | Method | Path | Auth |
|---|---|---|---|
| 1 | POST | `/api/auth/otp/send` | Public (no token) |
| 2 | POST | `/api/auth/otp/verify` | Public (no token) |
| 3 | GET | `/api/auth/me` | Bearer token (any signed-in user) |
| 4 | PUT | `/api/auth/me` | Bearer token (any signed-in user) |
| 5 | GET | `/api/public/config` | Public (no token) |
| 6 | POST | `/api/public/fare-estimate` | Optional/inline token check (see code) |
| 7 | POST | `/api/public/enquiry` | Public (no token) |
| 8 | GET | `/api/public/track/{ref}` | Public (no token) |
| 9 | GET | `/api/bookings` | Bearer token, roles: customer, corporate |
| 10 | POST | `/api/bookings` | Bearer token, roles: customer, corporate |
| 11 | GET | `/api/bookings/pending-review` | Bearer token, roles: customer, corporate |
| 12 | GET | `/api/bookings/{booking_id}` | Bearer token, roles: customer, corporate |
| 13 | POST | `/api/bookings/{booking_id}/cancel` | Bearer token, roles: customer, corporate |
| 14 | POST | `/api/bookings/{booking_id}/reschedule` | Bearer token, roles: customer, corporate |
| 15 | POST | `/api/bookings/{booking_id}/review` | Bearer token, roles: customer, corporate |
| 16 | POST | `/api/payments/create` | Bearer token, roles: customer, corporate |
| 17 | GET | `/api/payments/{pid}` | Bearer token, roles: customer, corporate |
| 18 | GET | `/api/payments/{pid}/checkout` | Bearer token, roles: customer, corporate |
| 19 | POST | `/api/payments/{pid}/verify` | Public (no token) |
| 20 | POST | `/api/payments/webhook` | Public (no token) |
| 21 | GET | `/api/invoices/{booking_id}` | Bearer token (any signed-in user) |
| 22 | GET | `/api/tickets` | Bearer token (any signed-in user) |
| 23 | POST | `/api/tickets` | Bearer token (any signed-in user) |
| 24 | POST | `/api/tickets/{tid}/reply` | Bearer token (any signed-in user) |
| 25 | GET | `/api/notifications` | Bearer token (any signed-in user) |
| 26 | POST | `/api/notifications/read` | Bearer token (any signed-in user) |
| 27 | GET | `/api/files/{doc_id}` | Bearer token (any signed-in user) |
| 28 | GET | `/api/driver/profile` | Bearer token, roles: driver |
| 29 | PUT | `/api/driver/profile` | Bearer token, roles: driver |
| 30 | POST | `/api/driver/submit` | Bearer token, roles: driver |
| 31 | POST | `/api/driver/documents` | Bearer token, roles: driver |
| 32 | POST | `/api/driver/online` | Bearer token, roles: driver |
| 33 | GET | `/api/driver/offers` | Bearer token, roles: driver |
| 34 | POST | `/api/driver/offers/{offer_id}/accept` | Bearer token, roles: driver |
| 35 | POST | `/api/driver/offers/{offer_id}/decline` | Bearer token, roles: driver |
| 36 | GET | `/api/driver/jobs` | Bearer token, roles: driver |
| 37 | GET | `/api/driver/jobs/{booking_id}` | Bearer token, roles: driver |
| 38 | POST | `/api/driver/jobs/{booking_id}/arrive` | Bearer token, roles: driver |
| 39 | POST | `/api/driver/jobs/{booking_id}/start` | Bearer token, roles: driver |
| 40 | POST | `/api/driver/jobs/{booking_id}/complete` | Bearer token, roles: driver |
| 41 | POST | `/api/driver/jobs/{booking_id}/event` | Bearer token, roles: driver |
| 42 | GET | `/api/driver/earnings` | Bearer token, roles: driver |
| 43 | GET | `/api/admin/dashboard` | Bearer token, roles: owner, super_admin, ops, verification, support, finance |
| 44 | GET | `/api/admin/drivers` | Bearer token, roles: owner, super_admin, ops, verification |
| 45 | GET | `/api/admin/drivers/{user_id}` | Bearer token, roles: owner, super_admin, ops, verification |
| 46 | POST | `/api/admin/drivers/{user_id}/status` | Bearer token, roles: owner, super_admin, ops, verification |
| 47 | POST | `/api/admin/drivers/{user_id}/documents/{doc_id}` | Bearer token, roles: owner, super_admin, ops, verification |
| 48 | GET | `/api/admin/customers` | Bearer token, roles: owner, super_admin, ops, support |
| 49 | GET | `/api/admin/customers/{uid}` | Bearer token, roles: owner, super_admin, ops, support |
| 50 | POST | `/api/admin/customers/{uid}/restrict` | Bearer token, roles: owner, super_admin, ops |
| 51 | GET | `/api/admin/bookings` | Bearer token, roles: owner, super_admin, ops, support |
| 52 | GET | `/api/admin/bookings/export.csv` | Bearer token, roles: owner, super_admin, finance |
| 53 | GET | `/api/admin/bookings/{bid}` | Bearer token, roles: owner, super_admin, ops, support |
| 54 | POST | `/api/admin/bookings/{bid}/assign` | Bearer token, roles: owner, super_admin, ops |
| 55 | POST | `/api/admin/bookings/{bid}/status` | Bearer token, roles: owner, super_admin, ops |
| 56 | POST | `/api/admin/bookings/{bid}/quote` | Bearer token, roles: owner, super_admin, ops |
| 57 | POST | `/api/admin/bookings/{bid}/adjust` | Bearer token, roles: owner, super_admin, finance, ops |
| 58 | POST | `/api/admin/bookings/{bid}/cash` | Bearer token, roles: owner, super_admin, finance |
| 59 | GET | `/api/admin/services` | Bearer token, roles: owner, super_admin, ops, verification, support, finance |
| 60 | PUT | `/api/admin/services/{sid}` | Bearer token, roles: owner, super_admin |
| 61 | GET | `/api/admin/cities` | Bearer token, roles: owner, super_admin, ops, verification, support, finance |
| 62 | PUT | `/api/admin/cities/{cid}` | Bearer token, roles: owner, super_admin |
| 63 | GET | `/api/admin/settings` | Bearer token, roles: owner, super_admin, ops, verification, support, finance |
| 64 | PUT | `/api/admin/settings` | Bearer token, roles: owner, super_admin |
| 65 | GET | `/api/admin/payments` | Bearer token, roles: owner, super_admin, finance |
| 66 | POST | `/api/admin/payments/{pid}/refund` | Bearer token, roles: owner, finance |
| 67 | GET | `/api/admin/expenses` | Bearer token, roles: owner, super_admin, finance |
| 68 | POST | `/api/admin/expenses` | Bearer token, roles: owner, super_admin, finance |
| 69 | GET | `/api/admin/payouts` | Bearer token, roles: owner, super_admin, finance |
| 70 | POST | `/api/admin/payouts` | Bearer token, roles: owner, super_admin, finance |
| 71 | GET | `/api/admin/tickets` | Bearer token, roles: owner, super_admin, ops, support |
| 72 | POST | `/api/admin/tickets/{tid}/reply` | Bearer token, roles: owner, super_admin, ops, support |
| 73 | POST | `/api/admin/tickets/{tid}/status` | Bearer token, roles: owner, super_admin, ops, support |
| 74 | GET | `/api/admin/enquiries` | Bearer token, roles: owner, super_admin, ops, support |
| 75 | POST | `/api/admin/enquiries/{eid}` | Bearer token, roles: owner, super_admin, ops, support |
| 76 | GET | `/api/admin/audit-logs` | Bearer token, roles: owner, super_admin |
| 77 | GET | `/api/admin/owner/overview` | Bearer token, roles: owner, super_admin, finance |
| 78 | GET | `/api/admin/owner/services` | Bearer token, roles: owner, super_admin, finance |
| 79 | GET | `/api/admin/owner/cities` | Bearer token, roles: owner, super_admin, finance |
| 80 | GET | `/api/admin/owner/insights` | Bearer token, roles: owner, super_admin, finance |
| 81 | GET | `/api/admin/owner/actions` | Bearer token, roles: owner, super_admin, finance |
| 82 | POST | `/api/admin/owner/actions` | Bearer token, roles: owner, super_admin, finance |
| 83 | PUT | `/api/admin/owner/actions/{aid}` | Bearer token, roles: owner, super_admin, finance |
| 84 | GET | `/api/admin/staff` | Bearer token, roles: owner, super_admin |
| 85 | POST | `/api/admin/staff` | Bearer token, roles: owner, super_admin |
| 86 | PUT | `/api/admin/staff/{uid}` | Bearer token, roles: owner, super_admin |
| 87 | GET | `/api/admin/licences` | Bearer token, roles: owner, super_admin, ops, verification |
| 88 | POST | `/api/admin/licences/run-check` | Bearer token, roles: owner, super_admin, ops, verification |
| 89 | GET | `/api/admin/staff/performance` | Bearer token, roles: owner, super_admin |
| 90 | GET | `/api/tiles/{z}/{x}/{y}.png` | Public (no token) |
| 91 | POST | `/api/driver/jobs/{booking_id}/location` | Bearer token, roles: driver |
| 92 | POST | `/api/driver/location` | Bearer token, roles: driver |
| 93 | GET | `/api/bookings/{booking_id}/tracking` | Bearer token, roles: customer, corporate |
| 94 | GET | `/api/driver/reviews` | Bearer token, roles: driver |
| 95 | GET | `/api/admin/ratings` | Bearer token, roles: owner, super_admin, ops, verification |
| 96 | POST | `/api/bookings/{booking_id}/share` | Bearer token, roles: customer, corporate |
| 97 | DELETE | `/api/bookings/{booking_id}/share` | Bearer token, roles: customer, corporate |
| 98 | GET | `/api/public/live/{token}` | Public (no token) |
| 99 | GET | `/api/admin/live-drivers` | Bearer token, roles: owner, super_admin, ops, support |
| 100 | GET | `/api/me/contacts` | Bearer token, roles: customer, corporate |
| 101 | PUT | `/api/me/contacts` | Bearer token, roles: customer, corporate |
| 102 | POST | `/api/bookings/{booking_id}/sos` | Bearer token (any signed-in user) |
| 103 | GET | `/api/bookings/{booking_id}/sos` | Bearer token (any signed-in user) |
| 104 | GET | `/api/admin/sos` | Bearer token, roles: owner, super_admin, ops, support |
| 105 | POST | `/api/admin/sos/{alert_id}` | Bearer token, roles: owner, super_admin, ops, support |
| 106 | POST | `/api/auth/session` | Public (no token) |
| 107 | POST | `/api/auth/phone/verify` | Bearer token (any signed-in user) |
| 108 | POST | `/api/register-push` | Bearer token (any signed-in user) |
| 109 | GET | `/api/me/referral` | Bearer token, roles: customer, corporate |
| 110 | GET | `/api/admin/referrals` | Bearer token, roles: owner, super_admin, finance, ops |
| 111 | POST | `/api/admin/referrals/{user_id}/reward` | Bearer token, roles: owner, super_admin, finance |
| 112 | GET | `/api/driver/payout-requests` | Bearer token, roles: driver |
| 113 | POST | `/api/driver/payout-requests` | Bearer token, roles: driver |
| 114 | GET | `/api/admin/payout-requests` | Bearer token, roles: owner, super_admin, finance |
| 115 | POST | `/api/admin/payout-requests/{rid}` | Bearer token, roles: owner, super_admin, finance |
| 116 | GET | `/api/driver/statements/{month}` | Bearer token, roles: driver |
| 117 | GET | `/api/me/vehicles` | Bearer token, roles: customer, corporate |
| 118 | POST | `/api/me/vehicles` | Bearer token, roles: customer, corporate |
| 119 | DELETE | `/api/me/vehicles/{vid}` | Bearer token, roles: customer, corporate |
| 120 | GET | `/api/me/billing` | Bearer token, roles: customer, corporate |
| 121 | PUT | `/api/me/billing` | Bearer token, roles: customer, corporate |
| 122 | POST | `/api/driver/photo` | Bearer token, roles: driver |
| 123 | GET | `/api/driver/photo/file/{photo_id}` | Bearer token (any signed-in user) |
| 124 | GET | `/api/public/driver-photo/{photo_id}` | Public (no token) |
| 125 | POST | `/api/admin/drivers/{user_id}/photo` | Bearer token, roles: owner, super_admin, ops, verification |


## Auth & account

### POST `/api/auth/otp/send`
**Auth:** Public (no token)  
**Request body:**
```json
{
  "phone": "+919876543210"
}
```
**Response (from code):**
```python
return Client(TWILIO_SID, TWILIO_TOKEN).verify.v2.services(TWILIO_VERIFY).verifications.create( to=phone, channel="whatsapp")
return {"channel": "whatsapp", "phone": phone}
return {"channel": "preview", "phone": phone, "dev_code": code}
```
**Errors:** `429` Too many OTP requests. Please wait 10 minutes.; `502` Could not send WhatsApp OTP. Check the number has WhatsApp and try again.

### POST `/api/auth/otp/verify`
**Auth:** Public (no token)  
**Request body:**
```json
{
  "phone": "+919876543210",
  "code": "123456",
  "role": "customer",
  "name": "Ravi Kumar"
}
```
**Response (from code):**
```python
return {"token": make_token(user["id"]), "user": user}
```
**Errors:** `400` Incorrect or expired code; `403` Your account is restricted. Please contact support.

### GET `/api/auth/me`
**Auth:** Bearer token (any signed-in user)  
**Response 200:**
```json
{
  "phone": "+919000000003",
  "city_id": "mumbai",
  "created_at": "2026-10-31T20:39:21.073231+00:00",
  "id": "c21819e6-714a-408a-a015-5d1a63e5927b",
  "is_demo": true,
  "name": "Ananya Shah (Demo Customer)",
  "role": "customer"
}
```

### PUT `/api/auth/me`
**Auth:** Bearer token (any signed-in user)  
**Request body:**
```json
{
  "name": "Ravi Kumar",
  "email": "ravi@example.com",
  "city_id": "mumbai"
}
```
**Response (from code):**
```python
return await db.users.find_one({"id": user["id"]}, {"_id": 0})
```
**Errors:** `400` Enter a valid email address; `400` Your email comes from your Google account and can't be changed here; `409` This email is already used by another account

### GET `/api/me/contacts`
**Auth:** Bearer token, roles: customer, corporate  
**Response 200:**
```json
{
  "contacts": []
}
```

### PUT `/api/me/contacts`
**Auth:** Bearer token, roles: customer, corporate  
**Request body:**
```json
{
  "contacts": [
    {
      "name": "Ravi Kumar",
      "phone": "+919876543210",
      "relation": "relation"
    }
  ]
}
```
**Response (from code):**
```python
return {"contacts": out}
```
**Errors:** `400` Add someone other than yourself; `400` Each contact needs a name; `400` You can save up to 5 trusted contacts

### POST `/api/auth/session`
**Auth:** Public (no token)  
**Request body:**
```json
{
  "session_id": "session id",
  "role": "customer"
}
```
**Response (from code):**
```python
return {"session_token": make_token(user["id"]), "token": make_token(user["id"]), "user": user}
```
**Errors:** `401` Google account has no email; `401` Google sign-in expired. Please try again.; `401` Missing session; `403` Staff accounts sign in with their mobile number.; `403` Your account is restricted. Please contact support.; `502` Google sign-in is unavailable right now. Try phone login.

### POST `/api/auth/phone/verify`
**Auth:** Bearer token (any signed-in user)  
**Request body:**
```json
{
  "phone": "+919876543210",
  "code": "123456"
}
```
**Response (from code):**
```python
return await db.users.find_one({"id": user["id"]}, {"_id": 0})
```
**Errors:** `400` Incorrect or expired code; `409` This number already has a Prajeta account. Log in with the number instead.

### POST `/api/register-push`
**Auth:** Bearer token (any signed-in user)  
**Request body:**
```json
{
  "user_id": "user id",
  "platform": "platform",
  "device_token": "device token"
}
```
**Response (from code):**
```python
return {"status": "registered"}
```
**Errors:** `400` Could not register this device for notifications; `400` Unsupported platform; `403` Cannot register push for another user; `500` EMERGENT_PUSH_KEY missing or invalid; `502` Push provider unavailable

### GET `/api/me/referral`
**Auth:** Bearer token, roles: customer, corporate  
**Response 200:**
```json
{
  "code": "PRJLVZ5U",
  "friend_amount": 10000,
  "referrer_amount": 10000,
  "credit": 0,
  "earned": 0,
  "friends_joined": 0,
  "friends_completed": 0
}
```

### GET `/api/me/vehicles`
**Auth:** Bearer token, roles: customer, corporate  
**Response 200:**
```json
{
  "items": []
}
```

### POST `/api/me/vehicles`
**Auth:** Bearer token, roles: customer, corporate  
**Request body:**
```json
{
  "reg_number": "reg number",
  "make": "make",
  "model": "model",
  "body_type": "Sedan",
  "transmission": "Manual",
  "fuel": "fuel",
  "color": "color",
  "insurance_expiry": "insurance expiry",
  "fastag": false
}
```
**Response (from code):**
```python
return v
```
**Errors:** `400` Choose a valid body type and transmission; `400` Enter a valid Indian registration number, e.g. MH01AB1234; `400` Make and model are required; `400` You can save up to 10 vehicles; `409` This vehicle is already in your garage

### DELETE `/api/me/vehicles/{vid}`
**Auth:** Bearer token, roles: customer, corporate  
**Path params:** `vid`  
**Response (from code):**
```python
return {"ok": True}
```
**Errors:** `404` Vehicle not found

### GET `/api/me/billing`
**Auth:** Bearer token, roles: customer, corporate  
**Response 200:**
```json
{
  "billing": null
}
```

### PUT `/api/me/billing`
**Auth:** Bearer token, roles: customer, corporate  
**Request body:**
```json
{
  "company_name": "company name",
  "gstin": "gstin",
  "address": "address"
}
```
**Response (from code):**
```python
return {"billing": None}
return {"billing": billing}
```
**Errors:** `400` Company name is required for GST invoices; `400` Enter a valid 15-character GSTIN


## Public (no login)

### GET `/api/public/config`
**Auth:** Public (no token)  
**Response 200:**
```json
{
  "settings": {
    "company_name": "Prajeta",
    "legal_name": "Prajeta Driver Services (to be configured)",
    "tagline": "Find a Trusted Driver, Wherever You Need One.",
    "support_phone": "+91 90000 00000",
    "support_email": "support@prajeta.in",
    "whatsapp_link": "https://api.whatsapp.com/message/IPGR6FOC57DXM1?autoload=1&app_absent=0",
    "business_hours": "7 AM – 11 PM, all days",
    "address": "India",
    "currency": "INR",
    "tax_rate": 18,
    "advance_percent": 20,
    "cash_enabled": true,
    "bookings_enabled": true,
    "pages": null
  },
  "cities": [
    {
      "id": "bengaluru",
      "areas": [
        "Whitefield",
        "... (4 more)"
      ],
      "enabled": true,
      "multiplier": 1.1,
      "name": "Bengaluru",
      "state": "Karnataka"
    },
    "... (4 more)"
  ],
  "services": [
    {
      "id": "hourly",
      "active": true,
      "base_fare": 39900,
      "base_hours": 2,
      "cancellation_fee": 15000,
      "effective_from": "2026-01-01",
      "extra_hour_rate": 15000,
      "icon": "time-outline",
      "max_hours": 7,
      "min_hours": 2,
      "name": "Hourly Driver",
      "night_surcharge": 20000,
      "order": 0,
      "per_day": 0,
      "pricing_mode": "hourly",
      "tagline": "A verified driver for a few hours — errands, meetings, shopping.",
      "tariff_version": 1,
      "terms": [
        "Customer provides a road-worthy, insured vehicle with valid documents.",
        "... (3 more)"
      ],
      "...": "1 more fields"
    },
    "... (8 more)"
  ],
  "faqs": [
    {
      "q": "Do you provide the car?",
      "a": "No. Prajeta provides professional drivers for your own vehic...(truncated)"
    },
    "... (5 more)"
  ],
  "payments_enabled": false,
  "otp_channel": "preview"
}
```

### POST `/api/public/fare-estimate`
**Auth:** Optional/inline token check (see code)  
**Request body:**
```json
{
  "service_id": "SERVICE_ID",
  "city_id": "mumbai",
  "date": "2026-11-05",
  "time": "10:00",
  "hours": 0,
  "days": 1,
  "coupon": "coupon"
}
```
**Response (from code):**
```python
return await compute_fare(s, c, body.hours, body.days, body.time, body.coupon, user)
```

### POST `/api/public/enquiry`
**Auth:** Public (no token)  
**Request body:**
```json
{
  "type": "type",
  "name": "Ravi Kumar",
  "phone": "+919876543210",
  "email": "ravi@example.com",
  "company": "company",
  "city_id": "mumbai",
  "drivers_needed": 1,
  "message": "Hello"
}
```
**Response (from code):**
```python
return {"ref": doc["ref"]}
```
**Errors:** `400` Please enter your name

### GET `/api/public/track/{ref}`
**Auth:** Public (no token)  
**Path params:** `ref`  
**Query params:** `phone` (required)  
**Response (from code):**
```python
return {k: b.get(k) for k in ("ref", "service_name", "city_id", "date", "time", "status", "payment_status")}
```
**Errors:** `404` No booking found for this reference and mobile number

### GET `/api/tiles/{z}/{x}/{y}.png`
**Auth:** Public (no token)  
**Path params:** `z`, `x`, `y`  
**Response:** Returns image/png map tile (not JSON).
**Errors:** `404` Tile not found; `502` Map tile unavailable

### GET `/api/public/live/{token}`
_Public, no login: limited trip info for family — no phone numbers, OTP or full address._  
**Auth:** Public (no token)  
**Path params:** `token`  
**Response (from code):**
```python
return {**base, "ended": True, "active": False}
return {**base, "ended": False, "driver_info": driver, "sos_active": bool(b.get("sos_active")), **t}
```
**Errors:** `404` This trip link is invalid or has been turned off

### GET `/api/public/driver-photo/{photo_id}`
_Approved photos only — shown to customers on their booking._  
**Auth:** Public (no token)  
**Path params:** `photo_id`  
**Response:** Returns image/file bytes (not JSON).
**Errors:** `404` Photo not found


## Customer bookings, payments & support

### GET `/api/bookings`
**Auth:** Bearer token, roles: customer, corporate  
**Response 200:**
```json
[]
```

### POST `/api/bookings`
**Auth:** Bearer token, roles: customer, corporate  
**Request body:**
```json
{
  "service_id": "SERVICE_ID",
  "city_id": "mumbai",
  "pickup": "pickup",
  "destination": "destination",
  "date": "2026-11-05",
  "time": "09:30",
  "hours": 0,
  "days": 1,
  "vehicle_type": "Sedan",
  "transmission": "Manual",
  "notes": "notes",
  "coupon": "coupon",
  "contact_name": "contact name",
  "vehicle_id": "vehicle id",
  "idempotency_key": "idempotency key"
}
```
**Response (from code):**
```python
return customer_view(existing)
return customer_view(b)
```
**Errors:** `400` Add your mobile number in Profile before booking — your driver and our safety team need it.; `400` Choose today or a future date; `400` Please enter the pickup address; `400` That time has already passed today — please pick a later slot; `409` Your referral credit changed — please review the fare and try again; `503` New bookings are paused right now. Please contact support.

### GET `/api/bookings/pending-review`
_Most recent completed trip (last 14 days) the customer has not rated yet — drives the auto rating card._  
**Auth:** Bearer token, roles: customer, corporate  
**Response 200:**
```json
{
  "booking": null
}
```

### GET `/api/bookings/{booking_id}`
**Auth:** Bearer token, roles: customer, corporate  
**Path params:** `booking_id`  
**Response (from code):**
```python
return {**customer_view(b), "events": events, "payments": payments, "review": review, "driver": driver}
```

### POST `/api/bookings/{booking_id}/cancel`
**Auth:** Bearer token, roles: customer, corporate  
**Path params:** `booking_id`  
**Request body:**
```json
{
  "reason": "Plans changed"
}
```
**Response (from code):**
```python
return {"ok": True}
```
**Errors:** `400` This booking can no longer be cancelled

### POST `/api/bookings/{booking_id}/reschedule`
**Auth:** Bearer token, roles: customer, corporate  
**Path params:** `booking_id`  
**Request body:**
```json
{
  "date": "2026-11-05",
  "time": "09:30"
}
```
**Response (from code):**
```python
return {"ok": True}
```
**Errors:** `400` A driver is already assigned. Please contact support to reschedule.; `400` Choose today or a future date

### POST `/api/bookings/{booking_id}/review`
**Auth:** Bearer token, roles: customer, corporate  
**Path params:** `booking_id`  
**Request body:**
```json
{
  "rating": 5,
  "comment": "Great driver",
  "tags": [
    "tags"
  ]
}
```
**Response (from code):**
```python
return {"ok": True}
```
**Errors:** `400` Rating must be 1 to 5; `400` You can rate after the trip is completed; `400` You have already rated this trip

### POST `/api/payments/create`
**Auth:** Bearer token, roles: customer, corporate  
**Request body:**
```json
{
  "booking_id": "BOOKING_ID"
}
```
**Response (from code):**
```python
return {**pay_view(p), "checkout_path": f"/api/payments/{p['id']}/checkout?token={token}"}
```
**Errors:** `400` Nothing to pay for this booking right now; `502` Payment gateway is unavailable. Please try again.

### GET `/api/payments/{pid}`
**Auth:** Bearer token, roles: customer, corporate  
**Path params:** `pid`  
**Response (from code):**
```python
return pay_view(p)
```
**Errors:** `404` Payment not found

### GET `/api/payments/{pid}/checkout`
**Auth:** Bearer token, roles: customer, corporate  
**Path params:** `pid`  
**Response:** Returns HTML page that opens Razorpay checkout (not JSON).

### POST `/api/payments/{pid}/verify`
**Auth:** Public (no token)  
**Path params:** `pid`  
**Request body:**
```json
{
  "razorpay_payment_id": "razorpay payment id",
  "razorpay_order_id": "razorpay order id",
  "razorpay_signature": "razorpay signature"
}
```
**Response (from code):**
```python
return {"ok": True}
```
**Errors:** `400` Invalid payment signature; `400` Order mismatch

### POST `/api/payments/webhook`
**Auth:** Public (no token)  
**Response (from code):**
```python
return {"ok": True, "duplicate": True}
return {"ok": True}
```
**Errors:** `400` Invalid webhook signature; `503` Webhook not configured

### GET `/api/invoices/{booking_id}`
**Auth:** Bearer token (any signed-in user)  
**Path params:** `booking_id`  
**Response:** Returns HTML/PDF document (not JSON).
**Errors:** `404` Invoice not found

### GET `/api/tickets`
**Auth:** Bearer token (any signed-in user)  
**Response 200:**
```json
[]
```

### POST `/api/tickets`
**Auth:** Bearer token (any signed-in user)  
**Request body:**
```json
{
  "subject": "Help needed",
  "message": "Hello",
  "category": "general",
  "booking_id": "BOOKING_ID"
}
```
**Response (from code):**
```python
return t
```
**Errors:** `400` Please add a subject and message; `404` Booking not found

### POST `/api/tickets/{tid}/reply`
**Auth:** Bearer token (any signed-in user)  
**Path params:** `tid`  
**Request body:**
```json
{
  "text": "text"
}
```
**Response (from code):**
```python
return {"ok": True}
```
**Errors:** `404` Ticket not found

### GET `/api/notifications`
**Auth:** Bearer token (any signed-in user)  
**Response 200:**
```json
{
  "items": [],
  "unread": 0
}
```

### POST `/api/notifications/read`
**Auth:** Bearer token (any signed-in user)  
**Response (from code):**
```python
return {"ok": True}
```

### GET `/api/files/{doc_id}`
_Private driver documents: owner driver or verification/admin staff only._  
**Auth:** Bearer token (any signed-in user)  
**Path params:** `doc_id`  
**Response:** Returns image/file bytes (not JSON).
**Errors:** `404` File not found; `404` No file uploaded for this document

### GET `/api/bookings/{booking_id}/tracking`
**Auth:** Bearer token, roles: customer, corporate  
**Path params:** `booking_id`  
**Response (from code):**
```python
return await tracking_payload(b)
```
**Errors:** `404` Booking not found

### POST `/api/bookings/{booking_id}/share`
**Auth:** Bearer token, roles: customer, corporate  
**Path params:** `booking_id`  
**Response (from code):**
```python
return {"token": token, "path": f"/live/{token}"}
```
**Errors:** `400` You can share a trip once the booking is confirmed and until it ends; `404` Booking not found

### DELETE `/api/bookings/{booking_id}/share`
**Auth:** Bearer token, roles: customer, corporate  
**Path params:** `booking_id`  
**Response (from code):**
```python
return {"ok": True}
```
**Errors:** `404` Booking not found

### POST `/api/bookings/{booking_id}/sos`
**Auth:** Bearer token (any signed-in user)  
**Path params:** `booking_id`  
**Request body:**
```json
{
  "note": "Note",
  "lat": 19.076,
  "lng": 72.8777
}
```
**Response (from code):**
```python
return {**(existing or alert), "duplicate": True}
return {**alert, "share_token": token, "contacts": (u or {}).get("trusted_contacts") or []}
return alert
```
**Errors:** `400` SOS is available during live trips. For emergencies call 112.; `403` Only the customer or driver of this trip can raise SOS; `404` Booking not found

### GET `/api/bookings/{booking_id}/sos`
**Auth:** Bearer token (any signed-in user)  
**Path params:** `booking_id`  
**Response (from code):**
```python
return {"alert": a}
```
**Errors:** `404` Booking not found


## Driver app

### GET `/api/driver/profile`
**Auth:** Bearer token, roles: driver  
**Response 200:**
```json
{
  "user_id": "7c6cacf7-c7eb-4f37-bdbe-f1c04555e58e",
  "address": "Andheri East, Mumbai",
  "areas": [
    "Andheri",
    "... (2 more)"
  ],
  "availability": "Full time",
  "city_id": "mumbai",
  "consent": true,
  "created_at": "2026-10-31T20:39:21.074099+00:00",
  "documents": [
    {
      "id": "c62d86d2-758a-4d96-91df-443e3ef1de06",
      "doc_type": "licence",
      "number": "MH0220150012345",
      "expiry": "2031-05-30",
      "verified": true,
      "name": "licence (demo)",
      "uploaded_at": "2026-10-31T20:39:21.074086+00:00",
      "has_file": false
    },
    "... (1 more)"
  ],
  "experience_years": 9,
  "id": "05a3caaa-c68e-4963-988c-8385c5ec4ec3",
  "is_demo": true,
  "licence_expiry": "2031-05-30",
  "licence_number": "MH0220150012345",
  "name": "Ravi Kumar (Demo Driver)",
  "online": true,
  "payout_upi": "ravi@upi",
  "phone": "+919000000002",
  "police_verification": "CLEARED",
  "...": "8 more fields"
}
```

### PUT `/api/driver/profile`
**Auth:** Bearer token, roles: driver  
**Request body:**
```json
{
  "name": "Ravi Kumar",
  "address": "address",
  "city_id": "mumbai",
  "areas": [
    "areas"
  ],
  "experience_years": 1,
  "licence_number": "licence number",
  "licence_expiry": "licence expiry",
  "vehicle_types": [
    "vehicle types"
  ],
  "transmissions": [
    "transmissions"
  ],
  "services": [
    "services"
  ],
  "availability": "availability",
  "payout_upi": "payout upi",
  "payout_bank": "payout bank",
  "consent": true
}
```
**Response (from code):**
```python
return public_profile(await db.driver_profiles.find_one({"user_id": user["id"]}, {"_id": 0}))
```
**Errors:** `400` Licence details can only be changed through support after submission

### POST `/api/driver/submit`
**Auth:** Bearer token, roles: driver  
**Response (from code):**
```python
return {"status": "SUBMITTED"}
```
**Errors:** `400` Add and verify your mobile number in Profile before submitting; `400` Application already submitted; `400` Please accept the declarations and consent; `400` Please complete: ; `400` Upload both your driving licence and an identity document

### POST `/api/driver/documents`
**Auth:** Bearer token, roles: driver  
**Request (multipart/form-data):** fields `doc_type`, `number`, `expiry`, `file`
**Response (from code):**
```python
return {k: v for k, v in doc.items() if k != "path"}
```
**Errors:** `400` Enter the renewed licence's future expiry date (YYYY-MM-DD); `400` File too large (max 8 MB); `400` This document has already expired. Upload a currently valid copy.; `400` Unknown document type; `400` Upload a JPG, PNG, WEBP or PDF file

### POST `/api/driver/online`
**Auth:** Bearer token, roles: driver  
**Request body:**
```json
{
  "online": true
}
```
**Response (from code):**
```python
return {"online": body.online}
```
**Errors:** `400` Some documents have expired (; `400` You can go online after your profile is approved; `400` Your licence has expired. Upload your renewed licence to go online.

### GET `/api/driver/offers`
**Auth:** Bearer token, roles: driver  
**Response 200:**
```json
[]
```

### POST `/api/driver/offers/{offer_id}/accept`
**Auth:** Bearer token, roles: driver  
**Path params:** `offer_id`  
**Response (from code):**
```python
return await booking_brief(claimed, full=True)
```
**Errors:** `400` This offer is no longer available; `409` Another driver already accepted this booking

### POST `/api/driver/offers/{offer_id}/decline`
**Auth:** Bearer token, roles: driver  
**Path params:** `offer_id`  
**Response (from code):**
```python
return {"ok": True}
```
**Errors:** `400` This offer is no longer available

### GET `/api/driver/jobs`
**Auth:** Bearer token, roles: driver  
**Response 200:**
```json
[
  {
    "id": "985809ed-6b4a-4dc0-8494-b4f70f502a09",
    "ref": "PRJ-7BPZZEK6",
    "service_id": "pickup-drop",
    "service_name": "Pickup & Drop",
    "city_id": "mumbai",
    "date": "2026-10-30",
    "time": "10:00",
    "hours": 3,
    "days": 1,
    "status": "COMPLETED",
    "vehicle_type": "Sedan",
    "transmission": "Manual",
    "notes": null,
    "driver_payout": 45430,
    "pickup_area": "Demo address",
    "destination": "",
    "started_at": null,
    "completed_at": "2026-10-30T12:39:21.171756+00:00",
    "...": "2 more fields"
  },
  "... (5 more)"
]
```

### GET `/api/driver/jobs/{booking_id}`
**Auth:** Bearer token, roles: driver  
**Path params:** `booking_id`  
**Response (from code):**
```python
return {**(await booking_brief(b, full=True)), "events": events, "vehicle": b.get("vehicle"), "end_pin_required": bool(b.get("end_otp"))}
```

### POST `/api/driver/jobs/{booking_id}/arrive`
**Auth:** Bearer token, roles: driver  
**Path params:** `booking_id`  
**Response (from code):**
```python
return await booking_brief(b, full=True)
```

### POST `/api/driver/jobs/{booking_id}/start`
**Auth:** Bearer token, roles: driver  
**Path params:** `booking_id`  
**Request body:**
```json
{
  "otp": "4821"
}
```
**Response (from code):**
```python
return await booking_brief(b, full=True)
```
**Errors:** `400` Incorrect OTP. Ask the customer for the 4-digit trip OTP.; `400` Mark arrival before starting the trip

### POST `/api/driver/jobs/{booking_id}/complete`
**Auth:** Bearer token, roles: driver  
**Path params:** `booking_id`  
**Request body:**
```json
{
  "cash_collected": false,
  "end_pin": "end pin"
}
```
**Response (from code):**
```python
return await booking_brief(await db.bookings.find_one({"id": booking_id}, {"_id": 0}), full=True)
```
**Errors:** `400` Wrong handover PIN. Ask the customer for the trip-end PIN shown in their app.

### POST `/api/driver/jobs/{booking_id}/event`
**Auth:** Bearer token, roles: driver  
**Path params:** `booking_id`  
**Request body:**
```json
{
  "type": "type",
  "note": "Note"
}
```
**Response (from code):**
```python
return {"ok": True}
```
**Errors:** `400` Unknown event

### GET `/api/driver/earnings`
_Wallet: totals, today/week/month, 14-day daily chart, per-trip history (base + adjustment + badge bonus), payouts._  
**Auth:** Bearer token, roles: driver  
**Response 200:**
```json
{
  "total_earned": 434070,
  "total_paid": 450000,
  "pending": 0,
  "items": [
    {
      "booking_id": "985809ed-6b4a-4dc0-8494-b4f70f502a09",
      "ref": "PRJ-7BPZZEK6",
      "service_name": "Pickup & Drop",
      "date": "2026-10-30",
      "completed_at": "2026-10-30T12:39:21.171756+00:00",
      "amount": 45430,
      "base": 45430,
      "adjustment": 0,
      "bonus": 0,
      "badge": null
    },
    "... (5 more)"
  ],
  "payouts": [
    {
      "id": "26a1f7df-8375-47d4-8e34-f11166c1859d",
      "driver_id": "7c6cacf7-c7eb-4f37-bdbe-f1c04555e58e",
      "amount": 450000,
      "reference": "UPI-DEMO-0001",
      "status": "PAID",
      "is_demo": true,
      "created_at": "2026-10-24T20:39:21.201451+00:00"
    }
  ],
  "bonus_total": 0,
  "periods": {
    "today": 0,
    "week": 45430,
    "month": 0
  },
  "daily": [
    {
      "date": "2026-10-19",
      "amount": 83930,
      "trips": 1
    },
    "... (13 more)"
  ],
  "badge": null,
  "bonus_rates": {
    "top": 5000,
    "gold": 10000
  },
  "payout_method": "ravi@upi"
}
```

### POST `/api/driver/jobs/{booking_id}/location`
**Auth:** Bearer token, roles: driver  
**Path params:** `booking_id`  
**Request body:**
```json
{
  "lat": 19.076,
  "lng": 72.8777,
  "heading": 1.0,
  "speed": 1.0,
  "accuracy": 1.0
}
```
**Response (from code):**
```python
return {"ok": True}
```
**Errors:** `400` Invalid location; `400` Location sharing is only for active trips; `404` Job not found

### POST `/api/driver/location`
_While online (no active trip) — lets dispatch see who is nearest._  
**Auth:** Bearer token, roles: driver  
**Request body:**
```json
{
  "lat": 19.076,
  "lng": 72.8777,
  "heading": 1.0,
  "speed": 1.0,
  "accuracy": 1.0
}
```
**Response (from code):**
```python
return {"ok": True}
```
**Errors:** `400` Go online to share your location with dispatch; `400` Invalid location

### GET `/api/driver/reviews`
**Auth:** Bearer token, roles: driver  
**Response 200:**
```json
{
  "average": 4.3,
  "count": 6,
  "distribution": {
    "1": 0,
    "2": 0,
    "3": 1,
    "4": 2,
    "5": 3
  },
  "top_tags": [],
  "recent": [
    {
      "rating": 5,
      "comment": "",
      "tags": [],
      "created_at": "2026-10-30T12:39:21.171756+00:00"
    },
    "... (5 more)"
  ],
  "badge": null,
  "badge_label": null,
  "next_badge": {
    "key": "top",
    "label": "Top Rated",
    "min_rating": 4.5,
    "min_reviews": 5,
    "reviews_needed": 0,
    "rating_ok": false
  },
  "priority_minutes": 3
}
```

### GET `/api/driver/payout-requests`
**Auth:** Bearer token, roles: driver  
**Response 200:**
```json
{
  "items": [],
  "earned": 434070,
  "paid": 450000,
  "pending": 0,
  "open": null
}
```

### POST `/api/driver/payout-requests`
**Auth:** Bearer token, roles: driver  
**Request body:**
```json
{
  "amount": 50000,
  "note": "Note"
}
```
**Response (from code):**
```python
return clean(doc)
```
**Errors:** `400` Add your UPI ID or bank details in your driver profile first; `400` Minimum payout request is ₹100; `400` You already have a payout request waiting for approval

### GET `/api/driver/statements/{month}`
**Auth:** Bearer token, roles: driver  
**Path params:** `month`  
**Response:** Returns HTML/PDF document (not JSON).
**Errors:** `400` Month must look like 2026-06; `400` Statements are available for past and current months

### POST `/api/driver/photo`
**Auth:** Bearer token, roles: driver  
**Request (multipart/form-data):** fields `file`
**Response (from code):**
```python
return photo_view(photo)
```
**Errors:** `400` Photo too large (max 8 MB); `400` Upload a JPG, PNG or WEBP photo; `404` Driver profile not found

### GET `/api/driver/photo/file/{photo_id}`
_Any photo (incl. pending) for the driver themself or verification staff._  
**Auth:** Bearer token (any signed-in user)  
**Path params:** `photo_id`  
**Response:** Returns image/file bytes (not JSON).


## Admin / ERP (staff)

### GET `/api/admin/dashboard`
**Auth:** Bearer token, roles: owner, super_admin, ops, verification, support, finance  
**Query params:** `period`, `city_id`, `service_id`, `start`, `end`  
**Response 200:**
```json
{
  "bookings": 25,
  "completed": 19,
  "cancelled": 0,
  "active": 6,
  "completion_rate": 76.0,
  "cancellation_rate": 0.0,
  "gbv": 2682258,
  "revenue": 1639100,
  "collections": 1939516,
  "receivables": 144244,
  "payouts": 1147369,
  "gateway_fees": 23359,
  "refunds": 0,
  "contribution": 468372,
  "contribution_margin": 28.6,
  "opex": 10700000,
  "operating_profit": -10231628,
  "avg_booking_value": 107290,
  "...": "23 more fields"
}
```

### GET `/api/admin/drivers`
**Auth:** Bearer token, roles: owner, super_admin, ops, verification  
**Query params:** `status`, `q`, `city_id`, `photo_status`  
**Response 200:**
```json
[
  {
    "user_id": "387598ae-2f26-461c-a9c9-20138c36f040",
    "address": "Bengaluru",
    "areas": [],
    "availability": "Full time",
    "city_id": "bengaluru",
    "consent": true,
    "created_at": "2026-10-31T20:39:21.100081+00:00",
    "documents": [
      {
        "id": "76faf855-36de-4517-a92a-9b7e74d5e6a1",
        "doc_type": "licence",
        "number": "DL520190005",
        "expiry": "2030-01-01",
        "verified": false,
        "name": "licence (demo)",
        "uploaded_at": "2026-10-31T20:39:21.100077+00:00",
        "has_file": false
      }
    ],
    "experience_years": 9,
    "id": "d6ba89d5-98a8-4cac-b27d-ed634fb727da",
    "is_demo": true,
    "licence_expiry": "2030-01-01",
    "licence_number": "DL520190005",
    "name": "Demo Driver 6",
    "online": false,
    "phone": "+917000000005",
    "police_verification": "PENDING",
    "rating": 4.2,
    "...": "2 more fields"
  },
  "... (6 more)"
]
```

### GET `/api/admin/drivers/{user_id}`
**Auth:** Bearer token, roles: owner, super_admin, ops, verification  
**Path params:** `user_id`  
**Response 200:**
```json
{
  "user_id": "7c6cacf7-c7eb-4f37-bdbe-f1c04555e58e",
  "address": "Andheri East, Mumbai",
  "areas": [
    "Andheri",
    "... (2 more)"
  ],
  "availability": "Full time",
  "city_id": "mumbai",
  "consent": true,
  "created_at": "2026-10-31T20:39:21.074099+00:00",
  "documents": [
    {
      "id": "c62d86d2-758a-4d96-91df-443e3ef1de06",
      "doc_type": "licence",
      "number": "MH0220150012345",
      "expiry": "2031-05-30",
      "verified": true,
      "name": "licence (demo)",
      "uploaded_at": "2026-10-31T20:39:21.074086+00:00",
      "has_file": false
    },
    "... (1 more)"
  ],
  "experience_years": 9,
  "id": "05a3caaa-c68e-4963-988c-8385c5ec4ec3",
  "is_demo": true,
  "licence_expiry": "2031-05-30",
  "licence_number": "MH0220150012345",
  "name": "Ravi Kumar (Demo Driver)",
  "online": true,
  "payout_upi": "ravi@upi",
  "phone": "+919000000002",
  "police_verification": "CLEARED",
  "...": "15 more fields"
}
```
**Errors:** `404` Driver not found

### POST `/api/admin/drivers/{user_id}/status`
**Auth:** Bearer token, roles: owner, super_admin, ops, verification  
**Path params:** `user_id`  
**Request body:**
```json
{
  "status": "approved",
  "reason": "Plans changed"
}
```
**Response (from code):**
```python
return {"ok": True}
```
**Errors:** `400` Invalid status; `400` Licence has expired; `400` Please record a reason; `400` Verify the driving licence document before approving; `404` Driver not found

### POST `/api/admin/drivers/{user_id}/documents/{doc_id}`
**Auth:** Bearer token, roles: owner, super_admin, ops, verification  
**Path params:** `user_id`, `doc_id`  
**Request body:**
```json
{
  "verified": true,
  "expiry": "expiry",
  "police_verification": "police verification"
}
```
**Response (from code):**
```python
return {"ok": True}
```
**Errors:** `400` Enter the renewed licence's valid future expiry date; `404` Document not found; `404` Driver not found

### GET `/api/admin/customers`
**Auth:** Bearer token, roles: owner, super_admin, ops, support  
**Query params:** `q`  
**Response 200:**
```json
[
  {
    "phone": "+919000000003",
    "city_id": "mumbai",
    "created_at": "2026-10-31T20:39:21.073231+00:00",
    "id": "c21819e6-714a-408a-a015-5d1a63e5927b",
    "is_demo": true,
    "name": "Ananya Shah (Demo Customer)",
    "role": "customer",
    "referral_code": "PRJLVZ5U",
    "bookings": 0
  },
  "... (18 more)"
]
```

### GET `/api/admin/customers/{uid}`
**Auth:** Bearer token, roles: owner, super_admin, ops, support  
**Path params:** `uid`  
**Response 200:**
```json
{
  "phone": "+919000000003",
  "city_id": "mumbai",
  "created_at": "2026-10-31T20:39:21.073231+00:00",
  "id": "c21819e6-714a-408a-a015-5d1a63e5927b",
  "is_demo": true,
  "name": "Ananya Shah (Demo Customer)",
  "role": "customer",
  "referral_code": "PRJLVZ5U",
  "booking_list": [],
  "tickets": []
}
```
**Errors:** `404` Customer not found

### POST `/api/admin/customers/{uid}/restrict`
**Auth:** Bearer token, roles: owner, super_admin, ops  
**Path params:** `uid`  
**Request body:**
```json
{
  "restricted": true,
  "reason": "Plans changed"
}
```
**Response (from code):**
```python
return {"ok": True}
```

### GET `/api/admin/bookings`
**Auth:** Bearer token, roles: owner, super_admin, ops, support  
**Query params:** `status`, `q`, `city_id`, `service_id`, `payment_status`, `date`  
**Response 200:**
```json
[
  {
    "id": "5af6bf06-b9a9-4f8a-918f-8817aba73a4f",
    "ref": "PRJ-RLUJS4HW",
    "customer_id": "0da24de5-d199-4424-8065-42f74e164809",
    "customer_name": "Demo Customer 8",
    "customer_phone": "+918000000007",
    "service_id": "pickup-drop",
    "service_name": "Pickup & Drop",
    "city_id": "pune",
    "pickup": "Demo address",
    "destination": "",
    "date": "2026-11-01",
    "time": "10:00",
    "hours": 3,
    "days": 1,
    "vehicle_type": "Sedan",
    "transmission": "Manual",
    "fare": {
      "subtotal": 79900,
      "discount": 0,
      "tax": 14382,
      "total": 94282,
      "advance": 18856,
      "tax_rate": 18,
      "advance_percent": 20,
      "hours": 3,
      "lines": [],
      "tariff_version": 1
    },
    "driver_payout": 55930,
    "...": "13 more fields"
  },
  "... (69 more)"
]
```

### GET `/api/admin/bookings/export.csv`
**Auth:** Bearer token, roles: owner, super_admin, finance  
**Response:** Returns text/csv file (not JSON).

### GET `/api/admin/bookings/{bid}`
**Auth:** Bearer token, roles: owner, super_admin, ops, support  
**Path params:** `bid`  
**Response 200:**
```json
{
  "id": "f8d038d5-d003-4cab-8140-1e2fcd99139f",
  "ref": "PRJ-Y3GFV3TP",
  "customer_id": "0da24de5-d199-4424-8065-42f74e164809",
  "customer_name": "Demo Customer 8",
  "customer_phone": "+918000000007",
  "service_id": "hourly",
  "service_name": "Hourly Driver",
  "city_id": "bengaluru",
  "pickup": "Demo address",
  "destination": "",
  "date": "2026-10-03",
  "time": "10:00",
  "hours": 2,
  "days": 1,
  "vehicle_type": "Sedan",
  "transmission": "Manual",
  "fare": {
    "subtotal": 39900,
    "discount": 0,
    "tax": 7182,
    "total": 47082,
    "advance": 9416,
    "tax_rate": 18,
    "advance_percent": 20,
    "hours": 2,
    "lines": [],
    "tariff_version": 1
  },
  "driver_payout": 27930,
  "...": "17 more fields"
}
```
**Errors:** `404` Booking not found

### POST `/api/admin/bookings/{bid}/assign`
**Auth:** Bearer token, roles: owner, super_admin, ops  
**Path params:** `bid`  
**Request body:**
```json
{
  "driver_id": "driver id"
}
```
**Response (from code):**
```python
return {"ok": True}
```
**Errors:** `400` Booking cannot be assigned in its current status; `404` Driver not found

### POST `/api/admin/bookings/{bid}/status`
**Auth:** Bearer token, roles: owner, super_admin, ops  
**Path params:** `bid`  
**Request body:**
```json
{
  "status": "approved",
  "reason": "Plans changed"
}
```
**Response (from code):**
```python
return {"ok": True}
```
**Errors:** `400` Please record a reason; `400` Status not permitted; `404` Booking not found

### POST `/api/admin/bookings/{bid}/quote`
**Auth:** Bearer token, roles: owner, super_admin, ops  
**Path params:** `bid`  
**Request body:**
```json
{
  "amount": 50000,
  "note": "Note"
}
```
**Response (from code):**
```python
return {"ok": True}
```
**Errors:** `400` Booking is not awaiting a quote; `400` Enter a valid amount

### POST `/api/admin/bookings/{bid}/adjust`
**Auth:** Bearer token, roles: owner, super_admin, finance, ops  
**Path params:** `bid`  
**Request body:**
```json
{
  "amount": 50000,
  "driver_amount": 0,
  "reason": "Plans changed"
}
```
**Response (from code):**
```python
return {"ok": True}
```
**Errors:** `400` Booking has no fare; `400` Please record a reason

### POST `/api/admin/bookings/{bid}/cash`
**Auth:** Bearer token, roles: owner, super_admin, finance  
**Path params:** `bid`  
**Request body:**
```json
{
  "amount": 50000,
  "reference": "reference"
}
```
**Response (from code):**
```python
return {"ok": True}
```
**Errors:** `400` Invalid payment; `400` Payments cannot be recorded for this booking status

### GET `/api/admin/services`
**Auth:** Bearer token, roles: owner, super_admin, ops, verification, support, finance  
**Response 200:**
```json
[
  {
    "id": "hourly",
    "active": true,
    "base_fare": 39900,
    "base_hours": 2,
    "cancellation_fee": 15000,
    "effective_from": "2026-01-01",
    "extra_hour_rate": 15000,
    "icon": "time-outline",
    "max_hours": 7,
    "min_hours": 2,
    "name": "Hourly Driver",
    "night_surcharge": 20000,
    "order": 0,
    "per_day": 0,
    "pricing_mode": "hourly",
    "tagline": "A verified driver for a few hours — errands, meetings, shopping.",
    "tariff_version": 1,
    "terms": [
      "Customer provides a road-worthy, insured vehicle with valid documents.",
      "... (3 more)"
    ],
    "...": "1 more fields"
  },
  "... (8 more)"
]
```

### PUT `/api/admin/services/{sid}`
**Auth:** Bearer token, roles: owner, super_admin  
**Path params:** `sid`  
**Request body:**
```json
{
  "base_fare": 1,
  "base_hours": 1.0,
  "extra_hour_rate": 1,
  "night_surcharge": 1,
  "per_day": 1,
  "waiting_per_hour": 1,
  "cancellation_fee": 1,
  "active": true,
  "effective_from": "effective from",
  "tagline": "tagline"
}
```
**Response (from code):**
```python
return await db.service_categories.find_one({"id": sid}, {"_id": 0})
```
**Errors:** `404` Service not found

### GET `/api/admin/cities`
**Auth:** Bearer token, roles: owner, super_admin, ops, verification, support, finance  
**Response 200:**
```json
[
  {
    "id": "bengaluru",
    "areas": [
      "Whitefield",
      "... (4 more)"
    ],
    "enabled": true,
    "multiplier": 1.1,
    "name": "Bengaluru",
    "state": "Karnataka"
  },
  "... (5 more)"
]
```

### PUT `/api/admin/cities/{cid}`
**Auth:** Bearer token, roles: owner, super_admin  
**Path params:** `cid`  
**Request body:**
```json
{
  "enabled": true,
  "multiplier": 1.0,
  "areas": [
    "areas"
  ]
}
```
**Response (from code):**
```python
return {"ok": True}
```

### GET `/api/admin/settings`
**Auth:** Bearer token, roles: owner, super_admin, ops, verification, support, finance  
**Response 200:**
```json
{
  "id": "main",
  "address": "India",
  "advance_percent": 20,
  "bookings_enabled": true,
  "business_hours": "7 AM – 11 PM, all days",
  "cash_enabled": true,
  "company_name": "Prajeta",
  "currency": "INR",
  "driver_share_percent": 70,
  "gateway_fee_percent": 2,
  "legal_name": "Prajeta Driver Services (to be configured)",
  "support_email": "support@prajeta.in",
  "support_phone": "+91 90000 00000",
  "tagline": "Find a Trusted Driver, Wherever You Need One.",
  "tax_rate": 18,
  "whatsapp_link": "https://api.whatsapp.com/message/IPGR6FOC57DXM1?autoload=1&app_absent=0",
  "invoice_counter": 53,
  "history_seeded": true,
  "...": "4 more fields"
}
```

### PUT `/api/admin/settings`
**Auth:** Bearer token, roles: owner, super_admin  
**Request body:**
```json
{
  "key": "value"
}
```
**Response (from code):**
```python
return await get_settings()
```
**Errors:** `400` Bonus and referral amounts must be between ₹0 and ₹5,000; `400` Bonus and referral amounts must be numbers

### GET `/api/admin/payments`
**Auth:** Bearer token, roles: owner, super_admin, finance  
**Query params:** `status`  
**Response 200:**
```json
[
  {
    "id": "d2fcdd9d-e9ca-40f2-9782-28510b80470a",
    "booking_id": "5af6bf06-b9a9-4f8a-918f-8817aba73a4f",
    "customer_id": "0da24de5-d199-4424-8065-42f74e164809",
    "kind": "full",
    "amount": 94282,
    "currency": "INR",
    "method": "razorpay",
    "status": "paid",
    "razorpay_order_id": null,
    "is_demo": true,
    "created_at": "2026-10-31T17:39:21.163033+00:00",
    "paid_at": "2026-10-31T17:39:21.163033+00:00",
    "booking_ref": "PRJ-RLUJS4HW",
    "customer_name": "Demo Customer 8"
  },
  "... (63 more)"
]
```

### POST `/api/admin/payments/{pid}/refund`
**Auth:** Bearer token, roles: owner, finance  
**Path params:** `pid`  
**Request body:**
```json
{
  "amount": 50000,
  "reason": "Plans changed"
}
```
**Response (from code):**
```python
return {"ok": True, "status": status}
```
**Errors:** `400` Invalid refund amount or missing reason; `400` Only paid payments can be refunded

### GET `/api/admin/expenses`
**Auth:** Bearer token, roles: owner, super_admin, finance  
**Response 200:**
```json
{
  "categories": [
    "Driver payouts",
    "... (9 more)"
  ],
  "items": [
    {
      "id": "932213da-ee84-4a7e-baab-b61b880bd10e",
      "category": "Staff salaries",
      "amount": 6000000,
      "date": "2026-10-29",
      "note": "Synthetic demo expense",
      "is_demo": true,
      "created_at": "2026-10-31T20:39:21.188126+00:00"
    },
    "... (14 more)"
  ]
}
```

### POST `/api/admin/expenses`
**Auth:** Bearer token, roles: owner, super_admin, finance  
**Request body:**
```json
{
  "category": "category",
  "amount": 50000,
  "date": "2026-11-05",
  "note": "Note",
  "city_id": "mumbai"
}
```
**Response (from code):**
```python
return clean(doc)
```
**Errors:** `400` Enter a valid amount

### GET `/api/admin/payouts`
**Auth:** Bearer token, roles: owner, super_admin, finance  
**Response 200:**
```json
{
  "drivers": [
    {
      "driver_id": "7c6cacf7-c7eb-4f37-bdbe-f1c04555e58e",
      "name": "Ravi Kumar (Demo Driver)",
      "upi": "ravi@upi",
      "earned": 434070,
      "paid": 450000,
      "pending": 0
    },
    "... (4 more)"
  ],
  "history": [
    {
      "id": "26a1f7df-8375-47d4-8e34-f11166c1859d",
      "driver_id": "7c6cacf7-c7eb-4f37-bdbe-f1c04555e58e",
      "amount": 450000,
      "reference": "UPI-DEMO-0001",
      "status": "PAID",
      "is_demo": true,
      "created_at": "2026-10-24T20:39:21.201451+00:00"
    }
  ]
}
```

### POST `/api/admin/payouts`
**Auth:** Bearer token, roles: owner, super_admin, finance  
**Request body:**
```json
{
  "driver_id": "driver id",
  "amount": 50000,
  "reference": "reference"
}
```
**Response (from code):**
```python
return clean(doc)
```
**Errors:** `400` Enter amount and transfer reference

### GET `/api/admin/tickets`
**Auth:** Bearer token, roles: owner, super_admin, ops, support  
**Query params:** `status`, `mine`  
**Response 200:**
```json
[]
```

### POST `/api/admin/tickets/{tid}/reply`
**Auth:** Bearer token, roles: owner, super_admin, ops, support  
**Path params:** `tid`  
**Request body:**
```json
{
  "text": "text",
  "internal": false
}
```
**Response (from code):**
```python
return {"ok": True}
```
**Errors:** `404` Ticket not found

### POST `/api/admin/tickets/{tid}/status`
**Auth:** Bearer token, roles: owner, super_admin, ops, support  
**Path params:** `tid`  
**Request body:**
```json
{
  "status": "approved",
  "priority": "priority",
  "resolution": "resolution"
}
```
**Response (from code):**
```python
return {"ok": True}
```

### GET `/api/admin/enquiries`
**Auth:** Bearer token, roles: owner, super_admin, ops, support  
**Response 200:**
```json
[]
```

### POST `/api/admin/enquiries/{eid}`
**Auth:** Bearer token, roles: owner, super_admin, ops, support  
**Path params:** `eid`  
**Request body:**
```json
{
  "status": "approved",
  "note": "Note",
  "quote_amount": 1
}
```
**Response (from code):**
```python
return {"ok": True}
```

### GET `/api/admin/audit-logs`
**Auth:** Bearer token, roles: owner, super_admin  
**Response 200:**
```json
[]
```

### GET `/api/admin/owner/overview`
**Auth:** Bearer token, roles: owner, super_admin, finance  
**Query params:** `period`, `city_id`, `service_id`, `start`, `end`  
**Response 200:**
```json
{
  "current": {
    "bookings": 26,
    "completed": 19,
    "cancelled": 1,
    "active": 6,
    "completion_rate": 73.1,
    "cancellation_rate": 3.8,
    "gbv": 2682258,
    "revenue": 1639100,
    "collections": 1939516,
    "receivables": 144244,
    "payouts": 1147369,
    "gateway_fees": 23359,
    "refunds": 0,
    "contribution": 468372,
    "contribution_margin": 28.6,
    "opex": 10700000,
    "operating_profit": -10231628,
    "avg_booking_value": 107290,
    "...": "10 more fields"
  },
  "previous": {
    "bookings": 29,
    "completed": 23,
    "cancelled": 3,
    "active": 3,
    "completion_rate": 79.3,
    "cancellation_rate": 10.3,
    "gbv": 3441234,
    "revenue": 2696900,
    "collections": 3234119,
    "receivables": 0,
    "payouts": 1887824,
    "gateway_fees": 45781,
    "refunds": 0,
    "contribution": 763295,
    "contribution_margin": 28.3,
    "opex": 10700000,
    "operating_profit": -9936705,
    "avg_booking_value": 132355,
    "...": "5 more fields"
  },
  "pnl": {
    "income_by_service": {
      "Hourly Driver": 204600,
      "Night Driver": 435500,
      "Pickup & Drop": 294500,
      "Full-Day Driver": 524600,
      "Outstation Driver": 179900
    },
    "revenue": 1639100,
    "driver_payouts": 1147369,
    "gateway_fees": 23359,
    "refunds": 0,
    "contribution": 468372,
    "expenses": {
      "Staff salaries": 6000000,
      "Marketing": 1500000,
      "Rent & utilities": 2500000,
      "Software": 300000,
      "Recruitment & verification": 400000
    },
    "opex": 10700000,
    "operating_profit": -10231628,
    "tax_collected": 295038,
    "collected_for_drivers": 1147369
  },
  "period_start": "2026-10-01T00:00:00+00:00",
  "period_end": "2026-11-01T00:00:00+00:00",
  "basis": "Accrual for revenue (completed trips), cash for collections",
  "data_quality": [
    "This period includes synthetic demo data. Clear it before going live."
  ],
  "definitions": {
    "gbv": "Gross booking value: total fare incl. GST of all non-cancell...(truncated)",
    "revenue": "Earned service revenue: pre-tax fare (after discounts) of completed bookings.",
    "collections": "Money actually received (online + cash) for bookings in the period.",
    "receivables": "Balance due on completed bookings not yet collected.",
    "payouts": "Driver share of completed bookings (driver_share_percent of ...(truncated)",
    "contribution": "Revenue − driver payouts − gateway fees − refunds.",
    "operating_profit": "Contribution − op
```

### GET `/api/admin/owner/services`
**Auth:** Bearer token, roles: owner, super_admin, finance  
**Query params:** `period`  
**Response 200:**
```json
[
  {
    "key": "full-day",
    "name": "Full-Day Driver",
    "requests": 14,
    "completed": 11,
    "cancelled": 3,
    "cancellation_rate": 21.4,
    "gbv": 1644802,
    "revenue": 1393900,
    "collections": 1644802,
    "payouts": 975730,
    "gateway_fees": 32896,
    "receivables": 0,
    "contribution": 385274,
    "margin": 27.6,
    "unassigned": 0
  },
  "... (5 more)"
]
```

### GET `/api/admin/owner/cities`
**Auth:** Bearer token, roles: owner, super_admin, finance  
**Query params:** `period`  
**Response 200:**
```json
[
  {
    "key": "mumbai",
    "name": "mumbai",
    "requests": 16,
    "completed": 12,
    "cancelled": 2,
    "cancellation_rate": 12.5,
    "gbv": 1897794,
    "revenue": 1348500,
    "collections": 1560124,
    "payouts": 943949,
    "gateway_fees": 31202,
    "receivables": 92418,
    "contribution": 373349,
    "margin": 27.7,
    "unassigned": 2,
    "drivers_approved": 1,
    "drivers_online": 1,
    "fulfilment": 85.7
  },
  "... (4 more)"
]
```

### GET `/api/admin/owner/insights`
**Auth:** Bearer token, roles: owner, super_admin, finance  
**Response 200:**
```json
[
  {
    "finding": "High cancellations in Full-Day Driver",
    "evidence": "21.4% of 14 requests cancelled.",
    "impact": "Lost revenue and wasted dispatch effort.",
    "recommended_action": "Call cancelled customers; tighten reminders and cancellation fee.",
    "expected_outcome": "Cancellation rate under 10%.",
    "confidence": "Medium",
    "assumptions": "Cancellation reasons are recorded accurately.",
    "action_owner": "Operations Manager"
  },
  "... (5 more)"
]
```

### GET `/api/admin/owner/actions`
**Auth:** Bearer token, roles: owner, super_admin, finance  
**Response 200:**
```json
[]
```

### POST `/api/admin/owner/actions`
**Auth:** Bearer token, roles: owner, super_admin, finance  
**Request body:**
```json
{
  "finding": "finding",
  "action": "action",
  "priority": "Medium",
  "impact": "impact",
  "cost": "cost",
  "assigned_to": "assigned to",
  "target_date": "target date",
  "status": "Suggested",
  "success_metric": "success metric",
  "report": "report"
}
```
**Response (from code):**
```python
return clean(doc)
```

### PUT `/api/admin/owner/actions/{aid}`
**Auth:** Bearer token, roles: owner, super_admin, finance  
**Path params:** `aid`  
**Request body:**
```json
{
  "key": "value"
}
```
**Response (from code):**
```python
return {"ok": True}
```
**Errors:** `403` Only the owner can approve or reject actions

### GET `/api/admin/staff`
**Auth:** Bearer token, roles: owner, super_admin  
**Response 200:**
```json
[
  {
    "phone": "+919000000001",
    "city_id": "mumbai",
    "created_at": "2026-10-31T20:39:21.071958+00:00",
    "id": "a6fd8daf-0bc4-4f6a-97d4-f7e38a44d279",
    "is_demo": true,
    "name": "Owner (Demo)",
    "role": "owner"
  },
  "... (1 more)"
]
```

### POST `/api/admin/staff`
**Auth:** Bearer token, roles: owner, super_admin  
**Request body:**
```json
{
  "name": "Ravi Kumar",
  "phone": "+919876543210",
  "role": "driver"
}
```
**Response (from code):**
```python
return doc
```
**Errors:** `400` Enter the staff member's name

### PUT `/api/admin/staff/{uid}`
**Auth:** Bearer token, roles: owner, super_admin  
**Path params:** `uid`  
**Request body:**
```json
{
  "role": "driver",
  "active": true,
  "name": "Ravi Kumar"
}
```
**Response (from code):**
```python
return await db.users.find_one({"id": uid}, {"_id": 0})
```
**Errors:** `400` You cannot change your own access; `403` You cannot change this account; `404` Staff member not found

### GET `/api/admin/licences`
**Auth:** Bearer token, roles: owner, super_admin, ops, verification  
**Response 200:**
```json
[]
```

### POST `/api/admin/licences/run-check`
**Auth:** Bearer token, roles: owner, super_admin, ops, verification  
**Response (from code):**
```python
return await licence_check()
```

### GET `/api/admin/staff/performance`
_Per-staff productivity from audit logs, tickets and dispatch timestamps._  
**Auth:** Bearer token, roles: owner, super_admin  
**Query params:** `period`  
**Response 200:**
```json
{
  "period_start": "2026-10-02T00:00:00+00:00",
  "period_end": "2026-11-01T00:00:00+00:00",
  "staff": [
    {
      "id": "a6fd8daf-0bc4-4f6a-97d4-f7e38a44d279",
      "name": "Owner (Demo)",
      "role": "owner",
      "phone": "+919000000001",
      "tickets_handled": 0,
      "tickets_resolved": 0,
      "replies": 0,
      "approvals": 0,
      "rejections": 0,
      "docs_verified": 0,
      "assignments": 0,
      "quotes": 0,
      "exceptions": 0,
      "finance_actions": 0,
      "avg_first_response_mins": null,
      "avg_dispatch_mins": null,
      "score": 0
    },
    "... (1 more)"
  ],
  "score_formula": "3×resolved tickets + handled tickets + 3×driver approvals + ...(truncated)"
}
```

### GET `/api/admin/ratings`
**Auth:** Bearer token, roles: owner, super_admin, ops, verification  
**Query params:** `period`, `city_id`, `min_reviews`  
**Response 200:**
```json
{
  "drivers": [
    {
      "driver_id": "7c6cacf7-c7eb-4f37-bdbe-f1c04555e58e",
      "name": "Ravi Kumar (Demo Driver)",
      "phone": "+919000000002",
      "badge": null,
      "badge_label": null,
      "city_id": "mumbai",
      "overall_rating": 4.3,
      "average": 5.0,
      "count": 3,
      "completed_trips": 3,
      "five_star_pct": 100,
      "low_count": 0,
      "score": 4.38,
      "top_tags": [],
      "recent": [
        {
          "rating": 5,
          "comment": "",
          "created_at": "2026-10-30T12:39:21.171756+00:00"
        },
        "... (2 more)"
      ]
    },
    "... (6 more)"
  ],
  "low_ratings": [],
  "total_reviews": 18,
  "average": 4.44,
  "score_formula": "(average × reviews + 4.0 × 5) ÷ (reviews + 5)"
}
```

### GET `/api/admin/live-drivers`
**Auth:** Bearer token, roles: owner, super_admin, ops, support  
**Query params:** `city_id`, `booking_id`  
**Response 200:**
```json
{
  "drivers": [
    {
      "driver_id": "c856a46d-9bbc-4319-9662-6c66abc18df9",
      "name": "Demo Driver 1",
      "phone": "+917000000000",
      "city_id": "pune",
      "rating": 4.6,
      "badge": "top",
      "state": "available",
      "trip": null,
      "location": null,
      "updated_secs_ago": null,
      "stale": true,
      "distance_km": null,
      "eta_mins": null
    },
    "... (3 more)"
  ],
  "pickup": null,
  "city_id": "",
  "booking": null,
  "counts": {
    "available": 4,
    "on_trip": 0,
    "no_location": 4
  }
}
```
**Errors:** `404` Booking not found

### GET `/api/admin/sos`
**Auth:** Bearer token, roles: owner, super_admin, ops, support  
**Query params:** `status`  
**Response 200:**
```json
{
  "items": [],
  "open": 0,
  "active": 0
}
```

### POST `/api/admin/sos/{alert_id}`
**Auth:** Bearer token, roles: owner, super_admin, ops, support  
**Path params:** `alert_id`  
**Request body:**
```json
{
  "action": "action",
  "note": "Note"
}
```
**Response (from code):**
```python
return {**a, **upd}
```
**Errors:** `400` Add a short note on how it was resolved; `400` Alert is already being handled; `400` Alert is already resolved; `400` Unknown action; `404` Alert not found

### GET `/api/admin/referrals`
**Auth:** Bearer token, roles: owner, super_admin, finance, ops  
**Query params:** `period`  
**Response 200:**
```json
{
  "referrers": [],
  "recent": [],
  "totals": {
    "referrers": 0,
    "friends_joined": 0,
    "friends_completed": 0,
    "referred_revenue": 0
  }
}
```

### POST `/api/admin/referrals/{user_id}/reward`
**Auth:** Bearer token, roles: owner, super_admin, finance  
**Path params:** `user_id`  
**Request body:**
```json
{
  "amount": 50000,
  "note": "Note"
}
```
**Response (from code):**
```python
return {"ok": True}
```
**Errors:** `400` Thank-you credit must be between ₹1 and ₹5,000; `404` Customer not found

### GET `/api/admin/payout-requests`
**Auth:** Bearer token, roles: owner, super_admin, finance  
**Query params:** `status`  
**Response 200:**
```json
{
  "items": [],
  "open": 0
}
```

### POST `/api/admin/payout-requests/{rid}`
**Auth:** Bearer token, roles: owner, super_admin, finance  
**Path params:** `rid`  
**Request body:**
```json
{
  "action": "action",
  "reference": "reference",
  "reason": "Plans changed"
}
```
**Response (from code):**
```python
return {**r, "status": "APPROVED", "reference": ref}
return {**r, "status": "REJECTED"}
```
**Errors:** `400` Add a reason so the driver knows what to fix; `400` This request was already handled; `400` Unknown action; `404` Request not found

### POST `/api/admin/drivers/{user_id}/photo`
**Auth:** Bearer token, roles: owner, super_admin, ops, verification  
**Path params:** `user_id`  
**Request body:**
```json
{
  "approve": true,
  "reason": "Plans changed"
}
```
**Response (from code):**
```python
return {"ok": True, "status": status}
```
**Errors:** `400` Tell the driver why the photo was rejected; `404` No photo uploaded
