const { verifyAccessToken } = require('../utils/jwt');
const ApiError = require('../utils/ApiError');
const asyncHandler = require('../utils/asyncHandler');
const supabase = require('../config/supabase');
const TABLES = require('../config/tables');

// In-memory cache of role -> permissions so we don't hit the DB on every
// single request. Cleared on TTL expiry. Fine for a single-instance deploy;
// for multi-instance deployments consider Redis instead.
let rbacCache = null;
let rbacCacheExpiry = 0;
const RBAC_CACHE_TTL_MS = 30 * 1000;

async function getRbacConfig() {
  const now = Date.now();
  if (rbacCache && now < rbacCacheExpiry) {
    return rbacCache;
  }

  const { data, error } = await supabase.from(TABLES.RBAC_SETTINGS).select('role, permissions');
  if (error) {
    throw new ApiError(500, 'Failed to load RBAC configuration', error.message);
  }

  const config = {};
  (data || []).forEach((row) => {
    config[row.role] = row.permissions || {};
  });

  rbacCache = config;
  rbacCacheExpiry = now + RBAC_CACHE_TTL_MS;
  return config;
}

function invalidateRbacCache() {
  rbacCache = null;
  rbacCacheExpiry = 0;
}

// Verifies the Bearer JWT and attaches { id, email, role } to req.user
const authenticate = asyncHandler(async (req, res, next) => {
  const header = req.headers.authorization || '';
  const [scheme, token] = header.split(' ');

  if (scheme !== 'Bearer' || !token) {
    throw new ApiError(401, 'Missing or malformed Authorization header');
  }

  try {
    const payload = verifyAccessToken(token);
    req.user = { id: payload.sub, email: payload.email, role: payload.role };
    return next();
  } catch (err) {
    throw new ApiError(401, 'Invalid or expired access token');
  }
});

// Role-based gate: authorize('admin', 'dispatcher')
function authorize(...allowedRoles) {
  return (req, res, next) => {
    if (!req.user) {
      return next(new ApiError(401, 'Not authenticated'));
    }
    if (allowedRoles.length && !allowedRoles.includes(req.user.role)) {
      return next(new ApiError(403, 'You do not have permission to perform this action'));
    }
    return next();
  };
}

// Fine-grained permission gate driven by the /settings/rbac table, e.g.
// requirePermission('vehicles', 'write')
function requirePermission(resource, action) {
  return asyncHandler(async (req, res, next) => {
    if (!req.user) {
      throw new ApiError(401, 'Not authenticated');
    }

    // The admin role always has full access.
    if (req.user.role === 'admin') {
      return next();
    }

    const config = await getRbacConfig();
    const rolePerms = config[req.user.role] || {};
    const actions = rolePerms[resource] || [];

    if (!actions.includes(action)) {
      throw new ApiError(403, `Role '${req.user.role}' cannot '${action}' on '${resource}'`);
    }

    return next();
  });
}

module.exports = { authenticate, authorize, requirePermission, invalidateRbacCache, getRbacConfig };
