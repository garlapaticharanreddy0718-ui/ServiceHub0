const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

const {
  createBusinessSchema,
  updateBusinessSchema,
  addMemberSchema,
  updateMemberRoleSchema,
} = require('../utils/validationSchemas');

/**
 * Create a new business and automatically assign creator as OWNER inside a transaction
 */
const createBusiness = async (userId, data) => {
  const validated = createBusinessSchema.parse(data);

  // Execute business and membership creation atomically in a Prisma Transaction
  return await prisma.$transaction(async (tx) => {
    const business = await tx.business.create({
      data: {
        name: validated.name,
        description: validated.description || null,
        category: validated.category || null,
        phone: validated.phone || null,
        address: validated.address || null,
        city: validated.city || null,
      },
    });

    const member = await tx.businessMember.create({
      data: {
        userId,
        businessId: business.id,
        role: 'OWNER',
      },
    });

    return {
      ...business,
      currentUserRole: member.role,
    };
  });
};

/**
 * Get all businesses where the authenticated user is a member
 */
const getUserBusinesses = async (userId) => {
  const memberships = await prisma.businessMember.findMany({
    where: { userId },
    include: {
      business: true,
    },
    orderBy: { createdAt: 'desc' },
  });

  if (memberships.length > 0) {
    return memberships.map((m) => ({
      ...m.business,
      currentUserRole: m.role,
      memberSince: m.createdAt,
    }));
  }

  // If user has no staff/owner business memberships (e.g. Customer user), return the 3 seeded demo businesses for discovery
  const DEMO_BUSINESS_NAMES = [
    'Glow & Style Beauty Studio',
    'FitZone Fitness Center',
    'QuickFix Home Services',
  ];

  let demoBusinesses = await prisma.business.findMany({
    where: { name: { in: DEMO_BUSINESS_NAMES } },
    orderBy: { createdAt: 'asc' },
  });

  if (demoBusinesses.length === 0) {
    demoBusinesses = await prisma.business.findMany({
      orderBy: { createdAt: 'desc' },
      take: 3,
    });
  }

  return demoBusinesses.map((b) => ({
    ...b,
    currentUserRole: 'CUSTOMER',
  }));
};


/**
 * Get a specific business by ID for an authorized member
 */
const getBusinessById = async (businessId, userId) => {
  const member = await prisma.businessMember.findUnique({
    where: {
      userId_businessId: {
        userId,
        businessId,
      },
    },
    include: {
      business: true,
    },
  });

  if (!member) {
    const error = new Error('Access denied. You are not a member of this business.');
    error.statusCode = 403;
    throw error;
  }

  return {
    ...member.business,
    currentUserRole: member.role,
  };
};

/**
 * Update business details (OWNER / ADMIN only)
 */
const updateBusiness = async (businessId, data) => {
  const validated = updateBusinessSchema.parse(data);

  const updatedBusiness = await prisma.business.update({
    where: { id: businessId },
    data: validated,
  });

  return updatedBusiness;
};

/**
 * Get all members of a business (OWNER / ADMIN only)
 */
const getBusinessMembers = async (businessId) => {
  const members = await prisma.businessMember.findMany({
    where: { businessId },
    include: {
      user: {
        select: {
          id: true,
          name: true,
          email: true,
          phone: true,
        },
      },
    },
    orderBy: { createdAt: 'asc' },
  });

  return members.map((m) => ({
    id: m.id,
    userId: m.userId,
    businessId: m.businessId,
    role: m.role,
    createdAt: m.createdAt,
    user: m.user,
  }));
};

/**
 * Add a new member to a business by email (OWNER only)
 */
const addBusinessMember = async (businessId, data) => {
  const validated = addMemberSchema.parse(data);

  const user = await prisma.user.findUnique({
    where: { email: validated.email },
  });

  if (!user) {
    const error = new Error(`User with email '${validated.email}' was not found.`);
    error.statusCode = 404;
    throw error;
  }

  const existingMember = await prisma.businessMember.findUnique({
    where: {
      userId_businessId: {
        userId: user.id,
        businessId,
      },
    },
  });

  if (existingMember) {
    const error = new Error('User is already a member of this business.');
    error.statusCode = 409;
    throw error;
  }

  const newMember = await prisma.businessMember.create({
    data: {
      userId: user.id,
      businessId,
      role: validated.role,
    },
    include: {
      user: {
        select: {
          id: true,
          name: true,
          email: true,
          phone: true,
        },
      },
    },
  });

  return newMember;
};

/**
 * Change member role (OWNER only)
 */
