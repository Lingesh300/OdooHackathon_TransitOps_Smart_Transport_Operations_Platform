const supabase = require('../config/supabase');
const TABLES = require('../config/tables');
const ApiError = require('../utils/ApiError');
const asyncHandler = require('../utils/asyncHandler');
const { invalidateRbacCache } = require('../middleware/auth');

// GET /settings/rbac
const getRbac = asyncHandler(async (req, res) => {
  const { data, error } = await supabase.from(TABLES.RBAC_SETTINGS).select('role, permissions');
  if (error) throw new ApiError(500, 'Failed to fetch RBAC settings', error.message);

  return res.status(200).json({ success: true, data });
});

// PUT /settings/rbac
// Body shape: { role: "dispatcher", permissions: { vehicles: ["read"], trips: ["read","write","dispatch"] } }
const updateRbac = asyncHandler(async (req, res) => {
  const { role, permissions } = req.body;

  if (!role || typeof permissions !== 'object') {
    throw new ApiError(400, 'role and permissions (object) are required');
  }

  const { data, error } = await supabase
    .from(TABLES.RBAC_SETTINGS)
    .upsert({ role, permissions, updated_at: new Date().toISOString() }, { onConflict: 'role' })
    .select()
    .single();

  if (error) throw new ApiError(400, 'Failed to update RBAC settings', error.message);

  invalidateRbacCache();

  return res.status(200).json({ success: true, data });
});

module.exports = { getRbac, updateRbac };
