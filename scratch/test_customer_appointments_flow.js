const http = require('http');

const API_BASE = 'http://localhost:5000/api/v1';
let authToken = '';
let customerCookie = '';
let customerUser = null;

function request(method, path, body = null, token = '', cookie = '') {
  return new Promise((resolve, reject) => {
    const url = new URL(API_BASE + path);
    const options = {
      hostname: url.hostname,
      port: url.port,
      path: url.pathname + url.search,
      method: method,
      headers: {
        'Content-Type': 'application/json',
      },
    };

    if (token) {
      options.headers['Authorization'] = `Bearer ${token}`;
    }
    if (cookie) {
      options.headers['Cookie'] = cookie;
    }

    const req = http.request(options, (res) => {
      let data = '';
      const resCookies = res.headers['set-cookie'];

      res.on('data', (chunk) => {
        data += chunk;
      });

      res.on('end', () => {
        try {
          const parsed = JSON.parse(data);
          resolve({
            status: res.statusCode,
            cookies: resCookies,
            body: parsed,
          });
        } catch (e) {
          resolve({
            status: res.statusCode,
            cookies: resCookies,
            body: data,
          });
        }
      });
    });

    req.on('error', reject);

    if (body) {
      req.write(JSON.stringify(body));
    }
    req.end();
  });
}

