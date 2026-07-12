// ============================================================
// TransitOps — Screen Renderers
// Each Screens.xxx() returns the inner HTML for #page-content.
// Business logic lives in data.js; these only render + wire events.
// ============================================================

const Screens = {

  // ---------------- 1. DASHBOARD ----------------
  dashboard() {
    const activeVehicles = DB.vehicles.filter(v => v.status !== "Retired").length;
    const availableVehicles = DB.vehicles.filter(v => v.status === "Available").length;
    const inMaint = DB.vehicles.filter(v => v.status === "In Shop").length;
    const activeTrips = DB.trips.filter(t => t.status === "Dispatched").length;
    const pendingTrips = DB.trips.filter(t => t.status === "Draft").length;
    const driversOnDuty = DB.drivers.filter(d => d.status !== "Off Duty" && d.status !== "Suspended").length;

    const kpis = [
      { label: "Active Vehicles", value: activeVehicles, color: "blue" },
      { label: "Available Vehicles", value: availableVehicles, color: "green" },
      { label: "Vehicles in Maintenance", value: inMaint, color: "orange" },
      { label: "Active Trips", value: activeTrips, color: "blue" },
      { label: "Pending Trips", value: pendingTrips, color: "blue" },
      { label: "Drivers on Duty", value: driversOnDuty, color: "blue" },
      { label: "Fleet Utilization", value: DB.fleetUtilization() + "%", color: "green" },
    ];

    const recentTrips = DB.trips.slice(-4);
    const statusCounts = {
      Available: DB.vehicles.filter(v => v.status === "Available").length,
      "On Trip": DB.vehicles.filter(v => v.status === "On Trip").length,
      "In Shop": DB.vehicles.filter(v => v.status === "In Shop").length,
      Retired: DB.vehicles.filter(v => v.status === "Retired").length,
    };
    const colorMap = { Available: "var(--success)", "On Trip": "var(--accent)", "In Shop": "var(--warning)", Retired: "var(--danger)" };

    return `
      <div class="page-title">Dashboard</div>
      <div class="filter-row">
        <select><option>Vehicle Type: All</option>${[...new Set(DB.vehicles.map(v=>v.type))].map(t=>`<option>${t}</option>`).join("")}</select>
        <select><option>Status: All</option>${["Available","On Trip","In Shop","Retired"].map(s=>`<option>${s}</option>`).join("")}</select>
        <select><option>Region: All</option>${[...new Set(DB.vehicles.map(v=>v.region))].map(r=>`<option>${r}</option>`).join("")}</select>
      </div>
      ${UI.kpiRow(kpis)}
      <div class="grid-2">
        ${UI.panel("Recent Trips", UI.table(
          [
            { label: "Trip", render: r => r.id },
            { label: "Vehicle", render: r => DB.get("vehicles", r.vehicleId)?.name || "—" },
            { label: "Driver", render: r => DB.get("drivers", r.driverId)?.name || "—" },
            { label: "Status", render: r => UI.pill(r.status) },
            { label: "ETA", render: r => UI.escape(r.eta || "—") },
          ], recentTrips
        ))}
        ${UI.panel("Vehicle Status", UI.stackBar(
          Object.entries(statusCounts).map(([label, value]) => ({ label, value, max: DB.vehicles.length, color: colorMap[label] }))
        ))}
      </div>
    `;
  },

  // ---------------- 2. FLEET / VEHICLE REGISTRY ----------------
  fleet() {
    const canEdit = Access.can("fleet", "edit");
    return `
      <div class="page-title">Vehicle Registry</div>
      <div class="filter-row">
        <select><option>Type: All</option>${[...new Set(DB.vehicles.map(v=>v.type))].map(t=>`<option>${t}</option>`).join("")}</select>
        <select><option>Status: All</option>${["Available","On Trip","In Shop","Retired"].map(s=>`<option>${s}</option>`).join("")}</select>
        <input placeholder="Search reg. no..." />
        <span class="spacer"></span>
        ${canEdit ? `<button class="btn btn-primary" onclick="Actions.openAddVehicle()">+ Add Vehicle</button>` : ""}
      </div>
      <div class="panel">
        ${UI.table([
          { label: "Reg. No. (unique)", render: r => r.regNo },
          { label: "Name/Model", render: r => r.name },
          { label: "Type", render: r => r.type },
          { label: "Capacity", render: r => r.capacity + " kg" },
          { label: "Odometer", render: r => r.odometer.toLocaleString() },
          { label: "Acq. Cost", render: r => r.acqCost.toLocaleString() },
          { label: "Status", render: r => UI.pill(r.status) },
          ...(canEdit ? [{ label: "", render: r => `
            <button class="btn btn-sm btn-ghost" onclick="Actions.openEditVehicle('${r.id}')">Edit</button>
            <button class="btn btn-sm btn-danger-outline" onclick="Actions.deleteVehicle('${r.id}')">Delete</button>
          ` }] : []),
        ], DB.vehicles)}
      </div>
      <div class="helper-text">Rule: Registration No. must be unique · Retired/In Shop vehicles are hidden from Trip Dispatching.</div>
    `;
  },

  // ---------------- 3. DRIVERS ----------------
  drivers() {
    const canEdit = Access.can("drivers", "edit");
    return `
      <div class="page-title">Drivers & Safety Profiles</div>
      <div class="filter-row">
        <input placeholder="Search..." />
        <span class="spacer"></span>
        ${canEdit ? `<button class="btn btn-primary" onclick="Actions.openAddDriver()">+ Add Driver</button>` : ""}
      </div>
      <div class="panel">
        ${UI.table([
          { label: "Driver", render: r => r.name },
          { label: "License No.", render: r => r.licenseNo },
          { label: "Category", render: r => r.category },
          { label: "Expiry", render: r => r.expiry + (DB.isLicenseExpired(r) ? `<span class="expired">EXPIRED</span>` : "") },
          { label: "Contact", render: r => r.contact },
          { label: "Trip Compl.", render: r => r.tripCompletion + "%" },
          { label: "Safety", render: r => UI.pill(r.safety) },
          { label: "Status", render: r => UI.pill(r.status) },
          ...(canEdit ? [{ label: "", render: r => `
            <button class="btn btn-sm btn-ghost" onclick="Actions.openEditDriver('${r.id}')">Edit</button>
            <button class="btn btn-sm btn-danger-outline" onclick="Actions.deleteDriver('${r.id}')">Delete</button>
          ` }] : []),
        ], DB.drivers)}
      </div>
      ${canEdit ? `
      <div class="panel" style="margin-top:14px;">
        <div class="panel-title">Toggle Status (select a driver row first)</div>
        <select id="toggle-driver-select">${DB.drivers.map(d => `<option value="${d.id}">${d.name}</option>`).join("")}</select>
        <div style="display:flex; gap:8px; margin-top:10px;">
          ${["Available","On Trip","Off Duty","Suspended"].map(s => `<button class="btn btn-sm ${s==='Suspended'?'btn-danger':'btn-ghost'}" onclick="Actions.toggleDriver('${s}')">${s}</button>`).join("")}
        </div>
      </div>` : ""}
      <div class="helper-text">Rule: Expired license or Suspended status → blocked from trip assignment.</div>
    `;
  },

  // ---------------- 4. TRIPS / DISPATCHER ----------------
  trips() {
    const canEdit = Access.can("trips", "edit");
    const steps = ["Draft", "Dispatched", "Completed", "Cancelled"];
    const draft = State.draftTrip;
    const currentIdx = draft.status === "Cancelled" ? 3 : steps.indexOf(draft.status || "Draft");

    const check = (draft.vehicleId && draft.driverId && draft.cargoWeight)
      ? DB.actions.validateDispatch(draft.vehicleId, draft.driverId, Number(draft.cargoWeight))
      : { ok: true };

    return `
      <div class="page-title">Trip Dispatcher</div>
      <div class="grid-2-narrow">
        <div class="panel">
          ${UI.stepper(steps, currentIdx, draft.status === "Cancelled")}
          <div class="panel-title">Create Trip</div>
          ${UI.field("Source", `<input id="trip-source" value="${UI.escape(draft.source||"")}" oninput="Actions.updateDraft('source', this.value)" />`)}
          ${UI.field("Destination", `<input id="trip-destination" value="${UI.escape(draft.destination||"")}" oninput="Actions.updateDraft('destination', this.value)" />`)}
          ${UI.field("Vehicle (available only)", `
            <select onchange="Actions.updateDraft('vehicleId', this.value)">
              <option value="">Select vehicle...</option>
              ${DB.dispatchableVehicles().map(v => `<option value="${v.id}" ${draft.vehicleId===v.id?"selected":""}>${v.name} — ${v.capacity} kg capacity</option>`).join("")}
            </select>`)}
          ${UI.field("Driver (available only)", `
            <select onchange="Actions.updateDraft('driverId', this.value)">
              <option value="">Select driver...</option>
              ${DB.dispatchableDrivers().map(d => `<option value="${d.id}" ${draft.driverId===d.id?"selected":""}>${d.name}</option>`).join("")}
            </select>`)}
          ${UI.field("Cargo Weight (kg)", `<input type="number" value="${draft.cargoWeight||""}" oninput="Actions.updateDraft('cargoWeight', this.value)" />`)}
          ${UI.field("Planned Distance (km)", `<input type="number" value="${draft.plannedDistance||""}" oninput="Actions.updateDraft('plannedDistance', this.value)" />`)}
          ${!check.ok ? UI.banner(check.reason) : ""}
          <div class="form-actions">
            <button class="btn btn-primary" ${(!canEdit || !check.ok || !draft.vehicleId || !draft.driverId) ? "disabled" : ""} onclick="Actions.dispatchDraftTrip()">Dispatch</button>
            <button class="btn btn-danger-outline" onclick="Actions.resetDraftTrip()">Cancel</button>
          </div>
        </div>

        <div class="panel">
          <div class="panel-title">Live Board</div>
          ${DB.trips.slice().reverse().map(t => `
            <div class="board-card">
              <div class="board-top"><span>${t.id}</span>${UI.pill(t.status)}</div>
              <div class="board-route">${UI.escape(t.source)} → ${UI.escape(t.destination)}</div>
              <div class="board-meta">
                <span>${DB.vehicleLabel(DB.get("vehicles", t.vehicleId))} ${t.driverId ? "/ " + DB.get("drivers", t.driverId).name : ""}</span>
                <span>${UI.escape(t.eta || "")}</span>
              </div>
              ${canEdit && t.status === "Dispatched" ? `
                <div class="form-actions">
                  <button class="btn btn-sm btn-secondary" onclick="Actions.openCompleteTrip('${t.id}')">Complete</button>
                  <button class="btn btn-sm btn-danger-outline" onclick="Actions.cancelTrip('${t.id}')">Cancel Trip</button>
                </div>` : ""}
            </div>
          `).join("")}
          <div class="helper-text info">On Complete: odometer → Fuel log → Expenses → Vehicle & Driver Available.</div>
        </div>
      </div>
    `;
  },

  // ---------------- 5. MAINTENANCE ----------------
  maintenance() {
    return `
      <div class="page-title">Maintenance</div>
      <div class="grid-2-narrow">
        <div class="panel">
          <div class="panel-title">Log Service Record</div>
          ${UI.field("Vehicle", `<select id="maint-vehicle"><option value="">Select vehicle...</option>${DB.vehicles.filter(v=>v.status!=="Retired").map(v => `<option value="${v.id}">${v.name}</option>`).join("")}</select>`)}
          ${UI.field("Service Type", `<input id="maint-service" placeholder="Oil Change" />`)}
          ${UI.field("Cost", `<input id="maint-cost" type="number" placeholder="2500" />`)}
          ${UI.field("Date", `<input id="maint-date" type="date" value="${new Date().toISOString().slice(0,10)}" />`)}
          <button class="btn btn-primary btn-block" onclick="Actions.logMaintenance()">Save</button>

          <div style="margin-top:20px;">
            <div class="flow-row"><span class="state-available">Available</span><span class="flow-arrow">— log service record →</span><span class="state-inshop">In Shop</span></div>
            <div class="flow-row"><span class="state-inshop">In Shop</span><span class="flow-arrow">— close service record →</span><span class="state-available">Available</span></div>
          </div>
          <div class="helper-text">Note: In Shop vehicles are removed from the dispatch pool.</div>
        </div>

        <div class="panel">
          <div class="panel-title">Service Log</div>
          ${UI.table([
            { label: "Vehicle", render: r => DB.get("vehicles", r.vehicleId)?.name || "—" },
            { label: "Service", render: r => r.service },
            { label: "Cost", render: r => r.cost.toLocaleString() },
            { label: "Status", render: r => r.status === "In Shop"
                ? `${UI.pill(r.status)} <button class="btn btn-sm btn-ghost" style="margin-left:8px;" onclick="Actions.closeMaintenance('${r.id}')">Close</button>`
                : UI.pill(r.status) },
          ], DB.maintenance.slice().reverse())}
        </div>
      </div>
    `;
  },

  // ---------------- 6. FUEL & EXPENSES ----------------
  fuelExpenses() {
    const canEdit = Access.can("fuel", "edit");
    return `
      <div class="page-title">Fuel & Expense Management</div>
      <div class="panel">
        <div class="filter-row" style="margin-bottom:0;">
          <div class="panel-title" style="margin-bottom:0;">Fuel Logs</div>
          <span class="spacer"></span>
          ${canEdit ? `<button class="btn btn-primary btn-sm" onclick="Actions.openLogFuel()">+ Log Fuel</button>
          <button class="btn btn-secondary btn-sm" onclick="Actions.openAddExpense()">+ Add Expense</button>` : ""}
        </div>
        ${UI.table([
          { label: "Vehicle", render: r => DB.get("vehicles", r.vehicleId)?.name || "—" },
          { label: "Date", render: r => r.date },
          { label: "Liters", render: r => r.liters + " L" },
          { label: "Fuel Cost", render: r => r.cost.toLocaleString() },
        ], DB.fuelLogs.slice().reverse())}
      </div>

      <div class="panel">
        <div class="panel-title">Other Expenses (Toll / Misc)</div>
        ${UI.table([
          { label: "Trip", render: r => r.tripId || "—" },
          { label: "Vehicle", render: r => DB.get("vehicles", r.vehicleId)?.name || "—" },
          { label: "Toll", render: r => r.toll },
          { label: "Other", render: r => r.other },
          { label: "Maint. (linked)", render: r => r.maint },
          { label: "Total", render: r => (r.toll + r.other + r.maint).toLocaleString() },
          { label: "Status", render: r => UI.pill(r.status) },
        ], DB.expenses.slice().reverse())}
      </div>

      <div class="panel total-cost-bar" style="padding-top:0;">
        <span>Total Operational Cost (Auto) = Fuel + Maintenance</span>
        <span class="amount">${DB.totalOperationalCost().toLocaleString()}</span>
      </div>
    `;
  },

  // ---------------- 7. ANALYTICS ----------------
  analytics() {
    const roiVehicles = DB.vehicles.filter(v => v.status !== "Retired").map(v => {
      const cost = DB.operationalCost(v.id);
      const revenue = Math.round(cost * 1.6); // demo assumption — see design doc §10
      const roi = (((revenue - cost) / v.acqCost) * 100).toFixed(1);
      return { ...v, cost, roi };
    });
    const topCostly = roiVehicles.slice().sort((a,b) => b.cost - a.cost).slice(0,3);
    const maxCost = Math.max(...topCostly.map(v => v.cost), 1);
    const colors = ["var(--danger)", "var(--warning)", "var(--accent)"];

    const avgRoi = (roiVehicles.reduce((s,v)=>s+Number(v.roi),0) / (roiVehicles.length||1)).toFixed(1);

    return `
      <div class="page-title">Reports & Analytics</div>
      ${UI.kpiRow([
        { label: "Fuel Efficiency", value: DB.fuelEfficiency() + " km/l", color: "blue" },
        { label: "Fleet Utilization", value: DB.fleetUtilization() + "%", color: "green" },
        { label: "Operational Cost", value: DB.totalOperationalCost().toLocaleString(), color: "orange" },
        { label: "Vehicle ROI", value: avgRoi + "%", color: "green" },
      ])}
      <div class="helper-text info" style="margin-top:-10px; margin-bottom:16px;">ROI = (Revenue − (Maintenance + Fuel)) / Acquisition Cost</div>
      <div class="grid-2">
        ${UI.panel("Monthly Revenue", UI.barChart(DB.revenueByMonth, ["Jan","Feb","Mar","Apr","May","Jun","Jul"]))}
        ${UI.panel("Top Costliest Vehicles", UI.hbarList(topCostly.map((v,i) => ({ label: v.name, value: v.cost, max: maxCost, color: colors[i] }))))}
      </div>
      <div style="margin-top:16px;">
        <button class="btn btn-ghost" onclick="Actions.exportCsv()">⬇ Export CSV</button>
      </div>
    `;
  },

  // ---------------- 8. SETTINGS & RBAC ----------------
  settings() {
    const modules = [
      { key: "fleet", label: "Fleet" },
      { key: "drivers", label: "Driver" },
      { key: "trips", label: "Trips" },
      { key: "fuel", label: "Fuel/Exp." },
      { key: "analytics", label: "Analytics" },
    ];
    return `
      <div class="page-title">Settings & RBAC</div>
      <div class="grid-2">
        <div class="panel">
          <div class="panel-title">General</div>
          ${UI.field("Depot Name", `<input id="settings-depot" value="${UI.escape(DB.settings.depotName)}" />`)}
          ${UI.field("Currency", `<input id="settings-currency" value="${UI.escape(DB.settings.currency)}" />`)}
          ${UI.field("Distance Unit", `<input id="settings-unit" value="${UI.escape(DB.settings.distanceUnit)}" />`)}
          <button class="btn btn-primary" onclick="Actions.saveSettings()">Save changes</button>
        </div>
        <div class="panel">
          <div class="panel-title">Role-Based Access (RBAC) — click a cell to cycle none / view / edit</div>
          <table class="data-table rbac-table">
            <thead><tr><th>Role</th>${modules.map(m => `<th>${m.label}</th>`).join("")}</tr></thead>
            <tbody>
              ${DB.roles.map(role => `
                <tr>
                  <td>${role}</td>
                  ${modules.map(m => `<td class="access-cell" onclick="Actions.cycleRbac('${role}','${m.key}')">${UI.rbacPill(DB.rbac[role][m.key])}</td>`).join("")}
                </tr>`).join("")}
            </tbody>
          </table>
        </div>
      </div>
    `;
  },
};
