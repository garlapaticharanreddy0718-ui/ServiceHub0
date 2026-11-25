const path = require('path');
const { PrismaClient } = require(path.join(__dirname, '../server/node_modules/@prisma/client'));
const prisma = new PrismaClient();

async function inspectBooking() {
  console.log('================================================================');
  console.log('       INVESTIGATING QUICKFIX PRO SERVICES BOOKING              ');
  console.log('================================================================\n');

  // 1. Businesses matching "QuickFix"
  const businesses = await prisma.business.findMany({
    where: { name: { contains: 'QuickFix', mode: 'insensitive' } },
    include: {
      members: {
        include: { user: { select: { id: true, name: true, email: true } } }
      },
      services: true
    }
  });

  console.log(`--- 1. BUSINESSES MATCHING "QuickFix" (${businesses.length} found) ---`);
  businesses.forEach(b => {
    console.log(`Business ID: ${b.id}`);
    console.log(`Name: "${b.name}"`);
    console.log(`Category: "${b.category}"`);
    console.log(`Members: ${b.members.map(m => `${m.user.name} (${m.user.email}) [Role: ${m.role}]`).join(', ')}`);
    console.log(`Services: ${b.services.map(s => `"${s.name}" (ID: ${s.id})`).join(', ')}\n`);
  });

  // 2. All Businesses in DB (just in case)
  const allBiz = await prisma.business.findMany({ select: { id: true, name: true } });
  console.log(`--- ALL BUSINESSES IN DB (${allBiz.length}) ---`);
  allBiz.forEach(b => console.log(`  - ${b.id}: "${b.name}"`));

  // 3. Customers matching "Rahul"
  const customers = await prisma.customer.findMany({
    where: { name: { contains: 'Rahul', mode: 'insensitive' } },
    include: { business: { select: { id: true, name: true } } }
  });
  console.log(`\n--- 3. CUSTOMERS MATCHING "Rahul" (${customers.length} found) ---`);
  customers.forEach(c => {
    console.log(`Customer ID: ${c.id}`);
    console.log(`Name: "${c.name}"`);
    console.log(`Email: "${c.email}"`);
    console.log(`Business: ${c.business ? `"${c.business.name}" (${c.business.id})` : 'None/Global'}\n`);
  });

  // 4. Staff matching "Kiran"
  const staffList = await prisma.staff.findMany({
    where: { displayName: { contains: 'Kiran', mode: 'insensitive' } },
    include: {
      businessMember: {
        include: {
          user: { select: { id: true, name: true, email: true } },
          business: { select: { id: true, name: true } }
        }
      }
    }
  });
  console.log(`--- 4. STAFF MATCHING "Kiran" (${staffList.length} found) ---`);
  staffList.forEach(s => {
    console.log(`Staff ID: ${s.id}`);
    console.log(`Display Name: "${s.displayName}"`);
    console.log(`User: ${s.businessMember?.user?.name} (${s.businessMember?.user?.email})`);
    console.log(`Business: "${s.businessMember?.business?.name}" (${s.businessMember?.business?.id})\n`);
  });

  // 5. Services matching "AC Repair"
  const services = await prisma.service.findMany({
    where: { name: { contains: 'AC', mode: 'insensitive' } },
    include: { business: { select: { id: true, name: true } } }
  });
  console.log(`--- 5. SERVICES MATCHING "AC" (${services.length} found) ---`);
  services.forEach(s => {
    console.log(`Service ID: ${s.id}`);
    console.log(`Name: "${s.name}"`);
    console.log(`Business: "${s.business?.name}" (${s.business?.id})\n`);
  });

  // 6. Bookings on Sep 9, 2026 or for QuickFix / Rahul / Kiran / AC Repair
  const allBookings = await prisma.booking.findMany({
    include: {
      customer: true,
      business: true,
      service: true,
      staff: true
    },
    orderBy: { createdAt: 'desc' }
  });

  console.log(`--- 6. ALL BOOKINGS IN DATABASE (${allBookings.length} total) ---`);
  allBookings.forEach((bk, i) => {
    console.log(`[Booking ${i + 1}] ID: ${bk.id}`);
    console.log(`             Business: "${bk.business?.name}" (ID: ${bk.businessId})`);
    console.log(`             Customer: "${bk.customer?.name}" (Email: ${bk.customer?.email}, ID: ${bk.customerId})`);
    console.log(`             Service: "${bk.service?.name}" (ID: ${bk.serviceId})`);
    console.log(`             Staff: "${bk.staff?.displayName}" (ID: ${bk.staffId})`);
    console.log(`             StartTime ISO: ${bk.startTime.toISOString()}`);
    console.log(`             Status: ${bk.status}`);
    console.log(`             Amount: ₹${bk.totalAmount}\n`);
  });

  await prisma.$disconnect();
}

inspectBooking().catch(err => {
  console.error('Error running inspection script:', err);
  process.exit(1);
});
