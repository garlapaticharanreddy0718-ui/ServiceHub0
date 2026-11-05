const { z } = require('zod');

/**
 * User registration validation schema
 */
const registerSchema = z.object({
  name: z.string({ required_error: 'Name is required' })
    .trim()
    .min(2, 'Name must be at least 2 characters'),
  email: z.string({ required_error: 'Email is required' })
    .trim()
    .toLowerCase()
    .email('Invalid email address format'),
  password: z.string({ required_error: 'Password is required' })
    .min(6, 'Password must be at least 6 characters'),
  phone: z.string().trim().optional().or(z.literal('')),
});

/**
 * User login validation schema
 */
const loginSchema = z.object({
  email: z.string({ required_error: 'Email is required' })
    .trim()
    .toLowerCase()
    .email('Invalid email address format'),
  password: z.string({ required_error: 'Password is required' })
    .min(1, 'Password cannot be empty'),
});

/**
 * Business onboarding / creation validation schema
 */
const createBusinessSchema = z.object({
  name: z.string({ required_error: 'Business name is required' })
    .trim()
    .min(2, 'Business name must be at least 2 characters'),
  description: z.string().trim().optional().or(z.literal('')),
  category: z.string().trim().optional().or(z.literal('')),
  phone: z.string().trim().optional().or(z.literal('')),
  address: z.string().trim().optional().or(z.literal('')),
  city: z.string().trim().optional().or(z.literal('')),
  latitude: z.number().optional().nullable(),
  longitude: z.number().optional().nullable(),
});

/**
 * Business update validation schema
 */
const updateBusinessSchema = createBusinessSchema.partial();

/**
 * Add business member validation schema
 */
const addMemberSchema = z.object({
  email: z.string({ required_error: 'User email is required' })
    .trim()
    .toLowerCase()
    .email('Invalid email address format'),
  role: z.enum(['ADMIN', 'STAFF'], { required_error: 'Role must be ADMIN or STAFF' }),
});

/**
 * Update member role validation schema
 */
const updateMemberRoleSchema = z.object({
  role: z.enum(['ADMIN', 'STAFF'], { required_error: 'Role must be ADMIN or STAFF' }),
});

// ==================================================
// PHASE 5 VALIDATION SCHEMAS
// ==================================================

/**
 * Service Category validation schemas
 */
const createCategorySchema = z.object({
  name: z.string({ required_error: 'Category name is required' })
    .trim()
    .min(2, 'Category name must be at least 2 characters'),
  description: z.string().trim().optional().or(z.literal('')),
  isActive: z.boolean().optional(),
});

const updateCategorySchema = createCategorySchema.partial();

/**
 * Service validation schemas
 */
const createServiceSchema = z.object({
  name: z.string({ required_error: 'Service name is required' })
    .trim()
    .min(2, 'Service name must be at least 2 characters'),
  description: z.string().trim().optional().or(z.literal('')),
  price: z.number({ required_error: 'Price is required' })
    .min(0, 'Price cannot be negative'),
  durationMinutes: z.number({ required_error: 'Duration in minutes is required' })
    .int('Duration must be an integer')
    .gt(0, 'Duration must be greater than 0 minutes'),
  categoryId: z.string().uuid().optional().nullable().or(z.literal('')),
  isActive: z.boolean().optional(),
});

const updateServiceSchema = createServiceSchema.partial();

/**
 * Staff Profile validation schemas
 */
