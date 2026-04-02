import { gql } from '@apollo/client';

// ==================== AUTH QUERIES ====================

export const REGISTER_STUDENT = gql`
  mutation RegisterStudent(
    $name: String!
    $enrollmentNumber: String!
    $branch: String!
    $email: String!
    $password: String!
    $cgpa: Float!
    $skills: [String!]!
    $resumeUrl: String!
    $reportCardUrl: String!
  ) {
    registerStudent(
      name: $name
      enrollmentNumber: $enrollmentNumber
      branch: $branch
      email: $email
      password: $password
      cgpa: $cgpa
      skills: $skills
      resumeUrl: $resumeUrl
      reportCardUrl: $reportCardUrl
    ) {
      token
      user {
        id
        email
        role
        name
        enrollmentNumber
        branch
        cgpa
        skills
        resumeUrl
        reportCardUrl
      }
    }
  }
`;

export const LOGIN = gql`
  mutation Login($email: String!, $password: String!) {
    login(email: $email, password: $password) {
      token
      user {
        id
        email
        role
        name
        enrollmentNumber
        cgpa
        skills
        resumeUrl
      }
    }
  }
`;

export const SEND_PASSWORD_RESET_OTP = gql`
  mutation SendPasswordResetOTP($email: String!) {
    sendPasswordResetOTP(email: $email)
  }
`;

export const VERIFY_OTP_AND_RESET_PASSWORD = gql`
  mutation VerifyOTPAndResetPassword(
    $email: String!
    $otp: String!
    $newPassword: String!
  ) {
    verifyOTPAndResetPassword(email: $email, otp: $otp, newPassword: $newPassword)
  }
`;

export const GET_ME = gql`
  query GetMe {
    me {
      id
      email
      role
      name
      enrollmentNumber
      cgpa
      skills
      resumeUrl
      createdAt
      updatedAt
    }
  }
`;

// ==================== USER QUERIES ====================

export const GET_STUDENTS = gql`
  query GetStudents {
    students {
      id
      email
      role
      name
      enrollmentNumber
      cgpa
      skills
      resumeUrl
      reportCardUrl
      createdAt
    }
  }
`;

export const UPDATE_PROFILE = gql`
  mutation UpdateProfile(
    $name: String
    $cgpa: Float
    $skills: [String!]
    $resumeUrl: String
    $reportCardUrl: String
  ) {
    updateProfile(name: $name, cgpa: $cgpa, skills: $skills, resumeUrl: $resumeUrl, reportCardUrl: $reportCardUrl) {
      id
      email
      role
      name
      enrollmentNumber
      branch
      cgpa
      skills
      resumeUrl
      reportCardUrl
      createdAt
      updatedAt
    }
  }
`;

export const CHANGE_PASSWORD = gql`
  mutation ChangePassword($newPassword: String!) {
    changePassword(newPassword: $newPassword)
  }
`;

// ADMIN: Assign CRC role to a student by email
export const ASSIGN_CRC = gql`
  mutation AssignCRC($email: String!) {
    assignCRC(email: $email)
  }
`;

// ADMIN: Remove CRC role
export const REMOVE_CRC = gql`
  mutation RemoveCRC($email: String!) {
    removeCRC(email: $email)
  }
`;

// ==================== COMPANY QUERIES ====================

export const GET_COMPANIES = gql`
  query GetCompanies {
    companies {
      id
      name
      description
      assignedCRC {
        id
        name
        email
      }
      createdAt
      updatedAt
    }
  }
`;

export const GET_COMPANY = gql`
  query GetCompany($id: ID!) {
    company(id: $id) {
      id
      name
      description
      assignedCRC {
        id
        name
        email
      }
      createdAt
      updatedAt
    }
  }
`;

export const CREATE_COMPANY = gql`
  mutation CreateCompany($input: CreateCompanyInput!) {
    createCompany(input: $input) {
      id
      name
      description
      assignedCRC {
        id
        name
        email
      }
      createdAt
      updatedAt
    }
  }
`;

export const UPDATE_COMPANY = gql`
  mutation UpdateCompany($id: ID!, $input: UpdateCompanyInput!) {
    updateCompany(id: $id, input: $input) {
      id
      name
      description
      assignedCRC {
        id
        name
        email
      }
      createdAt
      updatedAt
    }
  }
`;

