const asyncHandler = require('../utils/asyncHandler');
const config = require('../config/env');
const {
  registerUser,
  loginUser,
  refreshTokenPair,
  logoutUser,
  getCurrentUser,
  updateUserProfile,
  changeUserPassword,
} = require('../services/authService');

// Cookie options for HttpOnly Refresh Token
// Cross-origin deployments (e.g., Vercel frontend -> Render backend) require SameSite=None + Secure in production.
const getCookieOptions = () => {
  const isProduction = config.nodeEnv === 'production';
  return {
    httpOnly: true,
    secure: isProduction,
    sameSite: isProduction ? 'none' : 'lax',
    path: '/api/v1/auth',
    maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
  };
};

const getClearCookieOptions = () => {
  const isProduction = config.nodeEnv === 'production';
  return {
    httpOnly: true,
    secure: isProduction,
    sameSite: isProduction ? 'none' : 'lax',
    path: '/api/v1/auth',
  };
};

const isValidationError = (err) => {
  return err.name === 'ZodError' || (err.issues && Array.isArray(err.issues)) || (err.errors && Array.isArray(err.errors));
};

const handleValidationError = (res, err) => {
  const issues = err.issues || err.errors || [];
  const formattedErrors = issues.map((e) => e.message).join(', ');
  return res.status(400).json({
    success: false,
    status: 'fail',
    message: formattedErrors || 'Validation error.',
  });
};

/**
 * POST /api/v1/auth/register
 */
const register = asyncHandler(async (req, res) => {
  try {
    const user = await registerUser(req.body);
    res.status(201).json({
      status: 'success',
      message: 'User registered successfully.',
      data: { user },
    });
  } catch (err) {
    if (isValidationError(err)) {
      return handleValidationError(res, err);
    }
    if (err.statusCode) {
      return res.status(err.statusCode).json({
        status: 'fail',
        message: err.message,
      });
    }
    throw err;
  }
});

/**
 * POST /api/v1/auth/login
 */
const login = asyncHandler(async (req, res) => {
  try {
    const { accessToken, refreshToken, user } = await loginUser(req.body);

    // Set HttpOnly refresh cookie
    res.cookie('refreshToken', refreshToken, getCookieOptions());

    res.status(200).json({
      status: 'success',
      message: 'Login successful.',
      data: {
        accessToken,
        user,
      },
    });
  } catch (err) {
    if (isValidationError(err)) {
      return handleValidationError(res, err);
    }
    if (err.statusCode) {
      return res.status(err.statusCode).json({
        status: 'fail',
        message: err.message,
      });
    }
    throw err;
  }
});

/**
 * POST /api/v1/auth/refresh
 */
const refresh = asyncHandler(async (req, res) => {
  const rawRefreshToken = req.cookies?.refreshToken;

  try {
    const { accessToken, refreshToken } = await refreshTokenPair(rawRefreshToken);

    // Set updated HttpOnly refresh cookie
    res.cookie('refreshToken', refreshToken, getCookieOptions());

    res.status(200).json({
      status: 'success',
      data: {
        accessToken,
      },
    });
  } catch (err) {
    res.clearCookie('refreshToken', getClearCookieOptions());

    return res.status(err.statusCode || 401).json({
      status: 'fail',
      message: err.message || 'Unable to refresh authentication token.',
    });
  }
});

/**
 * POST /api/v1/auth/logout
 */
const logout = asyncHandler(async (req, res) => {
  const rawRefreshToken = req.cookies?.refreshToken;

  await logoutUser(rawRefreshToken);

  res.clearCookie('refreshToken', getClearCookieOptions());

  res.status(200).json({
    status: 'success',
    message: 'Logout successful.',
  });
});

/**
 * GET /api/v1/auth/me (Protected)
 */
const me = asyncHandler(async (req, res) => {
  const user = await getCurrentUser(req.user.id);

  res.status(200).json({
    status: 'success',
    data: { user },
  });
});

/**
 * PATCH /api/v1/auth/me (Protected)
 */
const updateMe = asyncHandler(async (req, res) => {
  try {
    const user = await updateUserProfile(req.user.id, req.body);
    res.status(200).json({
      status: 'success',
      message: 'Profile updated successfully.',
      data: { user },
    });
  } catch (err) {
    if (isValidationError(err)) return handleValidationError(res, err);
    if (err.statusCode) return res.status(err.statusCode).json({ status: 'fail', message: err.message });
    throw err;
  }
});

/**
 * POST /api/v1/auth/change-password (Protected)
 */
const changePassword = asyncHandler(async (req, res) => {
  try {
    const user = await changeUserPassword(req.user.id, req.body);
    res.status(200).json({
      status: 'success',
      message: 'Password changed successfully.',
      data: { user },
    });
  } catch (err) {
    if (isValidationError(err)) return handleValidationError(res, err);
    if (err.statusCode) return res.status(err.statusCode).json({ status: 'fail', message: err.message });
    throw err;
  }
});

module.exports = {
  register,
  login,
  refresh,
  logout,
  me,
  updateMe,
  changePassword,
};
