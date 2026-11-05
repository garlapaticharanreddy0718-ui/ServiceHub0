const asyncHandler = require('../utils/asyncHandler');

/**
 * Health check controller for /api/v1/health
 * Returns status ok and service identifier
 */
const getHealthStatus = asyncHandler(async (req, res) => {
  res.status(200).json({
    status: 'ok',
    service: 'servicehub-api',
  });
});

module.exports = {
  getHealthStatus,
};
