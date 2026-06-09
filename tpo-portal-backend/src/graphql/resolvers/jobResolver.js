const prisma = require('../../config/prismaClient');
const { authorize, crcCompanyCheck } = require('../../middleware/auth');
const { validateCreateJob } = require('../../utils/validation');
const { logAudit, logger } = require('../../utils/logger');
const { addBulkJobs } = require('../../queues/emailQueue');
const { sendJobNotificationEmail } = require('../../utils/email');
const { normalizeBranchName } = require('../../utils/branches');

/**
 * Validate salary fields based on job type
 * @param {Object} data - Job data with jobType and salary fields
 * @throws {Error} - If validation fails
 */
function validateJobSalaryFields(data) {
  const { jobType, stipendAmount, ppoAmount, ctcAmount } = data;

  switch (jobType) {
    case 'INTERN_ONLY':
      if (!stipendAmount || stipendAmount <= 0) {
        throw new Error('Stipend amount is required for intern positions');
      }
      break;

    case 'INTERN_PPO':
      if (!stipendAmount || stipendAmount <= 0) {
        throw new Error('Stipend amount is required for intern positions');
      }
      if (!ppoAmount || ppoAmount <= 0) {
        throw new Error('PPO amount is required for Intern + PPO positions');
      }
      break;

    case 'INTERN_FTE':
      if (!stipendAmount || stipendAmount <= 0) {
        throw new Error('Stipend amount is required for intern positions');
      }
      if (!ctcAmount || ctcAmount <= 0) {
        throw new Error('CTC amount is required for positions with FTE');
      }
      break;

    case 'FTE_ONLY':
      if (!ctcAmount || ctcAmount <= 0) {
        throw new Error('CTC amount is required for FTE positions');
      }
      break;

    default:
      throw new Error(`Invalid job type: ${jobType}`);
  }

  // Clear any salary fields that don't apply to this job type
  const cleanedData = { ...data };

  switch (jobType) {
    case 'INTERN_ONLY':
      cleanedData.ppoAmount = null;
      cleanedData.ctcAmount = null;
      break;
    case 'INTERN_PPO':
      cleanedData.ctcAmount = null;
      break;
    case 'INTERN_FTE':
      cleanedData.ppoAmount = null;
      break;
    case 'FTE_ONLY':
      cleanedData.stipendAmount = null;
      cleanedData.ppoAmount = null;
      break;
  }

  return cleanedData;
}

