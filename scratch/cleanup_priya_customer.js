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

async function cleanupPriyaCustomer() {
  const loginRes = await makeRequest('/api/v1/auth/login', 'POST', {
    email: 'demo.owner@servicehub.local',
    password: 'DemoOwner123!',
  });

  const token = loginRes.body.data?.accessToken;
  const bizRes = await makeRequest('/api/v1/businesses', 'GET', null, token);
  const businessId = bizRes.body.data?.[0]?.id;

  const customersRes = await makeRequest(`/api/v1/businesses/${businessId}/customers?limit=100`, 'GET', null, token);
  const priyaCustomer = (customersRes.body.data || []).find((c) => c.email === 'demo.staff@servicehub.local');

  if (priyaCustomer) {
    console.log(`Found accidental Customer record for Priya Sharma (ID: ${priyaCustomer.id}). Deleting...`);
    const delRes = await makeRequest(`/api/v1/businesses/${businessId}/customers/${priyaCustomer.id}`, 'DELETE', null, token);
    console.log(`Delete response status: ${delRes.status}`);
  } else {
    console.log('No Customer record found for Priya Sharma.');
  }
}

cleanupPriyaCustomer().catch(console.error);
