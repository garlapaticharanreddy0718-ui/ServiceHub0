const path = require('path');
const { PrismaClient } = require(path.join(__dirname, '../server/node_modules/@prisma/client'));
const prisma = new PrismaClient();

async function main() {
  console.log('🧹 Starting cleanup of duplicate staff and breaks...');

  // 1. Clean duplicate StaffBreak records
  const allBreaks = await prisma.staffBreak.findMany({
    orderBy: { createdAt: 'asc' },
  });

  const seenBreakKeys = new Set();
  const duplicateBreakIds = [];

  for (const b of allBreaks) {
    const key = `${b.staffId}_${b.dayOfWeek}_${b.startTime}_${b.endTime}`;
    if (seenBreakKeys.has(key)) {
      duplicateBreakIds.push(b.id);
    } else {
      seenBreakKeys.add(key);
    }
  }

  if (duplicateBreakIds.length > 0) {
    console.log(`Deleting ${duplicateBreakIds.length} duplicate StaffBreak records...`);
    await prisma.staffBreak.deleteMany({
      where: { id: { in: duplicateBreakIds } },
    });
    console.log('✓ Duplicate StaffBreaks deleted.');
  } else {
    console.log('✓ No exact duplicate StaffBreaks found.');
  }

  // 2. Clean up redundant test staff accounts created during automated test runs
  const testStaffEmails = [
    'kiran.test.1788802794380@servicehub.local',
    'kiran.test.1788802816727@servicehub.local',
    'test.staff.1788802261440@servicehub.local',
    'test.staff.1788802267506@servicehub.local',
    'test.staff.1788802287681@servicehub.local',
    'staff.test.1788803387378@servicehub.local',
    'shailu12@gmail.com',
  ];

  const redundantUsers = await prisma.user.findMany({
    where: { email: { in: testStaffEmails } },
    include: { businessMembers: true },
  });

  for (const u of redundantUsers) {
    console.log(`Cleaning up test user: ${u.name} <${u.email}>...`);
    await prisma.user.delete({
      where: { id: u.id },
    });
  }

  // Ensure one clean Kiran Kumar staff account exists (kiran.staff@servicehub.local)
  const canonicalKiran = await prisma.user.findFirst({
    where: { email: { contains: 'kiran' } },
  });

  if (canonicalKiran && canonicalKiran.email !== 'kiran.staff@servicehub.local') {
    console.log(`Normalizing canonical Kiran Kumar email from ${canonicalKiran.email} to kiran.staff@servicehub.local...`);
    await prisma.user.update({
      where: { id: canonicalKiran.id },
      data: { email: 'kiran.staff@servicehub.local' },
    });
  }

  console.log('🎉 Cleanup complete!');
}

main().catch(console.error).finally(() => prisma.$disconnect());
