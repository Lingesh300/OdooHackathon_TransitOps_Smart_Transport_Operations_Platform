const supabase = require('../config/supabase');
const TABLES = require('../config/tables');
const ApiError = require('../utils/ApiError');
const asyncHandler = require('../utils/asyncHandler');

// GET /dashboard/kpis?vehicleType=&status=&region=
const getKpis = asyncHandler(async (req, res) => {
  const { vehicleType, status, region } = req.query;

  let vehicleQuery = supabase.from(TABLES.VEHICLES).select('id, status, type, region');
  if (vehicleType) vehicleQuery = vehicleQuery.eq('type', vehicleType);
  if (status) vehicleQuery = vehicleQuery.eq('status', status);
  if (region) vehicleQuery = vehicleQuery.eq('region', region);

  const [{ data: vehicles, error: vErr }, { data: trips, error: tErr }, { data: drivers, error: dErr }] =
    await Promise.all([
      vehicleQuery,
      supabase.from(TABLES.TRIPS).select('id, status'),
      supabase.from(TABLES.DRIVERS).select('id, status'),
    ]);

  if (vErr) throw new ApiError(500, 'Failed to fetch vehicle KPIs', vErr.message);
  if (tErr) throw new ApiError(500, 'Failed to fetch trip KPIs', tErr.message);
  if (dErr) throw new ApiError(500, 'Failed to fetch driver KPIs', dErr.message);

  const vehicleCountByStatus = (vehicles || []).reduce((acc, v) => {
    acc[v.status] = (acc[v.status] || 0) + 1;
    return acc;
  }, {});

  const tripCountByStatus = (trips || []).reduce((acc, t) => {
    acc[t.status] = (acc[t.status] || 0) + 1;
    return acc;
  }, {});

  const driverCountByStatus = (drivers || []).reduce((acc, d) => {
    acc[d.status] = (acc[d.status] || 0) + 1;
    return acc;
  }, {});

  return res.status(200).json({
    success: true,
    data: {
      totalVehicles: (vehicles || []).length,
      vehicleCountByStatus,
      totalTrips: (trips || []).length,
      tripCountByStatus,
      totalDrivers: (drivers || []).length,
      driverCountByStatus,
    },
  });
});

module.exports = { getKpis };
