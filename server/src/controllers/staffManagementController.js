const asyncHandler = require('../utils/asyncHandler');
const {
  getStaffList,
  getStaffById,
  createStaffProfile,
  updateStaffProfile,
  deactivateStaffProfile,
  getStaffServices,
  setStaffServices,
  getStaffSchedule,
  setStaffSchedule,
  getStaffTimeOff,
  createStaffTimeOff,
  deleteStaffTimeOff,
  getStaffBreaks,
  setStaffBreaks,
  createStaffBreak,
  updateStaffBreak,
  deleteStaffBreak,
} = require('../services/staffManagementService');
const { ZodError } = require('zod');
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

const resolveStaffIdFromReq = async (req) => {
  if (req.params.staffId && req.params.staffId !== 'me' && ['OWNER', 'ADMIN'].includes(req.businessMember?.role)) {
    return req.params.staffId;
  }
  if (!req.businessMember?.id) {
    const error = new Error('Authentication required to resolve staff profile.');
    error.statusCode = 401;
    throw error;
  }
  const staffProfile = await prisma.staff.findUnique({
    where: { businessMemberId: req.businessMember.id },
  });
  if (!staffProfile) {
    const error = new Error('Staff profile not found for authenticated user.');
    error.statusCode = 404;
    throw error;
  }
  return staffProfile.id;
};

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

const handleGetStaffList = asyncHandler(async (req, res) => {
  const staff = await getStaffList(req.params.businessId);
  res.status(200).json({
    success: true,
    data: staff,
  });
});

const handleGetStaffById = asyncHandler(async (req, res) => {
  try {
    const staff = await getStaffById(req.params.businessId, req.params.staffId);
    res.status(200).json({
      success: true,
      data: staff,
    });
  } catch (err) {
    if (err.statusCode) return res.status(err.statusCode).json({ success: false, message: err.message });
    throw err;
  }
});

const handleCreateStaffProfile = asyncHandler(async (req, res) => {
  try {
    const staff = await createStaffProfile(req.params.businessId, req.body);
    res.status(201).json({
      success: true,
      data: staff,
    });
  } catch (err) {
    if (isValidationError(err)) return handleValidationError(res, err);
    if (err.statusCode) return res.status(err.statusCode).json({ success: false, message: err.message });
    throw err;
  }
});

const handleUpdateStaffProfile = asyncHandler(async (req, res) => {
  try {
    const staff = await updateStaffProfile(req.params.businessId, req.params.staffId, req.body);
    res.status(200).json({
      success: true,
      data: staff,
    });
  } catch (err) {
    if (isValidationError(err)) return handleValidationError(res, err);
    if (err.statusCode) return res.status(err.statusCode).json({ success: false, message: err.message });
    throw err;
  }
});

const handleDeleteStaffProfile = asyncHandler(async (req, res) => {
  try {
    const staff = await deactivateStaffProfile(req.params.businessId, req.params.staffId);
    res.status(200).json({
      success: true,
      message: 'Staff profile deactivated successfully.',
      data: staff,
    });
  } catch (err) {
    if (err.statusCode) return res.status(err.statusCode).json({ success: false, message: err.message });
    throw err;
  }
});

const handleGetStaffServices = asyncHandler(async (req, res) => {
  try {
    const services = await getStaffServices(req.params.businessId, req.params.staffId);
    res.status(200).json({
      success: true,
      data: services,
    });
  } catch (err) {
    if (err.statusCode) return res.status(err.statusCode).json({ success: false, message: err.message });
    throw err;
  }
});

const handleSetStaffServices = asyncHandler(async (req, res) => {
  try {
    const assignments = await setStaffServices(req.params.businessId, req.params.staffId, req.body);
    res.status(200).json({
      success: true,
      data: assignments,
    });
  } catch (err) {
    if (isValidationError(err)) return handleValidationError(res, err);
    if (err.statusCode) return res.status(err.statusCode).json({ success: false, message: err.message });
    throw err;
  }
});

const handleGetStaffSchedule = asyncHandler(async (req, res) => {
  try {
    const schedules = await getStaffSchedule(req.params.businessId, req.params.staffId);
    res.status(200).json({
      success: true,
      data: schedules,
    });
  } catch (err) {
    if (err.statusCode) return res.status(err.statusCode).json({ success: false, message: err.message });
    throw err;
  }
});

