const prisma = require('../../config/prismaClient');
const { authorize } = require('../../middleware/auth');
const { validateCreateCompany } = require('../../utils/validation');
const { logAudit, logger } = require('../../utils/logger');

module.exports = {
  Company: {
    assignedCRC: async (company, _, __) => {
      if (!company.assignedCRC) return null;
      const crc = await prisma.user.findUnique({
        where: { id: company.assignedCRC },
        select: {
          id: true,
          name: true,
          email: true,
          role: true
        }
      });
      return crc;
    }
  },

  Query: {
    companies: async (_, __, { user }) => {
      authorize(user, ['ADMIN', 'CRC', 'STUDENT']);

      return await prisma.company.findMany({
        include: {
          _count: {
            select: { jobs: true }
          }
        },
        orderBy: { createdAt: 'desc' }
      });
    },

    company: async (_, { id }, { user }) => {
      authorize(user, ['ADMIN', 'CRC', 'STUDENT']);

      const company = await prisma.company.findUnique({
        where: { id: parseInt(id) }
      });

      if (!company) {
        throw new Error('Company not found');
      }

      return company;
    },

    /**
     * CRC: Get companies assigned to me
     * Returns only companies where assignedCRC = current user.id
     */
    myCompanies: async (_, __, { user }) => {
      authorize(user, ['CRC']);

      const companies = await prisma.company.findMany({
        where: { assignedCRC: user.id },
        orderBy: { createdAt: 'desc' }
      });

      logger.info('CRC fetched their companies', {
        crcId: user.id,
        count: companies.length
      });

      return companies;
    }
  },

  Mutation: {
    /**
     * ADMIN: Create company with optional CRC assignment
     */
    createCompany: async (_, { input }, { user }) => {
      authorize(user, ['ADMIN']);

      try {
        const validated = validateCreateCompany(input);

        // Check if assigned CRC exists and is actually a CRC
        if (validated.assignedCRC) {
          const crc = await prisma.user.findUnique({
            where: { id: validated.assignedCRC }
          });

          if (!crc) {
            throw new Error('Assigned CRC user not found');
          }

          if (crc.role !== 'CRC') {
            throw new Error('Assigned user must be a CRC');
          }
        }

        const company = await prisma.company.create({
          data: {
            name: validated.name,
            description: validated.description,
            ...(validated.assignedCRC && { assignedCRC: validated.assignedCRC })
          }
        });

        logAudit.dataAccess(user.id, `company_create_${company.id}`);

        return company;
      } catch (error) {
        if (error.name === 'ZodError') {
          throw new Error(error.errors.map(e => e.message).join(', '));
        }
        throw error;
      }
    },

    /**
     * CRC: Create company (auto-assigned to self)
     * - Only CRC can call this
     * - Company is automatically assigned to the creating CRC
     */
    createMyCompany: async (_, { name, description }, { user }) => {
      authorize(user, ['CRC']);

      try {
        // Validate inputs
        const validated = validateCreateCompany({ name, description });

        // Create company and auto-assign to current CRC
        const company = await prisma.company.create({
          data: {
            name: validated.name,
            description: validated.description,
            assignedCRC: user.id  // Auto-assign to creating CRC
          }
        });

        logAudit.dataAccess(user.id, `crc_company_create_${company.id}`);

        logger.info('CRC created company', {
          crcId: user.id,
          companyId: company.id,
          companyName: company.name
        });

        return company;
      } catch (error) {
        if (error.name === 'ZodError') {
          throw new Error(error.errors.map(e => e.message).join(', '));
        }
        throw error;
      }
    },

    updateCompany: async (_, { id, input }, { user }) => {
      const existing = await prisma.company.findUnique({
        where: { id: parseInt(id) }
      });

      if (!existing) {
        throw new Error('Company not found');
      }

      // Determine access based on role
      if (user.role === 'CRC') {
        // CRC can only update their own assigned companies
        if (existing.assignedCRC !== user.id) {
          logAudit.accessDenied(user.id, 'company', 'CRC not assigned to this company');
          throw new Error('Forbidden: You can only update your assigned companies');
        }

        // CRC cannot reassign company to someone else
        if (input.assignedCRC && input.assignedCRC !== user.id) {
          throw new Error('Forbidden: CRC cannot reassign their company');
        }

        // CRC can only update name and description
        const allowedUpdates = {};
        if (input.name !== undefined) allowedUpdates.name = input.name;
        if (input.description !== undefined) allowedUpdates.description = input.description;

        const updated = await prisma.company.update({
          where: { id: parseInt(id) },
          data: allowedUpdates
        });

        logAudit.dataAccess(user.id, `crc_company_update_${id}`);

        return updated;
      }

      // Admin has full access
      authorize(user, ['ADMIN']);

      // Check if assigned CRC exists and is actually a CRC
      if (input.assignedCRC) {
        const crc = await prisma.user.findUnique({
          where: { id: input.assignedCRC }
        });

        if (!crc || crc.role !== 'CRC') {
          throw new Error('Assigned user must be a CRC');
        }
      }

      const updated = await prisma.company.update({
        where: { id: parseInt(id) },
        data: input
      });

      logAudit.dataAccess(user.id, `company_update_${id}`);

      return updated;
    },

    deleteCompany: async (_, { id }, { user }) => {
      authorize(user, ['ADMIN']);

      const existing = await prisma.company.findUnique({
        where: { id: parseInt(id) },
        include: {
          _count: { select: { jobs: true } }
        }
      });

      if (!existing) {
        throw new Error('Company not found');
      }

      if (existing._count.jobs > 0) {
        throw new Error('Cannot delete company with existing jobs. Delete jobs first.');
      }

      await prisma.company.delete({
        where: { id: parseInt(id) }
      });

      logAudit.dataAccess(user.id, `company_delete_${id}`);

      return true;
    },

    assignCRCToCompany: async (_, { companyId, crcId }, { user }) => {
      authorize(user, ['ADMIN']);

      // Check company exists
      const company = await prisma.company.findUnique({
        where: { id: parseInt(companyId) }
      });

      if (!company) {
        throw new Error('Company not found');
      }

      // Check CRC exists and is actually a CRC
      const crc = await prisma.user.findUnique({
        where: { id: parseInt(crcId) }
      });

      if (!crc) {
        throw new Error('CRC user not found');
      }

      if (crc.role !== 'CRC') {
        throw new Error('Assigned user must be a CRC');
      }

      const updated = await prisma.company.update({
        where: { id: parseInt(companyId) },
        data: { assignedCRC: parseInt(crcId) }
      });

      logAudit.dataAccess(user.id, `crc_assign_${crcId}_to_company_${companyId}`);

      return updated;
    }
  }
};
