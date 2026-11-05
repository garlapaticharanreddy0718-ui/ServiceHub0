const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const config = require('../config/env');

/**
 * Generate a short-lived access token
 * @param {Object} payload - Token claims ({ userId, email })
 * @returns {string} Signed JWT
 */
const signAccessToken = (payload) => {
  return jwt.sign(payload, config.jwt.accessSecret, {
    expiresIn: config.jwt.accessExpiresIn,
  });
};

/**
 * Generate a long-lived refresh token
 * @param {Object} payload - Token claims ({ userId })
 * @returns {string} Signed JWT
 */
const signRefreshToken = (payload) => {
  return jwt.sign(payload, config.jwt.refreshSecret, {
    expiresIn: config.jwt.refreshExpiresIn,
  });
};

/**
 * Verify an access token
 * @param {string} token - JWT Access Token
 * @returns {Object} Decoded payload
 */
const verifyAccessToken = (token) => {
  return jwt.verify(token, config.jwt.accessSecret);
};

/**
 * Verify a refresh token
 * @param {string} token - JWT Refresh Token
 * @returns {Object} Decoded payload
 */
const verifyRefreshToken = (token) => {
  return jwt.verify(token, config.jwt.refreshSecret);
};

/**
 * Hash a raw token string using SHA-256 for secure database storage
 * @param {string} token - Raw token string
 * @returns {string} Hex-encoded SHA-256 hash
 */
const hashToken = (token) => {
  return crypto.createHash('sha256').update(token).digest('hex');
};

/**
 * Calculate Refresh Token expiration Date object (default 7 days)
 * @returns {Date} Expiration date
 */
const calculateRefreshExpiration = () => {
  const now = new Date();
  // 7 days in milliseconds
  return new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);
};

module.exports = {
  signAccessToken,
  signRefreshToken,
  verifyAccessToken,
  verifyRefreshToken,
  hashToken,
  calculateRefreshExpiration,
};
