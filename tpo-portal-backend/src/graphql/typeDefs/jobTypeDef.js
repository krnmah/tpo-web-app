module.exports = `
enum JobType {
  INTERN_ONLY
  INTERN_PPO
  INTERN_FTE
  FTE_ONLY
}

enum JobStatus {
  OPEN
  CLOSED
}

type Job {
  id: ID!
  title: String!
  description: String!
  company: Company!
  minCgpa: Float!
  requiredSkills: [String!]!
  eligibleBranches: [String!]!
  status: JobStatus!
  jobType: JobType!
  stipendAmount: Float
  ppoAmount: Float
  ctcAmount: Float
  createdAt: String!
  updatedAt: String!
  _applicationCount: Int
  _isEligible: Boolean
}

input CreateJobInput {
  title: String!
  description: String!
  companyId: Int!
  minCgpa: Float!
  requiredSkills: [String!]!
  eligibleBranches: [String!]!
  status: JobStatus
  jobType: JobType!
  stipendAmount: Float
  ppoAmount: Float
  ctcAmount: Float
}

input UpdateJobInput {
  title: String
  description: String!
  minCgpa: Float
  requiredSkills: [String!]
  eligibleBranches: [String!]
  status: JobStatus
  jobType: JobType
  stipendAmount: Float
  ppoAmount: Float
  ctcAmount: Float
}

extend type Query {
  jobs(status: JobStatus, studentView: Boolean): [Job!]!
  job(id: ID!): Job
  jobsByCompany(companyId: ID!): [Job!]!
  eligibleJobs: [Job!]!
}

extend type Mutation {
  # Admin/CRC only
  createJob(input: CreateJobInput!): Job!
  updateJob(id: ID!, input: UpdateJobInput!): Job!
  deleteJob(id: ID!): Boolean!
  closeJob(id: ID!): Job!
  reopenJob(id: ID!): Job!
}
`;
