const supabase = require('../config/supabase');
const TABLES = require('../config/tables');
const ApiError = require('../utils/ApiError');
const asyncHandler = require('../utils/asyncHandler');

// GET /drivers?status=
const listDrivers = asyncHandler(async (req, res) => {
  const { status, page = 1, limit = 25 } = req.query;

  let query = supabase.from(TABLES.DRIVERS).select('*', { count: 'exact' });
  if (status) query = query.eq('status', status);

  const from = (Number(page) - 1) * Number(limit);
  const to = from + Number(limit) - 1;
  query = query.order('created_at', { ascending: false }).range(from, to);

  const { data, error, count } = await query;
  if (error) throw new ApiError(500, 'Failed to fetch drivers', error.message);

  return res.status(200).json({
    success: true,
    data,
    pagination: { page: Number(page), limit: Number(limit), total: count },
  });
});

// GET /drivers/dispatch-pool -> Available + license not expired
const getDispatchPool = asyncHandler(async (req, res) => {
  const today = new Date().toISOString().slice(0, 10);

  const { data, error } = await supabase
    .from(TABLES.DRIVERS)
    .select('*')
    .eq('status', 'Available')
    .gt('license_expiry', today);

  if (error) throw new ApiError(500, 'Failed to fetch driver dispatch pool', error.message);

  return res.status(200).json({ success: true, data });
});

// GET /drivers/:id
const getDriverById = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { data, error } = await supabase
    .from(TABLES.DRIVERS)
    .select('*')
    .eq('id', id)
    .maybeSingle();

  if (error) throw new ApiError(500, 'Failed to fetch driver', error.message);
  if (!data) throw new ApiError(404, 'Driver not found');

  return res.status(200).json({ success: true, data });
});

// POST /drivers
const createDriver = asyncHandler(async (req, res) => {
  const { name, license_number, license_expiry, phone, status } = req.body;

  if (!name || !license_number || !license_expiry) {
    throw new ApiError(400, 'name, license_number and license_expiry are required');
  }

  const { data, error } = await supabase
    .from(TABLES.DRIVERS)
    .insert({
      name,
      license_number,
      license_expiry,
      phone: phone || null,
      status: status || 'Available',
    })
    .select()
    .single();

  if (error) throw new ApiError(400, 'Failed to create driver', error.message);

  return res.status(201).json({ success: true, data });
});

// PATCH /drivers/:id/status
const updateDriverStatus = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { status } = req.body;

  if (!status) throw new ApiError(400, 'status is required');

  const { data, error } = await supabase
    .from(TABLES.DRIVERS)
    .update({ status, updated_at: new Date().toISOString() })
    .eq('id', id)
    .select()
    .maybeSingle();

  if (error) throw new ApiError(400, 'Failed to update driver status', error.message);
  if (!data) throw new ApiError(404, 'Driver not found');

  return res.status(200).json({ success: true, data });
});

module.exports = {
  listDrivers,
  getDispatchPool,
  getDriverById,
  createDriver,
  updateDriverStatus,
};
