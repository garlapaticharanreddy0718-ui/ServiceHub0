const { verifyAccessToken } = require('../utils/tokenUtils');
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

/**
 * Protect routes by verifying JWT Bearer token in Authorization header
 */
const authenticate = async (req, res, next) => {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({
      status: 'fail',
      message: 'Authentication required. Missing or malformed Bearer token.',
    });
  }

  const token = authHeader.split(' ')[1];

  try {
    const decoded = verifyAccessToken(token);

    // Verify user still exists in database
    const user = await prisma.user.findUnique({
      where: { id: decoded.userId },
      select: {
        id: true,
        name: true,
        email: true,
        phone: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    if (!user) {
      return res.status(401).json({
        status: 'fail',
        message: 'The user belonging to this token no longer exists.',
      });
    }

    req.user = user;
    next();
  } catch (err) {
    if (err.name === 'TokenExpiredError') {
      return res.status(401).json({
        status: 'fail',
        message: 'Access token expired.',
      });
    }

    return res.status(401).json({
      status: 'fail',
      message: 'Invalid access token.',
    });
  }
};

module.exports = {
  authenticate,
};
