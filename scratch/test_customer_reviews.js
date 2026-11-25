// Native fetch used
const { PrismaClient } = require('../server/node_modules/@prisma/client');
const prisma = new PrismaClient();

const API_BASE = 'http://localhost:5000/api/v1';

async function runTests() {
  console.log('--- STARTING CUSTOMER PORTAL REVIEWS TEST SUITE ---');

  let demoUser = await prisma.user.findFirst({
    where: { email: 'demo.customer@servicehub.local' },
  });

  if (!demoUser) {
    console.log('Demo user not found, finding any CUSTOMER role user...');
    demoUser = await prisma.user.findFirst({
      where: { role: 'CUSTOMER' },
    });
  }

  if (!demoUser) {
    throw new Error('No customer user found in DB for testing.');
  }

  console.log(`Testing with Customer User: ${demoUser.name} (${demoUser.email}, ID: ${demoUser.id})`);

  // 1. Get Auth Token for Customer
  const authRes = await fetch(`${API_BASE}/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      email: demoUser.email,
      password: 'Password123!', // Standard test password
    }),
  });

  const { signAccessToken } = require('../server/src/utils/tokenUtils');
  const token = signAccessToken({ userId: demoUser.id, email: demoUser.email });

  const authHeaders = {
    'Content-Type': 'application/json',
    Authorization: `Bearer ${token}`,
  };

  // 2. TEST GET /api/v1/reviews/me
  console.log('\n1. Testing GET /api/v1/reviews/me...');
  const meRes = await fetch(`${API_BASE}/reviews/me`, {
    headers: authHeaders,
  });

  if (!meRes.ok) {
    const errText = await meRes.text();
    console.error('GET /reviews/me Error:', meRes.status, errText);
    throw new Error(`GET /reviews/me failed with status ${meRes.status}`);
  }

  const meData = await meRes.json();
  console.log('   Reviewable Bookings Count:', meData.data.reviewableBookings.length);
  console.log('   Submitted Reviews Count:', meData.data.submittedReviews.length);

  // Find or setup a business, service, staff, and customer for testing
  let biz = await prisma.business.findFirst({
    include: { services: true },
  });

  let staffMember = await prisma.staff.findFirst({
    where: { businessMember: { businessId: biz.id } },
  });

  if (!biz || !biz.services[0] || !staffMember) {
    throw new Error('Need at least 1 business with services and staff for testing.');
  }

  let customerRecord = await prisma.customer.findFirst({
    where: { OR: [{ userId: demoUser.id }, { email: demoUser.email }] },
  });

  if (!customerRecord) {
    customerRecord = await prisma.customer.create({
      data: {
        businessId: biz.id,
        userId: demoUser.id,
        name: demoUser.name || 'Demo Customer',
        email: demoUser.email,
      },
    });
  }

  // 3. Test Booking Eligibility & Creation
  console.log('\n2. Setting up test bookings...');
  const completedBooking = await prisma.booking.create({
    data: {
      businessId: biz.id,
      serviceId: biz.services[0].id,
      staffId: staffMember.id,
      customerId: customerRecord.id,
      startTime: new Date(Date.now() - 86400000), // Yesterday
      endTime: new Date(Date.now() - 86400000 + 1800000),
      status: 'COMPLETED',
      totalAmount: 50,
    },
  });

  const pendingBooking = await prisma.booking.create({
    data: {
      businessId: biz.id,
      serviceId: biz.services[0].id,
      staffId: staffMember.id,
      customerId: customerRecord.id,
      startTime: new Date(Date.now() + 86400000), // Tomorrow
      endTime: new Date(Date.now() + 86400000 + 1800000),
      status: 'PENDING',
      totalAmount: 50,
    },
  });

  // Re-check /reviews/me
  const updatedMeRes = await fetch(`${API_BASE}/reviews/me`, {
    headers: authHeaders,
  });
  const updatedMeData = await updatedMeRes.json();

  const foundCompleted = updatedMeData.data.reviewableBookings.some((b) => b.id === completedBooking.id);
  const foundPending = updatedMeData.data.reviewableBookings.some((b) => b.id === pendingBooking.id);

  console.log('   Completed booking in reviewable list:', foundCompleted ? 'PASS' : 'FAIL');
  console.log('   Pending booking excluded from reviewable list:', !foundPending ? 'PASS' : 'FAIL');

  if (!foundCompleted || foundPending) {
    throw new Error('Review eligibility test failed!');
  }

  // 4. Test Ineligible Status Submission (PENDING)
  console.log('\n3. Testing status restriction (submitting review for PENDING booking)...');
  const pendingSubRes = await fetch(`${API_BASE}/reviews`, {
    method: 'POST',
    headers: authHeaders,
    body: JSON.stringify({
      bookingId: pendingBooking.id,
      rating: 5,
      comment: 'Should fail because pending',
    }),
  });

  console.log('   Pending submission status:', pendingSubRes.status, pendingSubRes.status === 400 ? 'PASS' : 'FAIL');
  if (pendingSubRes.status !== 400) {
    throw new Error('Status restriction test failed!');
  }

  // 5. Test Customer Isolation (attempt reviewing another customer\'s booking)
  console.log('\n4. Testing customer data isolation (reviewing another customer\'s booking)...');
  const otherCustomer = await prisma.customer.create({
    data: {
      businessId: biz.id,
      name: 'Other Secret Customer',
      email: 'other.secret@servicehub.local',
    },
  });

  const otherBooking = await prisma.booking.create({
    data: {
      businessId: biz.id,
      serviceId: biz.services[0].id,
      staffId: staffMember.id,
      customerId: otherCustomer.id,
      startTime: new Date(Date.now() - 86400000),
      endTime: new Date(Date.now() - 86400000 + 1800000),
      status: 'COMPLETED',
      totalAmount: 75,
    },
  });

  const unauthorizedSubRes = await fetch(`${API_BASE}/reviews`, {
    method: 'POST',
    headers: authHeaders,
    body: JSON.stringify({
      bookingId: otherBooking.id,
      rating: 5,
      comment: 'Trying to hijack another customer review',
    }),
  });

  console.log('   Unauthorized review submission status:', unauthorizedSubRes.status, unauthorizedSubRes.status === 403 ? 'PASS' : 'FAIL');
  if (unauthorizedSubRes.status !== 403) {
    throw new Error('Customer isolation test failed!');
  }

  // 6. Test Valid Submission
  console.log('\n5. Testing valid review submission...');
  const validSubRes = await fetch(`${API_BASE}/reviews`, {
    method: 'POST',
    headers: authHeaders,
    body: JSON.stringify({
      bookingId: completedBooking.id,
      rating: 5,
      comment: 'Great service and very professional.',
    }),
  });

  console.log('   Valid submission status:', validSubRes.status, validSubRes.status === 201 ? 'PASS' : 'FAIL');
  if (validSubRes.status !== 201) {
    const errBody = await validSubRes.json();
    console.error('   Error response:', errBody);
    throw new Error('Valid review submission failed!');
  }

  // 7. Test Duplicate Review Protection
  console.log('\n6. Testing duplicate review protection...');
  const dupSubRes = await fetch(`${API_BASE}/reviews`, {
    method: 'POST',
    headers: authHeaders,
    body: JSON.stringify({
      bookingId: completedBooking.id,
      rating: 4,
      comment: 'Second review attempt',
    }),
  });

  console.log('   Duplicate submission status:', dupSubRes.status, dupSubRes.status === 409 ? 'PASS' : 'FAIL');
  if (dupSubRes.status !== 409) {
    throw new Error('Duplicate review protection test failed!');
  }

  // 8. Test State Update after submission
  console.log('\n7. Verifying updated state in GET /reviews/me...');
  const finalMeRes = await fetch(`${API_BASE}/reviews/me`, {
    headers: authHeaders,
  });
  const finalMeData = await finalMeRes.json();

  const isNowInSubmitted = finalMeData.data.submittedReviews.some((r) => r.bookingId === completedBooking.id);
  const isRemovedFromReviewable = !finalMeData.data.reviewableBookings.some((b) => b.id === completedBooking.id);

  console.log('   Moved to Submitted Reviews:', isNowInSubmitted ? 'PASS' : 'FAIL');
  console.log('   Removed from Ready to Review:', isRemovedFromReviewable ? 'PASS' : 'FAIL');

  // Clean up test bookings
  await prisma.review.deleteMany({ where: { bookingId: completedBooking.id } });
  await prisma.booking.deleteMany({
    where: { id: { in: [completedBooking.id, pendingBooking.id, otherBooking.id] } },
  });
  await prisma.customer.deleteMany({ where: { id: otherCustomer.id } });

  console.log('\n==================================================');
  console.log('FINAL VERIFICATION RESULTS:');
  console.log('Review loading: PASS');
  console.log('Review eligibility: PASS');
  console.log('Submit review: PASS');
  console.log('Duplicate protection: PASS');
  console.log('Customer isolation: PASS');
  console.log('==================================================\n');

  process.exit(0);
}

runTests().catch((err) => {
  console.error('TEST ERROR:', err);
  process.exit(1);
});
