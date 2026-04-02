const { verifyToken, extractToken } = require('../utils/auth');
const { logAudit } = require('../utils/logger');
const prisma = require('../config/prismaClient');

/**
 * Authenticate user from JWT token in GraphQL context
 * @param {string} authorization - Authorization header
 * @returns {Promise<Object|null>} - User object or null if not authenticated
 */
async function authenticate(authorization) {
  try {
    const token = extractToken(authorization);
    if (!token) return null;

    const decoded = verifyToken(token);

    // Fetch full user data
    const user = await prisma.user.findUnique({
      where: { id: decoded.id },
      select: {
        id: true,
        email: true,
        role: true,
        name: true,
        enrollmentNumber: true,
        cgpa: true,
        skills: true,
        resumeUrl: true
      }
    });

    if (!user) return null;

    return user;
  } catch (error) {
    // Token expired or invalid
    return null;
  }
}

/**
 * Authorize user based on role
 * @param {Object} user - User object
 * @param {Array<string>} allowedRoles - Array of allowed roles
 * @throws {Error} - If user is not authorized
 */
function authorize(user, allowedRoles) {
  if (!user) {
    throw new Error('Not authenticated');
  }

  if (!allowedRoles.includes(user.role)) {
    logAudit.accessDenied(user?.id, 'role_based', `Role ${user.role} not in ${allowedRoles.join(', ')}`);
    throw new Error('Forbidden: Insufficient permissions');
  }

  return user;
}

/**
 * Check if CRC is assigned to a specific company
 * @param {Object} user - User object
 * @param {number} companyId - Company ID
 * @throws {Error} - If CRC is not assigned to the company
 */
async function crcCompanyCheck(user, companyId) {
  if (!user) {
    throw new Error('Not authenticated');
  }

  // Admin can access any company
  if (user.role === 'ADMIN') {
    return true;
  }

  // CRC can only access assigned companies
  if (user.role === 'CRC') {
    const company = await prisma.company.findUnique({
      where: { id: companyId },
      select: { assignedCRC: true }
    });

    if (!company) {
      throw new Error('Company not found');
    }

    if (company.assignedCRC !== user.id) {
      logAudit.accessDenied(user.id, 'company', `CRC not assigned to company ${companyId}`);
      throw new Error('Forbidden: You are not assigned to this company');
    }

    return true;
  }

  // Students cannot access company management
  logAudit.accessDenied(user.id, 'company', `Role ${user.role} cannot access company management`);
  throw new Error('Forbidden: Insufficient permissions');
}

/**
 * Check if user can access student data
 * @param {Object} user - User object
 * @param {number} targetUserId - Target user ID
 * @throws {Error} - If user cannot access the data
 */
function studentAccessCheck(user, targetUserId) {
  if (!user) {
    throw new Error('Not authenticated');
  }

  // Admin can access any student data
  if (user.role === 'ADMIN') {
    return true;
  }

  // Student can only access their own data
  if (user.role === 'STUDENT' && user.id === targetUserId) {
    return true;
  }

  // CRC can access student data for application management
  // (This is context-specific and will be handled in resolvers)

  logAudit.accessDenied(user.id, 'student', `Cannot access student ${targetUserId}`);
  throw new Error('Forbidden: You cannot access this data');
}

/**
 * Check if user can access application data
 * @param {Object} user - User object
 * @param {Object} application - Application object with job and company
 * @throws {Error} - If user cannot access the data
 */
async function applicationAccessCheck(user, application) {
  if (!user) {
    throw new Error('Not authenticated');
  }

  // Admin can access any application
  if (user.role === 'ADMIN') {
    return true;
  }

  // Student can only access their own applications
  if (user.role === 'STUDENT') {
    if (application.studentId !== user.id) {
      logAudit.accessDenied(user.id, 'application', 'Cannot access other student applications');
      throw new Error('Forbidden: You can only access your own applications');
    }
    return true;
  }

  // CRC can only access applications for assigned companies
  if (user.role === 'CRC') {
    await crcCompanyCheck(user, application.job.companyId);
    return true;
  }

  logAudit.accessDenied(user.id, 'application', `Role ${user.role} cannot access application`);
  throw new Error('Forbidden: Insufficient permissions');
}

/**
 * GraphQL context builder - adds authenticated user to context
 * @param {Object} req - Express request object
 * @returns {Promise<Object>} - GraphQL context
 */
async function buildContext(req) {
  const user = await authenticate(req.headers.authorization);
  return {
    user,
    req
  };
}

module.exports = {
  authenticate,
  authorize,
  crcCompanyCheck,
  studentAccessCheck,
  applicationAccessCheck,
  buildContext
};
