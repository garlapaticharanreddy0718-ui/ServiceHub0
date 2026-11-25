const http = require('http');

async function testFullBookingFlow() {
  console.log('=== SERVICEHUB CUSTOMER BOOKING END-TO-END VERIFICATION ===');

  // 1. Customer Login
  const loginRes = await makeRequest('/api/v1/auth/login', 'POST', JSON.stringify({
    email: 'demo.customer@servicehub.local',
    password: 'DemoCustomer123!'
  }));

  const token = loginRes.body?.data?.accessToken;
  if (!token) throw new Error('Customer login failed');

  // 2. Discover Businesses
  const bizRes = await makeRequest('/api/v1/businesses/nearby', 'GET', null, token);
  const bizList = bizRes.body?.data || [];
  const targetBiz = bizList[0];

  // 3. View Services
  const svcRes = await makeRequest(`/api/v1/businesses/${targetBiz.id}/services`, 'GET', null, token);
  const svcs = svcRes.body?.data || [];
  const targetSvc = svcs[0];

  // 4. View Eligible Staff
  const stRes = await makeRequest(`/api/v1/businesses/${targetBiz.id}/staff`, 'GET', null, token);
  const staffList = stRes.body?.data || [];
  const targetStaff = staffList[0];

  // Find next working day date (e.g. tomorrow or next Monday)
  const futureDate = new Date();
  futureDate.setDate(futureDate.getDate() + 2); // 2 days in future
  if (futureDate.getDay() === 0) futureDate.setDate(futureDate.getDate() + 1); // skip Sunday if needed
  const dateISO = futureDate.toISOString().split('T')[0];

  // 5. Fetch Availability
  const availRes = await makeRequest(
    `/api/v1/businesses/${targetBiz.id}/availability?staffId=${targetStaff.id}&serviceId=${targetSvc.id}&date=${dateISO}`,
    'GET',
    null,
    token
  );
  console.log(`5. Check Availability for ${dateISO}:`, availRes.status);

  // 6. Confirm Reservation
  const bookingTimeISO = new Date(`${dateISO}T10:00:00`).toISOString();
  const bookRes = await makeRequest(`/api/v1/businesses/${targetBiz.id}/bookings`, 'POST', JSON.stringify({
    serviceId: targetSvc.id,
    staffId: targetStaff.id,
    startTime: bookingTimeISO,
    notes: 'End-to-end customer booking UI verification'
  }), token);

  console.log('6. Confirm Reservation status:', bookRes.status);
  if (bookRes.status === 201) {
    console.log('   ✓ Booking Successfully Created!');
    console.log('   Booking ID:', bookRes.body?.data?.id);
    console.log('   Status:', bookRes.body?.data?.status);
    console.log('   Total Amount: ₹' + bookRes.body?.data?.totalAmount);
  } else {
    console.log('   Booking response message:', bookRes.body?.message);
  }

  // 7. Verify My Appointments List
  const myBookingsRes = await makeRequest(`/api/v1/businesses/${targetBiz.id}/bookings`, 'GET', null, token);
  console.log('7. View My Appointments count:', myBookingsRes.body?.data?.length);
  console.log('=== END-TO-END FLOW VERIFICATION COMPLETE ===');
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

testFullBookingFlow().catch(console.error);
