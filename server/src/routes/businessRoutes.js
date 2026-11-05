const express = require('express');
const {
  handleCreateBusiness,
  handleGetMyBusinesses,
  handleGetBusinessById,
  handleUpdateBusiness,
  handleGetMembers,
  handleAddMember,
  handleUpdateMemberRole,
  handleGetNearbyBusinesses,
} = require('../controllers/businessController');
const { authenticate } = require('../middleware/authMiddleware');
const { requireBusinessMember, requireRole } = require('../middleware/rbacMiddleware');

const router = express.Router();

// Apply authentication to all business routes
router.use(authenticate);

// Business discovery & creation
router.post('/', handleCreateBusiness);
router.get('/', handleGetMyBusinesses);
router.get('/nearby', handleGetNearbyBusinesses);

// Business context specific endpoints (Requires membership in :businessId)
router.get('/:businessId', requireBusinessMember, handleGetBusinessById);

// Business details update (OWNER & ADMIN only)
router.patch(
  '/:businessId',
  requireBusinessMember,
  requireRole('OWNER', 'ADMIN'),
  handleUpdateBusiness
);

// Member management: List members (OWNER & ADMIN only)
router.get(
  '/:businessId/members',
  requireBusinessMember,
  requireRole('OWNER', 'ADMIN'),
  handleGetMembers
);

// Member management: Add member (OWNER only)
router.post(
  '/:businessId/members',
  requireBusinessMember,
  requireRole('OWNER'),
  handleAddMember
);

// Member management: Update member role (OWNER only)
router.patch(
  '/:businessId/members/:memberId/role',
  requireBusinessMember,
  requireRole('OWNER'),
  handleUpdateMemberRole
);

// Business Reviews listing (Requires membership in :businessId)
const { handleGetBusinessReviews } = require('../controllers/reviewController');
router.get(
  '/:businessId/reviews',
  requireBusinessMember,
  handleGetBusinessReviews
);

module.exports = router;

