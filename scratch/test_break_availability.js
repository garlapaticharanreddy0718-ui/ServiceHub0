const path = require('path');
const { PrismaClient } = require(path.join(__dirname, '../server/node_modules/@prisma/client'));
const prisma = new PrismaClient();

const API_BASE = 'http://localhost:5000/api/v1';

async function testAvailability() {
  console.log('====================================================');
  console.log('STAFF BREAK AVAILABILITY BLOCKING TEST SUITE');
  console.log('====================================================\n');

  // Authenticate as Demo Customer
  const loginRes = await fetch(`${API_BASE}/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: 'demo.customer@servicehub.local', password: 'DemoCustomer123!' }),
  });
  if (!loginRes.ok) throw new Error('Customer login failed');
  const loginData = await loginRes.json();
  const token = loginData.data.accessToken;

  // Find Glow & Style Beauty Studio
  const biz = await prisma.business.findFirst({
    where: { name: 'Glow & Style Beauty Studio' },
  });
  if (!biz) throw new Error('Glow & Style Beauty Studio not found');

  // Find Kiran Kumar staff profile
  const kiran = await prisma.staff.findFirst({
    where: {
      businessMember: {
        businessId: biz.id,
        user: { email: 'kiran.staff@servicehub.local' }
      }
    },
    include: { breaks: true, schedules: true, staffServices: { include: { service: true } } }
  });

  if (!kiran) throw new Error('Kiran Kumar staff profile not found');
  console.log(`✓ Resolved Staff: ${kiran.displayName} (ID: ${kiran.id})`);
  console.log(`  Breaks:`, kiran.breaks.map(b => `[Day ${b.dayOfWeek}: ${b.startTime}-${b.endTime}]`).join(', '));

  const service = kiran.staffServices[0]?.service;
  if (!service) throw new Error('No service assigned to Kiran');

  const customer = await prisma.customer.findFirst({
    where: { businessId: biz.id, email: 'demo.customer@servicehub.local' }
  });
  if (!customer) throw new Error('Customer not found');

  // Target next Monday's date at 13:00 (during 13:00 - 14:00 break)
  const now = new Date();
  const nextMon = new Date(now);
  nextMon.setDate(now.getDate() + ((1 + 7 - now.getDay()) % 7 || 7));
  nextMon.setHours(13, 0, 0, 0);

  console.log(`\nAttempting to book appointment during Kiran's break time (${nextMon.toISOString()})...`);

  const bookingRes = await fetch(`${API_BASE}/businesses/${biz.id}/bookings`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`
    },
    body: JSON.stringify({
      customerId: customer.id,
      serviceId: service.id,
      staffId: kiran.id,
      startTime: nextMon.toISOString(),
      notes: 'Test booking during break'
    })
  });

  const bookingData = await bookingRes.json();
  console.log(`  ✓ Response Status: ${bookingRes.status} (Expected: 400)`);
  console.log(`  ✓ Response Message: "${bookingData.message}"`);

  if (bookingRes.ok) {
    throw new Error('Booking during staff break should have been rejected!');
  }

  if (!bookingData.message?.includes('break')) {
    throw new Error(`Expected break rejection message, got: '${bookingData.message}'`);
  }

  console.log('\n====================================================');
  console.log('🎉 STAFF BREAK AVAILABILITY BLOCKING TEST PASSED!');
  console.log('====================================================');
}

testAvailability().catch(err => {
  console.error('\n❌ AVAILABILITY TEST FAILED:', err.message);
  process.exit(1);
}).finally(() => prisma.$disconnect());
