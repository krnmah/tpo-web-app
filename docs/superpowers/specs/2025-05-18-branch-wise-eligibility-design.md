# Branch-Wise Job Eligibility - Design Spec

**Date:** 2025-05-18
**Status:** Approved

## Overview

Add branch filtering to job postings so students only receive email notifications for jobs in their eligible branch. CRC must select at least one eligible branch when creating a job posting.

## Problem Statement

Currently, job notification emails are sent to ALL students whose CGPA meets the minimum requirement, regardless of their branch. A Computer Science job would email Mechanical, Civil, and Electrical students who have the required CGPA but aren't actually eligible.

## Solution

Add a mandatory multi-select field for eligible branches when creating a job. Filter email recipients by both CGPA AND branch.

## Architecture

```
CRC Dashboard (Job Form)
    │
    ├─ Title, Company, Job Type, Min CGPA
    ├─ Salary Fields (based on job type)
    ├─ Required Skills
    ├─ Eligible Branches * (NEW - at least one required)
    │   ☑ Chemical Engineering
    │   ☑ Civil Engineering
    │   ☐ Computer Science and Engineering
    │   ☐ Electrical Engineering
    │   ☐ Electronics and Communication Engineering
    │   ☐ Information Technology
    │   ☐ Mechanical Engineering
    │   ☐ Metallurgical and Materials Engineering
    └─ Description
         │
         ▼
    GraphQL Mutation (createJob)
         │
         ├─ Validation: at least one branch selected
         │
         ▼
    Prisma: Job.create({ eligibleBranches: [...] })
         │
         ▼
    Query: Find students WHERE
        - role IN (STUDENT, CRC)
        - cgpa >= minCgpa
        - branch IN eligibleBranches  ← NEW
         │
         ▼
    BullMQ Queue: Individual emails per student
         │
         ▼
    Email Worker: sendIndividualJobEmail()
```

## Data Model Changes

### Prisma Schema

**File:** `tpo-portal-backend/prisma/schema.prisma`

```prisma
model Job {
  // ... existing fields ...
  eligibleBranches String[] @default([])
}
```

### GraphQL Types

**File:** `tpo-portal-backend/src/graphql/typeDefs/jobTypeDef.js`

```graphql
type Job {
  # ... existing fields ...
  eligibleBranches: [String!]!
}

input CreateJobInput {
  # ... existing fields ...
  eligibleBranches: [String!]!
}

input UpdateJobInput {
  # ... existing fields ...
  eligibleBranches: [String!]
}
```

## Component Changes

### 1. Frontend: CRC Job Form

**File:** `tpo-portal-frontend/src/pages/crc/CRCDashboard.jsx`

**State Update (line ~74):**
```javascript
const [newJob, setNewJob] = useState({
  // ... existing fields ...
  eligibleBranches: []  // NEW
});
```

**UI Addition (after skills field, line ~756):**
```jsx
<div>
  <label className="block text-xs font-medium text-zinc-600 mb-1.5">
    Eligible Branches <span className="text-red-500">*</span>
  </label>
  <div className="grid grid-cols-2 gap-2">
    {BRANCHES.map(branch => (
      <label key={branch} className="flex items-center gap-2 text-sm">
        <input type="checkbox" checked={newJob.eligibleBranches?.includes(branch)} ... />
        {branch}
      </label>
    ))}
  </div>
  {errors.eligibleBranches && (
    <p className="text-xs text-red-500 mt-1">Select at least one branch</p>
  )}
</div>
```

**Validation (in handleCreateJob):**
```javascript
if (!newJob.eligibleBranches?.length) {
  setToast({ show: true, message: 'Please select at least one eligible branch', type: 'error' });
  return;
}
```

### 2. Backend: Job Resolver

**File:** `tpo-portal-backend/src/graphql/resolvers/jobResolver.js`

**Update createJob mutation (line ~218):**
```javascript
// Find eligible students with BOTH CGPA AND branch match
const eligibleStudents = await prisma.user.findMany({
  where: {
    role: { in: ['STUDENT', 'CRC'] },
    cgpa: { gte: job.minCgpa, not: null },
    ...(job.eligibleBranches?.length > 0 && {
      branch: { in: job.eligibleBranches }
    })
  },
  select: { email: true, name: true, cgpa: true }
});
```

**Update eligibleJobs query (line ~153):**
```javascript
eligibleJobs: async (_, __, { user }) => {
  const student = await prisma.user.findUnique({
    where: { id: user.id }
  });

  const jobs = await prisma.job.findMany({
    where: {
      status: 'OPEN',
      minCgpa: { lte: student.cgpa },
      OR: [
        { eligibleBranches: { isEmpty: true } },
        { eligibleBranches: { has: student.branch } }
      ]
    }
  });
}
```

### 3. Branch List Constant

**Source:** `tpo-portal-frontend/src/components/EditUserSlideOver.jsx` (lines 16-25)

```javascript
const BRANCHES = [
  "Chemical Engineering",
  "Civil Engineering",
  "Computer Science and Engineering",
  "Electrical Engineering",
  "Electronics and Communication Engineering",
  "Information Technology",
  "Mechanical Engineering",
  "Metallurgical and Materials Engineering"
];
```

## Backwards Compatibility

For existing jobs created before this feature:

| Scenario | Behavior |
|----------|----------|
| `eligibleBranches` is null or empty | Treated as "all branches eligible" |
| Email notification | Sent to all students meeting CGPA (current behavior) |
| eligibleJobs query | Show job to all students meeting CGPA |

## Migration

```bash
cd tpo-portal-backend
npx prisma migrate dev --name add_eligible_branches
npx prisma generate
```

This migration:
- Adds `eligibleBranches` column as `String[]` with default `[]`
- Does NOT delete any existing data
- Existing jobs will have empty array (defaults to all branches)

## Testing

1. **Create job with specific branches**: Only students in those branches receive email
2. **Create job without branches**: Validation error (at least one required)
3. **Existing jobs (empty branches)**: Visible to all eligible students
4. **Update job branches**: Newly eligible students receive notification
5. **Email queue**: Verify BullMQ processes correctly with branch filtering

## Files Modified

| File | Change |
|------|--------|
| `prisma/schema.prisma` | Add `eligibleBranches: String[] @default([])` |
| `src/graphql/typeDefs/jobTypeDef.js` | Add field to Job type and inputs |
| `src/graphql/resolvers/jobResolver.js` | Filter students by branch |
| `src/pages/crc/CRCDashboard.jsx` | Add branch checkbox selector + validation |
