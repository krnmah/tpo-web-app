const z = require('zod');

// Email validation schema - must be @nitsri.ac.in
const emailSchema = z.string()
  .email('Invalid email format')
  .endsWith('@nitsri.ac.in', 'Only @nitsri.ac.in email addresses are allowed');

// Strong password validation schema
// At least 9 characters, 1 uppercase, 1 number, 1 special character
const passwordSchema = z.string()
  .min(9, 'Password must be at least 9 characters long')
  .regex(/[A-Z]/, 'Password must contain at least 1 uppercase letter')
  .regex(/[0-9]/, 'Password must contain at least 1 number')
  .regex(/[^a-zA-Z0-9]/, 'Password must contain at least 1 special character');

// CGPA validation schema (0-10 scale)
const cgpaSchema = z.number()
  .min(0, 'CGPA must be between 0 and 10')
  .max(10, 'CGPA must be between 0 and 10');

// Registration validation schema
const registerSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters'),
  enrollmentNumber: z.string().min(1, 'Enrollment number is required'),
  branch: z.string().min(1, 'Branch is required'),
  email: emailSchema,
  password: passwordSchema,
  cgpa: cgpaSchema,
  skills: z.array(z.string()).default([]), // Optional, defaults to empty array
  resumeUrl: z.string().url('Invalid resume URL'),
  reportCardUrl: z.string().url('Invalid report card URL')
});

// Login validation schema
const loginSchema = z.object({
  email: emailSchema,
  password: z.string().min(1, 'Password is required')
});

// Job creation validation schema
const createJobSchema = z.object({
  title: z.string().min(3, 'Job title must be at least 3 characters'),
  companyId: z.number().int().positive('Invalid company ID'),
  description: z.string().optional(),
  minCgpa: cgpaSchema,
  requiredSkills: z.array(z.string()).min(1, 'At least one skill is required')
});

// Company creation validation schema
const createCompanySchema = z.object({
  name: z.string().min(2, 'Company name must be at least 2 characters'),
  description: z.string().min(10, 'Description must be at least 10 characters').optional().or(z.literal('')),
  assignedCRC: z.number().int().positive().optional()
});

// OTP validation schema
const otpSchema = z.string()
  .regex(/^\d{6}$/, 'OTP must be a 6-digit number');

// Password reset validation schema
const passwordResetSchema = z.object({
  email: emailSchema,
  otp: otpSchema,
  newPassword: passwordSchema
});

// Application status validation schema
const applicationStatusSchema = z.object({
  status: z.enum(['APPLIED', 'SHORTLISTED', 'REJECTED', 'SELECTED'])
});

// Profile update validation schema (all fields optional)
const updateProfileSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters').optional(),
  cgpa: cgpaSchema.optional(),
  skills: z.array(z.string()).optional(),
  resumeUrl: z.string().url('Invalid resume URL').optional(),
  reportCardUrl: z.string().url('Invalid report card URL').optional()
});

/**
 * Validate registration data
 * @throws {z.ZodError} - Validation error
 */
function validateRegister(data) {
  return registerSchema.parse(data);
}

/**
 * Validate login data
 * @throws {z.ZodError} - Validation error
 */
function validateLogin(data) {
  return loginSchema.parse(data);
}

/**
 * Validate job creation data
 * @throws {z.ZodError} - Validation error
 */
function validateCreateJob(data) {
  return createJobSchema.parse(data);
}

/**
 * Validate company creation data
 * @throws {z.ZodError} - Validation error
 */
function validateCreateCompany(data) {
  return createCompanySchema.parse(data);
}

/**
 * Validate OTP
 * @throws {z.ZodError} - Validation error
 */
function validateOTP(otp) {
  return otpSchema.parse(otp);
}

/**
 * Validate password reset data
 * @throws {z.ZodError} - Validation error
 */
function validatePasswordReset(data) {
  return passwordResetSchema.parse(data);
}

/**
 * Validate application status update
 * @throws {z.ZodError} - Validation error
 */
function validateApplicationStatus(data) {
  return applicationStatusSchema.parse(data);
}

/**
 * Validate profile update data
 * @throws {z.ZodError} - Validation error
 */
function validateUpdateProfile(data) {
  return updateProfileSchema.parse(data);
}

/**
 * Validate email domain
 * @returns {boolean} - True if email is @nitsri.ac.in
 */
function isValidEmailDomain(email) {
  try {
    emailSchema.parse(email);
    return true;
  } catch {
    return false;
  }
}

/**
 * Sanitize user object - remove sensitive fields
 * @param {Object} user - User object
 * @returns {Object} - Sanitized user object
 */
function sanitizeUser(user) {
  const { password, ...sanitized } = user;
  return sanitized;
}

/**
 * Format Zod error for GraphQL response
 * @param {z.ZodError} error - Zod validation error
 * @returns {string} - Formatted error message
 */
function formatZodError(error) {
  return error.errors.map(e => `${e.path.join('.')}: ${e.message}`).join(', ');
}

module.exports = {
  validateRegister,
  validateLogin,
  validateCreateJob,
  validateCreateCompany,
  validateOTP,
  validatePasswordReset,
  validateApplicationStatus,
  validateUpdateProfile,
  isValidEmailDomain,
  sanitizeUser,
  formatZodError
};
