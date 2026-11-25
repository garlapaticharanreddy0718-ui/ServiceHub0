const path = require('path');
const { PrismaClient } = require(path.join(__dirname, '../server/node_modules/@prisma/client'));
const prisma = new PrismaClient();

async function inspectExact() {
  const bk = await prisma.booking.findUnique({
    where: { id: '8942e3ae-21b3-4ba8-910a-6b8d50fc1808' },
    include: {
      customer: { include: { user: true } },
      business: { include: { members: { include: { user: true } } } },
      service: true,
      staff: { include: { businessMember: { include: { user: true } } } }
    }
  });
  console.log('=== EXACT BOOKING DETAILS ===');
  console.log(JSON.stringify(bk, null, 2));

  await prisma.$disconnect();
}
inspectExact().catch(console.error);
