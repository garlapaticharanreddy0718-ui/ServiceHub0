const prisma = require('../config/prisma');
const bcrypt = require('bcryptjs');
const crypto = require('crypto');
const {
  createStaffProfileSchema,
  updateStaffProfileSchema,
  setStaffServicesSchema,
  updateScheduleSchema,
  createTimeOffSchema,
  createStaffBreakSchema,
  updateStaffBreakSchema,
} = require('../utils/validationSchemas');

/**
 * Get all staff profiles for a business
 */
const getStaffList = async (businessId) => {
  const staff = await prisma.staff.findMany({
    where: {
      businessMember: {
        businessId,
      },
    },
    include: {
      businessMember: {
        include: {
          user: {
            select: {
              id: true,
              name: true,
              email: true,
              phone: true,
            },
          },
        },
      },
      staffServices: {
        include: {
          service: {
            select: {
              id: true,
              name: true,
              price: true,
              durationMinutes: true,
            },
          },
        },
      },
      schedules: true,
      breaks: {
        orderBy: [{ dayOfWeek: 'asc' }, { startTime: 'asc' }],
      },
      timeOffs: {
        orderBy: { startDateTime: 'asc' },
      },
    },
    orderBy: { createdAt: 'desc' },
  });

  return staff;
};

/**
 * Get a specific staff profile by ID
 */
const getStaffById = async (businessId, staffId) => {
  const staff = await prisma.staff.findUnique({
    where: { id: staffId },
    include: {
      businessMember: {
        include: {
          user: {
            select: {
              id: true,
              name: true,
              email: true,
              phone: true,
            },
          },
        },
      },
      staffServices: {
        include: {
          service: true,
        },
      },
      schedules: true,
      timeOffs: {
        orderBy: { startDateTime: 'asc' },
      },
      breaks: {
        orderBy: [{ dayOfWeek: 'asc' }, { startTime: 'asc' }],
      },
    },
  });

  if (!staff || staff.businessMember.businessId !== businessId) {
    const error = new Error('Staff profile not found in this business.');
    error.statusCode = 404;
    throw error;
  }

  return staff;
};

/**
 * Create a new staff profile for a business member or new user
 */
