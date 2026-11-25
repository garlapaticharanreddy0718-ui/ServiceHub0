const asyncHandler = require('../utils/asyncHandler');
const prisma = require('../config/prisma');

/**
 * GET /api/v1/owner/dashboard
 * Fetch comprehensive business command center metrics for the authorized owner
 */
const getOwnerDashboard = asyncHandler(async (req, res) => {
  const userId = req.user.id;
  let { businessId } = req.query;

  // 1. Verify user membership & owner role
  let member = null;
  if (businessId) {
    member = await prisma.businessMember.findFirst({
      where: { userId, businessId },
      include: { business: true },
    });
  } else {
    member = await prisma.businessMember.findFirst({
      where: {
        userId,
        role: { in: ['OWNER', 'ADMIN'] },
      },
      include: { business: true },
    });
  }

  if (!member || (member.role !== 'OWNER' && member.role !== 'ADMIN')) {
    return res.status(403).json({
      status: 'fail',
      message: 'Access denied. Owner authorization required.',
    });
  }

  const business = member.business;
  businessId = business.id;

  // 2. Compute Date Boundaries
  const now = new Date();
  const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 0, 0, 0);
  const todayEnd = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59);

  const weekStart = new Date(todayStart);
  weekStart.setDate(weekStart.getDate() - 7);

  const monthStart = new Date(todayStart);
  monthStart.setDate(monthStart.getDate() - 30);

  const nextWeekEnd = new Date(todayEnd);
  nextWeekEnd.setDate(nextWeekEnd.getDate() + 7);

  // 3. Fetch Core Aggregations in Parallel
  const [
    todaysBookings,
    weekBookings,
    monthBookings,
    allCustomers,
    allStaff,
    allServices,
    recentReviews,
    unconfirmedCount,
    staffTimeOffs,
    allReviews,
  ] = await Promise.all([
    // Today's Bookings
    prisma.booking.findMany({
      where: { businessId, startTime: { gte: todayStart, lte: todayEnd } },
      include: {
        customer: true,
        service: true,
        staff: true,
        statusHistory: {
          include: {
            changedByUser: { select: { id: true, name: true, email: true } },
          },
          orderBy: { createdAt: 'asc' },
        },
      },
      orderBy: { startTime: 'asc' },
    }),
    // Week Bookings
    prisma.booking.findMany({
      where: { businessId, startTime: { gte: weekStart, lte: todayEnd } },
      include: { service: true },
    }),
    // Month Bookings
    prisma.booking.findMany({
      where: { businessId, startTime: { gte: monthStart, lte: todayEnd } },
      include: { service: true },
    }),
    // All Business Customers
    prisma.customer.findMany({
      where: { businessId, isActive: true },
      include: { bookings: { select: { id: true, startTime: true } } },
    }),
    // Active Staff with Schedules, Breaks, Time Off & Services
    prisma.staff.findMany({
      where: { businessMember: { businessId }, isActive: true },
      include: {
        businessMember: { include: { user: true } },
        schedules: true,
        breaks: true,
        timeOffs: {
          where: {
            startDateTime: { lte: todayEnd },
            endDateTime: { gte: todayStart },
          },
        },
        staffServices: true,
      },
    }),
    // Active Services
    prisma.service.findMany({
      where: { businessId, isActive: true },
      include: { bookings: { select: { id: true, totalAmount: true } } },
    }),
    // Recent Reviews
    prisma.review.findMany({
      where: { businessId },
      include: {
        customer: true,
        booking: { include: { service: true } },
      },
      orderBy: { createdAt: 'desc' },
      take: 2,
    }),
    // Unconfirmed Bookings Count
    prisma.booking.count({
      where: { businessId, status: 'PENDING' },
    }),
    // Staff Time Off requests next 7 days
    prisma.staffTimeOff.count({
      where: {
        staff: { businessMember: { businessId } },
        startDateTime: { lte: nextWeekEnd },
        endDateTime: { gte: todayStart },
      },
    }),
    // All Reviews for Rating Stats
    prisma.review.findMany({
      where: { businessId },
      select: { rating: true },
    }),
  ]);

  const totalReviews = allReviews.length;
  const avgRating = totalReviews > 0
    ? Number((allReviews.reduce((sum, r) => sum + (r.rating || 0), 0) / totalReviews).toFixed(1))
    : 0;

  // Deduplicate todaysBookings by b.id to guarantee 100% unique booking records
  const uniqueBookingsMap = new Map();
  todaysBookings.forEach((b) => {
    if (!uniqueBookingsMap.has(b.id)) {
      uniqueBookingsMap.set(b.id, b);
    }
  });
  const uniqueTodaysBookings = Array.from(uniqueBookingsMap.values());

  // 4. Calculate Business Pulse & Revenue Metrics
  const activeTodaysBookings = uniqueTodaysBookings.filter((b) => b.status !== 'CANCELLED' && b.status !== 'NO_SHOW');
  const expectedRevenueToday = activeTodaysBookings.reduce((sum, b) => sum + Number(b.totalAmount || 0), 0);
  const completedRevenueToday = uniqueTodaysBookings
    .filter((b) => b.status === 'COMPLETED')
    .reduce((sum, b) => sum + Number(b.totalAmount || 0), 0);

  const activeWeekBookings = weekBookings.filter((b) => b.status !== 'CANCELLED' && b.status !== 'NO_SHOW');
  const expectedRevenueWeek = activeWeekBookings.reduce((sum, b) => sum + Number(b.totalAmount || 0), 0);
  const completedRevenueWeek = weekBookings
    .filter((b) => b.status === 'COMPLETED')
    .reduce((sum, b) => sum + Number(b.totalAmount || 0), 0);

  const activeMonthBookings = monthBookings.filter((b) => b.status !== 'CANCELLED' && b.status !== 'NO_SHOW');
  const expectedRevenueMonth = activeMonthBookings.reduce((sum, b) => sum + Number(b.totalAmount || 0), 0);
  const completedRevenueMonth = monthBookings
    .filter((b) => b.status === 'COMPLETED')
    .reduce((sum, b) => sum + Number(b.totalAmount || 0), 0);

  // Booked Capacity Calculation (Booked minutes vs total staff capacity 8h = 480m per active staff)
  const totalBookedMinutesToday = activeTodaysBookings.reduce((sum, b) => {
    const duration = b.service?.durationMinutes || 45;
    return sum + duration;
  }, 0);
  const totalCapacityMinutesToday = Math.max(1, allStaff.length * 480);
  const bookedCapacityPercent = Math.min(100, Math.round((totalBookedMinutesToday / totalCapacityMinutesToday) * 100));

  // Returning Customer: defined strictly as a customer with >= 2 COMPLETED visits
  const returningCustomersCount = allCustomers.filter((c) => {
    const completedVisits = (c.bookings || []).filter((b) => b.status === 'COMPLETED');
    return completedVisits.length >= 2;
  }).length;
  const returningCustomersPercent = allCustomers.length > 0 ? Math.round((returningCustomersCount / allCustomers.length) * 100) : 0;

  // Inactive customers: defined strictly as Customer.isActive === false
  const inactiveCustomersCount = allCustomers.filter((c) => !c.isActive).length;

  const newCustomersMonthCount = allCustomers.filter((c) => new Date(c.createdAt) >= monthStart).length;

  // 5. Team Workload Metrics
  const teamWorkload = allStaff.map((st) => {
    const staffBookings = activeTodaysBookings.filter((b) => b.staffId === st.id);
    const bookedMinutes = staffBookings.reduce((sum, b) => sum + (b.service?.durationMinutes || 45), 0);
    const capacityPercent = Math.min(100, Math.round((bookedMinutes / 480) * 100));
    const isHeavyWorkload = capacityPercent >= 75;

    return {
      id: st.id,
      displayName: st.displayName || st.businessMember?.user?.name || 'Staff Member',
      role: 'Staff Specialist',
      bookedMinutes,
      bookingsCount: staffBookings.length,
      capacityPercent,
      isHeavyWorkload,
      warningMessage: isHeavyWorkload ? `${st.displayName || 'Staff member'} is nearly fully booked today.` : null,
    };
  });

  // 6. Popular Services Ranking
  const serviceStats = allServices.map((svc) => {
    const serviceBookings = monthBookings.filter((b) => b.serviceId === svc.id && b.status !== 'CANCELLED' && b.status !== 'NO_SHOW');
    const totalRev = serviceBookings.reduce((sum, b) => sum + Number(b.totalAmount || 0), 0);

    return {
      id: svc.id,
      name: svc.name,
      price: Number(svc.price),
      durationMinutes: svc.durationMinutes,
      bookingsCount: serviceBookings.length,
      revenueContribution: totalRev,
    };
  }).sort((a, b) => b.bookingsCount - a.bookingsCount).slice(0, 4);

  // 7. Calculate Real Business Setup Status from Database Criteria
  const servicesCount = allServices.length;
  const servicesComplete = servicesCount > 0;

  const teamCount = allStaff.length;
  const teamComplete = teamCount > 0;

  const staffWithServiceAndSchedule = allStaff.filter(
    (st) => (st.staffServices || []).length > 0 && (st.schedules || []).some((s) => s.isAvailable)
  );
  const availabilityComplete = staffWithServiceAndSchedule.length > 0;

  const isSetupComplete = servicesComplete && teamComplete && availabilityComplete;

  const setupStatus = {
    isSetupComplete,
    steps: {
      services: { complete: servicesComplete, count: servicesCount },
      team: { complete: teamComplete, count: teamCount },
      availability: { complete: availabilityComplete, configuredStaffCount: staffWithServiceAndSchedule.length },
    },
  };

  // 8. Needs Attention Items
  const needsAttention = [];
  if (unconfirmedCount > 0) {
    needsAttention.push({
      id: 'unconfirmed',
      count: unconfirmedCount,
      title: 'Bookings waiting for confirmation',
      targetTab: 'bookings',
    });
  }
  if (staffTimeOffs > 0) {
    needsAttention.push({
      id: 'staff-timeoff',
      count: staffTimeOffs,
      title: 'Staff member requested time off',
      targetTab: 'staff',
    });
  }
  if (inactiveCustomersCount > 0) {
    needsAttention.push({
      id: 'inactive-customers',
      count: inactiveCustomersCount,
      title: 'Customers haven\'t booked recently',
      targetTab: 'customers',
    });
  }
  const availableSlotsToday = Math.max(0, (allStaff.length * 8) - activeTodaysBookings.length);
  if (availableSlotsToday > 0 && activeTodaysBookings.length > 0) {
    needsAttention.push({
      id: 'available-slots',
      count: availableSlotsToday,
      title: 'Available appointment slots today',
      targetTab: 'bookings',
    });
  }

  // 9. Revenue & Opportunity Opportunities
  const opportunities = [];
  if (returningCustomersPercent < 30 && allCustomers.length >= 5) {
    opportunities.push({
      id: 'opp-[#173F35]',
      title: 'Boost client retention with follow-up packages',
      explanation: 'Only ' + returningCustomersPercent + '% of customers have booked more than once. Create standard repeat packages.',
      targetTab: 'services',
    });
  }

  const heavyStaff = teamWorkload.find((t) => t.capacityPercent >= 80);
  if (heavyStaff) {
    opportunities.push({
      id: 'opp-workload',
      title: 'One staff member is carrying most of today\'s workload',
      explanation: `${heavyStaff.displayName} is at ${heavyStaff.capacityPercent}% capacity. Rebalance upcoming appointments across available team members.`,
      targetTab: 'staff',
    });
  }

  // Fallback default opportunity if list is empty
  if (opportunities.length === 0) {
    opportunities.push({
      id: 'opp-growth',
      title: 'Not enough business history yet',
      explanation: 'Insights will appear as your business grows.',
      targetTab: 'services',
    });
  }

  // 10. Today's Operational Timeline Generation (Bookings, Breaks, Time Off, Free Slots)
  const timelineItems = [];
  const todayDayOfWeek = now.getDay(); // 0 = Sunday, 1 = Monday, ..., 6 = Saturday

  // A. Add Bookings (Each unique booking produces exactly one event with key booking:${b.id})
  uniqueTodaysBookings.forEach((b) => {
    const start = new Date(b.startTime);
    const end = new Date(b.endTime);
    const isNow = now >= start && now < end && b.status !== 'CANCELLED' && b.status !== 'COMPLETED' && b.status !== 'NO_SHOW';

    timelineItems.push({
      key: `booking:${b.id}`,
      id: b.id,
      type: 'BOOKING',
      startTime: b.startTime,
      endTime: b.endTime,
      startTimeFormatted: start.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      endTimeFormatted: end.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      serviceName: b.service?.name || 'Service',
      serviceId: b.serviceId,
      durationMinutes: b.service?.durationMinutes || 45,
      customerName: b.customer?.name || 'Customer',
      customerId: b.customerId,
      customerPhone: b.customer?.phone || null,
      customerEmail: b.customer?.email || null,
      staffName: b.staff?.displayName || b.staff?.businessMember?.user?.name || 'Staff Specialist',
      staffId: b.staffId,
      status: b.status,
      totalAmount: Number(b.totalAmount || 0),
      notes: b.notes || null,
      statusHistory: (b.statusHistory || []).map((sh) => ({
        id: sh.id,
        fromStatus: sh.fromStatus,
        toStatus: sh.toStatus,
        changedByName: sh.changedByUser?.name || 'System',
        reason: sh.reason,
        createdAtFormatted: new Date(sh.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      })),
      isNow,
    });
  });

  // B. Add Staff Breaks for Today
  allStaff.forEach((st) => {
    const staffName = st.displayName || st.businessMember?.user?.name || 'Staff Specialist';
    (st.breaks || [])
      .filter((brk) => brk.dayOfWeek === todayDayOfWeek)
      .forEach((brk) => {
        const [sh, sm] = brk.startTime.split(':').map(Number);
        const [eh, em] = brk.endTime.split(':').map(Number);
        const bStart = new Date(todayStart);
        bStart.setHours(sh, sm || 0, 0, 0);
        const bEnd = new Date(todayStart);
        bEnd.setHours(eh, em || 0, 0, 0);

        const isNow = now >= bStart && now < bEnd;

        timelineItems.push({
          key: `break:${brk.id}`,
          id: brk.id,
          type: 'BREAK',
          startTime: bStart.toISOString(),
          endTime: bEnd.toISOString(),
          startTimeFormatted: bStart.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          endTimeFormatted: bEnd.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          label: brk.label || 'Lunch Break',
          staffName,
          staffId: st.id,
          isNow,
        });
      });
  });

  // C. Add Staff Time Off for Today
  allStaff.forEach((st) => {
    const staffName = st.displayName || st.businessMember?.user?.name || 'Staff Specialist';
    (st.timeOffs || []).forEach((to) => {
      const toStart = new Date(to.startDateTime);
      const toEnd = new Date(to.endDateTime);
      const isNow = now >= toStart && now < toEnd;

      timelineItems.push({
        key: `timeoff:${to.id}`,
        id: to.id,
        type: 'TIMEOFF',
        startTime: toStart.toISOString(),
        endTime: toEnd.toISOString(),
        startTimeFormatted: toStart.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        endTimeFormatted: toEnd.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        reason: to.reason || 'Time Off',
        staffName,
        staffId: st.id,
        isNow,
      });
    });
  });

  // D. Calculate Free Capacity Slots (hourly blocks)
  // Only active, unbooked staff working during the slot without breaks/time-off are counted!
  const businessHours = [9, 10, 11, 12, 13, 14, 15, 16, 17];
  businessHours.forEach((hour) => {
    const slotStart = new Date(todayStart);
    slotStart.setHours(hour, 0, 0, 0);
    const slotEnd = new Date(todayStart);
    slotEnd.setHours(hour + 1, 0, 0, 0);

    const availableStaff = allStaff.filter((st) => {
      // 1. Staff must be active and have assigned services
      if (!st.isActive || !st.staffServices || st.staffServices.length === 0) return false;

      // 2. Staff must have a working schedule for today and slot must fall inside working hours
      const schedule = (st.schedules || []).find((s) => s.dayOfWeek === todayDayOfWeek);
      if (!schedule || !schedule.isAvailable) return false;

      const [startH, startM] = schedule.startTime.split(':').map(Number);
      const [endH, endM] = schedule.endTime.split(':').map(Number);
      const workStart = new Date(todayStart);
      workStart.setHours(startH, startM || 0, 0, 0);
      const workEnd = new Date(todayStart);
      workEnd.setHours(endH, endM || 0, 0, 0);

      if (slotStart < workStart || slotEnd > workEnd) return false;

      // 3. Staff must NOT be on Time Off during this slot
      const onTimeOff = (st.timeOffs || []).some((to) => {
        const toStart = new Date(to.startDateTime);
        const toEnd = new Date(to.endDateTime);
        return slotStart < toEnd && slotEnd > toStart;
      });
      if (onTimeOff) return false;

      // 4. Staff must NOT be on Break during this slot
      const onBreak = (st.breaks || [])
        .filter((brk) => brk.dayOfWeek === todayDayOfWeek)
        .some((brk) => {
          const [sh, sm] = brk.startTime.split(':').map(Number);
          const [eh, em] = brk.endTime.split(':').map(Number);
          const bStart = new Date(todayStart);
          bStart.setHours(sh, sm || 0, 0, 0);
          const bEnd = new Date(todayStart);
          bEnd.setHours(eh, em || 0, 0, 0);
          return slotStart < bEnd && slotEnd > bStart;
        });
      if (onBreak) return false;

      // 5. Staff must NOT have a conflicting active booking (PENDING, CONFIRMED, IN_PROGRESS)
      const hasBookingConflict = activeTodaysBookings.some((b) => {
        if (b.staffId !== st.id) return false;
        const bStart = new Date(b.startTime);
        const bEnd = new Date(b.endTime);
        return slotStart < bEnd && slotEnd > bStart;
      });
      if (hasBookingConflict) return false;

      return true;
    });

    const availableStaffCount = availableStaff.length;

    if (availableStaffCount > 0) {
      timelineItems.push({
        key: `free:${slotStart.toISOString()}`,
        id: `free-${hour}`,
        type: 'FREE_SLOT',
        startTime: slotStart.toISOString(),
        endTime: slotEnd.toISOString(),
        startTimeFormatted: slotStart.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        endTimeFormatted: slotEnd.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        label: 'Available appointment slot',
        availableStaffCount,
      });
    }
  });

  // E. Filter and sort timelineItems strictly within business operating hours (09:00 to 18:00)
  const businessStartLimit = new Date(todayStart);
  businessStartLimit.setHours(9, 0, 0, 0);
  const businessEndLimit = new Date(todayStart);
  businessEndLimit.setHours(18, 0, 0, 0);

  const boundedTimelineItems = timelineItems.filter((item) => {
    const itemStart = new Date(item.startTime);
    const itemEnd = new Date(item.endTime);
    return itemStart < businessEndLimit && itemEnd > businessStartLimit;
  });

  const typePriority = { BOOKING: 1, BREAK: 2, TIMEOFF: 3, FREE_SLOT: 4 };

  boundedTimelineItems.sort((a, b) => {
    const timeA = new Date(a.startTime).getTime();
    const timeB = new Date(b.startTime).getTime();
    if (timeA !== timeB) return timeA - timeB;

    const prioA = typePriority[a.type] || 5;
    const prioB = typePriority[b.type] || 5;
    return prioA - prioB;
  });

  res.status(200).json({
    status: 'success',
    data: {
      business: {
        id: business.id,
        name: business.name,
        category: business.category || 'Service Business',
        location: business.city ? `${business.city}` : 'Hyderabad',
        description: business.description || 'Professional service studio.',
      },
      owner: {
        name: req.user.name,
        email: req.user.email,
        role: member.role,
      },
      dateString: now.toLocaleDateString('en-US', {
        weekday: 'long',
        month: 'long',
        day: 'numeric',
        year: 'numeric',
      }),
      setupStatus,
      needsAttention,
      businessPulse: {
        todaysAppointmentsCount: todaysBookings.length,
        expectedRevenueToday,
        completedRevenueToday,
        bookedCapacityPercent,
        returningCustomersPercent,
      },
      todaysSchedule: {
        hasStaff: allStaff.length > 0,
        items: boundedTimelineItems,
        summary: {
          totalBookings: todaysBookings.length,
          completedCount: todaysBookings.filter((b) => b.status === 'COMPLETED').length,
          inProgressCount: todaysBookings.filter((b) => b.status === 'IN_PROGRESS').length,
          pendingCount: todaysBookings.filter((b) => b.status === 'PENDING').length,
          cancelledCount: todaysBookings.filter((b) => b.status === 'CANCELLED').length,
          freeSlotsCount: boundedTimelineItems.filter((item) => item.type === 'FREE_SLOT').length,
        },
      },
      revenueSummary: {
        today: { expected: expectedRevenueToday, completed: completedRevenueToday },
        week: { expected: expectedRevenueWeek, completed: completedRevenueWeek },
        month: { expected: expectedRevenueMonth, completed: completedRevenueMonth },
      },
      teamWorkload,
      popularServices: serviceStats,
      customerActivity: {
        totalCustomers: allCustomers.length,
        newCustomersMonth: newCustomersMonthCount,
        returningCustomers: returningCustomersCount,
        inactiveCustomers: inactiveCustomersCount,
        totalReviews,
      },
      customerFeedback: {
        averageRating: avgRating,
        totalReviews,
        recentReviews: recentReviews.map((r) => ({
          id: r.id,
          rating: r.rating,
          comment: r.comment,
          customerName: r.customer?.name || 'Client',
          serviceName: r.booking?.service?.name || 'Service',
          dateFormatted: new Date(r.createdAt).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' }),
        })),
      },
      opportunities,
    },
  });
});

