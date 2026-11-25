const prisma = require('../config/prisma');
const { createCustomerSchema, updateCustomerSchema } = require('../utils/validationSchemas');

/**
 * Get customers for a business with search, activity filtering, and pagination
 */
const getCustomers = async (businessId, query = {}) => {
  const page = Math.max(1, parseInt(query.page, 10) || 1);
  const limit = Math.min(100, Math.max(1, parseInt(query.limit, 10) || 20));
  const skip = (page - 1) * limit;

  const now = new Date();
  const monthAgo = new Date(now);
  monthAgo.setDate(monthAgo.getDate() - 30);

  // Fetch all business customers with their bookings to compute activity metrics and consistency
  const allBizCustomers = await prisma.customer.findMany({
    where: { businessId, isActive: query.status === 'inactive' ? false : query.status === 'all' ? undefined : true },
    include: {
      user: {
        select: {
          id: true,
          name: true,
          email: true,
          phone: true,
        },
      },
      bookings: {
        select: {
          id: true,
          startTime: true,
          endTime: true,
          status: true,
          service: { select: { id: true, name: true, price: true, durationMinutes: true } },
          staff: { select: { id: true, displayName: true } },
        },
        orderBy: { startTime: 'desc' },
      },
      _count: {
        select: {
          notes: true,
          bookings: true,
        },
      },
    },
    orderBy: { createdAt: 'desc' },
  });

  // Classify each customer using strict CRM metric rules:
  // - Appointments = all valid customer bookings
  // - Visits = completed bookings only (status === 'COMPLETED')
  // - Returning Customer = customer with 2 or more completed visits
  // - Last Appointment = most recent completed appointment only
  // - Next Appointment = nearest future PENDING/CONFIRMED appointment
  const classifiedCustomers = allBizCustomers.map((c) => {
    const validBookings = (c.bookings || []).filter((b) => b.status !== 'CANCELLED');
    const completedVisits = validBookings.filter((b) => b.status === 'COMPLETED');
    const futureBookings = validBookings.filter((b) => b.status === 'PENDING' || b.status === 'CONFIRMED' || b.status === 'IN_PROGRESS');

    const visitsCount = completedVisits.length;
    const appointmentsCount = validBookings.length;
    const isReturning = visitsCount >= 2;
    const isNew = c.isActive && !isReturning;
    const isInactive = !c.isActive;

    const lastBooking = completedVisits.sort((a, b) => new Date(b.startTime) - new Date(a.startTime))[0] || null;
    const nextBooking = futureBookings.sort((a, b) => new Date(a.startTime) - new Date(b.startTime))[0] || null;

    return {
      ...c,
      appointmentsCount,
      visitsCount,
      pastBookingsCount: visitsCount,
      futureBookingsCount: futureBookings.length,
      lastBooking,
      nextBooking,
      isNew,
      isReturning,
      isInactive,
    };
  });

  // Calculate 100% consistent summary metrics matching filter lists
  const summary = {
    totalCustomers: classifiedCustomers.length,
    newCustomers: classifiedCustomers.filter((c) => c.isNew).length,
    returningCustomers: classifiedCustomers.filter((c) => c.isReturning).length,
    inactiveCustomers: classifiedCustomers.filter((c) => c.isInactive).length,
  };

  // Apply search filter if provided
  let filtered = classifiedCustomers;
  if (query.search && String(query.search).trim() !== '') {
    const term = String(query.search).trim().toLowerCase();
    filtered = filtered.filter(
      (c) =>
        (c.name && c.name.toLowerCase().includes(term)) ||
        (c.email && c.email.toLowerCase().includes(term)) ||
        (c.phone && c.phone.toLowerCase().includes(term))
    );
  }

  // Apply activity filter if provided ('all', 'new', 'returning', 'inactive')
  const activity = query.activity ? String(query.activity).toLowerCase() : 'all';
  if (activity === 'new') {
    filtered = filtered.filter((c) => c.isNew);
  } else if (activity === 'returning') {
    filtered = filtered.filter((c) => c.isReturning);
  } else if (activity === 'inactive') {
    filtered = filtered.filter((c) => c.isInactive);
  }

  const total = filtered.length;
  const paginatedData = filtered.slice(skip, skip + limit);
  const totalPages = Math.ceil(total / limit) || 1;

  return {
    summary,
    data: paginatedData,
    pagination: {
      page,
      limit,
      total,
      totalPages,
    },
  };
};

