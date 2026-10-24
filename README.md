# Collectorate Quick Commerce

A Blinkit / Instamart style quick commerce web app (MVP).

## What works today

- **Customer:** phone + OTP login, category browsing, search, cart (saved in the browser), delivery address with pincode serviceability check, cash-on-delivery checkout, order tracking (placed → packed → out for delivery → delivered), cancel before packing.
- **Store admin (`/admin`):** order list with one-click status updates, inventory table to edit price, stock and listing.
- Stock is checked and decremented in a transaction when an order is placed, and returned when an order is cancelled.

## Run it

Requires Node.js 20 or newer.

```bash
npm install
npm run dev     # http://localhost:3000
```

The app uses Postgres. Locally, with no `DATABASE_URL` set, it runs an embedded Postgres (PGlite) stored in `data/pglite`, so there's nothing to install. Tables are created and seeded on first request. Delete `data/` to reset.

- **OTP:** with the Firebase variables set (see below), Firebase sends real SMS codes. Without them, a built-in fallback is used. In development (or with `SHOW_OTP_ON_SCREEN=true`) the code is shown on the login screen. It is always logged to the server console.
- **Admin:** locally, log in with `9999999999`. In production set `ADMIN_PHONES=9xxxxxxxxx,8xxxxxxxxx`; admin OTPs are only in the server logs, never on screen.
- **Delivery zones:** every valid 6-digit pincode is deliverable (30 min ETA). Pincodes listed in the `zones` table (seeded from `src/lib/seed.ts`) get their own area name and ETA. Set `ALLOW_ALL_PINCODES=false` to deliver only to listed pincodes.

## Deploy to Vercel

1. On [vercel.com/new](https://vercel.com/new), import the `sricommerce` GitHub repo. Name the project `sricommerce` to get `sricommerce.vercel.app`.
2. In the project, open **Storage → Create Database → Neon (Postgres)** and connect it. This sets `DATABASE_URL` automatically.
3. In **Settings → Environment Variables** add `ADMIN_PHONES` (your mobile number) and `SHOW_OTP_ON_SCREEN=true`.
4. Redeploy. Tables and sample products are created on the first visit.

To log in as admin, enter your number, then find the OTP in **Logs** (search for `[otp]`).

## Google (Gmail) login

Free on Firebase's Spark plan. Enable **Authentication → Sign-in method → Google** and make sure the site's domain is in **Authorized domains**. The "Continue with Google" button shows whenever the Firebase config is set (`NEXT_PUBLIC_GOOGLE_LOGIN=false` hides it). Add admin Google accounts with `ADMIN_EMAILS=you@gmail.com`.

## Real SMS login with Firebase

1. Create a project at [console.firebase.google.com](https://console.firebase.google.com) and add a **Web app**.
2. **Authentication → Sign-in method → Phone**: enable it. Optionally add test numbers with fixed codes.
3. **Authentication → Settings → Authorized domains**: add `sricommerce.vercel.app`.
4. Put the web app's `apiKey`, `authDomain`, `projectId` and `appId` in the `NEXT_PUBLIC_FIREBASE_*` variables (already in `.env.production` for project `sricommerce-697b1`).
5. Upgrade to the Blaze plan and allow India under **Authentication → Settings → SMS region policy**.
6. Set `NEXT_PUBLIC_FIREBASE_LOGIN=true` (in `.env.production` or Vercel) and redeploy.

Firebase's Spark (free) plan doesn't send SMS; phone auth needs the Blaze (pay as you go) plan, with a small number of free verifications each month.
The server checks the Firebase ID token against Google's public keys, so no service-account secret is needed. Admins are still the numbers in `ADMIN_PHONES`.

## Layout

```
src/lib/        db (Postgres / PGlite, schema + seed), auth (OTP, sessions), catalog, orders, pricing
src/app/api/    auth, orders, serviceability, admin endpoints
src/app/        pages: home, category, cart, login, orders, admin
src/components/ header, product card, cart state
```

## Next steps

1. Real SMS OTP (MSG91 / Twilio) and online payments (Razorpay / UPI).
2. Product images and saved addresses.
3. Delivery partner app and live order tracking (map + websockets).
4. Multiple dark stores with per-store inventory and zone polygons.
5. React Native customer app on the same API.