/**
 * Endpoint to fetch raw business setup status for owner guidance modal
 */
const getSetupStatus = asyncHandler(async (req, res) => {
  const { businessId } = req.query;
  if (!businessId) {
    const error = new Error('Business ID is required.');
    error.statusCode = 400;
    throw error;
  }

  const member = await prisma.businessMember.findUnique({
    where: {
      userId_businessId: {
        userId: req.user.id,
        businessId,
      },
    },
  });

  if (!member || !['OWNER', 'ADMIN'].includes(member.role)) {
    const error = new Error('Access denied. Owner permissions required.');
    error.statusCode = 403;
    throw error;
  }

  const activeServicesCount = await prisma.service.count({
    where: { businessId, isActive: true },
  });

  const activeStaff = await prisma.staff.findMany({
    where: { businessMember: { businessId }, isActive: true },
    include: {
      staffServices: true,
      schedules: { where: { isAvailable: true } },
    },
  });

  const servicesComplete = activeServicesCount > 0;
  const teamComplete = activeStaff.length > 0;
  const staffWithServiceAndSchedule = activeStaff.filter(
    (st) => (st.staffServices || []).length > 0 && (st.schedules || []).length > 0
  );
  const availabilityComplete = staffWithServiceAndSchedule.length > 0;

  const isSetupComplete = servicesComplete && teamComplete && availabilityComplete;

  res.status(200).json({
    status: 'success',
    data: {
      isSetupComplete,
      steps: {
        services: { complete: servicesComplete, count: activeServicesCount },
        team: { complete: teamComplete, count: activeStaff.length },
        availability: { complete: availabilityComplete, configuredStaffCount: staffWithServiceAndSchedule.length },
      },
    },
  });
});

module.exports = {
  getOwnerDashboard,
  getSetupStatus,
};