module.exports = {
  Job: {
    company: async (job, _, __) => {
      return await prisma.company.findUnique({
        where: { id: job.companyId }
      });
    },

    // Add application count
    _applicationCount: async (job, _, __) => {
      if (job._count?.applications !== undefined) {
        return job._count.applications;
      }

      const count = await prisma.application.count({
        where: { jobId: job.id }
      });
      return count;
    },

    // Add eligibility check for current user
    _isEligible: async (job, _, { user }) => {
      if (!user || (user.role !== 'STUDENT' && user.role !== 'CRC')) return null;

      if (user.cgpa === null || user.cgpa === undefined) return false;

      // Check CGPA
      if (user.cgpa < job.minCgpa) return false;

      // Check branch (if eligibleBranches is set, student must be in one of them)
      if (job.eligibleBranches && job.eligibleBranches.length > 0) {
        if (!user.branch || !job.eligibleBranches.includes(user.branch)) {
          return false;
        }
      }

      return true;
    }
  },

  Query: {
    jobs: async (_, { status, studentView }, { user }) => {
      authorize(user, ['ADMIN', 'CRC', 'STUDENT']);

      let where = status ? { status } : {};

      // Secure: Only CRC can downgrade to student view, no privilege escalation possible
      const effectiveRole = user.role === 'CRC' && studentView ? 'STUDENT' : user.role;

      logger.info('Jobs query called', { userId: user.id, userRole: user.role, studentView, effectiveRole, status, where });

      // CRC can only see jobs from their assigned companies (unless in student view)
      if (effectiveRole === 'CRC') {
        const assignedCompanies = await prisma.company.findMany({
          where: { assignedCRC: user.id },
          select: { id: true }
        });

        const assignedCompanyIds = assignedCompanies.map(c => c.id);

        if (assignedCompanyIds.length > 0) {
          where.companyId = { in: assignedCompanyIds };
        } else {
          // No companies assigned, return empty result
          where.companyId = { in: [] };
        }

        logger.info('CRC job filtering applied', { userId: user.id, companyCount: assignedCompanyIds.length });
      }

      const jobs = await prisma.job.findMany({
        where,
        include: {
          company: true,
          _count: {
            select: { applications: true }
          }
        },
        orderBy: { createdAt: 'desc' }
      });

      logger.info('Jobs query result', { userId: user.id, userRole: user.role, effectiveRole, jobCount: jobs.length });

      return jobs;
    },

    job: async (_, { id }, { user }) => {
      authorize(user, ['ADMIN', 'CRC', 'STUDENT']);

      const job = await prisma.job.findUnique({
        where: { id: parseInt(id) },
        include: {
          company: true,
          _count: {
            select: { applications: true }
          }
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
          company: true,
          _count: {
            select: { applications: true }
          }
        },
        orderBy: { createdAt: 'desc' }
      });
    },

    eligibleJobs: async (_, __, { user }) => {
      // Both STUDENT and CRC can see eligible jobs (CRC is also a student)
      authorize(user, ['STUDENT', 'CRC']);

      logger.info('EligibleJobs query called', { userId: user.id, userRole: user.role });

      const student = await prisma.user.findUnique({
        where: { id: user.id }
      });

      if (!student || student.cgpa === null) {
        logger.info('EligibleJobs: No CGPA, returning empty', { userId: user.id });
        return [];
      }

      const jobs = await prisma.job.findMany({
        where: {
          status: 'OPEN',
          minCgpa: { lte: student.cgpa },
          OR: [
            { eligibleBranches: { isEmpty: true } },
            { eligibleBranches: { has: student.branch } }
          ]
        },
        include: {
          company: true,
          _count: {
            select: { applications: true }
          }
        },
        orderBy: { createdAt: 'desc' }
      });

      logger.info('EligibleJobs result', { userId: user.id, userRole: user.role, jobCount: jobs.length });

      return jobs;
    }
  },

  Mutation: {
    createJob: async (_, { input }, { user }) => {
      authorize(user, ['ADMIN', 'CRC']);

      try {
        const validated = validateCreateJob(input);

        // Validate salary fields based on job type
        const salaryValidated = validateJobSalaryFields(input);

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
            eligibleBranches: validated.eligibleBranches || [],
            jobType: salaryValidated.jobType,
            stipendAmount: salaryValidated.stipendAmount ? parseFloat(salaryValidated.stipendAmount) : null,
            ppoAmount: salaryValidated.ppoAmount ? parseFloat(salaryValidated.ppoAmount) : null,
            ctcAmount: salaryValidated.ctcAmount ? parseFloat(salaryValidated.ctcAmount) : null,
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
          // AND whose branch is in eligibleBranches (if branches are specified)
          const eligibleStudents = await prisma.user.findMany({
            where: {
              role: { in: ['STUDENT', 'CRC'] },
              cgpa: {
                gte: job.minCgpa,
                not: null
              },
              ...(job.eligibleBranches && job.eligibleBranches.length > 0
                ? { branch: { in: job.eligibleBranches } }
                : {}
              )
            },
            select: {
              email: true,
              name: true,
              cgpa: true
            }
          });

          logger.info('Job notification - Processing eligible students', {
            jobTitle: job.title,
            minCgpa: job.minCgpa,
            eligibleCount: eligibleStudents.length
          });

          // Try queue first, fall back to direct email sending
          if (eligibleStudents.length > 0) {
            const queued = await addBulkJobs(
              eligibleStudents.map((student) => ({
                name: `job-notification-${student.email}`,
                data: {
                  type: 'JOB_NOTIFICATION_INDIVIDUAL',
                  data: {
                    email: student.email,
                    studentName: student.name,
                    companyName: job.company.name,
                    jobTitle: job.title,
                    minCgpa: job.minCgpa
                  }
                },
                opts: {
                  priority: 1, // Job notifications are high priority
                }
              }))
            );

            if (queued) {
              logger.info('Job notification emails queued', {
                jobTitle: job.title,
                queuedCount: eligibleStudents.length,
                method: 'queue'
              });
            } else {
              // Fallback: Use original BCC method if queue is unavailable
              logger.info('Queue unavailable, using fallback email method', {
                jobTitle: job.title,
                method: 'fallback'
              });

              const studentEmails = eligibleStudents.map(s => s.email);
              await sendJobNotificationEmail({
                emails: studentEmails,
                companyName: job.company.name,
                jobTitle: job.title,
                minCgpa: job.minCgpa
              });

              logger.info('Job notification emails sent via fallback', {
                jobTitle: job.title,
                sentCount: studentEmails.length
              });
            }
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

      // Merge with existing job type if not provided
      const jobType = input.jobType || existing.jobType;
      const dataForValidation = {
        jobType,
        stipendAmount: input.stipendAmount !== undefined ? input.stipendAmount : existing.stipendAmount,
        ppoAmount: input.ppoAmount !== undefined ? input.ppoAmount : existing.ppoAmount,
        ctcAmount: input.ctcAmount !== undefined ? input.ctcAmount : existing.ctcAmount
      };

      // Validate salary fields
      const validatedData = validateJobSalaryFields(dataForValidation);

      // Build update data
      const updateData = {};
      if (input.title) updateData.title = input.title;
      if (input.description !== undefined) updateData.description = input.description;
      if (input.minCgpa !== undefined) updateData.minCgpa = input.minCgpa;
      if (input.requiredSkills) updateData.requiredSkills = input.requiredSkills;
      if (input.eligibleBranches) {
        const normalizedBranches = input.eligibleBranches.map((branch) => normalizeBranchName(branch));
        if (normalizedBranches.some((branch) => !branch)) {
          throw new Error('Invalid eligible branch');
        }
        updateData.eligibleBranches = normalizedBranches;
      }
      if (input.status) updateData.status = input.status;
      updateData.jobType = validatedData.jobType;
      updateData.stipendAmount = validatedData.stipendAmount;
      updateData.ppoAmount = validatedData.ppoAmount;
      updateData.ctcAmount = validatedData.ctcAmount;

      const updated = await prisma.job.update({
        where: { id: parseInt(id) },
        data: updateData,
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
            },
            ...(updated.eligibleBranches && updated.eligibleBranches.length > 0
              ? { branch: { in: updated.eligibleBranches } }
              : {}
            )
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
