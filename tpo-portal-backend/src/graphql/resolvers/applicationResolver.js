const prisma = require('../../config/prismaClient');
const { authorize, crcCompanyCheck } = require('../../middleware/auth');
const { validateApplicationStatus } = require('../../utils/validation');
const { logApplication, logAudit } = require('../../utils/logger');

module.exports = {
  Application: {
    student: (application, _, __) => application.student,
    job: (application, _, __) => application.job
  },

  ApplicationDetail: {
    student: (application, _, __) => application.student,
    job: (application, _, __) => application.job,
    company: (application, _, __) => application.job?.company
  },

  Query: {
    applications: async (_, __, { user }) => {
      authorize(user, ['ADMIN', 'CRC']);

      let where = {};

      // CRC can only see applications for their assigned companies
      if (user.role === 'CRC') {
        // Get companies assigned to this CRC
        const assignedCompanies = await prisma.company.findMany({
          where: { assignedCRC: user.id },
          select: { id: true }
        });

        const companyIds = assignedCompanies.map(c => c.id);

        // Get jobs from these companies
        const jobs = await prisma.job.findMany({
          where: { companyId: { in: companyIds } },
          select: { id: true }
        });

        const jobIds = jobs.map(j => j.id);
        where = { jobId: { in: jobIds } };
      }

      return await prisma.application.findMany({
        where,
        include: {
          student: true,
          job: {
            include: {
              company: true
            }
          }
        },
        orderBy: { createdAt: 'desc' }
      });
    },

    /**
     * Get my applications
     * - STUDENT: Only their own applications
     * - CRC: Also only their own applications (CRC is also a student!)
     * - ADMIN: All applications
     */
    myApplications: async (_, __, { user }) => {
      if (!user) {
        const error = new Error('Not authenticated');
error.extensions = { code: 'UNAUTHENTICATED' };
throw error;
      }

      authorize(user, ['STUDENT', 'CRC', 'ADMIN']);

      let where = {};

      // STUDENT and CRC can only see their own applications
      // (CRC is fundamentally a student with additional privileges)
      if (user.role === 'STUDENT' || user.role === 'CRC') {
        where = { studentId: user.id };
      }

      const applications = await prisma.application.findMany({
        where,
        include: {
          student: true,
          job: {
            include: {
              company: true
            }
          }
        },
        orderBy: { createdAt: 'desc' }
      });

      // Transform to ApplicationDetail format
      return applications.map(app => ({
        id: app.id,
        student: app.student,
        job: app.job,
        company: app.job.company,
        status: app.status,
        createdAt: app.createdAt,
        updatedAt: app.updatedAt
      }));
    },

    applicationsByJob: async (_, { jobId }, { user }) => {
      authorize(user, ['ADMIN', 'CRC']);

      const job = await prisma.job.findUnique({
        where: { id: parseInt(jobId) }
      });

      if (!job) {
        throw new Error('Job not found');
      }

      // CRC can only see applications for their assigned companies
      if (user.role === 'CRC') {
        await crcCompanyCheck(user, job.companyId);
      }

      return await prisma.application.findMany({
        where: { jobId: parseInt(jobId) },
        include: {
          student: true,
          job: true
        },
        orderBy: { createdAt: 'desc' }
      });
    },

    applicationsByCompany: async (_, { companyId }, { user }) => {
      authorize(user, ['ADMIN', 'CRC']);

      // CRC can only see applications for their assigned companies
      if (user.role === 'CRC') {
        await crcCompanyCheck(user, parseInt(companyId));
      }

      // Get jobs for this company
      const jobs = await prisma.job.findMany({
        where: { companyId: parseInt(companyId) },
        select: { id: true }
      });

      const jobIds = jobs.map(j => j.id);

      const applications = await prisma.application.findMany({
        where: { jobId: { in: jobIds } },
        include: {
          student: true,
          job: {
            include: {
              company: true
            }
          }
        },
        orderBy: { createdAt: 'desc' }
      });

      // Transform to ApplicationDetail format
      return applications.map(app => ({
        id: app.id,
        student: app.student,
        job: app.job,
        company: app.job.company,
        status: app.status,
        createdAt: app.createdAt,
        updatedAt: app.updatedAt
      }));
    },

    application: async (_, { id }, { user }) => {
      authorize(user, ['ADMIN', 'CRC', 'STUDENT']);

      const application = await prisma.application.findUnique({
        where: { id: parseInt(id) },
        include: {
          student: true,
          job: {
            include: {
              company: true
            }
          }
        }
      });

      if (!application) {
        throw new Error('Application not found');
      }

      // STUDENT and CRC can only see their own applications
      if ((user.role === 'STUDENT' || user.role === 'CRC') && application.studentId !== user.id) {
        throw new Error('Forbidden: You can only access your own applications');
      }

      // CRC (in management mode) can also see applications for their assigned companies
      if (user.role === 'CRC') {
        // If this is not their application, check if they manage the company
        if (application.studentId !== user.id) {
          await crcCompanyCheck(user, application.job.companyId);
        }
      }

      return application;
    }
  },

  Mutation: {
    /**
     * Apply for a job
     * - STUDENT: Can apply
     * - CRC: Can also apply! (CRC is fundamentally a student)
     * - Both need resume, CGPA eligibility, no duplicate applications
     */
    applyForJob: async (_, { jobId }, { user }) => {
      if (!user) {
        const error = new Error('Not authenticated');
error.extensions = { code: 'UNAUTHENTICATED' };
throw error;
      }

      // Both STUDENT and CRC can apply for jobs
      authorize(user, ['STUDENT', 'CRC']);

      try {
        // CRITICAL: Check if student has a resume
        const student = await prisma.user.findUnique({
          where: { id: user.id }
        });

        if (!student.resumeUrl) {
          logApplication.applyFailure(user.id, jobId, 'No resume');
          throw new Error('Resume required. Please upload your resume before applying.');
        }

        // Get job details
        const job = await prisma.job.findUnique({
          where: { id: parseInt(jobId) },
          include: {
            company: true
          }
        });

        if (!job) {
          throw new Error('Job not found');
        }

        // CRITICAL: Check if job is OPEN
        if (job.status !== 'OPEN') {
          logApplication.applyFailure(user.id, jobId, 'Job closed');
          throw new Error('This job is no longer accepting applications.');
        }

        // CRITICAL: Check CGPA eligibility
        if (student.cgpa < job.minCgpa) {
          logApplication.applyFailure(user.id, jobId, 'CGPA too low');
          throw new Error(`You are not eligible. Required CGPA: ${job.minCgpa}, Your CGPA: ${student.cgpa}`);
        }

        // Use transaction to prevent race conditions
        const application = await prisma.$transaction(async (tx) => {
          // Check for duplicate application
          const existing = await tx.application.findUnique({
            where: {
              studentId_jobId: {
                studentId: user.id,
                jobId: parseInt(jobId)
              }
            }
          });

          if (existing) {
            logApplication.applyFailure(user.id, jobId, 'Duplicate application');
            throw new Error('You have already applied for this job.');
          }

          // Create application
          const newApplication = await tx.application.create({
            data: {
              studentId: user.id,
              jobId: parseInt(jobId),
              status: 'APPLIED'
            },
            include: {
              student: true,
              job: true
            }
          });

          return newApplication;
        });

        logApplication.applySuccess(user.id, jobId);

        return application;
      } catch (error) {
        throw error;
      }
    },

    updateApplicationStatus: async (_, { applicationId, status }, { user }) => {
      authorize(user, ['ADMIN', 'CRC']);

      try {
        // Validate status
        validateApplicationStatus({ status });

        const application = await prisma.application.findUnique({
          where: { id: parseInt(applicationId) },
          include: {
            job: true
          }
        });

        if (!application) {
          throw new Error('Application not found');
        }

        // CRC can only update applications for their assigned companies
        if (user.role === 'CRC') {
          await crcCompanyCheck(user, application.job.companyId);
        }

        const updated = await prisma.application.update({
          where: { id: parseInt(applicationId) },
          data: { status },
          include: {
            student: true,
            job: true
          }
        });

        logApplication.statusUpdate(applicationId, status, user.id);

        return updated;
      } catch (error) {
        if (error.name === 'ZodError') {
          throw new Error(error.errors.map(e => e.message).join(', '));
        }
        throw error;
      }
    },

    deleteApplication: async (_, { applicationId }, { user }) => {
      authorize(user, ['ADMIN']);

      const application = await prisma.application.findUnique({
        where: { id: parseInt(applicationId) }
      });

      if (!application) {
        throw new Error('Application not found');
      }

      await prisma.application.delete({
        where: { id: parseInt(applicationId) }
      });

      logAudit.dataAccess(user.id, `application_delete_${applicationId}`);

      return true;
    }
  }
};