export const GET_MY_ASSIGNED_COMPANIES = gql`
  query GetMyAssignedCompanies {
    myCompanies {
      id
      name
      description
      assignedCRC {
        id
        name
        email
      }
      createdAt
      updatedAt
    }
  }
`;

// CRC: Create company (auto-assigned to self)
export const CREATE_MY_COMPANY = gql`
  mutation CreateMyCompany($name: String!, $description: String!) {
    createMyCompany(name: $name, description: $description) {
      id
      name
      description
      assignedCRC {
        id
        name
        email
      }
      createdAt
      updatedAt
    }
  }
`;

// ==================== JOB QUERIES ====================

export const GET_JOBS = gql`
  query GetJobs($status: JobStatus) {
    jobs(status: $status) {
      id
      title
      description
      company {
        id
        name
      }
      minCgpa
      requiredSkills
      status
      createdAt
      updatedAt
      _applicationCount
      _isEligible
    }
  }
`;

export const GET_JOB = gql`
  query GetJob($id: ID!) {
    job(id: $id) {
      id
      title
      description
      company {
        id
        name
        description
      }
      minCgpa
      requiredSkills
      status
      createdAt
      updatedAt
      _applicationCount
      _isEligible
    }
  }
`;

export const GET_ELIGIBLE_JOBS = gql`
  query GetEligibleJobs {
    eligibleJobs {
      id
      title
      description
      company {
        id
        name
      }
      minCgpa
      requiredSkills
      status
      createdAt
      _applicationCount
    }
  }
`;

export const CREATE_JOB = gql`
  mutation CreateJob($input: CreateJobInput!) {
    createJob(input: $input) {
      id
      title
      description
      company {
        id
        name
      }
      minCgpa
      requiredSkills
      status
      createdAt
    }
  }
`;

export const UPDATE_JOB = gql`
  mutation UpdateJob($id: ID!, $input: UpdateJobInput!) {
    updateJob(id: $id, input: $input) {
      id
      title
      description
      company {
        id
        name
      }
      minCgpa
      requiredSkills
      status
      createdAt
    }
  }
`;

export const CLOSE_JOB = gql`
  mutation CloseJob($id: ID!) {
    closeJob(id: $id) {
      id
      title
      status
    }
  }
`;

// ==================== APPLICATION QUERIES ====================

export const GET_MY_APPLICATIONS = gql`
  query GetMyApplications {
    myApplications {
      id
      status
      createdAt
      updatedAt
      student {
        id
        name
        email
        enrollmentNumber
      }
      job {
        id
        title
        company {
          id
          name
        }
      }
    }
  }
`;

export const GET_APPLICATIONS_BY_JOB = gql`
  query GetApplicationsByJob($jobId: ID!) {
    applicationsByJob(jobId: $jobId) {
      id
      student {
        id
        name
        email
        enrollmentNumber
        cgpa
      }
      job {
        id
        title
      }
      status
      createdAt
    }
  }
`;

export const GET_APPLICATIONS_BY_COMPANY = gql`
  query GetApplicationsByCompany($companyId: ID!) {
    applicationsByCompany(companyId: $companyId) {
      id
      student {
        id
        name
        email
        enrollmentNumber
        cgpa
        skills
      }
      job {
        id
        title
        minCgpa
      }
      company {
        id
        name
      }
      status
      createdAt
    }
  }
`;

export const APPLY_FOR_JOB = gql`
  mutation ApplyForJob($jobId: ID!) {
    applyForJob(jobId: $jobId) {
      id
      student {
        id
        name
      }
      job {
        id
        title
      }
      status
      createdAt
    }
  }
`;

export const UPDATE_APPLICATION_STATUS = gql`
  mutation UpdateApplicationStatus(
    $applicationId: ID!
    $status: ApplicationStatus!
  ) {
    updateApplicationStatus(applicationId: $applicationId, status: $status) {
      id
      status
      updatedAt
    }
  }
`;

// ==================== STATS QUERIES ====================

export const GET_PLACEMENT_STATS = gql`
  query GetPlacementStats {
    placementStats {
      totalStudents
      placedStudents
      placementPercentage
    }
  }
`;

export const GET_DASHBOARD_STATS = gql`
  query GetDashboardStats {
    dashboardStats {
      totalStudents
      totalCompanies
      activeJobs
      totalApplications
      placementPercentage
    }
  }
`;
