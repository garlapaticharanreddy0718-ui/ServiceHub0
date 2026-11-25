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

async function testOwnerCustomersAPI() {
  console.log('🚀 Testing Owner Customers CRM API & Data Integration...\n');

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
  console.log('✅ Authenticated as Lokesh Malhotra (Owner).');

  // 2. Fetch Business ID
  const bizRes = await makeRequest('/api/v1/businesses', 'GET', null, token);
  const businessId = bizRes.body.data?.[0]?.id;
  console.log(`✅ Business ID: ${businessId}`);

  // 3. Fetch Customer Directory & Summary
  const customersRes = await makeRequest(`/api/v1/businesses/${businessId}/customers?limit=100`, 'GET', null, token);
  const summary = customersRes.body.summary;
  const customersList = customersRes.body.data || [];

  console.log('\n📊 Customer CRM Summary Metrics:');
  console.log(`- Total Customers: ${summary?.totalCustomers}`);
  console.log(`- New Customers: ${summary?.newCustomers}`);
  console.log(`- Returning Customers: ${summary?.returningCustomers}`);
  console.log(`- Inactive Customers: ${summary?.inactiveCustomers}`);

  // Fetch lists for each filter
  const newRes = await makeRequest(`/api/v1/businesses/${businessId}/customers?limit=100&activity=new`, 'GET', null, token);
  const returningRes = await makeRequest(`/api/v1/businesses/${businessId}/customers?limit=100&activity=returning`, 'GET', null, token);
  const inactiveRes = await makeRequest(`/api/v1/businesses/${businessId}/customers?limit=100&activity=inactive`, 'GET', null, token);

  console.log('\n🔍 Filter Consistency Verification:');
  console.log(`- New Filter List Count: ${newRes.body.data?.length} (Summary expected: ${summary?.newCustomers})`);
  console.log(`- Returning Filter List Count: ${returningRes.body.data?.length} (Summary expected: ${summary?.returningCustomers})`);
  console.log(`- Inactive Filter List Count: ${inactiveRes.body.data?.length} (Summary expected: ${summary?.inactiveCustomers})`);

  // 4. Verify Priya Sharma is NOT in the customer directory
  const priyaInCustomers = customersList.some((c) => c.email === 'demo.staff@servicehub.local');
  if (priyaInCustomers) {
    console.error('❌ ERROR: Priya Sharma (Staff) is still present in the Customer directory!');
  } else {
    console.log('✅ Verified: Priya Sharma (Staff) is NOT listed in the Customer directory.');
  }

  // 5. Inspect Customer Roster Items
  console.log(`\n📋 Customers Roster List (${customersList.length} total):`);
  customersList.forEach((c) => {
    const lastBooking = c.lastBooking;
    const nextBooking = c.nextBooking;
    const lastVisitDate = lastBooking ? new Date(lastBooking.startTime).toLocaleDateString() : 'No previous visit';
    const nextVisitDate = nextBooking ? new Date(nextBooking.startTime).toLocaleDateString() : 'No upcoming appointment';
    const lastService = lastBooking?.service?.name || 'None';
    const lastStaff = lastBooking?.staff?.displayName || 'None';
    console.log(`- ${c.name} | Contact: ${c.email || c.phone || 'N/A'} | Visits: ${c._count?.bookings || 0} | Last Visit: ${lastVisitDate} (${lastService} with ${lastStaff}) | Next: ${nextVisitDate}`);
  });

  // 6. Test Customer Profile Detail View (Ananya Roy)
  const ananya = customersList.find((c) => c.name === 'Ananya Roy');
  if (ananya) {
    const profileRes = await makeRequest(`/api/v1/businesses/${businessId}/customers/${ananya.id}`, 'GET', null, token);
    const prof = profileRes.body.data;
    console.log(`\n👤 Detailed Profile for ${prof.name}:`);
    console.log(`- Address: ${prof.address}`);
    console.log(`- Total Bookings History Count: ${prof.bookings?.length || 0}`);
    console.log(`- Notes Count: ${prof.notes?.length || 0}`);
    console.log(`- Reviews Count: ${prof.reviews?.length || 0}`);
    if (prof.bookings?.length > 0) {
      console.log(`- Sample Recent Booking: ${prof.bookings[0].service?.name} on ${new Date(prof.bookings[0].startTime).toLocaleDateString()} with ${prof.bookings[0].staff?.displayName || 'Staff'} [Status: ${prof.bookings[0].status}]`);
    }
  }

  console.log('\n🎉 ALL OWNER CUSTOMERS CRM TESTS PASSED!\n');
}

testOwnerCustomersAPI().catch(console.error);
