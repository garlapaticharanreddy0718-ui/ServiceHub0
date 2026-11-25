const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  console.log('=== TEST: BUSINESS OPERATING HOURS (09:00 to 18:00) ENFORCEMENT ===\n');

  // 1. Check for any out-of-bounds bookings in DB
  const bookings = await prisma.booking.findMany();
  const outOfBounds = [];

  for (const b of bookings) {
    const start = new Date(b.startTime);
    const end = new Date(b.endTime);
    const localStartHour = start.getHours();
    const localEndHour = end.getHours();
    const localEndMin = end.getMinutes();

    if (localStartHour < 9 || localEndHour > 18 || (localEndHour === 18 && localEndMin > 0)) {
      outOfBounds.push(b);
    }
  }

  if (outOfBounds.length > 0) {
    console.error(`❌ FAIL: Found ${outOfBounds.length} out-of-bounds bookings in database.`);
    process.exit(1);
  } else {
    console.log('  ✓ Database contains ZERO out-of-bounds bookings (outside 09:00 - 18:00).');
  }

  // 2. Check Staff Schedules in DB
  const staffSchedules = await prisma.staffSchedule.findMany();
  const nonStandardSchedules = staffSchedules.filter(s => s.startTime !== '09:00' || s.endTime !== '18:00');
  if (nonStandardSchedules.length > 0) {
    console.log(`  ! Found ${nonStandardSchedules.length} staff schedules with custom hours:`, nonStandardSchedules);
  } else {
    console.log('  ✓ All staff working schedules are set to standard 09:00 - 18:00 hours.');
  }

  console.log('\n✓ Business Operating Hours Verification PASSED!');
}

main().catch(console.error).finally(() => prisma.$disconnect());
