const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const { logger } = require('./logger');

// JWT configuration
const JWT_SECRET = process.env.JWT_SECRET || 'default-secret-key';
const JWT_EXPIRY = '24h'; // 24 hours
const SALT_ROUNDS = 12;

/**
 * Generate JWT token for user
 * @param {Object} user - User object
 * @returns {string} - JWT token
 */
function generateToken(user) {
  const payload = {
    id: user.id,
    email: user.email,
    role: user.role
  };

  return jwt.sign(payload, JWT_SECRET, { expiresIn: JWT_EXPIRY });
}

/**
 * Verify JWT token
 * @param {string} token - JWT token
 * @returns {Object} - Decoded token payload
 * @throws {Error} - If token is invalid or expired
 */
function verifyToken(token) {
  try {
    return jwt.verify(token, JWT_SECRET);
  } catch (error) {
    if (error.name === 'TokenExpiredError') {
      throw new Error('Token has expired');
    } else if (error.name === 'JsonWebTokenError') {
      throw new Error('Invalid token');
    }
    throw error;
  }
}

/**
 * Hash password using bcrypt
 * @param {string} password - Plain text password
 * @returns {Promise<string>} - Hashed password
 */
async function hashPassword(password) {
  return await bcrypt.hash(password, SALT_ROUNDS);
}

/**
 * Compare password with hash
 * @param {string} password - Plain text password
 * @param {string} hash - Hashed password
 * @returns {Promise<boolean>} - True if password matches
 */
async function comparePassword(password, hash) {
  return await bcrypt.compare(password, hash);
}

/**
 * Generate 6-digit OTP
 * @returns {string} - 6-digit OTP
 */
function generateOTP() {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

/**
 * Hash OTP using bcrypt
 * @param {string} otp - Plain text OTP
 * @returns {Promise<string>} - Hashed OTP
 */
async function hashOTP(otp) {
  return await bcrypt.hash(otp, SALT_ROUNDS);
}

/**
 * Compare OTP with hash
 * @param {string} otp - Plain text OTP
 * @param {string} hash - Hashed OTP
 * @returns {Promise<boolean>} - True if OTP matches
 */
async function compareOTP(otp, hash) {
  return await bcrypt.compare(otp, hash);
}

/**
 * Extract token from Authorization header
 * @param {string} authHeader - Authorization header value
 * @returns {string|null} - Token or null if not found
 */
function extractToken(authHeader) {
  if (!authHeader) return null;
  if (authHeader.startsWith('Bearer ')) {
    return authHeader.substring(7);
  }
  return authHeader;
}

module.exports = {
  generateToken,
  verifyToken,
  hashPassword,
  comparePassword,
  generateOTP,
  hashOTP,
  compareOTP,
  extractToken
};
