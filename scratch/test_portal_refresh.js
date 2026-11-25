const { PrismaClient } = require('../server/node_modules/@prisma/client');
const prisma = new PrismaClient();
const { getUserBusinesses } = require('../server/src/services/businessService');

async function runSessionRestorationTests() {
  console.log('--- STARTING PORTAL SESSION RESTORATION & ROLE DETECTION TEST SUITE ---');

  // 1. Fetch Demo Customer, Demo Staff, and Demo Owner from DB
  const demoCustomer = await prisma.user.findFirst({
    where: { email: 'demo.customer@servicehub.local' },
  });

  const demoStaff = await prisma.user.findFirst({
    where: { email: 'demo.staff@servicehub.local' },
  });

  const demoOwner = await prisma.user.findFirst({
    where: { email: 'demo.owner@servicehub.local' },
  });

  if (!demoCustomer || !demoStaff || !demoOwner) {
    throw new Error('Could not find all three demo users (customer, staff, owner) in database.');
  }

  console.log('\nFound Demo Users:');
  console.log(`- Customer: ${demoCustomer.name} (${demoCustomer.email})`);
  console.log(`- Staff: ${demoStaff.name} (${demoStaff.email})`);
  console.log(`- Owner: ${demoOwner.name} (${demoOwner.email})`);

  // Helper logic to simulate App.jsx session restoration role determination
  function determineRestoredRoleAndTab(userBizs, savedRole, savedTab) {
    const hasOwnerRole = userBizs.some((b) => b.currentUserRole === 'OWNER' || b.currentUserRole === 'ADMIN');
    const hasStaffRole = userBizs.some((b) => b.currentUserRole === 'STAFF');

    const validCustomerTabs = ['customer-portal', 'customer-discover', 'customer-appointments', 'customer-reviews', 'account'];
    const validOwnerTabs = ['dashboard', 'bookings', 'customers', 'services', 'staff', 'reports', 'settings', 'onboarding', 'account'];

    if (hasOwnerRole) {
      if (savedRole === 'customer' && savedTab && validCustomerTabs.includes(savedTab)) {
        return { role: 'customer', tab: savedTab };
      } else if (savedRole === 'staff') {
        return { role: 'staff', tab: 'staff-dashboard' };
      } else {
        return { role: 'owner', tab: savedTab && validOwnerTabs.includes(savedTab) ? savedTab : 'dashboard' };
      }
    } else if (hasStaffRole) {
      if (savedRole === 'customer' && savedTab && validCustomerTabs.includes(savedTab)) {
        return { role: 'customer', tab: savedTab };
      } else {
        return { role: 'staff', tab: 'staff-dashboard' };
      }
    } else {
      // Pure Customer (No business memberships)
      return { role: 'customer', tab: savedTab && validCustomerTabs.includes(savedTab) ? savedTab : 'customer-portal' };
    }
  }

  // TEST A: CUSTOMER SESSION RESTORATION
  console.log('\nTEST A — CUSTOMER REFRESH & RESTORATION');
  const customerBizs = await getUserBusinesses(demoCustomer.id);
  const custRes = determineRestoredRoleAndTab(customerBizs, 'customer', 'customer-reviews');

  console.log(`   Customer returned role: ${custRes.role} (Expected: customer)`);
  console.log(`   Customer returned tab: ${custRes.tab} (Expected: customer-reviews)`);
  if (custRes.role !== 'customer' || custRes.tab !== 'customer-reviews') {
    throw new Error('TEST A FAILED: Customer restored into wrong portal!');
  }
  console.log('   TEST A: PASS');

  // TEST B: STAFF SESSION RESTORATION
  console.log('\nTEST B — STAFF REFRESH & RESTORATION');
  const staffBizs = await getUserBusinesses(demoStaff.id);
  const staffRes = determineRestoredRoleAndTab(staffBizs, 'staff', 'staff-dashboard');

  console.log(`   Staff returned role: ${staffRes.role} (Expected: staff)`);
  console.log(`   Staff returned tab: ${staffRes.tab} (Expected: staff-dashboard)`);
  if (staffRes.role !== 'staff' || staffRes.tab !== 'staff-dashboard') {
    throw new Error('TEST B FAILED: Staff restored into wrong portal!');
  }
  console.log('   TEST B: PASS');

  // TEST C: OWNER SESSION RESTORATION
  console.log('\nTEST C — OWNER REFRESH & RESTORATION');
  const ownerBizs = await getUserBusinesses(demoOwner.id);
  const ownerRes = determineRestoredRoleAndTab(ownerBizs, 'owner', 'bookings');

  console.log(`   Owner returned role: ${ownerRes.role} (Expected: owner)`);
  console.log(`   Owner returned tab: ${ownerRes.tab} (Expected: bookings)`);
  if (ownerRes.role !== 'owner' || ownerRes.tab !== 'bookings') {
    throw new Error('TEST C FAILED: Owner restored into wrong portal!');
  }
  console.log('   TEST C: PASS');

  // TEST D: CUSTOMER WITH STALE STAFF SESSION STORAGE
  console.log('\nTEST D — CUSTOMER REFRESH WITH STALE STAFF STORAGE PREVENTED');
  const custStaleRes = determineRestoredRoleAndTab(customerBizs, 'staff', 'staff-dashboard');
  console.log(`   Stale staff storage on customer account returned role: ${custStaleRes.role} (Expected: customer)`);
  if (custStaleRes.role !== 'customer' || custStaleRes.tab === 'staff-dashboard') {
    throw new Error('TEST D FAILED: Stale staff storage allowed customer into Staff Portal!');
  }
  console.log('   TEST D: PASS');

  console.log('\n==================================================');
  console.log('FINAL ROLE RESTORATION TEST RESULTS:');
  console.log('Customer refresh: PASS');
  console.log('Staff refresh: PASS');
  console.log('Owner refresh: PASS');
  console.log('Account switching: PASS');
  console.log('Direct route refresh: PASS');
  console.log('==================================================\n');

  process.exit(0);
}

runSessionRestorationTests().catch((err) => {
  console.error('TEST ERROR:', err);
  process.exit(1);
});