const createStaffProfile = async (businessId, data) => {
  const validated = createStaffProfileSchema.parse(data);
  let targetBusinessMemberId = validated.businessMemberId;

  if (!targetBusinessMemberId && (!validated.name || !validated.email)) {
    const error = new Error('Full Name and Email are required to add a new staff member.');
    error.statusCode = 400;
    throw error;
  }

  // Validate and prepare Weekly Schedule (StaffSchedule) before opening DB transaction
  const scheduleItems = (validated.schedules && validated.schedules.length > 0)
    ? validated.schedules
    : [0, 1, 2, 3, 4, 5, 6].map((d) => ({
        dayOfWeek: d,
        startTime: '09:00',
        endTime: '18:00',
        isAvailable: d >= 1 && d <= 6, // Mon-Sat working by default
      }));

  const scheduleMap = new Map();
  const scheduleRows = [];
  for (const sch of scheduleItems) {
    const isAvail = sch.isAvailable !== undefined ? sch.isAvailable : (sch.isWorking !== undefined ? sch.isWorking : true);
    const startTime = sch.startTime || '09:00';
    const endTime = sch.endTime || '18:00';

    if (isAvail && startTime >= endTime) {
      const error = new Error(`Working hours for day ${sch.dayOfWeek} must have startTime before endTime.`);
      error.statusCode = 400;
      throw error;
    }

    const row = { dayOfWeek: sch.dayOfWeek, startTime, endTime, isAvailable: isAvail };
    scheduleMap.set(sch.dayOfWeek, row);
    scheduleRows.push(row);
  }

  // Validate and prepare Initial Breaks (StaffBreak) before opening DB transaction
  const normalizedInitialBreaks = [];
  if (validated.breaks && validated.breaks.length > 0) {
    const initialBreakKeys = new Set();

    for (const br of validated.breaks) {
      const bStart = br.startTime;
      const bEnd = br.endTime;
      if (bStart >= bEnd) {
        const error = new Error('Break startTime must be strictly before endTime.');
        error.statusCode = 400;
        throw error;
      }

      const targetDays = br.dayOfWeek !== undefined ? [Number(br.dayOfWeek)] : [1, 2, 3, 4, 5, 6];
      for (const day of targetDays) {
        const daySch = scheduleMap.get(day);
        if (!daySch || !daySch.isAvailable) {
          if (br.dayOfWeek !== undefined) {
            const error = new Error(`Cannot add a break on a non-working day (Day ${day}).`);
            error.statusCode = 400;
            throw error;
          }
          continue;
        }

        if (bStart < daySch.startTime || bEnd > daySch.endTime) {
          const error = new Error(`Break (${bStart} – ${bEnd}) must fall completely inside working hours (${daySch.startTime} – ${daySch.endTime}).`);
          error.statusCode = 400;
          throw error;
        }

        const bKey = `${day}_${bStart}_${bEnd}`;
        if (!initialBreakKeys.has(bKey)) {
          initialBreakKeys.add(bKey);
          normalizedInitialBreaks.push({
            dayOfWeek: day,
            startTime: bStart,
            endTime: bEnd,
            label: br.label || br.title || 'Break',
          });
        }
      }
    }

    // Overlap check among initial breaks
    const breaksByDayMap = {};
    for (const b of normalizedInitialBreaks) {
      if (!breaksByDayMap[b.dayOfWeek]) breaksByDayMap[b.dayOfWeek] = [];
      for (const existing of breaksByDayMap[b.dayOfWeek]) {
        if (b.startTime < existing.endTime && b.endTime > existing.startTime) {
          const error = new Error(`Break (${b.startTime} - ${b.endTime}) overlaps with another break (${existing.startTime} - ${existing.endTime}).`);
          error.statusCode = 400;
          throw error;
        }
      }
      breaksByDayMap[b.dayOfWeek].push(b);
    }
  }

  // Validate and prepare Initial Time Off (StaffTimeOff) before opening DB transaction
  const timeOffRows = [];
  if (validated.timeOffs && validated.timeOffs.length > 0) {
    for (const to of validated.timeOffs) {
      const startStr = to.startDateTime || to.startDate;
      const endStr = to.endDateTime || to.endDate;
      if (!startStr || !endStr) continue;

      const start = new Date(startStr);
      const end = new Date(endStr);

      if (isNaN(start.getTime()) || isNaN(end.getTime())) {
        const error = new Error('Invalid date format for time off.');
        error.statusCode = 400;
        throw error;
      }

      if (start >= end) {
        const error = new Error('Time off start date/time must be strictly before end date/time.');
        error.statusCode = 400;
        throw error;
      }

      timeOffRows.push({
        startDateTime: start,
        endDateTime: end,
        reason: to.reason || null,
      });
    }
  }

  // Perform CPU-bound bcrypt hashing BEFORE opening the database transaction
  const generatedTemporaryPassword = `Temp#${crypto.randomBytes(4).toString('hex')}`;
  const tempPasswordHash = await bcrypt.hash(generatedTemporaryPassword, 12);

  return await prisma.$transaction(async (tx) => {
    let resolvedUserName = null;

    if (!targetBusinessMemberId) {
      // New Staff Creation Flow: User -> BusinessMember -> Staff
      const normalizedEmail = validated.email.trim().toLowerCase();
      const fullName = validated.name.trim();

      // Check whether a User with that email already exists
      let user = await tx.user.findUnique({
        where: { email: normalizedEmail },
      });

      if (!user) {
        // CASE A: User does NOT exist -> Create User with temporary password & mustChangePassword = true
        user = await tx.user.create({
          data: {
            name: fullName,
            email: normalizedEmail,
            phone: validated.phone?.trim() || null,
            passwordHash: tempPasswordHash,
            mustChangePassword: true,
          },
        });
      } else {
        // CASE B: User already exists -> Update User with temporary password & mustChangePassword = true for staff account setup
        user = await tx.user.update({
          where: { id: user.id },
          data: {
            passwordHash: tempPasswordHash,
            mustChangePassword: true,
          },
        });
      }
      resolvedUserName = user.name;

      // Check whether user is already a BusinessMember of current business
      const existingMember = await tx.businessMember.findUnique({
        where: {
          userId_businessId: {
            userId: user.id,
            businessId,
          },
        },
      });

      if (existingMember) {
        // Check if staff profile already exists for this member
        const existingStaff = await tx.staff.findUnique({
          where: { businessMemberId: existingMember.id },
        });

        if (existingStaff) {
          const error = new Error('This person is already a member of this business.');
          error.statusCode = 409;
          throw error;
        }

        targetBusinessMemberId = existingMember.id;
      } else {
        // Create BusinessMember for this business
        const newMember = await tx.businessMember.create({
          data: {
            userId: user.id,
            businessId,
            role: 'STAFF',
          },
        });
        targetBusinessMemberId = newMember.id;
      }
    } else {
      // Legacy flow: verify existing BusinessMember belongs to THIS business
      const member = await tx.businessMember.findUnique({
        where: { id: targetBusinessMemberId },
        include: { user: true },
      });

      if (!member || member.businessId !== businessId) {
        const error = new Error('Business member does not belong to this business.');
        error.statusCode = 400;
        throw error;
      }

      const existingStaff = await tx.staff.findUnique({
        where: { businessMemberId: targetBusinessMemberId },
      });

      if (existingStaff) {
        const error = new Error('This person is already a member of this business.');
        error.statusCode = 409;
        throw error;
      }

      resolvedUserName = member.user?.name || null;

      await tx.user.update({
        where: { id: member.userId },
        data: {
          passwordHash: tempPasswordHash,
          mustChangePassword: true,
        },
      });
    }

    const displayName = validated.displayName?.trim() || validated.name?.trim() || resolvedUserName || 'Staff Member';

    // 1. Create Staff Profile
    const staff = await tx.staff.create({
      data: {
        businessMemberId: targetBusinessMemberId,
        displayName,
        bio: validated.bio?.trim() || null,
        isActive: validated.isActive !== undefined ? validated.isActive : true,
      },
    });

    // 2. Assign Services (StaffService)
    if (validated.serviceIds && validated.serviceIds.length > 0) {
      const validServices = await tx.service.findMany({
        where: {
          id: { in: validated.serviceIds },
          businessId,
          isActive: true,
        },
      });

      if (validServices.length !== validated.serviceIds.length) {
        const error = new Error('One or more selected services are invalid, inactive, or belong to another business.');
        error.statusCode = 400;
        throw error;
      }

      await tx.staffService.createMany({
        data: validated.serviceIds.map((sId) => ({
          staffId: staff.id,
          serviceId: sId,
        })),
      });
    }

    // 3. Weekly Schedule (StaffSchedule) - single batched insert
    if (scheduleRows.length > 0) {
      await tx.staffSchedule.createMany({
        data: scheduleRows.map((sch) => ({
          staffId: staff.id,
          dayOfWeek: sch.dayOfWeek,
          startTime: sch.startTime,
          endTime: sch.endTime,
          isAvailable: sch.isAvailable,
        })),
      });
    }

    // 4. Initial Breaks (StaffBreak)
    if (normalizedInitialBreaks.length > 0) {
      await tx.staffBreak.createMany({
        data: normalizedInitialBreaks.map((br) => ({
          staffId: staff.id,
          dayOfWeek: br.dayOfWeek,
          startTime: br.startTime,
          endTime: br.endTime,
          label: br.label,
        })),
      });
    }

    // 5. Initial Time Off (StaffTimeOff)
    if (timeOffRows.length > 0) {
      await tx.staffTimeOff.createMany({
        data: timeOffRows.map((to) => ({
          staffId: staff.id,
          startDateTime: to.startDateTime,
          endDateTime: to.endDateTime,
          reason: to.reason,
        })),
      });
    }

    // Return complete staff record with relations
    const createdStaff = await tx.staff.findUnique({
      where: { id: staff.id },
      include: {
        businessMember: {
          include: {
            user: {
              select: {
                id: true,
                name: true,
                email: true,
                phone: true,
              },
            },
          },
        },
        staffServices: {
          include: { service: true },
        },
        schedules: true,
        breaks: true,
        timeOffs: true,
      },
    });

    if (generatedTemporaryPassword) {
      createdStaff.temporaryPassword = generatedTemporaryPassword;
    }

    return createdStaff;
  }, {
    maxWait: 10000,
    timeout: 15000,
  });
};

