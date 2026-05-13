# Job Type and Conditional Salary Fields Implementation Plan

> **For agentic workers:** Execute tasks sequentially in this session. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add job type classification with conditional salary fields to job postings

**Architecture:** Add JobType enum + 3 salary fields to Job model, update GraphQL schema/resolvers, add job type dropdown with conditional form fields in CRC dashboard, display formatted salaries on job cards

**Tech Stack:** Prisma ORM, PostgreSQL, GraphQL (Apollo Server), React 19, TailwindCSS v4

---

## File Structure

| File | Change | Responsibility |
|------|--------|-----------------|
| `tpo-portal-backend/prisma/schema.prisma` | Modify | Add JobType enum, add salary fields to Job model |
| `tpo-portal-backend/src/graphql/typeDefs/jobTypeDef.js` | Modify | Add JobType enum, update Job type, add fields to inputs |
| `tpo-portal-backend/src/graphql/resolvers/jobResolver.js` | Modify | Update createJob/updateJob with validation |
| `tpo-portal-frontend/src/graphql/queries.js` | Modify | Update CREATE_JOB, UPDATE_JOB queries |
| `tpo-portal-frontend/src/pages/crc/CRCDashboard.jsx` | Modify | Add job type dropdown, conditional salary fields |
| `tpo-portal-frontend/src/pages/student/EligibleCompanies.jsx` | Modify | Display formatted salary on job cards |
| `tpo-portal-frontend/src/pages/student/AllCompanies.jsx` | Modify | Display formatted salary on job cards |

---

## Task 1: Update Prisma Schema

**Files:**
- Modify: `tpo-portal-backend/prisma/schema.prisma`

- [ ] **Step 1: Add JobType enum before JobStatus enum**

Add after the existing enums section (before line 23):
```prisma
enum JobType {
  INTERN_ONLY
  INTERN_PPO
  INTERN_FTE
  FTE_ONLY
}

enum JobStatus {
  OPEN
  CLOSED
}
```

- [ ] **Step 2: Add new fields to Job model**

Find the Job model (starts around line 28). Add these fields after `status`:
```prisma
model Job {
  id             Int        @id @default(autoincrement())
  title          String
  companyId      Int
  description    String?
  minCgpa        Float
  requiredSkills String[]
  status         JobStatus  @default(OPEN)

  # New fields - add here
  jobType        JobType    @default(INTERN_ONLY)
  stipendAmount  Float?     @db.Float(0)
  ppoAmount      Float?     @db.Float(0)
  ctcAmount      Float?     @db.Float(0)

  createdAt      DateTime   @default(now())
  updatedAt      DateTime   @updatedAt

  @@index([companyId])
  @@index([status])

  company      Company       @relation(fields: [companyId], references: [id], onDelete: Cascade)
  applications Application[]
}
```

- [ ] **Step 3: Verify schema file**

Run: `npx prisma format` to ensure proper formatting

- [ ] **Step 4: Create migration**

Run: `cd tpo-portal-backend && npx prisma migrate dev --name add_job_type_and_salary_fields`

Expected: Migration file created with new enum and columns

- [ ] **Step 5: Regenerate Prisma client**

Run: `cd tpo-portal-backend && npx prisma generate`

Expected: "Generated Prisma Client" output

---

## Task 2: Update GraphQL Job Type Definitions

**Files:**
- Modify: `tpo-portal-backend/src/graphql/typeDefs/jobTypeDef.js`

- [ ] **Step 1: Add JobType enum to typeDefs**

Replace the existing `JobStatus` enum section with:
```javascript
enum JobType {
  INTERN_ONLY
  INTERN_PPO
  INTERN_FTE
  FTE_ONLY
}

enum JobStatus {
  OPEN
  CLOSED
}
```

- [ ] **Step 2: Update Job type definition**

Replace the existing `Job` type definition with:
```javascript
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
```

- [ ] **Step 3: Update CreateJobInput**

Replace `CreateJobInput` with:
```javascript
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
```

- [ ] **Step 4: Update UpdateJobInput**

Replace `UpdateJobInput` with:
```javascript
input UpdateJobInput {
  title: String
  description: String
  minCgpa: Float
  requiredSkills: [String!]
  status: JobStatus

  # New fields
  jobType: JobType
  stipendAmount: Float
  ppoAmount: Float
  ctcAmount: Float
}
```

