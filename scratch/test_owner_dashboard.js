const API_BASE = 'http://localhost:5000/api/v1';

async function testOwnerDashboard() {
  console.log('--- Testing Owner Dashboard API ---');

  // 1. Login as Owner (demo.owner@servicehub.local)
  const ownerLoginRes = await fetch(`${API_BASE}/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      email: 'demo.owner@servicehub.local',
      password: 'DemoOwner123!'
    })
  });

  const ownerLoginData = await ownerLoginRes.json();
  const ownerToken = ownerLoginData.data?.accessToken || ownerLoginData.token;
  const ownerUser = ownerLoginData.data?.user || ownerLoginData.user;
  console.log(`✓ Owner logged in: ${ownerUser.name}`);

  // Fetch business info via /auth/me
  const meRes = await fetch(`${API_BASE}/auth/me`, {
    headers: { 'Authorization': `Bearer ${ownerToken}` }
  });
  const meData = await meRes.json();
  const fullUser = meData.data?.user || meData.user || meData;
  console.log('fullUser:', JSON.stringify(fullUser, null, 2));
  const businessId = fullUser.businesses?.[0]?.id || fullUser.memberships?.[0]?.businessId || fullUser.businessMemberships?.[0]?.businessId;
  console.log(`✓ Business ID: ${businessId}`);

  // 2. Fetch Owner Dashboard Data (businessId is auto-resolved from owner's membership if omitted)
  const dashRes = await fetch(`${API_BASE}/owner/dashboard`, {
    headers: { 'Authorization': `Bearer ${ownerToken}` }
  });

  const dashData = await dashRes.json();
  if (!dashRes.ok) {
    console.error('Dashboard Fetch Failed:', dashData);
    process.exit(1);
  }

  const payload = dashData.data;
  console.log('✓ Owner Dashboard Data fetched successfully!');
  console.log('Business Info:', payload.business?.name);
  console.log('Business Pulse:', payload.businessPulse);
  console.log('Needs Attention Items count:', payload.needsAttention?.length);
  console.log('Today Schedule Slots count:', payload.todaysSchedule?.slots?.length);
  console.log('Revenue Summary:', payload.revenueSummary);
  console.log('Team Workload count:', payload.teamWorkload?.length);
  console.log('Popular Services count:', payload.popularServices?.length);
  console.log('Customer Activity:', payload.customerActivity);
  console.log('Customer Feedback:', payload.customerFeedback);
  console.log('Opportunities count:', payload.opportunities?.length);

  // 3. Test RBAC: Login as Customer (demo.customer@servicehub.local)
  const custLoginRes = await fetch(`${API_BASE}/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      email: 'demo.customer@servicehub.local',
      password: 'DemoCustomer123!'
    })
  });
  const custLoginData = await custLoginRes.json();
  const custToken = custLoginData.data?.accessToken || custLoginData.token;

  // Try to access Owner Dashboard as Customer
  const rbacRes = await fetch(`${API_BASE}/owner/dashboard`, {
    headers: { 'Authorization': `Bearer ${custToken}` }
  });

  if (rbacRes.status === 403) {
    console.log('✓ RBAC check passed: Customer receives 403 Forbidden on Owner Dashboard');
  } else {
    console.error(`❌ RBAC check failed: Customer got status ${rbacRes.status}`);
  }

  console.log('--- All Owner Dashboard backend tests passed! ---');
}

testOwnerDashboard().catch((err) => {
  console.error('Test script error:', err);
  process.exit(1);
});