/**
 * Update staff profile details
 */
const updateStaffProfile = async (businessId, staffId, data) => {
  const validated = updateStaffProfileSchema.parse(data);

  const staff = await getStaffById(businessId, staffId);

  return await prisma.staff.update({
    where: { id: staffId },
    data: validated,
  });
};

/**
 * Soft delete (deactivate) staff profile
 */
const deactivateStaffProfile = async (businessId, staffId) => {
  const staff = await getStaffById(businessId, staffId);

  return await prisma.staff.update({
    where: { id: staffId },
    data: { isActive: false },
  });
};

/**
 * Get assigned services for a staff member
 */
const getStaffServices = async (businessId, staffId) => {
  const staff = await getStaffById(businessId, staffId);

  const assignments = await prisma.staffService.findMany({
    where: { staffId },
    include: {
      service: true,
    },
  });

  return assignments.map((a) => a.service);
};

/**
 * Assign services to a staff member (Validating cross-tenant service matching)
 */
const setStaffServices = async (businessId, staffId, data) => {
  const validated = setStaffServicesSchema.parse(data);

  // 1. Verify staff belongs to businessId
  await getStaffById(businessId, staffId);

  // 2. Verify ALL serviceIds belong to THIS businessId
  if (validated.serviceIds.length > 0) {
    const matchedServices = await prisma.service.findMany({
      where: {
        id: { in: validated.serviceIds },
        businessId,
      },
    });

    if (matchedServices.length !== validated.serviceIds.length) {
      const error = new Error('One or more selected services do not belong to this business.');
      error.statusCode = 400;
      throw error;
    }
  }

  // 3. Atomically replace staff services in a Prisma Transaction
  return await prisma.$transaction(async (tx) => {
    await tx.staffService.deleteMany({
      where: { staffId },
    });

    if (validated.serviceIds.length > 0) {
      await tx.staffService.createMany({
        data: validated.serviceIds.map((serviceId) => ({
          staffId,
          serviceId,
        })),
      });
    }

    const assignments = await tx.staffService.findMany({
      where: { staffId },
      include: { service: true },
    });

    return {
      assignedCount: assignments.length,
      services: assignments.map((a) => a.service),
    };
  });
};