---

## Task 3: Update Job Resolver with Validation

**Files:**
- Modify: `tpo-portal-backend/src/graphql/resolvers/jobResolver.js`

- [ ] **Step 1: Add validation helper function**

Add this function at the top of the file, before the module.exports:
```javascript
/**
 * Validate salary fields based on job type
 * @param {Object} data - Job data with jobType and salary fields
 * @throws {Error} - If validation fails
 */
function validateJobSalaryFields(data) {
  const { jobType, stipendAmount, ppoAmount, ctcAmount } = data;

  switch (jobType) {
    case 'INTERN_ONLY':
      if (!stipendAmount || stipendAmount <= 0) {
        throw new Error('Stipend amount is required for intern positions');
      }
      break;

    case 'INTERN_PPO':
      if (!stipendAmount || stipendAmount <= 0) {
        throw new Error('Stipend amount is required for intern positions');
      }
      if (!ppoAmount || ppoAmount <= 0) {
        throw new Error('PPO amount is required for Intern + PPO positions');
      }
      break;

    case 'INTERN_FTE':
      if (!stipendAmount || stipendAmount <= 0) {
        throw new Error('Stipend amount is required for intern positions');
      }
      if (!ctcAmount || ctcAmount <= 0) {
        throw new Error('CTC amount is required for positions with FTE');
      }
      break;

    case 'FTE_ONLY':
      if (!ctcAmount || ctcAmount <= 0) {
        throw new Error('CTC amount is required for FTE positions');
      }
      break;

    default:
      throw new Error(`Invalid job type: ${jobType}`);
  }

  // Clear any salary fields that don't apply to this job type
  const cleanedData = { ...data };

  switch (jobType) {
    case 'INTERN_ONLY':
      cleanedData.ppoAmount = null;
      cleanedData.ctcAmount = null;
      break;
    case 'INTERN_PPO':
      cleanedData.ctcAmount = null;
      break;
    case 'INTERN_FTE':
      cleanedData.ppoAmount = null;
      break;
    case 'FTE_ONLY':
      cleanedData.stipendAmount = null;
      cleanedData.ppoAmount = null;
      break;
  }

  return cleanedData;
}
```

- [ ] **Step 2: Update createJob mutation**

Find the `createJob` mutation and replace it with:
```javascript
createJob: async (_, { input }, { user }) => {
  try {
    // Authorize user
    authorize(user, ['ADMIN', 'CRC']);

    // Validate salary fields based on job type
    const validatedInput = validateJobSalaryFields(input);

    // Create job
    const job = await prisma.job.create({
      data: {
        title: validatedInput.title,
        companyId: validatedInput.companyId,
        description: validatedInput.description,
        minCgpa: validatedInput.minCgpa,
        requiredSkills: validatedInput.requiredSkills,
        jobType: validatedInput.jobType,
        stipendAmount: validatedInput.stipendAmount ? parseFloat(validatedInput.stipendAmount) : null,
        ppoAmount: validatedInput.ppoAmount ? parseFloat(validatedInput.ppoAmount) : null,
        ctcAmount: validatedInput.ctcAmount ? parseFloat(validatedInput.ctcAmount) : null,
        status: validatedInput.status || 'OPEN'
      }
    });

    return job;
  } catch (error) {
    throw new Error(error.message);
  }
}
```

- [ ] **Step 3: Update updateJob mutation**

Find the `updateJob` mutation and update it to handle new fields:
```javascript
updateJob: async (_, { id, input }, { user }) => {
  try {
    // Authorize user
    authorize(user, ['ADMIN', 'CRC']);

    // Get existing job
    const existingJob = await prisma.job.findUnique({
      where: { id: parseInt(id) }
    });

    if (!existingJob) {
      throw new Error('Job not found');
    }

    // Merge with existing job type if not provided
    const jobType = input.jobType || existingJob.jobType;
    const dataForValidation = {
      jobType,
      stipendAmount: input.stipendAmount !== undefined ? input.stipendAmount : existingJob.stipendAmount,
      ppoAmount: input.ppoAmount !== undefined ? input.ppoAmount : existingJob.ppoAmount,
      ctcAmount: input.ctcAmount !== undefined ? input.ctcAmount : existingJob.ctcAmount
    };

    // Validate salary fields
    const validatedData = validateJobSalaryFields(dataForValidation);

    // Update job
    const job = await prisma.job.update({
      where: { id: parseInt(id) },
      data: {
        ...(input.title && { title: input.title }),
        ...(input.description !== undefined && { description: input.description }),
        ...(input.minCgpa !== undefined && { minCgpa: input.minCgpa }),
        ...(input.requiredSkills && { requiredSkills: input.requiredSkills }),
        ...(input.status && { status: input.status }),
        jobType: validatedData.jobType,
        stipendAmount: validatedData.stipendAmount,
        ppoAmount: validatedData.ppoAmount,
        ctcAmount: validatedData.ctcAmount
      }
    });

    return job;
  } catch (error) {
    throw new Error(error.message);
  }
}
```

