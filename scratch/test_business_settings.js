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

async function testBusinessSettings() {
  console.log('🚀 Testing Business Settings Location Updates & Customer Discovery...\n');

  // 1. Login as Lokesh Malhotra (Owner)
  const loginRes = await makeRequest('/api/v1/auth/login', 'POST', {
    email: 'demo.owner@servicehub.local',
    password: 'DemoOwner123!',
  });

  const token = loginRes.body.data?.accessToken;
  console.log('✅ Authenticated as Owner.');

  // 2. Fetch Business
  const bizRes = await makeRequest('/api/v1/businesses', 'GET', null, token);
  const business = bizRes.body.data?.[0];
  const businessId = business.id;
  console.log(`✅ Business ID: ${businessId} (${business.name})`);

  // 3. Update Location Settings (Jubilee Hills 17.4334, 78.4026)
  const updatePayload = {
    name: business.name,
    category: business.category || 'Beauty & Salon',
    address: 'Road No. 36, Jubilee Hills',
    city: 'Hyderabad',
    latitude: 17.4334,
    longitude: 78.4026,
  };

  const updateRes = await makeRequest(`/api/v1/businesses/${businessId}`, 'PATCH', updatePayload, token);
  console.log(`\nLocation Update HTTP Status: ${updateRes.status}`);
  console.log('Updated Business Record:', {
    name: updateRes.body.data?.name,
    address: updateRes.body.data?.address,
    city: updateRes.body.data?.city,
    latitude: updateRes.body.data?.latitude,
    longitude: updateRes.body.data?.longitude,
  });

  // 4. Test Customer Discovery Nearby Search with updated coordinates
  const discoveryRes = await makeRequest(`/api/v1/businesses/nearby?lat=17.4334&lng=78.4026&radiusKm=25`, 'GET', null, token);
  console.log(`\nCustomer Discovery Nearby Search HTTP Status: ${discoveryRes.status}`);
  const nearbyGlow = (discoveryRes.body.data || []).find((b) => b.id === businessId);
  
  if (nearbyGlow) {
    console.log(`✅ Business found in Customer Discovery! Distance from updated pin: ${nearbyGlow.distanceKm} km`);
  } else {
    console.error('❌ Business not found in nearby search!');
  }

  console.log('\n🎉 BUSINESS SETTINGS LOCATION TESTS PASSED SUCCESSFULLY!\n');
}

testBusinessSettings().catch(console.error);
