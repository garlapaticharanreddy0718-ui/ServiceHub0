const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  const bookings = await prisma.booking.findMany({
    include: {
      customer: true,
      staff: true,
      service: true
    },
    orderBy: { startTime: 'desc' }
  });
  console.log('--- ALL BOOKINGS ---');
  for (const b of bookings) {
    const start = new Date(b.startTime);
    const end = new Date(b.endTime);
    console.log(`ID: ${b.id} | Customer: ${b.customer?.name} | Staff: ${b.staff?.displayName} | Service: ${b.service?.name} | Status: ${b.status} | Start: ${start.toISOString()} (${start.toLocaleTimeString()}) | End: ${end.toISOString()} (${end.toLocaleTimeString()})`);
  }

  const staffSchedules = await prisma.staffSchedule.findMany({
    include: { staff: true }
  });
  console.log('\n--- STAFF SCHEDULES ---');
  for (const s of staffSchedules) {
    console.log(`Staff: ${s.staff.displayName} | Day: ${s.dayOfWeek} | Hours: ${s.startTime} - ${s.endTime} | Available: ${s.isAvailable}`);
  }
}

main().catch(console.error).finally(() => prisma.$disconnect());
