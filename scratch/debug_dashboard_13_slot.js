const path = require('path');
const { PrismaClient } = require(path.join(__dirname, '../server/node_modules/@prisma/client'));
const prisma = new PrismaClient();

async function main() {
  const now = new Date();
  const todayDayOfWeek = now.getDay();
  const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 0, 0, 0);
  const todayEnd = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59);

  const biz = await prisma.business.findFirst({ where: { name: 'Glow & Style Beauty Studio' } });
  const allStaff = await prisma.staff.findMany({
    where: { businessMember: { businessId: biz.id }, isActive: true },
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
  });

  const hour = 13;
  const slotStart = new Date(todayStart);
  slotStart.setHours(hour, 0, 0, 0);
  const slotEnd = new Date(todayStart);
  slotEnd.setHours(hour + 1, 0, 0, 0);

  const activeTodaysBookings = await prisma.booking.findMany({
    where: { businessId: biz.id, startTime: { gte: todayStart, lte: todayEnd }, status: { in: ['PENDING', 'CONFIRMED', 'IN_PROGRESS'] } },
  });

  console.log(`Evaluating 13:00 - 14:00 slot on dayOfWeek ${todayDayOfWeek}:`);

  for (const st of allStaff) {
    console.log(`\nEvaluating ${st.displayName}:`);

    if (!st.isActive || !st.staffServices || st.staffServices.length === 0) {
      console.log(`  -> FAILED: inactive or no services`);
      continue;
    }

    const schedule = (st.schedules || []).find((s) => s.dayOfWeek === todayDayOfWeek);
    if (!schedule || !schedule.isAvailable) {
      console.log(`  -> FAILED: no schedule or not available today`);
      continue;
    }

    const [startH, startM] = schedule.startTime.split(':').map(Number);
    const [endH, endM] = schedule.endTime.split(':').map(Number);
    const workStart = new Date(todayStart);
    workStart.setHours(startH, startM || 0, 0, 0);
    const workEnd = new Date(todayStart);
    workEnd.setHours(endH, endM || 0, 0, 0);

    if (slotStart < workStart || slotEnd > workEnd) {
      console.log(`  -> FAILED: outside working hours (${schedule.startTime} - ${schedule.endTime})`);
      continue;
    }

    const onTimeOff = (st.timeOffs || []).some((to) => {
      const toStart = new Date(to.startDateTime);
      const toEnd = new Date(to.endDateTime);
      return slotStart < toEnd && slotEnd > toStart;
    });
    if (onTimeOff) {
      console.log(`  -> FAILED: on time off`);
      continue;
    }

    const matchingBreaks = (st.breaks || []).filter((brk) => brk.dayOfWeek === todayDayOfWeek);
    console.log(`  Breaks matching day ${todayDayOfWeek}:`, matchingBreaks.map(b => `${b.startTime}-${b.endTime}`));

    const onBreak = matchingBreaks.some((brk) => {
      const [sh, sm] = brk.startTime.split(':').map(Number);
      const [eh, em] = brk.endTime.split(':').map(Number);
      const bStart = new Date(todayStart);
      bStart.setHours(sh, sm || 0, 0, 0);
      const bEnd = new Date(todayStart);
      bEnd.setHours(eh, em || 0, 0, 0);

      console.log(`    Compare slot [${slotStart.toISOString()} - ${slotEnd.toISOString()}] with break [${bStart.toISOString()} - ${bEnd.toISOString()}]`);
      console.log(`    slotStart < bEnd (${slotStart < bEnd}), slotEnd > bStart (${slotEnd > bStart})`);

      return slotStart < bEnd && slotEnd > bStart;
    });

    if (onBreak) {
      console.log(`  -> FAILED: on break`);
      continue;
    }

    const hasBookingConflict = activeTodaysBookings.some((b) => {
      if (b.staffId !== st.id) return false;
      const bStart = new Date(b.startTime);
      const bEnd = new Date(b.endTime);
      return slotStart < bEnd && slotEnd > bStart;
    });
    if (hasBookingConflict) {
      console.log(`  -> FAILED: booking conflict`);
      continue;
    }

    console.log(`  -> PASSED: AVAILABLE!`);
  }
}

main().catch(console.error).finally(() => prisma.$disconnect());
