# TransitOps — Frontend Prototype

A fully clickable, single-page frontend prototype for TransitOps, built with
plain HTML/CSS/JS (no build step required) so you can open it immediately or
wire it to a real backend later. It follows the Design System and Screen
Specs from the companion design documents.

## Run it

No install needed. Either:

1. **Double-click `index.html`** — works directly in most browsers, or
2. **Serve it locally** (recommended, avoids any file:// quirks):
   ```bash
   cd transitops-app
   python3 -m http.server 8080
   # open http://localhost:8080
   ```

## Login

This prototype uses mock, client-side auth (no real backend yet):

- **Any email + any non-empty password** logs you in.
- Pick a **Role** from the dropdown — the sidebar and every screen's edit
  permissions change live based on the RBAC matrix in `js/data.js`.
- Type the password **`fail`** to trigger the invalid-credentials / 5-attempt
  lockout flow.

## What's wired up (not just static mockups)

- **Trip Dispatcher** — vehicle/driver dropdowns are pre-filtered to
  `Available` + non-expired-license only; cargo weight is validated live
  against vehicle capacity with the exact red banner text from the spec
  ("✗ Capacity exceeded by Xkg — dispatch blocked"); dispatching flips
  vehicle+driver to `On Trip`; completing/cancelling restores them.
- **Maintenance** — creating a service record flips the vehicle to `In Shop`
  and it immediately disappears from the Trip Dispatcher's vehicle list;
  closing it restores `Available` (unless Retired).
- **Fuel & Expenses** — the "Total Operational Cost" footer recomputes live
  from the fuel + expense tables.
- **Analytics** — Fuel Efficiency, Fleet Utilization, Operational Cost, ROI,
  and the Top Costliest Vehicles ranking are all computed from the current
  in-memory data, not hardcoded. CSV export is a real file download.
- **Settings → RBAC** — matrix cells are clickable and cycle
  none → view → edit; the sidebar and edit buttons across the app respect it
  immediately.
- **Vehicle Registry** — duplicate registration numbers are rejected
  client-side, matching the uniqueness rule.

## Project structure

```
transitops-app/
├── index.html          Login screen + app shell markup
├── css/style.css        Design tokens (colors/typography) + all component styles
├── js/data.js            Mock "DB" + every business rule from PS §4, centralized
├── js/components.js  Reusable render helpers (StatusPill, KpiCard, DataTable, Modal…)
├── js/screens.js       One render function per screen (Dashboard, Fleet, Trips…)
└── js/app.js             Router, auth, RBAC gating, and all button/form actions
```

## Wiring to a real backend

Everything that mutates data goes through `DB.actions.*` in `js/data.js`
(e.g. `addVehicle`, `dispatchTrip`, `completeTrip`, `logMaintenance`). Swap
the body of each function for a `fetch()` call to your API (see the API
route list in the backend design document) and re-render — the screens and
components don't need to change.

## Known simplifications (prototype only)

- Data resets on page refresh (in-memory only, no persistence/localStorage).
- Auth is client-side mock — no real password check or JWT.
- "Revenue" for ROI is derived (cost × 1.6) as a placeholder since the PS
  doesn't define a revenue-capture entity — swap in real trip revenue once
  that field exists in your backend.
