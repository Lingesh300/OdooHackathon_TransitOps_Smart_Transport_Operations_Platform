const supabase = require('../config/supabase');
const TABLES = require('../config/tables');
const ApiError = require('../utils/ApiError');
const asyncHandler = require('../utils/asyncHandler');

// GET /vehicles?status=&type=&region=
const listVehicles = asyncHandler(async (req, res) => {
  const { status, type, region, page = 1, limit = 25 } = req.query;

  let query = supabase.from(TABLES.VEHICLES).select('*', { count: 'exact' });

  if (status) query = query.eq('status', status);
  if (type) query = query.eq('type', type);
  if (region) query = query.eq('region', region);

  const from = (Number(page) - 1) * Number(limit);
  const to = from + Number(limit) - 1;
  query = query.order('created_at', { ascending: false }).range(from, to);

  const { data, error, count } = await query;
  if (error) throw new ApiError(500, 'Failed to fetch vehicles', error.message);

  return res.status(200).json({
    success: true,
    data,
    pagination: { page: Number(page), limit: Number(limit), total: count },
  });
});

// GET /vehicles/dispatch-pool  -> status=Available only
const getDispatchPool = asyncHandler(async (req, res) => {
  const { type, region } = req.query;

  let query = supabase.from(TABLES.VEHICLES).select('*').eq('status', 'Available');
  if (type) query = query.eq('type', type);
  if (region) query = query.eq('region', region);

  const { data, error } = await query;
  if (error) throw new ApiError(500, 'Failed to fetch dispatch pool', error.message);

  return res.status(200).json({ success: true, data });
});

// GET /vehicles/:id
const getVehicleById = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { data, error } = await supabase
    .from(TABLES.VEHICLES)
    .select('*')
    .eq('id', id)
    .maybeSingle();

  if (error) throw new ApiError(500, 'Failed to fetch vehicle', error.message);
  if (!data) throw new ApiError(404, 'Vehicle not found');

  return res.status(200).json({ success: true, data });
});

// POST /vehicles
const createVehicle = asyncHandler(async (req, res) => {
  const { name, plate_number, type, region, status } = req.body;

  if (!name || !plate_number || !type) {
    throw new ApiError(400, 'name, plate_number and type are required');
  }

  const { data, error } = await supabase
    .from(TABLES.VEHICLES)
    .insert({
      name,
      plate_number,
      type,
      region: region || null,
      status: status || 'Available',
    })
    .select()
    .single();

  if (error) throw new ApiError(400, 'Failed to create vehicle', error.message);

  return res.status(201).json({ success: true, data });
});

// PUT /vehicles/:id
const updateVehicle = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const updates = { ...req.body, updated_at: new Date().toISOString() };
  delete updates.id;

  const { data, error } = await supabase
    .from(TABLES.VEHICLES)
    .update(updates)
    .eq('id', id)
    .select()
    .maybeSingle();

  if (error) throw new ApiError(400, 'Failed to update vehicle', error.message);
  if (!data) throw new ApiError(404, 'Vehicle not found');

  return res.status(200).json({ success: true, data });
});

module.exports = {
  listVehicles,
  getDispatchPool,
  getVehicleById,
  createVehicle,
  updateVehicle,
};
