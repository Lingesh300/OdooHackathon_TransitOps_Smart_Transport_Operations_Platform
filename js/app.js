// ============================================================
// TransitOps — App Controller
// Handles auth, hash-based routing, RBAC-gated nav, and all
// button/form actions that mutate DB and re-render.
// ============================================================

const NAV_ITEMS = [
  { route: "dashboard",    label: "Dashboard",         module: null },
  { route: "fleet",        label: "Fleet",             module: "fleet" },
  { route: "drivers",      label: "Drivers",           module: "drivers" },
  { route: "trips",        label: "Trips",             module: "trips" },
  { route: "maintenance",  label: "Maintenance",       module: "fleet" },
  { route: "fuel",         label: "Fuel & Expenses",   module: "fuel" },
  { route: "analytics",    label: "Analytics",         module: "analytics" },
  { route: "settings",     label: "Settings",          module: null },
];

const DEFAULT_ROUTE = {
  "Fleet Manager": "fleet",
  "Dispatcher": "dashboard",
  "Safety Officer": "drivers",
  "Financial Analyst": "fuel",
};

let State = {
  loginAttempts: 0,
  locked: false,
  draftTrip: {},
};

const Access = {
  can(module, level) {
    if (!module) return true;
    const role = DB.currentUser?.role;
    if (!role) return false;
    const cur = DB.rbac[role][module];
    if (level === "view") return cur === "view" || cur === "edit";
    if (level === "edit") return cur === "edit";
    return cur !== "none";
  },
};

// ---------------- Auth ----------------
document.getElementById("login-form").addEventListener("submit", (e) => {
  e.preventDefault();
  if (State.locked) return;

  const email = document.getElementById("login-email").value.trim();
  const password = document.getElementById("login-password").value;
  const role = document.getElementById("login-role").value;
  const errBox = document.getElementById("login-error");

  // Demo auth: any non-empty email/password combo works EXCEPT the literal "fail" password,
  // which is reserved for demoing the lockout flow.
  if (!email || !password || password === "fail") {
    State.loginAttempts++;
    if (State.loginAttempts >= 5) {
      State.locked = true;
      errBox.textContent = "✗ Account locked after 5 failed attempts.";
    } else {
      errBox.textContent = `✗ Invalid credentials. (${State.loginAttempts}/5 attempts)`;
    }
    errBox.style.display = "block";
    return;
  }

  DB.currentUser = { name: email.split("@")[0] || "Raven K.", role };
  document.getElementById("login-view").style.display = "none";
  document.getElementById("app-shell").style.display = "flex";
  document.getElementById("topbar-user").textContent = DB.currentUser.name;
  document.getElementById("topbar-role").textContent = role;
  renderSidebar();
  navigate(DEFAULT_ROUTE[role] || "dashboard");
});

document.getElementById("logout-btn").addEventListener("click", () => {
  DB.currentUser = null;
  document.getElementById("app-shell").style.display = "none";
  document.getElementById("login-view").style.display = "flex";
  document.getElementById("login-form").reset();
});

// ---------------- Router ----------------
function renderSidebar() {
  const nav = document.getElementById("sidebar-nav");
  nav.innerHTML = NAV_ITEMS.map(item => {
    const allowed = Access.can(item.module, "view");
    return `<a href="#${item.route}" class="${allowed ? "" : "disabled"}" data-route="${item.route}">${item.label}</a>`;
  }).join("");
}

function navigate(route) {
  const item = NAV_ITEMS.find(i => i.route === route);
  if (!item || !Access.can(item.module, "view")) route = DEFAULT_ROUTE[DB.currentUser.role];

  document.querySelectorAll("#sidebar-nav a").forEach(a => a.classList.toggle("active", a.dataset.route === route));
  window.location.hash = route;

  const map = {
    dashboard: Screens.dashboard,
    fleet: Screens.fleet,
    drivers: Screens.drivers,
    trips: Screens.trips,
    maintenance: Screens.maintenance,
    fuel: Screens.fuelExpenses,
    analytics: Screens.analytics,
    settings: Screens.settings,
  };
  document.getElementById("page-content").innerHTML = (map[route] || Screens.dashboard)();
}

document.getElementById("sidebar-nav").addEventListener("click", (e) => {
  const a = e.target.closest("a[data-route]");
  if (!a || a.classList.contains("disabled")) { e.preventDefault(); return; }
  e.preventDefault();
  navigate(a.dataset.route);
});

