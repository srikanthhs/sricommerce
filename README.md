# Collectorate Quick Commerce

A Blinkit / Instamart style quick commerce web app (MVP).

## What works today

- **Customer:** phone + OTP login, category browsing, search, cart (saved in the browser), delivery address with pincode serviceability check, cash-on-delivery checkout, order tracking (placed → packed → out for delivery → delivered), cancel before packing.
- **Store admin (`/admin`):** order list with one-click status updates, inventory table to edit price, stock and listing.
- Stock is checked and decremented in a transaction when an order is placed, and returned when an order is cancelled.

## Run it

Requires Node.js 22.13 or newer (uses the built-in `node:sqlite`, so there are no native dependencies).

```bash
npm install
npm run dev     # http://localhost:3000
```

The SQLite database is created and seeded at `data/app.db` on first request. Delete that file to reset.

- **OTP:** no SMS provider is wired yet. In development the code is shown on the login screen and logged to the server console.
- **Admin:** log in with `9999999999`, or set `ADMIN_PHONES=9xxxxxxxxx,8xxxxxxxxx`.
- **Delivery zones:** placeholder pincodes `560001`–`560003` in `src/lib/seed.ts`. Replace them with your launch area.

## Layout

```
src/lib/        db (schema + seed), auth (OTP, sessions), catalog, orders, pricing
src/app/api/    auth, orders, serviceability, admin endpoints
src/app/        pages: home, category, cart, login, orders, admin
src/components/ header, product card, cart state
```

## Next steps

1. Real SMS OTP (MSG91 / Twilio) and online payments (Razorpay / UPI).
2. Postgres for production, product images, saved addresses.
3. Delivery partner app and live order tracking (map + websockets).
4. Multiple dark stores with per-store inventory and zone polygons.
5. React Native customer app on the same API.
