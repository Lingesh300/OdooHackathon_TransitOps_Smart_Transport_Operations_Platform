// ============================================================
// TransitOps — API Connector
// Talks to the fleet-backend (Express + Supabase) over REST.
// Mirrors Design Doc §6 API Design 1:1.
//
// Usage: include this file BEFORE app.js/screens.js in index.html.
// Every function returns a Promise (use await / .then()).
// ============================================================

const API_BASE = window.API_BASE || "http://localhost:5000";

// ---- low-level request helper -------------------------------------------
async function apiRequest(path, { method = "GET", body, auth = true } = {}) {
  const headers = { "Content-Type": "application/json" };

  if (auth) {
    const token = localStorage.getItem("accessToken");
    if (token) headers["Authorization"] = `Bearer ${token}`;
  }

  const res = await fetch(`${API_BASE}${path}`, {
    method,
    headers,
    body: body !== undefined ? JSON.stringify(body) : undefined,
  });

  let data = null;
  try { data = await res.json(); } catch (_) { /* no body */ }

  if (!res.ok) {
    const msg = (data && (data.message || data.error)) || `Request failed (${res.status})`;
    throw new Error(msg);
  }
  return data;
}

const qs = (params = {}) => {
  const clean = Object.fromEntries(
    Object.entries(params).filter(([, v]) => v !== undefined && v !== null && v !== "")
  );
  const s = new URLSearchParams(clean).toString();
  return s ? `?${s}` : "";
};

// ---- API client, grouped exactly like the planned routes ----------------
const API = {
  auth: {
    login: (email, password) =>
      apiRequest("/auth/login", { method: "POST", body: { email, password }, auth: false }),
    logout: () => apiRequest("/auth/logout", { method: "POST" }),
  },

  vehicles: {
    list: (params) => apiRequest(`/vehicles${qs(params)}`),          // ?status=&type=&region=
    // accepts camelCase from the UI, sends snake_case to match the backend schema
    create: (v) => apiRequest("/vehicles", { method: "POST", body: {
      name: v.name, plate_number: v.regNo, type: v.type, region: v.region,
      status: v.status, capacity: v.capacity, odometer: v.odometer, acq_cost: v.acqCost,
    }}),
    update: (id, v) => apiRequest(`/vehicles/${id}`, { method: "PUT", body: {
      ...(v.name !== undefined && { name: v.name }),
      ...(v.regNo !== undefined && { plate_number: v.regNo }),
      ...(v.type !== undefined && { type: v.type }),
      ...(v.region !== undefined && { region: v.region }),
      ...(v.status !== undefined && { status: v.status }),
      ...(v.capacity !== undefined && { capacity: v.capacity }),
      ...(v.odometer !== undefined && { odometer: v.odometer }),
      ...(v.acqCost !== undefined && { acq_cost: v.acqCost }),
    }}),
    dispatchPool: () => apiRequest("/vehicles/dispatch-pool"),        // status=Available only
  },

  drivers: {
    list: (params) => apiRequest(`/drivers${qs(params)}`),            // ?status=
    create: (d) => apiRequest("/drivers", { method: "POST", body: {
      name: d.name, license_number: d.licenseNo, license_expiry: d.expiry,
      phone: d.contact, status: d.status,
    }}),
    updateStatus: (id, status) =>
      apiRequest(`/drivers/${id}/status`, { method: "PATCH", body: { status } }),
    dispatchPool: () => apiRequest("/drivers/dispatch-pool"),         // available + license not expired
  },

  trips: {
    list: (params) => apiRequest(`/trips${qs(params)}`),              // ?status=
    create: (t) => apiRequest("/trips", { method: "POST", body: {
      vehicle_id: t.vehicleId, driver_id: t.driverId, origin: t.source, destination: t.destination,
      cargo_weight: t.cargoWeight, planned_distance: t.plannedDistance,
    }}), // creates Draft
    dispatch: (id, vehicleId, driverId) =>
      apiRequest(`/trips/${id}/dispatch`, { method: "POST", body: { vehicle_id: vehicleId, driver_id: driverId } }),
    complete: (id, c) => apiRequest(`/trips/${id}/complete`, { method: "POST", body: {
      actual_distance: c.actualDistance, fuel_consumed: c.fuelConsumed, final_odometer: c.finalOdometer,
    }}),
    cancel: (id) => apiRequest(`/trips/${id}/cancel`, { method: "POST" }),
  },

  maintenance: {
    list: (params) => apiRequest(`/maintenance${qs(params)}`),
    create: (m) => apiRequest("/maintenance", { method: "POST", body: {
      vehicle_id: m.vehicleId, issue: m.service, estimated_cost: m.cost,
    }}), // opens -> vehicle In Shop
    close: (id, actualCost) =>
      apiRequest(`/maintenance/${id}/close`, { method: "PATCH", body: { actual_cost: actualCost } }), // closes -> vehicle Available
  },

  fuel: {
    list: (vehicleId) => apiRequest(`/fuel-logs${qs({ vehicle_id: vehicleId })}`),
    create: (f) => apiRequest("/fuel-logs", { method: "POST", body: {
      vehicle_id: f.vehicleId, liters: f.liters, cost: f.cost, logged_at: f.date,
    }}),
  },

  expenses: {
    list: (vehicleId) => apiRequest(`/expenses${qs({ vehicle_id: vehicleId })}`),
    create: (e) => apiRequest("/expenses", { method: "POST", body: {
      vehicle_id: e.vehicleId, category: e.category || "toll", amount: e.toll ?? e.amount,
      description: e.tripId ? `Trip ${e.tripId}` : undefined,
    }}),
    vehicleTotal: (id) => apiRequest(`/expenses/vehicle/${id}/total`),
  },

  dashboard: {
    kpis: (params) => apiRequest(`/dashboard/kpis${qs(params)}`),     // ?vehicleType=&status=&region=
  },

  analytics: {
    fuelEfficiency: () => apiRequest("/analytics/fuel-efficiency"),
    fleetUtilization: () => apiRequest("/analytics/fleet-utilization"),
    operationalCost: () => apiRequest("/analytics/operational-cost"),
    roi: () => apiRequest("/analytics/roi"),
    exportCsv: () => `${API_BASE}/analytics/export.csv`, // use as href/download link, not fetch
  },

  settings: {
    getRbac: () => apiRequest("/settings/rbac"),
    updateRbac: (data) => apiRequest("/settings/rbac", { method: "PUT", body: data }),
  },
};