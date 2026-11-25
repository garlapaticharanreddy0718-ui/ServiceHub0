const config = require('../config/env');

/**
 * Handle 404 Not Found requests
 */
const notFoundHandler = (req, res, next) => {
  const error = new Error(`Resource not found - ${req.originalUrl}`);
  res.status(404);
  next(error);
};

/**
 * Centralized global error handler
 */
const errorHandler = (err, req, res, next) => {
  const statusCode = err.statusCode || (res.statusCode === 200 ? 500 : res.statusCode);

  if (statusCode >= 500) {
    console.error('[ErrorHandler] Server error:', {
      method: req.method,
      path: req.originalUrl,
      statusCode,
      name: err.name,
      code: err.code,
      message: err.message,
      stack: err.stack,
    });
  }

  res.status(statusCode).json({
    status: statusCode >= 500 ? 'error' : 'fail',
    message: err.message || 'Internal Server Error',
    ...(config.nodeEnv === 'development' && { stack: err.stack }),
  });
};

module.exports = {
  notFoundHandler,
  errorHandler,
};