const updateMemberRole = async (businessId, memberId, newRoleData) => {
  const validated = updateMemberRoleSchema.parse(newRoleData);

  const member = await prisma.businessMember.findUnique({
    where: { id: memberId },
  });

  if (!member || member.businessId !== businessId) {
    const error = new Error('Member not found in this business.');
    error.statusCode = 404;
    throw error;
  }

  if (member.role === 'OWNER') {
    const error = new Error('Cannot modify the role of a business OWNER through this endpoint.');
    error.statusCode = 403;
    throw error;
  }

  const updatedMember = await prisma.businessMember.update({
    where: { id: memberId },
    data: { role: validated.role },
    include: {
      user: {
        select: {
          id: true,
          name: true,
          email: true,
        },
      },
    },
  });

  return updatedMember;
};

/**
 * Haversine formula calculation in kilometers
 */
const calculateHaversineDistanceKm = (lat1, lon1, lat2, lon2) => {
  if (lat1 === null || lon1 === null || lat2 === null || lon2 === null) return null;
  const R = 6371; // Earth radius in KM
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return Math.round(R * c * 10) / 10;
};

/**
 * Get nearby businesses with calculated distance, search, and category filtering
 */
const getNearbyBusinesses = async ({ lat, lng, radius, search, category, sort }) => {
  const userLat = lat !== undefined && lat !== null && !isNaN(Number(lat)) ? Number(lat) : null;
  const userLng = lng !== undefined && lng !== null && !isNaN(Number(lng)) ? Number(lng) : null;
  const maxRadiusKm = radius ? Number(radius) : null;

  // Fetch all active businesses with active services preview
  const allBusinesses = await prisma.business.findMany({
    include: {
      services: {
        where: { isActive: true },
        take: 5,
        orderBy: { price: 'asc' },
      },
    },
    orderBy: { createdAt: 'asc' },
  });

  // Filter out test/generated database records for clean customer discovery
  const businesses = allBusinesses.filter((b) => {
    if (!b.name) return false;
    if (/\d{8,}/.test(b.name)) return false; // timestamped generated names
    if (
      b.name.startsWith('Salon Alpha') ||
      b.name.startsWith('Gym Beta') ||
      b.name.includes('Alice & Bob') ||
      b.name.includes('ProFix') ||
      b.name.includes('SparkleClean') ||
      b.name.includes('Apex Learning')
    ) {
      return false;
    }
    return true;
  });

  // Calculate distance for each business
  let mapped = businesses.map((b) => {
    const dist =
      userLat !== null && userLng !== null && b.latitude !== null && b.longitude !== null
        ? calculateHaversineDistanceKm(userLat, userLng, b.latitude, b.longitude)
        : null;

    return {
      ...b,
      distanceKm: dist,
      currentUserRole: 'CUSTOMER',
    };
  });

  // 1. Filter by radius if user coordinates and radius are provided
  if (userLat !== null && userLng !== null && maxRadiusKm) {
    mapped = mapped.filter((b) => b.distanceKm === null || b.distanceKm <= maxRadiusKm);
  }

  // 2. Filter by category
  if (category && category.toLowerCase() !== 'all') {
    const catLower = category.toLowerCase();
    mapped = mapped.filter(
      (b) => b.category && b.category.toLowerCase().includes(catLower)
    );
  }

  // 3. Filter by search term (matches business name, category, description, or service names)
  if (search && search.trim() !== '') {
    const q = search.trim().toLowerCase();
    mapped = mapped.filter((b) => {
      const matchName = b.name.toLowerCase().includes(q);
      const matchCategory = b.category && b.category.toLowerCase().includes(q);
      const matchDesc = b.description && b.description.toLowerCase().includes(q);
      const matchService = b.services.some(
        (s) => s.name.toLowerCase().includes(q) || (s.description && s.description.toLowerCase().includes(q))
      );
      return matchName || matchCategory || matchDesc || matchService;
    });
  }

  // 4. Sort results
  if (sort === 'name') {
    mapped.sort((a, b) => a.name.localeCompare(b.name));
  } else if (sort === 'price') {
    mapped.sort((a, b) => {
      const minPriceA = a.services.length > 0 ? Number(a.services[0].price) : Infinity;
      const minPriceB = b.services.length > 0 ? Number(b.services[0].price) : Infinity;
      return minPriceA - minPriceB;
    });
  } else {
    // Default: Sort by nearest distance first if available
    mapped.sort((a, b) => {
      if (a.distanceKm !== null && b.distanceKm !== null) {
        return a.distanceKm - b.distanceKm;
      }
      if (a.distanceKm !== null) return -1;
      if (b.distanceKm !== null) return 1;
      return 0;
    });
  }

  return mapped;
};

module.exports = {
  createBusiness,
  getUserBusinesses,
  getBusinessById,
  updateBusiness,
  getBusinessMembers,
  addBusinessMember,
  updateMemberRole,
  getNearbyBusinesses,
};
