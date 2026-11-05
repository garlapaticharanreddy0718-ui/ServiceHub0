const express = require('express');
const {
  handleGetCustomerReviews,
  handleCreateReview,
} = require('../controllers/reviewController');
const { authenticate } = require('../middleware/authMiddleware');

const router = express.Router();

// Require authentication for all review routes
router.use(authenticate);

router.get('/me', handleGetCustomerReviews);
router.post('/', handleCreateReview);

module.exports = router;
