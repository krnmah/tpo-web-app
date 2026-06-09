module.exports = `
enum Role {
  ADMIN
  STUDENT
  CRC
}

enum Category {
  GENERAL
  SC
  ST
  OBC
  GEN_EWS
  PWD
}

enum Gender {
  MALE
  FEMALE
  OTHER
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
  mobile: String
  category: Category
  categoryCertificateUrl: String
  domicileUrl: String
  personalEmail: String
  gender: Gender
  blockedJobTypes: [JobType!]!
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
  mobile: String
  category: Category
  categoryCertificateUrl: String
  domicileUrl: String
  personalEmail: String
  gender: Gender
  blockedJobTypes: [JobType!]!
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
  mobile: String!
  category: Category!
  categoryCertificateUrl: String
  domicileUrl: String
  personalEmail: String!
  gender: Gender!
}

input UpdateUserInput {
  name: String
  cgpa: Float
  skills: [String!]
  resumeUrl: String
  reportCardUrl: String
  mobile: String
  categoryCertificateUrl: String
  domicileUrl: String
  personalEmail: String
}

input AdminUpdateUserInput {
  name: String
  enrollmentNumber: String
  branch: String
  category: Category
  gender: Gender
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
    mobile: String
    categoryCertificateUrl: String
    domicileUrl: String
    personalEmail: String
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

  # ADMIN: Update user fields that are disabled for students
  adminUpdateUser(id: ID!, input: AdminUpdateUserInput!): UserResponse!

  # ADMIN: Block/unblock a user from applying to selected employment types
  updateUserEmploymentBlocks(id: ID!, blockedJobTypes: [JobType!]!): UserResponse!
}
`;
