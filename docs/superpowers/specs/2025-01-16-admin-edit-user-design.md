# Admin Edit User Feature — Design Spec

**Date:** 2025-01-16
**Status:** Approved
**Author:** Claude Code
**Scope:** Admin panel user editing functionality

---

## Overview

Add an edit button (pencil icon) to each user row in the admin panel's Users section. When clicked, a slide-over panel opens allowing admins to edit fields that are disabled for students.

**Key Constraint:** Admin can only edit fields that are DISABLED for student self-edit.

---

## Requirements

### Admin-Editable Fields

Students CANNOT edit these fields (from Profile.jsx):
- `name` (required)
- `enrollmentNumber` (unique, required)
- `branch` (optional)
- `category` (enum: GENERAL/SC/ST/OBC/GEN_EWS/PWD)
- `gender` (enum: MALE/FEMALE/OTHER)

### DO NOT Modify

- Existing student profile edit functionality (`updateProfile` mutation)
- Student Profile.jsx component

---

## Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                    Admin Dashboard                           │
│  ┌─────────────┐  ┌──────────────────────────────────────┐ │
│  │ Users Table │  │   Slide-over Edit Panel               │ │
│  │ [Row] [✏️]  │──┼──▶  Edit User Form                   │ │
│  └─────────────┘  │   [Cancel] [Save]                    │ │
│                   └──────────────────────────────────────┘ │
└─────────────────────────────────────────────────────────────┘
                              │
                              ▼
                    adminUpdateUser GraphQL Mutation
                              │
                              ▼
                    Prisma User Update
```

**Design Decision:** Dedicated `adminUpdateUser` mutation (Approach A)
- Clean separation from student `updateProfile`
- No risk of breaking existing functionality
- Easy to add admin-specific logic later

---

## Backend Implementation

### GraphQL Type Definition

**File:** `tpo-portal-backend/src/graphql/typeDefs/userTypeDef.js`

```graphql
input AdminUpdateUserInput {
  name: String
  enrollmentNumber: String
  branch: String
  category: Category
  gender: Gender
}

extend type Mutation {
  adminUpdateUser(
    id: ID!
    input: AdminUpdateUserInput!
  ): User!
}
```

### Resolver

**File:** `tpo-portal-backend/src/graphql/resolvers/userResolver.js`

```javascript
adminUpdateUser: async (_, { id, input }, { user }) => {
  try {
    // 1. Admin-only authorization
    authorize(user, ['ADMIN']);

    // 2. Validate target user exists
    const targetUser = await prisma.user.findUnique({
      where: { id: parseInt(id) }
    });
    if (!targetUser) {
      throw new Error('User not found');
    }

    // 3. Filter undefined fields (allow empty strings for optional fields)
    const updateData = Object.entries(input).reduce((acc, [key, value]) => {
      if (value !== undefined) {
        acc[key] = value;
      }
      return acc;
    }, {});

    if (Object.keys(updateData).length === 0) {
      throw new Error('No fields to update');
    }

    // 4. Validate enrollment uniqueness (if being changed)
    if (updateData.enrollmentNumber &&
        updateData.enrollmentNumber !== targetUser.enrollmentNumber) {
      const existing = await prisma.user.findFirst({
        where: {
          enrollmentNumber: updateData.enrollmentNumber,
          id: { not: parseInt(id) }
        }
      });
      if (existing) throw new Error('Enrollment number already exists');
    }

    // 5. Update user
    const updated = await prisma.user.update({
      where: { id: parseInt(id) },
      data: updateData
    });

    return sanitizeUser(updated);

  } catch (error) {
    // Handle Prisma unique constraint (race condition)
    if (error.code === 'P2002') {
      throw new Error('Enrollment number already exists');
    }
    throw error;
  }
}
```

---

## Frontend Implementation

### New Component: EditUserSlideOver

**File:** `tpo-portal-frontend/src/components/EditUserSlideOver.jsx` (NEW)

```javascript
import { useState, useMemo } from 'react';
import { useMutation } from '@apollo/client';
import { X } from './Icons';
import { ADMIN_UPDATE_USER } from '../graphql/queries';

const enrollmentRegex = /^\d{4}[A-Z]{4}\d{3}$/; // Format: 2022BCSE123

const validateEnrollment = (value) => {
  if (!value) return 'Enrollment number is required';
  if (!enrollmentRegex.test(value)) {
    return 'Invalid format (e.g., 2022BCSE123)';
  }
  return null;
};

