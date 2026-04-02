module.exports = `
type AuthPayload {
  token: String!
  user: UserResponse!
}

type AuthResponse {
  success: Boolean!
  message: String!
}

extend type Query {
  me: UserResponse
}

extend type Mutation {
  # Student registration
  registerStudent(
    name: String!
    enrollmentNumber: String!
    branch: String!
    email: String!
    password: String!
    cgpa: Float!
    skills: [String!]!
    resumeUrl: String!
    reportCardUrl: String!
  ): AuthPayload!

  # Login for all users
  login(
    email: String!
    password: String!
  ): AuthPayload!

  # Send password reset OTP
  sendPasswordResetOTP(
    email: String!
  ): Boolean!

  # Verify OTP and reset password
  verifyOTPAndResetPassword(
    email: String!
    otp: String!
    newPassword: String!
  ): Boolean!
}
`;
