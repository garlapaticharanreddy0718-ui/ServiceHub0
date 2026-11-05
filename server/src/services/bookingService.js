const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
const {
  createBookingSchema,
  updateBookingSchema,
  cancelBookingSchema,
  changeBookingStatusSchema,
} = require('../utils/validationSchemas');

/**
 * Validates allowed status transitions according to Phase 7 specification
 */
const isValidStatusTransition = (fromStatus, toStatus) => {
  if (fromStatus === toStatus) return true;

  const validTransitions = {
    PENDING: ['CONFIRMED', 'CANCELLED'],
    CONFIRMED: ['IN_PROGRESS', 'CANCELLED', 'NO_SHOW'],
    IN_PROGRESS: ['COMPLETED'],
    COMPLETED: [],
    CANCELLED: [],
    NO_SHOW: [],
  };

  return validTransitions[fromStatus]?.includes(toStatus) || false;
};

/**
 * Helper to validate entity existence and business scoping
 */
const validateEntities = async (businessId, customerId, serviceId, staffId) => {
  // 1. Customer
  const customer = await prisma.customer.findUnique({
    where: { id: customerId },
  });
  if (!customer || customer.businessId !== businessId) {
    const error = new Error('Customer not found in this business.');
    error.statusCode = 400;
    throw error;
  }

  // 2. Service
  const service = await prisma.service.findUnique({
    where: { id: serviceId },
  });
  if (!service || service.businessId !== businessId) {
    const error = new Error('Service not found in this business.');
    error.statusCode = 400;
    throw error;
  }
  if (!service.isActive) {
    const error = new Error(`Service '${service.name}' is currently inactive.`);
    error.statusCode = 400;
    throw error;
  }

  // 3. Staff
  const staff = await prisma.staff.findUnique({
    where: { id: staffId },
    include: { businessMember: true },
  });
  if (!staff || staff.businessMember.businessId !== businessId) {
    const error = new Error('Staff profile not found in this business.');
    error.statusCode = 400;
    throw error;
  }
  if (!staff.isActive) {
    const error = new Error(`Staff member '${staff.displayName}' is currently inactive.`);
    error.statusCode = 400;
    throw error;
  }

  // 4. Staff-Service Assignment
  const assignment = await prisma.staffService.findUnique({
    where: {
      staffId_serviceId: {
        staffId,
        serviceId,
      },
    },
  });
  if (!assignment) {
    const error = new Error(`Staff member '${staff.displayName}' is not assigned to service '${service.name}'.`);
    error.statusCode = 400;
    throw error;
  }

  return { customer, service, staff };
};

/**
 * Validates staff working hours and time-off schedule
 */
const validateStaffSchedule = async (staffId, startTimeDate, endTimeDate) => {
  // Day of week: 0 = Sunday, 1 = Monday, ..., 6 = Saturday
  const dayOfWeek = startTimeDate.getDay();

  const schedule = await prisma.staffSchedule.findUnique({
    where: {
      staffId_dayOfWeek: {
        staffId,
        dayOfWeek,
      },
    },
  });

  if (!schedule || !schedule.isAvailable) {
    const error = new Error('Staff member is not available on this day.');
    error.statusCode = 400;
    throw error;
  }

  // Parse HH:MM working hours for requested date
  const [startH, startM] = schedule.startTime.split(':').map(Number);
  const [endH, endM] = schedule.endTime.split(':').map(Number);

  const workStart = new Date(startTimeDate);
  workStart.setHours(startH, startM, 0, 0);

  const workEnd = new Date(startTimeDate);
  workEnd.setHours(endH, endM, 0, 0);

  if (startTimeDate < workStart || endTimeDate > workEnd) {
    const error = new Error(`Booking time (${schedule.startTime} - ${schedule.endTime}) is outside staff working hours.`);
    error.statusCode = 400;
    throw error;
  }

  // Check Staff Time Off
  const timeOffConflict = await prisma.staffTimeOff.findFirst({
    where: {
      staffId,
      startDateTime: { lt: endTimeDate },
      endDateTime: { gt: startTimeDate },
    },
  });

  if (timeOffConflict) {
    const error = new Error('Booking overlaps with staff time-off period.');
    error.statusCode = 400;
    throw error;
  }

  // Check Staff Breaks (recurring weekly breaks)
  const breaks = await prisma.staffBreak.findMany({
    where: {
      staffId,
      dayOfWeek,
    },
  });

  for (const b of breaks) {
    const [bStartH, bStartM] = b.startTime.split(':').map(Number);
    const [bEndH, bEndM] = b.endTime.split(':').map(Number);

    const breakStart = new Date(startTimeDate);
    breakStart.setHours(bStartH, bStartM, 0, 0);

    const breakEnd = new Date(startTimeDate);
    breakEnd.setHours(bEndH, bEndM, 0, 0);

    if (startTimeDate < breakEnd && endTimeDate > breakStart) {
      const error = new Error(`Booking time overlaps with staff break (${b.label || 'Break'}: ${b.startTime} - ${b.endTime}).`);
      error.statusCode = 400;
      throw error;
    }
  }
};

