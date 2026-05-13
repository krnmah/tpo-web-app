# Job Type and Conditional Salary Fields

**Date:** 2026-05-13
**Author:** Claude
**Status:** Approved

## Overview

Add job type classification to job postings with conditional salary fields that appear based on the selected job type. This enables proper salary information display and will be used for future blocking logic.

## Problem Statement

Currently, job postings lack:
1. Job type classification (Intern vs FTE vs PPO)
2. Structured salary information (stipend, CTC, PPO amounts)
3. Salary data needed for future placement blocking logic

## Solution

Add a `JobType` enum with four options and conditionally show relevant salary fields based on the selected type.

## Job Type Options

| Value | Description | Salary Fields Required |
|-------|-------------|------------------------|
| `INTERN_ONLY` | Internship only | `stipendAmount` |
| `INTERN_PPO` | Internship with PPO possibility | `stipendAmount`, `ppoAmount` |
| `INTERN_FTE` | Internship with FTE possibility | `stipendAmount`, `ctcAmount` |
| `FTE_ONLY` | Full-time employment only | `ctcAmount` |

## Backend Changes

### 1. Prisma Schema

```prisma
enum JobType {
  INTERN_ONLY
  INTERN_PPO
  INTERN_FTE
  FTE_ONLY
}

model Job {
  id             Int        @id @default(autoincrement())
  title          String
  companyId      Int
  description    String?
  minCgpa        Float
  requiredSkills String[]
  status         JobStatus  @default(OPEN)

  // New fields
  jobType        JobType    @default(INTERN_ONLY)
  stipendAmount  Float?     @db.Float(0)  // For intern positions
  ppoAmount      Float?     @db.Float(0)  // For PPO offers
  ctcAmount      Float?     @db.Float(0)  // For FTE positions

  createdAt      DateTime   @default(now())
  updatedAt      DateTime   @updatedAt

  company        Company    @relation(fields: [companyId], references: [id])
  applications    Application[]
}
```

### 2. GraphQL Type Definitions

**File:** `tpo-portal-backend/src/graphql/typeDefs/jobTypeDef.js`

```graphql
enum JobType {
  INTERN_ONLY
  INTERN_PPO
  INTERN_FTE
  FTE_ONLY
}

type Job {
  id: ID!
  title: String!
  description: String
  company: Company!
  minCgpa: Float!
  requiredSkills: [String!]!
  status: JobStatus!

  # New fields
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
  description: String
  companyId: Int!
  minCgpa: Float!
  requiredSkills: [String!]!
  status: JobStatus

  # New fields
  jobType: JobType!
  stipendAmount: Float
  ppoAmount: Float
  ctcAmount: Float
}

input UpdateJobInput {
  title: String
  description: String
  minCgpa: Float
  requiredSkills: [String!]
  status: JobStatus

  # New fields - all editable
  jobType: JobType
  stipendAmount: Float
  ppoAmount: Float
  ctcAmount: Float
}
```

### 3. Resolver Changes

**File:** `tpo-portal-backend/src/graphql/resolvers/jobResolver.js`

Update `createJob` and `updateJob` to handle new fields. Add validation to ensure required salary fields are provided based on `jobType`.

### 4. Salary Formatting Utility

**File:** `tpo-portal-backend/src/utils/formatSalary.js`

```javascript
function formatSalary(amount, type) {
  if (!amount) return null;

  const formatted = new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 0
  }).format(amount);

  switch(type) {
    case 'stipend':
      return formatted + '/month';
    case 'ppo':
      return formatted + ' PPO';
    case 'ctc':
      return formatted + ' CTC';
    default:
      return formatted;
  }
}
```

## Frontend Changes

### 1. CRC Dashboard - Job Posting Form

**File:** `tpo-portal-frontend/src/pages/crc/CRCDashboard.jsx`

**Add to newJob state:**
```javascript
const [newJob, setNewJob] = useState({
  title: "",
  companyId: "",
  description: "",
  minCgpa: "",
  requiredSkills: [],
  jobType: "INTERN_ONLY",  // New field
  stipendAmount: "",        // New field
  ppoAmount: "",            // New field
  ctcAmount: ""             // New field
});
```

**Add Job Type dropdown:**
```jsx
<div>
  <label className="block text-xs font-medium text-zinc-600 mb-1.5">Job Type *</label>
  <select
    value={newJob.jobType}
    onChange={(e) => {
      setNewJob({ ...newJob, jobType: e.target.value });
      // Clear salary fields when type changes
      setNewJob(prev => ({ ...prev, stipendAmount: "", ppoAmount: "", ctcAmount: "" }));
    }}
    className="w-full px-3 py-2.5 border border-zinc-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 bg-white transition-all"
    required
  >
    <option value="INTERN_ONLY">Intern Only</option>
    <option value="INTERN_PPO">Intern + PPO</option>
    <option value="INTERN_FTE">Intern + FTE</option>
    <option value="FTE_ONLY">FTE Only</option>
  </select>
</div>
```

