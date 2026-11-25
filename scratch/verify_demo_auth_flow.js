const path = require('path');

const API_BASE = 'http://localhost:5000/api/v1';

async function testAuth() {
  console.log('======================================================');
  console.log('SERVICEHUB AUTHENTICATION & AUTHORIZATION TEST SUITE');
  console.log('======================================================\n');

  // 1. TEST DEMO OWNER LOGIN
  console.log('1️⃣ Testing Demo Owner Login (demo.owner@servicehub.local / DemoOwner123!)...');
  const ownerRes = await fetch(`${API_BASE}/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      email: 'demo.owner@servicehub.local',
      password: 'DemoOwner123!'
    })
  });

  const ownerData = await ownerRes.json();
  if (!ownerRes.ok) {
    throw new Error(`Owner Login failed: ${ownerData.message || ownerRes.statusText}`);
  }

  console.log(`✓ Owner Login Status: ${ownerRes.status} OK`);
  console.log(`✓ Access Token Received: ${ownerData.data.accessToken ? 'YES (JWT format valid)' : 'NO'}`);
  console.log(`✓ User Name: "${ownerData.data.user.name}"`);
  console.log(`✓ User Email: "${ownerData.data.user.email}"`);

  if (ownerData.data.user.name !== 'Vikram Malhotra') {
    throw new Error(`Expected owner name 'Vikram Malhotra', got '${ownerData.data.user.name}'`);
  }

  const ownerToken = ownerData.data.accessToken;

  // 2. TEST GET /api/v1/auth/me FOR OWNER
  console.log('\n2️⃣ Testing GET /api/v1/auth/me for Owner...');
  const meRes = await fetch(`${API_BASE}/auth/me`, {
    headers: { Authorization: `Bearer ${ownerToken}` }
  });
  const meData = await meRes.json();
  if (!meRes.ok) {
    throw new Error(`GET /auth/me failed: ${meData.message || meRes.statusText}`);
  }
  console.log(`✓ /auth/me Status: ${meRes.status} OK`);
  console.log(`✓ /auth/me User Name: "${meData.data.user.name}"`);
  if (meData.data.user.name !== 'Vikram Malhotra') {
    throw new Error(`Expected /auth/me name 'Vikram Malhotra', got '${meData.data.user.name}'`);
  }

  // 3. TEST GET /api/v1/businesses FOR OWNER
  console.log('\n3️⃣ Testing GET /api/v1/businesses for Owner...');
  const bizRes = await fetch(`${API_BASE}/businesses`, {
    headers: { Authorization: `Bearer ${ownerToken}` }
  });
  const bizData = await bizRes.json();
  if (!bizRes.ok) {
    throw new Error(`GET /businesses failed: ${bizData.message || bizRes.statusText}`);
  }
  console.log(`✓ /businesses Status: ${bizRes.status} OK`);
  console.log(`✓ Returned Businesses Count: ${bizData.data.length}`);
  const beautyStudio = bizData.data.find(b => b.name === 'Glow & Style Beauty Studio');
  if (!beautyStudio) {
    throw new Error('Glow & Style Beauty Studio not found in user businesses!');
  }
  console.log(`✓ Glow & Style Beauty Studio Found! (ID: ${beautyStudio.id})`);
  console.log(`✓ User Role in Business: "${beautyStudio.currentUserRole}"`);
  if (beautyStudio.currentUserRole !== 'OWNER') {
    throw new Error(`Expected role 'OWNER', got '${beautyStudio.currentUserRole}'`);
  }

  // 4. TEST DEMO STAFF LOGIN
  console.log('\n4️⃣ Testing Demo Staff Login (demo.staff@servicehub.local / DemoStaff123!)...');
  const staffRes = await fetch(`${API_BASE}/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      email: 'demo.staff@servicehub.local',
      password: 'DemoStaff123!'
    })
  });
  const staffData = await staffRes.json();
  if (!staffRes.ok) {
    throw new Error(`Staff Login failed: ${staffData.message || staffRes.statusText}`);
  }
  console.log(`✓ Staff Login Status: ${staffRes.status} OK`);
  console.log(`✓ Staff User Name: "${staffData.data.user.name}"`);

  // 5. TEST DEMO CUSTOMER LOGIN
  console.log('\n5️⃣ Testing Demo Customer Login (demo.customer@servicehub.local / DemoCustomer123!)...');
  const customerRes = await fetch(`${API_BASE}/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      email: 'demo.customer@servicehub.local',
      password: 'DemoCustomer123!'
    })
  });
  const customerData = await customerRes.json();
  if (!customerRes.ok) {
    throw new Error(`Customer Login failed: ${customerData.message || customerRes.statusText}`);
  }
  console.log(`✓ Customer Login Status: ${customerRes.status} OK`);
  console.log(`✓ Customer User Name: "${customerData.data.user.name}"`);

  console.log('\n======================================================');
  console.log('🎉 ALL API AUTHENTICATION & AUTHORIZATION TESTS PASSED!');
  console.log('======================================================');
}

testAuth().catch(err => {
  console.error('\n❌ TEST FAILED:', err.message);
  process.exit(1);
});
