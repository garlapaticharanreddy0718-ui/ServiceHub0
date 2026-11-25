const express = require('express');
const {
  handleCreateBooking,
  handleGetBookings,
  handleGetBookingById,
  handleUpdateBooking,
  handleCancelBooking,
  handleChangeBookingStatus,
  handleGetBookingHistory,
  handleGetAvailability,
} = require('../controllers/bookingController');
const router = express.Router({ mergeParams: true });

// Availability Checking API
router.get('/availability', handleGetAvailability);

// Booking Management APIs
router.get('/bookings', handleGetBookings);
router.post('/bookings', handleCreateBooking);
router.get('/bookings/:bookingId', handleGetBookingById);
router.patch('/bookings/:bookingId', handleUpdateBooking);
router.post('/bookings/:bookingId/cancel', handleCancelBooking);
router.post('/bookings/:bookingId/status', handleChangeBookingStatus);
router.get('/bookings/:bookingId/history', handleGetBookingHistory);

module.exports = router;
