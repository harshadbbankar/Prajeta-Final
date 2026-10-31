# Prajeta Customer App (Expo)

Customer-only app: home, booking (20% advance), live trip & tracking, SOS, profile, vehicle garage, GST billing/invoices, referral, trusted contacts, support, notifications.

- Backend API (shared with Driver app & ERP): `EXPO_PUBLIC_BACKEND_URL` + `/api`
  - Current value: `https://fleetride-hub.preview.emergentagent.com` (set in `.env`; replace with your production URL after Publish)
- Demo mode unchanged: WhatsApp OTP code shown on screen (preview), demo phones use OTP 123456; Razorpay simulated (advance recorded as cash by staff).
- Driver or staff accounts that log in here are signed out and told to use the right app.
- Identifiers: name "Prajeta", slug `prajeta-customer`, scheme `prajetacustomer`, package/bundle `com.prajeta.customer`.

Run: `yarn install && npx expo start`