/**
 * Get a specific customer by ID within a business
 */
const getCustomerById = async (businessId, customerId) => {
  const customer = await prisma.customer.findUnique({
    where: { id: customerId },
    include: {
      user: {
        select: {
          id: true,
          name: true,
          email: true,
          phone: true,
        },
      },
      notes: {
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
      },
      bookings: {
        include: {
          service: true,
          staff: true,
        },
        orderBy: { startTime: 'desc' },
      },
      reviews: {
        include: {
          booking: { include: { service: true } },
        },
        orderBy: { createdAt: 'desc' },
      },
    },
  });

  if (!customer || customer.businessId !== businessId) {
    const error = new Error('Customer not found in this business.');
    error.statusCode = 404;
    throw error;
  }

  const validBookings = (customer.bookings || []).filter((b) => b.status !== 'CANCELLED');
  const completedVisits = validBookings.filter((b) => b.status === 'COMPLETED');
  const futureBookings = validBookings.filter((b) => b.status === 'PENDING' || b.status === 'CONFIRMED' || b.status === 'IN_PROGRESS');

  const visitsCount = completedVisits.length;
  const appointmentsCount = validBookings.length;
  const isReturning = visitsCount >= 2;

  const lastBooking = completedVisits.sort((a, b) => new Date(b.startTime) - new Date(a.startTime))[0] || null;
  const nextBooking = futureBookings.sort((a, b) => new Date(a.startTime) - new Date(b.startTime))[0] || null;

  return {
    ...customer,
    appointmentsCount,
    visitsCount,
    isReturning,
    lastBooking,
    nextBooking,
    pastBookingsCount: visitsCount,
    futureBookingsCount: futureBookings.length,
  };
};

/**
 * Create a new customer for a business
 */
const createCustomer = async (businessId, data) => {
  const validated = createCustomerSchema.parse(data);

  if (validated.email && validated.email.trim() !== '') {
    const existing = await prisma.customer.findFirst({
      where: {
        businessId,
        email: { equals: validated.email.trim(), mode: 'insensitive' },
      },
    });
    if (existing) {
      const error = new Error('A customer with this email address already exists.');
      error.statusCode = 409;
      throw error;
    }
  }

  return await prisma.customer.create({
    data: {
      businessId,
      name: validated.name,
      email: validated.email || null,
      phone: validated.phone || null,
      address: validated.address || null,
      dateOfBirth: validated.dateOfBirth ? new Date(validated.dateOfBirth) : null,
      isActive: true,
    },
  });
};

/**
 * Update a customer record
 */
const updateCustomer = async (businessId, customerId, data) => {
  const validated = updateCustomerSchema.parse(data);

  const existing = await prisma.customer.findUnique({
    where: { id: customerId },
  });

  if (!existing || existing.businessId !== businessId) {
    const error = new Error('Customer not found in this business.');
    error.statusCode = 404;
    throw error;
  }

  if (validated.email && validated.email.trim() !== '' && validated.email.toLowerCase() !== existing.email?.toLowerCase()) {
    const duplicate = await prisma.customer.findFirst({
      where: {
        businessId,
        email: { equals: validated.email.trim(), mode: 'insensitive' },
        id: { not: customerId },
      },
    });
    if (duplicate) {
      const error = new Error('Another customer with this email address already exists.');
      error.statusCode = 409;
      throw error;
    }
  }

  return await prisma.customer.update({
    where: { id: customerId },
    data: {
      name: validated.name !== undefined ? validated.name : existing.name,
      email: validated.email !== undefined ? validated.email : existing.email,
      phone: validated.phone !== undefined ? validated.phone : existing.phone,
      address: validated.address !== undefined ? validated.address : existing.address,
      dateOfBirth: validated.dateOfBirth ? new Date(validated.dateOfBirth) : existing.dateOfBirth,
    },
  });
};

/**
 * Soft delete / deactivate a customer
 */
const deactivateCustomer = async (businessId, customerId) => {
  const existing = await prisma.customer.findUnique({
    where: { id: customerId },
  });

  if (!existing || existing.businessId !== businessId) {
    const error = new Error('Customer not found in this business.');
    error.statusCode = 404;
    throw error;
  }

  return await prisma.customer.update({
    where: { id: customerId },
    data: { isActive: false },
  });
};

module.exports = {
  getCustomers,
  getCustomerById,
  createCustomer,
  updateCustomer,
  deactivateCustomer,
};
