module.exports = `
enum ApplicationStatus {
  APPLIED
  SHORTLISTED
  REJECTED
  SELECTED
}

type Application {
  id: ID!
  studentId: Int!
  jobId: Int!
  student: UserResponse!
  job: Job!
  status: ApplicationStatus!
  createdAt: String!
  updatedAt: String!
}

type ApplicationDetail {
  id: ID!
  studentId: Int!
  jobId: Int!
  student: UserResponse!
  job: Job!
  company: Company!
  status: ApplicationStatus!
  createdAt: String!
  updatedAt: String!
}

extend type Query {
  applications: [Application!]!
  myApplications: [ApplicationDetail!]!
  applicationsByJob(jobId: ID!): [Application!]!
  applicationsByCompany(companyId: ID!): [ApplicationDetail!]!
  application(id: ID!): Application
}

extend type Mutation {
  # Student only
  applyForJob(jobId: ID!): Application!

  # CRC/Admin only
  updateApplicationStatus(
    applicationId: ID!
    status: ApplicationStatus!
  ): Application!

  # Admin only
  deleteApplication(applicationId: ID!): Boolean!
}
`;
