const asyncHandler = require('../utils/asyncHandler');
const {
  createBooking,
  getBookings,
  getBookingById,
  updateBooking,
  cancelBooking,
  changeBookingStatus,
  getBookingHistory,
  getAvailability,
} = require('../services/bookingService');

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

const handleCreateBooking = asyncHandler(async (req, res) => {
  try {
    const booking = await createBooking(req.params.businessId, req.user.id, req.body);
    res.status(201).json({
      success: true,
      data: booking,
    });
  } catch (err) {
    if (isValidationError(err)) return handleValidationError(res, err);
    if (err.statusCode) return res.status(err.statusCode).json({ success: false, message: err.message });
    throw err;
  }
});

const handleGetBookings = asyncHandler(async (req, res) => {
  try {
    const result = await getBookings(
      req.params.businessId,
      req.businessMember.role,
      req.user.id,
      req.query
    );
    res.status(200).json({
      success: true,
      data: result.data,
      pagination: result.pagination,
      summary: result.summary,
    });
  } catch (err) {
    if (err.statusCode) return res.status(err.statusCode).json({ success: false, message: err.message });
    throw err;
  }
});

const handleGetBookingById = asyncHandler(async (req, res) => {
  try {
    const booking = await getBookingById(
      req.params.businessId,
      req.businessMember.role,
      req.user.id,
      req.params.bookingId
    );
    res.status(200).json({
      success: true,
      data: booking,
    });
  } catch (err) {
    if (err.statusCode) return res.status(err.statusCode).json({ success: false, message: err.message });
    throw err;
  }
});

const handleUpdateBooking = asyncHandler(async (req, res) => {
  try {
    const booking = await updateBooking(
      req.params.businessId,
      req.user.id,
      req.businessMember.role,
      req.params.bookingId,
      req.body
    );
    res.status(200).json({
      success: true,
      data: booking,
    });
  } catch (err) {
    if (isValidationError(err)) return handleValidationError(res, err);
    if (err.statusCode) return res.status(err.statusCode).json({ success: false, message: err.message });
    throw err;
  }
});

const handleCancelBooking = asyncHandler(async (req, res) => {
  try {
    const booking = await cancelBooking(
      req.params.businessId,
      req.user.id,
      req.businessMember.role,
      req.params.bookingId,
      req.body?.reason
    );
    res.status(200).json({
      success: true,
      message: 'Booking cancelled successfully.',
      data: booking,
    });
  } catch (err) {
    if (err.statusCode) return res.status(err.statusCode).json({ success: false, message: err.message });
    throw err;
  }
});

const handleChangeBookingStatus = asyncHandler(async (req, res) => {
  try {
    const booking = await changeBookingStatus(
      req.params.businessId,
      req.user.id,
      req.businessMember.role,
      req.params.bookingId,
      req.body.status,
      req.body?.reason
    );
    res.status(200).json({
      success: true,
      data: booking,
    });
  } catch (err) {
    if (isValidationError(err)) return handleValidationError(res, err);
    if (err.statusCode) return res.status(err.statusCode).json({ success: false, message: err.message });
    throw err;
  }
});

const handleGetBookingHistory = asyncHandler(async (req, res) => {
  try {
    const history = await getBookingHistory(
      req.params.businessId,
      req.businessMember.role,
      req.user.id,
      req.params.bookingId
    );
    res.status(200).json({
      success: true,
      data: history,
    });
  } catch (err) {
    if (err.statusCode) return res.status(err.statusCode).json({ success: false, message: err.message });
    throw err;
  }
});

const handleGetAvailability = asyncHandler(async (req, res) => {
  try {
    const availability = await getAvailability(req.params.businessId, req.query);
    res.status(200).json({
      success: true,
      data: availability,
    });
  } catch (err) {
    if (err.statusCode) return res.status(err.statusCode).json({ success: false, message: err.message });
    throw err;
  }
});

module.exports = {
  handleCreateBooking,
  handleGetBookings,
  handleGetBookingById,
  handleUpdateBooking,
  handleCancelBooking,
  handleChangeBookingStatus,
  handleGetBookingHistory,
  handleGetAvailability,
};
