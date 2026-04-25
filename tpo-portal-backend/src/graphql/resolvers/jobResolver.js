const prisma = require('../../config/prismaClient');
const { authorize, crcCompanyCheck } = require('../../middleware/auth');
const { validateCreateJob } = require('../../utils/validation');
const { logApplication, logAudit, logger } = require('../../utils/logger');
const { sendJobNotificationEmail } = require('../../utils/email');

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

        // Send email notification to eligible students (only for OPEN jobs)
        if (job.status === 'OPEN') {
          // Find all STUDENTs and CRCs (who are also students) whose CGPA meets the minimum requirement
          const eligibleStudents = await prisma.user.findMany({
            where: {
              role: { in: ['STUDENT', 'CRC'] },
              cgpa: {
                gte: job.minCgpa,
                not: null
              }
            },
            select: {
              email: true,
              cgpa: true
            }
          });

          logger.info('Job notification - Eligible students', {
            jobTitle: job.title,
            minCgpa: job.minCgpa,
            eligibleCount: eligibleStudents.length,
            emails: eligibleStudents.map(s => s.email)
          });

          // Send emails to eligible students (using BCC for bulk sending)
          if (eligibleStudents.length > 0) {
            const studentEmails = eligibleStudents.map(s => s.email);
            await sendJobNotificationEmail({
              emails: studentEmails,
              companyName: job.company.name,
              jobTitle: job.title,
              minCgpa: job.minCgpa
            });
          }
        }

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

      // If minCgpa was lowered, send emails to newly eligible students only
      if (input.minCgpa !== undefined && input.minCgpa < existing.minCgpa && updated.status === 'OPEN') {
        const newlyEligibleStudents = await prisma.user.findMany({
          where: {
            role: { in: ['STUDENT', 'CRC'] },
            cgpa: {
              gte: updated.minCgpa,   // New lower bound (inclusive)
              lt: existing.minCgpa     // Old upper bound (exclusive) - only students in this range
            }
          },
          select: {
            email: true,
            cgpa: true
          }
        });

        logger.info('Job CGPA lowered - Sending notifications to newly eligible students', {
          jobId: updated.id,
          jobTitle: updated.title,
          oldCgpa: existing.minCgpa,
          newCgpa: updated.minCgpa,
          newlyEligibleCount: newlyEligibleStudents.length
        });

        if (newlyEligibleStudents.length > 0) {
          const studentEmails = newlyEligibleStudents.map(s => s.email);
          await sendJobNotificationEmail({
            emails: studentEmails,
            companyName: updated.company.name,
            jobTitle: updated.title,
            minCgpa: updated.minCgpa
          });
        }
      }

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
