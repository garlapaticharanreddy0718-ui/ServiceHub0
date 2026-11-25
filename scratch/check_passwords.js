const path = require('path');
const { PrismaClient } = require(path.join(__dirname, '../server/node_modules/@prisma/client'));
const prisma = new PrismaClient();
const bcrypt = require(path.join(__dirname, '../server/node_modules/bcryptjs'));

async function main() {
  const owner = await prisma.user.findFirst({ where: { email: 'demo.owner@servicehub.local' } });
  if (owner) {
    const hash = await bcrypt.hash('Owner@123!', 10);
    await prisma.user.update({
      where: { id: owner.id },
      data: { passwordHash: hash }
    });
    console.log('Reset demo.owner@servicehub.local password to Owner@123!');
  }
}

main().catch(console.error).finally(() => prisma.$disconnect());
