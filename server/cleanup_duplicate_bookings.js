const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function cleanupDuplicates() {
  console.log('--- Cleaning Up Accidental Duplicate Demo Bookings ---');

  const now = new Date();
  const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 0, 0, 0, 0);
  const todayEnd = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59, 999);

  const todaysBookings = await prisma.booking.findMany({
    where: { startTime: { gte: todayStart, lte: todayEnd } },
    orderBy: { createdAt: 'asc' }
  });

  console.log(`Found ${todaysBookings.length} total bookings today.`);

  const seenKeys = new Set();
  const duplicateIdsToDelete = [];

  for (const b of todaysBookings) {
    const key = `${b.customerId}_${b.serviceId}_${b.staffId}_${new Date(b.startTime).getTime()}_${b.status}`;
    if (seenKeys.has(key)) {
      duplicateIdsToDelete.push(b.id);
    } else {
      seenKeys.add(key);
    }
  }

  console.log(`Identified ${duplicateIdsToDelete.length} duplicate booking records to delete:`, duplicateIdsToDelete);

  if (duplicateIdsToDelete.length > 0) {
    // Delete status history first
    await prisma.bookingStatusHistory.deleteMany({
      where: { bookingId: { in: duplicateIdsToDelete } }
    });

    // Delete reviews if any
    await prisma.review.deleteMany({
      where: { bookingId: { in: duplicateIdsToDelete } }
    });

    // Delete duplicate bookings
    const result = await prisma.booking.deleteMany({
      where: { id: { in: duplicateIdsToDelete } }
    });

    console.log(`✓ Deleted ${result.count} duplicate booking records from database.`);
  } else {
    console.log('✓ No duplicate booking records found.');
  }

  const remaining = await prisma.booking.findMany({
    where: { startTime: { gte: todayStart, lte: todayEnd } },
  });
  console.log(`Remaining bookings today: ${remaining.length}`);
}

cleanupDuplicates()
  .then(() => prisma.$disconnect())
  .catch((err) => {
    console.error(err);
    prisma.$disconnect();
  });
