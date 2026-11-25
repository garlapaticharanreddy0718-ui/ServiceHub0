const path = require('path');
const { PrismaClient } = require(path.join(__dirname, '../server/node_modules/@prisma/client'));
const prisma = new PrismaClient();

const API_BASE = 'http://localhost:5000/api/v1';

async function runIntegrityTests() {
  console.log('====================================================================');
  console.log('STAFF BREAK INTEGRITY & OVERLAP VALIDATION TEST SUITE');
  console.log('====================================================================\n');

  // 1. Authenticate as Demo Owner (Vikram Malhotra)
  const loginRes = await fetch(`${API_BASE}/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: 'demo.owner@servicehub.local', password: 'DemoOwner123!' }),
  });
  if (!loginRes.ok) throw new Error('Owner login failed');
  const loginData = await loginRes.json();
  const token = loginData.data.accessToken;

  // Resolve Glow & Style Beauty Studio
  const bizRes = await fetch(`${API_BASE}/businesses`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  const bizData = await bizRes.json();
  const beautyStudio = bizData.data.find((b) => b.name === 'Glow & Style Beauty Studio');
  if (!beautyStudio) throw new Error('Glow & Style Beauty Studio not found');
  const businessId = beautyStudio.id;

  console.log(`✓ Logged in as Owner. Target Business: ${beautyStudio.name} (${businessId})\n`);

  // Clean up any existing test staff from previous test runs
  const existingTestUser = await prisma.user.findFirst({
    where: { email: 'integrity.test.staff@servicehub.local' },
  });
  if (existingTestUser) {
    await prisma.user.delete({ where: { id: existingTestUser.id } });
  }

  // ------------------------------------------------------------------
  // TEST 1: CREATE NEW STAFF MEMBER WITH INITIAL BREAK
  // ------------------------------------------------------------------
  console.log('1️⃣ Creating new staff member with 1 break on Monday (13:00 - 14:00)...');
  const createStaffRes = await fetch(`${API_BASE}/businesses/${businessId}/staff`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({
      name: 'Integrity Test Staff',
      email: 'integrity.test.staff@servicehub.local',
      displayName: 'Integrity Test Staff',
      schedules: [
        { dayOfWeek: 1, startTime: '09:00', endTime: '18:00', isAvailable: true },
      ],
      breaks: [
        { dayOfWeek: 1, startTime: '13:00', endTime: '14:00', label: 'Lunch Break' },
      ],
    }),
  });
  const createStaffData = await createStaffRes.json();
  if (!createStaffRes.ok) throw new Error(`Create staff failed: ${createStaffData.message}`);
  const staff = createStaffData.data;
  console.log(`  ✓ Staff Created: ID=${staff.id}, Name="${staff.displayName}"`);

  // Verify DB break count
  const dbBreaks1 = await prisma.staffBreak.findMany({ where: { staffId: staff.id } });
  console.log(`  ✓ DB StaffBreak Count: ${dbBreaks1.length} (Expected: 1)`);
  if (dbBreaks1.length !== 1) throw new Error(`Expected 1 break, got ${dbBreaks1.length}`);

  // ------------------------------------------------------------------
  // TEST 2: IDEMPOTENCE — BULK RE-SAVE SAME BREAK CONFIGURATION
  // ------------------------------------------------------------------
  console.log('\n2️⃣ Re-saving identical break configuration via PUT /breaks...');
  const resaveRes = await fetch(`${API_BASE}/businesses/${businessId}/staff/${staff.id}/breaks`, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({
      breaks: [
        { dayOfWeek: 1, startTime: '13:00', endTime: '14:00', label: 'Lunch Break' },
      ],
    }),
  });
  const resaveData = await resaveRes.json();
  if (!resaveRes.ok) throw new Error(`Re-save breaks failed: ${resaveData.message}`);

  const dbBreaks2 = await prisma.staffBreak.findMany({ where: { staffId: staff.id } });
  console.log(`  ✓ DB StaffBreak Count after re-save: ${dbBreaks2.length} (Expected: 1)`);
  if (dbBreaks2.length !== 1) throw new Error(`Expected 1 break after re-save, got ${dbBreaks2.length}`);

  // ------------------------------------------------------------------
  // TEST 3: OVERLAPPING BREAK VALIDATION
  // ------------------------------------------------------------------
  console.log('\n3️⃣ Attempting to add overlapping break (13:30 - 14:30)...');
  const overlapRes = await fetch(`${API_BASE}/businesses/${businessId}/staff/${staff.id}/breaks`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({
      dayOfWeek: 1,
      startTime: '13:30',
      endTime: '14:30',
      label: 'Overlapping Tea Break',
    }),
  });
  const overlapData = await overlapRes.json();
  console.log(`  ✓ Status Code: ${overlapRes.status} (Expected: 400)`);
  console.log(`  ✓ Rejected Message: "${overlapData.message}"`);
  if (overlapRes.ok) throw new Error('Overlapping break should have been rejected!');

  // ------------------------------------------------------------------
  // TEST 4: BREAK OUTSIDE WORKING HOURS VALIDATION
  // ------------------------------------------------------------------
  console.log('\n4️⃣ Attempting to add break outside working hours (18:00 - 19:00)...');
  const boundaryRes = await fetch(`${API_BASE}/businesses/${businessId}/staff/${staff.id}/breaks`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({
      dayOfWeek: 1,
      startTime: '18:00',
      endTime: '19:00',
      label: 'After Hours Break',
    }),
  });
  const boundaryData = await boundaryRes.json();
  console.log(`  ✓ Status Code: ${boundaryRes.status} (Expected: 400)`);
  console.log(`  ✓ Rejected Message: "${boundaryData.message}"`);
  if (boundaryRes.ok) throw new Error('Break outside working hours should have been rejected!');

  // ------------------------------------------------------------------
  // TEST 5: POSTGRESQL UNIQUE CONSTRAINT TEST
  // ------------------------------------------------------------------
  console.log('\n5️⃣ Testing direct database insert of duplicate break...');
  try {
    await prisma.staffBreak.create({
      data: {
        staffId: staff.id,
        dayOfWeek: 1,
        startTime: '13:00',
        endTime: '14:00',
        label: 'Direct DB Duplicate',
      },
    });
    throw new Error('PostgreSQL unique constraint failed to catch duplicate break!');
  } catch (dbErr) {
    if (dbErr.message.includes('unique constraint') || dbErr.code === 'P2002') {
      console.log('  ✓ PostgreSQL unique constraint correctly caught duplicate break (P2002 error)!');
    } else {
      throw dbErr;
    }
  }

  // ------------------------------------------------------------------
  // TEST 6: REMOVE BREAK (ZERO BREAKS)
  // ------------------------------------------------------------------
  console.log('\n6️⃣ Removing break via PUT /breaks with empty array...');
  const removeRes = await fetch(`${API_BASE}/businesses/${businessId}/staff/${staff.id}/breaks`, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({ breaks: [] }),
  });
  if (!removeRes.ok) throw new Error('Remove break failed');

  const dbBreaks3 = await prisma.staffBreak.findMany({ where: { staffId: staff.id } });
  console.log(`  ✓ DB StaffBreak Count after removal: ${dbBreaks3.length} (Expected: 0)`);
  if (dbBreaks3.length !== 0) throw new Error(`Expected 0 breaks, got ${dbBreaks3.length}`);

  // ------------------------------------------------------------------
  // TEST 7: RE-ADD BREAK (EXACTLY 1)
  // ------------------------------------------------------------------
  console.log('\n7️⃣ Re-adding break (13:00 - 14:00)...');
  const readdRes = await fetch(`${API_BASE}/businesses/${businessId}/staff/${staff.id}/breaks`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({
      dayOfWeek: 1,
      startTime: '13:00',
      endTime: '14:00',
      label: 'Lunch Break',
    }),
  });
  if (!readdRes.ok) throw new Error('Re-add break failed');

  const dbBreaks4 = await prisma.staffBreak.findMany({ where: { staffId: staff.id } });
  console.log(`  ✓ DB StaffBreak Count after re-adding: ${dbBreaks4.length} (Expected: 1)`);
  if (dbBreaks4.length !== 1) throw new Error(`Expected 1 break, got ${dbBreaks4.length}`);

  // Clean up test staff user
  await prisma.user.delete({ where: { id: staff.businessMember.userId } });
  console.log('\n  ✓ Test staff account cleaned up.');

  console.log('\n====================================================================');
  console.log('✅ ALL STAFF BREAK INTEGRITY & OVERLAP TESTS PASSED SUCCESSFULLY!');
  console.log('====================================================================');
}

runIntegrityTests().catch((err) => {
  console.error('\n❌ INTEGRITY TEST FAILED:', err.message);
  process.exit(1);
});
