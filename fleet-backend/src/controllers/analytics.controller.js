const supabase = require('../config/supabase');
const TABLES = require('../config/tables');
const ApiError = require('../utils/ApiError');
const asyncHandler = require('../utils/asyncHandler');

// GET /analytics/fuel-efficiency
// Returns cost-per-liter and total consumption per vehicle. If your fuel_logs
// table has an `odometer` reading, this also derives distance covered between
// consecutive logs so you can compute km/liter on the frontend.

const getFuelEfficiency = asyncHandler(async (req, res) => {
  const { data, error } = await supabase
    .from(TABLES.FUEL_LOGS)
    .select('vehicle_id, liters, cost, odometer, logged_at')
    .order('logged_at', { ascending: true });

  if (error) throw new ApiError(500, 'Failed to fetch fuel logs', error.message);

  const byVehicle = {};
  (data || []).forEach((log) => {
    if (!byVehicle[log.vehicle_id]) byVehicle[log.vehicle_id] = [];
    byVehicle[log.vehicle_id].push(log);
  });

  const result = Object.entries(byVehicle).map(([vehicleId, logs]) => {
    const totalLiters = logs.reduce((s, l) => s + Number(l.liters || 0), 0);
    const totalCost = logs.reduce((s, l) => s + Number(l.cost || 0), 0);

    let totalDistance = 0;
    for (let i = 1; i < logs.length; i += 1) {
      if (logs[i].odometer != null && logs[i - 1].odometer != null) {
        totalDistance += Math.max(0, logs[i].odometer - logs[i - 1].odometer);
      }
    }

    return {
      vehicle_id: vehicleId,
      totalLiters,
      totalCost,
      avgCostPerLiter: totalLiters ? Number((totalCost / totalLiters).toFixed(2)) : 0,
      totalDistance,
      kmPerLiter: totalLiters && totalDistance ? Number((totalDistance / totalLiters).toFixed(2)) : null,
      logCount: logs.length,
    };
  });

  return res.status(200).json({ success: true, data: result });
});

// GET /analytics/fleet-utilization
// % of vehicles currently on a trip, plus trip counts within the fleet.
const getFleetUtilization = asyncHandler(async (req, res) => {
  const { data: vehicles, error: vErr } = await supabase.from(TABLES.VEHICLES).select('id, status');
  if (vErr) throw new ApiError(500, 'Failed to fetch vehicles', vErr.message);

  const total = (vehicles || []).length;
  const onTrip = (vehicles || []).filter((v) => v.status === 'On Trip').length;
  const inShop = (vehicles || []).filter((v) => v.status === 'In Shop').length;
  const available = (vehicles || []).filter((v) => v.status === 'Available').length;

  const { data: trips, error: tErr } = await supabase
    .from(TABLES.TRIPS)
    .select('id, status, vehicle_id, dispatched_at, completed_at');
  if (tErr) throw new ApiError(500, 'Failed to fetch trips', tErr.message);

  const completedTrips = (trips || []).filter((t) => t.status === 'Completed');
  const utilizationRate = total ? Number(((onTrip / total) * 100).toFixed(2)) : 0;

  return res.status(200).json({
    success: true,
    data: {
      totalVehicles: total,
      onTrip,
      inShop,
      available,
      utilizationRatePercent: utilizationRate,
      totalTripsCompleted: completedTrips.length,
      totalTripsAll: (trips || []).length,
    },
  });
});

