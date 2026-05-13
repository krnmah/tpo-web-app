# CRC Self-Company Creation Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Enable CRC members to create companies that are automatically assigned to themselves, without admin intervention.

**Architecture:** Add a "Create Company" form in the CRC Dashboard's "My Companies" tab. Uses existing `CREATE_MY_COMPANY` GraphQL mutation. No backend changes needed - mutation already exists and works.

**Tech Stack:** React 19, Apollo Client (GraphQL), TailwindCSS v4

---

## File Structure

| File | Change | Responsibility |
|------|--------|-----------------|
| `tpo-portal-frontend/src/pages/crc/CRCDashboard.jsx` | Modify | Add company creation UI and handlers |

---

## Task 1: Import CREATE_MY_COMPANY Mutation

**Files:**
- Modify: `tpo-portal-frontend/src/pages/crc/CRCDashboard.jsx:6-8`

- [ ] **Step 1: Add CREATE_MY_COMPANY to existing imports**

Find the existing import line:
```javascript
import { GET_MY_ASSIGNED_COMPANIES } from "../../graphql/queries";
import { GET_JOBS, CREATE_JOB, CLOSE_JOB, UPDATE_JOB, DELETE_JOB } from "../../graphql/queries";
```

Replace with:
```javascript
import { GET_MY_ASSIGNED_COMPANIES } from "../../graphql/queries";
import { GET_JOBS, CREATE_JOB, CLOSE_JOB, UPDATE_JOB, DELETE_JOB } from "../../graphql/queries";
import { CREATE_MY_COMPANY } from "../../graphql/queries";
```

- [ ] **Step 2: Verify the mutation exists in queries.js**

Check that `CREATE_MY_COMPANY` is exported from `tpo-portal-frontend/src/graphql/queries.js` (should exist around line 287).

- [ ] **Step 3: Commit**

```bash
git add tpo-portal-frontend/src/pages/crc/CRCDashboard.jsx
git commit -m "feat(crc): import CREATE_MY_COMPANY mutation"
```

---

## Task 2: Add Company Form State Variables

**Files:**
- Modify: `tpo-portal-frontend/src/pages/crc/CRCDashboard.jsx:30-35`

- [ ] **Step 1: Add state variables after existing useState declarations**

Find the existing state declarations (around line 30-35):
```javascript
const [toast, setToast] = useState({ show: false, message: '', type: 'success' });
const isStudentMode = activeRole === 'STUDENT';
```

Add after `isStudentMode`:
```javascript
const isStudentMode = activeRole === 'STUDENT';
const [showCompanyForm, setShowCompanyForm] = useState(false);
const [newCompany, setNewCompany] = useState({ name: "", description: "" });
```

- [ ] **Step 2: Commit**

```bash
git add tpo-portal-frontend/src/pages/crc/CRCDashboard.jsx
git commit -m "feat(crc): add company form state variables"
```

---

## Task 3: Add CREATE_MY_COMPANY Mutation Hook

**Files:**
- Modify: `tpo-portal-frontend/src/pages/crc/CRCDashboard.jsx:60-65`

- [ ] **Step 1: Add mutation hook after existing mutations**

Find the existing mutation hooks (around line 60-65):
```javascript
const [createJob] = useMutation(CREATE_JOB);
const [closeJob] = useMutation(CLOSE_JOB);
const [updateJob] = useMutation(UPDATE_JOB);
const [deleteJob] = useMutation(DELETE_JOB);
const [updateApplicationStatus] = useMutation(UPDATE_APPLICATION_STATUS);
```

Add after the last mutation:
```javascript
const [updateApplicationStatus] = useMutation(UPDATE_APPLICATION_STATUS);
const [createMyCompany] = useMutation(CREATE_MY_COMPANY);
```

- [ ] **Step 2: Commit**

```bash
git add tpo-portal-frontend/src/pages/crc/CRCDashboard.jsx
git commit -m "feat(crc): add createMyCompany mutation hook"
```

---

## Task 4: Implement handleCreateCompany Handler

**Files:**
- Modify: `tpo-portal-frontend/src/pages/crc/CRCDashboard.jsx:193-198`

