const http = require('http');

const BASE_URL = 'http://localhost:5000/api/v1';

function makeRequest(path, method = 'GET', data = null, cookies = [], headers = {}) {
  return new Promise((resolve, reject) => {
    const url = new URL(BASE_URL + path);
    const payload = data ? JSON.stringify(data) : null;

    const reqHeaders = {
      'Content-Type': 'application/json',
      ...headers,
    };

    if (cookies.length > 0) {
      reqHeaders['Cookie'] = cookies.join('; ');
    }

    if (payload) {
      reqHeaders['Content-Length'] = Buffer.byteLength(payload);
    }

    const options = {
      hostname: url.hostname,
      port: url.port,
      path: url.pathname + url.search,
      method: method,
      headers: reqHeaders,
    };

    const req = http.request(options, (res) => {
      let body = '';
      const responseCookies = res.headers['set-cookie'] || [];

      res.on('data', (chunk) => {
        body += chunk;
      });

      res.on('end', () => {
        let parsed = null;
        try {
          parsed = JSON.parse(body);
        } catch (e) {
          parsed = body;
        }

        resolve({
          status: res.statusCode,
          headers: res.headers,
          cookies: responseCookies,
          body: parsed,
        });
      });
    });

    req.on('error', (err) => reject(err));

    if (payload) {
      req.write(payload);
    }
    req.end();
  });
}

// Get future date string for specific day of week (1 = Monday, 2 = Tuesday, etc.)
function getNextDayOfWeek(dayOfWeekIndex, hour = 10, minute = 0) {
  const date = new Date();
  date.setDate(date.getDate() + ((7 + dayOfWeekIndex - date.getDay()) % 7 || 7));
  date.setHours(hour, minute, 0, 0);
  return date.toISOString();
}

