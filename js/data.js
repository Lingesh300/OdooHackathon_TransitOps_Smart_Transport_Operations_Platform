// ============================================================
// TransitOps — Mock Data Layer
// In a real build, every function in DB.actions.* maps 1:1 to a
// backend API call (see Design Document §6 API Design).
// All business rules from PS §4 are enforced here, centrally,
// so no screen can bypass them.
// ============================================================

const DB = {
  currentUser: null, // { name, role }

  roles: ["Fleet Manager", "Dispatcher", "Safety Officer", "Financial Analyst"],

  // RBAC matrix: role -> module -> 'edit' | 'view' | 'none'
  rbac: {
    "Fleet Manager":      { fleet: "edit", drivers: "edit", trips: "none", fuel: "none",  analytics: "view" },
    "Dispatcher":         { fleet: "view", drivers: "edit", trips: "edit", fuel: "none",  analytics: "none" },
    "Safety Officer":     { fleet: "none", drivers: "edit", trips: "view", fuel: "none",  analytics: "none" },
    "Financial Analyst":  { fleet: "view", drivers: "none", trips: "none", fuel: "edit",  analytics: "edit" },
  },

  settings: {
    depotName: "Gandhinagar Depot GJ4",
    currency: "INR (₹)",
    distanceUnit: "Kilometers",
  },

  vehicles: [
    { id: "V1", regNo: "GJ01AB4521", name: "VAN-05",   type: "Van",   capacity: 500, odometer: 74000,  acqCost: 620000,  status: "Available", region: "Gandhinagar" },
    { id: "V2", regNo: "GJ01AB9981", name: "TRUCK-11",  type: "Truck", capacity: 5000, odometer: 182000, acqCost: 2450000, status: "On Trip",   region: "Ahmedabad" },
    { id: "V3", regNo: "GJ01AB1120", name: "MINI-03",   type: "Mini",  capacity: 1000, odometer: 66000,  acqCost: 410000,  status: "In Shop",   region: "Gandhinagar" },
    { id: "V4", regNo: "GJ01AB0089", name: "VAN-09",    type: "Van",   capacity: 750, odometer: 219400, acqCost: 540000,  status: "Retired",   region: "Vatva" },
  ],

  drivers: [
    { id: "D1", name: "Alex",   licenseNo: "DL-88213", category: "LMV", expiry: "2028-12-01", contact: "98765xxxxx", tripCompletion: 96, safety: "Available",  status: "Available" },
    { id: "D2", name: "John",   licenseNo: "DL-44120", category: "HMV", expiry: "2025-03-01", contact: "98220xxxxx", tripCompletion: 81, safety: "Suspended",  status: "Suspended" },
    { id: "D3", name: "Priya",  licenseNo: "DL-77031", category: "LMV", expiry: "2028-08-01", contact: "94110xxxxx", tripCompletion: 99, safety: "On Trip",    status: "On Trip" },
    { id: "D4", name: "Suresh", licenseNo: "DL-90045", category: "HMV", expiry: "2027-01-01", contact: "97440xxxxx", tripCompletion: 88, safety: "Available",  status: "Off Duty" },
  ],

  trips: [
    { id: "TR001", source: "Gandhinagar Depot", destination: "Ahmedabad Hub",    vehicleId: "V2", driverId: "D3", cargoWeight: 3800, plannedDistance: 45,  actualDistance: null, fuelConsumed: null, status: "Dispatched", eta: "45 min" },
    { id: "TR004", source: "Vatva Industrial Area", destination: "Sanand Warehouse", vehicleId: null, driverId: null, cargoWeight: null, plannedDistance: null, actualDistance: null, fuelConsumed: null, status: "Draft", eta: "Awaiting driver" },
    { id: "TR006", source: "Mansa", destination: "Kalol Depot", vehicleId: null, driverId: null, cargoWeight: null, plannedDistance: null, actualDistance: null, fuelConsumed: null, status: "Cancelled", eta: "Vehicle went to shop" },
  ],

  maintenance: [
    { id: "M1", vehicleId: "V1", service: "Oil Change",   cost: 2500,  date: "2026-07-01", status: "In Shop" },
    { id: "M2", vehicleId: "V2", service: "Engine Repair", cost: 18000, date: "2026-07-06", status: "Completed" },
    { id: "M3", vehicleId: "V3", service: "Tyre Replace",  cost: 6200,  date: "2026-07-06", status: "In Shop" },
  ],

  fuelLogs: [
    { id: "F1", vehicleId: "V1", date: "2026-07-05", liters: 42, cost: 3150 },
    { id: "F2", vehicleId: "V2", date: "2026-07-06", liters: 110, cost: 8400 },
    { id: "F3", vehicleId: "V3", date: "2026-07-06", liters: 28, cost: 2050 },
  ],

  expenses: [
    { id: "E1", tripId: "TR001", vehicleId: "V1", toll: 120, other: 0, maint: 0,     status: "Available" },
    { id: "E2", tripId: "TR002", vehicleId: "V2", toll: 340, other: 150, maint: 18000, status: "Completed" },
  ],

  revenueByMonth: [42000, 51000, 47000, 58000, 55000, 62000, 49000], // for analytics bar chart

  _nextId(prefix, arr) {
    let n = arr.length + 1;
    let id;
    do { id = `${prefix}${String(n).padStart(1, "0")}`; n++; } while (arr.some(x => x.id === id));
    return id;
  },

  // ---------------- derived helpers ----------------
  get(entity, id) { return this[entity].find(x => x.id === id); },

  vehicleLabel(v) { return v ? `${v.name} (${v.regNo})` : "—"; },

  dispatchableVehicles() {
    return this.vehicles.filter(v => v.status === "Available");
  },
  dispatchableDrivers() {
    const today = new Date().toISOString().slice(0, 10);
    return this.drivers.filter(d => d.status === "Available" && d.expiry >= today);
  },
  isLicenseExpired(d) {
    return d.expiry < new Date().toISOString().slice(0, 10);
  },

  operationalCost(vehicleId) {
    const fuel = this.fuelLogs.filter(f => f.vehicleId === vehicleId).reduce((s, f) => s + f.cost, 0);
    const maint = this.maintenance.filter(m => m.vehicleId === vehicleId).reduce((s, m) => s + m.cost, 0);
    return fuel + maint;
  },
  totalOperationalCost() {
    const fuel = this.fuelLogs.reduce((s, f) => s + f.cost, 0);
    const maint = this.maintenance.reduce((s, m) => s + m.cost, 0);
    return fuel + maint;
  },
  fuelEfficiency() {
    const totalDist = this.trips.reduce((s, t) => s + (t.actualDistance || 0), 0);
    const totalLiters = this.fuelLogs.reduce((s, f) => s + f.liters, 0);
    return totalLiters ? (totalDist / totalLiters).toFixed(1) : "—";
  },
  fleetUtilization() {
    const active = this.vehicles.filter(v => v.status !== "Retired");
    const onTrip = active.filter(v => v.status === "On Trip");
    return active.length ? Math.round((onTrip.length / active.length) * 100) : 0;
  },

  // ---------------- mutating actions (business rules enforced here) ----------------
  actions: {
    addVehicle(data) {
      if (DB.vehicles.some(v => v.regNo.toLowerCase() === data.regNo.toLowerCase())) {
        throw new Error("Registration number must be unique.");
      }
      const v = { id: DB._nextId("V", DB.vehicles), status: "Available", odometer: 0, ...data };
      DB.vehicles.push(v);
      return v;
    },

    addDriver(data) {
      if (DB.drivers.some(d => d.licenseNo.toLowerCase() === data.licenseNo.toLowerCase())) {
        throw new Error("License number must be unique.");
      }
      const d = { id: DB._nextId("D", DB.drivers), status: "Available", tripCompletion: 0, safety: "Available", ...data };
      DB.drivers.push(d);
      return d;
    },

    toggleDriverStatus(driverId, newStatus) {
      const d = DB.get("drivers", driverId);
      if (!d) return;
      d.status = newStatus;
    },

    createTrip(data) {
      const t = { id: DB._nextId("TR0", DB.trips), status: "Draft", actualDistance: null, fuelConsumed: null, ...data };
      DB.trips.push(t);
      return t;
    },

    // returns { ok: true } or { ok: false, reason }
    validateDispatch(vehicleId, driverId, cargoWeight) {
      const v = DB.get("vehicles", vehicleId);
      const d = DB.get("drivers", driverId);
      if (!v) return { ok: false, reason: "Select a vehicle." };
      if (!d) return { ok: false, reason: "Select a driver." };
      if (v.status !== "Available") return { ok: false, reason: `Vehicle ${v.name} is not Available (currently ${v.status}).` };
      if (d.status !== "Available") return { ok: false, reason: `Driver ${d.name} is not Available (currently ${d.status}).` };
      if (DB.isLicenseExpired(d)) return { ok: false, reason: `Driver ${d.name}'s license expired on ${d.expiry}.` };
      if (cargoWeight > v.capacity) {
        return { ok: false, reason: `Vehicle Capacity: ${v.capacity} kg\nCargo Weight: ${cargoWeight} kg\n✗ Capacity exceeded by ${cargoWeight - v.capacity} kg — dispatch blocked` };
      }
      return { ok: true };
    },

    dispatchTrip(tripId) {
      const t = DB.get("trips", tripId);
      const check = DB.actions.validateDispatch(t.vehicleId, t.driverId, t.cargoWeight);
      if (!check.ok) throw new Error(check.reason);
      const v = DB.get("vehicles", t.vehicleId);
      const d = DB.get("drivers", t.driverId);
      t.status = "Dispatched";
      v.status = "On Trip";
      d.status = "On Trip";
      t.eta = "45 min";
    },

    completeTrip(tripId, { actualDistance, fuelConsumed, finalOdometer }) {
      const t = DB.get("trips", tripId);
      const v = DB.get("vehicles", t.vehicleId);
      const d = DB.get("drivers", t.driverId);
      t.status = "Completed";
      t.actualDistance = actualDistance;
      t.fuelConsumed = fuelConsumed;
      v.status = "Available";
      v.odometer = finalOdometer || v.odometer;
      d.status = "Available";
      d.tripCompletion = Math.min(100, d.tripCompletion + 1);
      if (fuelConsumed) {
        DB.fuelLogs.push({ id: DB._nextId("F", DB.fuelLogs), vehicleId: v.id, date: new Date().toISOString().slice(0,10), liters: fuelConsumed, cost: Math.round(fuelConsumed * 75) });
      }
    },

    cancelTrip(tripId) {
      const t = DB.get("trips", tripId);
      if (t.status === "Dispatched") {
        const v = DB.get("vehicles", t.vehicleId);
        const d = DB.get("drivers", t.driverId);
        if (v) v.status = "Available";
        if (d) d.status = "Available";
      }
      t.status = "Cancelled";
    },

    logMaintenance(data) {
      const m = { id: DB._nextId("M", DB.maintenance), status: "In Shop", ...data };
      DB.maintenance.push(m);
      const v = DB.get("vehicles", data.vehicleId);
      if (v && v.status !== "Retired") v.status = "In Shop";
      return m;
    },

    closeMaintenance(id) {
      const m = DB.get("maintenance", id);
      m.status = "Completed";
      const v = DB.get("vehicles", m.vehicleId);
      if (v && v.status !== "Retired") v.status = "Available";
    },

    addFuelLog(data) {
      const f = { id: DB._nextId("F", DB.fuelLogs), ...data };
      DB.fuelLogs.push(f);
      return f;
    },

    addExpense(data) {
      const e = { id: DB._nextId("E", DB.expenses), status: "Available", ...data };
      DB.expenses.push(e);
      return e;
    },

    cycleRbac(role, module) {
      const order = ["none", "view", "edit"];
      const cur = DB.rbac[role][module];
      DB.rbac[role][module] = order[(order.indexOf(cur) + 1) % order.length];
    },
  },
};
