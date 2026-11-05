const asyncHandler = require('../utils/asyncHandler');
const {
  getServices,
  getServiceById,
  createService,
  updateService,
  deactivateService,
} = require('../services/serviceService');
const { ZodError } = require('zod');

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

const handleGetServices = asyncHandler(async (req, res) => {
  const services = await getServices(req.params.businessId);
  res.status(200).json({
    success: true,
    data: services,
  });
});

const handleGetServiceById = asyncHandler(async (req, res) => {
  try {
    const service = await getServiceById(req.params.businessId, req.params.serviceId);
    res.status(200).json({
      success: true,
      data: service,
    });
  } catch (err) {
    if (err.statusCode) return res.status(err.statusCode).json({ success: false, message: err.message });
    throw err;
  }
});

const handleCreateService = asyncHandler(async (req, res) => {
  try {
    const service = await createService(req.params.businessId, req.body);
    res.status(201).json({
      success: true,
      data: service,
    });
  } catch (err) {
    if (isValidationError(err)) return handleValidationError(res, err);
    if (err.statusCode) return res.status(err.statusCode).json({ success: false, message: err.message });
    throw err;
  }
});

const handleUpdateService = asyncHandler(async (req, res) => {
  try {
    const service = await updateService(req.params.businessId, req.params.serviceId, req.body);
    res.status(200).json({
      success: true,
      data: service,
    });
  } catch (err) {
    if (isValidationError(err)) return handleValidationError(res, err);
    if (err.statusCode) return res.status(err.statusCode).json({ success: false, message: err.message });
    throw err;
  }
});

const handleDeleteService = asyncHandler(async (req, res) => {
  try {
    const service = await deactivateService(req.params.businessId, req.params.serviceId);
    res.status(200).json({
      success: true,
      message: 'Service deactivated successfully.',
      data: service,
    });
  } catch (err) {
    if (err.statusCode) return res.status(err.statusCode).json({ success: false, message: err.message });
    throw err;
  }
});

module.exports = {
  handleGetServices,
  handleGetServiceById,
  handleCreateService,
  handleUpdateService,
  handleDeleteService,
};
