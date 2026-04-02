const prisma = require('../../config/prismaClient');
const { authorize, studentAccessCheck } = require('../../middleware/auth');
const { sanitizeUser, isValidEmailDomain, validateUpdateProfile } = require('../../utils/validation');
const { hashPassword } = require('../../utils/auth');
const { logAudit, logger } = require('../../utils/logger');

module.exports = {
  Query: {
    users: async (_, __, { user }) => {
      authorize(user, ['ADMIN', 'CRC']);

      const users = await prisma.user.findMany({
        orderBy: { createdAt: 'desc' }
      });

      return users.map(sanitizeUser);
    },

    user: async (_, { id }, { user }) => {
      authorize(user, ['ADMIN', 'CRC', 'STUDENT']);

      // Students can only view their own profile
      if (user.role === 'STUDENT') {
        studentAccessCheck(user, parseInt(id));
      }

      const targetUser = await prisma.user.findUnique({
        where: { id: parseInt(id) }
      });

      if (!targetUser) {
        throw new Error('User not found');
      }

      return sanitizeUser(targetUser);
    },

    students: async (_, __, { user }) => {
      authorize(user, ['ADMIN', 'CRC']);

      // Return both STUDENT and CRC users (CRC are students with additional privileges)
      return await prisma.user.findMany({
        where: { role: { in: ['STUDENT', 'CRC'] } },
        orderBy: { createdAt: 'desc' }
      });
    }
  },

  Mutation: {
    updateProfile: async (_, args, { user }) => {
      if (!user) {
        throw new Error('Not authenticated');
      }

      // Validate input with CGPA (0-10) check
      const validated = validateUpdateProfile(args);

      const { name, cgpa, skills, resumeUrl, reportCardUrl } = validated;

      const updated = await prisma.user.update({
        where: { id: user.id },
        data: {
          ...(name && { name }),
          ...(cgpa !== undefined && { cgpa }),
          ...(skills && { skills }),
          ...(resumeUrl && { resumeUrl }),
          ...(reportCardUrl && { reportCardUrl })
        }
      });

      logAudit.dataAccess(user.id, 'profile_update');

      return sanitizeUser(updated);
    },

    changePassword: async (_, { newPassword }, { user }) => {
      if (!user) {
        throw new Error('Not authenticated');
      }

      // Get current user with password
      const currentUser = await prisma.user.findUnique({
        where: { id: user.id },
        select: { password: true }
      });

      // Check if new password is same as old password
      const { comparePassword } = require('../../utils/auth');
      const isSamePassword = await comparePassword(newPassword, currentUser.password);

      if (isSamePassword) {
        throw new Error('New password cannot be the same as your current password');
      }

      // Hash new password
      const hashedPassword = await hashPassword(newPassword);

      // Update password
      await prisma.user.update({
        where: { id: user.id },
        data: { password: hashedPassword }
      });

      logAudit.dataAccess(user.id, 'password_change');

      return true;
    },

    /**
     * ADMIN: Assign CRC role to an existing student by email
     * - Only ADMIN can call this
     * - User must exist and be a STUDENT
     * - Email must be @nitsri.ac.in
     * - Cannot assign ADMIN as CRC
     */
    assignCRC: async (_, { email }, { user }) => {
      authorize(user, ['ADMIN']);

      // Validate email domain
      if (!isValidEmailDomain(email)) {
        throw new Error('Only @nitsri.ac.in email addresses are allowed');
      }

      // Find user by email
      const targetUser = await prisma.user.findUnique({
        where: { email }
      });

      if (!targetUser) {
        throw new Error('User not found with this email');
      }

      // Prevent assigning ADMIN as CRC
      if (targetUser.role === 'ADMIN') {
        throw new Error('Cannot assign ADMIN as CRC');
      }

      // If already CRC, no action needed
      if (targetUser.role === 'CRC') {
        logger.info('User is already a CRC', { email, userId: targetUser.id });
        return true;
      }

      // Update role to CRC
      await prisma.user.update({
        where: { id: targetUser.id },
        data: { role: 'CRC' }
      });

      logAudit.dataAccess(user.id, `assign_crc_${email}`);

      logger.info('CRC assigned successfully', {
        adminId: user.id,
        crcId: targetUser.id,
        email
      });

      return true;
    },

    /**
     * ADMIN: Remove CRC role (revert to STUDENT)
     * - Only ADMIN can call this
     * - User must exist and be a CRC
     */
    removeCRC: async (_, { email }, { user }) => {
      authorize(user, ['ADMIN']);

      // Find user by email
      const targetUser = await prisma.user.findUnique({
        where: { email }
      });

      if (!targetUser) {
        throw new Error('User not found with this email');
      }

      if (targetUser.role !== 'CRC') {
        throw new Error('User is not a CRC');
      }

      // Update role to STUDENT
      await prisma.user.update({
        where: { id: targetUser.id },
        data: { role: 'STUDENT' }
      });

      logAudit.dataAccess(user.id, `remove_crc_${email}`);

      logger.info('CRC role removed', {
        adminId: user.id,
        userId: targetUser.id,
        email
      });

      return true;
    },

    deleteUser: async (_, { id }, { user }) => {
      authorize(user, ['ADMIN']);

      const targetUser = await prisma.user.findUnique({
        where: { id: parseInt(id) }
      });

      if (!targetUser) {
        throw new Error('User not found');
      }

      // Cannot delete yourself
      if (parseInt(id) === user.id) {
        throw new Error('Cannot delete your own account');
      }

      await prisma.user.delete({
        where: { id: parseInt(id) }
      });

      logAudit.dataAccess(user.id, `user_delete_${id}`);

      return true;
    }
  }
};
