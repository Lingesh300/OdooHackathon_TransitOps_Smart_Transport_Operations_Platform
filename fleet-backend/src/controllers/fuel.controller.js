const supabase = require('../config/supabase');
const TABLES = require('../config/tables');
const ApiError = require('../utils/ApiError');
const asyncHandler = require('../utils/asyncHandler');

// GET /fuel-logs?vehicle_id=
const listFuelLogs = asyncHandler(async (req, res) => {
  const { vehicle_id, page = 1, limit = 25 } = req.query;

  let query = supabase.from(TABLES.FUEL_LOGS).select('*', { count: 'exact' });
  if (vehicle_id) query = query.eq('vehicle_id', vehicle_id);

  const from = (Number(page) - 1) * Number(limit);
  const to = from + Number(limit) - 1;
  query = query.order('logged_at', { ascending: false }).range(from, to);

  const { data, error, count } = await query;
  if (error) throw new ApiError(500, 'Failed to fetch fuel logs', error.message);

  return res.status(200).json({
    success: true,
    data,
    pagination: { page: Number(page), limit: Number(limit), total: count },
  });
});

// POST /fuel-logs
const createFuelLog = asyncHandler(async (req, res) => {
  const { vehicle_id, liters, cost, odometer, logged_at } = req.body;

  if (!vehicle_id || !liters || !cost) {
    throw new ApiError(400, 'vehicle_id, liters and cost are required');
  }

  const { data, error } = await supabase
    .from(TABLES.FUEL_LOGS)
    .insert({
      vehicle_id,
      liters,
      cost,
      odometer: odometer || null,
      logged_at: logged_at || new Date().toISOString(),
    })
    .select()
    .single();

  if (error) throw new ApiError(400, 'Failed to create fuel log', error.message);

  return res.status(201).json({ success: true, data });
});

module.exports = { listFuelLogs, createFuelLog };
