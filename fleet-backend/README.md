# Fleet Management API

Node.js + Express backend for the Fleet Management system (Vehicles, Drivers, Trips, Maintenance, Fuel & Expenses, Dashboard & Analytics, RBAC Settings), backed by Supabase Postgres. Your Supabase schema/tables are assumed to already exist — this repo only implements the API layer on top of them.

## Stack

- **Express 4** — REST API
- **@supabase/supabase-js** — DB client (using the **service role key** server-side; RLS is bypassed and access control is enforced entirely in this API's middleware)
- **JWT (jsonwebtoken)** — custom access/refresh token auth (not Supabase Auth)
- **bcryptjs** — password hashing
- **express-validator** — request validation
- **helmet, cors, express-rate-limit, morgan** — security & logging basics

## Getting started

```bash
npm install
cp .env.example .env   # fill in your real values
npm run dev             # nodemon, auto-reload
# or
npm start
```

Server runs on `http://localhost:5000` by default. Health check: `GET /health`.

## Environment variables

See `.env.example`. You need:
- `SUPABASE_URL` and `SUPABASE_SERVICE_ROLE_KEY` from Project Settings → API in your Supabase dashboard.
- `JWT_SECRET` / `JWT_REFRESH_SECRET` — generate with e.g. `openssl rand -hex 64`.

## ⚠️ Table/column assumptions — please verify

Since the DB already exists, this backend queries table/column names based on the API spec you shared. **They may not match your actual schema.** Everything is centralized in `src/config/tables.js` so you can remap table names in one place:

```js
module.exports = {
  USERS: 'users',
  VEHICLES: 'vehicles',
  DRIVERS: 'drivers',
  TRIPS: 'trips',
  MAINTENANCE: 'maintenance',
  FUEL_LOGS: 'fuel_logs',
  EXPENSES: 'expenses',
  RBAC_SETTINGS: 'rbac_settings',
  REFRESH_TOKENS: 'refresh_tokens',
};
```

Column names are used inline in each controller (e.g. `plate_number`, `license_expiry`, `logged_at`). If your actual columns differ, do a find-and-replace in the relevant controller file — the queries are plain Supabase `.select()/.insert()/.update()` calls, nothing exotic.

Expected columns per table, inferred from your API spec:

| Table | Key columns |
|---|---|
| `users` | `id, email, password_hash, name, role` |
| `vehicles` | `id, name, plate_number, type, status, region, created_at, updated_at` |
| `drivers` | `id, name, license_number, license_expiry, status, phone, created_at, updated_at` |
| `trips` | `id, vehicle_id, driver_id, origin, destination, status, scheduled_at, dispatched_at, completed_at, cancelled_at, cancel_reason, revenue*` |
| `maintenance` | `id, vehicle_id, issue, notes, status, estimated_cost, actual_cost, opened_at, closed_at` |
| `fuel_logs` | `id, vehicle_id, liters, cost, odometer, logged_at` |
| `expenses` | `id, vehicle_id, category, amount, description, incurred_at` |
| `rbac_settings` | `role (PK), permissions (jsonb)` |
| `refresh_tokens` | `id, user_id, token, created_at` |

`*` `trips.revenue` is only used by `/analytics/roi` — if you don't track revenue on trips, that endpoint returns `0` for revenue and still reports cost, with a note in the response.

## Auth model

This uses **custom JWT auth**, not Supabase Auth, since the spec calls for `POST /auth/login` / `POST /auth/logout` directly (Supabase Auth would normally be called from the client SDK). Passwords are hashed with bcrypt and stored in your `users` table.

- `POST /auth/login` → `{ accessToken, refreshToken, user }`
- `POST /auth/logout` → revokes the given `refreshToken` (deletes from `refresh_tokens`)
- `POST /auth/refresh` → exchanges a valid refresh token for a new access token (bonus endpoint)
- `GET /auth/me` → current user from access token (bonus endpoint)

Send the access token on every other request as `Authorization: Bearer <accessToken>`.

## RBAC

Two layers:
1. **`authorize('admin', 'dispatcher', ...)`** — simple role allow-list, used for coarse checks (e.g. only `admin` can edit RBAC settings itself).
2. **`requirePermission(resource, action)`** — fine-grained, driven by the `rbac_settings` table (`role → { resource: [actions] }`), used on all the business endpoints. `admin` always passes. Config is cached in-memory for 30s and invalidated automatically whenever `/settings/rbac` is updated.

Example `rbac_settings` row:
```json
{
  "role": "dispatcher",
  "permissions": {
    "vehicles": ["read"],
    "drivers": ["read"],
    "trips": ["read", "write", "dispatch"],
    "maintenance": ["read"]
  }
}
```

## Endpoints implemented

All routes below require `Authorization: Bearer <token>` except `/auth/login`, `/auth/logout`, `/auth/refresh`, and `/health`.

**Auth**
- `POST /auth/login`, `POST /auth/logout`, `POST /auth/refresh`, `GET /auth/me`

**Vehicles**
- `GET /vehicles?status=&type=&region=`
- `GET /vehicles/dispatch-pool?type=&region=` (status=Available only)
- `GET /vehicles/:id`
- `POST /vehicles`
- `PUT /vehicles/:id`

**Drivers**
- `GET /drivers?status=`
- `GET /drivers/dispatch-pool` (Available + license not expired)
- `GET /drivers/:id`
- `POST /drivers`
- `PATCH /drivers/:id/status`

**Trips**
- `GET /trips?status=`
- `GET /trips/:id`
- `POST /trips` (creates Draft)
- `POST /trips/:id/dispatch` (validates vehicle/driver availability + license, sets both to "On Trip")
- `POST /trips/:id/complete` (frees vehicle/driver back to "Available")
- `POST /trips/:id/cancel` (frees vehicle/driver if they'd been reserved)

**Maintenance**
- `GET /maintenance?status=&vehicle_id=`
- `POST /maintenance` (opens record, sets vehicle → "In Shop")
- `PATCH /maintenance/:id/close` (closes record, sets vehicle → "Available")

**Fuel & Expenses**
- `GET /fuel-logs?vehicle_id=`, `POST /fuel-logs`
- `GET /expenses?vehicle_id=&category=`, `POST /expenses`
- `GET /expenses/vehicle/:id/total?from=&to=`

**Dashboard & Analytics**
- `GET /dashboard/kpis?vehicleType=&status=&region=`
- `GET /analytics/fuel-efficiency`
- `GET /analytics/fleet-utilization`
- `GET /analytics/operational-cost`
- `GET /analytics/roi`
- `GET /analytics/export.csv` (also available at `GET /analytics/export`)

**Settings**
- `GET /settings/rbac`, `PUT /settings/rbac` (admin only)

## Business logic notes

- **Trip dispatch** checks the vehicle is `Available` and the driver is `Available` with a non-expired license before assigning them, then flips both to `On Trip`.
- **Trip complete/cancel** flips the vehicle and driver back to `Available` (cancel only does this if the trip had actually reached `Dispatched`).
- **Maintenance open/close** flips the vehicle between `In Shop` and `Available`.
- All of the above status strings (`Available`, `On Trip`, `In Shop`, `Draft`, `Dispatched`, `Completed`, `Cancelled`, `Open`, `Closed`) are assumptions based on your spec — adjust the literals in the controllers if your actual status enums differ.

## Project structure

```
src/
  app.js                  # Express app, middleware, route mounting
  config/
    supabase.js           # Supabase client (service role)
    tables.js             # table name -> logical name map
  middleware/
    auth.js                # authenticate (JWT) + authorize + requirePermission (RBAC)
    validate.js             # express-validator error wrapper
    errorHandler.js         # centralized error + 404 handler
  controllers/              # one file per resource
  routes/                   # one file per resource
  utils/
    ApiError.js
    asyncHandler.js
    jwt.js
server.js                   # entrypoint
.env.example
```

## Testing it quickly

```bash
curl -X POST http://localhost:5000/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@example.com","password":"yourpassword"}'

curl http://localhost:5000/vehicles \
  -H "Authorization: Bearer <accessToken>"
```

You'll need at least one row in `users` with a bcrypt-hashed password and at least one row in `rbac_settings` for non-admin roles to be able to do anything (admin bypasses RBAC checks entirely).
