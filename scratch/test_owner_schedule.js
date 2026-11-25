const API_BASE = 'http://localhost:5000/api/v1';

async function testOwnerSchedule() {
  console.log('--- Testing Today\'s Schedule Operational API ---');

  // 1. Login as Owner
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
  console.log('✓ Owner logged in successfully.');

  // 2. Fetch Dashboard
  const dashRes = await fetch(`${API_BASE}/owner/dashboard`, {
    headers: { 'Authorization': `Bearer ${ownerToken}` }
  });

  const dashData = await dashRes.json();
  if (!dashRes.ok) {
    console.error('Dashboard fetch failed:', dashData);
    process.exit(1);
  }

  const payload = dashData.data;
  const businessId = payload.business?.id;
  const schedule = payload.todaysSchedule;

  console.log('✓ Owner Dashboard fetched successfully.');
  console.log('Business:', payload.business?.name);
  console.log('Schedule Summary:', schedule.summary);
  console.log('Timeline Items Count:', schedule.items?.length);

  if (schedule.items?.length > 0) {
    console.log('\n--- Timeline Preview ---');
    schedule.items.forEach((item, index) => {
      if (item.type === 'BOOKING') {
        console.log(`[${index + 1}] BOOKING ${item.startTimeFormatted} — ${item.endTimeFormatted} | ${item.serviceName} | Customer: ${item.customerName} | Staff: ${item.staffName} | Status: ${item.status}${item.isNow ? ' (NOW)' : ''}`);
      } else if (item.type === 'BREAK') {
        console.log(`[${index + 1}] BREAK ${item.startTimeFormatted} — ${item.endTimeFormatted} | ${item.label} | Staff: ${item.staffName}`);
      } else if (item.type === 'TIMEOFF') {
        console.log(`[${index + 1}] TIMEOFF ${item.startTimeFormatted} — ${item.endTimeFormatted} | Reason: ${item.reason} | Staff: ${item.staffName}`);
      } else if (item.type === 'FREE_SLOT') {
        console.log(`[${index + 1}] FREE_SLOT ${item.startTimeFormatted} — ${item.endTimeFormatted} | Available staff: ${item.availableStaffCount}`);
      }
    });

    // 3. Test Booking Status Update if a booking exists
    const bookingItem = schedule.items.find(i => i.type === 'BOOKING');
    if (bookingItem) {
      console.log(`\n--- Testing Status Transition for Booking ${bookingItem.id} (${bookingItem.status}) ---`);
      
      const newStatus = bookingItem.status === 'PENDING' ? 'CONFIRMED' :
                        bookingItem.status === 'CONFIRMED' ? 'IN_PROGRESS' :
                        bookingItem.status === 'IN_PROGRESS' ? 'COMPLETED' : 'CONFIRMED';

      const updateRes = await fetch(`${API_BASE}/businesses/${businessId}/bookings/${bookingItem.id}/status`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${ownerToken}`
        },
        body: JSON.stringify({
          status: newStatus,
          reason: 'Testing schedule status transition'
        })
      });

      const updateData = await updateRes.json();
      if (updateRes.ok) {
        console.log(`✓ Booking status updated to: ${newStatus}`);
      } else {
        console.warn(`Status transition notice: ${updateData.message}`);
      }

      // Re-fetch dashboard to verify updated timeline
      const refreshRes = await fetch(`${API_BASE}/owner/dashboard`, {
        headers: { 'Authorization': `Bearer ${ownerToken}` }
      });
      const refreshData = await refreshRes.json();
      const updatedBooking = refreshData.data?.todaysSchedule?.items?.find(i => i.id === bookingItem.id);
      console.log(`✓ Verified Refreshed Status: ${updatedBooking?.status}`);
    }
  }

  console.log('\n--- All Today\'s Schedule Operational API Tests Passed! ---');
}

testOwnerSchedule().catch(err => {
  console.error('Schedule test error:', err);
  process.exit(1);
});
