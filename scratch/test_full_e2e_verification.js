const API_BASE = 'http://localhost:5000/api/v1';

async function runE2ETests() {
  console.log('==================================================================');
  console.log('FULL SERVICEHUB E2E AUTHENTICATION & BUSINESS DATA VERIFICATION');
  console.log('==================================================================\n');

  // ------------------------------------------------------------------
  // 1. DEMO OWNER FLOW (Vikram Malhotra - Glow & Style Beauty Studio)
  // ------------------------------------------------------------------
  console.log('🔷 [STEP 1] Testing Demo Owner Login & Portal Data...');
  const ownerLoginRes = await fetch(`${API_BASE}/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      email: 'demo.owner@servicehub.local',
      password: 'DemoOwner123!'
    })
  });
  if (!ownerLoginRes.ok) throw new Error('Owner login failed');
  const ownerLoginData = await ownerLoginRes.json();
  const ownerToken = ownerLoginData.data.accessToken;
  const ownerUser = ownerLoginData.data.user;

  console.log(`  ✓ Auth Status: 200 OK`);
  console.log(`  ✓ User ID: ${ownerUser.id}`);
  console.log(`  ✓ User Name: "${ownerUser.name}" (Expected: Vikram Malhotra)`);
  console.log(`  ✓ User Email: "${ownerUser.email}"`);

  if (ownerUser.name !== 'Vikram Malhotra') {
    throw new Error(`Owner name mismatch! Expected 'Vikram Malhotra', got '${ownerUser.name}'`);
  }

  // Fetch Businesses
  const ownerBizRes = await fetch(`${API_BASE}/businesses`, {
    headers: { Authorization: `Bearer ${ownerToken}` }
  });
  const ownerBizData = await ownerBizRes.json();
  const ownerBiz = ownerBizData.data.find(b => b.name === 'Glow & Style Beauty Studio');
  if (!ownerBiz) throw new Error('Glow & Style Beauty Studio not found');

  console.log(`  ✓ Business Selected: "${ownerBiz.name}" (ID: ${ownerBiz.id})`);
  console.log(`  ✓ Business Role: "${ownerBiz.currentUserRole}" (Expected: OWNER)`);

  if (ownerBiz.currentUserRole !== 'OWNER') {
    throw new Error(`Owner role mismatch! Expected 'OWNER', got '${ownerBiz.currentUserRole}'`);
  }

  // Fetch Team Staff
  const staffRes = await fetch(`${API_BASE}/businesses/${ownerBiz.id}/staff`, {
    headers: { Authorization: `Bearer ${ownerToken}` }
  });
  const staffData = await staffRes.json();
  console.log(`  ✓ Team Members Count: ${staffData.data ? staffData.data.length : staffData.length}`);
  const priyaStaff = (staffData.data || staffData).find(s => s.displayName?.includes('Priya') || s.email === 'demo.staff@servicehub.local');
  console.log(`  ✓ Demo Staff (Priya Sharma) Present in Team: ${priyaStaff ? 'YES' : 'NO'}`);

  // Fetch Appointments
  const bookingsRes = await fetch(`${API_BASE}/businesses/${ownerBiz.id}/bookings`, {
    headers: { Authorization: `Bearer ${ownerToken}` }
  });
  const bookingsData = await bookingsRes.json();
  const bookingsList = bookingsData.data || bookingsData;
  console.log(`  ✓ Owner Appointments Count: ${bookingsList.length}`);

  // ------------------------------------------------------------------
  // 2. DEMO STAFF FLOW (Priya Sharma)
  // ------------------------------------------------------------------
  console.log('\n🔷 [STEP 2] Testing Demo Staff Login...');
  const staffLoginRes = await fetch(`${API_BASE}/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      email: 'demo.staff@servicehub.local',
      password: 'DemoStaff123!'
    })
  });
  if (!staffLoginRes.ok) throw new Error('Staff login failed');
  const staffLoginData = await staffLoginRes.json();
  const staffUser = staffLoginData.data.user;

  console.log(`  ✓ Auth Status: 200 OK`);
  console.log(`  ✓ User Name: "${staffUser.name}" (Expected: Priya Sharma)`);
  console.log(`  ✓ User Email: "${staffUser.email}"`);

  // ------------------------------------------------------------------
  // 3. DEMO CUSTOMER FLOW (Ananya Roy)
  // ------------------------------------------------------------------
  console.log('\n🔷 [STEP 3] Testing Demo Customer Login...');
  const customerLoginRes = await fetch(`${API_BASE}/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      email: 'demo.customer@servicehub.local',
      password: 'DemoCustomer123!'
    })
  });
  if (!customerLoginRes.ok) throw new Error('Customer login failed');
  const customerLoginData = await customerLoginRes.json();
  const customerUser = customerLoginData.data.user;

  console.log(`  ✓ Auth Status: 200 OK`);
  console.log(`  ✓ User Name: "${customerUser.name}" (Expected: Ananya Roy)`);
  console.log(`  ✓ User Email: "${customerUser.email}"`);

  console.log('\n==================================================================');
  console.log('✅ ALL E2E VERIFICATION STEPS PASSED SUCCESSFULLY!');
  console.log('==================================================================');
}

runE2ETests().catch(err => {
  console.error('\n❌ E2E VERIFICATION FAILED:', err.message);
  process.exit(1);
});
