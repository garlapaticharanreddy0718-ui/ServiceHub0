const path = require('path');
const { PrismaClient } = require(path.join(__dirname, '../server/node_modules/@prisma/client'));
const prisma = new PrismaClient();

async function checkDataIntegrity() {
  console.log('================================================================');
  console.log('       READ-ONLY DATABASE DATA INTEGRITY CHECK REPORT          ');
  console.log('================================================================\n');

  // 1. All Users
  const users = await prisma.user.findMany({
    orderBy: { createdAt: 'asc' }
  });
  console.log(`--- 1. USERS (Total: ${users.length}) ---`);
  users.forEach((u, i) => {
    console.log(`[User ${i + 1}] ID: ${u.id}`);
    console.log(`          Name: ${u.name}`);
    console.log(`          Email: ${u.email}`);
    console.log(`          mustChangePassword: ${u.mustChangePassword}`);
    console.log(`          createdAt: ${u.createdAt.toISOString()}`);
  });

  // 2. All Businesses
  const businesses = await prisma.business.findMany({
    include: {
      members: {
        include: {
          user: { select: { id: true, name: true, email: true } }
        }
      }
    },
    orderBy: { createdAt: 'asc' }
  });
  console.log(`\n--- 2. BUSINESSES (Total: ${businesses.length}) ---`);
  businesses.forEach((b, i) => {
    console.log(`[Business ${i + 1}] ID: ${b.id}`);
    console.log(`              Name: ${b.name}`);
    console.log(`              Category: ${b.category}`);
    console.log(`              Members: ${b.members.map(m => `${m.user.name} (${m.user.email}) - ${m.role}`).join('; ')}`);
  });

  // 3. All BusinessMembers
  const members = await prisma.businessMember.findMany({
    include: {
      user: { select: { id: true, name: true, email: true } },
      business: { select: { id: true, name: true } }
    },
    orderBy: { createdAt: 'asc' }
  });
  console.log(`\n--- 3. BUSINESS MEMBERS (Total: ${members.length}) ---`);
  members.forEach((m, i) => {
    console.log(`[Member ${i + 1}] ID: ${m.id}`);
    console.log(`            User: ${m.user.name} (${m.user.email}) [ID: ${m.user.id}]`);
    console.log(`            Business: ${m.business.name} [ID: ${m.business.id}]`);
    console.log(`            Role: ${m.role}`);
  });

  // 4. All Staff
  const staffList = await prisma.staff.findMany({
    include: {
      businessMember: {
        include: {
          user: { select: { id: true, name: true, email: true } },
          business: { select: { id: true, name: true } }
        }
      }
    },
    orderBy: { createdAt: 'asc' }
  });
  console.log(`\n--- 4. STAFF PROFILES (Total: ${staffList.length}) ---`);
  staffList.forEach((s, i) => {
    console.log(`[Staff ${i + 1}] ID: ${s.id}`);
    console.log(`          Display Name: ${s.displayName}`);
    console.log(`          User: ${s.businessMember?.user?.name} (${s.businessMember?.user?.email})`);
    console.log(`          Business: ${s.businessMember?.business?.name}`);
    console.log(`          Active Status: ${s.isActive}`);
  });

  // 5. All Customers
  const customers = await prisma.customer.findMany({
    include: {
      business: { select: { id: true, name: true } },
      user: { select: { id: true, name: true, email: true } }
    },
    orderBy: { createdAt: 'asc' }
  });
  console.log(`\n--- 5. CUSTOMERS (Total: ${customers.length}) ---`);
  customers.forEach((c, i) => {
    console.log(`[Customer ${i + 1}] ID: ${c.id}`);
    console.log(`              Name: ${c.name}`);
    console.log(`              Email: ${c.email}`);
    console.log(`              Linked User: ${c.user ? `${c.user.name} (${c.user.email})` : 'None'}`);
    console.log(`              Business: ${c.business ? c.business.name : 'Global/None'}`);
  });

  // 6. All Bookings
  const bookings = await prisma.booking.findMany({
    include: {
      customer: { select: { name: true, email: true } },
      business: { select: { name: true } },
      service: { select: { name: true, price: true } },
      staff: { select: { displayName: true } }
    },
    orderBy: { startTime: 'asc' }
  });
  console.log(`\n--- 6. BOOKINGS (Total: ${bookings.length}) ---`);
  bookings.forEach((bk, i) => {
    console.log(`[Booking ${i + 1}] ID: ${bk.id}`);
    console.log(`             Customer: ${bk.customer ? bk.customer.name : 'Unknown'}`);
    console.log(`             Business: ${bk.business ? bk.business.name : 'Unknown'}`);
    console.log(`             Service: ${bk.service ? bk.service.name : 'Unknown'}`);
    console.log(`             Staff: ${bk.staff ? bk.staff.displayName : 'Unknown'}`);
    console.log(`             Start Time: ${bk.startTime.toISOString()} (${bk.startTime.toLocaleString()})`);
    console.log(`             Status: ${bk.status}`);
    console.log(`             Total Amount: ₹${bk.totalAmount}`);
  });

  // Specific Question Answers
  console.log('\n================================================================');
  console.log('       ANSWERS TO SPECIFIC QUESTIONNAIRE                       ');
  console.log('================================================================');

  const charanBiz = businesses.find(b => b.name.toLowerCase().includes('charan'));
  console.log(`A. Charan Wellness Studio exists? ${!!charanBiz} ${charanBiz ? `(Name: "${charanBiz.name}", ID: ${charanBiz.id})` : ''}`);

  const glowBiz = businesses.find(b => b.name.toLowerCase().includes('glow'));
  console.log(`B. Glow & Style Beauty Studio exists? ${!!glowBiz} ${glowBiz ? `(Name: "${glowBiz.name}", ID: ${glowBiz.id})` : ''}`);

  const charanOwner = users.find(u => u.email.toLowerCase().includes('charan') || u.name.toLowerCase().includes('charan'));
  console.log(`C. Original Charan Owner account exists? ${!!charanOwner} ${charanOwner ? `(Name: "${charanOwner.name}", Email: "${charanOwner.email}")` : ''}`);

  const demoOwner = users.find(u => u.email.toLowerCase().includes('demo.owner'));
  console.log(`D. Demo Owner exists? ${!!demoOwner} ${demoOwner ? `(Name: "${demoOwner.name}", Email: "${demoOwner.email}")` : ''}`);

  if (demoOwner) {
    const demoOwnerMemberships = members.filter(m => m.user.id === demoOwner.id);
    console.log(`E. Demo Owner is connected to: ${demoOwnerMemberships.map(m => `"${m.business.name}" (${m.role})`).join(', ') || 'No business'}`);
  } else {
    console.log(`E. Demo Owner connected business: N/A (Demo Owner user not found)`);
  }

  const mukeshStaff = staffList.filter(s => s.displayName.toLowerCase().includes('mukesh') || s.businessMember?.user?.name.toLowerCase().includes('mukesh') || s.businessMember?.user?.email.toLowerCase().includes('mukesh'));
  console.log(`F. Mukesh exists as STAFF? ${mukeshStaff.length > 0} (${mukeshStaff.length} record(s) found)`);
  mukeshStaff.forEach(m => console.log(`   - Staff ID: ${m.id}, DisplayName: ${m.displayName}, Email: ${m.businessMember?.user?.email}, Business: ${m.businessMember?.business?.name}, Active: ${m.isActive}`));

  const viratCustomer = customers.find(c => c.name.toLowerCase().includes('virat') || (c.email && c.email.toLowerCase().includes('virat')));
  console.log(`G. Virat Kohli exists as a customer? ${!!viratCustomer} ${viratCustomer ? `(Name: "${viratCustomer.name}", Email: "${viratCustomer.email}")` : ''}`);

  const sep9Booking = bookings.find(bk => {
    const d = new Date(bk.startTime);
    return d.getFullYear() === 2026 && d.getMonth() === 8 && d.getDate() === 9 && bk.service?.name.toLowerCase().includes('wellness');
  }) || bookings.find(bk => bk.service?.name.toLowerCase().includes('wellness') || (bk.customer && bk.customer.name.toLowerCase().includes('virat')));
  
  console.log(`H. Sep 9, 2026 9:00 AM Wellness Consultation booking exists? ${!!sep9Booking}`);
  if (sep9Booking) {
    console.log(`   - Booking ID: ${sep9Booking.id}`);
    console.log(`   - Customer: ${sep9Booking.customer?.name}`);
    console.log(`   - Business: ${sep9Booking.business?.name}`);
    console.log(`   - Service: ${sep9Booking.service?.name}`);
    console.log(`   - Staff: ${sep9Booking.staff?.displayName}`);
    console.log(`   - StartTime ISO: ${sep9Booking.startTime.toISOString()}`);
    console.log(`   - Status: ${sep9Booking.status}`);
    console.log(`I. Is that booking still CONFIRMED? ${sep9Booking.status === 'CONFIRMED'}`);
  } else {
    console.log(`I. Booking CONFIRMED check: N/A (Booking not found)`);
  }

  // Duplicate checks
  console.log('\n--- J. DUPLICATE RECORDS CHECK ---');
  const userEmails = users.map(u => u.email.toLowerCase());
  const dupEmails = userEmails.filter((item, index) => userEmails.indexOf(item) !== index);
  console.log(`Duplicate User emails: ${dupEmails.length > 0 ? dupEmails.join(', ') : 'None'}`);

  const memberKeys = members.map(m => `${m.user.id}_${m.business.id}`);
  const dupMembers = memberKeys.filter((item, index) => memberKeys.indexOf(item) !== index);
  console.log(`Duplicate BusinessMember (userId_businessId) pairs: ${dupMembers.length > 0 ? dupMembers.join(', ') : 'None'}`);

  const staffMemberIds = staffList.map(s => s.businessMemberId);
  const dupStaff = staffMemberIds.filter((item, index) => staffMemberIds.indexOf(item) !== index);
  console.log(`Duplicate Staff profiles (businessMemberId): ${dupStaff.length > 0 ? dupStaff.join(', ') : 'None'}`);

  const customerEmails = customers.map(c => c.email ? c.email.toLowerCase() : null).filter(Boolean);
  const dupCustEmails = customerEmails.filter((item, index) => customerEmails.indexOf(item) !== index);
  console.log(`Duplicate Customer emails: ${dupCustEmails.length > 0 ? dupCustEmails.join(', ') : 'None'}`);

  const businessNames = businesses.map(b => b.name.toLowerCase());
  const dupBizNames = businessNames.filter((item, index) => businessNames.indexOf(item) !== index);
  console.log(`Duplicate Business names: ${dupBizNames.length > 0 ? dupBizNames.join(', ') : 'None'}`);

  await prisma.$disconnect();
}

checkDataIntegrity().catch(err => {
  console.error('Error running data integrity check:', err);
  process.exit(1);
});
