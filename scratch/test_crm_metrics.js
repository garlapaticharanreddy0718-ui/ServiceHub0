const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
const { getCustomers, getCustomerById } = require('../server/src/services/customerService');

async function testMetrics() {
  try {
    const kohli = await prisma.customer.findFirst({
      where: { name: { contains: 'Virat', mode: 'insensitive' } },
      include: { bookings: true }
    });

    if (!kohli) {
      console.log('Virat Kohli not found in database.');
      return;
    }

    console.log('Customer ID:', kohli.id);
    console.log('Business ID:', kohli.businessId);

    const fullDetails = await getCustomerById(kohli.businessId, kohli.id);

    console.log('--- CRM METRICS FOR VIRAT KOHLI ---');
    console.log('Appointments Count:', fullDetails.appointmentsCount);
    console.log('Visits Count:', fullDetails.visitsCount);
    console.log('Returning Customer:', fullDetails.isReturning ? 'Yes' : 'No');
    console.log('Last Appointment (Completed Only):', fullDetails.lastBooking ? fullDetails.lastBooking.startTime : 'No previous visit');
    console.log('Next Appointment (Future Pending/Confirmed):', fullDetails.nextBooking ? `${fullDetails.nextBooking.startTime} (${fullDetails.nextBooking.status})` : 'No upcoming appointment');

  } catch (err) {
    console.error('Test error:', err);
  } finally {
    await prisma.$disconnect();
  }
}

testMetrics();