// ---------------- Actions (wired from screens.js via window.Actions) ----------------
const Actions = {
  // Vehicles
  openAddVehicle() {
    UI.modal("Add Vehicle", `
      <div id="modal-error"></div>
      ${UI.field("Registration No.", `<input id="mv-regno" placeholder="GJ01AB1234" />`)}
      ${UI.field("Name/Model", `<input id="mv-name" placeholder="VAN-12" />`)}
      <div class="two-col">
        ${UI.field("Type", `<select id="mv-type"><option>Van</option><option>Truck</option><option>Mini</option></select>`)}
        ${UI.field("Capacity (kg)", `<input id="mv-capacity" type="number" placeholder="500" />`)}
      </div>
      ${UI.field("Acquisition Cost", `<input id="mv-cost" type="number" placeholder="500000" />`)}
      ${UI.field("Region", `<input id="mv-region" placeholder="Gandhinagar" />`)}
      <div class="form-actions">
        <button class="btn btn-primary" onclick="Actions.submitAddVehicle()">Save</button>
        <button class="btn btn-ghost" onclick="UI.closeModal()">Cancel</button>
      </div>
    `);
  },
  submitAddVehicle() {
    try {
      DB.actions.addVehicle({
        regNo: document.getElementById("mv-regno").value.trim(),
        name: document.getElementById("mv-name").value.trim(),
        type: document.getElementById("mv-type").value,
        capacity: Number(document.getElementById("mv-capacity").value),
        acqCost: Number(document.getElementById("mv-cost").value),
        region: document.getElementById("mv-region").value.trim() || "Unassigned",
      });
      UI.closeModal();
      navigate("fleet");
    } catch (e) {
      document.getElementById("modal-error").innerHTML = UI.banner(e.message);
    }
  },

  // Drivers
  openAddDriver() {
    UI.modal("Add Driver", `
      <div id="modal-error"></div>
      ${UI.field("Name", `<input id="md-name" placeholder="Alex" />`)}
      ${UI.field("License No.", `<input id="md-license" placeholder="DL-12345" />`)}
      <div class="two-col">
        ${UI.field("Category", `<select id="md-category"><option>LMV</option><option>HMV</option></select>`)}
        ${UI.field("License Expiry", `<input id="md-expiry" type="date" />`)}
      </div>
      ${UI.field("Contact Number", `<input id="md-contact" placeholder="98765xxxxx" />`)}
      <div class="form-actions">
        <button class="btn btn-primary" onclick="Actions.submitAddDriver()">Save</button>
        <button class="btn btn-ghost" onclick="UI.closeModal()">Cancel</button>
      </div>
    `);
  },
  submitAddDriver() {
    try {
      DB.actions.addDriver({
        name: document.getElementById("md-name").value.trim(),
        licenseNo: document.getElementById("md-license").value.trim(),
        category: document.getElementById("md-category").value,
        expiry: document.getElementById("md-expiry").value,
        contact: document.getElementById("md-contact").value.trim(),
      });
      UI.closeModal();
      navigate("drivers");
    } catch (e) {
      document.getElementById("modal-error").innerHTML = UI.banner(e.message);
    }
  },
  toggleDriver(status) {
    const id = document.getElementById("toggle-driver-select").value;
    DB.actions.toggleDriverStatus(id, status);
    navigate("drivers");
  },

  // Trips
  updateDraft(field, value) {
    State.draftTrip[field] = value;
    navigate("trips");
  },
  resetDraftTrip() {
    State.draftTrip = {};
    navigate("trips");
  },
  dispatchDraftTrip() {
    const d = State.draftTrip;
    const trip = DB.actions.createTrip({
      source: d.source || "—",
      destination: d.destination || "—",
      vehicleId: d.vehicleId,
      driverId: d.driverId,
      cargoWeight: Number(d.cargoWeight),
      plannedDistance: Number(d.plannedDistance) || 0,
    });
    try {
      DB.actions.dispatchTrip(trip.id);
      State.draftTrip = {};
    } catch (e) {
      alert(e.message);
    }
    navigate("trips");
  },
  cancelTrip(tripId) {
    DB.actions.cancelTrip(tripId);
    navigate("trips");
  },
  openCompleteTrip(tripId) {
    const t = DB.get("trips", tripId);
    const v = DB.get("vehicles", t.vehicleId);
    UI.modal("Complete Trip " + tripId, `
      ${UI.field("Final Odometer (km)", `<input id="ct-odo" type="number" value="${v.odometer + (t.plannedDistance||0)}" />`)}
      ${UI.field("Actual Distance (km)", `<input id="ct-dist" type="number" value="${t.plannedDistance||0}" />`)}
      ${UI.field("Fuel Consumed (L)", `<input id="ct-fuel" type="number" placeholder="40" />`)}
      <div class="form-actions">
        <button class="btn btn-primary" onclick="Actions.submitCompleteTrip('${tripId}')">Complete Trip</button>
        <button class="btn btn-ghost" onclick="UI.closeModal()">Cancel</button>
      </div>
    `);
  },
  submitCompleteTrip(tripId) {
    DB.actions.completeTrip(tripId, {
      finalOdometer: Number(document.getElementById("ct-odo").value),
      actualDistance: Number(document.getElementById("ct-dist").value),
      fuelConsumed: Number(document.getElementById("ct-fuel").value) || 0,
    });
    UI.closeModal();
    navigate("trips");
  },

  // Maintenance
  logMaintenance() {
    const vehicleId = document.getElementById("maint-vehicle").value;
    const service = document.getElementById("maint-service").value.trim();
    const cost = Number(document.getElementById("maint-cost").value);
    const date = document.getElementById("maint-date").value;
    if (!vehicleId || !service) { alert("Select a vehicle and enter a service type."); return; }
    DB.actions.logMaintenance({ vehicleId, service, cost, date });
    navigate("maintenance");
  },
  closeMaintenance(id) {
    DB.actions.closeMaintenance(id);
    navigate("maintenance");
  },

  // Fuel & Expenses
  openLogFuel() {
    UI.modal("Log Fuel", `
      ${UI.field("Vehicle", `<select id="lf-vehicle">${DB.vehicles.map(v => `<option value="${v.id}">${v.name}</option>`).join("")}</select>`)}
      ${UI.field("Date", `<input id="lf-date" type="date" value="${new Date().toISOString().slice(0,10)}" />`)}
      <div class="two-col">
        ${UI.field("Liters", `<input id="lf-liters" type="number" placeholder="40" />`)}
        ${UI.field("Fuel Cost", `<input id="lf-cost" type="number" placeholder="3000" />`)}
      </div>
      <div class="form-actions">
        <button class="btn btn-primary" onclick="Actions.submitLogFuel()">Save</button>
        <button class="btn btn-ghost" onclick="UI.closeModal()">Cancel</button>
      </div>
    `);
  },
  submitLogFuel() {
    DB.actions.addFuelLog({
      vehicleId: document.getElementById("lf-vehicle").value,
      date: document.getElementById("lf-date").value,
      liters: Number(document.getElementById("lf-liters").value),
      cost: Number(document.getElementById("lf-cost").value),
    });
    UI.closeModal();
    navigate("fuel");
  },
  openAddExpense() {
    UI.modal("Add Expense", `
      ${UI.field("Vehicle", `<select id="ae-vehicle">${DB.vehicles.map(v => `<option value="${v.id}">${v.name}</option>`).join("")}</select>`)}
      ${UI.field("Trip ID (optional)", `<input id="ae-trip" placeholder="TR001" />`)}
      <div class="two-col">
        ${UI.field("Toll", `<input id="ae-toll" type="number" placeholder="0" />`)}
        ${UI.field("Other", `<input id="ae-other" type="number" placeholder="0" />`)}
      </div>
      <div class="form-actions">
        <button class="btn btn-primary" onclick="Actions.submitAddExpense()">Save</button>
        <button class="btn btn-ghost" onclick="UI.closeModal()">Cancel</button>
      </div>
    `);
  },
  submitAddExpense() {
    DB.actions.addExpense({
      vehicleId: document.getElementById("ae-vehicle").value,
      tripId: document.getElementById("ae-trip").value.trim() || null,
      toll: Number(document.getElementById("ae-toll").value) || 0,
      other: Number(document.getElementById("ae-other").value) || 0,
      maint: 0,
    });
    UI.closeModal();
    navigate("fuel");
  },

  // Analytics
  exportCsv() {
    const rows = [["Vehicle","RegNo","Type","Status","OperationalCost"]];
    DB.vehicles.forEach(v => rows.push([v.name, v.regNo, v.type, v.status, DB.operationalCost(v.id)]));
    const csv = rows.map(r => r.join(",")).join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = "transitops_analytics.csv";
    a.click();
  },

  // Settings / RBAC
  saveSettings() {
    DB.settings.depotName = document.getElementById("settings-depot").value;
    DB.settings.currency = document.getElementById("settings-currency").value;
    DB.settings.distanceUnit = document.getElementById("settings-unit").value;
    alert("Settings saved.");
  },
  cycleRbac(role, module) {
    DB.actions.cycleRbac(role, module);
    navigate("settings");
    renderSidebar();
  },
};

window.Actions = Actions;
window.UI = UI;
window.State = State;