/**
 * Get weekly recurring availability schedule for a staff member
 */
const getStaffSchedule = async (businessId, staffId) => {
  await getStaffById(businessId, staffId);

  return await prisma.staffSchedule.findMany({
    where: { staffId },
    orderBy: { dayOfWeek: 'asc' },
  });
};

/**
 * Set weekly availability schedule for a staff member
 */
const setStaffSchedule = async (businessId, staffId, data) => {
  const validated = updateScheduleSchema.parse(data);

  for (const s of validated.schedules) {
    if (s.isAvailable && s.startTime >= s.endTime) {
      const error = new Error(`Working hours for day ${s.dayOfWeek} must have startTime before endTime.`);
      error.statusCode = 400;
      throw error;
    }
  }

  await getStaffById(businessId, staffId);

  return await prisma.$transaction(async (tx) => {
    await tx.staffSchedule.deleteMany({
      where: { staffId },
    });

    await tx.staffSchedule.createMany({
      data: validated.schedules.map((s) => ({
        staffId,
        dayOfWeek: s.dayOfWeek,
        startTime: s.startTime,
        endTime: s.endTime,
        isAvailable: s.isAvailable !== undefined ? s.isAvailable : true,
      })),
    });

    return await tx.staffSchedule.findMany({
      where: { staffId },
      orderBy: { dayOfWeek: 'asc' },
    });
  });
};

/**
 * Get time-off entries for a staff member
 */
const getStaffTimeOff = async (businessId, staffId) => {
  await getStaffById(businessId, staffId);

  return await prisma.staffTimeOff.findMany({
    where: { staffId },
    orderBy: { startDateTime: 'asc' },
  });
};

/**
 * Create a time-off entry for a staff member
 */
const createStaffTimeOff = async (businessId, staffId, data) => {
  const validated = createTimeOffSchema.parse(data);

  await getStaffById(businessId, staffId);

  const newStart = new Date(validated.startDateTime);
  const newEnd = new Date(validated.endDateTime);

  // 1. Check for overlapping time off for this staff member
  const overlappingTimeOff = await prisma.staffTimeOff.findFirst({
    where: {
      staffId,
      startDateTime: { lt: newEnd },
      endDateTime: { gt: newStart },
    },
  });

  if (overlappingTimeOff) {
    const error = new Error('Time off overlaps with an existing time-off entry.');
    error.statusCode = 400;
    throw error;
  }

  // 2. Protect existing active bookings
  const conflictingBooking = await prisma.booking.findFirst({
    where: {
      staffId,
      status: { in: ['PENDING', 'CONFIRMED', 'IN_PROGRESS'] },
      startTime: { lt: newEnd },
      endTime: { gt: newStart },
    },
  });

  if (conflictingBooking) {
    const error = new Error('Cannot request time off: An active appointment is already scheduled during this period.');
    error.statusCode = 400;
    throw error;
  }

  return await prisma.staffTimeOff.create({
    data: {
      staffId,
      startDateTime: newStart,
      endDateTime: newEnd,
      reason: validated.reason || null,
    },
  });
};

