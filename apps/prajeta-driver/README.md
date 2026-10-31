# Prajeta Driver App (Expo)

Driver-only app: duty dashboard (ON DUTY toggle, shift telemetry), dark job-offer cards (accept/decline), trip screen with trip-start OTP and end PIN, live location sharing, SOS, jobs, earnings/wallet & payouts, monthly statements, onboarding/KYC documents, profile with uniform photo upload (staff approval).

- Backend API (shared with Customer app & ERP): `EXPO_PUBLIC_BACKEND_URL` + `/api`
  - Current value: `https://prajeta-customer--8n0cd024.preview.emergentagent.com` (set in `.env`; replace with your production URL after Publish)
- Demo mode unchanged: WhatsApp OTP code shown on screen (preview), demo phones use OTP 123456.
- Customer or staff accounts that log in here are signed out and told to use the right app.
- Identifiers: name "Prajeta Driver", slug `prajeta-driver`, scheme `prajetadriver`, package/bundle `com.prajeta.driver`.

Run: `yarn install && npx expo start`
