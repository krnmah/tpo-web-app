const prisma = require('../../config/prismaClient');
const { authorize, crcCompanyCheck } = require('../../middleware/auth');
const { validateCreateJob } = require('../../utils/validation');
const { logApplication, logAudit } = require('../../utils/logger');

module.exports = {
  Job: {
    company: async (job, _, __) => {
      return await prisma.company.findUnique({
        where: { id: job.companyId }
      });
    },

    // Add application count
    _applicationCount: async (job, _, __) => {
      const count = await prisma.application.count({
        where: { jobId: job.id }
      });
      return count;
    },

    // Add eligibility check for current user
    _isEligible: async (job, _, { user }) => {
      if (!user || (user.role !== 'STUDENT' && user.role !== 'CRC')) return null;

      const student = await prisma.user.findUnique({
        where: { id: user.id }
      });

      if (!student || student.cgpa === null) return false;

      return student.cgpa >= job.minCgpa;
    }
  },

  Query: {
    jobs: async (_, { status }, { user }) => {
      authorize(user, ['ADMIN', 'CRC', 'STUDENT']);

      const where = status ? { status } : {};

      return await prisma.job.findMany({
        where,
        include: {
          company: true
        },
        orderBy: { createdAt: 'desc' }
      });
    },

    job: async (_, { id }, { user }) => {
      authorize(user, ['ADMIN', 'CRC', 'STUDENT']);

      const job = await prisma.job.findUnique({
        where: { id: parseInt(id) },
        include: {
          company: true
        }
      });

      if (!job) {
        throw new Error('Job not found');
      }

      return job;
    },

    jobsByCompany: async (_, { companyId }, { user }) => {
      authorize(user, ['ADMIN', 'CRC', 'STUDENT']);

      // CRC can only see jobs from their assigned companies
      if (user.role === 'CRC') {
        await crcCompanyCheck(user, parseInt(companyId));
      }

      return await prisma.job.findMany({
        where: { companyId: parseInt(companyId) },
        include: {
          company: true
        },
        orderBy: { createdAt: 'desc' }
      });
    },

    eligibleJobs: async (_, __, { user }) => {
      // Both STUDENT and CRC can see eligible jobs (CRC is also a student)
      authorize(user, ['STUDENT', 'CRC']);

      const student = await prisma.user.findUnique({
        where: { id: user.id }
      });

      if (!student || student.cgpa === null) {
        return [];
      }

      const jobs = await prisma.job.findMany({
        where: {
          status: 'OPEN',
          minCgpa: { lte: student.cgpa }
        },
        include: {
          company: true
        },
        orderBy: { createdAt: 'desc' }
      });

      return jobs;
    }
  },

  Mutation: {
    createJob: async (_, { input }, { user }) => {
      authorize(user, ['ADMIN', 'CRC']);

      try {
        const validated = validateCreateJob(input);

        // CRC can only create jobs for their assigned companies
        if (user.role === 'CRC') {
          await crcCompanyCheck(user, validated.companyId);
        }

        const job = await prisma.job.create({
          data: {
            title: validated.title,
            description: validated.description,
            companyId: validated.companyId,
            minCgpa: validated.minCgpa,
            requiredSkills: validated.requiredSkills,
            status: validated.status || 'OPEN'
          },
          include: {
            company: true
          }
        });

        logAudit.dataAccess(user.id, `job_create_${job.id}`);

        return job;
      } catch (error) {
        if (error.name === 'ZodError') {
          throw new Error(error.errors.map(e => e.message).join(', '));
        }
        throw error;
      }
    },

    updateJob: async (_, { id, input }, { user }) => {
      authorize(user, ['ADMIN', 'CRC']);

      const existing = await prisma.job.findUnique({
        where: { id: parseInt(id) }
      });

      if (!existing) {
        throw new Error('Job not found');
      }

      // CRC can only update jobs from their assigned companies
      if (user.role === 'CRC') {
        await crcCompanyCheck(user, existing.companyId);
      }

      const updated = await prisma.job.update({
        where: { id: parseInt(id) },
        data: input,
        include: {
          company: true
        }
      });

      logAudit.dataAccess(user.id, `job_update_${id}`);

      return updated;
    },

    deleteJob: async (_, { id }, { user }) => {
      authorize(user, ['ADMIN', 'CRC']);

      const existing = await prisma.job.findUnique({
        where: { id: parseInt(id) },
        include: {
          _count: { select: { applications: true } }
        }
      });

      if (!existing) {
        throw new Error('Job not found');
      }

      // CRC can only delete jobs from their assigned companies
      if (user.role === 'CRC') {
        await crcCompanyCheck(user, existing.companyId);
      }

      if (existing._count.applications > 0) {
        throw new Error('Cannot delete job with existing applications');
      }

      await prisma.job.delete({
        where: { id: parseInt(id) }
      });

      logAudit.dataAccess(user.id, `job_delete_${id}`);

      return true;
    },

    closeJob: async (_, { id }, { user }) => {
      authorize(user, ['ADMIN', 'CRC']);

      const existing = await prisma.job.findUnique({
        where: { id: parseInt(id) }
      });

      if (!existing) {
        throw new Error('Job not found');
      }

      // CRC can only close jobs from their assigned companies
      if (user.role === 'CRC') {
        await crcCompanyCheck(user, existing.companyId);
      }

      const updated = await prisma.job.update({
        where: { id: parseInt(id) },
        data: { status: 'CLOSED' },
        include: {
          company: true
        }
      });

      logAudit.dataAccess(user.id, `job_close_${id}`);

      return updated;
    }
  }
};
