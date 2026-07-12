// ============================================================
// TransitOps — Reusable Component Renderers
// Plain-JS "components": each is a function returning an HTML string.
// Mirrors the component library table in the Frontend Design Doc §3.
// ============================================================

const UI = {
  escape(str) {
    return String(str ?? "").replace(/[&<>"']/g, c => ({ "&":"&amp;", "<":"&lt;", ">":"&gt;", '"':"&quot;", "'":"&#39;" }[c]));
  },

  pill(status) {
    const key = String(status).replace(/\s+/g, "");
    return `<span class="pill pill-${key}">${UI.escape(status)}</span>`;
  },

  rbacPill(level) {
    const map = { edit: "✓", view: "view", none: "–" };
    return `<span class="pill pill-${level}">${map[level]}</span>`;
  },

  kpiCard(label, value, color = "blue") {
    return `
      <div class="kpi-card kpi-${color}">
        <div class="kpi-label">${UI.escape(label)}</div>
        <div class="kpi-value">${UI.escape(value)}</div>
      </div>`;
  },

  kpiRow(items) {
    return `<div class="kpi-row">${items.map(i => UI.kpiCard(i.label, i.value, i.color)).join("")}</div>`;
  },

  table(columns, rows) {
    return `
      <table class="data-table">
        <thead><tr>${columns.map(c => `<th>${UI.escape(c.label)}</th>`).join("")}</tr></thead>
        <tbody>${rows.map(r => `<tr>${columns.map(c => `<td>${c.render(r)}</td>`).join("")}</tr>`).join("")}</tbody>
      </table>`;
  },

  panel(title, innerHtml, extraClass = "") {
    return `<div class="panel ${extraClass}">${title ? `<div class="panel-title">${UI.escape(title)}</div>` : ""}${innerHtml}</div>`;
  },

  stackBar(rows) {
    // rows: [{label, value, max, color}]
    return rows.map(r => `
      <div class="stack-bar-row">
        <div class="bar-label"><span>${UI.escape(r.label)}</span><span>${r.value}</span></div>
        <div class="stack-bar-track"><div class="stack-bar-fill" style="width:${Math.min(100, (r.value / r.max) * 100)}%; background:${r.color}"></div></div>
      </div>`).join("");
  },

  barChart(values, labels) {
    const max = Math.max(...values);
    return `<div class="bar-chart">${values.map((v, i) => `
      <div class="bar-col">
        <div class="bar" style="height:${(v / max) * 100}%"></div>
        <div class="bar-month">${UI.escape(labels[i])}</div>
      </div>`).join("")}</div>`;
  },

  hbarList(rows) {
    // rows: [{label, value, max, color}]
    return rows.map(r => `
      <div class="hbar-row">
        <div class="hbar-label"><span>${UI.escape(r.label)}</span></div>
        <div class="hbar-track"><div class="hbar-fill" style="width:${Math.min(100,(r.value/r.max)*100)}%; background:${r.color}"></div></div>
      </div>`).join("");
  },

  stepper(steps, currentIndex, cancelled) {
    return `<div class="stepper">${steps.map((s, i) => {
      let cls = "";
      if (cancelled && i === steps.length - 1) cls = "cancelled";
      else if (i < currentIndex) cls = "done";
      else if (i === currentIndex) cls = "active";
      return `<div class="step ${cls}"><div class="dot"></div><div class="label">${s}</div></div>`;
    }).join("")}</div>`;
  },

  banner(message, type = "error") {
    if (!message) return "";
    return `<div class="banner banner-${type}">${UI.escape(message).replace(/\n/g, "<br/>")}</div>`;
  },

  modal(title, bodyHtml) {
    const root = document.getElementById("modal-root");
    root.innerHTML = `
      <div class="modal-backdrop" onclick="if(event.target===this) UI.closeModal()">
        <div class="modal-box">
          <h2>${UI.escape(title)}</h2>
          ${bodyHtml}
        </div>
      </div>`;
  },
  closeModal() {
    document.getElementById("modal-root").innerHTML = "";
  },

  field(label, inputHtml) {
    return `<div class="form-field"><label>${UI.escape(label)}</label>${inputHtml}</div>`;
  },
};
