const bcrypt = require('bcryptjs');
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

const { registerSchema, loginSchema, changePasswordSchema } = require('../utils/validationSchemas');
const {
  signAccessToken,
  signRefreshToken,
  verifyRefreshToken,
  hashToken,
  calculateRefreshExpiration,
} = require('../utils/tokenUtils');

/**
 * Format user object to safely exclude passwordHash
 */
const formatSafeUser = (user) => {
  const { passwordHash, ...safeUser } = user;
  return safeUser;
};

/**
 * Register a new user
 */
const registerUser = async (data) => {
  // Validate request input
  const validated = registerSchema.parse(data);

  // Check if user already exists
  const existingUser = await prisma.user.findUnique({
    where: { email: validated.email },
  });

  if (existingUser) {
    const error = new Error('Email address is already registered.');
    error.statusCode = 409;
    throw error;
  }

  // Hash password
  const passwordHash = await bcrypt.hash(validated.password, 12);

  // Create user
  const user = await prisma.user.create({
    data: {
      name: validated.name,
      email: validated.email,
      passwordHash,
      phone: validated.phone || null,
    },
  });

  return formatSafeUser(user);
};

/**
 * Authenticate user credentials and issue tokens
 */
const loginUser = async (data) => {
  // Validate request input
  const validated = loginSchema.parse(data);

  // Find user by email
  const user = await prisma.user.findUnique({
    where: { email: validated.email },
  });

  if (!user) {
    const error = new Error('Invalid email or password.');
    error.statusCode = 401;
    throw error;
  }

  // Verify password match
  const isMatch = await bcrypt.compare(validated.password, user.passwordHash);
  if (!isMatch) {
    const error = new Error('Invalid email or password.');
    error.statusCode = 401;
    throw error;
  }

  // Generate tokens
  const accessToken = signAccessToken({ userId: user.id, email: user.email });
  const rawRefreshToken = signRefreshToken({ userId: user.id });
  const tokenHash = hashToken(rawRefreshToken);
  const expiresAt = calculateRefreshExpiration();

  // Store hashed refresh token in database
  await prisma.refreshToken.create({
    data: {
      userId: user.id,
      tokenHash,
      expiresAt,
    },
  });

  return {
    accessToken,
    refreshToken: rawRefreshToken,
    user: formatSafeUser(user),
  };
};

/**
 * Refresh access token and rotate refresh token using HttpOnly cookie
 */
const refreshTokenPair = async (rawRefreshToken) => {
  if (!rawRefreshToken) {
    const error = new Error('Refresh token is required.');
    error.statusCode = 401;
    throw error;
  }

  let decoded;
  try {
    decoded = verifyRefreshToken(rawRefreshToken);
  } catch (err) {
    const error = new Error('Invalid or expired refresh token.');
    error.statusCode = 401;
    throw error;
  }

  const tokenHash = hashToken(rawRefreshToken);

  // Look up active token session in database
  const storedToken = await prisma.refreshToken.findFirst({
    where: {
      tokenHash,
      userId: decoded.userId,
    },
  });

  if (!storedToken || storedToken.revokedAt || storedToken.expiresAt < new Date()) {
    const error = new Error('Refresh token revoked or expired.');
    error.statusCode = 401;
    throw error;
  }

  // Revoke old refresh token (Token Rotation)
  await prisma.refreshToken.update({
    where: { id: storedToken.id },
    data: { revokedAt: new Date() },
  });

  // Generate new token pair
  const newAccessToken = signAccessToken({ userId: decoded.userId });
  const newRawRefreshToken = signRefreshToken({ userId: decoded.userId });
  const newTokenHash = hashToken(newRawRefreshToken);
  const newExpiresAt = calculateRefreshExpiration();

  // Save new hashed refresh token
  await prisma.refreshToken.create({
    data: {
      userId: decoded.userId,
      tokenHash: newTokenHash,
      expiresAt: newExpiresAt,
    },
  });

  return {
    accessToken: newAccessToken,
    refreshToken: newRawRefreshToken,
  };
};

/**
 * Revoke refresh token and terminate session
 */