**Add conditional salary fields:**
```jsx
{/* Conditional: Stipend (for all except FTE_ONLY) */}
{newJob.jobType !== 'FTE_ONLY' && (
  <div>
    <label className="block text-xs font-medium text-zinc-600 mb-1.5">
      Stipend Amount (₹/month) *
    </label>
    <input
      type="number"
      step="0.01"
      min="0"
      placeholder="e.g., 50000"
      value={newJob.stipendAmount}
      onChange={(e) => setNewJob({ ...newJob, stipendAmount: e.target.value })}
      className="w-full px-3 py-2.5 border border-zinc-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all placeholder:text-zinc-400"
      required={newJob.jobType !== 'FTE_ONLY'}
    />
  </div>
)}

{/* Conditional: PPO Amount (for INTERN_PPO only) */}
{newJob.jobType === 'INTERN_PPO' && (
  <div>
    <label className="block text-xs font-medium text-zinc-600 mb-1.5">
      PPO Amount (₹/year) *
    </label>
    <input
      type="number"
      step="0.01"
      min="0"
      placeholder="e.g., 1200000"
      value={newJob.ppoAmount}
      onChange={(e) => setNewJob({ ...newJob, ppoAmount: e.target.value })}
      className="w-full px-3 py-2.5 border border-zinc-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all placeholder:text-zinc-400"
      required
    />
  </div>
)}

{/* Conditional: CTC Amount (for INTERN_FTE and FTE_ONLY) */}
{(newJob.jobType === 'INTERN_FTE' || newJob.jobType === 'FTE_ONLY') && (
  <div>
    <label className="block text-xs font-medium text-zinc-600 mb-1.5">
      CTC Amount (₹/year) *
    </label>
    <input
      type="number"
      step="0.01"
      min="0"
      placeholder="e.g., 1800000"
      value={newJob.ctcAmount}
      onChange={(e) => setNewJob({ ...newJob, ctcAmount: e.target.value })}
      className="w-full px-3 py-2.5 border border-zinc-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all placeholder:text-zinc-400"
      required
    />
  </div>
)}
```

### 2. GraphQL Queries Update

**File:** `tpo-portal-frontend/src/graphql/queries.js`

Update `CREATE_JOB`, `UPDATE_JOB`, and `GET_JOBS` queries to include new fields:

```graphql
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
      jobType
      stipendAmount
      ppoAmount
      ctcAmount
      createdAt
    }
  }
`;
```

### 3. Job Card Display (Student View)

**Files:** `tpo-portal-frontend/src/pages/student/EligibleCompanies.jsx`, `AllCompanies.jsx`

Add salary display component:

```jsx
const formatIndianCurrency = (amount) => {
  if (!amount) return null;
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 0
  }).format(amount);
};

const getSalaryDisplay = (job) => {
  switch(job.jobType) {
    case 'INTERN_ONLY':
      return `${formatIndianCurrency(job.stipendAmount)}/month`;
    case 'INTERN_PPO':
      return `${formatIndianCurrency(job.stipendAmount)}/month • ${formatIndianCurrency(job.ppoAmount)} PPO`;
    case 'INTERN_FTE':
      return `${formatIndianCurrency(job.stipendAmount)}/month • ${formatIndianCurrency(job.ctcAmount)} CTC`;
    case 'FTE_ONLY':
      return `${formatIndianCurrency(job.ctcAmount)} CTC`;
    default:
      return null;
  }
};

// In job card:
{getSalaryDisplay(job) && (
  <div className="text-xs text-zinc-600 mt-2">
    💰 {getSalaryDisplay(job)}
  </div>
)}
```

### 4. Edit Job Form Update

Update `handleEditJob` to include new fields:

```javascript
const handleEditJob = (job) => {
  setEditingJob(job);
  setNewJob({
    title: job.title,
    companyId: job.company?.id?.toString(),
    description: job.description || "",
    minCgpa: job.minCgpa?.toString(),
    requiredSkills: job.requiredSkills || [],
    jobType: job.jobType || "INTERN_ONLY",
    stipendAmount: job.stipendAmount || "",
    ppoAmount: job.ppoAmount || "",
    ctcAmount: job.ctcAmount || ""
  });
  setShowJobForm(true);
};
```

## Data Flow

```
┌─────────────┐    Job Type     ┌──────────────────────────────────────┐
│  CRC Form   │ ───────────────▶│  Show/Hide Conditional Fields      │
└─────────────┘                 └──────────────────────────────────────┘
                                      │
                                      ▼
                              ┌───────────────┐
                              │ Validation    │
                              │ (based on     │
                              │  job type)    │
                              └───────────────┘
                                      │
                                      ▼
                      ┌───────────────────────────────┐
                      │   Submit to GraphQL           │
                      │   { jobType, stipendAmount,   │
                      │     ppoAmount, ctcAmount }    │
                      └───────────────────────────────┘
                                      │
                                      ▼
                      ┌───────────────────────────────┐
                      │      Backend Resolver          │
                      │  (validates + saves to DB)     │
                      └───────────────────────────────┘
```

## Validation Matrix

| Job Type | stipendAmount | ppoAmount | ctcAmount |
|----------|---------------|-----------|-----------|
| INTERN_ONLY | Required | Hidden | Hidden |
| INTERN_PPO | Required | Required | Hidden |
| INTERN_FTE | Required | Hidden | Required |
| FTE_ONLY | Hidden | Hidden | Required |

## Database Migration

A Prisma migration will be required to:
1. Add `JobType` enum
2. Add `jobType`, `stipendAmount`, `ppoAmount`, `ctcAmount` columns to `Job` table
3. Set default value for existing jobs (default to `INTERN_ONLY`)

## Success Criteria

- [ ] Job type dropdown appears in job posting form
- [ ] Salary fields show/hide based on selected job type
- [ ] Validation ensures required salary fields are filled
- [ ] Salary data saves correctly to database
- [ ] Job type and salaries display on job cards (student view)
- [ ] Edit form allows updating job type and salaries
- [ ] Salary formatting displays correctly (₹50,000/month format)
- [ ] No existing functionality broken

## UI/UX Guidelines Applied

- Conditional fields animate in/out smoothly
- Salary inputs match existing form styling
- Clear labels with currency indicators (₹/month, ₹/year)
- Required field indicators (*), only for visible fields
- Consistent with existing "Post Job" form design
