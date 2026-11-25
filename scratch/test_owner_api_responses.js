const path = require('path');
const { PrismaClient } = require(path.join(__dirname, '../server/node_modules/@prisma/client'));
const prisma = new PrismaClient();
const { getBookings } = require(path.join(__dirname, '../server/src/services/bookingService'));

async function testOwnerApis() {
  console.log('================================================================');
  console.log('   TESTING API RESPONSES FOR OWNER APPOINTMENTS & CALENDAR      ');
  console.log('================================================================\n');

  const businessId = 'd1156d7e-6bb5-4bc2-a96f-11164771cfda'; // QuickFix Pro Services
  const ownerUserId = '4e40eccd-18ba-45ac-bcd5-8edf435e1aac'; // Owner garlapaticharanreddy14@gmail.com
  const userRole = 'OWNER';

  // 1. All Bookings for QuickFix Pro Services (No Filters)
  console.log('--- 1. GET /businesses/:id/bookings (NO QUERY FILTERS) ---');
  const resNoFilter = await getBookings(businessId, userRole, ownerUserId, {});
  console.log(`Count: ${resNoFilter.data.length}`);
  resNoFilter.data.forEach(b => {
    console.log(`  - Booking ID: ${b.id} | Service: "${b.service.name}" | StartTime ISO: ${b.startTime.toISOString()} | Status: ${b.status}`);
  });

  // 2. Owner Appointments Querying for Date 2026-09-09
  console.log('\n--- 2. GET /businesses/:id/bookings?date=2026-09-09 (Date: 09 September 2026) ---');
  const resSep9 = await getBookings(businessId, userRole, ownerUserId, { date: '2026-09-09' });
  console.log(`Count for Sep 9: ${resSep9.data.length}`);
  resSep9.data.forEach(b => {
    console.log(`  - Booking ID: ${b.id} | Service: "${b.service.name}" | StartTime ISO: ${b.startTime.toISOString()}`);
  });

  // 3. Owner Appointments Querying for Date 2026-09-10
  console.log('\n--- 3. GET /businesses/:id/bookings?date=2026-09-10 (Date: 10 September 2026) ---');
  const resSep10 = await getBookings(businessId, userRole, ownerUserId, { date: '2026-09-10' });
  console.log(`Count for Sep 10: ${resSep10.data.length}`);
  resSep10.data.forEach(b => {
    console.log(`  - Booking ID: ${b.id} | Service: "${b.service.name}" | StartTime ISO: ${b.startTime.toISOString()}`);
  });

  // 4. Owner Calendar Querying Range for Sep 9 (startDate=2026-09-09, endDate=2026-09-09)
  console.log('\n--- 4. GET /businesses/:id/bookings?startDate=2026-09-09&endDate=2026-09-09 ---');
  const resCalSep9 = await getBookings(businessId, userRole, ownerUserId, { startDate: '2026-09-09', endDate: '2026-09-09' });
  console.log(`Count for Calendar Sep 9: ${resCalSep9.data.length}`);

  // 5. Owner Calendar Querying Range for Sep 10 (startDate=2026-09-10, endDate=2026-09-10)
  console.log('\n--- 5. GET /businesses/:id/bookings?startDate=2026-09-10&endDate=2026-09-10 ---');
  const resCalSep10 = await getBookings(businessId, userRole, ownerUserId, { startDate: '2026-09-10', endDate: '2026-09-10' });
  console.log(`Count for Calendar Sep 10: ${resCalSep10.data.length}`);

  await prisma.$disconnect();
}

testOwnerApis().catch(console.error);