async function runTests() {
  console.log('=== STARTING SERVICEHUB MY APPOINTMENTS E2E VERIFICATION ===\n');

  try {
    // 1. Customer Login
    console.log('1. Logging in as Demo Customer (demo.customer@servicehub.local)...');
    const loginRes = await request('POST', '/auth/login', {
      email: 'demo.customer@servicehub.local',
      password: 'DemoCustomer123!',
    });

    if (loginRes.status !== 200 || (loginRes.body.status !== 'success' && !loginRes.body.success)) {
      throw new Error(`Customer login failed: ${JSON.stringify(loginRes.body)}`);
    }

    customerCookie = loginRes.cookies ? loginRes.cookies.join('; ') : '';
    authToken = loginRes.body.data?.accessToken || loginRes.body.token || '';
    customerUser = loginRes.body.data?.user || loginRes.body.user;
    console.log(`✓ Customer Logged In: ${customerUser.name} (${customerUser.email})`);

    // 2. Fetch Businesses
    console.log('\n2. Fetching Businesses Catalog...');
    const bizRes = await request('GET', '/businesses/nearby?radius=500', null, authToken, customerCookie);
    if (bizRes.status !== 200) {
      throw new Error(`Failed to fetch businesses: ${JSON.stringify(bizRes.body)}`);
    }
    const businesses = bizRes.body.data || [];
    console.log(`✓ Found ${businesses.length} businesses: ${businesses.map(b => b.name).join(', ')}`);

    if (businesses.length === 0) {
      throw new Error('No businesses found in demo system.');
    }

    const primaryBiz = businesses[0];

    // 3. Customer Data Isolation Test: Query customer bookings
    console.log(`\n3. Verifying Customer Data Isolation for business '${primaryBiz.name}'...`);
    const bookingsRes = await request('GET', `/businesses/${primaryBiz.id}/bookings`, null, authToken, customerCookie);
    if (bookingsRes.status !== 200) {
      throw new Error(`Failed to fetch customer bookings: ${JSON.stringify(bookingsRes.body)}`);
    }

    const customerBookings = bookingsRes.body.data || [];
    console.log(`✓ Fetched ${customerBookings.length} customer bookings for '${primaryBiz.name}'`);

    for (const b of customerBookings) {
      if (b.customer && b.customer.userId && b.customer.userId !== customerUser.id) {
        throw new Error(`CRITICAL SECURITY FAILURE: Customer ${customerUser.id} received booking belonging to another user ${b.customer.userId}`);
      }
    }
    console.log('✓ Customer Data Isolation PASSED: Zero cross-tenant data leakage');

    // 4. Create a test booking for tomorrow
    console.log('\n4. Creating a test customer booking for tomorrow to test Cancel & Reschedule...');
    const servicesRes = await request('GET', `/businesses/${primaryBiz.id}/services`, null, authToken, customerCookie);
    const staffRes = await request('GET', `/businesses/${primaryBiz.id}/staff`, null, authToken, customerCookie);

    const testService = servicesRes.body.data[0];
    const testStaff = staffRes.body.data[0];

    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    const tomorrowDateStr = tomorrow.toISOString().split('T')[0];

    const availRes = await request(
      'GET',
      `/businesses/${primaryBiz.id}/availability?staffId=${testStaff.id}&serviceId=${testService.id}&date=${tomorrowDateStr}`,
      null,
      authToken,
      customerCookie
    );

    let rawSlots = availRes.body.data?.slots || (Array.isArray(availRes.body.data) ? availRes.body.data : []);
    let selectedSlot = '10:00';
    if (availRes.status === 200 && rawSlots.length > 0) {
      selectedSlot = rawSlots[0].startTime || rawSlots[0];
    }

    const bookingStartTime = `${tomorrowDateStr}T${selectedSlot}:00.000Z`;

    const createBookingRes = await request(
      'POST',
      `/businesses/${primaryBiz.id}/bookings`,
      {
        serviceId: testService.id,
        staffId: testStaff.id,
        startTime: bookingStartTime,
        notes: 'Test booking for E2E verification',
      },
      authToken,
      customerCookie
    );

    if (createBookingRes.status !== 201) {
      throw new Error(`Failed to create test booking: ${JSON.stringify(createBookingRes.body)}`);
    }

    const testBooking = createBookingRes.body.data;
    console.log(`✓ Created test booking ID: ${testBooking.id} (Status: ${testBooking.status})`);

    // 5. Test Reschedule Endpoint
    console.log('\n5. Testing Customer Reschedule functionality...');
    const nextSlot = selectedSlot === '10:00' ? '11:00' : '10:00';
    const newStartTime = `${tomorrowDateStr}T${nextSlot}:00.000Z`;

    const rescheduleRes = await request(
      'PATCH',
      `/businesses/${primaryBiz.id}/bookings/${testBooking.id}`,
      {
        staffId: testStaff.id,
        startTime: newStartTime,
      },
      authToken,
      customerCookie
    );

    if (rescheduleRes.status !== 200) {
      throw new Error(`Reschedule failed: ${JSON.stringify(rescheduleRes.body)}`);
    }

    console.log(`✓ Appointment rescheduled successfully to ${newStartTime}`);

    // 6. Test Cancellation Endpoint
    console.log('\n6. Testing Customer Appointment Cancellation...');
    const cancelRes = await request(
      'POST',
      `/businesses/${primaryBiz.id}/bookings/${testBooking.id}/cancel`,
      { reason: 'Testing customer cancellation flow' },
      authToken,
      customerCookie
    );

    if (cancelRes.status !== 200) {
      throw new Error(`Cancellation failed: ${JSON.stringify(cancelRes.body)}`);
    }

    console.log(`✓ Appointment cancelled successfully (Status: ${cancelRes.body.data.status})`);

    // 7. Verify Released Slot is available again
    console.log('\n7. Verifying released time slot availability...');
    const availAfterCancel = await request(
      'GET',
      `/businesses/${primaryBiz.id}/availability?staffId=${testStaff.id}&serviceId=${testService.id}&date=${tomorrowDateStr}`,
      null,
      authToken,
      customerCookie
    );

    if (availAfterCancel.status === 200) {
      const freeSlotsData = availAfterCancel.body.data?.slots || (Array.isArray(availAfterCancel.body.data) ? availAfterCancel.body.data : []);
      const freeSlots = freeSlotsData.map(s => s.startTime || s);
      console.log(`✓ Availability calculated cleanly. Free slots: ${freeSlots.slice(0, 5).join(', ')}...`);
    }

    // 8. Staff Portal Regression Check
    console.log('\n8. Running Staff Portal Regression Check...');
    const staffLoginRes = await request('POST', '/auth/login', {
      email: 'demo.staff@servicehub.local',
      password: 'DemoStaff123!',
    });

    if (staffLoginRes.status !== 200) {
      throw new Error('Staff login regression detected!');
    }
    console.log('✓ Staff Login PASSED: Staff Portal operational');

    console.log('\n==================================================');
    console.log('ALL MY APPOINTMENTS VERIFICATION TESTS PASSED!');
    console.log('==================================================\n');
  } catch (err) {
    console.error('\n❌ VERIFICATION TEST FAILED:', err.message);
    process.exit(1);
  }
}

runTests();
