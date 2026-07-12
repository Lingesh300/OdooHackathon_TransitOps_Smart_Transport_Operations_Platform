const supabase = require('../config/supabase');
const TABLES = require('../config/tables');
const ApiError = require('../utils/ApiError');
const asyncHandler = require('../utils/asyncHandler');

// GET /trips?status=
const listTrips = asyncHandler(async (req, res) => {
  const { status, page = 1, limit = 25 } = req.query;

  let query = supabase.from(TABLES.TRIPS).select('*', { count: 'exact' });
  if (status) query = query.eq('status', status);

  const from = (Number(page) - 1) * Number(limit);
  const to = from + Number(limit) - 1;
  query = query.order('created_at', { ascending: false }).range(from, to);

  const { data, error, count } = await query;
  if (error) throw new ApiError(500, 'Failed to fetch trips', error.message);

  return res.status(200).json({
    success: true,
    data,
    pagination: { page: Number(page), limit: Number(limit), total: count },
  });
});

// GET /trips/:id
const getTripById = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { data, error } = await supabase
    .from(TABLES.TRIPS)
    .select('*')
    .eq('id', id)
    .maybeSingle();

  if (error) throw new ApiError(500, 'Failed to fetch trip', error.message);
  if (!data) throw new ApiError(404, 'Trip not found');

  return res.status(200).json({ success: true, data });
});

// POST /trips -> creates a Draft trip
const createTrip = asyncHandler(async (req, res) => {
  const { vehicle_id, driver_id, origin, destination, scheduled_at } = req.body;

  if (!origin || !destination) {
    throw new ApiError(400, 'origin and destination are required');
  }

  const { data, error } = await supabase
    .from(TABLES.TRIPS)
    .insert({
      vehicle_id: vehicle_id || null,
      driver_id: driver_id || null,
      origin,
      destination,
      scheduled_at: scheduled_at || null,
      status: 'Draft',
    })
    .select()
    .single();

  if (error) throw new ApiError(400, 'Failed to create trip', error.message);

  return res.status(201).json({ success: true, data });
});

// POST /trips/:id/dispatch
const dispatchTrip = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { vehicle_id, driver_id } = req.body;

  const { data: trip, error: fetchError } = await supabase
    .from(TABLES.TRIPS)
    .select('*')
    .eq('id', id)
    .maybeSingle();

  if (fetchError) throw new ApiError(500, 'Failed to fetch trip', fetchError.message);
  if (!trip) throw new ApiError(404, 'Trip not found');
  if (trip.status !== 'Draft') {
    throw new ApiError(409, `Trip cannot be dispatched from status '${trip.status}'`);
  }

  const finalVehicleId = vehicle_id || trip.vehicle_id;
  const finalDriverId = driver_id || trip.driver_id;

  if (!finalVehicleId || !finalDriverId) {
    throw new ApiError(400, 'A vehicle_id and driver_id are required to dispatch a trip');
  }

  // Confirm vehicle + driver are actually available before assigning them.
  const { data: vehicle, error: vErr } = await supabase
    .from(TABLES.VEHICLES)
    .select('id, status')
    .eq('id', finalVehicleId)
    .maybeSingle();
  if (vErr) throw new ApiError(500, 'Failed to fetch vehicle', vErr.message);
  if (!vehicle) throw new ApiError(404, 'Vehicle not found');
  if (vehicle.status !== 'Available') {
    throw new ApiError(409, 'Selected vehicle is not Available');
  }

  const { data: driver, error: dErr } = await supabase
    .from(TABLES.DRIVERS)
    .select('id, status, license_expiry')
    .eq('id', finalDriverId)
    .maybeSingle();
  if (dErr) throw new ApiError(500, 'Failed to fetch driver', dErr.message);
  if (!driver) throw new ApiError(404, 'Driver not found');
  if (driver.status !== 'Available') {
    throw new ApiError(409, 'Selected driver is not Available');
  }
  if (driver.license_expiry && new Date(driver.license_expiry) < new Date()) {
    throw new ApiError(409, "Selected driver's license has expired");
  }

  const nowIso = new Date().toISOString();

  const { data: updatedTrip, error: updateError } = await supabase
    .from(TABLES.TRIPS)
    .update({
      vehicle_id: finalVehicleId,
      driver_id: finalDriverId,
      status: 'Dispatched',
      dispatched_at: nowIso,
      updated_at: nowIso,
    })
    .eq('id', id)
    .select()
    .single();

  if (updateError) throw new ApiError(400, 'Failed to dispatch trip', updateError.message);

  await Promise.all([
    supabase.from(TABLES.VEHICLES).update({ status: 'On Trip', updated_at: nowIso }).eq('id', finalVehicleId),
    supabase.from(TABLES.DRIVERS).update({ status: 'On Trip', updated_at: nowIso }).eq('id', finalDriverId),
  ]);

  return res.status(200).json({ success: true, data: updatedTrip });
});

