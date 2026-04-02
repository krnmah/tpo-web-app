module.exports = `
type Company {
  id: ID!
  name: String!
  description: String!
  assignedCRC: UserResponse
  createdAt: String!
  updatedAt: String!
}

input CreateCompanyInput {
  name: String!
  description: String!
  assignedCRC: Int
}

input UpdateCompanyInput {
  name: String
  description: String
  assignedCRC: Int
}

extend type Query {
  companies: [Company!]!
  company(id: ID!): Company

  # CRC: Get companies assigned to me
  myCompanies: [Company!]!
}

extend type Mutation {
  # ADMIN: Create company with optional CRC assignment
  createCompany(input: CreateCompanyInput!): Company!

  # CRC: Create company (auto-assigned to self)
  createMyCompany(name: String!, description: String!): Company!

  # ADMIN: Update company
  updateCompany(id: ID!, input: UpdateCompanyInput!): Company!

  # ADMIN: Delete company
  deleteCompany(id: ID!): Boolean!

  # ADMIN: Assign CRC to company
  assignCRCToCompany(companyId: ID!, crcId: ID!): Company!
}
`;
