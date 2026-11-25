const prisma = require('../config/prisma');
const { z } = require('zod');

const createReviewSchema = z.object({
  bookingId: z.string({ required_error: 'Booking ID is required' }).uuid('Invalid booking ID format'),
  rating: z
    .number({ required_error: 'Please select a rating.' })
    .int('Rating must be an integer.')
    .min(1, 'Please select a rating.')
    .max(5, 'Rating cannot exceed 5 stars.'),
  comment: z
    .string()
    .optional()
    .nullable()
    .transform((val) => (val ? val.trim() : null)),
});

/**
 * Get customer's submitted reviews and reviewable (COMPLETED) bookings
 */
const getCustomerReviews = async (userId) => {
  const user = await prisma.user.findUnique({ where: { id: userId } });
  if (!user) {
    const error = new Error('User not found.');
    error.statusCode = 404;
    throw error;
  }

  // Find all Customer records belonging to this user
  const customers = await prisma.customer.findMany({
    where: {
      OR: [
        { userId },
        ...(user.email ? [{ email: user.email }] : []),
      ],
    },
    select: { id: true, businessId: true },
  });

  const customerIds = customers.map((c) => c.id);

  if (customerIds.length === 0) {
    return {
      reviewableBookings: [],
      submittedReviews: [],
    };
  }

  // Submitted reviews by customer
  const submittedReviews = await prisma.review.findMany({
    where: {
      customerId: { in: customerIds },
    },
    include: {
      business: {
        select: {
          id: true,
          name: true,
          category: true,
          city: true,
          address: true,
        },
      },
      booking: {
        include: {
          service: {
            select: {
              id: true,
              name: true,
              price: true,
              durationMinutes: true,
            },
          },
          staff: {
            select: {
              id: true,
              displayName: true,
              businessMember: {
                select: {
                  user: { select: { name: true } },
                },
              },
            },
          },
        },
      },
    },
    orderBy: { createdAt: 'desc' },
  });

  // Completed bookings that do NOT have a review yet
  const reviewableBookings = await prisma.booking.findMany({
    where: {
      customerId: { in: customerIds },
      status: 'COMPLETED',
      review: null,
    },
    include: {
      business: {
        select: {
          id: true,
          name: true,
          category: true,
          city: true,
          address: true,
        },
      },
      service: {
        select: {
          id: true,
          name: true,
          price: true,
          durationMinutes: true,
        },
      },
      staff: {
        select: {
          id: true,
          displayName: true,
          businessMember: {
            select: {
              user: { select: { name: true } },
            },
          },
        },
      },
    },
    orderBy: { startTime: 'desc' },
  });

  return {
    reviewableBookings,
    submittedReviews,
  };
};

/**
 * Submit a new review for a completed booking
 */
const createReview = async (userId, data) => {
  const validated = createReviewSchema.parse(data);

  const booking = await prisma.booking.findUnique({
    where: { id: validated.bookingId },
    include: {
      customer: true,
      review: true,
      service: true,
      staff: true,
      business: true,
    },
  });

  if (!booking) {
    const error = new Error('Appointment not found.');
    error.statusCode = 404;
    throw error;
  }

  // Verify Ownership
  const user = await prisma.user.findUnique({ where: { id: userId } });
  const isOwner =
    booking.customer.userId === userId ||
    (user && user.email && booking.customer.email === user.email);

  if (!isOwner) {
    const error = new Error('Access denied. You can only review your own appointments.');
    error.statusCode = 403;
    throw error;
  }

  // Verify Status is COMPLETED
  if (booking.status !== 'COMPLETED') {
    const error = new Error('This appointment is no longer available for review.');
    error.statusCode = 400;
    throw error;
  }

  // Verify Review does not already exist
  if (booking.review) {
    const error = new Error('A review has already been submitted for this appointment.');
    error.statusCode = 409;
    throw error;
  }

  // Create Review in DB
  const review = await prisma.review.create({
    data: {
      businessId: booking.businessId,
      customerId: booking.customerId,
      bookingId: booking.id,
      rating: validated.rating,
      comment: validated.comment || null,
    },
    include: {
      business: {
        select: {
          id: true,
          name: true,
          category: true,
          city: true,
        },
      },
      booking: {
        include: {
          service: { select: { id: true, name: true } },
          staff: {
            select: {
              id: true,
              displayName: true,
              businessMember: {
                select: {
                  user: { select: { name: true } },
                },
              },
            },
          },
        },
      },
    },
  });

  return review;
};

/**
 * Get all reviews for a specific business (Owner/Staff view)
 */
const getBusinessReviews = async (businessId) => {
  const reviews = await prisma.review.findMany({
    where: { businessId },
    include: {
      customer: {
        select: {
          id: true,
          name: true,
          email: true,
          phone: true,
        },
      },
      booking: {
        include: {
          service: {
            select: {
              id: true,
              name: true,
              price: true,
              durationMinutes: true,
            },
          },
          staff: {
            select: {
              id: true,
              displayName: true,
              businessMember: {
                select: {
                  user: { select: { name: true } },
                },
              },
            },
          },
        },
      },
    },
    orderBy: { createdAt: 'desc' },
  });

  const totalReviews = reviews.length;
  const avgRating =
    totalReviews > 0
      ? Number((reviews.reduce((sum, r) => sum + r.rating, 0) / totalReviews).toFixed(1))
      : 0;

  const ratingCounts = { 5: 0, 4: 0, 3: 0, 2: 0, 1: 0 };
  reviews.forEach((r) => {
    if (ratingCounts[r.rating] !== undefined) {
      ratingCounts[r.rating]++;
    }
  });

  return {
    totalReviews,
    avgRating,
    ratingCounts,
    reviews,
  };
};

module.exports = {
  getCustomerReviews,
  createReview,
  getBusinessReviews,
};

