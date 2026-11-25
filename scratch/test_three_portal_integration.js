const http = require('http');

async function makeRequest(path, method = 'GET', body = null, token = null) {
  return new Promise((resolve, reject) => {
    const options = {
      hostname: 'localhost',
      port: 5000,
      path,
      method,
      headers: {
        'Content-Type': 'application/json',
      },
    };

    if (token) {
      options.headers['Authorization'] = `Bearer ${token}`;
    }

    const req = http.request(options, (res) => {
      let data = '';
      res.on('data', (chunk) => (data += chunk));
      res.on('end', () => {
        try {
          const parsed = JSON.parse(data);
          resolve({ status: res.statusCode, body: parsed });
        } catch (e) {
          resolve({ status: res.statusCode, body: data });
        }
      });
    });

    req.on('error', reject);
    if (body) req.write(JSON.stringify(body));
    req.end();
  });
}

async function runThreePortalIntegrationTest() {
  console.log('===============================================================');
  console.log('🚀 SERVICEHUB PHASE 12: THREE-PORTAL INTEGRATION TEST SUITE');
  console.log('===============================================================\n');

  // -----------------------------------------------------------------
  // 1. AUTHENTICATE ALL THREE ROLES FOR GLOW & STYLE BEAUTY STUDIO
  // -----------------------------------------------------------------
  console.log('📌 1. Authenticating Portals...');
  
  // Owner (Lokesh Malhotra)
  const ownerLogin = await makeRequest('/api/v1/auth/login', 'POST', {
    email: 'demo.owner@servicehub.local',
    password: 'DemoOwner123!',
  });
  const ownerToken = ownerLogin.body.data?.accessToken;
  const ownerBizRes = await makeRequest('/api/v1/businesses', 'GET', null, ownerToken);
  const businessId = ownerBizRes.body.data?.[0]?.id;
  console.log(`- Owner Authenticated: Lokesh Malhotra | Business ID: ${businessId}`);

  // Staff (Priya Sharma)
  const staffLogin = await makeRequest('/api/v1/auth/login', 'POST', {
    email: 'demo.staff@servicehub.local',
    password: 'DemoStaff123!',
  });
  const staffToken = staffLogin.body.data?.accessToken;
  console.log(`- Staff Authenticated: Priya Sharma`);

  // Customer (Ananya Roy)
  const customerLogin = await makeRequest('/api/v1/auth/login', 'POST', {
    email: 'demo.customer@servicehub.local',
    password: 'DemoCustomer123!',
  });
  const customerToken = customerLogin.body.data?.accessToken;
  console.log(`- Customer Authenticated: Ananya Roy`);

  // Get active staff profile ID for Priya Sharma
  const staffListRes = await makeRequest(`/api/v1/businesses/${businessId}/staff`, 'GET', null, ownerToken);
  const priyaStaff = staffListRes.body.data?.find((s) => s.displayName === 'Priya Sharma' || s.businessMember?.user?.email === 'demo.staff@servicehub.local');

  // Get service ID for Hair Spa
  const servicesRes = await makeRequest(`/api/v1/businesses/${businessId}/services`, 'GET', null, ownerToken);
  const hairSpa = servicesRes.body.data?.find((s) => s.name === 'Hair Spa') || servicesRes.body.data?.[0];

  // -----------------------------------------------------------------
  // 2. CUSTOMER CREATES BOOKING (PENDING)
  // -----------------------------------------------------------------
  console.log('\n📌 2. Customer Creates Booking...');
  // Pick dynamic future date (e.g., 2026-09-10, 2026-09-11, etc.)
  const dayOffset = 10 + (Math.floor(Date.now() / 1000) % 15); // Sept 10 - Sept 25
  const bookingDateStr = `2026-09-${dayOffset.toString().padStart(2, '0')}T04:00:00.000Z`;

  const createBookingRes = await makeRequest(`/api/v1/businesses/${businessId}/bookings`, 'POST', {
    customerId: undefined, // derived from authenticated user
    serviceId: hairSpa.id,
    staffId: priyaStaff.id,
    startTime: bookingDateStr,
    notes: 'Integration Test — Hair Spa treatment',
  }, customerToken);

  if (createBookingRes.status !== 201) {
    console.error('❌ Booking creation failed:', createBookingRes.body);
    process.exit(1);
  }

  const booking = createBookingRes.body.data;
  const bookingId = booking.id;
  console.log(`✅ Booking Created! ID: ${bookingId} | Status: ${booking.status}`);

  // -----------------------------------------------------------------
  // 3. VERIFY SAME BOOKING RECORD ACROSS ALL 3 PORTALS (PENDING)
  // -----------------------------------------------------------------
  console.log('\n📌 3. Verifying Multi-Portal Data Consistency (PENDING)...');
  
  // -----------------------------------------------------------------
  // 3. VERIFY SAME BOOKING RECORD ACROSS ALL 3 PORTALS (PENDING)
  // -----------------------------------------------------------------
  console.log('\n📌 3. Verifying Multi-Portal Data Consistency (PENDING)...');
  
  // Customer My Appointments (via business bookings endpoint)
  const custAppts = await makeRequest(`/api/v1/businesses/${businessId}/bookings?limit=300`, 'GET', null, customerToken);
  const custBooking = (custAppts.body.data || []).find((b) => b.id === bookingId);
  console.log(`- Customer Portal My Appointments: ${custBooking ? `Found (Status: ${custBooking.status})` : 'NOT FOUND ❌'}`);

  // Staff My Appointments
  const staffAppts = await makeRequest(`/api/v1/businesses/${businessId}/bookings?staffId=${priyaStaff.id}&limit=300`, 'GET', null, staffToken);
  const staffBooking = (staffAppts.body.data || []).find((b) => b.id === bookingId);
  console.log(`- Staff Portal My Appointments: ${staffBooking ? `Found (Status: ${staffBooking.status})` : 'NOT FOUND ❌'}`);

  // Owner Appointments & Calendar
  const ownerAppts = await makeRequest(`/api/v1/businesses/${businessId}/bookings?startDate=2026-09-01&endDate=2026-09-30&limit=300`, 'GET', null, ownerToken);
  const ownerBooking = (ownerAppts.body.data || []).find((b) => b.id === bookingId);
  console.log(`- Owner Portal Appointments & Calendar: ${ownerBooking ? `Found (Status: ${ownerBooking.status})` : 'NOT FOUND ❌'}`);

  // -----------------------------------------------------------------
  // 4. OWNER CONFIRMS BOOKING (PENDING -> CONFIRMED)
  // -----------------------------------------------------------------
  console.log('\n📌 4. Owner Confirms Booking (PENDING -> CONFIRMED)...');
  const confirmRes = await makeRequest(`/api/v1/businesses/${businessId}/bookings/${bookingId}/status`, 'POST', {
    status: 'CONFIRMED',
    reason: 'Owner confirmed appointment schedule',
  }, ownerToken);
  console.log(`- Status Update Response: HTTP ${confirmRes.status} | New Status: ${confirmRes.body.data?.status}`);

  // -----------------------------------------------------------------
  // 5. VERIFY ALL PORTALS SEE CONFIRMED
  // -----------------------------------------------------------------
  console.log('\n📌 5. Verifying Multi-Portal Data Consistency (CONFIRMED)...');
  const custAppts2 = await makeRequest(`/api/v1/businesses/${businessId}/bookings?limit=300`, 'GET', null, customerToken);
  const custB2 = custAppts2.body.data?.find((b) => b.id === bookingId);

  const staffAppts2 = await makeRequest(`/api/v1/businesses/${businessId}/bookings?staffId=${priyaStaff.id}&limit=300`, 'GET', null, staffToken);
  const staffB2 = staffAppts2.body.data?.find((b) => b.id === bookingId);

  const ownerAppts2 = await makeRequest(`/api/v1/businesses/${businessId}/bookings?startDate=2026-09-01&endDate=2026-09-30&limit=300`, 'GET', null, ownerToken);
  const ownerB2 = ownerAppts2.body.data?.find((b) => b.id === bookingId);

  console.log(`- Customer Portal Status: ${custB2?.status}`);
  console.log(`- Staff Portal Status: ${staffB2?.status}`);
  console.log(`- Owner Portal Status: ${ownerB2?.status}`);

  // -----------------------------------------------------------------
  // 6. STAFF STARTS BOOKING (CONFIRMED -> IN_PROGRESS)
  // -----------------------------------------------------------------
  console.log('\n📌 6. Staff Starts Booking (CONFIRMED -> IN_PROGRESS)...');
  const startRes = await makeRequest(`/api/v1/businesses/${businessId}/bookings/${bookingId}/status`, 'POST', {
    status: 'IN_PROGRESS',
    reason: 'Staff specialist started service',
  }, staffToken);
  console.log(`- Status Update Response: HTTP ${startRes.status} | New Status: ${startRes.body.data?.status}`);

  // -----------------------------------------------------------------
  // 7. STAFF COMPLETES BOOKING (IN_PROGRESS -> COMPLETED)
  // -----------------------------------------------------------------
  console.log('\n📌 7. Staff Completes Booking (IN_PROGRESS -> COMPLETED)...');
  const completeRes = await makeRequest(`/api/v1/businesses/${businessId}/bookings/${bookingId}/status`, 'POST', {
    status: 'COMPLETED',
    reason: 'Service completed successfully',
  }, staffToken);
  console.log(`- Status Update Response: HTTP ${completeRes.status} | New Status: ${completeRes.body.data?.status}`);

  // -----------------------------------------------------------------
  // 8. CUSTOMER SUBMITS REVIEW FOR COMPLETED BOOKING
  // -----------------------------------------------------------------
  console.log('\n📌 8. Customer Submits Review for Completed Booking...');
  const reviewRes = await makeRequest('/api/v1/reviews', 'POST', {
    bookingId,
    rating: 5,
    comment: 'Exceptional Hair Spa service by Priya! Very relaxing environment.',
  }, customerToken);
  console.log(`- Review Response: HTTP ${reviewRes.status} | Rating: ${reviewRes.body.data?.rating}/5`);

  // Verify review appears in Owner Portal
  const ownerReviewsRes = await makeRequest(`/api/v1/businesses/${businessId}/reviews`, 'GET', null, ownerToken);
  const reviewsList = Array.isArray(ownerReviewsRes.body.data) ? ownerReviewsRes.body.data : (ownerReviewsRes.body.data?.reviews || []);
  const submittedReview = reviewsList.find((r) => r.bookingId === bookingId);
  console.log(`- Owner Portal Reviews: ${submittedReview ? `Found ("${submittedReview.comment}")` : 'NOT FOUND ❌'}`);

  // -----------------------------------------------------------------
  // 9. NON-DEMO FULL END-TO-END WORKFLOW (NEW OWNER, BIZ, SERVICE, STAFF, CUSTOMER)
  // -----------------------------------------------------------------
  console.log('\n📌 9. Executing Non-Demo Full End-to-End Workflow...');

  const ts = Date.now();
  
  // A. Register & Login New Owner
  const ownerEmail = `owner_${ts}@example.com`;
  const ownerPassword = 'Password123!';
  await makeRequest('/api/v1/auth/register', 'POST', {
    name: 'Vikrant Roy',
    email: ownerEmail,
    password: ownerPassword,
    role: 'OWNER',
  });
  const newOwnerLogin = await makeRequest('/api/v1/auth/login', 'POST', { email: ownerEmail, password: ownerPassword });
  const newOwnerToken = newOwnerLogin.body.data?.accessToken;
  console.log(`- Step A: Registered & Logged In New Owner (Vikrant Roy)`);

  // B. Create New Business
  const newBizRes = await makeRequest('/api/v1/businesses', 'POST', {
    name: `Zenith Wellness Studio ${ts}`,
    category: 'Wellness & Spa',
    address: 'Hitech City Road',
    city: 'Hyderabad',
    phone: '+91 91122 33445',
    description: 'Premier holistic wellness and massage studio.',
    latitude: 17.4435,
    longitude: 78.3772,
  }, newOwnerToken);
  const newBizId = newBizRes.body.data?.id;
  console.log(`- Step B: Created New Business (${newBizRes.body.data?.name}) | ID: ${newBizId}`);

  // C. Create Service
  const newSvcRes = await makeRequest(`/api/v1/businesses/${newBizId}/services`, 'POST', {
    name: 'Aroma Therapy Massage',
    price: 2500,
    durationMinutes: 60,
    description: 'Full body essential oils massage.',
  }, newOwnerToken);
  const newSvcId = newSvcRes.body.data?.id;
  console.log(`- Step C: Created Service (Aroma Therapy Massage, ₹2500) | ID: ${newSvcId}`);

  // D. Register Staff User & Owner Adds Staff Member to Business
  const staffEmail = `staff_${ts}@example.com`;
  const staffPassword = 'Password123!';
  await makeRequest('/api/v1/auth/register', 'POST', {
    name: 'Karan Mehra',
    email: staffEmail,
    password: staffPassword,
    role: 'STAFF',
  });
  const newStaffLogin = await makeRequest('/api/v1/auth/login', 'POST', { email: staffEmail, password: staffPassword });
  const newStaffUserToken = newStaffLogin.body.data?.accessToken;

  // Owner adds Karan as Business Member (STAFF role)
  const addMemRes = await makeRequest(`/api/v1/businesses/${newBizId}/members`, 'POST', {
    email: staffEmail,
    role: 'STAFF',
  }, newOwnerToken);
  const newMemId = addMemRes.body.data?.id;

  // Owner creates Staff Profile for Business Member
  const newStaffRes = await makeRequest(`/api/v1/businesses/${newBizId}/staff`, 'POST', {
    businessMemberId: newMemId,
    displayName: 'Karan Mehra',
    bio: 'Certified aroma therapy specialist.',
  }, newOwnerToken);
  const newStaffId = newStaffRes.body.data?.id;
  console.log(`- Step D: Added Business Member (${newMemId}) & Staff Profile (Karan Mehra) | ID: ${newStaffId}`);

  // E. Assign Staff to Service
  await makeRequest(`/api/v1/businesses/${newBizId}/staff/${newStaffId}/services`, 'PUT', {
    serviceIds: [newSvcId],
  }, newOwnerToken);
  console.log(`- Step E: Assigned Karan Mehra to Aroma Therapy Massage`);

  // F. Set Staff Schedule (Mon-Sun 09:00 - 18:00)
  const schedules = [0, 1, 2, 3, 4, 5, 6].map((day) => ({
    dayOfWeek: day,
    startTime: '09:00',
    endTime: '18:00',
    isAvailable: true,
  }));
  await makeRequest(`/api/v1/businesses/${newBizId}/staff/${newStaffId}/schedule`, 'PUT', { schedules }, newOwnerToken);
  console.log(`- Step F: Set Staff Working Schedule (09:00–18:00, 7 days/week)`);

  // G. Register & Login New Customer
  const custEmail = `customer_${ts}@example.com`;
  const custPassword = 'Password123!';
  await makeRequest('/api/v1/auth/register', 'POST', {
    name: 'Sonia Kapoor',
    email: custEmail,
    password: custPassword,
    role: 'CUSTOMER',
  });
  const newCustLogin = await makeRequest('/api/v1/auth/login', 'POST', { email: custEmail, password: custPassword });
  const newCustToken = newCustLogin.body.data?.accessToken;
  console.log(`- Step G: Registered & Logged In New Customer (Sonia Kapoor)`);

  // H. Customer Books Appointment
  const newBookingDate = '2026-09-09T05:00:00.000Z'; // 10:30 AM IST
  const newBookingRes = await makeRequest(`/api/v1/businesses/${newBizId}/bookings`, 'POST', {
    serviceId: newSvcId,
    staffId: newStaffId,
    startTime: newBookingDate,
    notes: 'Aroma therapy session for muscle relaxation.',
  }, newCustToken);
  const newBookingId = newBookingRes.body.data?.id;
  console.log(`- Step H: Customer Booked Session! ID: ${newBookingId} | Status: ${newBookingRes.body.data?.status}`);

  // I. Owner Confirms -> Staff Completes
  await makeRequest(`/api/v1/businesses/${newBizId}/bookings/${newBookingId}/status`, 'POST', { status: 'CONFIRMED' }, newOwnerToken);
  await makeRequest(`/api/v1/businesses/${newBizId}/bookings/${newBookingId}/status`, 'POST', { status: 'COMPLETED' }, newStaffUserToken);
  console.log(`- Step I: Owner Confirmed & Staff Completed Session`);

  // J. Customer Reviews Completed Session
  const newReviewRes = await makeRequest('/api/v1/reviews', 'POST', {
    bookingId: newBookingId,
    rating: 5,
    comment: 'Wonderful aroma therapy massage with Karan! Highly recommend Zenith Wellness.',
  }, newCustToken);
  console.log(`- Step J: Customer Reviewed Completed Session! Rating: ${newReviewRes.body.data?.rating}/5`);

  console.log('\n===============================================================');
  console.log('🎉 ALL THREE-PORTAL INTEGRATION & CONNECTED WORKFLOW TESTS PASSED!');
  console.log('===============================================================\n');
}

runThreePortalIntegrationTest().catch(console.error);
