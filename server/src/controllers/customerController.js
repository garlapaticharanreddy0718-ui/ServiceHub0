const asyncHandler = require('../utils/asyncHandler');
const {
  getCustomers,
  getCustomerById,
  createCustomer,
  updateCustomer,
  deactivateCustomer,
} = require('../services/customerService');
const {
  getCustomerNotes,
  createCustomerNote,
  updateCustomerNote,
  deleteCustomerNote,
} = require('../services/customerNoteService');

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

const handleGetCustomers = asyncHandler(async (req, res) => {
  const result = await getCustomers(req.params.businessId, req.query);
  res.status(200).json({
    success: true,
    summary: result.summary,
    data: result.data,
    pagination: result.pagination,
  });
});

const handleGetCustomerById = asyncHandler(async (req, res) => {
  try {
    const customer = await getCustomerById(req.params.businessId, req.params.customerId);
    res.status(200).json({
      success: true,
      data: customer,
    });
  } catch (err) {
    if (err.statusCode) return res.status(err.statusCode).json({ success: false, message: err.message });
    throw err;
  }
});

const handleCreateCustomer = asyncHandler(async (req, res) => {
  try {
    const customer = await createCustomer(req.params.businessId, req.body);
    res.status(201).json({
      success: true,
      data: customer,
    });
  } catch (err) {
    if (isValidationError(err)) return handleValidationError(res, err);
    if (err.statusCode) return res.status(err.statusCode).json({ success: false, message: err.message });
    throw err;
  }
});

const handleUpdateCustomer = asyncHandler(async (req, res) => {
  try {
    const customer = await updateCustomer(req.params.businessId, req.params.customerId, req.body);
    res.status(200).json({
      success: true,
      data: customer,
    });
  } catch (err) {
    if (isValidationError(err)) return handleValidationError(res, err);
    if (err.statusCode) return res.status(err.statusCode).json({ success: false, message: err.message });
    throw err;
  }
});

const handleDeleteCustomer = asyncHandler(async (req, res) => {
  try {
    const customer = await deactivateCustomer(req.params.businessId, req.params.customerId);
    res.status(200).json({
      success: true,
      message: 'Customer record deactivated successfully.',
      data: customer,
    });
  } catch (err) {
    if (err.statusCode) return res.status(err.statusCode).json({ success: false, message: err.message });
    throw err;
  }
});

const handleGetCustomerNotes = asyncHandler(async (req, res) => {
  try {
    const notes = await getCustomerNotes(req.params.businessId, req.params.customerId);
    res.status(200).json({
      success: true,
      data: notes,
    });
  } catch (err) {
    if (err.statusCode) return res.status(err.statusCode).json({ success: false, message: err.message });
    throw err;
  }
});

const handleCreateCustomerNote = asyncHandler(async (req, res) => {
  try {
    const note = await createCustomerNote(
      req.params.businessId,
      req.params.customerId,
      req.user.id,
      req.body
    );
    res.status(201).json({
      success: true,
      data: note,
    });
  } catch (err) {
    if (isValidationError(err)) return handleValidationError(res, err);
    if (err.statusCode) return res.status(err.statusCode).json({ success: false, message: err.message });
    throw err;
  }
});

const handleUpdateCustomerNote = asyncHandler(async (req, res) => {
  try {
    const note = await updateCustomerNote(
      req.params.businessId,
      req.params.customerId,
      req.params.noteId,
      req.businessMember.role,
      req.user.id,
      req.body
    );
    res.status(200).json({
      success: true,
      data: note,
    });
  } catch (err) {
    if (isValidationError(err)) return handleValidationError(res, err);
    if (err.statusCode) return res.status(err.statusCode).json({ success: false, message: err.message });
    throw err;
  }
});

const handleDeleteCustomerNote = asyncHandler(async (req, res) => {
  try {
    await deleteCustomerNote(
      req.params.businessId,
      req.params.customerId,
      req.params.noteId,
      req.businessMember.role,
      req.user.id
    );
    res.status(200).json({
      success: true,
      message: 'Customer note deleted successfully.',
    });
  } catch (err) {
    if (err.statusCode) return res.status(err.statusCode).json({ success: false, message: err.message });
    throw err;
  }
});

module.exports = {
  handleGetCustomers,
  handleGetCustomerById,
  handleCreateCustomer,
  handleUpdateCustomer,
  handleDeleteCustomer,
  handleGetCustomerNotes,
  handleCreateCustomerNote,
  handleUpdateCustomerNote,
  handleDeleteCustomerNote,
};