export default function EditUserSlideOver({ isOpen, user, onClose, onSuccess }) {
  const [editForm, setEditForm] = useState({
    name: user?.name || '',
    enrollmentNumber: user?.enrollmentNumber || '',
    branch: user?.branch || '',
    category: user?.category || '',
    gender: user?.gender || ''
  });
  const [formError, setFormError] = useState('');

  const [adminUpdateUser, { loading }] = useMutation(ADMIN_UPDATE_USER, {
    refetchQueries: [{ query: GET_STUDENTS }],
    awaitRefetchQueries: true,
    onCompleted: (data) => {
      onSuccess?.(data.adminUpdateUser);
      onClose();
      setFormError('');
    },
    onError: (error) => {
      setFormError(error.message);
    }
  });

  const hasChanges = useMemo(() => {
    if (!user) return false;
    return (
      editForm.name !== user.name ||
      editForm.enrollmentNumber !== user.enrollmentNumber ||
      editForm.branch !== user.branch ||
      editForm.category !== user.category ||
      editForm.gender !== user.gender
    );
  }, [editForm, user]);

  const handleInputChange = (field, value) => {
    setEditForm(prev => ({ ...prev, [field]: value }));
    setFormError('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setFormError('');

    // Validation
    if (!editForm.name.trim()) {
      setFormError('Name is required');
      return;
    }

    const enrollmentError = validateEnrollment(editForm.enrollmentNumber);
    if (enrollmentError) {
      setFormError(enrollmentError);
      return;
    }

    try {
      await adminUpdateUser({
        variables: {
          id: user.id,
          input: editForm
        }
      });
    } catch (err) {
      // Handled by onError callback
    }
  };

  const handleClose = () => {
    if (loading) return;
    onClose();
  };

  if (!isOpen || !user) return null;

  return (
    <div className="fixed inset-0 z-50 flex justify-end">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/50 transition-opacity"
        onClick={handleClose}
      />

      {/* Slide-over Panel */}
      <div className="relative w-full max-w-md bg-white shadow-xl h-full overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b">
          <h2 className="text-lg font-semibold text-gray-900">Edit User</h2>
          <button
            onClick={handleClose}
            disabled={loading}
            className="p-2 hover:bg-gray-100 rounded-lg disabled:opacity-50"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {formError && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
              {formError}
            </div>
          )}

          {/* Name */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Full Name *
            </label>
            <input
              type="text"
              value={editForm.name}
              onChange={(e) => handleInputChange('name', e.target.value)}
              className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-zinc-900"
              required
            />
          </div>

          {/* Enrollment Number */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Enrollment Number *
            </label>
            <input
              type="text"
              value={editForm.enrollmentNumber}
              onChange={(e) => handleInputChange('enrollmentNumber', e.target.value.toUpperCase())}
              placeholder="2022BCSE123"
              className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-zinc-900 font-mono"
              required
            />
            <p className="text-xs text-gray-500 mt-1">Format: YYYYCCCC### (e.g., 2022BCSE123)</p>
          </div>

          {/* Branch */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Branch
            </label>
            <select
              value={editForm.branch}
              onChange={(e) => handleInputChange('branch', e.target.value)}
              className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-zinc-900"
            >
              <option value="">Select branch</option>
              <option value="CSE">Computer Science</option>
              <option value="ECE">Electronics</option>
              <option value="EEE">Electrical</option>
              <option value="MECH">Mechanical</option>
              <option value="CIVIL">Civil</option>
            </select>
          </div>

          {/* Category */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Category
            </label>
            <select
              value={editForm.category}
              onChange={(e) => handleInputChange('category', e.target.value)}
              className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-zinc-900"
            >
              <option value="">Select category</option>
              <option value="GENERAL">GENERAL</option>
              <option value="SC">SC</option>
              <option value="ST">ST</option>
              <option value="OBC">OBC</option>
              <option value="GEN_EWS">GEN_EWS</option>
              <option value="PWD">PWD</option>
            </select>
          </div>

          {/* Gender */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Gender
            </label>
            <select
              value={editForm.gender}
              onChange={(e) => handleInputChange('gender', e.target.value)}
              className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-zinc-900"
            >
              <option value="">Select gender</option>
              <option value="MALE">Male</option>
              <option value="FEMALE">Female</option>
              <option value="OTHER">Other</option>
            </select>
          </div>

          {/* Actions */}
          <div className="flex gap-3 pt-4">
            <button
              type="button"
              onClick={handleClose}
              disabled={loading}
              className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 disabled:opacity-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading || !hasChanges}
              className="flex-1 px-4 py-2 bg-zinc-900 text-white rounded-lg hover:bg-zinc-800 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? 'Saving...' : 'Save Changes'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
```

### GraphQL Query

**File:** `tpo-portal-frontend/src/graphql/queries.js`

```javascript
export const ADMIN_UPDATE_USER = gql`
  mutation AdminUpdateUser($id: ID!, $input: AdminUpdateUserInput!) {
    adminUpdateUser(id: $id, input: $input) {
      id
      name
      email
      enrollmentNumber
      branch
      category
      gender
      cgpa
      role
    }
  }
`;
```

### AdminDashboard Modification

**File:** `tpo-portal-frontend/src/pages/admin/AdminDashboard.jsx`

Add pencil icon to users table row and slide-over state:

```javascript
import { useState } from 'react';
import { Pencil } from '../../components/Icons';
import EditUserSlideOver from '../../components/EditUserSlideOver';

// Inside AdminDashboard component
const [selectedUser, setSelectedUser] = useState(null);
const [editPanelOpen, setEditPanelOpen] = useState(false);

const openEditPanel = (user) => {
  setSelectedUser(user);
  setEditPanelOpen(true);
};

// In table row, add Actions column with pencil icon:
<td className="px-6 py-4">
  <button
    onClick={() => openEditPanel(user)}
    className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
    aria-label="Edit user"
  >
    <Pencil className="w-4 h-4 text-gray-600" />
  </button>
</td>

// At end of component return:
<EditUserSlideOver
  isOpen={editPanelOpen}
  user={selectedUser}
  onClose={() => {
    setEditPanelOpen(false);
    setSelectedUser(null);
  }}
  onSuccess={() => {
    // Toast shown by component
  }}
/>
```

---

## Data Flow

```
Admin clicks pencil icon
        ↓
Open slide-over panel with user data pre-filled
        ↓
Admin modifies form fields
        ↓
Clicks "Save"
        ↓
Frontend validation (name, enrollment format)
        ↓
Call adminUpdateUser mutation
        ↓
Backend: Admin auth check → User exists → Filter fields → Validate enrollment → Update DB
        ↓
Refetch students query (awaitRefetchQueries: true)
        ↓
Close panel → Show success toast
```

**Error Handling:**
- On error: Keep panel open, show error message
- Network timeout: Show error, preserve form data
- Duplicate enrollment: Backend rejects, displays error

---

## Validation

| Field | Frontend | Backend |
|-------|----------|---------|
| name | Required, min 2 chars | — |
| enrollmentNumber | Required, regex format, unique check | Unique check, P2002 handling |
| branch | Optional | — |
| category | Optional (enum) | — |
| gender | Optional (enum) | — |

---

## Security

- ✅ ADMIN-only authorization in resolver
- ✅ Backend validation (user exists, enrollment uniqueness)
- ✅ Prisma race-condition handling (P2002 unique constraint)
- ✅ Input sanitization via GraphQL types

---

## Files to Create/Modify

### Create
- `tpo-portal-frontend/src/components/EditUserSlideOver.jsx`

### Modify
- `tpo-portal-frontend/src/graphql/queries.js` (add mutation)
- `tpo-portal-frontend/src/pages/admin/AdminDashboard.jsx` (add icon + state)
- `tpo-portal-backend/src/graphql/typeDefs/userTypeDef.js` (add type + input)
- `tpo-portal-backend/src/graphql/resolvers/userResolver.js` (add resolver)

---

## Success Criteria

- [ ] Admin sees pencil icon in users table
- [ ] Clicking pencil opens slide-over panel with user data
- [ ] Form validates inputs before submission
- [ ] Save button disabled when no changes
- [ ] Successful update closes panel and refreshes table
- [ ] Duplicate enrollment shows proper error
- [ ] Non-existent user shows error
- [ ] Changes reflect everywhere (table, database)

---

## Future Enhancements (Out of Scope)

- Confirmation dialog when closing panel with unsaved changes
- Audit log for admin edits
- Bulk edit functionality
- Edit history per user
