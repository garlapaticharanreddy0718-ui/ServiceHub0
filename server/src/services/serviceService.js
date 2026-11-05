const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
const { createServiceSchema, updateServiceSchema } = require('../utils/validationSchemas');

/**
 * Get all services for a business (including optional category details)
 */
const getServices = async (businessId, includeInactive = false) => {
  const where = { businessId };
  if (!includeInactive) {
    where.isActive = true;
  }

  return await prisma.service.findMany({
    where,
    include: {
      category: {
        select: {
          id: true,
          name: true,
        },
      },
    },
    orderBy: { createdAt: 'desc' },
  });
};

/**
 * Get a specific service by ID within a business
 */
const getServiceById = async (businessId, serviceId) => {
  const service = await prisma.service.findUnique({
    where: { id: serviceId },
    include: {
      category: {
        select: {
          id: true,
          name: true,
        },
      },
    },
  });

  if (!service || service.businessId !== businessId) {
    const error = new Error('Service not found in this business.');
    error.statusCode = 404;
    throw error;
  }

  return service;
};

/**
 * Create a new service for a business (validating category tenant matching)
 */
const createService = async (businessId, data) => {
  const validated = createServiceSchema.parse(data);

  // If categoryId is supplied, verify it belongs to the SAME business
  if (validated.categoryId) {
    const category = await prisma.serviceCategory.findUnique({
      where: { id: validated.categoryId },
    });

    if (!category || category.businessId !== businessId) {
      const error = new Error('Selected service category does not belong to this business.');
      error.statusCode = 404;
      throw error;
    }
  }

  return await prisma.service.create({
    data: {
      businessId,
      name: validated.name,
      description: validated.description || null,
      price: validated.price,
      durationMinutes: validated.durationMinutes,
      categoryId: validated.categoryId || null,
      isActive: validated.isActive !== undefined ? validated.isActive : true,
    },
    include: {
      category: {
        select: {
          id: true,
          name: true,
        },
      },
    },
  });
};

/**
 * Update an existing service (validating category tenant matching)
 */
const updateService = async (businessId, serviceId, data) => {
  const validated = updateServiceSchema.parse(data);

  const existingService = await prisma.service.findUnique({
    where: { id: serviceId },
  });

  if (!existingService || existingService.businessId !== businessId) {
    const error = new Error('Service not found in this business.');
    error.statusCode = 404;
    throw error;
  }

  if (validated.categoryId) {
    const category = await prisma.serviceCategory.findUnique({
      where: { id: validated.categoryId },
    });

    if (!category || category.businessId !== businessId) {
      const error = new Error('Selected service category does not belong to this business.');
      error.statusCode = 404;
      throw error;
    }
  }

  return await prisma.service.update({
    where: { id: serviceId },
    data: validated,
    include: {
      category: {
        select: {
          id: true,
          name: true,
        },
      },
    },
  });
};

/**
 * Soft delete (deactivate) a service safely
 */
const deactivateService = async (businessId, serviceId) => {
  const service = await prisma.service.findUnique({
    where: { id: serviceId },
  });

  if (!service || service.businessId !== businessId) {
    const error = new Error('Service not found in this business.');
    error.statusCode = 404;
    throw error;
  }

  return await prisma.service.update({
    where: { id: serviceId },
    data: { isActive: false },
  });
};

module.exports = {
  getServices,
  getServiceById,
  createService,
  updateService,
  deactivateService,
};