// POST /trips/:id/complete
const completeTrip = asyncHandler(async (req, res) => {
  const { id } = req.params;

  const { data: trip, error: fetchError } = await supabase
    .from(TABLES.TRIPS)
    .select('*')
    .eq('id', id)
    .maybeSingle();

  if (fetchError) throw new ApiError(500, 'Failed to fetch trip', fetchError.message);
  if (!trip) throw new ApiError(404, 'Trip not found');
  if (trip.status !== 'Dispatched') {
    throw new ApiError(409, `Trip cannot be completed from status '${trip.status}'`);
  }

  const nowIso = new Date().toISOString();

  const { data: updatedTrip, error: updateError } = await supabase
    .from(TABLES.TRIPS)
    .update({ status: 'Completed', completed_at: nowIso, updated_at: nowIso })
    .eq('id', id)
    .select()
    .single();

  if (updateError) throw new ApiError(400, 'Failed to complete trip', updateError.message);

  await Promise.all([
    trip.vehicle_id &&
      supabase.from(TABLES.VEHICLES).update({ status: 'Available', updated_at: nowIso }).eq('id', trip.vehicle_id),
    trip.driver_id &&
      supabase.from(TABLES.DRIVERS).update({ status: 'Available', updated_at: nowIso }).eq('id', trip.driver_id),
  ]);

  return res.status(200).json({ success: true, data: updatedTrip });
});

// POST /trips/:id/cancel
const cancelTrip = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { reason } = req.body;

  const { data: trip, error: fetchError } = await supabase
    .from(TABLES.TRIPS)
    .select('*')
    .eq('id', id)
    .maybeSingle();

  if (fetchError) throw new ApiError(500, 'Failed to fetch trip', fetchError.message);
  if (!trip) throw new ApiError(404, 'Trip not found');
  if (['Completed', 'Cancelled'].includes(trip.status)) {
    throw new ApiError(409, `Trip cannot be cancelled from status '${trip.status}'`);
  }

  const nowIso = new Date().toISOString();

  const { data: updatedTrip, error: updateError } = await supabase
    .from(TABLES.TRIPS)
    .update({
      status: 'Cancelled',
      cancelled_at: nowIso,
      cancel_reason: reason || null,
      updated_at: nowIso,
    })
    .eq('id', id)
    .select()
    .single();

  if (updateError) throw new ApiError(400, 'Failed to cancel trip', updateError.message);

  // Only free up vehicle/driver if they had actually been reserved (i.e. trip was Dispatched).
  if (trip.status === 'Dispatched') {
    await Promise.all([
      trip.vehicle_id &&
        supabase.from(TABLES.VEHICLES).update({ status: 'Available', updated_at: nowIso }).eq('id', trip.vehicle_id),
      trip.driver_id &&
        supabase.from(TABLES.DRIVERS).update({ status: 'Available', updated_at: nowIso }).eq('id', trip.driver_id),
    ]);
  }

  return res.status(200).json({ success: true, data: updatedTrip });
});

module.exports = {
  listTrips,
  getTripById,
  createTrip,
  dispatchTrip,
  completeTrip,
  cancelTrip,
};
