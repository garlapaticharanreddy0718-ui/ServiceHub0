const express = require('express');
const { getHealthStatus } = require('../controllers/healthController');

const router = express.Router();

// GET /api/v1/health
router.get('/health', getHealthStatus);

module.exports = router;
