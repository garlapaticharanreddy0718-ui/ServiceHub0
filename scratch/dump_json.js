const path = require('path');
const { PrismaClient } = require(path.join(__dirname, '../server/node_modules/@prisma/client'));
const prisma = new PrismaClient();

async function main() {
  const users = await prisma.user.findMany({ select: { id: true, name: true, email: true, mustChangePassword: true, createdAt: true } });
  console.log('=== 1. USERS ===\n' + JSON.stringify(users, null, 2));

  const bizs = await prisma.business.findMany({ select: { id: true, name: true, category: true, members: { select: { role: true, user: { select: { email: true, name: true } } } } } });
  console.log('=== 2. BUSINESSES ===\n' + JSON.stringify(bizs, null, 2));

  const members = await prisma.businessMember.findMany({ select: { id: true, role: true, user: { select: { name: true, email: true } }, business: { select: { name: true } } } });
  console.log('=== 3. BUSINESS MEMBERS ===\n' + JSON.stringify(members, null, 2));

  const staff = await prisma.staff.findMany({ select: { id: true, displayName: true, isActive: true, businessMember: { select: { user: { select: { email: true } }, business: { select: { name: true } } } } } });
  console.log('=== 4. STAFF ===\n' + JSON.stringify(staff, null, 2));

  const custs = await prisma.customer.findMany({ select: { id: true, name: true, email: true, business: { select: { name: true } } } });
  console.log('=== 5. CUSTOMERS ===\n' + JSON.stringify(custs, null, 2));

  await prisma.$disconnect();
}
main();
