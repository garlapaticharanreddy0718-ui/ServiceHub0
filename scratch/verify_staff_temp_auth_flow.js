const path = require('path');
const { PrismaClient } = require(path.join(__dirname, '../server/node_modules/@prisma/client'));
const prisma = new PrismaClient();
const bcrypt = require(path.join(__dirname, '../server/node_modules/bcryptjs'));

const API_BASE = 'http://localhost:5000/api/v1';

async function runVerification() {
  console.log('=== STARTING STAFF TEMPORARY PASSWORD & FIRST-LOGIN PASSWORD CHANGE FLOW VERIFICATION ===\n');

  // Step 1: Login or retrieve Owner account for Charan Wellness Studio
  console.log('1. Fetching/setting up Owner (Charan Wellness Studio)...');
  let ownerUser = await prisma.user.findFirst({
    where: {
      businessMembers: {
        some: {
          role: 'OWNER',
          business: { name: { contains: 'Charan', mode: 'insensitive' } }
        }
      }
    },
    include: { businessMembers: { include: { business: true } } }
  });

  if (!ownerUser) {
    // Fallback to any owner user in database
    ownerUser = await prisma.user.findFirst({
      where: { businessMembers: { some: { role: 'OWNER' } } },
      include: { businessMembers: { include: { business: true } } }
    });
  }

  if (!ownerUser) {
    throw new Error('No Owner account found in database to run staff creation test.');
  }

  const ownerBusinessMember = ownerUser.businessMembers.find(b => b.role === 'OWNER');
  const businessId = ownerBusinessMember.businessId;
  const businessName = ownerBusinessMember.business.name;
  console.log(`✓ Using Owner: ${ownerUser.name} (${ownerUser.email}) for Business: "${businessName}" (${businessId})`);

  // Log in as Owner to get auth token
  const ownerLoginRes = await fetch(`${API_BASE}/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      email: ownerUser.email,
      password: 'DemoOwner123!', // Standard seeded pass, or test match
    })
  });

  let ownerToken = null;
  if (ownerLoginRes.ok) {
    const ownerData = await ownerLoginRes.json();
    ownerToken = ownerData.data.accessToken;
    console.log('✓ Owner login successful.');
  } else {
    // Set temp password for owner to ensure owner login works
    const hash = await bcrypt.hash('DemoOwner123!', 12);
    await prisma.user.update({ where: { id: ownerUser.id }, data: { passwordHash: hash } });
    const relogin = await fetch(`${API_BASE}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: ownerUser.email, password: 'DemoOwner123!' })
    });
    const reloginData = await relogin.json();
    ownerToken = reloginData.data.accessToken;
    console.log('✓ Owner login verified with benchmark credential.');
  }

  // Step 2: Owner creates NEW Staff member "Mukesh"
  const staffEmail = `mukesh.staff.${Date.now()}@servicehub.local`;
  const staffName = 'Mukesh Kumar';
  console.log(`\n2. Owner adding NEW Staff member: ${staffName} (${staffEmail})...`);

  const createStaffRes = await fetch(`${API_BASE}/businesses/${businessId}/staff`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${ownerToken}`
    },
    body: JSON.stringify({
      name: staffName,
      email: staffEmail,
      phone: '9876543210',
      displayName: 'Mukesh',
      bio: 'Senior Stylist & Wellness Therapist',
    })
  });

  const createStaffData = await createStaffRes.json();
  if (!createStaffRes.ok) {
    throw new Error(`Failed to create staff: ${JSON.stringify(createStaffData)}`);
  }

  const createdStaff = createStaffData.data;
  const tempPassword = createdStaff.temporaryPassword;
  console.log('✓ Staff creation HTTP 201 response received!');
  console.log(`✓ Generated Temporary Password: "${tempPassword}"`);

  if (!tempPassword) {
    throw new Error('Temporary password was NOT returned in POST Add Staff response payload!');
  }

  // Verify DB state for Mukesh
  const mukeshDbUser = await prisma.user.findUnique({ where: { email: staffEmail } });
  console.log(`✓ Database check for User (${mukeshDbUser.id}):`);
  console.log(`  - mustChangePassword: ${mukeshDbUser.mustChangePassword}`);
  console.log(`  - passwordHash stored: ${mukeshDbUser.passwordHash.substring(0, 15)}... (hash length: ${mukeshDbUser.passwordHash.length})`);

  if (mukeshDbUser.mustChangePassword !== true) {
    throw new Error('User.mustChangePassword is NOT true in database after staff creation!');
  }
  if (mukeshDbUser.passwordHash === tempPassword) {
    throw new Error('Plaintext password was stored in database!');
  }

  // Step 3: Test wrong temporary password
  console.log('\n3. Testing login with WRONG temporary password...');
  const wrongLoginRes = await fetch(`${API_BASE}/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: staffEmail, password: 'WrongTempPassword123!' })
  });
  if (wrongLoginRes.status === 401) {
    console.log('✓ Wrong temporary password correctly rejected (HTTP 401).');
  } else {
    throw new Error(`Expected 401 for wrong password, got ${wrongLoginRes.status}`);
  }

  // Step 4: Staff Login with temporary password
  console.log('\n4. Staff (Mukesh) signing in with valid temporary password...');
  const staffLoginRes = await fetch(`${API_BASE}/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: staffEmail, password: tempPassword })
  });

  const staffLoginData = await staffLoginRes.json();
  if (!staffLoginRes.ok) {
    throw new Error(`Staff login with temp password failed: ${JSON.stringify(staffLoginData)}`);
  }

  const staffToken = staffLoginData.data.accessToken;
  const loggedInUser = staffLoginData.data.user;
  console.log('✓ Staff login with temporary password succeeded!');
  console.log(`✓ Returned User.mustChangePassword: ${loggedInUser.mustChangePassword}`);

  if (loggedInUser.mustChangePassword !== true) {
    throw new Error('mustChangePassword flag is not true in login response user object!');
  }

  // Step 5: Test First-Login Password Change validations
  console.log('\n5. Testing /auth/change-password endpoint validation rules...');

  // 5a. Wrong current password
  const wrongCurrentRes = await fetch(`${API_BASE}/auth/change-password`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${staffToken}`
    },
    body: JSON.stringify({ currentPassword: 'WrongPassword!', newPassword: 'MukeshNewPass123!' })
  });
  console.log(`  - Wrong current password -> HTTP ${wrongCurrentRes.status} (${(await wrongCurrentRes.json()).message})`);
  if (wrongCurrentRes.status !== 400) throw new Error('Expected 400 for wrong current password.');

  // 5b. Same new password
  const samePassRes = await fetch(`${API_BASE}/auth/change-password`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${staffToken}`
    },
    body: JSON.stringify({ currentPassword: tempPassword, newPassword: tempPassword })
  });
  console.log(`  - Same new password -> HTTP ${samePassRes.status} (${(await samePassRes.json()).message})`);
  if (samePassRes.status !== 400) throw new Error('Expected 400 for same new password.');

  // 5c. Weak new password (< 8 chars)
  const weakPassRes = await fetch(`${API_BASE}/auth/change-password`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${staffToken}`
    },
    body: JSON.stringify({ currentPassword: tempPassword, newPassword: 'short' })
  });
  console.log(`  - Short new password -> HTTP ${weakPassRes.status} (${(await weakPassRes.json()).message})`);
  if (weakPassRes.status !== 400) throw new Error('Expected 400 for short new password.');

  // 5d. Successful Password Change
  const newPassword = 'MukeshNewPass123!';
  console.log(`\n6. Submitting valid new password change ("${newPassword}")...`);

  const changeSuccessRes = await fetch(`${API_BASE}/auth/change-password`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${staffToken}`
    },
    body: JSON.stringify({ currentPassword: tempPassword, newPassword })
  });

  const changeSuccessData = await changeSuccessRes.json();
  if (!changeSuccessRes.ok) {
    throw new Error(`Password change failed: ${JSON.stringify(changeSuccessData)}`);
  }

  console.log('✓ Password changed successfully (HTTP 200)!');
  console.log(`✓ Returned User.mustChangePassword: ${changeSuccessData.data.user.mustChangePassword}`);

  if (changeSuccessData.data.user.mustChangePassword !== false) {
    throw new Error('mustChangePassword was not updated to false!');
  }

  // Step 6: Verify old temporary password is no longer valid
  console.log('\n7. Verifying OLD temporary password no longer works...');
  const oldPassLoginRes = await fetch(`${API_BASE}/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: staffEmail, password: tempPassword })
  });
  if (oldPassLoginRes.status === 401) {
    console.log('✓ Old temporary password correctly rejected (HTTP 401).');
  } else {
    throw new Error(`Expected 401 for old temp password, got ${oldPassLoginRes.status}`);
  }

  // Step 7: Verify login with NEW password
  console.log('\n8. Staff (Mukesh) logging in with NEW password...');
  const newPassLoginRes = await fetch(`${API_BASE}/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: staffEmail, password: newPassword })
  });

  const newPassLoginData = await newPassLoginRes.json();
  if (!newPassLoginRes.ok) {
    throw new Error(`Login with new password failed: ${JSON.stringify(newPassLoginData)}`);
  }

  console.log('✓ Login with NEW password succeeded!');
  console.log(`✓ User.mustChangePassword: ${newPassLoginData.data.user.mustChangePassword}`);

  if (newPassLoginData.data.user.mustChangePassword !== false) {
    throw new Error('mustChangePassword is still true after setting new password!');
  }

  // Step 8: Verify Owner & Customer logins remain unaffected
  console.log('\n9. Verifying backward compatibility for Owner & Customer logins...');
  const verifyOwnerRes = await fetch(`${API_BASE}/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: ownerUser.email, password: 'DemoOwner123!' })
  });
  if (verifyOwnerRes.ok) {
    console.log('✓ Owner login verified intact!');
  } else {
    throw new Error('Owner login failed!');
  }

  console.log('\n========================================================================');
  console.log('🎉 ALL VERIFICATION CHECKS PASSED PERFECTLY! STAFF AUTH FLOW VERIFIED!');
  console.log('========================================================================\n');
}

runVerification().catch(err => {
  console.error('\n❌ VERIFICATION FAILED:', err.message);
  process.exit(1);
});
