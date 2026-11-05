const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
const { createCustomerNoteSchema, updateCustomerNoteSchema } = require('../utils/validationSchemas');
const { getCustomerById } = require('./customerService');

/**
 * Get notes for a specific customer within a business
 */
const getCustomerNotes = async (businessId, customerId) => {
  // Verifies customer exists and belongs to businessId (throws 404 if not)
  await getCustomerById(businessId, customerId);

  return await prisma.customerNote.findMany({
    where: { customerId },
    include: {
      author: {
        select: {
          id: true,
          name: true,
          email: true,
        },
      },
    },
    orderBy: { createdAt: 'desc' },
  });
};

/**
 * Create a new internal note for a customer
 */
const createCustomerNote = async (businessId, customerId, authorUserId, data) => {
  const validated = createCustomerNoteSchema.parse(data);

  // Verifies customer belongs to businessId
  await getCustomerById(businessId, customerId);

  return await prisma.customerNote.create({
    data: {
      customerId,
      authorUserId,
      content: validated.content,
    },
    include: {
      author: {
        select: {
          id: true,
          name: true,
          email: true,
        },
      },
    },
  });
};

/**
 * Update an existing customer note (OWNER/ADMIN or Note Author)
 */
const updateCustomerNote = async (businessId, customerId, noteId, userRole, userId, data) => {
  const validated = updateCustomerNoteSchema.parse(data);

  // Verifies customer belongs to businessId
  await getCustomerById(businessId, customerId);

  const note = await prisma.customerNote.findUnique({
    where: { id: noteId },
  });

  if (!note || note.customerId !== customerId) {
    const error = new Error('Customer note not found.');
    error.statusCode = 404;
    throw error;
  }

  // Authorization enforcement: OWNER/ADMIN or Note Author
  if (userRole !== 'OWNER' && userRole !== 'ADMIN' && note.authorUserId !== userId) {
    const error = new Error('Access denied. You can only modify customer notes authored by you.');
    error.statusCode = 403;
    throw error;
  }

  return await prisma.customerNote.update({
    where: { id: noteId },
    data: {
      content: validated.content,
    },
    include: {
      author: {
        select: {
          id: true,
          name: true,
          email: true,
        },
      },
    },
  });
};

/**
 * Delete a customer note (OWNER/ADMIN or Note Author)
 */
const deleteCustomerNote = async (businessId, customerId, noteId, userRole, userId) => {
  // Verifies customer belongs to businessId
  await getCustomerById(businessId, customerId);

  const note = await prisma.customerNote.findUnique({
    where: { id: noteId },
  });

  if (!note || note.customerId !== customerId) {
    const error = new Error('Customer note not found.');
    error.statusCode = 404;
    throw error;
  }

  // Authorization enforcement: OWNER/ADMIN or Note Author
  if (userRole !== 'OWNER' && userRole !== 'ADMIN' && note.authorUserId !== userId) {
    const error = new Error('Access denied. You can only delete customer notes authored by you.');
    error.statusCode = 403;
    throw error;
  }

  await prisma.customerNote.delete({
    where: { id: noteId },
  });

  return true;
};

module.exports = {
  getCustomerNotes,
  createCustomerNote,
  updateCustomerNote,
  deleteCustomerNote,
};
