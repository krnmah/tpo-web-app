# Student Signup Additional Fields - Design Specification

## Overview

Add 6 new fields to the student signup form to collect more comprehensive information about students for placement purposes.

## New Fields

| Field | Type | Validation | Editable | Required |
|-------|------|------------|----------|----------|
| Mobile | String | 10 digits, starts with 6-9 | Yes | Yes |
| Category | Enum | GENERAL/SC/ST/OBC/GEN_EWS/PWD | No | Yes |
| Category certificate | URL | Required if category ≠ GENERAL | Yes | Conditional |
| Domicile | URL | Any valid URL | Yes | No |
| Personal email | Email | Any valid email | Yes | Yes |
| Gender | Enum | MALE/FEMALE/OTHER | No | Yes |

## Database Schema

### New Enums

```prisma
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
```

### User Model Changes

```prisma
model User {
  // ... existing fields
  mobile                String?
  category              Category   @default(GENERAL)
  categoryCertificateUrl String?
  domicileUrl           String?
  personalEmail         String?    @unique
  gender                Gender?
}
```

## GraphQL Schema

### Type Definitions

```graphql
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
  # ... existing fields
  mobile                String
  category              Category
  categoryCertificateUrl String
  domicileUrl           String
  personalEmail         String
  gender                Gender
}
```

### Updated RegisterStudent Mutation

```graphql
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
  $mobile: String!
  $category: Category!
  $categoryCertificateUrl: String
  $domicileUrl: String
  $personalEmail: String!
  $gender: Gender!
)
```

### Updated UpdateProfile Mutation

Only editable fields (mobile, categoryCertificateUrl, domicileUrl, personalEmail) are included:

```graphql
mutation UpdateProfile(
  $name: String
  $cgpa: Float
  $skills: [String!]
  $resumeUrl: String
  $reportCardUrl: String
  $mobile: String
  $categoryCertificateUrl: String
  $domicileUrl: String
  $personalEmail: String
)
```

## Validation Rules

### Mobile Number
- Must be exactly 10 digits
- Must start with 6, 7, 8, or 9 (Indian mobile)
- Regex: `^[6-9]\d{9}$`

### Category Certificate
- Required if `category !== GENERAL`
- If provided, must be a valid URL format
- Frontend shows link preview

### Domicile
- Optional field
- If provided, must be a valid URL format

### Personal Email
- Must be a valid email format
- No domain restrictions
- Must be unique across all users

## Frontend Changes

### AuthPage.jsx (Signup Form)

New form fields added to the signup form:

1. **Mobile** - Text input with 10-digit validation
2. **Category** - Select dropdown with 6 options
3. **Category Certificate** - Text input (conditionally shown), required if category ≠ GENERAL
4. **Domicile** - Text input, optional
5. **Personal Email** - Email input
6. **Gender** - Select dropdown with 3 options

### Profile Update Page

Add editable fields:
- Mobile
- Category Certificate URL
- Domicile URL
- Personal Email

## Migration Strategy

1. Add new columns to User table with default values
2. Run Prisma migration
3. Update GraphQL schema
4. Update resolvers with validation
5. Update frontend forms

### Backward Compatibility

- `mobile` - nullable, existing users will have NULL
- `category` - defaults to GENERAL
- `categoryCertificateUrl` - nullable
- `domicileUrl` - nullable
- `personalEmail` - nullable, unique constraint only applies to non-null values
- `gender` - nullable, existing users will have NULL

## Testing Checklist

- [ ] Signup works with all new fields
- [ ] Category certificate is required when category ≠ GENERAL
- [ ] Category certificate is optional when category = GENERAL
- [ ] Mobile validation rejects invalid formats
- [ ] Personal email uniqueness enforced
- [ ] Profile update works for editable fields
- [ ] Category and gender cannot be changed after signup
- [ ] Existing users (with NULL values) can still login