/**
 * Creates a new booking with concurrency protection and atomic status history
 */
const createBooking = async (businessId, userId, data) => {
  const validated = createBookingSchema.parse(data);

  const startTimeDate = new Date(validated.startTime);
  if (isNaN(startTimeDate.getTime())) {
    const error = new Error('Invalid start time date format.');
    error.statusCode = 400;
    throw error;
  }

  // 1. Resolve Customer Profile
  let finalCustomerId = validated.customerId;

  if (!finalCustomerId) {
    const user = await prisma.user.findUnique({ where: { id: userId } });
    if (!user) {
      const error = new Error('Authenticated user profile not found.');
      error.statusCode = 401;
      throw error;
    }

    let customer = await prisma.customer.findFirst({
      where: {
        businessId,
        OR: [
          { userId },
          { email: user.email },
        ],
      },
    });

    if (!customer) {
      customer = await prisma.customer.create({
        data: {
          businessId,
          userId: user.id,
          name: user.name,
          email: user.email,
          phone: user.phone || null,
          isActive: true,
        },
      });
    } else if (!customer.userId) {
      customer = await prisma.customer.update({
        where: { id: customer.id },
        data: { userId: user.id },
      });
    }

    finalCustomerId = customer.id;
  }

  // 2. Validate Entities (Customer, Service, Staff, Staff-Service link)
  const { service, staff } = await validateEntities(
    businessId,
    finalCustomerId,
    validated.serviceId,
    validated.staffId
  );

  // 3. Calculate End Time and Total Amount server-side
  const endTimeDate = new Date(startTimeDate.getTime() + service.durationMinutes * 60 * 1000);
  const totalAmount = service.price;

  // Past Time Check: Cannot book appointments in the past
  const now = new Date();
  if (startTimeDate.getTime() <= now.getTime()) {
    const error = new Error('Cannot book appointments in the past.');
    error.statusCode = 400;
    throw error;
  }

  // 4. Validate Staff Schedule Working Hours & Time Off
  await validateStaffSchedule(validated.staffId, startTimeDate, endTimeDate);

  // 5. Concurrency Safety: Atomic transaction with PostgreSQL Advisory Lock on Staff ID
  return await prisma.$transaction(async (tx) => {
    // Acquire PostgreSQL transaction-level advisory lock hashed from staffId string
    await tx.$executeRawUnsafe(`SELECT pg_advisory_xact_lock(hashtext($1))`, validated.staffId);

    // Double-Booking Overlap Check across ALL non-cancelled bookings
    const conflict = await tx.booking.findFirst({
      where: {
        staffId: validated.staffId,
        status: { not: 'CANCELLED' },
        startTime: { lt: endTimeDate },
        endTime: { gt: startTimeDate },
      },
    });

    if (conflict) {
      const error = new Error('Staff member is already booked during the selected time slot.');
      error.statusCode = 409;
      throw error;
    }

    // Create Booking
    const booking = await tx.booking.create({
      data: {
        businessId,
        customerId: finalCustomerId,
        serviceId: validated.serviceId,
        staffId: validated.staffId,
        startTime: startTimeDate,
        endTime: endTimeDate,
        status: 'PENDING',
        totalAmount,
        notes: validated.notes || null,
      },
    });

    // Create Initial Status History Row
    await tx.bookingStatusHistory.create({
      data: {
        bookingId: booking.id,
        fromStatus: null,
        toStatus: 'PENDING',
        changedByUserId: userId,
        reason: 'Initial booking creation',
      },
    });

    return await tx.booking.findUnique({
      where: { id: booking.id },
      include: {
        customer: true,
        service: true,
        staff: true,
        statusHistory: {
          include: {
            changedByUser: {
              select: { id: true, name: true, email: true },
            },
          },
        },
      },
    });
  });
};

/**
 * Get list of bookings with filters, pagination, and RBAC scoping
 */