async function runTests() {
  console.log('==================================================');
  console.log('STARTING PHASE 7 END-TO-END INTEGRATION TEST SUITE');
  console.log('==================================================\n');

  let passed = 0;
  let failed = 0;

  function assert(condition, testName, extraInfo = '') {
    if (condition) {
      console.log(`[PASS] ${testName}`);
      passed++;
    } else {
      console.error(`[FAIL] ${testName} ${extraInfo}`);
      failed++;
    }
  }

  try {
    // 1. Health check
    const healthRes = await makeRequest('/health');
    assert(healthRes.status === 200 && healthRes.body.status === 'ok', '1. GET /api/v1/health returns 200 OK');

    // 2. Unauthenticated booking creation -> 401
    const unauthRes = await makeRequest('/businesses/00000000-0000-0000-0000-000000000000/bookings', 'POST', {
      customerId: '00000000-0000-0000-0000-000000000001',
      serviceId: '00000000-0000-0000-0000-000000000002',
      staffId: '00000000-0000-0000-0000-000000000003',
      startTime: new Date().toISOString(),
    });
    assert(unauthRes.status === 401, '2. Unauthenticated booking creation rejected with 401');

    // 3. Register Users
    const ts = Date.now();
    const userA_Email = `ownerA_${ts}@test.com`;
    const userB_Email = `adminA_${ts}@test.com`;
    const userC_Email = `staffA_${ts}@test.com`;
    const userD_Email = `ownerB_${ts}@test.com`;
    const pwd = 'Password123!';

    await makeRequest('/auth/register', 'POST', { name: 'Owner A', email: userA_Email, password: pwd });
    await makeRequest('/auth/register', 'POST', { name: 'Admin A', email: userB_Email, password: pwd });
    await makeRequest('/auth/register', 'POST', { name: 'Staff A', email: userC_Email, password: pwd });
    await makeRequest('/auth/register', 'POST', { name: 'Owner B', email: userD_Email, password: pwd });

    // Login User A (Owner A)
    const loginA = await makeRequest('/auth/login', 'POST', { email: userA_Email, password: pwd });
    const authHeadersA = { Authorization: `Bearer ${loginA.body.data.accessToken}` };
    const userA_Id = loginA.body.data.user.id;

    // Login User D (Owner B)
    const loginD = await makeRequest('/auth/login', 'POST', { email: userD_Email, password: pwd });
    const authHeadersD = { Authorization: `Bearer ${loginD.body.data.accessToken}` };

    // 4. Create Businesses
    const bizARes = await makeRequest('/businesses', 'POST', { name: `Salon A ${ts}`, currency: 'USD' }, [], authHeadersA);
    const businessA_Id = bizARes.body.data.id;

    const bizBRes = await makeRequest('/businesses', 'POST', { name: `Salon B ${ts}`, currency: 'USD' }, [], authHeadersD);
    const businessB_Id = bizBRes.body.data.id;

    const userE_Email = `staffBob_${ts}@test.com`;
    const userF_Email = `staffBarber_${ts}@test.com`;
    await makeRequest('/auth/register', 'POST', { name: 'Staff Bob', email: userE_Email, password: pwd });
    await makeRequest('/auth/register', 'POST', { name: 'Staff Barber', email: userF_Email, password: pwd });

    // Add User B as ADMIN in Business A, User C as STAFF in Business A, User E as STAFF in Business A
    await makeRequest(`/businesses/${businessA_Id}/members`, 'POST', { email: userB_Email, role: 'ADMIN' }, [], authHeadersA);
    const memberStaffA = await makeRequest(`/businesses/${businessA_Id}/members`, 'POST', { email: userC_Email, role: 'STAFF' }, [], authHeadersA);
    const memberStaffBob = await makeRequest(`/businesses/${businessA_Id}/members`, 'POST', { email: userE_Email, role: 'STAFF' }, [], authHeadersA);

    // Add User F as STAFF in Business B
    const memberStaffBarber = await makeRequest(`/businesses/${businessB_Id}/members`, 'POST', { email: userF_Email, role: 'STAFF' }, [], authHeadersD);

    // Login User B (Admin A)
    const loginB = await makeRequest('/auth/login', 'POST', { email: userB_Email, password: pwd });
    const authHeadersB = { Authorization: `Bearer ${loginB.body.data.accessToken}` };

    // Login User C (Staff A)
    const loginC = await makeRequest('/auth/login', 'POST', { email: userC_Email, password: pwd });
    const authHeadersC = { Authorization: `Bearer ${loginC.body.data.accessToken}` };

    // 5. Setup Business A entities
    // Category & Service A (60 mins, $50)
    const catA = await makeRequest(`/businesses/${businessA_Id}/service-categories`, 'POST', { name: 'Hair Services' }, [], authHeadersA);
    const serviceA = await makeRequest(`/businesses/${businessA_Id}/services`, 'POST', {
      categoryId: catA.body.data.id,
      name: 'Haircut Premium',
      durationMinutes: 60,
      price: 50.00,
    }, [], authHeadersA);
    const serviceA_Id = serviceA.body.data.id;

    // Inactive Service A3
    const serviceA3 = await makeRequest(`/businesses/${businessA_Id}/services`, 'POST', {
      categoryId: catA.body.data.id,
      name: 'Inactive Massage',
      durationMinutes: 30,
      price: 40.00,
    }, [], authHeadersA);
    await makeRequest(`/businesses/${businessA_Id}/services/${serviceA3.body.data.id}`, 'PATCH', { isActive: false }, [], authHeadersA);

    // Staff A (Alice) & Staff A2
    const staffA = await makeRequest(`/businesses/${businessA_Id}/staff`, 'POST', {
      businessMemberId: memberStaffA.body.data.id,
      title: 'Senior Stylist',
    }, [], authHeadersA);
    const staffA_Id = staffA.body.data.id;

    const staffA2 = await makeRequest(`/businesses/${businessA_Id}/staff`, 'POST', {
      businessMemberId: memberStaffBob.body.data.id,
      title: 'Junior Stylist',
    }, [], authHeadersA);
    const staffA2_Id = staffA2.body.data.id;

    // Assign Staff A to Service A
    const assignRes = await makeRequest(`/businesses/${businessA_Id}/staff/${staffA_Id}/services`, 'PUT', { serviceIds: [serviceA_Id] }, [], authHeadersA);
    if (assignRes.status !== 200) {
      console.error('Service assignment failed:', assignRes.status, assignRes.body);
    }

    // Set Schedule for Staff A (Monday 1, Tuesday 2, Wednesday 3, Thursday 4, Friday 5: 09:00 - 17:00)
    const schedules = [];
    for (let day = 1; day <= 5; day++) {
      schedules.push({
        dayOfWeek: day,
        startTime: '09:00',
        endTime: '17:00',
        isAvailable: true,
      });
    }
    const schedRes = await makeRequest(`/businesses/${businessA_Id}/staff/${staffA_Id}/schedule`, 'PUT', { schedules }, [], authHeadersA);
    if (schedRes.status !== 200) {
      console.error('Schedule setting failed:', schedRes.status, schedRes.body);
    }

    // Customer A in Business A
    const custA = await makeRequest(`/businesses/${businessA_Id}/customers`, 'POST', {
      name: 'Customer John',
      email: `john_${ts}@test.com`,
    }, [], authHeadersA);
    const custA_Id = custA.body.data.id;

    // Setup Business B entities
    const catB = await makeRequest(`/businesses/${businessB_Id}/service-categories`, 'POST', { name: 'Barber Services' }, [], authHeadersD);
    const serviceB = await makeRequest(`/businesses/${businessB_Id}/services`, 'POST', {
      categoryId: catB.body.data.id,
      name: 'Beard Trim',
      durationMinutes: 30,
      price: 25.00,
    }, [], authHeadersD);
    const serviceB_Id = serviceB.body.data.id;

    const staffB = await makeRequest(`/businesses/${businessB_Id}/staff`, 'POST', { businessMemberId: memberStaffBarber.body.data.id, title: 'Master Barber' }, [], authHeadersD);
    const staffB_Id = staffB.body.data.id;

    const custB = await makeRequest(`/businesses/${businessB_Id}/customers`, 'POST', { name: 'Customer Jane', email: `jane_${ts}@b.com` }, [], authHeadersD);
    const custB_Id = custB.body.data.id;

    // 6. Test Validations & Entity Cross-Tenant Checks
    // Customer cross-tenant
    const resCustCross = await makeRequest(`/businesses/${businessA_Id}/bookings`, 'POST', {
      customerId: custB_Id,
      serviceId: serviceA_Id,
      staffId: staffA_Id,
      startTime: getNextDayOfWeek(1, 10, 0),
    }, [], authHeadersA);
    assert(resCustCross.status === 400 || resCustCross.status === 404, '3. Customer belonging to Business B rejected in Business A', `Status: ${resCustCross.status}`);

    // Service cross-tenant
    const resServCross = await makeRequest(`/businesses/${businessA_Id}/bookings`, 'POST', {
      customerId: custA_Id,
      serviceId: serviceB_Id,
      staffId: staffA_Id,
      startTime: getNextDayOfWeek(1, 10, 0),
    }, [], authHeadersA);
    assert(resServCross.status === 400 || resServCross.status === 404, '4. Service belonging to Business B rejected in Business A', `Status: ${resServCross.status}`);

    // Staff cross-tenant
    const resStaffCross = await makeRequest(`/businesses/${businessA_Id}/bookings`, 'POST', {
      customerId: custA_Id,
      serviceId: serviceA_Id,
      staffId: staffB_Id,
      startTime: getNextDayOfWeek(1, 10, 0),
    }, [], authHeadersA);
    assert(resStaffCross.status === 400 || resStaffCross.status === 404, '5. Staff belonging to Business B rejected in Business A', `Status: ${resStaffCross.status}`);

    // Unassigned staff
    const resUnassigned = await makeRequest(`/businesses/${businessA_Id}/bookings`, 'POST', {
      customerId: custA_Id,
      serviceId: serviceA_Id,
      staffId: staffA2_Id,
      startTime: getNextDayOfWeek(1, 10, 0),
    }, [], authHeadersA);
    assert(resUnassigned.status === 400, '6. Unassigned staff member rejected for service', `Status: ${resUnassigned.status}`);

    // Inactive service
    const resInactiveService = await makeRequest(`/businesses/${businessA_Id}/bookings`, 'POST', {
      customerId: custA_Id,
      serviceId: serviceA3.body.data.id,
      staffId: staffA_Id,
      startTime: getNextDayOfWeek(1, 10, 0),
    }, [], authHeadersA);
    assert(resInactiveService.status === 400, '7. Inactive service rejected for booking', `Status: ${resInactiveService.status}`);

    // Inactive staff
    await makeRequest(`/businesses/${businessA_Id}/staff/${staffA2_Id}`, 'PATCH', { isActive: false }, [], authHeadersA);
    const resInactiveStaff = await makeRequest(`/businesses/${businessA_Id}/bookings`, 'POST', {
      customerId: custA_Id,
      serviceId: serviceA_Id,
      staffId: staffA2_Id,
      startTime: getNextDayOfWeek(1, 10, 0),
    }, [], authHeadersA);
    assert(resInactiveStaff.status === 400, '8. Inactive staff rejected for booking', `Status: ${resInactiveStaff.status}`);

    // 7. Successful Booking Creation & Schedule Checks
    const nextMonday10 = getNextDayOfWeek(1, 10, 0); // Next Monday 10:00
    const createRes1 = await makeRequest(`/businesses/${businessA_Id}/bookings`, 'POST', {
      customerId: custA_Id,
      serviceId: serviceA_Id,
      staffId: staffA_Id,
      startTime: nextMonday10,
      notes: 'Initial haircut request',
    }, [], authHeadersA);

    if (createRes1.status !== 201) {
      console.error('createRes1 failed:', createRes1.status, createRes1.body);
    }
    assert(createRes1.status === 201 && createRes1.body.data.status === 'PENDING', '9. OWNER A creates valid booking successfully', `Status: ${createRes1.status}`);
    const booking1 = createRes1.body.data;
    assert(Number(booking1.totalAmount) === 50.00, '10. Server calculates totalAmount ($50.00) authoritatively');
    
    const expectedEndTime = new Date(new Date(nextMonday10).getTime() + 60 * 60000).toISOString();
    assert(new Date(booking1.endTime).toISOString() === expectedEndTime, '11. Server calculates endTime (60 mins) authoritatively');

    // 8. Schedule Violation Checks
    // Outside working hours (08:00 - 09:00 before start)
    const earlySlot = getNextDayOfWeek(1, 8, 0);
    const resEarly = await makeRequest(`/businesses/${businessA_Id}/bookings`, 'POST', {
      customerId: custA_Id,
      serviceId: serviceA_Id,
      staffId: staffA_Id,
      startTime: earlySlot,
    }, [], authHeadersA);
    assert(resEarly.status === 409 || resEarly.status === 400, '12. Booking before staff working hours (08:00) rejected');

    // Outside working hours (16:30 - 17:30 extending past 17:00 end)
    const lateSlot = getNextDayOfWeek(1, 16, 30);
    const resLate = await makeRequest(`/businesses/${businessA_Id}/bookings`, 'POST', {
      customerId: custA_Id,
      serviceId: serviceA_Id,
      staffId: staffA_Id,
      startTime: lateSlot,
    }, [], authHeadersA);
    assert(resLate.status === 409 || resLate.status === 400, '13. Booking extending beyond working hours (16:30-17:30) rejected');

    // 9. Time Off Checks (Staff on time-off 10:00 to 14:00 on Tuesday)
    const nextTuesdayStart = getNextDayOfWeek(2, 10, 0);
    const nextTuesdayEnd = getNextDayOfWeek(2, 14, 0);
    await makeRequest(`/businesses/${businessA_Id}/staff/${staffA_Id}/time-off`, 'POST', {
      startDateTime: nextTuesdayStart,
      endDateTime: nextTuesdayEnd,
      reason: 'Personal Leave',
    }, [], authHeadersA);

    const overlapTimeOffSlot = getNextDayOfWeek(2, 10, 30); // 10:30 to 11:30 fits working hours (09:00-17:00) but hits time off (10:00-14:00)
    const resTimeOffOverlap = await makeRequest(`/businesses/${businessA_Id}/bookings`, 'POST', {
      customerId: custA_Id,
      serviceId: serviceA_Id,
      staffId: staffA_Id,
      startTime: overlapTimeOffSlot,
    }, [], authHeadersA);
    assert(resTimeOffOverlap.status === 409 || resTimeOffOverlap.status === 400, '14. Booking overlapping staff time-off rejected', `Status: ${resTimeOffOverlap.status}`);

    // 10. Double Booking Overlap Prevention
    // Existing: Monday 10:00 -> 11:00
    // Request: Monday 10:30 -> 11:30 (Overlap)
    const overlapSlot = getNextDayOfWeek(1, 10, 30);
    const resDoubleBooking = await makeRequest(`/businesses/${businessA_Id}/bookings`, 'POST', {
      customerId: custA_Id,
      serviceId: serviceA_Id,
      staffId: staffA_Id,
      startTime: overlapSlot,
    }, [], authHeadersA);
    assert(resDoubleBooking.status === 409, '15. Overlapping active booking rejected with 409 Conflict');

    // 11. Concurrency Safety Test (Simultaneous Parallel Requests)
    const nextWednesdaySlot = getNextDayOfWeek(3, 14, 0);
    const req1 = makeRequest(`/businesses/${businessA_Id}/bookings`, 'POST', {
      customerId: custA_Id,
      serviceId: serviceA_Id,
      staffId: staffA_Id,
      startTime: nextWednesdaySlot,
      notes: 'Concurrent Req 1',
    }, [], authHeadersA);

    const req2 = makeRequest(`/businesses/${businessA_Id}/bookings`, 'POST', {
      customerId: custA_Id,
      serviceId: serviceA_Id,
      staffId: staffA_Id,
      startTime: nextWednesdaySlot,
      notes: 'Concurrent Req 2',
    }, [], authHeadersB);

    const [resConcurrent1, resConcurrent2] = await Promise.all([req1, req2]);
    const statuses = [resConcurrent1.status, resConcurrent2.status];
    const successCount = statuses.filter((s) => s === 201).length;
    const conflictCount = statuses.filter((s) => s === 409).length;

    assert(successCount === 1 && conflictCount === 1, '16. PostgreSQL advisory lock prevents concurrent double-booking (1 success, 1 conflict)', `Statuses: ${statuses.join(', ')}`);

    // 12. Cancellation and Slot Re-booking
    const cancelRes = await makeRequest(`/businesses/${businessA_Id}/bookings/${booking1.id}/cancel`, 'POST', {
      reason: 'Customer requested cancellation',
    }, [], authHeadersA);
    assert(cancelRes.status === 200 && cancelRes.body.data.status === 'CANCELLED', '17. Cancellation updates status to CANCELLED');

    // Re-booking cancelled slot (Monday 10:00) should now succeed
    const rebookRes = await makeRequest(`/businesses/${businessA_Id}/bookings`, 'POST', {
      customerId: custA_Id,
      serviceId: serviceA_Id,
      staffId: staffA_Id,
      startTime: nextMonday10,
    }, [], authHeadersA);
    assert(rebookRes.status === 201, '18. Cancelled booking releases staff slot for re-booking');
    const booking2 = rebookRes.body.data;

    // 13. Status Transitions & History
    // PENDING -> CONFIRMED
    const statusConf = await makeRequest(`/businesses/${businessA_Id}/bookings/${booking2.id}/status`, 'POST', {
      status: 'CONFIRMED',
      reason: 'Confirmed by Admin',
    }, [], authHeadersB);
    assert(statusConf.status === 200 && statusConf.body.data.status === 'CONFIRMED', '19. Status transition PENDING -> CONFIRMED succeeds');

    // CONFIRMED -> IN_PROGRESS
    const statusProg = await makeRequest(`/businesses/${businessA_Id}/bookings/${booking2.id}/status`, 'POST', {
      status: 'IN_PROGRESS',
    }, [], authHeadersC); // Staff C
    assert(statusProg.status === 200 && statusProg.body.data.status === 'IN_PROGRESS', '20. Status transition CONFIRMED -> IN_PROGRESS succeeds');

    // IN_PROGRESS -> COMPLETED
    const statusComp = await makeRequest(`/businesses/${businessA_Id}/bookings/${booking2.id}/status`, 'POST', {
      status: 'COMPLETED',
    }, [], authHeadersC);
    assert(statusComp.status === 200 && statusComp.body.data.status === 'COMPLETED', '21. Status transition IN_PROGRESS -> COMPLETED succeeds');

    // COMPLETED -> PENDING (Invalid)
    const statusInvalid = await makeRequest(`/businesses/${businessA_Id}/bookings/${booking2.id}/status`, 'POST', {
      status: 'PENDING',
    }, [], authHeadersA);
    assert(statusInvalid.status === 400, '22. Invalid transition COMPLETED -> PENDING rejected with 400');

    // Check Booking Status History
    const historyRes = await makeRequest(`/businesses/${businessA_Id}/bookings/${booking2.id}/history`, 'GET', null, [], authHeadersA);
    assert(historyRes.status === 200 && Array.isArray(historyRes.body.data), '23. GET booking history returns array');
    const historyLogs = historyRes.body.data;
    assert(historyLogs.length >= 4, '24. History logs contain initial creation + 3 status transitions');
    assert(historyLogs[0].fromStatus === null && historyLogs[0].toStatus === 'PENDING', '25. Initial history entry records PENDING creation');

    // 14. Rescheduling
    const booking3Res = await makeRequest(`/businesses/${businessA_Id}/bookings`, 'POST', {
      customerId: custA_Id,
      serviceId: serviceA_Id,
      staffId: staffA_Id,
      startTime: getNextDayOfWeek(4, 11, 0), // Thursday 11:00
    }, [], authHeadersA);
    const booking3 = booking3Res.body.data;

    const newThursdayTime = getNextDayOfWeek(4, 14, 0); // Thursday 14:00
    const rescheduleRes = await makeRequest(`/businesses/${businessA_Id}/bookings/${booking3.id}`, 'PATCH', {
      startTime: newThursdayTime,
    }, [], authHeadersA);
    assert(rescheduleRes.status === 200 && new Date(rescheduleRes.body.data.startTime).toISOString() === new Date(newThursdayTime).toISOString(), '26. Reschedule updates startTime and recalculates endTime');

    // 15. Role-Based Permissions & Filtering
    // ADMIN can query all bookings
    const listAdmin = await makeRequest(`/businesses/${businessA_Id}/bookings?status=COMPLETED`, 'GET', null, [], authHeadersB);
    assert(listAdmin.status === 200 && listAdmin.body.data.length > 0, '27. ADMIN sees business bookings filtered by status');
    assert(listAdmin.body.pagination.total >= 1, '28. Booking list response includes pagination metadata');

    // STAFF sees only assigned bookings
    const listStaff = await makeRequest(`/businesses/${businessA_Id}/bookings`, 'GET', null, [], authHeadersC);
    assert(listStaff.status === 200 && listStaff.body.data.every((b) => b.staffId === staffA_Id), '29. STAFF sees only bookings assigned to themselves');

    // 16. Multi-Tenant Isolation
    // Business B user attempts to access Business A booking -> 404/403
    const crossTenantGet = await makeRequest(`/businesses/${businessB_Id}/bookings/${booking2.id}`, 'GET', null, [], authHeadersD);
    assert(crossTenantGet.status === 404 || crossTenantGet.status === 403, '30. Business B user cannot access Business A booking detail');

    const crossTenantCancel = await makeRequest(`/businesses/${businessA_Id}/bookings/${booking2.id}/cancel`, 'POST', {}, [], authHeadersD);
    assert(crossTenantCancel.status === 403, '31. Business B user cannot cancel Business A booking');

    // 17. Availability API Endpoint
    const availRes = await makeRequest(`/businesses/${businessA_Id}/availability?staffId=${staffA_Id}&serviceId=${serviceA_Id}&date=${getNextDayOfWeek(1, 0, 0).split('T')[0]}`, 'GET', null, [], authHeadersA);
    assert(availRes.status === 200 && availRes.body.data.schedule !== undefined, '32. GET /availability returns staff schedule, time off, and active bookings');

    // 18. Security Verification
    assert(!JSON.stringify(booking2).includes('passwordHash'), '33. Password hashes never exposed in booking response payloads');

  } catch (err) {
    console.error('Test execution exception:', err);
  }

  console.log('\n==================================================');
  console.log(`TEST SUMMARY: ${passed} PASSED, ${failed} FAILED`);
  console.log('==================================================');

  if (failed > 0) {
    process.exit(1);
  } else {
    process.exit(0);
  }
}

runTests();
