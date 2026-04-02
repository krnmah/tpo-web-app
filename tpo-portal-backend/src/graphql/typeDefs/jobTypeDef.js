module.exports = `
enum JobStatus {
  OPEN
  CLOSED
}

type Job {
  id: ID!
  title: String!
  description: String
  company: Company!
  minCgpa: Float!
  requiredSkills: [String!]!
  status: JobStatus!
  createdAt: String!
  updatedAt: String!
  _applicationCount: Int
  _isEligible: Boolean
}

input CreateJobInput {
  title: String!
  description: String
  companyId: Int!
  minCgpa: Float!
  requiredSkills: [String!]!
  status: JobStatus
}

input UpdateJobInput {
  title: String
  description: String
  minCgpa: Float
  requiredSkills: [String!]
  status: JobStatus
}

extend type Query {
  jobs(status: JobStatus): [Job!]!
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
}
`;