- [ ] **Step 1: Add handler function after handleCancelEdit**

Find `handleCancelEdit` function (around line 194-198):
```javascript
const handleCancelEdit = () => {
  setEditingJob(null);
  setNewJob({ title: "", companyId: "", description: "", minCgpa: "", requiredSkills: [] });
  setShowJobForm(false);
};
```

Add after this function:
```javascript
const handleCancelEdit = () => {
  setEditingJob(null);
  setNewJob({ title: "", companyId: "", description: "", minCgpa: "", requiredSkills: [] });
  setShowJobForm(false);
};

const handleCreateCompany = async (e) => {
  e.preventDefault();

  // Validation: name minimum 2 characters
  if (!newCompany.name || newCompany.name.length < 2) {
    setToast({ show: true, message: 'Company name must be at least 2 characters', type: 'error' });
    setTimeout(() => setToast({ ...toast, show: false }), 3000);
    return;
  }

  // Validation: description minimum 10 characters
  if (!newCompany.description || newCompany.description.length < 10) {
    setToast({ show: true, message: 'Description must be at least 10 characters', type: 'error' });
    setTimeout(() => setToast({ ...toast, show: false }), 3000);
    return;
  }

  try {
    const result = await createMyCompany({
      variables: {
        name: newCompany.name,
        description: newCompany.description
      }
    });

    if (result.errors?.length > 0) {
      setToast({ show: true, message: result.errors[0].message, type: 'error' });
      setTimeout(() => setToast({ ...toast, show: false }), 3000);
      return;
    }

    // Reset form and close
    setNewCompany({ name: "", description: "" });
    setShowCompanyForm(false);

    // Refetch companies to show the new one
    refetchCompanies();

    setToast({ show: true, message: 'Company created successfully! You can now post jobs for this company.', type: 'success' });
    setTimeout(() => setToast({ ...toast, show: false }), 3000);
  } catch (err) {
    setToast({ show: true, message: err.message || 'Failed to create company', type: 'error' });
    setTimeout(() => setToast({ ...toast, show: false }), 3000);
  }
};
```

- [ ] **Step 2: Commit**

```bash
git add tpo-portal-frontend/src/pages/crc/CRCDashboard.jsx
git commit -m "feat(crc): add handleCreateCompany handler with validation"
```

---

## Task 5: Add "Create Company" Button to Companies Tab Header

**Files:**
- Modify: `tpo-portal-frontend/src/pages/crc/CRCDashboard.jsx:386-411`

- [ ] **Step 1: Modify the Companies tab header to include the button**

Find the Companies tab section (around line 386-391):
```javascript
{activeTab === "companies" && (
  <div className="space-y-6">
    <div>
      <h1 className="text-2xl font-semibold text-zinc-900 tracking-tight">My Companies</h1>
      <p className="text-sm text-zinc-500 mt-1">Companies assigned to you by admin</p>
    </div>
```

Replace with:
```javascript
{activeTab === "companies" && (
  <div className="space-y-6">
    <div className="flex items-center justify-between">
      <div>
        <h1 className="text-2xl font-semibold text-zinc-900 tracking-tight">My Companies</h1>
        <p className="text-sm text-zinc-500 mt-1">Manage your companies</p>
      </div>
      <button
        onClick={() => setShowCompanyForm(true)}
        className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white text-sm font-medium rounded-lg hover:bg-indigo-700 transition-colors"
      >
        <Plus className="w-4 h-4" />
        Create Company
      </button>
    </div>
```

- [ ] **Step 2: Commit**

```bash
git add tpo-portal-frontend/src/pages/crc/CRCDashboard.jsx
git commit -m "feat(crc): add Create Company button to Companies tab header"
```

---

## Task 6: Add Company Creation Form (Shown When Button Clicked)

**Files:**
- Modify: `tpo-portal-frontend/src/pages/crc/CRCDashboard.jsx:411`

- [ ] **Step 1: Add the company form after the header section**

Find the end of the header section you just modified (after the `</div>` that closes the header). The next line should be the grid section:
```javascript
    </div>

    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
```

