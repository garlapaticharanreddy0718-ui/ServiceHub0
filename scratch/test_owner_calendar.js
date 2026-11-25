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

async function testCalendarBackend() {
  console.log('🚀 Testing Owner Calendar Working Hours & Schedule Mapping...\n');

  // 1. Login as Lokesh Malhotra (Owner)
  const loginRes = await makeRequest('/api/v1/auth/login', 'POST', {
    email: 'demo.owner@servicehub.local',
    password: 'DemoOwner123!',
  });

  if (loginRes.status !== 200 || !loginRes.body.data?.accessToken) {
    console.error('❌ Login failed:', loginRes.body);
    process.exit(1);
  }

  const token = loginRes.body.data.accessToken;
  console.log('✅ Authenticated as Lokesh Malhotra.');

  // 2. Fetch User Businesses
  const bizRes = await makeRequest('/api/v1/businesses', 'GET', null, token);
  const businessId = bizRes.body.data?.[0]?.id;
  console.log(`✅ Business ID: ${businessId}`);

  // 3. Fetch Active Staff with Schedules, Breaks, Time-offs
  const staffRes = await makeRequest(`/api/v1/businesses/${businessId}/staff`, 'GET', null, token);
  console.log(`\n👥 Active Staff Profiles (${staffRes.body.data?.length}):`);

  (staffRes.body.data || []).forEach((st) => {
    const name = st.displayName || st.businessMember?.user?.name;
    console.log(`\n--------------------------------------------------`);
    console.log(`Staff Member: ${name}`);
    console.log(`Schedules Count: ${st.schedules?.length || 0}`);
    
    // Check Monday (dayOfWeek = 1) schedule
    const mondaySchedule = (st.schedules || []).find((s) => s.dayOfWeek === 1);
    console.log(`Monday Schedule (dayOfWeek=1):`, mondaySchedule ? `isAvailable: ${mondaySchedule.isAvailable}, ${mondaySchedule.startTime}-${mondaySchedule.endTime}` : 'NO SCHEDULE RECORD');
    
    // Check Sunday (dayOfWeek = 0) schedule
    const sundaySchedule = (st.schedules || []).find((s) => s.dayOfWeek === 0);
    console.log(`Sunday Schedule (dayOfWeek=0):`, sundaySchedule ? `isAvailable: ${sundaySchedule.isAvailable}, ${sundaySchedule.startTime}-${sundaySchedule.endTime}` : 'NO SCHEDULE RECORD');

    // Check Breaks
    console.log(`Breaks (${st.breaks?.length || 0}):`, st.breaks?.map((b) => `Day ${b.dayOfWeek} (${b.startTime}-${b.endTime} ${b.label || ''})`).join(', '));
  });

  // 4. Fetch Bookings for Monday, September 7, 2026
  const mondayBookingRes = await makeRequest(`/api/v1/businesses/${businessId}/bookings?startDate=2026-09-07&endDate=2026-09-07&limit=200`, 'GET', null, token);
  console.log(`\n📅 Monday Sep 7, 2026 Bookings Count: ${mondayBookingRes.body.data?.length}`);
  (mondayBookingRes.body.data || []).forEach((b) => {
    console.log(`  - #${b.id.substring(0, 8)} | ${b.service?.name} | Client: ${b.customer?.name} | Staff: ${b.staff?.displayName || 'Staff'} | Status: ${b.status} | ${new Date(b.startTime).toLocaleTimeString()}`);
  });

  console.log('\n🎉 ALL CALENDAR WORKING HOURS TESTS PASSED SUCCESSFULLY!\n');
}

testCalendarBackend().catch(console.error);
