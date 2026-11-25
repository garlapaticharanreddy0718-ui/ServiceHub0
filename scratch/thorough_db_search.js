const path = require('path');
const { PrismaClient } = require(path.join(__dirname, '../server/node_modules/@prisma/client'));
const prisma = new PrismaClient();

async function thoroughSearch() {
  console.log('=== SEARCHING ALL TABLES IN POSTGRESQL DB ===\n');

  const users = await prisma.user.findMany();
  console.log(`Users count: ${users.length}`);
  users.forEach(u => console.log(`  User: ${u.id} | ${u.name} | ${u.email}`));

  const businesses = await prisma.business.findMany();
  console.log(`\nBusinesses count: ${businesses.length}`);
  businesses.forEach(b => console.log(`  Business: ${b.id} | ${b.name} | Category: ${b.category}`));

  const members = await prisma.businessMember.findMany({ include: { user: true, business: true } });
  console.log(`\nBusinessMembers count: ${members.length}`);
  members.forEach(m => console.log(`  Member: ${m.id} | User: ${m.user.name} (${m.user.email}) | Business: ${m.business.name} | Role: ${m.role}`));

  const staff = await prisma.staff.findMany({ include: { businessMember: { include: { user: true, business: true } } } });
  console.log(`\nStaff count: ${staff.length}`);
  staff.forEach(s => console.log(`  Staff: ${s.id} | Name: ${s.displayName} | User: ${s.businessMember?.user?.email} | Business: ${s.businessMember?.business?.name}`));

  const customers = await prisma.customer.findMany({ include: { business: true } });
  console.log(`\nCustomers count: ${customers.length}`);
  customers.forEach(c => console.log(`  Customer: ${c.id} | Name: ${c.name} | Email: ${c.email} | Business: ${c.business ? c.business.name : 'None'}`));

  const services = await prisma.service.findMany({ include: { business: true } });
  console.log(`\nServices count: ${services.length}`);
  services.forEach(s => console.log(`  Service: ${s.id} | Name: "${s.name}" | Price: ${s.price} | Business: "${s.business.name}"`));

  const bookings = await prisma.booking.findMany({
    include: {
      customer: true,
      business: true,
      service: true,
      staff: true
    }
  });
  console.log(`\nBookings count: ${bookings.length}`);
  bookings.forEach(b => {
    console.log(`  Booking: ${b.id} | Business: "${b.business.name}" | Customer: "${b.customer.name}" | Service: "${b.service.name}" | Staff: "${b.staff ? b.staff.displayName : 'None'}" | StartTime: ${b.startTime.toISOString()} | Status: ${b.status}`);
  });

  await prisma.$disconnect();
}

thoroughSearch().catch(console.error);