Add the company form between these sections:
```javascript
    </div>

    {/* Company Creation Form */}
    {showCompanyForm && (
      <div className="bg-gradient-to-br from-white to-indigo-50/30 rounded-xl shadow-md border border-indigo-100 overflow-hidden">
        <div className="flex items-center justify-between px-5 py-4 bg-gradient-to-r from-indigo-600 to-indigo-500">
          <h3 className="text-sm font-semibold text-white">Create New Company</h3>
          <button
            onClick={() => setShowCompanyForm(false)}
            className="p-1.5 text-white/80 hover:text-white hover:bg-white/20 rounded-lg transition-all"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
        <form onSubmit={handleCreateCompany} className="p-5 space-y-4">
          <div>
            <label className="block text-xs font-medium text-zinc-600 mb-1.5">Company Name *</label>
            <input
              type="text"
              placeholder="e.g., Google, Microsoft, Amazon"
              value={newCompany.name}
              onChange={(e) => setNewCompany({ ...newCompany, name: e.target.value })}
              className="w-full px-3 py-2.5 border border-zinc-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all placeholder:text-zinc-400"
              required
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-zinc-600 mb-1.5">Description *</label>
            <textarea
              placeholder="Brief description about the company, industry, type of work..."
              value={newCompany.description}
              onChange={(e) => setNewCompany({ ...newCompany, description: e.target.value })}
              className="w-full px-3 py-2.5 border border-zinc-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 resize-none transition-all placeholder:text-zinc-400"
              rows="3"
              required
            />
          </div>
          <div className="flex items-center justify-end gap-3 pt-2">
            <button
              type="button"
              onClick={() => {
                setShowCompanyForm(false);
                setNewCompany({ name: "", description: "" });
              }}
              className="px-5 py-2.5 text-sm font-medium text-zinc-600 hover:text-zinc-800 hover:bg-zinc-100 rounded-xl transition-all"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="flex items-center gap-2 px-6 py-2.5 bg-gradient-to-r from-indigo-600 to-indigo-500 text-white text-sm font-medium rounded-xl hover:from-indigo-700 hover:to-indigo-600 shadow-lg shadow-indigo-500/30 hover:shadow-xl hover:shadow-indigo-500/40 transition-all"
            >
              <Plus className="w-4 h-4" />
              Create Company
            </button>
          </div>
        </form>
      </div>
    )}

    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
```

- [ ] **Step 2: Commit**

```bash
git add tpo-portal-frontend/src/pages/crc/CRCDashboard.jsx
git commit -m "feat(crc): add company creation form with validation"
```

---

## Task 7: Update Empty State to Encourage Company Creation

**Files:**
- Modify: `tpo-portal-frontend/src/pages/crc/CRCDashboard.jsx:404-409`

- [ ] **Step 1: Replace the empty state with action-oriented message**

Find the empty state section (around line 404-409):
```javascript
              {companies.length === 0 && (
                <div className="col-span-full bg-white border border-slate-100 rounded-xl p-12 text-center">
                  <Building2 className="w-12 h-12 text-slate-300 mx-auto mb-4" />
                  <p className="text-sm text-slate-500">No companies assigned yet</p>
                </div>
              )}
```

Replace with:
```javascript
              {companies.length === 0 && (
                <div className="col-span-full bg-white border border-slate-100 rounded-xl p-12 text-center">
                  <Building2 className="w-12 h-12 text-slate-300 mx-auto mb-4" />
                  <p className="text-sm text-slate-500 mb-4">No companies yet. Create your first company to get started!</p>
                  <button
                    onClick={() => setShowCompanyForm(true)}
                    className="inline-flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white text-sm font-medium rounded-lg hover:bg-indigo-700 transition-colors"
                  >
                    <Plus className="w-4 h-4" />
                    Create Company
                  </button>
                </div>
              )}
```

- [ ] **Step 2: Commit**

```bash
git add tpo-portal-frontend/src/pages/crc/CRCDashboard.jsx
git commit -m "feat(crc): update empty state to encourage company creation"
```

---

## Task 8: Update Overview Tab to Show Correct Count

**Files:**
- Modify: `tpo-portal-frontend/src/pages/crc/CRCDashboard.jsx:324`

- [ ] **Step 1: Verify the StatCard shows correct company count**

