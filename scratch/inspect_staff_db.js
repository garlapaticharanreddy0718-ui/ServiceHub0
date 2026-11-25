const path = require('path');
const { PrismaClient } = require(path.join(__dirname, '../server/node_modules/@prisma/client'));
const prisma = new PrismaClient();

async function main() {
  console.log('=== USERS & BUSINESS MEMBERS ===');
  const users = await prisma.user.findMany({
    include: {
      businessMembers: {
        include: {
          staffProfile: {
            include: {
              staffServices: { include: { service: true } },
              schedules: true,
              breaks: true,
              timeOffs: true,
            }
          }
        }
      }
    }
  });

  for (const u of users) {
    console.log(`User: ${u.name} (${u.email}) [ID: ${u.id}]`);
    for (const bm of u.businessMembers) {
      console.log(`  - BusinessMember ID: ${bm.id}, Role: ${bm.role}, BusinessId: ${bm.businessId}`);
      if (bm.staffProfile) {
        console.log(`    - Staff Profile ID: ${bm.staffProfile.id}, DisplayName: ${bm.staffProfile.displayName}`);
        console.log(`      Services: ${bm.staffProfile.staffServices.map(ss => ss.service.name).join(', ')}`);
        console.log(`      Schedules count: ${bm.staffProfile.schedules.length}`);
        console.log(`      Breaks count: ${bm.staffProfile.breaks.length}`);
        console.log(`      TimeOffs count: ${bm.staffProfile.timeOffs.length}`);
      }
    }
  }

  console.log('\n=== BOOKINGS SUMMARY ===');
  const bookings = await prisma.booking.findMany({
    include: {
      customer: true,
      service: true,
      staff: true
    }
  });
  console.log(`Total Bookings in DB: ${bookings.length}`);
  for (const b of bookings) {
    console.log(`Booking ${b.id}: Staff=${b.staff?.displayName || 'Unassigned'} (${b.staffId}), Customer=${b.customer?.name}, Service=${b.service?.name}, Date=${b.startTime.toISOString()}, Status=${b.status}`);
  }
}

main().catch(console.error).finally(() => prisma.$disconnect());
