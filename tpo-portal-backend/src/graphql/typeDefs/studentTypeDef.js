module.exports = `
  scalar Upload

  type Student {
    id: ID!
    name: String!
    enrollmentNumber: String!
    email: String!
    department: String!
    batch: Int!
    tenthMarksheet: String!
    twelfthMarksheet: String!
    resume: String!
    profilePicture: String!
    isActivated: Boolean!
    createdAt: String!
    updatedAt: String!
  }

  type AuthPayload {
    token: String!
    student: Student!
  }

  type Query {
    students: [Student!]!
    student(id: ID!): Student
  }

  type Mutation {
    registerStudent(
      name: String!
      enrollmentNumber: String!
      email: String!
      password: String!
      department: String!
      batch: Int!
      tenthMarksheet: String!
      twelfthMarksheet: String!
      resume: String!
      profilePicture: String!
    ): AuthPayload!

    loginStudent(
      email: String!
      password: String!
    ): AuthPayload!

    activateStudent(id: ID!): Student!
  }
`;