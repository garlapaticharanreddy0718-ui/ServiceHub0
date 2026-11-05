const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

const prisma = new PrismaClient();

async function seed() {
  console.log('🌱 Starting ServiceHub idempotent demo database seed...');

  // 1. Hash Passwords
  const ownerPasswordHash = await bcrypt.hash('DemoOwner123!', 12);
  const staffPasswordHash = await bcrypt.hash('DemoStaff123!', 12);
  const customerPasswordHash = await bcrypt.hash('DemoCustomer123!', 12);
  const genericPasswordHash = await bcrypt.hash('ServiceHub123!', 12);

  // 2. Seed Users
  console.log('👤 Seeding Demo Users...');
  const demoOwnerUser = await prisma.user.upsert({
    where: { email: 'demo.owner@servicehub.local' },
    update: { name: 'Vikram Malhotra', phone: '+91 98765 43210', passwordHash: ownerPasswordHash },
    create: {
      name: 'Vikram Malhotra',
      email: 'demo.owner@servicehub.local',
      passwordHash: ownerPasswordHash,
      phone: '+91 98765 43210',
    },
  });

  const demoStaffUser = await prisma.user.upsert({
    where: { email: 'demo.staff@servicehub.local' },
    update: { name: 'Priya Sharma', phone: '+91 98765 11223', passwordHash: staffPasswordHash },
    create: {
      name: 'Priya Sharma',
      email: 'demo.staff@servicehub.local',
      passwordHash: staffPasswordHash,
      phone: '+91 98765 11223',
    },
  });

  const staffUser2 = await prisma.user.upsert({
    where: { email: 'rahul.staff@servicehub.local' },
    update: { name: 'Rahul Verma', phone: '+91 98765 44556' },
    create: {
      name: 'Rahul Verma',
      email: 'rahul.staff@servicehub.local',
      passwordHash: genericPasswordHash,
      phone: '+91 98765 44556',
    },
  });

  const demoCustomerUser = await prisma.user.upsert({
    where: { email: 'demo.customer@servicehub.local' },
    update: { name: 'Ananya Roy', phone: '+91 91234 56789', passwordHash: customerPasswordHash },
    create: {
      name: 'Ananya Roy',
      email: 'demo.customer@servicehub.local',
      passwordHash: customerPasswordHash,
      phone: '+91 91234 56789',
    },
  });

  const fitzoneOwnerUser = await prisma.user.upsert({
    where: { email: 'fitzone.owner@servicehub.local' },
    update: { name: 'Rajesh Fitness', phone: '+91 91122 33445' },
    create: {
      name: 'Rajesh Fitness',
      email: 'fitzone.owner@servicehub.local',
      passwordHash: genericPasswordHash,
      phone: '+91 91122 33445',
    },
  });

  const fitzoneStaffUser = await prisma.user.upsert({
    where: { email: 'fitzone.staff@servicehub.local' },
    update: { name: 'Karan Trainer', phone: '+91 91122 99887' },
    create: {
      name: 'Karan Trainer',
      email: 'fitzone.staff@servicehub.local',
      passwordHash: genericPasswordHash,
      phone: '+91 91122 99887',
    },
  });

  const quickfixOwnerUser = await prisma.user.upsert({
    where: { email: 'quickfix.owner@servicehub.local' },
    update: { name: 'Suresh Kumar', phone: '+91 95566 77889' },
    create: {
      name: 'Suresh Kumar',
      email: 'quickfix.owner@servicehub.local',
      passwordHash: genericPasswordHash,
      phone: '+91 95566 77889',
    },
  });

  const quickfixStaffUser = await prisma.user.upsert({
    where: { email: 'quickfix.staff@servicehub.local' },
    update: { name: 'Amit Tech', phone: '+91 95566 11223' },
    create: {
      name: 'Amit Tech',
      email: 'quickfix.staff@servicehub.local',
      passwordHash: genericPasswordHash,
      phone: '+91 95566 11223',
    },
  });

  // 3. Seed Businesses
  console.log('🏢 Seeding Businesses...');
  let beautyStudio = await prisma.business.findFirst({
    where: { name: 'Glow & Style Beauty Studio' },
  });
  if (!beautyStudio) {
    beautyStudio = await prisma.business.create({
      data: {
        name: 'Glow & Style Beauty Studio',
        category: 'Beauty & Salon',
        city: 'Hyderabad',
        address: 'Road No. 36, Jubilee Hills, Hyderabad, Telangana 500033',
        latitude: 17.4399,
        longitude: 78.4483,
        phone: '+91 98765 43210',
        description:
          'Premier full-service beauty salon & styling studio providing modern hair care, facial therapies, spa treatments, and nail artistry.',
      },
    });
  } else {
    beautyStudio = await prisma.business.update({
      where: { id: beautyStudio.id },
      data: {
        category: 'Beauty & Salon',
        city: 'Hyderabad',
        address: 'Road No. 36, Jubilee Hills, Hyderabad, Telangana 500033',
        latitude: 17.4399,
        longitude: 78.4483,
        phone: '+91 98765 43210',
        description:
          'Premier full-service beauty salon & styling studio providing modern hair care, facial therapies, spa treatments, and nail artistry.',
      },
    });
  }

  let fitzone = await prisma.business.findFirst({
    where: { name: 'FitZone Fitness Center' },
  });
  if (!fitzone) {
    fitzone = await prisma.business.create({
      data: {
        name: 'FitZone Fitness Center',
        category: 'Fitness & Gym',
        city: 'Hyderabad',
        address: 'Kavuri Hills, Madhapur, Hyderabad, Telangana 500081',
        latitude: 17.4435,
        longitude: 78.3772,
        phone: '+91 91122 33445',
        description:
          'Modern fitness studio offering personalized weight training, group yoga sessions, and functional body conditioning.',
      },
    });
  } else {
    fitzone = await prisma.business.update({
      where: { id: fitzone.id },
      data: {
        category: 'Fitness & Gym',
        city: 'Hyderabad',
        address: 'Kavuri Hills, Madhapur, Hyderabad, Telangana 500081',
        latitude: 17.4435,
        longitude: 78.3772,
        phone: '+91 91122 33445',
        description:
          'Modern fitness studio offering personalized weight training, group yoga sessions, and functional body conditioning.',
      },
    });
  }

  let quickfix = await prisma.business.findFirst({
    where: { name: 'QuickFix Home Services' },
  });
  if (!quickfix) {
    quickfix = await prisma.business.create({
      data: {
        name: 'QuickFix Home Services',
        category: 'Home Services',
        city: 'Hyderabad',
        address: 'Gachibowli Main Road, Hyderabad, Telangana 500032',
        latitude: 17.4401,
        longitude: 78.3489,
        phone: '+91 95566 77889',
        description:
          'Certified residential maintenance experts specializing in air conditioning, plumbing, and electrical repairs.',
      },
    });
  } else {
    quickfix = await prisma.business.update({
      where: { id: quickfix.id },
      data: {
        category: 'Home Services',
        city: 'Hyderabad',
        address: 'Gachibowli Main Road, Hyderabad, Telangana 500032',
        latitude: 17.4401,
        longitude: 78.3489,
        phone: '+91 95566 77889',
        description:
          'Certified residential maintenance experts specializing in air conditioning, plumbing, and electrical repairs.',
      },
    });
  }

  // 4. Seed BusinessMembers
  console.log('🤝 Seeding Business Members...');

  // Glow & Style Members
  const ownerMember = await prisma.businessMember.upsert({
    where: { userId_businessId: { userId: demoOwnerUser.id, businessId: beautyStudio.id } },
    update: { role: 'OWNER' },
    create: { userId: demoOwnerUser.id, businessId: beautyStudio.id, role: 'OWNER' },
  });

  const staffMember1 = await prisma.businessMember.upsert({
    where: { userId_businessId: { userId: demoStaffUser.id, businessId: beautyStudio.id } },
    update: { role: 'STAFF' },
    create: { userId: demoStaffUser.id, businessId: beautyStudio.id, role: 'STAFF' },
  });

  const staffMember2 = await prisma.businessMember.upsert({
    where: { userId_businessId: { userId: staffUser2.id, businessId: beautyStudio.id } },
    update: { role: 'STAFF' },
    create: { userId: staffUser2.id, businessId: beautyStudio.id, role: 'STAFF' },
  });

  // FitZone Members
  await prisma.businessMember.upsert({
    where: { userId_businessId: { userId: fitzoneOwnerUser.id, businessId: fitzone.id } },
    update: { role: 'OWNER' },
    create: { userId: fitzoneOwnerUser.id, businessId: fitzone.id, role: 'OWNER' },
  });

  const fitzoneStaffMember = await prisma.businessMember.upsert({
    where: { userId_businessId: { userId: fitzoneStaffUser.id, businessId: fitzone.id } },
    update: { role: 'STAFF' },
    create: { userId: fitzoneStaffUser.id, businessId: fitzone.id, role: 'STAFF' },
  });

  // QuickFix Members
  await prisma.businessMember.upsert({
    where: { userId_businessId: { userId: quickfixOwnerUser.id, businessId: quickfix.id } },
    update: { role: 'OWNER' },
    create: { userId: quickfixOwnerUser.id, businessId: quickfix.id, role: 'OWNER' },
  });

  const quickfixStaffMember = await prisma.businessMember.upsert({
    where: { userId_businessId: { userId: quickfixStaffUser.id, businessId: quickfix.id } },
    update: { role: 'STAFF' },
    create: { userId: quickfixStaffUser.id, businessId: quickfix.id, role: 'STAFF' },
  });

  // 5. Seed Service Categories & Services
  console.log('✂️ Seeding Service Categories & Services...');

  // Glow & Style Categories
  const hairCategory = await prisma.serviceCategory.upsert({
    where: { businessId_name: { businessId: beautyStudio.id, name: 'Hair Care' } },
    update: { description: 'Professional haircutting, styling, and hair spa treatments' },
    create: { businessId: beautyStudio.id, name: 'Hair Care', description: 'Professional haircutting, styling, and hair spa treatments' },
  });

  const skinCategory = await prisma.serviceCategory.upsert({
    where: { businessId_name: { businessId: beautyStudio.id, name: 'Skin & Beauty' } },
    update: { description: 'Rejuvenating facials and skincare treatments' },
    create: { businessId: beautyStudio.id, name: 'Skin & Beauty', description: 'Rejuvenating facials and skincare treatments' },
  });

  const nailCategory = await prisma.serviceCategory.upsert({
    where: { businessId_name: { businessId: beautyStudio.id, name: 'Nail Care' } },
    update: { description: 'Manicure and hand care treatments' },
    create: { businessId: beautyStudio.id, name: 'Nail Care', description: 'Manicure and hand care treatments' },
  });

  // Glow & Style Services
  const servicesConfig = [
    { name: 'Haircut', price: 500, durationMinutes: 45, categoryId: hairCategory.id, description: 'Precision styling, wash, and blow dry finish.' },
    { name: 'Hair Styling', price: 800, durationMinutes: 60, categoryId: hairCategory.id, description: 'Custom hair styling for events, blowouts, and iron work.' },
    { name: 'Facial', price: 1200, durationMinutes: 60, categoryId: skinCategory.id, description: 'Deep cleansing organic facial with moisturizing mask.' },
    { name: 'Hair Spa', price: 1500, durationMinutes: 90, categoryId: hairCategory.id, description: 'Nourishing scalp massaged conditioning treatment for damaged hair.' },
    { name: 'Manicure', price: 700, durationMinutes: 45, categoryId: nailCategory.id, description: 'Nail shaping, cuticle treatment, hand massage, and polish.' },
  ];

  const beautyServices = {};
  for (const s of servicesConfig) {
    let service = await prisma.service.findFirst({
      where: { businessId: beautyStudio.id, name: s.name },
    });
    if (!service) {
      service = await prisma.service.create({
        data: {
          businessId: beautyStudio.id,
          categoryId: s.categoryId,
          name: s.name,
          description: s.description,
          price: s.price,
          durationMinutes: s.durationMinutes,
          isActive: true,
        },
      });
    } else {
      service = await prisma.service.update({
        where: { id: service.id },
        data: {
          price: s.price,
          durationMinutes: s.durationMinutes,
          description: s.description,
          isActive: true,
        },
      });
    }
    beautyServices[s.name] = service;
  }

  // FitZone Services
  const fitzoneServicesConfig = [
    { name: 'Personal Training', price: 1000, durationMinutes: 60, description: '1-on-1 personalized strength and fitness coaching session.' },
    { name: 'Yoga Session', price: 600, durationMinutes: 60, description: 'Guided hatha and vinyasa yoga flow for flexibility and mindfulness.' },
    { name: 'Strength Training', price: 800, durationMinutes: 60, description: 'Guided resistance and weight conditioning workout.' },
  ];

  const fitzoneServices = {};
  for (const s of fitzoneServicesConfig) {
    let service = await prisma.service.findFirst({
      where: { businessId: fitzone.id, name: s.name },
    });
    if (!service) {
      service = await prisma.service.create({
        data: {
          businessId: fitzone.id,
          name: s.name,
          description: s.description,
          price: s.price,
          durationMinutes: s.durationMinutes,
          isActive: true,
        },
      });
    }
    fitzoneServices[s.name] = service;
  }

  // QuickFix Services
  const quickfixServicesConfig = [
    { name: 'AC Service', price: 800, durationMinutes: 90, description: 'Complete filter cleaning, gas check, and cooling performance test.' },
    { name: 'Plumbing Service', price: 500, durationMinutes: 60, description: 'Leak inspection, pipe fitting repair, and drain unclogging.' },
    { name: 'Electrical Repair', price: 600, durationMinutes: 60, description: 'Wiring fault diagnosis, switchboard repair, and appliance installation.' },
  ];

  const quickfixServices = {};
  for (const s of quickfixServicesConfig) {
    let service = await prisma.service.findFirst({
      where: { businessId: quickfix.id, name: s.name },
    });
    if (!service) {
      service = await prisma.service.create({
        data: {
          businessId: quickfix.id,
          name: s.name,
          description: s.description,
          price: s.price,
          durationMinutes: s.durationMinutes,
          isActive: true,
        },
      });
    }
    quickfixServices[s.name] = service;
  }

  // 6. Seed Staff Profiles
  console.log('💇 Seeding Staff Profiles & Schedules...');

  // Priya Sharma Profile (Demo Staff)
  const priyaStaff = await prisma.staff.upsert({
    where: { businessMemberId: staffMember1.id },
    update: {
      displayName: 'Priya Sharma',
      bio: 'Senior Hair & Styling Specialist with 6+ years experience in precision cuts, facial treatments, and spa therapies.',
      isActive: true,
    },
    create: {
      businessMemberId: staffMember1.id,
      displayName: 'Priya Sharma',
      bio: 'Senior Hair & Styling Specialist with 6+ years experience in precision cuts, facial treatments, and spa therapies.',
      isActive: true,
    },
  });

  // Rahul Verma Profile
  const rahulStaff = await prisma.staff.upsert({
    where: { businessMemberId: staffMember2.id },
    update: {
      displayName: 'Rahul Verma',
      bio: 'Expert Hair Stylist and Nail Specialist.',
      isActive: true,
    },
    create: {
      businessMemberId: staffMember2.id,
      displayName: 'Rahul Verma',
      bio: 'Expert Hair Stylist and Nail Specialist.',
      isActive: true,
    },
  });

  // Karan Trainer Profile (FitZone)
  const karanStaff = await prisma.staff.upsert({
    where: { businessMemberId: fitzoneStaffMember.id },
    update: {
      displayName: 'Karan Trainer',
      bio: 'Certified Fitness Trainer & Yoga Instructor.',
      isActive: true,
    },
    create: {
      businessMemberId: fitzoneStaffMember.id,
      displayName: 'Karan Trainer',
      bio: 'Certified Fitness Trainer & Yoga Instructor.',
      isActive: true,
    },
  });

  // Amit Technician Profile (QuickFix)
  const amitStaff = await prisma.staff.upsert({
    where: { businessMemberId: quickfixStaffMember.id },
    update: {
      displayName: 'Amit Tech',
      bio: 'Certified Appliance & Maintenance Technician.',
      isActive: true,
    },
    create: {
      businessMemberId: quickfixStaffMember.id,
      displayName: 'Amit Tech',
      bio: 'Certified Appliance & Maintenance Technician.',
      isActive: true,
    },
  });

  // 7. Seed StaffService Relationships
  console.log('🔗 Assigning Staff to Services...');

  // Priya assigned to Haircut, Hair Styling, Facial, Hair Spa
  const priyaServices = ['Haircut', 'Hair Styling', 'Facial', 'Hair Spa'];
  for (const sName of priyaServices) {
    const svc = beautyServices[sName];
    if (svc) {
      await prisma.staffService.upsert({
        where: { staffId_serviceId: { staffId: priyaStaff.id, serviceId: svc.id } },
        update: {},
        create: { staffId: priyaStaff.id, serviceId: svc.id },
      });
    }
  }

  // Rahul assigned to Haircut, Manicure
  const rahulServicesList = ['Haircut', 'Manicure'];
  for (const sName of rahulServicesList) {
    const svc = beautyServices[sName];
    if (svc) {
      await prisma.staffService.upsert({
        where: { staffId_serviceId: { staffId: rahulStaff.id, serviceId: svc.id } },
        update: {},
        create: { staffId: rahulStaff.id, serviceId: svc.id },
      });
    }
  }

  // Karan assigned to FitZone Services
  for (const svc of Object.values(fitzoneServices)) {
    await prisma.staffService.upsert({
      where: { staffId_serviceId: { staffId: karanStaff.id, serviceId: svc.id } },
      update: {},
      create: { staffId: karanStaff.id, serviceId: svc.id },
    });
  }

  // Amit assigned to QuickFix Services
  for (const svc of Object.values(quickfixServices)) {
    await prisma.staffService.upsert({
      where: { staffId_serviceId: { staffId: amitStaff.id, serviceId: svc.id } },
      update: {},
      create: { staffId: amitStaff.id, serviceId: svc.id },
    });
  }

  // 8. Seed Staff Weekly Schedules
  console.log('📅 Seeding Staff Weekly Schedules...');
  const allStaffList = [priyaStaff, rahulStaff, karanStaff, amitStaff];
  for (const staffMember of allStaffList) {
    for (let day = 0; day <= 6; day++) {
      // Priya Sharma works 7 days/week (including Sunday day 0) for demo appointments workflow
      const isAvailable = staffMember.id === priyaStaff.id ? true : day !== 0;
      await prisma.staffSchedule.upsert({
        where: { staffId_dayOfWeek: { staffId: staffMember.id, dayOfWeek: day } },
        update: { startTime: '09:00', endTime: '18:00', isAvailable },
        create: { staffId: staffMember.id, dayOfWeek: day, startTime: '09:00', endTime: '18:00', isAvailable },
      });
    }
  }

  // 8b. Seed Staff Recurring Breaks
  console.log('☕ Seeding Staff Recurring Breaks...');
  for (let day = 0; day <= 6; day++) {
    const existingBreak = await prisma.staffBreak.findFirst({
      where: { staffId: priyaStaff.id, dayOfWeek: day, startTime: '13:00' },
    });
    if (!existingBreak) {
      await prisma.staffBreak.create({
        data: {
          staffId: priyaStaff.id,
          dayOfWeek: day,
          startTime: '13:00',
          endTime: '14:00',
          label: 'Lunch',
        },
      });
    }
  }

  // 9. Seed Staff Time-Off Records
  console.log('🏖️ Seeding Staff Time-Off Data...');
  const timeOffDateStart = new Date();
  timeOffDateStart.setDate(timeOffDateStart.getDate() + 14); // 2 weeks from now
  timeOffDateStart.setHours(9, 0, 0, 0);
  const timeOffDateEnd = new Date(timeOffDateStart);
  timeOffDateEnd.setHours(18, 0, 0, 0);

  const existingTimeOff = await prisma.staffTimeOff.findFirst({
    where: { staffId: priyaStaff.id, reason: 'Annual Health & Professional Seminar' },
  });
  if (!existingTimeOff) {
    await prisma.staffTimeOff.create({
      data: {
        staffId: priyaStaff.id,
        startDateTime: timeOffDateStart,
        endDateTime: timeOffDateEnd,
        reason: 'Annual Health & Professional Seminar',
      },
    });
  }

  // 10. Seed Customer CRM Records
  console.log('📋 Seeding Customer Directory Records...');

  // Demo Customer linked CRM record for Glow & Style
  const demoCustomerRecord = await prisma.customer.upsert({
    where: { businessId_email: { businessId: beautyStudio.id, email: demoCustomerUser.email } },
    update: { userId: demoCustomerUser.id, name: demoCustomerUser.name, phone: demoCustomerUser.phone, address: 'Banjara Hills, Hyderabad, Telangana' },
    create: {
      businessId: beautyStudio.id,
      userId: demoCustomerUser.id,
      name: demoCustomerUser.name,
      email: demoCustomerUser.email,
      phone: demoCustomerUser.phone,
      address: 'Banjara Hills, Hyderabad, Telangana',
      isActive: true,
    },
  });

  // Demo Customer CRM records for FitZone & QuickFix
  await prisma.customer.upsert({
    where: { businessId_email: { businessId: fitzone.id, email: demoCustomerUser.email } },
    update: { userId: demoCustomerUser.id, name: demoCustomerUser.name, phone: demoCustomerUser.phone },
    create: {
      businessId: fitzone.id,
      userId: demoCustomerUser.id,
      name: demoCustomerUser.name,
      email: demoCustomerUser.email,
      phone: demoCustomerUser.phone,
      address: 'Banjara Hills, Hyderabad, Telangana',
      isActive: true,
    },
  });

  await prisma.customer.upsert({
    where: { businessId_email: { businessId: quickfix.id, email: demoCustomerUser.email } },
    update: { userId: demoCustomerUser.id, name: demoCustomerUser.name, phone: demoCustomerUser.phone },
    create: {
      businessId: quickfix.id,
      userId: demoCustomerUser.id,
      name: demoCustomerUser.name,
      email: demoCustomerUser.email,
      phone: demoCustomerUser.phone,
      address: 'Banjara Hills, Hyderabad, Telangana',
      isActive: true,
    },
  });

  // Other CRM Customers for Glow & Style Beauty Studio
  const additionalCustomers = [
    { name: 'Rahul Kumar', email: 'rahulkumar@example.com', phone: '+91 98765 00111', address: 'Jubilee Hills, Hyderabad' },
    { name: 'Meera Patel', email: 'meera@example.com', phone: '+91 97777 22222', address: 'Hitech City, Hyderabad' },
    { name: 'Kavya Rao', email: 'kavyarao@example.com', phone: '+91 98888 33333', address: 'Madhapur, Hyderabad' },
    { name: 'Nikhil Verma', email: 'nikhilverma@example.com', phone: '+91 99999 44444', address: 'Gachibowli, Hyderabad' },
    { name: 'Siddharth Rao', email: 'siddharth@example.com', phone: '+91 98888 11111', address: 'Jubilee Hills, Hyderabad' },
    { name: 'Arjun Nambiar', email: 'arjun@example.com', phone: '+91 96666 33333', address: 'Kondapur, Hyderabad' },
    { name: 'Ritu Sharma', email: 'ritu@example.com', phone: '+91 95555 44444', address: 'Begumpet, Hyderabad' },
  ];

  const beautyCustomersList = [demoCustomerRecord];
  const beautyCustomerMap = { 'Ananya Roy': demoCustomerRecord };

  for (const c of additionalCustomers) {
    const cust = await prisma.customer.upsert({
      where: { businessId_email: { businessId: beautyStudio.id, email: c.email } },
      update: { name: c.name, phone: c.phone, address: c.address },
      create: { businessId: beautyStudio.id, name: c.name, email: c.email, phone: c.phone, address: c.address, isActive: true },
    });
    beautyCustomersList.push(cust);
    beautyCustomerMap[c.name] = cust;
  }

  // Seed Customer Note
  const existingNote = await prisma.customerNote.findFirst({
    where: { customerId: demoCustomerRecord.id, content: 'VIP Client — prefers organic facial products and afternoon appointments.' },
  });
  if (!existingNote) {
    await prisma.customerNote.create({
      data: {
        customerId: demoCustomerRecord.id,
        authorUserId: demoOwnerUser.id,
        content: 'VIP Client — prefers organic facial products and afternoon appointments.',
      },
    });
  }

  // 11. Seed Bookings with Diverse Statuses
  console.log('🗓️ Seeding Demo Appointments & Booking History...');

  const today = new Date();
  const todayY = today.getFullYear();
  const todayM = today.getMonth();
  const todayD = today.getDate();

  // -------------------------------------------------------------
  // TODAY'S 5 ASSIGNED APPOINTMENTS FOR PRIYA SHARMA (DEMO STAFF)
  // -------------------------------------------------------------
  const todayBookingsData = [
    {
      customerName: 'Ananya Roy',
      serviceName: 'Facial',
      startHour: 9,
      startMin: 30,
      durationMin: 60,
      status: 'COMPLETED',
      totalAmount: 1200,
      notes: 'Organic facial session for sensitive skin.',
    },
    {
      customerName: 'Rahul Kumar',
      serviceName: 'Haircut',
      startHour: 11,
      startMin: 0,
      durationMin: 45,
      status: 'CONFIRMED',
      totalAmount: 500,
      notes: 'Classic side fade & precision trim.',
    },
    {
      customerName: 'Meera Patel',
      serviceName: 'Hair Styling',
      startHour: 14,
      startMin: 0,
      durationMin: 60,
      status: 'CONFIRMED',
      totalAmount: 800,
      notes: 'Please keep the style simple.',
    },
    {
      customerName: 'Kavya Rao',
      serviceName: 'Hair Spa',
      startHour: 16,
      startMin: 0,
      durationMin: 90,
      status: 'PENDING',
      totalAmount: 1500,
      notes: 'Deep conditioning scalp treatment.',
    },
    {
      customerName: 'Nikhil Verma',
      serviceName: 'Facial',
      startHour: 17,
      startMin: 30,
      durationMin: 60,
      status: 'PENDING',
      totalAmount: 1200,
      notes: 'Rejuvenating anti-pollution facial.',
    },
  ];

  for (const tb of todayBookingsData) {
    const sTime = new Date(todayY, todayM, todayD, tb.startHour, tb.startMin, 0, 0);
    const eTime = new Date(sTime.getTime() + tb.durationMin * 60 * 1000);
    const custObj = beautyCustomerMap[tb.customerName] || demoCustomerRecord;
    const svcObj = beautyServices[tb.serviceName] || beautyServices['Facial'];

    let b = await prisma.booking.findFirst({
      where: {
        businessId: beautyStudio.id,
        staffId: priyaStaff.id,
        startTime: sTime,
      },
    });

    if (!b) {
      b = await prisma.booking.create({
        data: {
          businessId: beautyStudio.id,
          customerId: custObj.id,
          serviceId: svcObj.id,
          staffId: priyaStaff.id,
          startTime: sTime,
          endTime: eTime,
          status: tb.status,
          totalAmount: tb.totalAmount,
          notes: tb.notes,
        },
      });

      if (tb.status === 'COMPLETED') {
        await prisma.bookingStatusHistory.create({
          data: {
            bookingId: b.id,
            fromStatus: 'CONFIRMED',
            toStatus: 'COMPLETED',
            changedByUserId: demoStaffUser.id,
            reason: 'Service completed successfully by Priya',
          },
        });
      } else if (tb.status === 'CONFIRMED') {
        await prisma.bookingStatusHistory.create({
          data: {
            bookingId: b.id,
            fromStatus: 'PENDING',
            toStatus: 'CONFIRMED',
            changedByUserId: demoOwnerUser.id,
            reason: 'Booking confirmed by studio',
          },
        });
      }
    }
  }

  // -------------------------------------------------------------
  // HISTORICAL & FUTURE APPOINTMENTS FOR TESTING FILTERS
  // -------------------------------------------------------------

  // Completed past booking (Revenue producing)
  const pastDate1 = new Date(today);
  pastDate1.setDate(pastDate1.getDate() - 3);
  pastDate1.setHours(10, 0, 0, 0);
  const pastDate1End = new Date(pastDate1.getTime() + 60 * 60 * 1000);

  let booking1 = await prisma.booking.findFirst({
    where: { businessId: beautyStudio.id, customerId: demoCustomerRecord.id, startTime: pastDate1 },
  });
  if (!booking1) {
    booking1 = await prisma.booking.create({
      data: {
        businessId: beautyStudio.id,
        customerId: demoCustomerRecord.id,
        serviceId: beautyServices['Facial'].id,
        staffId: priyaStaff.id,
        startTime: pastDate1,
        endTime: pastDate1End,
        status: 'COMPLETED',
        totalAmount: 1200,
        notes: 'Regular organic facial session.',
      },
    });

    await prisma.bookingStatusHistory.create({
      data: {
        bookingId: booking1.id,
        fromStatus: 'CONFIRMED',
        toStatus: 'COMPLETED',
        changedByUserId: demoStaffUser.id,
        reason: 'Service completed successfully',
      },
    });

    // Review for completed booking
    await prisma.review.upsert({
      where: { bookingId: booking1.id },
      update: {},
      create: {
        businessId: beautyStudio.id,
        customerId: demoCustomerRecord.id,
        bookingId: booking1.id,
        rating: 5,
        comment: 'Excellent facial treatment! Priya was exceptionally gentle and professional.',
      },
    });
  }

  // Confirmed upcoming booking
  const futureDate1 = new Date(today);
  futureDate1.setDate(futureDate1.getDate() + 2);
  futureDate1.setHours(11, 0, 0, 0);
  const futureDate1End = new Date(futureDate1.getTime() + 45 * 60 * 1000);

  let booking2 = await prisma.booking.findFirst({
    where: { businessId: beautyStudio.id, customerId: demoCustomerRecord.id, startTime: futureDate1 },
  });
  if (!booking2) {
    booking2 = await prisma.booking.create({
      data: {
        businessId: beautyStudio.id,
        customerId: demoCustomerRecord.id,
        serviceId: beautyServices['Haircut'].id,
        staffId: priyaStaff.id,
        startTime: futureDate1,
        endTime: futureDate1End,
        status: 'CONFIRMED',
        totalAmount: 500,
        notes: 'Precision haircut & styling.',
      },
    });

    await prisma.bookingStatusHistory.create({
      data: {
        bookingId: booking2.id,
        fromStatus: 'PENDING',
        toStatus: 'CONFIRMED',
        changedByUserId: demoOwnerUser.id,
        reason: 'Appointment confirmed by owner',
      },
    });
  }

  // Pending booking
  const futureDate2 = new Date(today);
  futureDate2.setDate(futureDate2.getDate() + 4);
  futureDate2.setHours(14, 0, 0, 0);
  const futureDate2End = new Date(futureDate2.getTime() + 90 * 60 * 1000);

  let booking3 = await prisma.booking.findFirst({
    where: { businessId: beautyStudio.id, customerId: beautyCustomersList[1].id, startTime: futureDate2 },
  });
  if (!booking3) {
    booking3 = await prisma.booking.create({
      data: {
        businessId: beautyStudio.id,
        customerId: beautyCustomersList[1].id,
        serviceId: beautyServices['Hair Spa'].id,
        staffId: priyaStaff.id,
        startTime: futureDate2,
        endTime: futureDate2End,
        status: 'PENDING',
        totalAmount: 1500,
        notes: 'Deep conditioning scalp treatment.',
      },
    });
  }

  // Cancelled booking
  const pastDate2 = new Date(today);
  pastDate2.setDate(pastDate2.getDate() - 1);
  pastDate2.setHours(15, 0, 0, 0);
  const pastDate2End = new Date(pastDate2.getTime() + 60 * 60 * 1000);

  let booking4 = await prisma.booking.findFirst({
    where: { businessId: beautyStudio.id, customerId: beautyCustomersList[2].id, startTime: pastDate2 },
  });
  if (!booking4) {
    booking4 = await prisma.booking.create({
      data: {
        businessId: beautyStudio.id,
        customerId: beautyCustomersList[2].id,
        serviceId: beautyServices['Hair Styling'].id,
        staffId: priyaStaff.id,
        startTime: pastDate2,
        endTime: pastDate2End,
        status: 'CANCELLED',
        totalAmount: 800,
        notes: 'Customer requested reschedule.',
      },
    });
  }

  // Completed booking for Rahul Verma
  const pastDate3 = new Date(today);
  pastDate3.setDate(pastDate3.getDate() - 2);
  pastDate3.setHours(12, 0, 0, 0);
  const pastDate3End = new Date(pastDate3.getTime() + 45 * 60 * 1000);

  let booking5 = await prisma.booking.findFirst({
    where: { businessId: beautyStudio.id, customerId: beautyCustomersList[3].id, startTime: pastDate3 },
  });
  if (!booking5) {
    booking5 = await prisma.booking.create({
      data: {
        businessId: beautyStudio.id,
        customerId: beautyCustomersList[3].id,
        serviceId: beautyServices['Manicure'].id,
        staffId: rahulStaff.id,
        startTime: pastDate3,
        endTime: pastDate3End,
        status: 'COMPLETED',
        totalAmount: 700,
        notes: 'Nail shaping and hand spa.',
      },
    });
  }

  console.log('✅ ServiceHub demo seed completed successfully!');
}

seed()
  .catch((e) => {
    console.error('❌ Error during database seeding:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