const handleSetStaffSchedule = asyncHandler(async (req, res) => {
  try {
    const schedules = await setStaffSchedule(req.params.businessId, req.params.staffId, req.body);
    res.status(200).json({
      success: true,
      data: schedules,
    });
  } catch (err) {
    if (isValidationError(err)) return handleValidationError(res, err);
    if (err.statusCode) return res.status(err.statusCode).json({ success: false, message: err.message });
    throw err;
  }
});

const handleGetStaffTimeOff = asyncHandler(async (req, res) => {
  try {
    const targetStaffId = await resolveStaffIdFromReq(req);
    const timeOffs = await getStaffTimeOff(req.params.businessId, targetStaffId);
    res.status(200).json({
      success: true,
      data: timeOffs,
    });
  } catch (err) {
    if (err.statusCode) return res.status(err.statusCode).json({ success: false, message: err.message });
    throw err;
  }
});

const handleCreateStaffTimeOff = asyncHandler(async (req, res) => {
  try {
    const targetStaffId = await resolveStaffIdFromReq(req);
    const timeOff = await createStaffTimeOff(req.params.businessId, targetStaffId, req.body);
    res.status(201).json({
      success: true,
      data: timeOff,
    });
  } catch (err) {
    if (isValidationError(err)) return handleValidationError(res, err);
    if (err.statusCode) return res.status(err.statusCode).json({ success: false, message: err.message });
    throw err;
  }
});

const handleDeleteStaffTimeOff = asyncHandler(async (req, res) => {
  try {
    const targetStaffId = await resolveStaffIdFromReq(req);
    await deleteStaffTimeOff(req.params.businessId, targetStaffId, req.params.timeOffId);
    res.status(200).json({
      success: true,
      message: 'Time-off record deleted successfully.',
    });
  } catch (err) {
    if (err.statusCode) return res.status(err.statusCode).json({ success: false, message: err.message });
    throw err;
  }
});

const handleSetStaffBreaks = asyncHandler(async (req, res) => {
  try {
    const breaks = await setStaffBreaks(req.params.businessId, req.params.staffId, req.body);
    res.status(200).json({
      success: true,
      data: breaks,
    });
  } catch (err) {
    if (isValidationError(err)) return handleValidationError(res, err);
    if (err.statusCode) return res.status(err.statusCode).json({ success: false, message: err.message });
    throw err;
  }
});

const handleGetStaffBreaks = asyncHandler(async (req, res) => {
  try {
    const breaks = await getStaffBreaks(req.params.businessId, req.params.staffId);
    res.status(200).json({
      success: true,
      data: breaks,
    });
  } catch (err) {
    if (err.statusCode) return res.status(err.statusCode).json({ success: false, message: err.message });
    throw err;
  }
});

const handleCreateStaffBreak = asyncHandler(async (req, res) => {
  try {
    const breakItem = await createStaffBreak(req.params.businessId, req.params.staffId, req.body);
    res.status(201).json({
      success: true,
      data: breakItem,
    });
  } catch (err) {
    if (isValidationError(err)) return handleValidationError(res, err);
    if (err.statusCode) return res.status(err.statusCode).json({ success: false, message: err.message });
    throw err;
  }
});

const handleUpdateStaffBreak = asyncHandler(async (req, res) => {
  try {
    const breakItem = await updateStaffBreak(req.params.businessId, req.params.staffId, req.params.breakId, req.body);
    res.status(200).json({
      success: true,
      data: breakItem,
    });
  } catch (err) {
    if (isValidationError(err)) return handleValidationError(res, err);
    if (err.statusCode) return res.status(err.statusCode).json({ success: false, message: err.message });
    throw err;
  }
});

const handleDeleteStaffBreak = asyncHandler(async (req, res) => {
  try {
    await deleteStaffBreak(req.params.businessId, req.params.staffId, req.params.breakId);
    res.status(200).json({
      success: true,
      message: 'Break record deleted successfully.',
    });
  } catch (err) {
    if (err.statusCode) return res.status(err.statusCode).json({ success: false, message: err.message });
    throw err;
  }
});

module.exports = {
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
};
