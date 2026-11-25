const http = require('http');

async function testCustomerApis() {
  let loginRes = await makeRequest('/api/v1/auth/login', 'POST', JSON.stringify({ email: 'demo.customer@servicehub.local', password: 'Password123!' }));
  
  if (loginRes.status !== 200) {
    console.log('Creating demo customer user...');
    const regRes = await makeRequest('/api/v1/auth/register', 'POST', JSON.stringify({
      email: 'demo.customer@servicehub.local',
      password: 'Password123!',
      name: 'Demo Customer',
      role: 'CUSTOMER'
    }));
    console.log('Register res:', regRes.status, regRes.body);
    loginRes = await makeRequest('/api/v1/auth/login', 'POST', JSON.stringify({ email: 'demo.customer@servicehub.local', password: 'Password123!' }));
  }

  console.log('Login status:', loginRes.status);
  const token = loginRes.body?.data?.accessToken;
  if (!token) {
    console.error('No access token returned!');
    return;
  }

  // Get Nearby Businesses
  const bizRes = await makeRequest('/api/v1/businesses/nearby', 'GET', null, token);
  console.log('Nearby businesses status:', bizRes.status);
  const bizList = bizRes.body?.data || [];
  console.log('Businesses count:', bizList.length);

  for (const b of bizList) {
    console.log(`\n--- Fetching details for business: ${b.name} (${b.id}) ---`);
    const svcRes = await makeRequest(`/api/v1/businesses/${b.id}/services`, 'GET', null, token);
    console.log('  Services status:', svcRes.status, 'Data:', JSON.stringify(svcRes.body).slice(0, 150));

    const stRes = await makeRequest(`/api/v1/businesses/${b.id}/staff`, 'GET', null, token);
    console.log('  Staff status:', stRes.status, 'Data:', JSON.stringify(stRes.body).slice(0, 150));

    const custRes = await makeRequest(`/api/v1/businesses/${b.id}/customers`, 'GET', null, token);
    console.log('  Customers status:', custRes.status, 'Data:', JSON.stringify(custRes.body).slice(0, 150));

    const bRes = await makeRequest(`/api/v1/businesses/${b.id}/bookings`, 'GET', null, token);
    console.log('  Bookings status:', bRes.status, 'Data:', JSON.stringify(bRes.body).slice(0, 150));
  }
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

testCustomerApis().catch(console.error);
