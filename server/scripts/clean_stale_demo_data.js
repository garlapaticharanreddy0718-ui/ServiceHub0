const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function cleanStaleBusinesses() {
  console.log('Cleaning up stale test businesses, test staff, and out-of-bounds bookings from demo database...');

  const validDemoNames = [
    'Glow & Style Beauty Studio',
    'FitZone Fitness Center',
    'QuickFix Home Services',
  ];

  const allBiz = await prisma.business.findMany();
  const toDelete = allBiz.filter(
    (b) => !validDemoNames.includes(b.name) && !b.userId
  );

  console.log(`Found ${toDelete.length} stale test businesses to clean up:`, toDelete.map((b) => b.name));

  for (const biz of toDelete) {
    try {
      await prisma.bookingStatusHistory.deleteMany({ where: { booking: { businessId: biz.id } } });
      await prisma.booking.deleteMany({ where: { businessId: biz.id } });
      await prisma.review.deleteMany({ where: { businessId: biz.id } });
      await prisma.staffBreak.deleteMany({ where: { staff: { businessMember: { businessId: biz.id } } } });
      await prisma.staffSchedule.deleteMany({ where: { staff: { businessMember: { businessId: biz.id } } } });
      await prisma.staffTimeOff.deleteMany({ where: { staff: { businessMember: { businessId: biz.id } } } });
      await prisma.staffService.deleteMany({ where: { service: { businessId: biz.id } } });
      await prisma.staff.deleteMany({ where: { businessMember: { businessId: biz.id } } });
      await prisma.service.deleteMany({ where: { businessId: biz.id } });
      await prisma.serviceCategory.deleteMany({ where: { businessId: biz.id } });
      await prisma.customerNote.deleteMany({ where: { customer: { businessId: biz.id } } });
      await prisma.customer.deleteMany({ where: { businessId: biz.id } });
      await prisma.businessMember.deleteMany({ where: { businessId: biz.id } });
      await prisma.business.delete({ where: { id: biz.id } });
      console.log(`✓ Successfully deleted stale business: ${biz.name}`);
    } catch (err) {
      console.error(`Failed to delete business ${biz.name}:`, err.message);
    }
  }

  // Clean up temporary test staff (emails starting with staff.test. or kiran.test. or test.staff.)
  const staleStaff = await prisma.staff.findMany({
    where: {
      businessMember: {
        user: {
          OR: [
            { email: { startsWith: 'staff.test.' } },
            { email: { startsWith: 'kiran.test.' } },
            { email: { startsWith: 'test.staff.' } },
          ],
        },
      },
    },
    include: { businessMember: { include: { user: true } } },
  });

  if (staleStaff.length > 0) {
    console.log(`Cleaning up ${staleStaff.length} stale test staff profiles...`);
    for (const st of staleStaff) {
      const bmId = st.businessMemberId;
      const userId = st.businessMember?.userId;

      await prisma.bookingStatusHistory.deleteMany({ where: { booking: { staffId: st.id } } });
      await prisma.booking.deleteMany({ where: { staffId: st.id } });
      await prisma.staffBreak.deleteMany({ where: { staffId: st.id } });
      await prisma.staffSchedule.deleteMany({ where: { staffId: st.id } });
      await prisma.staffTimeOff.deleteMany({ where: { staffId: st.id } });
      await prisma.staffService.deleteMany({ where: { staffId: st.id } });
      await prisma.staff.delete({ where: { id: st.id } });
      if (bmId) await prisma.businessMember.delete({ where: { id: bmId } });
      if (userId) await prisma.user.delete({ where: { id: userId } });
    }
    console.log(`✓ Successfully cleaned up stale test staff profiles.`);
  }

  // Clean up out-of-bounds bookings (outside business operating hours 09:00 - 18:00)
  const bookings = await prisma.booking.findMany();
  const outOfBoundsIds = [];

  for (const b of bookings) {
    const start = new Date(b.startTime);
    const end = new Date(b.endTime);

    const localStartHour = start.getHours();
    const localEndHour = end.getHours();
    const localEndMin = end.getMinutes();

    if (localStartHour < 9 || localEndHour > 18 || (localEndHour === 18 && localEndMin > 0)) {
      outOfBoundsIds.push(b.id);
    }
  }

  if (outOfBoundsIds.length > 0) {
    console.log(`Cleaning up ${outOfBoundsIds.length} out-of-bounds test bookings (outside 09:00 - 18:00)...`);
    await prisma.bookingStatusHistory.deleteMany({ where: { bookingId: { in: outOfBoundsIds } } });
    await prisma.booking.deleteMany({ where: { id: { in: outOfBoundsIds } } });
    console.log(`✓ Successfully deleted out-of-bounds bookings.`);
  }

  const remaining = await prisma.business.findMany({ select: { name: true, category: true } });
  console.log('\nRemaining Businesses in Database:', remaining);
  await prisma.$disconnect();
}

cleanStaleBusinesses().catch((err) => {
  console.error(err);
  process.exit(1);
});