// GET /analytics/operational-cost
// Combined fuel + maintenance + misc expense cost, fleet-wide and per vehicle.
const getOperationalCost = asyncHandler(async (req, res) => {
  const [{ data: fuelLogs, error: fErr }, { data: expenses, error: eErr }, { data: maintenance, error: mErr }] =
    await Promise.all([
      supabase.from(TABLES.FUEL_LOGS).select('vehicle_id, cost'),
      supabase.from(TABLES.EXPENSES).select('vehicle_id, amount'),
      supabase.from(TABLES.MAINTENANCE).select('vehicle_id, actual_cost, estimated_cost'),
    ]);

  if (fErr) throw new ApiError(500, 'Failed to fetch fuel costs', fErr.message);
  if (eErr) throw new ApiError(500, 'Failed to fetch expenses', eErr.message);
  if (mErr) throw new ApiError(500, 'Failed to fetch maintenance costs', mErr.message);

  const costByVehicle = {};

  const addCost = (vehicleId, amount) => {
    if (!vehicleId) return;
    costByVehicle[vehicleId] = (costByVehicle[vehicleId] || 0) + Number(amount || 0);
  };

  (fuelLogs || []).forEach((l) => addCost(l.vehicle_id, l.cost));
  (expenses || []).forEach((e) => addCost(e.vehicle_id, e.amount));
  (maintenance || []).forEach((m) => addCost(m.vehicle_id, m.actual_cost ?? m.estimated_cost));

  const totalFuelCost = (fuelLogs || []).reduce((s, l) => s + Number(l.cost || 0), 0);
  const totalExpenseCost = (expenses || []).reduce((s, e) => s + Number(e.amount || 0), 0);
  const totalMaintenanceCost = (maintenance || []).reduce(
    (s, m) => s + Number(m.actual_cost ?? m.estimated_cost ?? 0),
    0
  );

  return res.status(200).json({
    success: true,
    data: {
      totalFuelCost,
      totalExpenseCost,
      totalMaintenanceCost,
      grandTotal: totalFuelCost + totalExpenseCost + totalMaintenanceCost,
      costByVehicle,
    },
  });
});

// GET /analytics/roi
// NOTE: ROI requires a revenue figure per trip. This assumes an optional
// `revenue` column on the trips table. If that column doesn't exist in your
// schema, revenue will simply be treated as 0 — add the column or point this
// at wherever you track trip/contract revenue.

const getRoi = asyncHandler(async (req, res) => {
  const { data: trips, error: tErr } = await supabase
    .from(TABLES.TRIPS)
    .select('id, vehicle_id, revenue, status')
    .eq('status', 'Completed');
  if (tErr) throw new ApiError(500, 'Failed to fetch trips', tErr.message);

  const [{ data: fuelLogs, error: fErr }, { data: expenses, error: eErr }, { data: maintenance, error: mErr }] =
    await Promise.all([
      supabase.from(TABLES.FUEL_LOGS).select('vehicle_id, cost'),
      supabase.from(TABLES.EXPENSES).select('vehicle_id, amount'),
      supabase.from(TABLES.MAINTENANCE).select('vehicle_id, actual_cost, estimated_cost'),
    ]);
  if (fErr) throw new ApiError(500, 'Failed to fetch fuel costs', fErr.message);
  if (eErr) throw new ApiError(500, 'Failed to fetch expenses', eErr.message);
  if (mErr) throw new ApiError(500, 'Failed to fetch maintenance costs', mErr.message);

  const totalRevenue = (trips || []).reduce((s, t) => s + Number(t.revenue || 0), 0);
  const totalCost =
    (fuelLogs || []).reduce((s, l) => s + Number(l.cost || 0), 0) +
    (expenses || []).reduce((s, e) => s + Number(e.amount || 0), 0) +
    (maintenance || []).reduce((s, m) => s + Number(m.actual_cost ?? m.estimated_cost ?? 0), 0);

  const roiPercent = totalCost ? Number((((totalRevenue - totalCost) / totalCost) * 100).toFixed(2)) : null;

  return res.status(200).json({
    success: true,
    data: {
      totalRevenue,
      totalCost,
      netProfit: totalRevenue - totalCost,
      roiPercent,
      note: 'Revenue is read from trips.revenue. Add/populate that column if it does not exist in your schema yet.',
    },
  });
});

// GET /analytics/export.csv (implemented as /analytics/export?format=csv, see routes)
const exportAnalyticsCsv = asyncHandler(async (req, res) => {
  const { data: vehicles, error } = await supabase
    .from(TABLES.VEHICLES)
    .select('id, name, plate_number, type, status, region');

  if (error) throw new ApiError(500, 'Failed to fetch vehicles for export', error.message);

  const header = ['id', 'name', 'plate_number', 'type', 'status', 'region'];
  const rows = (vehicles || []).map((v) =>
    header.map((key) => `"${String(v[key] ?? '').replace(/"/g, '""')}"`).join(',')
  );
  const csv = [header.join(','), ...rows].join('\n');

  res.setHeader('Content-Type', 'text/csv');
  res.setHeader('Content-Disposition', 'attachment; filename="fleet-analytics-export.csv"');
  return res.status(200).send(csv);
});

module.exports = {
  getFuelEfficiency,
  getFleetUtilization,
  getOperationalCost,
  getRoi,
  exportAnalyticsCsv,
};