Find the StatCard in Overview tab (around line 324):
```javascript
<StatCard label="Assigned Companies" value={companies.length} />
```

This is already correct - it uses `companies.length` which will include both admin-assigned and self-created companies via the `GET_MY_ASSIGNED_COMPANIES` query.

No changes needed, but verify the label is appropriate. Optionally update to:
```javascript
<StatCard label="My Companies" value={companies.length} />
```

- [ ] **Step 2: Commit if label was changed, otherwise skip**

```bash
# Only if label was changed:
git add tpo-portal-frontend/src/pages/crc/CRCDashboard.jsx
git commit -m "refactor(crc): update StatCard label to 'My Companies'"
```

---

## Task 9: Manual Testing

**Files:**
- None (manual verification)

- [ ] **Step 1: Start the frontend development server**

```bash
cd tpo-portal-frontend
npm run dev
```

- [ ] **Step 2: Login as a CRC user**

Navigate to `http://localhost:5173/auth` and login with CRC credentials.

- [ ] **Step 3: Navigate to Companies tab**

Click "My Companies" in the sidebar.

- [ ] **Step 4: Verify empty state shows Create Company button**

If no companies exist, verify the empty state message and "Create Company" button are visible.

- [ ] **Step 5: Click "Create Company" button**

Verify the form appears with:
- Header with "Create New Company" title and X close button
- Company Name input field
- Description textarea field
- Cancel and Create Company buttons

- [ ] **Step 6: Test validation - submit empty form**

Click "Create Company" without filling fields. Verify browser validation prevents submission (required attributes).

- [ ] **Step 7: Test validation - name too short**

Enter 1 character in name, 10+ characters in description. Click "Create Company". Verify error toast: "Company name must be at least 2 characters".

- [ ] **Step 8: Test validation - description too short**

Enter valid name, 5 characters in description. Click "Create Company". Verify error toast: "Description must be at least 10 characters".

- [ ] **Step 9: Create a valid company**

Enter:
- Name: "Test Company"
- Description: "This is a test company for verification purposes"

Click "Create Company". Verify:
- Success toast appears
- Form closes
- New company appears in the list

- [ ] **Step 10: Verify company appears in job dropdown**

Navigate to "Manage Jobs" tab and click "Post Job". Verify the newly created company appears in the Company dropdown.

- [ ] **Step 11: Test as Admin - verify company visibility**

Logout and login as Admin. Navigate to Companies section. Verify the CRC-created company appears in the list.

- [ ] **Step 12: Test Cancel button**

Click "Create Company", then click "Cancel". Verify form closes and no company is created.

---

## Task 10: Update Task Tracking

- [ ] **Step 1: Mark all tasks complete**

All implementation tasks should now be checked off.

- [ ] **Step 2: Final commit if any testing fixes were needed**

```bash
# Only if fixes were needed during testing
git add .
git commit -m "fix(crc): address issues found during testing"
```

---

## Self-Review Results

**Spec coverage:**
- ✓ Import CREATE_MY_COMPANY mutation (Task 1)
- ✓ Add state variables (Task 2)
- ✓ Add mutation hook (Task 3)
- ✓ Implement handler with validation (Task 4)
- ✓ Add Create button (Task 5)
- ✓ Add form UI (Task 6)
- ✓ Update empty state (Task 7)
- ✓ Admin visibility (verified - no changes needed, existing GET_COMPANIES query works)
- ✓ Testing verification (Task 9)

**Placeholder scan:** No placeholders found. All code is complete.

**Type consistency:** All variable names, function names, and property names are consistent throughout tasks.

**Validation rules implemented:**
- Name: min 2 characters ✓
- Description: min 10 characters ✓
- Required fields enforced ✓

---

## Success Criteria Verification

After implementation, verify:

- [ ] CRC can click "Create Company" button in Companies tab
- [ ] Form shows with name and description fields
- [ ] Validation prevents empty/invalid input
- [ ] Successful creation shows toast notification
- [ ] New company appears in company list immediately
- [ ] CRC can post jobs for newly created company
- [ ] Admin can see CRC-created companies in Admin panel
- [ ] Empty state encourages creating first company
