const asyncHandler = require('../utils/asyncHandler');
const { getCustomerReviews, createReview, getBusinessReviews } = require('../services/reviewService');

/**
 * GET /api/v1/reviews/me
 * Fetch customer's reviewable completed appointments and submitted reviews
 */
const handleGetCustomerReviews = asyncHandler(async (req, res) => {
  const data = await getCustomerReviews(req.user.id);
  res.json({
    status: 'success',
    data,
  });
});

/**
 * POST /api/v1/reviews
 * Submit a review for a completed booking
 */
const handleCreateReview = asyncHandler(async (req, res) => {
  const bookingId = req.body.bookingId || req.params.bookingId;
  const rating = Number(req.body.rating);
  const comment = req.body.comment;

  const review = await createReview(req.user.id, {
    bookingId,
    rating,
    comment,
  });

  res.status(201).json({
    status: 'success',
    data: review,
  });
});

/**
 * GET /api/v1/businesses/:businessId/reviews
 * Fetch reviews for a specific business (Owner/Staff view)
 */
const handleGetBusinessReviews = asyncHandler(async (req, res) => {
  const { businessId } = req.params;
  const data = await getBusinessReviews(businessId);
  res.json({
    status: 'success',
    data,
  });
});

module.exports = {
  handleGetCustomerReviews,
  handleCreateReview,
  handleGetBusinessReviews,
};
