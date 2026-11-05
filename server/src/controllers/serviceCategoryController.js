const asyncHandler = require('../utils/asyncHandler');
const {
  getCategories,
  createCategory,
  updateCategory,
  deactivateCategory,
} = require('../services/serviceCategoryService');
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

const handleGetCategories = asyncHandler(async (req, res) => {
  const categories = await getCategories(req.params.businessId);
  res.status(200).json({
    success: true,
    data: categories,
  });
});

const handleCreateCategory = asyncHandler(async (req, res) => {
  try {
    const category = await createCategory(req.params.businessId, req.body);
    res.status(201).json({
      success: true,
      data: category,
    });
  } catch (err) {
    if (isValidationError(err)) return handleValidationError(res, err);
    if (err.statusCode) return res.status(err.statusCode).json({ success: false, message: err.message });
    throw err;
  }
});

const handleUpdateCategory = asyncHandler(async (req, res) => {
  try {
    const category = await updateCategory(req.params.businessId, req.params.categoryId, req.body);
    res.status(200).json({
      success: true,
      data: category,
    });
  } catch (err) {
    if (isValidationError(err)) return handleValidationError(res, err);
    if (err.statusCode) return res.status(err.statusCode).json({ success: false, message: err.message });
    throw err;
  }
});

const handleDeleteCategory = asyncHandler(async (req, res) => {
  try {
    const category = await deactivateCategory(req.params.businessId, req.params.categoryId);
    res.status(200).json({
      success: true,
      message: 'Category deactivated successfully.',
      data: category,
    });
  } catch (err) {
    if (err.statusCode) return res.status(err.statusCode).json({ success: false, message: err.message });
    throw err;
  }
});

module.exports = {
  handleGetCategories,
  handleCreateCategory,
  handleUpdateCategory,
  handleDeleteCategory,
};
