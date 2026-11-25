const path = require('path');
const { PrismaClient } = require(path.join(__dirname, '../server/node_modules/@prisma/client'));
const bcrypt = require(path.join(__dirname, '../server/node_modules/bcryptjs'));

const prisma = new PrismaClient();

async function main() {
  console.log('🔄 Repairing Demo Accounts in Database...');

  // 1. Demo Owner
  const ownerPasswordHash = await bcrypt.hash('DemoOwner123!', 12);
  const owner = await prisma.user.update({
    where: { email: 'demo.owner@servicehub.local' },
    data: {
      name: 'Vikram Malhotra',
      passwordHash: ownerPasswordHash,
    },
  });
  console.log(`✓ Repaired Demo Owner: ${owner.name} <${owner.email}>`);

  // 2. Demo Staff
  const staffPasswordHash = await bcrypt.hash('DemoStaff123!', 12);
  const staff = await prisma.user.update({
    where: { email: 'demo.staff@servicehub.local' },
    data: {
      passwordHash: staffPasswordHash,
    },
  });
  console.log(`✓ Repaired Demo Staff: ${staff.name} <${staff.email}>`);

  // 3. Demo Customer
  const customerPasswordHash = await bcrypt.hash('DemoCustomer123!', 12);
  const customer = await prisma.user.update({
    where: { email: 'demo.customer@servicehub.local' },
    data: {
      passwordHash: customerPasswordHash,
    },
  });
  console.log(`✓ Repaired Demo Customer: ${customer.name} <${customer.email}>`);

  console.log('🎉 Repair Complete!');
}

main().catch(console.error).finally(() => prisma.$disconnect());
