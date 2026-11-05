const asyncHandler = require('../utils/asyncHandler');
const {
  createBusiness,
  getUserBusinesses,
  getBusinessById,
  updateBusiness,
  getBusinessMembers,
  addBusinessMember,
  updateMemberRole,
} = require('../services/businessService');

const isValidationError = (err) => {
  return err.name === 'ZodError' || (err.issues && Array.isArray(err.issues)) || (err.errors && Array.isArray(err.errors));
};

const handleValidationError = (res, err) => {
  const issues = err.issues || err.errors || [];
  const formattedErrors = issues.map((e) => e.message).join(', ');
  return res.status(400).json({
    success: false,
    message: formattedErrors || 'Validation error.',
  });
};

/**
 * POST /api/v1/businesses - Create a new business (Creator becomes OWNER)
 */
const handleCreateBusiness = asyncHandler(async (req, res) => {
  try {
    const business = await createBusiness(req.user.id, req.body);
    res.status(201).json({
      success: true,
      data: business,
    });
  } catch (err) {
    if (isValidationError(err)) {
      return handleValidationError(res, err);
    }
    if (err.statusCode) {
      return res.status(err.statusCode).json({
        success: false,
        message: err.message,
      });
    }
    throw err;
  }
});

/**
 * GET /api/v1/businesses - Get all businesses for the authenticated user
 */
const handleGetMyBusinesses = asyncHandler(async (req, res) => {
  const businesses = await getUserBusinesses(req.user.id);
  res.status(200).json({
    success: true,
    data: businesses,
  });
});

/**
 * GET /api/v1/businesses/:businessId - Get business by ID
 */
const handleGetBusinessById = asyncHandler(async (req, res) => {
  try {
    const business = await getBusinessById(req.params.businessId, req.user.id);
    res.status(200).json({
      success: true,
      data: business,
    });
  } catch (err) {
    if (err.statusCode) {
      return res.status(err.statusCode).json({
        success: false,
        message: err.message,
      });
    }
    throw err;
  }
});

/**
 * PATCH /api/v1/businesses/:businessId - Update business (OWNER / ADMIN only)
 */
const handleUpdateBusiness = asyncHandler(async (req, res) => {
  try {
    const business = await updateBusiness(req.params.businessId, req.body);
    res.status(200).json({
      success: true,
      data: business,
    });
  } catch (err) {
    if (isValidationError(err)) {
      return handleValidationError(res, err);
    }
    if (err.statusCode) {
      return res.status(err.statusCode).json({
        success: false,
        message: err.message,
      });
    }
    throw err;
  }
});

/**
 * GET /api/v1/businesses/:businessId/members - Get members (OWNER / ADMIN only)
 */
const handleGetMembers = asyncHandler(async (req, res) => {
  const members = await getBusinessMembers(req.params.businessId);
  res.status(200).json({
    success: true,
    data: members,
  });
});

/**
 * POST /api/v1/businesses/:businessId/members - Add member (OWNER only)
 */
const handleAddMember = asyncHandler(async (req, res) => {
  try {
    const newMember = await addBusinessMember(req.params.businessId, req.body);
    res.status(201).json({
      success: true,
      data: newMember,
    });
  } catch (err) {
    if (isValidationError(err)) {
      return handleValidationError(res, err);
    }
    if (err.statusCode) {
      return res.status(err.statusCode).json({
        success: false,
        message: err.message,
      });
    }
    throw err;
  }
});

/**
 * PATCH /api/v1/businesses/:businessId/members/:memberId/role - Change member role (OWNER only)
 */
const handleUpdateMemberRole = asyncHandler(async (req, res) => {
  try {
    const updatedMember = await updateMemberRole(
      req.params.businessId,
      req.params.memberId,
      req.body
    );
    res.status(200).json({
      success: true,
      data: updatedMember,
    });
  } catch (err) {
    if (isValidationError(err)) {
      return handleValidationError(res, err);
    }
    if (err.statusCode) {
      return res.status(err.statusCode).json({
        success: false,
        message: err.message,
      });
    }
    throw err;
  }
});

/**
 * GET /api/v1/businesses/nearby - Get nearby businesses with distance calculations
 */
const handleGetNearbyBusinesses = asyncHandler(async (req, res) => {
  const { lat, lng, radius, search, category, sort } = req.query;
  const { getNearbyBusinesses } = require('../services/businessService');

  const businesses = await getNearbyBusinesses({ lat, lng, radius, search, category, sort });
  res.status(200).json({
    success: true,
    data: businesses,
  });
});

module.exports = {
  handleCreateBusiness,
  handleGetMyBusinesses,
  handleGetBusinessById,
  handleUpdateBusiness,
  handleGetMembers,
  handleAddMember,
  handleUpdateMemberRole,
  handleGetNearbyBusinesses,
};
