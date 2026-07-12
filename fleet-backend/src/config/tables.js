// Central place to map logical table names used throughout the codebase to
// the actual table names in your Supabase project. Since the schema already
// exists, adjust the values on the right if your table/column names differ.
module.exports = {
  USERS: 'users',
  VEHICLES: 'vehicles',
  DRIVERS: 'drivers',
  TRIPS: 'trips',
  MAINTENANCE: 'maintenance',
  FUEL_LOGS: 'fuel_logs',
  EXPENSES: 'expenses',
  RBAC_SETTINGS: 'rbac_settings',
  REFRESH_TOKENS: 'refresh_tokens', // used to support logout / token revocation
};
