const express = require('express');
const {
  handleGetStaffList,
  handleGetStaffById,
  handleCreateStaffProfile,
  handleUpdateStaffProfile,
  handleDeleteStaffProfile,
  handleGetStaffServices,
  handleSetStaffServices,
  handleGetStaffSchedule,
  handleSetStaffSchedule,
  handleGetStaffTimeOff,
  handleCreateStaffTimeOff,
  handleDeleteStaffTimeOff,
  handleGetStaffBreaks,
  handleSetStaffBreaks,
  handleCreateStaffBreak,
  handleUpdateStaffBreak,
  handleDeleteStaffBreak,
} = require('../controllers/staffManagementController');
const { authenticate } = require('../middleware/authMiddleware');
const { requireBusinessMember, requireRole, requireStaffSelfOrAdmin } = require('../middleware/rbacMiddleware');

const router = express.Router({ mergeParams: true });

// Require authentication and business membership for all staff routes
router.use(authenticate);
router.use(requireBusinessMember);

// Staff profile management
router.get('/staff', handleGetStaffList);
router.post('/staff', requireRole('OWNER', 'ADMIN'), handleCreateStaffProfile);
router.get('/staff/:staffId', handleGetStaffById);
router.patch('/staff/:staffId', requireStaffSelfOrAdmin, handleUpdateStaffProfile);
router.delete('/staff/:staffId', requireRole('OWNER', 'ADMIN'), handleDeleteStaffProfile);

// Staff service assignments (Many-to-Many)
router.get('/staff/:staffId/services', handleGetStaffServices);
router.put('/staff/:staffId/services', requireRole('OWNER', 'ADMIN'), handleSetStaffServices);

// Staff weekly schedule
router.get('/staff/:staffId/schedule', handleGetStaffSchedule);
router.put('/staff/:staffId/schedule', requireStaffSelfOrAdmin, handleSetStaffSchedule);

// Staff time-off records
router.get('/time-off', handleGetStaffTimeOff);
router.post('/time-off', handleCreateStaffTimeOff);
router.delete('/time-off/:timeOffId', handleDeleteStaffTimeOff);
router.get('/staff/:staffId/time-off', handleGetStaffTimeOff);
router.post('/staff/:staffId/time-off', requireStaffSelfOrAdmin, handleCreateStaffTimeOff);
router.delete('/staff/:staffId/time-off/:timeOffId', requireStaffSelfOrAdmin, handleDeleteStaffTimeOff);

// Staff recurring breaks
router.get('/staff/:staffId/breaks', handleGetStaffBreaks);
router.put('/staff/:staffId/breaks', requireStaffSelfOrAdmin, handleSetStaffBreaks);
router.post('/staff/:staffId/breaks', requireStaffSelfOrAdmin, handleCreateStaffBreak);
router.put('/staff/:staffId/breaks/:breakId', requireStaffSelfOrAdmin, handleUpdateStaffBreak);
router.delete('/staff/:staffId/breaks/:breakId', requireStaffSelfOrAdmin, handleDeleteStaffBreak);

module.exports = router;