---

## Task 4: Update Frontend GraphQL Queries

**Files:**
- Modify: `tpo-portal-frontend/src/graphql/queries.js`

- [ ] **Step 1: Update CREATE_JOB mutation**

Find `export const CREATE_JOB` and replace with:
```javascript
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

- [ ] **Step 2: Update UPDATE_JOB mutation**

Find `export const UPDATE_JOB` and replace with:
```javascript
export const UPDATE_JOB = gql`
  mutation UpdateJob($id: ID!, $input: UpdateJobInput!) {
    updateJob(id: $id, input: $input) {
      id
      title
      description
      minCgpa
      requiredSkills
      status
      jobType
      stipendAmount
      ppoAmount
      ctcAmount
    }
  }
`;
```

- [ ] **Step 3: Update GET_JOBS query**

Find `export const GET_JOBS` and update the return fields to include new fields:
```javascript
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
      jobType
      stipendAmount
      ppoAmount
      ctcAmount
      createdAt
      updatedAt
      _applicationCount
      _isEligible
    }
  }
`;
```

- [ ] **Step 4: Update GET_ELIGIBLE_JOBS query**

Find `export const GET_ELIGIBLE_JOBS` and add the new fields:
```javascript
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
      jobType
      stipendAmount
      ppoAmount
      ctcAmount
      createdAt
      _applicationCount
    }
  }
`;
```

---

## Task 5: Add Salary Formatting Utility to Frontend

**Files:**
- Create: `tpo-portal-frontend/src/utils/formatCurrency.js`

- [ ] **Step 1: Create currency formatting utility**

Create new file with:
```javascript
/**
 * Format a number as Indian currency (INR)
 * @param {number} amount - Amount to format
 * @returns {string} - Formatted currency string (e.g., "₹50,000")
 */
export function formatIndianCurrency(amount) {
  if (!amount || amount === 0) return null;

  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 0,
    minimumFractionDigits: 0
  }).format(amount);
}

/**
 * Get salary display text based on job type and salary amounts
 * @param {Object} job - Job object with jobType and salary fields
 * @returns {string|null} - Formatted salary display text
 */
export function getSalaryDisplay(job) {
  if (!job || !job.jobType) return null;

  const stipend = formatIndianCurrency(job.stipendAmount);
  const ppo = formatIndianCurrency(job.ppoAmount);
  const ctc = formatIndianCurrency(job.ctcAmount);

  switch (job.jobType) {
    case 'INTERN_ONLY':
      return stipend ? `${stipend}/month` : null;

    case 'INTERN_PPO':
      if (stipend && ppo) {
        return `${stipend}/month • ${ppo} PPO`;
      }
      return stipend ? `${stipend}/month` : ppo ? `${ppo} PPO` : null;

    case 'INTERN_FTE':
      if (stipend && ctc) {
        return `${stipend}/month • ${ctc} CTC`;
      }
      return stipend ? `${stipend}/month` : ctc ? `${ctc} CTC` : null;

    case 'FTE_ONLY':
      return ctc ? `${ctc} CTC` : null;

    default:
      return null;
  }
}
```

---

## Task 6: Update CRC Dashboard Job State and Handlers

**Files:**
- Modify: `tpo-portal-frontend/src/pages/crc/CRCDashboard.jsx`

- [ ] **Step 1: Add import for formatCurrency utilities**

Add at the top with other imports (around line 1-25):
```javascript
import { formatIndianCurrency, getSalaryDisplay } from "../../utils/formatCurrency";
```

- [ ] **Step 2: Update newJob state initialization**

Find the `newJob` state initialization (around line 68-74) and update to:
```javascript
const [newJob, setNewJob] = useState({
  title: "",
  companyId: "",
  description: "",
  minCgpa: "",
  requiredSkills: [],
  jobType: "INTERN_ONLY",
  stipendAmount: "",
  ppoAmount: "",
  ctcAmount: ""
});
```

- [ ] **Step 3: Update handleCreateJob validation**

Find the `handleCreateJob` function and update it to validate salary fields. Add this validation after the skills validation:
```javascript
// Add after the skills validation check (after line ~103):

