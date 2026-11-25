const path = require('path');
const { PrismaClient } = require(path.join(__dirname, '../server/node_modules/@prisma/client'));
const prisma = new PrismaClient();

async function main() {
  console.log('=== ALL STAFF PROFILES IN DATABASE ===');
  const staffList = await prisma.staff.findMany({
    include: {
      businessMember: {
        include: {
          user: true,
          business: true,
        },
      },
      schedules: true,
      breaks: true,
      staffServices: {
        include: { service: true },
      },
    },
    orderBy: { createdAt: 'asc' },
  });

  for (const s of staffList) {
    console.log(`\nID: ${s.id}`);
    console.log(`Display Name: "${s.displayName}"`);
    console.log(`Business: "${s.businessMember.business.name}"`);
    console.log(`User: ${s.businessMember.user.name} <${s.businessMember.user.email}>`);
    console.log(`Active: ${s.isActive}`);
    console.log(`Services: ${s.staffServices.map(ss => ss.service.name).join(', ') || 'None'}`);
    console.log(`Schedules Count: ${s.schedules.length}`);
    console.log(`Breaks Count: ${s.breaks.length}`);
    if (s.breaks.length > 0) {
      console.log(`Breaks:`, s.breaks.map(b => `[Day ${b.dayOfWeek}: ${b.startTime}-${b.endTime} "${b.label}"]`).join(', '));
    }
  }
}

main().catch(console.error).finally(() => prisma.$disconnect());
