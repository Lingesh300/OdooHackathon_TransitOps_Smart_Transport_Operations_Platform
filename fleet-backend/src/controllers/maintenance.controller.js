const supabase = require('../config/supabase');
const TABLES = require('../config/tables');
const ApiError = require('../utils/ApiError');
const asyncHandler = require('../utils/asyncHandler');

// GET /maintenance?status=
const listMaintenance = asyncHandler(async (req, res) => {
  const { status, vehicle_id, page = 1, limit = 25 } = req.query;

  let query = supabase.from(TABLES.MAINTENANCE).select('*', { count: 'exact' });
  if (status) query = query.eq('status', status);
  if (vehicle_id) query = query.eq('vehicle_id', vehicle_id);

  const from = (Number(page) - 1) * Number(limit);
  const to = from + Number(limit) - 1;
  query = query.order('created_at', { ascending: false }).range(from, to);

  const { data, error, count } = await query;
  if (error) throw new ApiError(500, 'Failed to fetch maintenance records', error.message);

  return res.status(200).json({
    success: true,
    data,
    pagination: { page: Number(page), limit: Number(limit), total: count },
  });
});

// POST /maintenance -> opens a record, sets vehicle to "In Shop"
const openMaintenance = asyncHandler(async (req, res) => {
  const { vehicle_id, issue, notes, estimated_cost } = req.body;

  if (!vehicle_id || !issue) {
    throw new ApiError(400, 'vehicle_id and issue are required');
  }

  const { data: vehicle, error: vErr } = await supabase
    .from(TABLES.VEHICLES)
    .select('id, status')
    .eq('id', vehicle_id)
    .maybeSingle();
  if (vErr) throw new ApiError(500, 'Failed to fetch vehicle', vErr.message);
  if (!vehicle) throw new ApiError(404, 'Vehicle not found');

  const nowIso = new Date().toISOString();

  const { data, error } = await supabase
    .from(TABLES.MAINTENANCE)
    .insert({
      vehicle_id,
      issue,
      notes: notes || null,
      estimated_cost: estimated_cost || null,
      status: 'Open',
      opened_at: nowIso,
    })
    .select()
    .single();

  if (error) throw new ApiError(400, 'Failed to open maintenance record', error.message);

  await supabase.from(TABLES.VEHICLES).update({ status: 'In Shop', updated_at: nowIso }).eq('id', vehicle_id);

  return res.status(201).json({ success: true, data });
});

// PATCH /maintenance/:id/close -> closes record, sets vehicle to "Available"
const closeMaintenance = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { actual_cost, notes } = req.body;

  const { data: record, error: fetchError } = await supabase
    .from(TABLES.MAINTENANCE)
    .select('*')
    .eq('id', id)
    .maybeSingle();

  if (fetchError) throw new ApiError(500, 'Failed to fetch maintenance record', fetchError.message);
  if (!record) throw new ApiError(404, 'Maintenance record not found');
  if (record.status === 'Closed') throw new ApiError(409, 'Maintenance record is already closed');

  const nowIso = new Date().toISOString();

  const { data, error } = await supabase
    .from(TABLES.MAINTENANCE)
    .update({
      status: 'Closed',
      closed_at: nowIso,
      actual_cost: actual_cost ?? record.actual_cost ?? null,
      notes: notes || record.notes,
      updated_at: nowIso,
    })
    .eq('id', id)
    .select()
    .single();

  if (error) throw new ApiError(400, 'Failed to close maintenance record', error.message);

  await supabase
    .from(TABLES.VEHICLES)
    .update({ status: 'Available', updated_at: nowIso })
    .eq('id', record.vehicle_id);

  return res.status(200).json({ success: true, data });
});

module.exports = { listMaintenance, openMaintenance, closeMaintenance };
