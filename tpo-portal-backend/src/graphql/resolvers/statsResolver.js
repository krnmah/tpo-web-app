const prisma = require('../../config/prismaClient');
const { authorize } = require('../../middleware/auth');

module.exports = {
  Query: {
    placementStats: async (_, __, { user }) => {
      authorize(user, ['ADMIN', 'CRC', 'STUDENT']);

      const totalStudents = await prisma.user.count({
        where: { role: 'STUDENT' }
      });

      // Count placed students (those with SELECTED status applications)
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
        placedStudents: placedCount,
        placementPercentage
      };
    },

    dashboardStats: async (_, __, { user }) => {
      authorize(user, ['ADMIN', 'CRC', 'STUDENT']);

      const totalStudents = await prisma.user.count({
        where: { role: 'STUDENT' }
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

      // Get all applications with SELECTED status
      const whereClause = { status: 'SELECTED' };

      const applications = await prisma.application.findMany({
        where: whereClause,
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

      // Filter by branch if provided
      let filtered = applications;
      if (branch && branch !== 'All') {
        filtered = applications.filter(app => app.student.branch === branch);
      }

      // Transform to PlacedStudent format
      return filtered.map(app => ({
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