/**
 * Delete a time-off entry for a staff member
 */
const deleteStaffTimeOff = async (businessId, staffId, timeOffId) => {
  await getStaffById(businessId, staffId);

  const timeOff = await prisma.staffTimeOff.findUnique({
    where: { id: timeOffId },
  });

  if (!timeOff || timeOff.staffId !== staffId) {
    const error = new Error('Time-off entry not found for this staff member.');
    error.statusCode = 404;
    throw error;
  }

  if (new Date(timeOff.endDateTime) <= new Date()) {
    const error = new Error('Past time-off entries cannot be deleted.');
    error.statusCode = 400;
    throw error;
  }

  await prisma.staffTimeOff.delete({
    where: { id: timeOffId },
  });

  return true;
};

/**
 * Get break entries for a staff member
 */
const getStaffBreaks = async (businessId, staffId) => {
  await getStaffById(businessId, staffId);

  return await prisma.staffBreak.findMany({
    where: { staffId },
    orderBy: [{ dayOfWeek: 'asc' }, { startTime: 'asc' }],
  });
};

/**
 * Create a break entry for a staff member with full schedule & overlap validation
 */
const createStaffBreak = async (businessId, staffId, data) => {
  const validated = createStaffBreakSchema.parse(data);
  await getStaffById(businessId, staffId);

  if (validated.startTime >= validated.endTime) {
    const error = new Error('Break startTime must be strictly before endTime.');
    error.statusCode = 400;
    throw error;
  }

  const schedule = await prisma.staffSchedule.findUnique({
    where: {
      staffId_dayOfWeek: {
        staffId,
        dayOfWeek: validated.dayOfWeek,
      },
    },
  });

  if (!schedule || !schedule.isAvailable) {
    const error = new Error('Cannot add a break on a scheduled OFF day.');
    error.statusCode = 400;
    throw error;
  }

  if (validated.startTime < schedule.startTime || validated.endTime > schedule.endTime) {
    const error = new Error(`Break must fall completely inside staff working hours (${schedule.startTime} – ${schedule.endTime}).`);
    error.statusCode = 400;
    throw error;
  }

  const existingBreaks = await prisma.staffBreak.findMany({
    where: {
      staffId,
      dayOfWeek: validated.dayOfWeek,
    },
  });

  for (const b of existingBreaks) {
    if (validated.startTime < b.endTime && validated.endTime > b.startTime) {
      const error = new Error(`Break time overlaps with an existing break (${b.label || 'Break'}: ${b.startTime} - ${b.endTime}).`);
      error.statusCode = 400;
      throw error;
    }
  }

  return await prisma.staffBreak.create({
    data: {
      staffId,
      dayOfWeek: validated.dayOfWeek,
      startTime: validated.startTime,
      endTime: validated.endTime,
      label: validated.label || null,
    },
  });
};

/**
 * Update a break entry for a staff member
 */
const updateStaffBreak = async (businessId, staffId, breakId, data) => {
  const validated = updateStaffBreakSchema.parse(data);
  await getStaffById(businessId, staffId);

  const existingBreak = await prisma.staffBreak.findUnique({
    where: { id: breakId },
  });

  if (!existingBreak || existingBreak.staffId !== staffId) {
    const error = new Error('Break record not found for this staff member.');
    error.statusCode = 404;
    throw error;
  }

  const dayOfWeek = validated.dayOfWeek !== undefined ? validated.dayOfWeek : existingBreak.dayOfWeek;
  const startTime = validated.startTime || existingBreak.startTime;
  const endTime = validated.endTime || existingBreak.endTime;
  const label = validated.label !== undefined ? validated.label : existingBreak.label;

  if (startTime >= endTime) {
    const error = new Error('Break startTime must be strictly before endTime.');
    error.statusCode = 400;
    throw error;
  }

  const schedule = await prisma.staffSchedule.findUnique({
    where: {
      staffId_dayOfWeek: {
        staffId,
        dayOfWeek,
      },
    },
  });

  if (!schedule || !schedule.isAvailable) {
    const error = new Error('Cannot set a break on a scheduled OFF day.');
    error.statusCode = 400;
    throw error;
  }

  if (startTime < schedule.startTime || endTime > schedule.endTime) {
    const error = new Error(`Break must fall completely inside staff working hours (${schedule.startTime} – ${schedule.endTime}).`);
    error.statusCode = 400;
    throw error;
  }

  const otherBreaks = await prisma.staffBreak.findMany({
    where: {
      staffId,
      dayOfWeek,
      id: { not: breakId },
    },
  });

  for (const b of otherBreaks) {
    if (startTime < b.endTime && endTime > b.startTime) {
      const error = new Error(`Break time overlaps with an existing break (${b.label || 'Break'}: ${b.startTime} - ${b.endTime}).`);
      error.statusCode = 400;
      throw error;
    }
  }

  return await prisma.staffBreak.update({
    where: { id: breakId },
    data: {
      dayOfWeek,
      startTime,
      endTime,
      label,
    },
  });
};

