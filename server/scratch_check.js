const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  const now = new Date();
  const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 0, 0, 0, 0);
  const todayEnd = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59, 999);

  const bookings = await prisma.booking.findMany({
    where: { startTime: { gte: todayStart, lte: todayEnd } },
    include: { service: true, customer: true, staff: true }
  });

  console.log('Database Bookings Count today:', bookings.length);
  bookings.forEach((b, i) => {
    console.log(`${i+1}. ID: ${b.id}`);
    console.log(`   Service: ${b.service?.name}`);
    console.log(`   Customer: ${b.customer?.name}`);
    console.log(`   Staff: ${b.staff?.displayName}`);
    console.log(`   Time: ${b.startTime.toLocaleTimeString()} - ${b.endTime.toLocaleTimeString()}`);
    console.log(`   Status: ${b.status}\n`);
  });
}

main().then(() => prisma.$disconnect()).catch(err => console.error(err));
