const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
const { createCategorySchema, updateCategorySchema } = require('../utils/validationSchemas');

/**
 * Get all categories for a business
 */
const getCategories = async (businessId) => {
  return await prisma.serviceCategory.findMany({
    where: { businessId },
    orderBy: { name: 'asc' },
  });
};

/**
 * Create a new service category for a business
 */
const createCategory = async (businessId, data) => {
  const validated = createCategorySchema.parse(data);

  // Check unique category name within the business
  const existing = await prisma.serviceCategory.findUnique({
    where: {
      businessId_name: {
        businessId,
        name: validated.name,
      },
    },
  });

  if (existing) {
    const error = new Error(`Category '${validated.name}' already exists in this business.`);
    error.statusCode = 409;
    throw error;
  }

  return await prisma.serviceCategory.create({
    data: {
      businessId,
      name: validated.name,
      description: validated.description || null,
      isActive: validated.isActive !== undefined ? validated.isActive : true,
    },
  });
};

/**
 * Update an existing service category
 */
const updateCategory = async (businessId, categoryId, data) => {
  const validated = updateCategorySchema.parse(data);

  const category = await prisma.serviceCategory.findUnique({
    where: { id: categoryId },
  });

  if (!category || category.businessId !== businessId) {
    const error = new Error('Service category not found in this business.');
    error.statusCode = 404;
    throw error;
  }

  if (validated.name && validated.name !== category.name) {
    const existing = await prisma.serviceCategory.findUnique({
      where: {
        businessId_name: {
          businessId,
          name: validated.name,
        },
      },
    });

    if (existing) {
      const error = new Error(`Category name '${validated.name}' is already in use.`);
      error.statusCode = 409;
      throw error;
    }
  }

  return await prisma.serviceCategory.update({
    where: { id: categoryId },
    data: validated,
  });
};

/**
 * Soft delete (deactivate) a service category
 */
const deactivateCategory = async (businessId, categoryId) => {
  const category = await prisma.serviceCategory.findUnique({
    where: { id: categoryId },
  });

  if (!category || category.businessId !== businessId) {
    const error = new Error('Service category not found in this business.');
    error.statusCode = 404;
    throw error;
  }

  return await prisma.serviceCategory.update({
    where: { id: categoryId },
    data: { isActive: false },
  });
};

module.exports = {
  getCategories,
  createCategory,
  updateCategory,
  deactivateCategory,
};
