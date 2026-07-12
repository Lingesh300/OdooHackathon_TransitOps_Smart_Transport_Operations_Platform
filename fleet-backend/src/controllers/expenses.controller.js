const supabase = require('../config/supabase');
const TABLES = require('../config/tables');
const ApiError = require('../utils/ApiError');
const asyncHandler = require('../utils/asyncHandler');

// GET /expenses?vehicle_id=
const listExpenses = asyncHandler(async (req, res) => {
  const { vehicle_id, category, page = 1, limit = 25 } = req.query;

  let query = supabase.from(TABLES.EXPENSES).select('*', { count: 'exact' });
  if (vehicle_id) query = query.eq('vehicle_id', vehicle_id);
  if (category) query = query.eq('category', category);

  const from = (Number(page) - 1) * Number(limit);
  const to = from + Number(limit) - 1;
  query = query.order('created_at', { ascending: false }).range(from, to);

  const { data, error, count } = await query;
  if (error) throw new ApiError(500, 'Failed to fetch expenses', error.message);

  return res.status(200).json({
    success: true,
    data,
    pagination: { page: Number(page), limit: Number(limit), total: count },
  });
});

// POST /expenses
const createExpense = asyncHandler(async (req, res) => {
  const { vehicle_id, category, amount, description, incurred_at } = req.body;

  if (!vehicle_id || !category || !amount) {
    throw new ApiError(400, 'vehicle_id, category and amount are required');
  }

  const { data, error } = await supabase
    .from(TABLES.EXPENSES)
    .insert({
      vehicle_id,
      category,
      amount,
      description: description || null,
      incurred_at: incurred_at || new Date().toISOString(),
    })
    .select()
    .single();

  if (error) throw new ApiError(400, 'Failed to create expense', error.message);

  return res.status(201).json({ success: true, data });
});

// GET /expenses/vehicle/:id/total
const getVehicleExpenseTotal = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { from, to } = req.query;

  let query = supabase.from(TABLES.EXPENSES).select('amount, category').eq('vehicle_id', id);
  if (from) query = query.gte('incurred_at', from);
  if (to) query = query.lte('incurred_at', to);

  const { data, error } = await query;
  if (error) throw new ApiError(500, 'Failed to compute expense total', error.message);

  const total = (data || []).reduce((sum, row) => sum + Number(row.amount || 0), 0);
  const byCategory = (data || []).reduce((acc, row) => {
    acc[row.category] = (acc[row.category] || 0) + Number(row.amount || 0);
    return acc;
  }, {});

  return res.status(200).json({
    success: true,
    data: { vehicle_id: id, total, byCategory, recordCount: data.length },
  });
});

module.exports = { listExpenses, createExpense, getVehicleExpenseTotal };