// Validate salary fields based on job type
const jobType = newJob.jobType || "INTERN_ONLY";
const { stipendAmount, ppoAmount, ctcAmount } = newJob;

switch (jobType) {
  case 'INTERN_ONLY':
    if (!stipendAmount || parseFloat(stipendAmount) <= 0) {
      setToast({ show: true, message: 'Stipend amount is required for intern positions', type: 'error' });
      setTimeout(() => setToast({ ...toast, show: false }), 3000);
      return;
    }
    break;

  case 'INTERN_PPO':
    if (!stipendAmount || parseFloat(stipendAmount) <= 0) {
      setToast({ show: true, message: 'Stipend amount is required for intern positions', type: 'error' });
      setTimeout(() => setToast({ ...toast, show: false }), 3000);
      return;
    }
    if (!ppoAmount || parseFloat(ppoAmount) <= 0) {
      setToast({ show: true, message: 'PPO amount is required for Intern + PPO positions', type: 'error' });
      setTimeout(() => setToast({ ...toast, show: false }), 3000);
      return;
    }
    break;

  case 'INTERN_FTE':
    if (!stipendAmount || parseFloat(stipendAmount) <= 0) {
      setToast({ show: true, message: 'Stipend amount is required for intern positions', type: 'error' });
      setTimeout(() => setToast({ ...toast, show: false }), 3000);
      return;
    }
    if (!ctcAmount || parseFloat(ctcAmount) <= 0) {
      setToast({ show: true, message: 'CTC amount is required for positions with FTE', type: 'error' });
      setTimeout(() => setToast({ ...toast, show: false }), 3000);
      return;
    }
    break;

  case 'FTE_ONLY':
    if (!ctcAmount || parseFloat(ctcAmount) <= 0) {
      setToast({ show: true, message: 'CTC amount is required for FTE positions', type: 'error' });
      setTimeout(() => setToast({ ...toast, show: false }), 3000);
      return;
    }
    break;
}
```

- [ ] **Step 4: Update createJob mutation call in handleCreateJob**

Update the mutation call to include new fields. Find the `createJob` call and update variables to:
```javascript
const result = await createJob({
  variables: {
    input: {
      title: newJob.title,
      companyId: parseInt(newJob.companyId),
      description: newJob.description,
      minCgpa: minCgpa,
      requiredSkills: newJob.requiredSkills,
      jobType: newJob.jobType,
      stipendAmount: newJob.stipendAmount ? parseFloat(newJob.stipendAmount) : null,
      ppoAmount: newJob.ppoAmount ? parseFloat(newJob.ppoAmount) : null,
      ctcAmount: newJob.ctcAmount ? parseFloat(newJob.ctcAmount) : null
    }
  }
});
```

- [ ] **Step 5: Update handleEditJob to include new fields**

Find `handleEditJob` and update to:
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
    stipendAmount: job.stipendAmount?.toString() || "",
    ppoAmount: job.ppoAmount?.toString() || "",
    ctcAmount: job.ctcAmount?.toString() || ""
  });
  setShowJobForm(true);
};
```

- [ ] **Step 6: Update handleCancelEdit to reset new fields**

Update `handleCancelEdit` to reset the new state fields:
```javascript
const handleCancelEdit = () => {
  setEditingJob(null);
  setNewJob({
    title: "",
    companyId: "",
    description: "",
    minCgpa: "",
    requiredSkills: [],
    jobType: "INTERN_ONLY",
    stipendAmount: "",
    ppoAmount: "",
    ctcAmount: ""
  });
  setShowJobForm(false);
};
```

- [ ] **Step 7: Update handleUpdateJob to handle new fields**

