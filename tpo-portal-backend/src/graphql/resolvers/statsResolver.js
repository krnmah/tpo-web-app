const prisma = require('../../config/prismaClient');
const { authorize } = require('../../middleware/auth');

module.exports = {
  Query: {
    placementStats: async (_, { branch }, { user }) => {
      authorize(user, ['ADMIN', 'CRC', 'STUDENT']);

      const selectedBranch = branch && branch !== 'All' ? branch : null;
      const studentWhere = {
        role: { in: ['STUDENT', 'CRC'] },
        ...(selectedBranch ? { branch: selectedBranch } : {})
      };

      const totalStudents = await prisma.user.count({
        where: studentWhere
      });

      // Count placed students (those with SELECTED status applications)
      const placedStudents = await prisma.application.groupBy({
        by: ['studentId'],
        where: {
          status: 'SELECTED',
          student: studentWhere
        }
      });

      const placedCount = placedStudents.length;
      const placementPercentage = totalStudents > 0
        ? Math.round((placedCount / totalStudents) * 100 * 10) / 10
        : 0;

      return {
        totalStudents,
        placedStudents: placedCount,
        placementPercentage
      };
    },

    dashboardStats: async (_, __, { user }) => {
      authorize(user, ['ADMIN', 'CRC', 'STUDENT']);

      const totalStudents = await prisma.user.count({
        where: { role: { in: ['STUDENT', 'CRC'] } }
      });

      const totalCompanies = await prisma.company.count();

      const activeJobs = await prisma.job.count({
        where: { status: 'OPEN' }
      });

      const totalApplications = await prisma.application.count();

      // Count placed students
      const placedStudents = await prisma.application.groupBy({
        by: ['studentId'],
        where: { status: 'SELECTED' }
      });

      const placedCount = placedStudents.length;
      const placementPercentage = totalStudents > 0
        ? Math.round((placedCount / totalStudents) * 100 * 10) / 10
        : 0;

      return {
        totalStudents,
        totalCompanies,
        activeJobs,
        totalApplications,
        placementPercentage
      };
    },

    placedStudents: async (_, { branch }, { user }) => {
      authorize(user, ['ADMIN']);

      const selectedBranch = branch && branch !== 'All' ? branch : null;

      const applications = await prisma.application.findMany({
        where: {
          status: 'SELECTED',
          student: {
            role: { in: ['STUDENT', 'CRC'] },
            ...(selectedBranch ? { branch: selectedBranch } : {})
          }
        },
        include: {
          student: {
            select: {
              id: true,
              name: true,
              email: true,
              enrollmentNumber: true,
              branch: true,
              cgpa: true,
            }
          },
          job: {
            include: {
              company: {
                select: {
                  id: true,
                  name: true,
                }
              }
            }
          }
        },
        orderBy: { updatedAt: 'desc' }
      });

      const latestByStudent = new Map();
      for (const app of applications) {
        if (!latestByStudent.has(app.studentId)) {
          latestByStudent.set(app.studentId, app);
        }
      }

      // Transform to PlacedStudent format
      return [...latestByStudent.values()].map(app => ({
        id: app.student.id,
        name: app.student.name,
        email: app.student.email,
        enrollmentNumber: app.student.enrollmentNumber,
        branch: app.student.branch || 'N/A',
        cgpa: app.student.cgpa,
        companyName: app.job.company.name,
        placedAt: app.updatedAt?.toISOString() || app.createdAt?.toISOString() || new Date().toISOString(),
      }));
    }
  }
};
