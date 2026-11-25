const path = require('path');
const { PrismaClient } = require(path.join(__dirname, '../server/node_modules/@prisma/client'));
const bcrypt = require(path.join(__dirname, '../server/node_modules/bcryptjs'));

const prisma = new PrismaClient();

async function main() {
  console.log('=== DEMO USERS IN DB ===');
  const demoEmails = [
    'demo.owner@servicehub.local',
    'demo.staff@servicehub.local',
    'demo.customer@servicehub.local'
  ];

  const users = await prisma.user.findMany({
    where: { email: { in: demoEmails } },
    include: {
      businessMembers: {
        include: {
          business: true
        }
      }
    }
  });

  const testPasswords = [
    'DemoOwner123!',
    'Owner@123!',
    'DemoStaff123!',
    'Staff@123!',
    'DemoCustomer123!',
    'Customer@123!',
    'ServiceHub123!'
  ];

  for (const user of users) {
    console.log(`\nID: ${user.id}`);
    console.log(`Email: ${user.email}`);
    console.log(`Name: ${user.name}`);
    console.log(`Phone: ${user.phone}`);
    console.log(`Memberships:`, user.businessMembers.map(m => `${m.business.name} (${m.role})`));

    const matchedPw = [];
    for (const pw of testPasswords) {
      if (user.passwordHash && (await bcrypt.compare(pw, user.passwordHash))) {
        matchedPw.push(pw);
      }
    }
    console.log(`Matching Passwords:`, matchedPw.length ? matchedPw.join(', ') : 'NONE MATCH');
  }

  console.log('\n=== GLOW & STYLE BEAUTY STUDIO DB DATA ===');
  const b = await prisma.business.findFirst({
    where: { name: { contains: 'Glow' } },
    include: {
      members: {
        include: {
          user: true
        }
      }
    }
  });

  if (b) {
    console.log(`Business: ${b.name} (ID: ${b.id})`);
    console.log(`Members:`, b.members.map(m => `${m.user.name} <${m.user.email}> (${m.role})`));
  } else {
    console.log('Glow business not found!');
  }
}

main().catch(console.error).finally(() => prisma.$disconnect());