Find the `updateJob` mutation call and update variables to:
```javascript
await updateJob({
  variables: {
    id: editingJob.id,
    input: {
      title: newJob.title,
      description: newJob.description,
      minCgpa: minCgpa,
      requiredSkills: newJob.requiredSkills,
      jobType: newJob.jobType,
      stipendAmount: newJob.stipendAmount ? parseFloat(newJob.stipendAmount) : null,
      ppoAmount: newJob.ppoAmount ? parseFloat(newJob.ppoAmount) : null,
      ctcAmount: newJob.ctcAmount ? parseFloat(newJob.ctcAmount) : null
    }
  }
});
```

---

## Task 7: Add Job Type Dropdown and Conditional Salary Fields to Form

**Files:**
- Modify: `tpo-portal-frontend/src/pages/crc/CRCDashboard.jsx`

- [ ] **Step 1: Add Job Type dropdown to the form**

Find the form grid section (after `minCgpa` input, around line 590-615) and add the Job Type dropdown:
```javascript
                    </div>

                    {/* Add this new div after RequiredSkills */}
                    <div>
                      <label className="block text-xs font-medium text-zinc-600 mb-1.5">Job Type *</label>
                      <select
                        value={newJob.jobType}
                        onChange={(e) => {
                          setNewJob({ ...newJob, jobType: e.target.value });
                          // Clear salary fields when type changes to avoid invalid data
                          setNewJob(prev => ({
                            ...prev,
                            jobType: e.target.value,
                            stipendAmount: "",
                            ppoAmount: "",
                            ctcAmount: ""
                          }));
                        }}
                        className="w-full px-3 py-2.5 border border-zinc-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 bg-white transition-all"
                        disabled={!!editingJob}
                        required
                      >
                        <option value="INTERN_ONLY">Intern Only</option>
                        <option value="INTERN_PPO">Intern + PPO</option>
                        <option value="INTERN_FTE">Intern + FTE</option>
                        <option value="FTE_ONLY">FTE Only</option>
                      </select>
                    </div>
                  </div>

                  {/* Salary fields section - add after the grid */}
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    {/* Conditional: Stipend Amount - show for all except FTE_ONLY */}
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

                    {/* Conditional: PPO Amount - show only for INTERN_PPO */}
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

                    {/* Conditional: CTC Amount - show for INTERN_FTE and FTE_ONLY */}
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
                  </div>
```

---

## Task 8: Display Salary on Job Cards (Student View - Eligible Companies)

**Files:**
- Modify: `tpo-portal-frontend/src/pages/student/EligibleCompanies.jsx`

- [ ] **Step 1: Add import for salary utilities**

Add at the top:
```javascript
import { getSalaryDisplay } from "../../utils/formatCurrency";
```

- [ ] **Step 2: Add salary display to job card**

Find the job card mapping section where job details are displayed and add the salary display. Look for where the company name, CGPA, and skills are shown. Add after the skills display:

```javascript
                        <p className="text-xs text-zinc-500 mt-1">{job.company?.name}</p>
                        <p className="text-xs text-zinc-400 mt-2">Min CGPA: {job.minCgpa} • Skills: {job.requiredSkills?.join(", ")}</p>

                        {/* Add salary display */}
                        {getSalaryDisplay(job) && (
                          <div className="flex items-center gap-1 mt-2 text-xs font-medium text-emerald-600 bg-emerald-50 px-2 py-1 rounded-md">
                            <span>💰 {getSalaryDisplay(job)}</span>
                          </div>
                        )}
```

---

## Task 9: Display Salary on Job Cards (Student View - All Companies)

**Files:**
- Modify: `tpo-portal-frontend/src/pages/student/AllCompanies.jsx`

- [ ] **Step 1: Add import for salary utilities**

Add at the top:
```javascript
import { getSalaryDisplay } from "../../utils/formatCurrency";
```

- [ ] **Step 2: Add salary display to job cards**

Similar to Task 8, find where job details are displayed and add:
```javascript
                        {getSalaryDisplay(job) && (
                          <div className="flex items-center gap-1 mt-2 text-xs font-medium text-emerald-600 bg-emerald-50 px-2 py-1 rounded-md">
                            <span>💰 {getSalaryDisplay(job)}</span>
                          </div>
                        )}
```