const getBookings = async (businessId, userRole, userId, query = {}) => {
  const page = Math.max(1, parseInt(query.page, 10) || 1);
  const limit = Math.min(100, Math.max(1, parseInt(query.limit, 10) || 20));
  const skip = (page - 1) * limit;

  const where = { businessId };

  // CUSTOMER Role Scoping: Customers can only view their own bookings
  if (userRole === 'CUSTOMER') {
    const user = await prisma.user.findUnique({ where: { id: userId } });
    const customer = await prisma.customer.findFirst({
      where: {
        businessId,
        OR: [
          { userId },
          ...(user?.email ? [{ email: user.email }] : []),
        ],
      },
    });

    if (!customer) {
      return { data: [], pagination: { page: 1, limit, total: 0, totalPages: 1 } };
    }

    where.customerId = customer.id;
  } else if (userRole === 'STAFF') {
    const staffProfile = await prisma.staff.findFirst({
      where: {
        businessMember: {
          userId,
          businessId,
        },
      },
    });

    if (!staffProfile) {
      return { data: [], pagination: { page: 1, limit, total: 0, totalPages: 1 } };
    }

    where.staffId = staffProfile.id;
  } else if (query.staffId) {
    where.staffId = query.staffId;
  }

  if (query.status) {
    where.status = query.status;
  }
  if (query.customerId) {
    where.customerId = query.customerId;
  }
  if (query.serviceId) {
    where.serviceId = query.serviceId;
  }

  // Server-side search filter across customer name, phone, email, and service name
  const searchQuery = (query.search || query.q || '').trim();
  if (searchQuery) {
    where.AND = [
      ...(where.AND || []),
      {
        OR: [
          { customer: { name: { contains: searchQuery, mode: 'insensitive' } } },
          { customer: { phone: { contains: searchQuery, mode: 'insensitive' } } },
          { customer: { email: { contains: searchQuery, mode: 'insensitive' } } },
          { service: { name: { contains: searchQuery, mode: 'insensitive' } } },
        ],
      },
    ];
  }

  // Precise Local Date Boundaries to prevent UTC timezone shifts
  if (query.date) {
    let year, month, day;
    if (typeof query.date === 'string' && query.date.includes('-')) {
      const parts = query.date.split('-').map(Number);
      year = parts[0];
      month = parts[1];
      day = parts[2];
    } else {
      const d = new Date(query.date);
      year = d.getFullYear();
      month = d.getMonth() + 1;
      day = d.getDate();
    }
    const dayStart = new Date(year, month - 1, day, 0, 0, 0, 0);
    const dayEnd = new Date(year, month - 1, day, 23, 59, 59, 999);
    where.startTime = { gte: dayStart, lte: dayEnd };
  } else if (query.startDate || query.endDate) {
    where.startTime = {};
    if (query.startDate) {
      const parts = query.startDate.split('-').map(Number);
      where.startTime.gte = new Date(parts[0], parts[1] - 1, parts[2], 0, 0, 0, 0);
    }
    if (query.endDate) {
      const parts = query.endDate.split('-').map(Number);
      where.startTime.lte = new Date(parts[0], parts[1] - 1, parts[2], 23, 59, 59, 999);
    }
  }

  const [totalCount, rawBookings, allMatchingBookings] = await prisma.$transaction([
    prisma.booking.count({ where }),
    prisma.booking.findMany({
      where,
      skip,
      take: limit,
      include: {
        customer: true,
        service: true,
        staff: {
          include: {
            businessMember: {
              include: { user: { select: { name: true } } },
            },
          },
        },
        business: {
          select: {
            id: true,
            name: true,
            category: true,
            city: true,
          },
        },
      },
      orderBy: { startTime: 'asc' },
    }),
    prisma.booking.findMany({
      where,
      select: { id: true, status: true, startTime: true },
    }),
  ]);

  // Deduplicate rawBookings by Booking.id to ensure 100% unique records
  const uniqueBookingsMap = new Map();
  rawBookings.forEach((b) => {
    if (!uniqueBookingsMap.has(b.id)) {
      uniqueBookingsMap.set(b.id, b);
    }
  });
  const bookings = Array.from(uniqueBookingsMap.values());

  // Deduplicate allMatchingBookings for summary statistics
  const uniqueAllMap = new Map();
  allMatchingBookings.forEach((b) => {
    if (!uniqueAllMap.has(b.id)) {
      uniqueAllMap.set(b.id, b);
    }
  });
  const allUnique = Array.from(uniqueAllMap.values());

  const pendingCount = allUnique.filter((b) => b.status === 'PENDING').length;
  const upcomingCount = allUnique.filter((b) => b.status === 'CONFIRMED' || b.status === 'IN_PROGRESS').length;
  const completedCount = allUnique.filter((b) => b.status === 'COMPLETED').length;
  const cancelledCount = allUnique.filter((b) => b.status === 'CANCELLED' || b.status === 'NO_SHOW').length;

  const totalPages = Math.ceil(totalCount / limit) || 1;

  return {
    data: bookings,
    pagination: {
      page,
      limit,
      total: totalCount,
      totalPages,
    },
    summary: {
      total: allUnique.length,
      pendingCount,
      upcomingCount,
      completedCount,
      cancelledCount,
    },
  };
};

