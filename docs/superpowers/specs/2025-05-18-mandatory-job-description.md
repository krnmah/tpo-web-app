# Mandatory Job Description Spec

**Date:** 2025-05-18
**Status:** Approved

## Problem

Currently, job description is an optional field. CRC can post jobs without any description, leaving students with insufficient information about the role.

## Solution

Make job description mandatory with a minimum length of 20 characters.

## Changes

### Backend

**File:** `tpo-portal-backend/src/utils/validation.js`

```javascript
// Before
description: z.string().optional(),

// After
description: z.string().min(20, 'Description must be at least 20 characters'),
```

**File:** `tpo-portal-backend/src/graphql/typeDefs/jobTypeDef.js`

```graphql
# Before
description: String

# After
description: String!
```

### Frontend

**File:** `tpo-portal-frontend/src/pages/crc/CRCDashboard.jsx`

- Add `*` indicator to description label
- Add helper text "Minimum 20 characters"

## Validation

- Empty description → "Description is required"
- Description < 20 chars → "Description must be at least 20 characters"
- Description ≥ 20 chars → Valid

## Testing

1. Try creating job without description → should fail
2. Try creating job with 10 char description → should fail
3. Try creating job with 20+ char description → should succeed
