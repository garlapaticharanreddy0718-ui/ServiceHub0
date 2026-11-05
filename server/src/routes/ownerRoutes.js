const express = require('express');
const { getOwnerDashboard, getSetupStatus } = require('../controllers/ownerDashboardController');
const { authenticate } = require('../middleware/authMiddleware');

const router = express.Router();

// Owner Protected Routes
router.get('/dashboard', authenticate, getOwnerDashboard);
router.get('/setup-status', authenticate, getSetupStatus);

module.exports = router;
