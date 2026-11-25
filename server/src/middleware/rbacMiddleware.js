const prisma = require('../config/prisma');

/**
 * Middleware verifying authenticated user is a member of the requested business
 */
const requireBusinessMember = async (req, res, next) => {
  if (!req.user || !req.user.id) {
    return res.status(401).json({
      success: false,
      message: 'Authentication required.',
    });
  }

  const businessId = req.params.businessId || req.headers['x-business-id'] || req.body?.businessId;

  if (!businessId) {
    return res.status(400).json({
      success: false,
      message: 'Business context identifier (businessId) is required.',
    });
  }

  try {
    const member = await prisma.businessMember.findUnique({
      where: {
        userId_businessId: {
          userId: req.user.id,
          businessId,
        },
      },
    });

    if (!member) {
      // Allow customers to read catalog data (GET) and create customer bookings (POST /bookings)
      const isCatalogGet = req.method === 'GET';
      const isCustomerBooking = req.method === 'POST' && req.baseUrl.endsWith('/bookings') || req.path.includes('/bookings');

      if (isCatalogGet || isCustomerBooking) {
        req.businessMember = {
          id: `customer-${req.user.id}`,
          userId: req.user.id,
          businessId,
          role: 'CUSTOMER',
        };
        return next();
      }

      return res.status(403).json({
        success: false,
        message: 'Access denied. You are not a member of this business.',
      });
    }

    req.businessMember = member;
    next();
  } catch (err) {
    console.error('[RBAC] Failed to verify business membership:', {
      method: req.method,
      path: req.originalUrl,
      businessId,
      userId: req.user?.id,
      name: err.name,
      code: err.code,
      message: err.message,
    });

    return res.status(500).json({
      success: false,
      message: 'Failed to verify business membership.',
    });
  }
};

/**
 * Middleware enforcing database-backed role authorization
 * @param  {...string} allowedRoles - Roles allowed to access the route ('OWNER', 'ADMIN', 'STAFF')
 */
const requireRole = (...allowedRoles) => {
  return (req, res, next) => {
    if (!req.businessMember) {
      return res.status(403).json({
        success: false,
        message: 'Business context required before role verification.',
      });
    }

    if (!allowedRoles.includes(req.businessMember.role)) {
      return res.status(403).json({
        success: false,
        message: `Access denied. Insufficient permissions for role '${req.businessMember.role}'.`,
      });
    }

    next();
  };
};

/**
 * Middleware allowing OWNER/ADMIN or STAFF updating their own profile
 */
const requireStaffSelfOrAdmin = async (req, res, next) => {
  if (!req.businessMember) {
    return res.status(403).json({
      success: false,
      message: 'Business context required before role verification.',
    });
  }

  if (['OWNER', 'ADMIN'].includes(req.businessMember.role)) {
    return next();
  }

  if (req.businessMember.role === 'STAFF' && req.params.staffId) {
    try {
      const staff = await prisma.staff.findUnique({
        where: { id: req.params.staffId },
      });

      if (staff && staff.businessMemberId === req.businessMember.id) {
        return next();
      }
    } catch (err) {
      console.error('[RBAC] Failed to verify staff self-access:', {
        method: req.method,
        path: req.originalUrl,
        staffId: req.params.staffId,
        userId: req.user?.id,
        name: err.name,
        code: err.code,
        message: err.message,
      });
      // Fallthrough to 403
    }
  }

  return res.status(403).json({
    success: false,
    message: 'Access denied. You can only update your own staff profile/schedule.',
  });
};

module.exports = {
  requireBusinessMember,
  requireRole,
  requireStaffSelfOrAdmin,
};
