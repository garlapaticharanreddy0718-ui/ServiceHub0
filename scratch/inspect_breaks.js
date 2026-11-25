const path = require('path');
const { PrismaClient } = require(path.join(__dirname, '../server/node_modules/@prisma/client'));
const prisma = new PrismaClient();

async function main() {
  console.log('=== STAFF BREAKS IN DATABASE ===');
  const breaks = await prisma.staffBreak.findMany({
    include: {
      staff: {
        include: {
          businessMember: {
            include: {
              user: true,
              business: true
            }
          }
        }
      }
    },
    orderBy: [{ staffId: 'asc' }, { dayOfWeek: 'asc' }, { startTime: 'asc' }]
  });

  console.log(`Total StaffBreak records: ${breaks.length}\n`);

  const breaksByStaff = {};
  for (const b of breaks) {
    const staffName = b.staff.displayName;
    const email = b.staff.businessMember.user.email;
    const key = `${staffName} <${email}> (${b.staff.id})`;
    if (!breaksByStaff[key]) breaksByStaff[key] = [];
    breaksByStaff[key].push(b);
  }

  for (const [staffKey, breakList] of Object.entries(breaksByStaff)) {
    console.log(`\n📌 ${staffKey} — Total Breaks: ${breakList.length}`);
    for (const b of breakList) {
      console.log(`   ID: ${b.id} | Day: ${b.dayOfWeek} | Time: ${b.startTime} - ${b.endTime} | Label: "${b.label}" | Created: ${b.createdAt.toISOString()}`);
    }
  }
}

main().catch(console.error).finally(() => prisma.$disconnect());
