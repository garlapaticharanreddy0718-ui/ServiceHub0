const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  const bookings = await prisma.booking.findMany({
    include: { customer: true, staff: true, service: true }
  });

  console.log(`Total bookings in DB: ${bookings.length}`);
  const outOfBounds = [];

  for (const b of bookings) {
    const start = new Date(b.startTime);
    const end = new Date(b.endTime);
    
    // In IST (+5.30), hours are:
    const startHourIST = (start.getUTCHours() + 5 + Math.floor((start.getUTCMinutes() + 30) / 60)) % 24;
    const startMinIST = (start.getUTCMinutes() + 30) % 60;
    
    // Check local time (using node's local time methods as well)
    const localStartHour = start.getHours();
    const localStartMin = start.getMinutes();
    const localEndHour = end.getHours();
    const localEndMin = end.getMinutes();

    // Business hours: 09:00 to 18:00
    // A booking is out-of-bounds if start < 09:00 or end > 18:00
    if (localStartHour < 9 || localEndHour > 18 || (localEndHour === 18 && localEndMin > 0)) {
      outOfBounds.push({
        id: b.id,
        customer: b.customer?.name,
        staff: b.staff?.displayName,
        service: b.service?.name,
        status: b.status,
        startTime: start.toISOString(),
        localStart: start.toLocaleTimeString(),
        localEnd: end.toLocaleTimeString()
      });
    }
  }

  console.log(`\nFound ${outOfBounds.length} out-of-bounds bookings:`);
  console.log(JSON.stringify(outOfBounds, null, 2));
}

main().catch(console.error).finally(() => prisma.$disconnect());