/**
 * Delete a break entry for a staff member
 */
const deleteStaffBreak = async (businessId, staffId, breakId) => {
  await getStaffById(businessId, staffId);

  const existingBreak = await prisma.staffBreak.findUnique({
    where: { id: breakId },
  });

  if (!existingBreak || existingBreak.staffId !== staffId) {
    const error = new Error('Break record not found for this staff member.');
    error.statusCode = 404;
    throw error;
  }

  await prisma.staffBreak.delete({
    where: { id: breakId },
  });

  return true;
};

/**
 * Bulk set/reconcile recurring breaks for a staff member
 */
const setStaffBreaks = async (businessId, staffId, data) => {
  await getStaffById(businessId, staffId);

  const breaks = data.breaks || [];

  const schedules = await prisma.staffSchedule.findMany({
    where: { staffId },
  });
  const scheduleMap = new Map(schedules.map((s) => [s.dayOfWeek, s]));

  const normalizedBreaks = [];
  const breakSet = new Set();

  for (const br of breaks) {
    if (!br.startTime || !br.endTime) continue;
    if (br.startTime >= br.endTime) {
      const error = new Error('Break startTime must be strictly before endTime.');
      error.statusCode = 400;
      throw error;
    }

    const days = br.dayOfWeek !== undefined ? [Number(br.dayOfWeek)] : [1, 2, 3, 4, 5, 6];
    for (const day of days) {
      const sch = scheduleMap.get(day);
      if (!sch || !sch.isAvailable) {
        if (br.dayOfWeek !== undefined) {
          const error = new Error(`Cannot add a break on a non-working day (Day ${day}).`);
          error.statusCode = 400;
          throw error;
        }
        continue;
      }

      if (br.startTime < sch.startTime || br.endTime > sch.endTime) {
        const error = new Error(`Break (${br.startTime} – ${br.endTime}) must fall completely inside working hours (${sch.startTime} – ${sch.endTime}).`);
        error.statusCode = 400;
        throw error;
      }

      const key = `${day}_${br.startTime}_${br.endTime}`;
      if (!breakSet.has(key)) {
        breakSet.add(key);
        normalizedBreaks.push({
          staffId,
          dayOfWeek: day,
          startTime: br.startTime,
          endTime: br.endTime,
          label: br.label || br.title || 'Break',
        });
      }
    }
  }

  const breaksByDay = {};
  for (const b of normalizedBreaks) {
    if (!breaksByDay[b.dayOfWeek]) breaksByDay[b.dayOfWeek] = [];
    for (const existing of breaksByDay[b.dayOfWeek]) {
      if (b.startTime < existing.endTime && b.endTime > existing.startTime) {
        const error = new Error(`Break (${b.startTime} - ${b.endTime}) overlaps with another break (${existing.startTime} - ${existing.endTime}).`);
        error.statusCode = 400;
        throw error;
      }
    }
    breaksByDay[b.dayOfWeek].push(b);
  }

  return await prisma.$transaction(async (tx) => {
    await tx.staffBreak.deleteMany({
      where: { staffId },
    });

    if (normalizedBreaks.length > 0) {
      await tx.staffBreak.createMany({
        data: normalizedBreaks,
      });
    }

    return await tx.staffBreak.findMany({
      where: { staffId },
      orderBy: [{ dayOfWeek: 'asc' }, { startTime: 'asc' }],
    });
  });
};

module.exports = {
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
};
