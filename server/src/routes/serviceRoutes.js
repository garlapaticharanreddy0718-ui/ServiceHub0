const express = require('express');
const {
  handleGetCategories,
  handleCreateCategory,
  handleUpdateCategory,
  handleDeleteCategory,
} = require('../controllers/serviceCategoryController');
const {
  handleGetServices,
  handleGetServiceById,
  handleCreateService,
  handleUpdateService,
  handleDeleteService,
} = require('../controllers/serviceController');
const { requireRole } = require('../middleware/rbacMiddleware');

const router = express.Router({ mergeParams: true });

// ==================================================
// SERVICE CATEGORY ROUTES
// ==================================================
router.get('/service-categories', handleGetCategories);
router.post(
  '/service-categories',
  requireRole('OWNER', 'ADMIN'),
  handleCreateCategory
);
router.patch(
  '/service-categories/:categoryId',
  requireRole('OWNER', 'ADMIN'),
  handleUpdateCategory
);
router.delete(
  '/service-categories/:categoryId',
  requireRole('OWNER', 'ADMIN'),
  handleDeleteCategory
);

// ==================================================
// SERVICE ROUTES
// ==================================================
router.get('/services', handleGetServices);
router.post(
  '/services',
  requireRole('OWNER', 'ADMIN'),
  handleCreateService
);
router.get('/services/:serviceId', handleGetServiceById);
router.patch(
  '/services/:serviceId',
  requireRole('OWNER', 'ADMIN'),
  handleUpdateService
);
router.delete(
  '/services/:serviceId',
  requireRole('OWNER', 'ADMIN'),
  handleDeleteService
);

module.exports = router;
