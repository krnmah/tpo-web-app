module.exports = `
enum Role {
  ADMIN
  STUDENT
  CRC
}

type User {
  id: ID!
  email: String!
  role: Role!
  name: String!
  enrollmentNumber: String
  branch: String
  cgpa: Float
  skills: [String!]!
  resumeUrl: String
  reportCardUrl: String
  createdAt: String!
  updatedAt: String!
}

type UserResponse {
  id: ID!
  email: String!
  role: Role!
  name: String!
  enrollmentNumber: String
  branch: String
  cgpa: Float
  skills: [String!]!
  resumeUrl: String
  reportCardUrl: String
  createdAt: String!
  updatedAt: String!
}

input CreateUserInput {
  name: String!
  enrollmentNumber: String!
  branch: String!
  email: String!
  password: String!
  cgpa: Float!
  skills: [String!]!
  resumeUrl: String!
  reportCardUrl: String!
}

input UpdateUserInput {
  name: String
  cgpa: Float
  skills: [String!]
  resumeUrl: String
  reportCardUrl: String
}

extend type Query {
  users: [UserResponse!]!
  user(id: ID!): UserResponse
  students: [UserResponse!]!
}

extend type Mutation {
  # Update profile
  updateProfile(
    name: String
    cgpa: Float
    skills: [String!]
    resumeUrl: String
    reportCardUrl: String
  ): UserResponse!

  # Change password
  changePassword(
    newPassword: String!
  ): Boolean!

  # ADMIN: Assign CRC role to a student by email
  assignCRC(email: String!): Boolean!

  # ADMIN: Remove CRC role (revert to student)
  removeCRC(email: String!): Boolean!

  # ADMIN: Delete user
  deleteUser(id: ID!): Boolean!
}
`;
