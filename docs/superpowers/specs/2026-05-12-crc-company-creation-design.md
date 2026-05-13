# CRC Self-Company Creation Feature

**Date:** 2026-05-12
**Author:** Claude
**Status:** Design Approved

## Overview

Enable CRC (Company Relationship Coordinator) members to create companies that are automatically assigned to themselves, without requiring admin intervention. This allows CRC to onboard companies independently and post jobs for them.

## Problem Statement

Currently:
- Only Admin can create companies and assign them to CRC
- CRC must wait for Admin to create/assign companies before posting jobs
- The `createMyCompany` mutation exists but has no UI

## Solution

Add a "Create Company" interface in the CRC Dashboard's "My Companies" tab, allowing CRC to create companies that are automatically assigned to themselves.

## Backend (Already Exists)

```graphql
# Existing mutation - no changes needed
createMyCompany(name: String!, description: String!): Company!
```

The mutation:
- Validates user is authenticated as CRC
- Creates company with `assignedCRC` set to the CRC's own user ID
- Returns the created company

## Frontend Changes

### File: `tpo-portal-frontend/src/pages/crc/CRCDashboard.jsx`

#### 1. New State Variables
```javascript
const [showCompanyForm, setShowCompanyForm] = useState(false);
const [newCompany, setNewCompany] = useState({ name: "", description: "" });
const [createMyCompany] = useMutation(CREATE_MY_COMPANY);
```

#### 2. Import Addition
```javascript
import { CREATE_MY_COMPANY } from "../../graphql/queries";
```

#### 3. Handler Function
```javascript
const handleCreateCompany = async (e) => {
  e.preventDefault();

  // Validation
  if (!newCompany.name || newCompany.name.length < 2) {
    setToast({ show: true, message: 'Company name must be at least 2 characters', type: 'error' });
    return;
  }
  if (!newCompany.description || newCompany.description.length < 10) {
    setToast({ show: true, message: 'Description must be at least 10 characters', type: 'error' });
    return;
  }

  try {
    await createMyCompany({
      variables: {
        name: newCompany.name,
        description: newCompany.description
      }
    });
    setNewCompany({ name: "", description: "" });
    setShowCompanyForm(false);
    refetchCompanies();
    setToast({ show: true, message: 'Company created successfully!', type: 'success' });
  } catch (err) {
    setToast({ show: true, message: err.message || 'Failed to create company', type: 'error' });
  }
};
```

#### 4. UI Changes in Companies Tab

**Add "Create Company" button:**
```jsx
<button
  onClick={() => setShowCompanyForm(true)}
  className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white text-sm font-medium rounded-lg hover:bg-indigo-700 transition-colors"
>
  <Plus className="w-4 h-4" />
  Create Company
</button>
```

**Add Company Form (when shown):**
```jsx
{showCompanyForm && (
  <div className="bg-gradient-to-br from-white to-indigo-50/30 rounded-xl shadow-md border border-indigo-100 overflow-hidden">
    <div className="flex items-center justify-between px-5 py-4 bg-gradient-to-r from-indigo-600 to-indigo-500">
      <h3 className="text-sm font-semibold text-white">Create New Company</h3>
      <button onClick={() => setShowCompanyForm(false)} className="p-1.5 text-white/80 hover:text-white hover:bg-white/20 rounded-lg">
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
          className="w-full px-3 py-2.5 border border-zinc-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
          required
        />
      </div>
      <div>
        <label className="block text-xs font-medium text-zinc-600 mb-1.5">Description *</label>
        <textarea
          placeholder="Brief description about the company, industry, type of work..."
          value={newCompany.description}
          onChange={(e) => setNewCompany({ ...newCompany, description: e.target.value })}
          className="w-full px-3 py-2.5 border border-zinc-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 resize-none"
          rows="3"
          required
        />
      </div>
      <div className="flex items-center justify-end gap-3 pt-2">
        <button
          type="button"
          onClick={() => setShowCompanyForm(false)}
          className="px-5 py-2.5 text-sm font-medium text-zinc-600 hover:text-zinc-800 hover:bg-zinc-100 rounded-xl"
        >
          Cancel
        </button>
        <button
          type="submit"
          className="flex items-center gap-2 px-6 py-2.5 bg-gradient-to-r from-indigo-600 to-indigo-500 text-white text-sm font-medium rounded-xl hover:from-indigo-700 hover:to-indigo-600"
        >
          <Plus className="w-4 h-4" />
          Create Company
        </button>
      </div>
    </form>
  </div>
)}
```

#### 5. Empty State Update

Update the empty state message to indicate CRC can create their own companies:
```jsx
{companies.length === 0 && (
  <div className="col-span-full bg-white border border-slate-100 rounded-xl p-12 text-center">
    <Building2 className="w-12 h-12 text-slate-300 mx-auto mb-4" />
    <p className="text-sm text-slate-500 mb-4">No companies yet. Create your first company to get started!</p>
    <button
      onClick={() => setShowCompanyForm(true)}
      className="inline-flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white text-sm font-medium rounded-lg hover:bg-indigo-700"
    >
      <Plus className="w-4 h-4" />
      Create Company
    </button>
  </div>
)}
```

## Admin Panel Visibility

**No changes needed.** The Admin panel already displays all companies via the `GET_COMPANIES` query, which fetches companies regardless of who created them. CRC-created companies will automatically appear in the Admin Dashboard.

## Data Flow

```
CRC Dashboard                    GraphQL Backend              Database
     |                                |                         |
     |  CREATE_MY_COMPANY             |                         |
     |  (name, description)  --------> |                         |
     |                                |  validate CRC role      |
     |                                |  createCompany()        |
     |                                |  assignedCRC = user.id  |
     |                                |  -------------------->  |
     |                                |                         |
     |  <-------- Company  ----------- |  <------- Return ------|
     |                                |                         |
     |  refetchCompanies()            |                         |
     |  <-------- myCompanies -------- |                         |
```

## Validation Rules

| Field | Validation |
|-------|------------|
| name | Min 2 characters, required |
| description | Min 10 characters, required |
| user role | Must be CRC (enforced by backend) |

## Success Criteria

- [ ] CRC can click "Create Company" button in Companies tab
- [ ] Form shows with name and description fields
- [ ] Validation prevents empty/invalid input
- [ ] Successful creation shows toast notification
- [ ] New company appears in company list immediately
- [ ] CRC can post jobs for newly created company
- [ ] Admin can see CRC-created companies in Admin panel
- [ ] Empty state encourages creating first company

## UI/UX Guidelines Applied

- Consistent with existing "Post Job" form styling
- Indigo accent color throughout
- Toast notifications for feedback
- Accessible form labels and focus states
- Responsive grid layout for company cards
