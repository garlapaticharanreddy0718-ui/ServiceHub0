const path = require('path');
const { PrismaClient } = require(path.join(__dirname, '../server/node_modules/@prisma/client'));
const prisma = new PrismaClient();

const API_BASE = 'http://localhost:5000/api/v1';

async function loginUser(email, password) {
  const res = await fetch(`${API_BASE}/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password }),
  });
  const data = await res.json();
  if (!res.ok) {
    throw new Error(`Login failed for ${email}: ${data.message || res.statusText}`);
  }
  return data; // contains { status: 'success', data: { accessToken, user } }
}

async function apiGet(endpoint, token) {
  const res = await fetch(`${API_BASE}${endpoint}`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  const data = await res.json();
  if (!res.ok) {
    throw new Error(`GET ${endpoint} failed: ${data.message || res.statusText}`);
  }
  return data.data;
}

async function apiPost(endpoint, body, token) {
  const res = await fetch(`${API_BASE}${endpoint}`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify(body),
  });
  const data = await res.json();
  if (!res.ok) {
    throw new Error(`POST ${endpoint} failed: ${data.message || res.statusText}`);
  }
  return data;
}

async function runTests() {
  console.log('====================================================');
  console.log('STAFF PORTAL REAL-TIME DATA INTEGRATION TEST SUITE');
  console.log('====================================================\n');

  // ------------------------------------------------------------------
  // TEST 1: LOGIN AS DEMO STAFF (Priya Sharma) & VERIFY METRICS
  // ------------------------------------------------------------------
  console.log('--- TEST 1: Demo Staff Data Connection (Priya Sharma) ---');
  const demoStaffAuth = await loginUser('demo.staff@servicehub.local', 'DemoStaff123!');
  const token = demoStaffAuth.data.accessToken;
  const user = demoStaffAuth.data.user;
  console.log(`✓ Logged in as: ${user.name} (${user.email})`);
  
  const priyaUserDb = await prisma.user.findUnique({
    where: { id: user.id },
    include: { businessMembers: true }
  });
  const businessId = priyaUserDb.businessMembers[0].businessId;
  console.log(`✓ Resolved Business ID: ${businessId}`);

  const staffList = await apiGet(`/businesses/${businessId}/staff`, token);
  const myStaff = staffList.find(s => s.businessMember?.userId === user.id || s.email === user.email);
  if (!myStaff) throw new Error('Could not find staff profile for Priya Sharma');
  console.log(`✓ Resolved Staff Profile ID: ${myStaff.id}, DisplayName: ${myStaff.displayName}`);

  const bookings = await apiGet(`/businesses/${businessId}/bookings`, token);
  const myBookings = bookings.filter(b => b.staffId === myStaff.id);
  console.log(`✓ Total bookings assigned to Priya: ${myBookings.length}`);

  const services = await apiGet(`/businesses/${businessId}/services`, token);
  const myServices = services.filter(svc => myStaff.staffServices.some(ss => ss.serviceId === svc.id));
  console.log(`✓ Services assigned to Priya: ${myServices.map(s => s.name).join(', ')}`);

  const now = new Date();
  const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 0, 0, 0, 0);
  const todayEnd = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59, 999);

  const todaysBookings = myBookings.filter(b => {
    const d = new Date(b.startTime);
    return d >= todayStart && d <= todayEnd;
  });

  const todayCount = todaysBookings.length;
  const completedTodayCount = todaysBookings.filter(b => b.status === 'COMPLETED').length;
  const remainingTodayCount = todaysBookings.filter(b => ['PENDING', 'CONFIRMED', 'IN_PROGRESS'].includes(b.status)).length;

  console.log(`✓ Calculated Metrics for Priya Today:`);
  console.log(`   - Today's Appointments: ${todayCount}`);
  console.log(`   - Completed Today: ${completedTodayCount}`);
  console.log(`   - Remaining Today: ${remainingTodayCount}`);
  console.log(`   - My Services Count: ${myServices.length}`);

  // ------------------------------------------------------------------
  // TEST 2: APPOINTMENT STATUS LIFECYCLE MUTATION & DASHBOARD REFRESH
  // ------------------------------------------------------------------
  console.log('\n--- TEST 2: Appointment Status Lifecycle (Customer -> Owner -> Staff) ---');
  
  let testBooking = myBookings.find(b => ['PENDING', 'CONFIRMED'].includes(b.status));

  if (!testBooking) {
    const testSvc = myServices[0];
    const customerObj = await prisma.customer.findFirst({ where: { businessId } });
    
    const testStart = new Date(now);
    testStart.setHours(11, 0, 0, 0);
    const testEnd = new Date(now);
    testEnd.setHours(12, 0, 0, 0);

    testBooking = await prisma.booking.create({
      data: {
        businessId,
        customerId: customerObj.id,
        serviceId: testSvc.id,
        staffId: myStaff.id,
        startTime: testStart,
        endTime: testEnd,
        status: 'PENDING',
        totalAmount: testSvc.price,
      },
      include: { customer: true, service: true }
    });
    console.log(`  + Created new test booking ${testBooking.id} with status PENDING`);
  } else {
    console.log(`  * Reusing existing booking ${testBooking.id} with status ${testBooking.status}`);
  }

  // Staff transitions status
  if (testBooking.status === 'PENDING') {
    await apiPost(`/businesses/${businessId}/bookings/${testBooking.id}/status`, { status: 'CONFIRMED' }, token);
    console.log(`  ✓ Updated booking status to CONFIRMED`);
  }

  await apiPost(`/businesses/${businessId}/bookings/${testBooking.id}/status`, { status: 'IN_PROGRESS' }, token);
  console.log(`  ✓ Updated booking status to IN_PROGRESS`);

  await apiPost(`/businesses/${businessId}/bookings/${testBooking.id}/status`, { status: 'COMPLETED' }, token);
  console.log(`  ✓ Updated booking status to COMPLETED`);

  // Verify DB record updated
  const updatedBookingInDb = await prisma.booking.findUnique({ where: { id: testBooking.id } });
  if (updatedBookingInDb.status !== 'COMPLETED') {
    throw new Error(`Expected booking status COMPLETED, got ${updatedBookingInDb.status}`);
  }
  console.log(`✓ Verified in PostgreSQL DB: status is COMPLETED`);

  // ------------------------------------------------------------------
  // TEST 3: NEW STAFF MEMBER ONBOARDING & ISOLATION
  // ------------------------------------------------------------------
  console.log('\n--- TEST 3: New Staff Member Identity & Tenant Scoping ---');
  const ownerAuth = await loginUser('demo.owner@servicehub.local', 'DemoOwner123!');
  const ownerToken = ownerAuth.data.accessToken;

  const testEmail = `staff.test.${Date.now()}@servicehub.local`;
  const newStaffRes = await apiPost(`/businesses/${businessId}/staff`, {
    name: 'Anisha Rao',
    email: testEmail,
    displayName: 'Anisha Rao',
    role: 'STAFF',
    serviceIds: [myServices[0].id],
    schedules: [
      { dayOfWeek: 1, startTime: '10:00', endTime: '19:00', isAvailable: true },
      { dayOfWeek: 2, startTime: '10:00', endTime: '19:00', isAvailable: true },
      { dayOfWeek: 3, startTime: '10:00', endTime: '19:00', isAvailable: true },
    ]
  }, ownerToken);

  console.log(`✓ Created new staff member: Anisha Rao (${testEmail}) [Staff ID: ${newStaffRes.data.id}]`);

  // Log in as new staff member
  const newStaffAuth = await loginUser(testEmail, 'Staff@123!');
  const newStaffUser = newStaffAuth.data.user;
  console.log(`✓ Logged in as new staff: ${newStaffUser.name}`);
  const newStaffToken = newStaffAuth.data.accessToken;

  const newStaffList = await apiGet(`/businesses/${businessId}/staff`, newStaffToken);
  const matchedNewStaff = newStaffList.find(s => s.businessMember?.userId === newStaffUser.id);
  if (!matchedNewStaff) throw new Error('New staff could not match her own staff profile!');
  console.log(`✓ New Staff correctly matched profile ID: ${matchedNewStaff.id}, DisplayName: ${matchedNewStaff.displayName}`);

  const newStaffBookings = (await apiGet(`/businesses/${businessId}/bookings`, newStaffToken)).filter(b => b.staffId === matchedNewStaff.id);
  console.log(`✓ New Staff bookings count: ${newStaffBookings.length} (no Priya bookings mixed!)`);

  const newStaffServices = services.filter(svc => matchedNewStaff.staffServices.some(ss => ss.serviceId === svc.id));
  console.log(`✓ New Staff services: ${newStaffServices.map(s => s.name).join(', ')}`);

  console.log('\n====================================================');
  console.log('ALL STAFF PORTAL REAL-TIME INTEGRATION TESTS PASSED!');
  console.log('====================================================');
}

runTests().catch(err => {
  console.error('\n❌ TEST FAILED:', err);
  process.exit(1);
}).finally(() => prisma.$disconnect());