/**
 * Get a single booking by ID with authorization check
 */
const getBookingById = async (businessId, userRole, userId, bookingId) => {
  const booking = await prisma.booking.findUnique({
    where: { id: bookingId },
    include: {
      customer: true,
      service: true,
      staff: true,
      statusHistory: {
        include: {
          changedByUser: {
            select: { id: true, name: true, email: true },
          },
        },
        orderBy: { createdAt: 'asc' },
      },
    },
  });

  if (!booking || booking.businessId !== businessId) {
    const error = new Error('Booking not found in this business.');
    error.statusCode = 404;
    throw error;
  }

  // CUSTOMER Role Restriction: CUSTOMER can only view/manage their own bookings
  if (userRole === 'CUSTOMER') {
    const user = await prisma.user.findUnique({ where: { id: userId } });
    const customer = await prisma.customer.findFirst({
      where: {
        businessId,
        OR: [
          { userId },
          ...(user?.email ? [{ email: user.email }] : []),
        ],
      },
    });

    if (!customer || booking.customerId !== customer.id) {
      const error = new Error('Access denied. You can only access your own bookings.');
      error.statusCode = 403;
      throw error;
    }
  } else if (userRole === 'STAFF') {
    // STAFF Role Restriction: STAFF can only view their assigned bookings
    const staffProfile = await prisma.staff.findFirst({
      where: {
        businessMember: {
          userId,
          businessId,
        },
      },
    });

    if (!staffProfile || booking.staffId !== staffProfile.id) {
      const error = new Error('Access denied. You can only view bookings assigned to you.');
      error.statusCode = 403;
      throw error;
    }
  }

  return booking;
};

/**
 * Reschedule an existing booking (staffId / startTime / notes update)
 */
const updateBooking = async (businessId, userId, userRole, bookingId, data) => {
  const validated = updateBookingSchema.parse(data);

  const existing = await getBookingById(businessId, userRole, userId, bookingId);

  const staffId = validated.staffId || existing.staffId;
  const startTimeDate = validated.startTime ? new Date(validated.startTime) : new Date(existing.startTime);

  // Validate entities
  const { service } = await validateEntities(businessId, existing.customerId, existing.serviceId, staffId);

  // Recalculate End Time
  const endTimeDate = new Date(startTimeDate.getTime() + service.durationMinutes * 60 * 1000);

  // Validate Staff Schedule & Time Off
  await validateStaffSchedule(staffId, startTimeDate, endTimeDate);

  // Execute Transaction with PostgreSQL Advisory Locking
  return await prisma.$transaction(async (tx) => {
    await tx.$executeRawUnsafe(`SELECT pg_advisory_xact_lock(hashtext($1))`, staffId);

    const conflict = await tx.booking.findFirst({
      where: {
        staffId,
        id: { not: bookingId },
        status: { not: 'CANCELLED' },
        startTime: { lt: endTimeDate },
        endTime: { gt: startTimeDate },
      },
    });

    if (conflict) {
      const error = new Error('Staff member is already booked during the selected time slot.');
      error.statusCode = 409;
      throw error;
    }

    const updated = await tx.booking.update({
      where: { id: bookingId },
      data: {
        staffId,
        startTime: startTimeDate,
        endTime: endTimeDate,
        notes: validated.notes !== undefined ? validated.notes : existing.notes,
      },
      include: {
        customer: true,
        service: true,
        staff: true,
      },
    });

    return updated;
  });
};

/**
 * Cancel a booking
 */
