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

type PlacedStudent {
  id: ID!
  name: String!
  email: String!
  enrollmentNumber: String
  branch: String!
  cgpa: Float!
  companyName: String!
  placedAt: String!
}

extend type Query {
  placementStats: PlacementStats!
  dashboardStats: DashboardStats!
  placedStudents(branch: String): [PlacedStudent!]!
}
`;
