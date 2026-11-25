const path = require('path');
const { PrismaClient } = require(path.join(__dirname, '../server/node_modules/@prisma/client'));
const prisma = new PrismaClient();

async function check() {
  console.log('=== 1. BUSINESSES MATCHING QuickFix ===');
  const biz = await prisma.business.findMany({
    where: { name: { contains: 'QuickFix', mode: 'insensitive' } },
    include: { members: { include: { user: true } } }
  });
  console.log(JSON.stringify(biz, null, 2));

  console.log('\n=== 2. CUSTOMERS MATCHING Rahul ===');
  const cust = await prisma.customer.findMany({
    where: { name: { contains: 'Rahul', mode: 'insensitive' } },
    include: { business: true, user: true }
  });
  console.log(JSON.stringify(cust, null, 2));

  console.log('\n=== 3. STAFF MATCHING Kiran ===');
  const staff = await prisma.staff.findMany({
    where: { displayName: { contains: 'Kiran', mode: 'insensitive' } },
    include: { businessMember: { include: { business: true, user: true } } }
  });
  console.log(JSON.stringify(staff, null, 2));

  console.log('\n=== 4. SERVICES MATCHING AC ===');
  const svc = await prisma.service.findMany({
    where: { name: { contains: 'AC', mode: 'insensitive' } },
    include: { business: true }
  });
  console.log(JSON.stringify(svc, null, 2));

  console.log('\n=== 5. BOOKINGS MATCHING QuickFix OR Rahul OR AC OR Kiran ===');
  const bks = await prisma.booking.findMany({
    where: {
      OR: [
        { customer: { name: { contains: 'Rahul', mode: 'insensitive' } } },
        { service: { name: { contains: 'AC', mode: 'insensitive' } } },
        { business: { name: { contains: 'QuickFix', mode: 'insensitive' } } },
        { staff: { displayName: { contains: 'Kiran', mode: 'insensitive' } } }
      ]
    },
    include: { customer: true, business: true, service: true, staff: true }
  });
  console.log(JSON.stringify(bks, null, 2));

  console.log('\n=== 6. ALL BOOKINGS ON 2026-09-09 ===');
  const sep9Bookings = await prisma.booking.findMany({
    where: {
      startTime: {
        gte: new Date('2026-09-09T00:00:00.000Z'),
        lt: new Date('2026-09-10T00:00:00.000Z')
      }
    },
    include: { customer: true, business: true, service: true, staff: true }
  });
  console.log(JSON.stringify(sep9Bookings, null, 2));

  await prisma.$disconnect();
}

check().catch(console.error);