const logoutUser = async (rawRefreshToken) => {
  if (rawRefreshToken) {
    const tokenHash = hashToken(rawRefreshToken);
    await prisma.refreshToken.updateMany({
      where: { tokenHash, revokedAt: null },
      data: { revokedAt: new Date() },
    });
  }
  return true;
};

/**
 * Fetch authenticated user profile
 */
const getCurrentUser = async (userId) => {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    include: {
      customers: {
        select: { address: true },
        take: 1,
      },
    },
  });

  if (!user) {
    const error = new Error('User not found.');
    error.statusCode = 404;
    throw error;
  }

  const primaryAddress = user.customers && user.customers.length > 0 ? user.customers[0].address : null;
  const safeUser = formatSafeUser(user);
  delete safeUser.customers;
  safeUser.address = primaryAddress || null;

  return safeUser;
};

/**
 * Update authenticated user profile (name, email, phone, address)
 */
const updateUserProfile = async (userId, data) => {
  const { z } = require('zod');
  const schema = z.object({
    name: z.string().trim().min(1, 'Full name cannot be empty.').optional(),
    email: z.string().trim().email('Please enter a valid email address.').optional(),
    phone: z.string().trim().optional().nullable(),
    address: z.string().trim().optional().nullable(),
  });

  const validated = schema.parse(data);
  const addressVal = validated.address;
  delete validated.address;

  if (validated.email) {
    const emailLower = validated.email.toLowerCase();
    const existing = await prisma.user.findFirst({
      where: {
        email: emailLower,
        id: { not: userId },
      },
    });
    if (existing) {
      const error = new Error('Email address is already in use by another account.');
      error.statusCode = 400;
      throw error;
    }
    validated.email = emailLower;
  }

  let updatedUser = await prisma.user.findUnique({ where: { id: userId } });
  if (Object.keys(validated).length > 0) {
    updatedUser = await prisma.user.update({
      where: { id: userId },
      data: validated,
    });
  }

  const customerSyncData = {};
  if (validated.name) customerSyncData.name = validated.name;
  if (validated.email) customerSyncData.email = validated.email;
  if (validated.phone !== undefined) customerSyncData.phone = validated.phone;
  if (addressVal !== undefined) customerSyncData.address = addressVal;

  if (Object.keys(customerSyncData).length > 0) {
    await prisma.customer.updateMany({
      where: { userId },
      data: customerSyncData,
    });
  }

  const linkedCustomer = await prisma.customer.findFirst({
    where: { userId },
    select: { address: true },
  });

  const safeUser = formatSafeUser(updatedUser);
  safeUser.address = addressVal !== undefined ? addressVal : (linkedCustomer?.address || null);

  return safeUser;
};

/**
 * Change authenticated user password
 */
const changeUserPassword = async (userId, data) => {
  const validated = changePasswordSchema.parse(data);

  const user = await prisma.user.findUnique({
    where: { id: userId },
  });

  if (!user) {
    const error = new Error('User not found.');
    error.statusCode = 404;
    throw error;
  }

  // 1. Verify current password
  const isMatch = await bcrypt.compare(validated.currentPassword, user.passwordHash);
  if (!isMatch) {
    const error = new Error('Current password is incorrect.');
    error.statusCode = 400;
    throw error;
  }

  // 2. Reject if new password is same as current password
  if (validated.currentPassword === validated.newPassword) {
    const error = new Error('New password must be different from current password.');
    error.statusCode = 400;
    throw error;
  }

  // 3. Hash new password
  const newPasswordHash = await bcrypt.hash(validated.newPassword, 12);

  // 4. Update User passwordHash & set mustChangePassword = false
  const updatedUser = await prisma.user.update({
    where: { id: userId },
    data: {
      passwordHash: newPasswordHash,
      mustChangePassword: false,
    },
  });

  // 5. Revoke existing refresh tokens
  await prisma.refreshToken.updateMany({
    where: {
      userId,
      revokedAt: null,
    },
    data: {
      revokedAt: new Date(),
    },
  });

  return formatSafeUser(updatedUser);
};

module.exports = {
  registerUser,
  loginUser,
  refreshTokenPair,
  logoutUser,
  getCurrentUser,
  updateUserProfile,
  changeUserPassword,
};