const createStaffProfileSchema = z.object({
  name: z.string().trim().optional().or(z.literal('')),
  email: z.string().trim().email('Valid email address is required').optional().or(z.literal('')),
  phone: z.string().trim().optional().or(z.literal('')),
  businessMemberId: z.string().uuid().optional(),
  memberId: z.string().uuid().optional(),
  displayName: z.string().trim().optional().or(z.literal('')),
  title: z.string().trim().optional().or(z.literal('')),
  bio: z.string().trim().optional().or(z.literal('')),
  isActive: z.boolean().optional(),

  // Nested onboarding configuration
  serviceIds: z.array(z.string().uuid()).optional(),
  schedules: z.array(z.object({
    dayOfWeek: z.number().int().min(0).max(6),
    startTime: z.string().regex(/^([01]\d|2[0-3]):[0-5]\d$/, 'Invalid time format (HH:MM)'),
    endTime: z.string().regex(/^([01]\d|2[0-3]):[0-5]\d$/, 'Invalid time format (HH:MM)'),
    isAvailable: z.boolean().optional(),
    isWorking: z.boolean().optional(),
  })).optional(),
  breaks: z.array(z.object({
    dayOfWeek: z.number().int().min(0).max(6).optional(),
    startTime: z.string().regex(/^([01]\d|2[0-3]):[0-5]\d$/, 'Invalid time format (HH:MM)'),
    endTime: z.string().regex(/^([01]\d|2[0-3]):[0-5]\d$/, 'Invalid time format (HH:MM)'),
    label: z.string().trim().optional().or(z.literal('')),
    title: z.string().trim().optional().or(z.literal('')),
  })).optional(),
  timeOffs: z.array(z.object({
    startDateTime: z.string().optional(),
    startDate: z.string().optional(),
    endDateTime: z.string().optional(),
    endDate: z.string().optional(),
    reason: z.string().trim().optional().or(z.literal('')),
  })).optional(),
}).superRefine((data, ctx) => {
  const bId = data.businessMemberId || data.memberId;
  if (!bId && (!data.name || !data.email)) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      message: 'Full Name and Email are required to add a new staff member.',
    });
  }
}).transform((data) => {
  const bId = data.businessMemberId || data.memberId;
  return {
    ...data,
    businessMemberId: bId || undefined,
  };
});

const updateStaffProfileSchema = z.object({
  displayName: z.string().trim().min(2).optional(),
  title: z.string().trim().optional(),
  bio: z.string().trim().optional(),
  isActive: z.boolean().optional(),
});

/**
 * Staff Service assignment validation schema
 */
const setStaffServicesSchema = z.object({
  serviceIds: z.array(z.string().uuid(), { required_error: 'serviceIds must be an array of service IDs' }),
});

/**
 * Staff Weekly Schedule validation schema
 */
const scheduleItemSchema = z.object({
  dayOfWeek: z.number().int().min(0).max(6),
  startTime: z.string().regex(/^([01]\d|2[0-3]):[0-5]\d$/, 'Invalid time format (HH:MM)'),
  endTime: z.string().regex(/^([01]\d|2[0-3]):[0-5]\d$/, 'Invalid time format (HH:MM)'),
  isAvailable: z.boolean().optional(),
  isWorking: z.boolean().optional(),
}).transform((data) => ({
  dayOfWeek: data.dayOfWeek,
  startTime: data.startTime,
  endTime: data.endTime,
  isAvailable: data.isAvailable !== undefined ? data.isAvailable : (data.isWorking !== undefined ? data.isWorking : true),
}));

const updateScheduleSchema = z.object({
  schedules: z.array(scheduleItemSchema),
});

/**
 * Staff Time-Off validation schema
 */
const createTimeOffSchema = z.object({
  startDateTime: z.string().optional(),
  startDate: z.string().optional(),
  endDateTime: z.string().optional(),
  endDate: z.string().optional(),
  reason: z.string().trim().optional().or(z.literal('')),
}).transform((data) => {
  const start = data.startDateTime || data.startDate;
  const end = data.endDateTime || data.endDate;
  if (!start || isNaN(Date.parse(start))) {
    throw new Error('Invalid or missing start date time');
  }
  if (!end || isNaN(Date.parse(end))) {
    throw new Error('Invalid or missing end date time');
  }
  if (new Date(start) >= new Date(end)) {
    throw new Error('Start date time must be strictly before end date time');
  }
  return {
    startDateTime: start,
    endDateTime: end,
    reason: data.reason,
  };
});

// ==================================================
// PHASE 6 VALIDATION SCHEMAS
// ==================================================

/**
 * Customer validation schemas
 */
