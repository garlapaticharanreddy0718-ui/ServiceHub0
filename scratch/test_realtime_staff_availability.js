const path = require('path');
const { PrismaClient } = require(path.join(__dirname, '../server/node_modules/@prisma/client'));
const prisma = new PrismaClient();

const API_BASE = 'http://localhost:5000/api/v1';

async function runAvailabilityTests() {
  console.log('====================================================================');
  console.log('REAL-TIME STAFF AVAILABILITY COUNTS & CONFLICT TEST SUITE');
  console.log('====================================================================\n');

  // 1. Authenticate as Demo Owner
  const loginRes = await fetch(`${API_BASE}/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: 'demo.owner@servicehub.local', password: 'DemoOwner123!' }),
  });
  if (!loginRes.ok) throw new Error('Owner login failed');
  const loginData = await loginRes.json();
  const token = loginData.data.accessToken;

  // Resolve Glow & Style Beauty Studio
  const bizRes = await fetch(`${API_BASE}/businesses`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  const bizData = await bizRes.json();
  const beautyStudio = bizData.data.find((b) => b.name === 'Glow & Style Beauty Studio');
  if (!beautyStudio) throw new Error('Glow & Style Beauty Studio not found');
  const businessId = beautyStudio.id;

  console.log(`✓ Target Business: ${beautyStudio.name} (${businessId})`);

  // 2. Fetch Active Staff Directory in Glow & Style
  const staffList = await prisma.staff.findMany({
    where: { businessMember: { businessId }, isActive: true },
    include: {
      businessMember: { include: { user: true } },
      breaks: true,
      schedules: true,
      staffServices: { include: { service: true } },
    },
  });

  console.log(`✓ Active Staff Count in Business: ${staffList.length}`);
  for (const s of staffList) {
    console.log(`   - ${s.displayName} <${s.businessMember.user.email}>: Services=[${s.staffServices.map(ss => ss.service.name).join(', ')}], Breaks=[${s.breaks.map(b => `${b.startTime}-${b.endTime}`).join(', ')}]`);
  }

  // 3. Fetch Owner Dashboard Timeline API
  console.log('\n📊 [TEST 1] Fetching Owner Dashboard Timeline (Today\'s Schedule)...');
  const dashRes = await fetch(`${API_BASE}/owner/dashboard?businessId=${businessId}`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  const dashData = await dashRes.json();
  if (!dashRes.ok) throw new Error(`Dashboard API failed: ${dashData.message}`);

  const timelineItems = dashData.data.todaysSchedule.items || [];
  const freeSlots = timelineItems.filter((i) => i.type === 'FREE_SLOT');

  console.log(`✓ Total Timeline Items: ${timelineItems.length}, Free Slots: ${freeSlots.length}`);
  for (const fs of freeSlots) {
    console.log(`   Free Slot at ${fs.startTimeFormatted}: ${fs.availableStaffCount} staff available`);
  }

  // Verify 13:00 (01:00 PM) free slot count
  const slot13 = freeSlots.find((fs) => new Date(fs.startTime).getHours() === 13);
  if (slot13) {
    console.log(`\n🔍 Checking 01:00 PM Slot Availability Count...`);
    console.log(`   Available Count: ${slot13.availableStaffCount} (Expected: 1, because Priya & Kiran are on Lunch Break 13:00-14:00)`);
    if (slot13.availableStaffCount !== 1) {
      throw new Error(`Expected 1 staff available at 01:00 PM during Lunch Break, got ${slot13.availableStaffCount}!`);
    }
  }

  // ------------------------------------------------------------------
  // TEST 2: ACTIVE BOOKING CONFLICT DEDUCTION
  // ------------------------------------------------------------------
  console.log('\n📊 [TEST 2] Testing Active Booking Conflict Deduction...');
  const rahul = staffList.find((s) => s.displayName === 'Rahul Verma' || s.businessMember.user.email === 'rahul.staff@servicehub.local');
  const haircutSvc = staffList.flatMap((s) => s.staffServices).find((ss) => ss.service.name === 'Haircut')?.service;
  const customer = await prisma.customer.findFirst({ where: { businessId } });

  if (rahul && haircutSvc && customer) {
    const now = new Date();
    const today14 = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 14, 0, 0);
    const today15 = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 15, 0, 0);

    // Clean up any test booking at 14:00
    await prisma.booking.deleteMany({
      where: {
        businessId,
        staffId: rahul.id,
        startTime: today14,
      },
    });

    // Create active booking for Rahul at 14:00
    const testBooking = await prisma.booking.create({
      data: {
        businessId,
        customerId: customer.id,
        serviceId: haircutSvc.id,
        staffId: rahul.id,
        startTime: today14,
        endTime: today15,
        status: 'CONFIRMED',
        totalAmount: 500,
        notes: 'Availability Test Booking',
      },
    });

    console.log(`✓ Created test booking for Rahul Verma at 14:00 - 15:00 (ID: ${testBooking.id})`);

    // Re-fetch dashboard
    const dashRes2 = await fetch(`${API_BASE}/owner/dashboard?businessId=${businessId}`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    const dashData2 = await dashRes2.json();
    const freeSlots2 = dashData2.data.todaysSchedule.items.filter((i) => i.type === 'FREE_SLOT');
    const slot14 = freeSlots2.find((fs) => new Date(fs.startTime).getHours() === 14);

    if (slot14) {
      console.log(`   02:00 PM Slot Availability Count with Rahul Booked: ${slot14.availableStaffCount} (Expected: 2, Priya & Kiran available)`);
      if (slot14.availableStaffCount !== 2) {
        throw new Error(`Expected 2 staff available at 02:00 PM when 1 staff is booked, got ${slot14.availableStaffCount}`);
      }
    }

    // ------------------------------------------------------------------
    // TEST 3: CANCELLED BOOKING NON-BLOCKING VERIFICATION
    // ------------------------------------------------------------------
    console.log('\n📊 [TEST 3] Testing Cancelled Booking Non-Blocking Behavior...');
    await prisma.booking.update({
      where: { id: testBooking.id },
      data: { status: 'CANCELLED' },
    });
    console.log('✓ Updated test booking status to CANCELLED.');

    const dashRes3 = await fetch(`${API_BASE}/owner/dashboard?businessId=${businessId}`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    const dashData3 = await dashRes3.json();
    const freeSlots3 = dashData3.data.todaysSchedule.items.filter((i) => i.type === 'FREE_SLOT');
    const slot14AfterCancel = freeSlots3.find((fs) => new Date(fs.startTime).getHours() === 14);

    if (slot14AfterCancel) {
      console.log(`   02:00 PM Slot Availability Count after Cancel: ${slot14AfterCancel.availableStaffCount} (Expected: 3, all staff free)`);
      if (slot14AfterCancel.availableStaffCount !== 3) {
        throw new Error(`Expected 3 staff available at 02:00 PM after booking cancellation, got ${slot14AfterCancel.availableStaffCount}`);
      }
    }

    // Clean up test booking
    await prisma.booking.delete({ where: { id: testBooking.id } });
    console.log('✓ Cleaned up test booking.');
  }

  console.log('\n====================================================================');
  console.log('✅ ALL REAL-TIME STAFF AVAILABILITY & CONFLICT TESTS PASSED!');
  console.log('====================================================================');
}

runAvailabilityTests().catch((err) => {
  console.error('\n❌ AVAILABILITY TEST FAILED:', err.message);
  process.exit(1);
}).finally(() => prisma.$disconnect());
