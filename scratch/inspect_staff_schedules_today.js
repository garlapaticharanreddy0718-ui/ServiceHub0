const path = require('path');
const { PrismaClient } = require(path.join(__dirname, '../server/node_modules/@prisma/client'));
const prisma = new PrismaClient();

async function main() {
  const now = new Date();
  const todayDayOfWeek = now.getDay();
  console.log(`Today: ${now.toLocaleDateString('en-US', { weekday: 'long' })} (dayOfWeek: ${todayDayOfWeek})\n`);

  const biz = await prisma.business.findFirst({ where: { name: 'Glow & Style Beauty Studio' } });
  const staffList = await prisma.staff.findMany({
    where: { businessMember: { businessId: biz.id }, isActive: true },
    include: {
      businessMember: { include: { user: true } },
      schedules: true,
      breaks: true,
      timeOffs: true,
      staffServices: { include: { service: true } }
    }
  });

  const slotStart = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 13, 0, 0);
  const slotEnd = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 14, 0, 0);

  for (const st of staffList) {
    console.log(`👤 ${st.displayName} <${st.businessMember.user.email}>`);
    console.log(`   Assigned Services: ${st.staffServices.map(ss => ss.service.name).join(', ') || 'NONE'}`);
    
    const sch = st.schedules.find(s => s.dayOfWeek === todayDayOfWeek);
    console.log(`   Schedule for Today (Day ${todayDayOfWeek}):`, sch ? `[${sch.startTime}-${sch.endTime}, isAvailable: ${sch.isAvailable}]` : 'NO SCHEDULE FOR TODAY');

    const breaksToday = st.breaks.filter(b => b.dayOfWeek === todayDayOfWeek);
    console.log(`   Breaks for Today:`, breaksToday.map(b => `[${b.startTime}-${b.endTime}]`).join(', ') || 'NONE');

    // Check onBreak logic
    const onBreak = breaksToday.some((brk) => {
      const [sh, sm] = brk.startTime.split(':').map(Number);
      const [eh, em] = brk.endTime.split(':').map(Number);
      const bStart = new Date(now.getFullYear(), now.getMonth(), now.getDate(), sh, sm || 0, 0, 0);
      const bEnd = new Date(now.getFullYear(), now.getMonth(), now.getDate(), eh, em || 0, 0, 0);
      return slotStart < bEnd && slotEnd > bStart;
    });
    console.log(`   On Break at 13:00-14:00? ${onBreak}`);
  }
}

main().catch(console.error).finally(() => prisma.$disconnect());