const createCustomerSchema = z.object({
  name: z.string({ required_error: 'Customer name is required' })
    .trim()
    .min(2, 'Customer name must be at least 2 characters'),
  email: z.string().trim().toLowerCase().email('Invalid email address format').optional().nullable().or(z.literal('')),
  phone: z.string().trim().optional().nullable().or(z.literal('')),
  address: z.string().trim().optional().nullable().or(z.literal('')),
  dateOfBirth: z.string().optional().nullable().or(z.literal('')),
  userId: z.string().uuid().optional().nullable().or(z.literal('')),
  isActive: z.boolean().optional(),
});

const updateCustomerSchema = createCustomerSchema.partial();

/**
 * Customer Note validation schemas
 */
const createCustomerNoteSchema = z.object({
  content: z.string({ required_error: 'Note content is required' })
    .trim()
    .min(1, 'Note content cannot be empty'),
});

const updateCustomerNoteSchema = createCustomerNoteSchema.partial();

// ==================================================
// PHASE 7 VALIDATION SCHEMAS
// ==================================================

/**
 * Booking validation schemas
 */
const createBookingSchema = z.object({
  customerId: z.string().uuid('Invalid customer ID format').optional().nullable().or(z.literal('')),
  serviceId: z.string({ required_error: 'serviceId is required' }).uuid('Invalid service ID format'),
  staffId: z.string({ required_error: 'staffId is required' }).uuid('Invalid staff ID format'),
  startTime: z.string({ required_error: 'startTime is required' })
    .refine((val) => !isNaN(Date.parse(val)), 'Invalid ISO start time'),
  notes: z.string().trim().optional().nullable().or(z.literal('')),
});

const updateBookingSchema = z.object({
  staffId: z.string().uuid().optional(),
  startTime: z.string().refine((val) => !isNaN(Date.parse(val)), 'Invalid ISO start time').optional(),
  notes: z.string().trim().optional().nullable().or(z.literal('')),
});

const cancelBookingSchema = z.object({
  reason: z.string().trim().optional().nullable().or(z.literal('')),
});

const changeBookingStatusSchema = z.object({
  status: z.enum(['PENDING', 'CONFIRMED', 'IN_PROGRESS', 'COMPLETED', 'CANCELLED', 'NO_SHOW'], {
    required_error: 'Status is required',
  }),
  reason: z.string().trim().optional().nullable().or(z.literal('')),
});

/**
 * Change password validation schema
 */
const changePasswordSchema = z.object({
  currentPassword: z.string({ required_error: 'Current password is required' })
    .min(1, 'Current password cannot be empty'),
  newPassword: z.string({ required_error: 'New password is required' })
    .min(8, 'New password must be at least 8 characters long'),
});

/**
 * Staff Break validation schema
 */
const createStaffBreakSchema = z.object({
  dayOfWeek: z.number({ required_error: 'dayOfWeek is required' }).int().min(0).max(6),
  startTime: z.string({ required_error: 'startTime is required' }).regex(/^([01]\d|2[0-3]):[0-5]\d$/, 'Invalid time format (HH:MM)'),
  endTime: z.string({ required_error: 'endTime is required' }).regex(/^([01]\d|2[0-3]):[0-5]\d$/, 'Invalid time format (HH:MM)'),
  label: z.string().trim().optional().nullable().or(z.literal('')),
});

const updateStaffBreakSchema = createStaffBreakSchema.partial();

module.exports = {
  registerSchema,
  loginSchema,
  changePasswordSchema,
  createBusinessSchema,
  updateBusinessSchema,
  addMemberSchema,
  updateMemberRoleSchema,
  createCategorySchema,
  updateCategorySchema,
  createServiceSchema,
  updateServiceSchema,
  createStaffProfileSchema,
  updateStaffProfileSchema,
  setStaffServicesSchema,
  updateScheduleSchema,
  createTimeOffSchema,
  createStaffBreakSchema,
  updateStaffBreakSchema,
  createCustomerSchema,
  updateCustomerSchema,
  createCustomerNoteSchema,
  updateCustomerNoteSchema,
  createBookingSchema,
  updateBookingSchema,
  cancelBookingSchema,
  changeBookingStatusSchema,
};