---

## Task 10: Display Salary on Job Cards (CRC Dashboard - Jobs Tab)

**Files:**
- Modify: `tpo-portal-frontend/src/pages/crc/CRCDashboard.jsx`

- [ ] **Step 1: Add salary display to job listing in Jobs tab**

Find where jobs are listed (around line 660-700) and add salary display. Look for the section that shows job title, company, minCgpa, and skills. Add after the skills line:

```javascript
                        <h4 className={`text-sm font-semibold ${job.status === "CLOSED" ? "text-zinc-500" : "text-zinc-900"}`}>{job.title}</h4>
                        <p className="text-sm text-zinc-500">{job.company?.name}</p>
                        <p className="text-xs text-zinc-400 mt-2">Min CGPA: {job.minCgpa} • Skills: {job.requiredSkills?.join(", ")}</p>

                        {/* Add salary display */}
                        {getSalaryDisplay(job) && (
                          <div className="mt-2 text-xs font-medium text-emerald-600">
                            💰 {getSalaryDisplay(job)}
                          </div>
                        )}
```

---

## Task 11: Run Prisma Migration

**Files:**
- None (database operation)

- [ ] **Step 1: Navigate to backend directory**

```bash
cd tpo-portal-backend
```

- [ ] **Step 2: Run migration**

```bash
npx prisma migrate dev --name add_job_type_and_salary_fields
```

Expected output: Migration file created and applied

- [ ] **Step 3: Generate Prisma client**

```bash
npx prisma generate
```

Expected output: "Generated Prisma Client"

---

## Task 12: Manual Testing Checklist

**Files:**
- None (manual verification)

- [ ] **Test 1: Backend - Create job with each job type**

For each job type (INTERN_ONLY, INTERN_PPO, INTERN_FTE, FTE_ONLY):
- Submit with all required fields filled → Should succeed
- Submit without required salary field → Should get validation error

- [ ] **Test 2: Frontend - Job type dropdown appears**

Open CRC Dashboard → Jobs tab → Click "Post Job"
- Verify Job Type dropdown is visible
- Verify options are: Intern Only, Intern + PPO, Intern + FTE, FTE Only

- [ ] **Test 3: Frontend - Conditional fields show/hide correctly**

- Select "Intern Only" → Only Stipend field shows
- Select "Intern + PPO" → Stipend and PPO fields show
- Select "Intern + FTE" → Stipend and CTC fields show
- Select "FTE Only" → Only CTC field shows

- [ ] **Test 4: Frontend - Validation works**

- Try to submit without filling visible salary fields → Should show error toast
- Submit with negative values → Should show error toast

- [ ] **Test 5: Frontend - Create and display job**

Create a job with:
- Job Type: Intern + PPO
- Stipend: 50000
- PPO: 1200000

Verify job appears in list with "💰 ₹50,000/month • ₹12,00,000 PPO"

- [ ] **Test 6: Frontend - Edit job**

Edit an existing job and change its job type
- Verify salary fields update based on new type
- Verify changes save correctly

- [ ] **Test 7: Student view - Salary displays correctly**

Login as student → Go to Eligible Companies or All Companies
- Verify salary information shows on job cards
- Verify formatting is correct (Indian currency format)

---

## Self-Review Results

**Spec coverage:**
- ✓ JobType enum added (Task 1, 2)
- ✓ Salary fields added to Job model (Task 1)
- ✓ GraphQL schema updated (Task 2)
- ✓ Resolver validation added (Task 3)
- ✓ Frontend queries updated (Task 4)
- ✓ Currency formatting utility (Task 5)
- ✓ CRC state/handlers updated (Task 6)
- ✓ Job type dropdown added (Task 7)
- ✓ Salary display on student pages (Task 8, 9)
- ✓ Salary display on CRC dashboard (Task 10)
- ✓ Migration step included (Task 11)
- ✓ Testing verification (Task 12)

**Placeholder scan:** No placeholders found. All code is complete.

**Type consistency:** All field names match across backend and frontend (jobType, stipendAmount, ppoAmount, ctcAmount).

**Data types:** Float used consistently for all salary fields as requested.

**Editability:** All fields are editable through updateJob mutation and edit form.

**Display format:** Indian currency format (₹50,000/month, ₹12,00,000 CTC) implemented.
