module.exports = `
type PlacementStats {
  totalStudents: Int!
  placedStudents: Int!
  placementPercentage: Float!
}

type DashboardStats {
  totalStudents: Int!
  totalCompanies: Int!
  activeJobs: Int!
  totalApplications: Int!
  placementPercentage: Float!
}

extend type Query {
  placementStats: PlacementStats!
  dashboardStats: DashboardStats!
}
`;
