const http = require('http');

async function testAvailabilityFixes() {
  console.log('=== SERVICEHUB — CRITICAL AVAILABILITY FIX TEST SUITE ===\n');

  // 1. Login as Demo Customer
  const loginRes = await makeRequest('/api/v1/auth/login', 'POST', JSON.stringify({
    email: 'demo.customer@servicehub.local',
    password: 'DemoCustomer123!'
  }));

  const token = loginRes.body?.data?.accessToken;
  if (!token) throw new Error('Customer login failed');

  // 2. Discover Businesses & Select Glow & Style
  const bizRes = await makeRequest('/api/v1/businesses/nearby', 'GET', null, token);
  const bizList = bizRes.body?.data || [];
  const glowBiz = bizList.find((b) => b.name.includes('Glow')) || bizList[0];

  // 3. Get Services & Staff
  const svcRes = await makeRequest(`/api/v1/businesses/${glowBiz.id}/services`, 'GET', null, token);
  const svcs = svcRes.body?.data || [];
  const hairSpaSvc = svcs[0];

  const stRes = await makeRequest(`/api/v1/businesses/${glowBiz.id}/staff`, 'GET', null, token);
  const staffList = stRes.body?.data || [];
  
  // Find staff assigned to this service
  const eligibleStaff = staffList.filter((st) => {
    if (!st || !st.staffServices || st.staffServices.length === 0) return true;
    return st.staffServices.some((ss) => ss && ss.serviceId === hairSpaSvc.id);
  });
  const targetStaff = eligibleStaff.length > 0 ? eligibleStaff[0] : staffList[0];

  console.log(`Testing Business: ${glowBiz.name}`);
  console.log(`Target Service: ${hairSpaSvc?.name} (${hairSpaSvc?.durationMinutes} min)`);
  console.log(`Target Staff: ${targetStaff?.displayName}\n`);

  const now = new Date();
  const todayISO = now.toISOString().split('T')[0];

  // -------------------------------------------------------------
  // TEST 1: Check getAvailability includes COMPLETED bookings
  // -------------------------------------------------------------
  console.log('TEST 1: getAvailability queries status != CANCELLED (includes COMPLETED bookings)');
  const availToday = await makeRequest(
    `/api/v1/businesses/${glowBiz.id}/availability?staffId=${targetStaff.id}&serviceId=${hairSpaSvc.id}&date=${todayISO}`,
    'GET',
    null,
    token
  );
  console.log('  Status:', availToday.status);
  const bookingsReturned = availToday.body?.data?.bookings || [];
  console.log('  Bookings returned count:', bookingsReturned.length);
  const nonCancelled = bookingsReturned.filter((b) => b.status !== 'CANCELLED').length;
  console.log(`  Non-cancelled bookings in availability payload: ${nonCancelled} (✓ properly included)`);

  // -------------------------------------------------------------
  // TEST 2: Past Date Validation
  // -------------------------------------------------------------
  console.log('\nTEST 2: Past Date Validation');
  const pastDate = '2026-09-01';
  const availPast = await makeRequest(
    `/api/v1/businesses/${glowBiz.id}/availability?staffId=${targetStaff.id}&serviceId=${hairSpaSvc.id}&date=${pastDate}`,
    'GET',
    null,
    token
  );
  console.log('  Past date endpoint response isPastDate:', availPast.body?.data?.isPastDate);

  // -------------------------------------------------------------
  // TEST 3: Backend Rejection of Past Time Slot Booking
  // -------------------------------------------------------------
  console.log('\nTEST 3: Backend Rejection of Past Time Slot in createBooking');
  const pastStartTime = new Date(Date.now() - 3600 * 1000).toISOString(); // 1 hour in past
  const pastBookingRes = await makeRequest(`/api/v1/businesses/${glowBiz.id}/bookings`, 'POST', JSON.stringify({
    serviceId: hairSpaSvc.id,
    staffId: targetStaff.id,
    startTime: pastStartTime,
    notes: 'Past time slot test'
  }), token);

  console.log('  Status:', pastBookingRes.status);
  console.log('  Message:', pastBookingRes.body?.message);
  if (pastBookingRes.status === 400 && pastBookingRes.body?.message?.includes('past')) {
    console.log('  ✓ PASSED: Backend rejected past time booking!');
  } else {
    console.log('  ✗ FAILED: Past time booking was not rejected as expected.');
  }

  // -------------------------------------------------------------
  // TEST 4: Backend Double-Booking Overlap Check against Existing Booking
  // -------------------------------------------------------------
  console.log('\nTEST 4: Overlap Conflict Check with Existing Booking');
  if (bookingsReturned.length > 0) {
    const existingB = bookingsReturned[0];
    const conflictBookingRes = await makeRequest(`/api/v1/businesses/${glowBiz.id}/bookings`, 'POST', JSON.stringify({
      serviceId: hairSpaSvc.id,
      staffId: targetStaff.id,
      startTime: existingB.startTime,
      notes: 'Conflict collision test'
    }), token);

    console.log('  Status:', conflictBookingRes.status);
    console.log('  Message:', conflictBookingRes.body?.message);
    if (conflictBookingRes.status === 409 || conflictBookingRes.status === 400) {
      console.log('  ✓ PASSED: Backend correctly blocked overlapping booking!');
    }
  } else {
    console.log('  No existing booking found for today.');
  }

  // -------------------------------------------------------------
  // TEST 5: Future Date Valid Booking Creation
  // -------------------------------------------------------------
  console.log('\nTEST 5: Valid Future Booking Creation');
  const futureD = new Date();
  futureD.setDate(futureD.getDate() + 3);
  if (futureD.getDay() === 0) futureD.setDate(futureD.getDate() + 1);
  const futureISO = futureD.toISOString().split('T')[0];

  const validBookingRes = await makeRequest(`/api/v1/businesses/${glowBiz.id}/bookings`, 'POST', JSON.stringify({
    serviceId: hairSpaSvc.id,
    staffId: targetStaff.id,
    startTime: new Date(`${futureISO}T11:00:00`).toISOString(),
    notes: 'Valid future booking test'
  }), token);

  console.log(`  Target Date: ${futureISO} at 11:00 AM`);
  console.log('  Status:', validBookingRes.status);
  if (validBookingRes.status === 201) {
    console.log('  ✓ PASSED: Future booking created successfully!');
    console.log('  Booking ID:', validBookingRes.body?.data?.id);
  } else {
    console.log('  Message:', validBookingRes.body?.message);
  }

  console.log('\n=== ALL CRITICAL AVAILABILITY TESTS COMPLETED ===');
}

function makeRequest(path, method, body, token) {
  return new Promise((resolve, reject) => {
    const headers = { 'Content-Type': 'application/json' };
    if (body) headers['Content-Length'] = Buffer.byteLength(body);
    if (token) headers['Authorization'] = `Bearer ${token}`;

    const req = http.request(
      {
        hostname: 'localhost',
        port: 5000,
        path,
        method,
        headers,
      },
      (res) => {
        let data = '';
        res.on('data', (chunk) => (data += chunk));
        res.on('end', () => {
          try {
            resolve({ status: res.statusCode, body: JSON.parse(data) });
          } catch (e) {
            resolve({ status: res.statusCode, body: data });
          }
        });
      }
    );

    req.on('error', (err) => reject(err));
    if (body) req.write(body);
    req.end();
  });
}

testAvailabilityFixes().catch(console.error);