const cancelBooking = async (businessId, userId, userRole, bookingId, reason) => {
  const existing = await getBookingById(businessId, userRole, userId, bookingId);

  if (existing.status === 'CANCELLED') {
    const error = new Error('Booking is already cancelled.');
    error.statusCode = 400;
    throw error;
  }

  return await prisma.$transaction(async (tx) => {
    const updated = await tx.booking.update({
      where: { id: bookingId },
      data: { status: 'CANCELLED' },
    });

    await tx.bookingStatusHistory.create({
      data: {
        bookingId,
        fromStatus: existing.status,
        toStatus: 'CANCELLED',
        changedByUserId: userId,
        reason: reason || 'Booking cancelled by user',
      },
    });

    return updated;
  });
};

/**
 * Change status of a booking with transition rule enforcement
 */
const changeBookingStatus = async (businessId, userId, userRole, bookingId, newStatus, reason) => {
  const existing = await getBookingById(businessId, userRole, userId, bookingId);

  if (!isValidStatusTransition(existing.status, newStatus)) {
    const error = new Error(`Invalid status transition from '${existing.status}' to '${newStatus}'.`);
    error.statusCode = 400;
    throw error;
  }

  return await prisma.$transaction(async (tx) => {
    const updated = await tx.booking.update({
      where: { id: bookingId },
      data: { status: newStatus },
    });

    await tx.bookingStatusHistory.create({
      data: {
        bookingId,
        fromStatus: existing.status,
        toStatus: newStatus,
        changedByUserId: userId,
        reason: reason || `Status changed to ${newStatus}`,
      },
    });

    return updated;
  });
};

/**
 * Get status history timeline for a booking
 */
const getBookingHistory = async (businessId, userRole, userId, bookingId) => {
  await getBookingById(businessId, userRole, userId, bookingId);

  return await prisma.bookingStatusHistory.findMany({
    where: { bookingId },
    include: {
      changedByUser: {
        select: { id: true, name: true, email: true },
      },
    },
    orderBy: { createdAt: 'asc' },
  });
};

/**
 * Availability checking API
 */
const getAvailability = async (businessId, query = {}) => {
  const { staffId, serviceId, date } = query;

  if (!staffId || !serviceId || !date) {
    const error = new Error('staffId, serviceId, and date query parameters are required.');
    error.statusCode = 400;
    throw error;
  }

  // Validate Service & Staff in this business
  const service = await prisma.service.findUnique({ where: { id: serviceId } });
  if (!service || service.businessId !== businessId || !service.isActive) {
    const error = new Error('Service not found or inactive in this business.');
    error.statusCode = 400;
    throw error;
  }

  const staff = await prisma.staff.findUnique({
    where: { id: staffId },
    include: { businessMember: true },
  });
  if (!staff || staff.businessMember.businessId !== businessId || !staff.isActive) {
    const error = new Error('Staff profile not found or inactive in this business.');
    error.statusCode = 400;
    throw error;
  }

  const targetDate = new Date(date);
  if (isNaN(targetDate.getTime())) {
    const error = new Error('Invalid date format.');
    error.statusCode = 400;
    throw error;
  }

  const dayOfWeek = targetDate.getDay();

  const schedule = await prisma.staffSchedule.findUnique({
    where: {
      staffId_dayOfWeek: {
        staffId,
        dayOfWeek,
      },
    },
  });

  const dayStart = new Date(targetDate);
  dayStart.setHours(0, 0, 0, 0);
  const dayEnd = new Date(targetDate);
  dayEnd.setHours(23, 59, 59, 999);

  const now = new Date();
  const todayStr = now.toISOString().split('T')[0];
  const isPastDate = date < todayStr;

  const [timeOff, breaks, activeBookings] = await Promise.all([
    prisma.staffTimeOff.findMany({
      where: {
        staffId,
        startDateTime: { lte: dayEnd },
        endDateTime: { gte: dayStart },
      },
    }),
    prisma.staffBreak.findMany({
      where: {
        staffId,
        dayOfWeek,
      },
      orderBy: { startTime: 'asc' },
    }),
    prisma.booking.findMany({
      where: {
        staffId,
        status: { in: ['PENDING', 'CONFIRMED', 'IN_PROGRESS'] },
        startTime: { lte: dayEnd },
        endTime: { gte: dayStart },
      },
      select: {
        id: true,
        startTime: true,
        endTime: true,
        status: true,
      },
    }),
  ]);

  return {
    staffId,
    serviceId,
    date,
    isPastDate,
    schedule: schedule || null,
    timeOff,
    breaks,
    bookings: activeBookings,
  };
};

module.exports = {
  createBooking,
  getBookings,
  getBookingById,
  updateBooking,
  cancelBooking,
  changeBookingStatus,
  getBookingHistory,
  getAvailability,
};
