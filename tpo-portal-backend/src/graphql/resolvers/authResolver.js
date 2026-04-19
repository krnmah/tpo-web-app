const prisma = require('../../config/prismaClient');
const {
  generateToken,
  hashPassword,
  comparePassword,
  generateOTP,
  hashOTP,
  compareOTP
} = require('../../utils/auth');
const {
  validateRegister,
  validateLogin,
  validatePasswordReset,
  isValidEmailDomain,
  sanitizeUser
} = require('../../utils/validation');
const { sendOTP } = require('../../utils/email');
const { checkOTPRateLimit, checkLoginRateLimit } = require('../../utils/rateLimiter');
const { logAuth, logger } = require('../../utils/logger');

module.exports = {
  Query: {
    me: async (_, __, { user }) => {
      if (!user) {
        const error = new Error('Not authenticated');
error.extensions = { code: 'UNAUTHENTICATED' };
throw error;
      }

      const fullUser = await prisma.user.findUnique({
        where: { id: user.id }
      });

      if (!fullUser) {
        throw new Error('User not found');
      }

      return sanitizeUser(fullUser);
    }
  },

  Mutation: {
    registerStudent: async (_, args) => {
      try {
        // Validate input
        const validated = validateRegister(args);

        // Check if email already exists
        const existingUser = await prisma.user.findUnique({
          where: { email: validated.email }
        });

        if (existingUser) {
          throw new Error('Email already registered');
        }

        // Check if enrollment number already exists
        if (validated.enrollmentNumber) {
          const existingEnrollment = await prisma.user.findUnique({
            where: { enrollmentNumber: validated.enrollmentNumber }
          });

          if (existingEnrollment) {
            throw new Error('Enrollment number already registered');
          }
        }

        // Hash password
        const hashedPassword = await hashPassword(validated.password);

        // Create user
        const user = await prisma.user.create({
          data: {
            name: validated.name,
            enrollmentNumber: validated.enrollmentNumber,
            branch: validated.branch,
            email: validated.email,
            password: hashedPassword,
            cgpa: validated.cgpa,
            skills: validated.skills,
            resumeUrl: validated.resumeUrl,
            reportCardUrl: validated.reportCardUrl,
            role: 'STUDENT'
          }
        });

        logAuth.registerSuccess(user.email, user.id);

        // Generate token
        const token = generateToken(user);

        return {
          token,
          user: sanitizeUser(user)
        };
      } catch (error) {
        if (error.name === 'ZodError') {
          throw new Error(error.errors.map(e => e.message).join(', '));
        }
        throw error;
      }
    },

    login: async (_, args) => {
      try {
        // Validate input
        const validated = validateLogin(args);

        // Check rate limit
        checkLoginRateLimit(validated.email);

        // Find user
        const user = await prisma.user.findUnique({
          where: { email: validated.email }
        });

        if (!user) {
          logAuth.loginFailure(validated.email, 'User not found');
          throw new Error('Invalid email or password');
        }

        // Verify password
        const isValid = await comparePassword(validated.password, user.password);

        if (!isValid) {
          logAuth.loginFailure(validated.email, 'Invalid password');
          throw new Error('Invalid email or password');
        }

        logAuth.loginSuccess(user.email, user.id);

        // Generate token
        const token = generateToken(user);

        return {
          token,
          user: sanitizeUser(user)
        };
      } catch (error) {
        if (error.name === 'ZodError') {
          throw new Error(error.errors.map(e => e.message).join(', '));
        }
        throw error;
      }
    },

    sendPasswordResetOTP: async (_, args) => {
      const { email } = args;

      // Validate email domain
      if (!isValidEmailDomain(email)) {
        throw new Error('Only @nitsri.ac.in email addresses are allowed');
      }

      // Check if user exists first (before rate limit check)
      const user = await prisma.user.findUnique({
        where: { email }
      });

      if (!user) {
        throw new Error('This email is not registered. Please sign up first.');
      }

      // Check rate limit
      checkOTPRateLimit(email);

      // Generate OTP
      const otp = generateOTP();
      const otpHash = await hashOTP(otp);
      const expiry = new Date(Date.now() + 5 * 60 * 1000); // 5 minutes

      // Delete any existing OTPs for this email
      await prisma.oTP.deleteMany({
        where: { email }
      });

      // Store OTP
      await prisma.oTP.create({
        data: {
          email,
          otpHash,
          expiry
        }
      });

      // Send OTP email
      const emailSent = await sendOTP(email, otp);
      logAuth.otpSent(email);

      // OTP is sent via email, don't return it in response
      return emailSent;
    },

    verifyOTPAndResetPassword: async (_, args) => {
      try {
        // Validate input
        const validated = validatePasswordReset(args);

        // Find OTP
        const otpRecord = await prisma.oTP.findUnique({
          where: { id: 1 } // We'll search by email instead
        });

        // Get the latest OTP for this email
        const latestOTP = await prisma.oTP.findFirst({
          where: { email: validated.email },
          orderBy: { createdAt: 'desc' }
        });

        if (!latestOTP) {
          logAuth.otpFailed(validated.email, 'OTP not found');
          throw new Error('Invalid or expired OTP');
        }

        // Check if already used
        if (latestOTP.used) {
          logAuth.otpFailed(validated.email, 'OTP already used');
          throw new Error('OTP has already been used. Please request a new one.');
        }

        // Check expiry
        if (new Date() > latestOTP.expiry) {
          logAuth.otpFailed(validated.email, 'OTP expired');
          throw new Error('OTP has expired. Please request a new one.');
        }

        // Check attempts
        if (latestOTP.attempts >= 3) {
          logAuth.otpFailed(validated.email, 'Max attempts exceeded');
          throw new Error('Maximum OTP attempts exceeded. Please request a new one.');
        }

        // Verify OTP
        const isValid = await compareOTP(validated.otp, latestOTP.otpHash);

        if (!isValid) {
          // Increment attempts
          await prisma.oTP.update({
            where: { id: latestOTP.id },
            data: { attempts: latestOTP.attempts + 1 }
          });

          logAuth.otpFailed(validated.email, 'Invalid OTP');
          throw new Error(`Invalid OTP. ${3 - latestOTP.attempts - 1} attempts remaining.`);
        }

        // OTP is valid - mark as used
        await prisma.oTP.update({
          where: { id: latestOTP.id },
          data: { used: true }
        });

        // Update password
        const hashedPassword = await hashPassword(validated.newPassword);

        await prisma.user.update({
          where: { email: validated.email },
          data: { password: hashedPassword }
        });

        // Delete the used OTP
        await prisma.oTP.delete({
          where: { id: latestOTP.id }
        });

        logAuth.passwordReset(validated.email);
        logAuth.otpVerified(validated.email);

        return true;
      } catch (error) {
        if (error.name === 'ZodError') {
          throw new Error(error.errors.map(e => e.message).join(', '));
        }
        throw error;
      }
    },

    // Send email verification OTP for signup
    sendEmailVerificationOTP: async (_, args) => {
      const { email } = args;

      // Validate email domain
      if (!isValidEmailDomain(email)) {
        throw new Error('Only @nitsri.ac.in email addresses are allowed');
      }

      // Check if email already exists
      const existingUser = await prisma.user.findUnique({
        where: { email }
      });

      if (existingUser) {
        throw new Error('Email is already registered. Please login instead.');
      }

      // Check rate limit
      checkOTPRateLimit(email);

      // Generate OTP
      const otp = generateOTP();
      const otpHash = await hashOTP(otp);
      const expiry = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes for signup

      // Delete any existing OTPs for this email
      await prisma.oTP.deleteMany({
        where: { email }
      });

      // Store OTP
      await prisma.oTP.create({
        data: {
          email,
          otpHash,
          expiry
        }
      });

      // Send OTP email
      const emailSent = await sendOTP(email, otp, 'email_verification');
      logAuth.otpSent(email);

      return emailSent;
    },

    // Verify email OTP during signup
    verifyEmailOTP: async (_, args) => {
      const { email, otp } = args;

      // Validate email domain
      if (!isValidEmailDomain(email)) {
        throw new Error('Invalid email domain');
      }

      // Get the latest OTP for this email
      const latestOTP = await prisma.oTP.findFirst({
        where: { email },
        orderBy: { createdAt: 'desc' }
      });

      if (!latestOTP) {
        logAuth.otpFailed(email, 'OTP not found');
        throw new Error('OTP not found. Please request a new one.');
      }

      // Check if already used
      if (latestOTP.used) {
        logAuth.otpFailed(email, 'OTP already used');
        throw new Error('OTP has already been verified. Please proceed to registration.');
      }

      // Check expiry
      if (new Date() > latestOTP.expiry) {
        logAuth.otpFailed(email, 'OTP expired');
        throw new Error('OTP has expired. Please request a new one.');
      }

      // Check attempts
      if (latestOTP.attempts >= 5) {
        logAuth.otpFailed(email, 'Max attempts exceeded');
        throw new Error('Maximum OTP attempts exceeded. Please request a new one.');
      }

      // Verify OTP
      const isValid = await compareOTP(otp, latestOTP.otpHash);

      if (!isValid) {
        // Increment attempts
        await prisma.oTP.update({
          where: { id: latestOTP.id },
          data: { attempts: latestOTP.attempts + 1 }
        });

        logAuth.otpFailed(email, 'Invalid OTP');
        throw new Error(`Invalid OTP. ${5 - latestOTP.attempts - 1} attempts remaining.`);
      }

      // OTP is valid - mark as used but don't delete yet
      await prisma.oTP.update({
        where: { id: latestOTP.id },
        data: { used: true }
      });

      logAuth.otpVerified(email);

      return true;
    }
  }
};
