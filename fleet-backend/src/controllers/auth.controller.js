const bcrypt = require('bcryptjs');
const supabase = require('../config/supabase');
const TABLES = require('../config/tables');
const ApiError = require('../utils/ApiError');
const asyncHandler = require('../utils/asyncHandler');
const {
  signAccessToken,
  signRefreshToken,
  verifyRefreshToken,
} = require('../utils/jwt');

// POST /auth/login
const login = asyncHandler(async (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    throw new ApiError(400, 'Email and password are required');
  }

  const { data: user, error } = await supabase
    .from(TABLES.USERS)
    .select('id, email, password_hash, name, role')
    .eq('email', email.toLowerCase().trim())
    .maybeSingle();

  if (error) throw new ApiError(500, 'Failed to look up user', error.message);
  if (!user) throw new ApiError(401, 'Invalid email or password');

  const passwordValid = await bcrypt.compare(password, user.password_hash);
  if (!passwordValid) throw new ApiError(401, 'Invalid email or password');

  const payload = { sub: user.id, email: user.email, role: user.role };
  const accessToken = signAccessToken(payload);
  const refreshToken = signRefreshToken(payload);

  // Persist refresh token so it can be individually revoked on logout.
  const { error: insertError } = await supabase.from(TABLES.REFRESH_TOKENS).insert({
    user_id: user.id,
    token: refreshToken,
    created_at: new Date().toISOString(),
  });
  if (insertError) {
    throw new ApiError(500, 'Failed to persist refresh token', insertError.message);
  }

  return res.status(200).json({
    success: true,
    data: {
      accessToken,
      refreshToken,
      user: { id: user.id, email: user.email, name: user.name, role: user.role },
    },
  });
});

// POST /auth/logout
const logout = asyncHandler(async (req, res) => {
  const { refreshToken } = req.body;
  if (!refreshToken) throw new ApiError(400, 'refreshToken is required');

  const { error } = await supabase
    .from(TABLES.REFRESH_TOKENS)
    .delete()
    .eq('token', refreshToken);

  if (error) throw new ApiError(500, 'Failed to revoke refresh token', error.message);

  return res.status(200).json({ success: true, message: 'Logged out successfully' });
});

// POST /auth/refresh (bonus endpoint, not in original spec but commonly needed)
const refresh = asyncHandler(async (req, res) => {
  const { refreshToken } = req.body;
  if (!refreshToken) throw new ApiError(400, 'refreshToken is required');

  let payload;
  try {
    payload = verifyRefreshToken(refreshToken);
  } catch (err) {
    throw new ApiError(401, 'Invalid or expired refresh token');
  }

  const { data: stored, error } = await supabase
    .from(TABLES.REFRESH_TOKENS)
    .select('id')
    .eq('token', refreshToken)
    .maybeSingle();

  if (error) throw new ApiError(500, 'Failed to validate refresh token', error.message);
  if (!stored) throw new ApiError(401, 'Refresh token has been revoked');

  const newAccessToken = signAccessToken({
    sub: payload.sub,
    email: payload.email,
    role: payload.role,
  });

  return res.status(200).json({ success: true, data: { accessToken: newAccessToken } });
});

// GET /auth/me (bonus endpoint)
const me = asyncHandler(async (req, res) => {
  const { data: user, error } = await supabase
    .from(TABLES.USERS)
    .select('id, email, name, role')
    .eq('id', req.user.id)
    .maybeSingle();

  if (error) throw new ApiError(500, 'Failed to load user', error.message);
  if (!user) throw new ApiError(404, 'User not found');

  return res.status(200).json({ success: true, data: user });
});

module.exports = { login, logout, refresh, me };
