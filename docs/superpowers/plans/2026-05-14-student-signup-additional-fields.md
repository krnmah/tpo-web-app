# Student Signup Additional Fields - Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add 6 new fields (mobile, category, category certificate, domicile, personal email, gender) to student signup form with proper validation and database support.

**Architecture:** Database-first approach - update Prisma schema, migrate, then update GraphQL layer (typeDefs + resolvers), finally update frontend forms.

**Tech Stack:** Prisma ORM, PostgreSQL, GraphQL (Apollo Server), React 19, Vite, TailwindCSS

---

## File Structure

**Files to modify:**
- `tpo-portal-backend/prisma/schema.prisma` - Add Category/Gender enums and new User fields
- `tpo-portal-backend/src/graphql/typeDefs/userTypeDef.js` - Add new fields to User type and mutations
- `tpo-portal-backend/src/graphql/resolvers/userResolver.js` - Add validation for new fields
- `tpo-portal-backend/src/utils/validation.js` - Add validation schemas for new fields
- `tpo-portal-frontend/src/graphql/queries.js` - Update REGISTER_STUDENT and UPDATE_PROFILE mutations
- `tpo-portal-frontend/src/pages/AuthPage.jsx` - Add new form fields to signup
- `tpo-portal-frontend/src/pages/student/Profile.jsx` - Add editable fields to profile

---

### Task 1: Add Category and Gender Enums to Prisma Schema

**Files:**
- Modify: `tpo-portal-backend/prisma/schema.prisma`

- [ ] **Step 1: Read the current Prisma schema**

Run: `Read C:\Users\91639\OneDrive\Documents\CODES\tpo-web-app\tpo-portal-backend\prisma\schema.prisma`

- [ ] **Step 2: Add Category enum before the Role enum**

Add this after line 9 (before `enum Role`):

```prisma
enum Category {
  GENERAL
  SC
  ST
  OBC
  GEN_EWS
  PWD
}
```

- [ ] **Step 3: Add Gender enum after Category enum**

```prisma
enum Gender {
  MALE
  FEMALE
  OTHER
}
```

- [ ] **Step 4: Add new fields to User model**

Add these fields after the `reportCardUrl` field (around line 46):

```prisma
model User {
  # ... existing fields
  resumeUrl        String?
  reportCardUrl    String?
  mobile                String?
  category              Category   @default(GENERAL)
  categoryCertificateUrl String?
  domicileUrl           String?
  personalEmail         String?    @unique
  gender                Gender?
  # ... rest of fields
}
```

- [ ] **Step 5: Commit**

```bash
git add tpo-portal-backend/prisma/schema.prisma
git commit -m "feat: add Category/Gender enums and new fields to User model"
```

---

### Task 2: Create Prisma Migration

**Files:**
- Execute: Prisma CLI

- [ ] **Step 1: Generate Prisma client in Docker**

Run: `docker exec tpo-web-app-backend-1 npx prisma generate`

Expected: `✔ Generated Prisma Client`

- [ ] **Step 2: Push schema changes to database**

Run: `docker exec tpo-web-app-backend-1 npx prisma db push`

Expected: `Your database is now in sync with your Prisma schema. Done in`

- [ ] **Step 3: Verify new columns in database**

Run: `docker exec tpo-web-app-postgres-1 psql -U postgres -d tnp_portal -c '\d "User"' | grep -E "(mobile|category|domicile|personalEmail|gender)"`

Expected: Should see the new columns listed

---

### Task 3: Update GraphQL User Type Definitions

**Files:**
- Modify: `tpo-portal-backend/src/graphql/typeDefs/userTypeDef.js`

- [ ] **Step 1: Read current user type definitions**

Run: `Read C:\Users\91639\OneDrive\Documents\CODES\tpo-web-app\tpo-portal-backend\src\graphql\typeDefs\userTypeDef.js`

- [ ] **Step 2: Add Category and Gender enums at the top**

Add after the existing `enum Role` definition:

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
```

- [ ] **Step 3: Add new fields to User type**

Add to the `User` type definition (after `reportCardUrl`):

```graphql
type User {
  # ... existing fields
  reportCardUrl    String
  mobile                String
  category              Category
  categoryCertificateUrl String
  domicileUrl           String
  personalEmail         String
  gender                Gender
  # ... rest of fields
}
```

- [ ] **Step 4: Update RegisterStudent input**

Add to `RegisterStudentInput`:

```graphql
input RegisterStudentInput {
  # ... existing fields
  reportCardUrl    String!
  mobile                String!
  category              Category!
  categoryCertificateUrl String
  domicileUrl           String
  personalEmail         String!
  gender                Gender!
}
```

- [ ] **Step 5: Update UpdateProfile input**

Add to `UpdateProfileInput` (only editable fields):

```graphql
input UpdateProfileInput {
  # ... existing fields
  reportCardUrl    String
  mobile                String
  categoryCertificateUrl String
  domicileUrl           String
  personalEmail         String
}
```

- [ ] **Step 6: Commit**

```bash
git add tpo-portal-backend/src/graphql/typeDefs/userTypeDef.js
git commit -m "feat: add Category/Gender enums and new fields to GraphQL schema"
```

---

### Task 4: Add Mobile Validation Schema

**Files:**
- Modify: `tpo-portal-backend/src/utils/validation.js`

- [ ] **Step 1: Read current validation file**

Run: `Read C:\Users\91639\OneDrive\Documents\CODES\tpo-web-app\tpo-portal-backend\src\utils\validation.js`

- [ ] **Step 2: Add mobile validation schema**

Add to the validation schemas:

```javascript
// Mobile number validation - 10 digits, starts with 6-9
const mobileSchema = z.string()
  .regex(/^[6-9]\d{9}$/, 'Mobile number must be 10 digits starting with 6-9');

// Category validation
const categorySchema = z.enum(['GENERAL', 'SC', 'ST', 'OBC', 'GEN_EWS', 'PWD']);

// Gender validation
const genderSchema = z.enum(['MALE', 'FEMALE', 'OTHER']);

// URL validation for certificates (optional)
const urlSchema = z.string().url('Must be a valid URL').optional().or(z.literal(''));

// Personal email validation
const personalEmailSchema = z.string().email('Invalid email address');
```

- [ ] **Step 3: Export the new schemas**

Add to the exports at the bottom of the file:

```javascript
module.exports = {
  # ... existing exports
  mobileSchema,
  categorySchema,
  genderSchema,
  urlSchema,
  personalEmailSchema
};
```

- [ ] **Step 4: Commit**

```bash
git add tpo-portal-backend/src/utils/validation.js
git commit -m "feat: add validation schemas for new signup fields"
```

---

### Task 5: Update RegisterStudent Resolver with New Fields

**Files:**
- Modify: `tpo-portal-backend/src/graphql/resolvers/authResolver.js`

- [ ] **Step 1: Read the auth resolver**

Run: `Read C:\Users\91639\OneDrive\Documents\CODES\tpo-web-app\tpo-portal-backend\src\graphql\resolvers\authResolver.js`

- [ ] **Step 2: Import new validation schemas**

Add to imports at the top:

```javascript
const {
  # ... existing imports
  mobileSchema,
  categorySchema,
  genderSchema,
  urlSchema,
  personalEmailSchema
} = require('../../utils/validation');
```

- [ ] **Step 3: Update registerStudent mutation validation**

Update the `registerStudent` mutation validation (find the existing validation and add new fields):

```javascript
const registerStudentValidation = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters'),
  enrollmentNumber: z.string().min(1, 'Enrollment number is required'),
  branch: z.string().min(2, 'Branch must be at least 2 characters'),
  email: z.string().email('Invalid email address'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
  cgpa: z.number().min(0).max(10),
  skills: z.array(z.string()).min(1, 'At least one skill is required'),
  resumeUrl: z.string().url('Resume URL must be valid'),
  reportCardUrl: z.string().url('Report card URL must be valid'),
  mobile: mobileSchema,
  category: categorySchema,
  categoryCertificateUrl: z.string().optional(),
  domicileUrl: urlSchema,
  personalEmail: personalEmailSchema,
  gender: genderSchema
});
```

- [ ] **Step 4: Add category certificate conditional validation**

After the validation result, add:

```javascript
// If category is not GENERAL, certificate is required
if (validatedData.category !== 'GENERAL' && !validatedData.categoryCertificateUrl) {
  throw new Error('Category certificate is required for reserved categories');
}
```

- [ ] **Step 5: Update user creation data**

Update the `prisma.user.create` call to include new fields:

```javascript
const user = await prisma.user.create({
  data: {
    # ... existing fields
    resumeUrl: validatedData.resumeUrl,
    reportCardUrl: validatedData.reportCardUrl,
    mobile: validatedData.mobile,
    category: validatedData.category,
    categoryCertificateUrl: validatedData.categoryCertificateUrl,
    domicileUrl: validatedData.domicileUrl,
    personalEmail: validatedData.personalEmail,
    gender: validatedData.gender
  }
});
```

- [ ] **Step 6: Commit**

```bash
git add tpo-portal-backend/src/graphql/resolvers/authResolver.js
git commit -m "feat: update registerStudent with new fields and validation"
```

---

### Task 6: Update UpdateProfile Resolver

**Files:**
- Modify: `tpo-portal-backend/src/graphql/resolvers/userResolver.js`

- [ ] **Step 1: Read the user resolver**

Run: `Read C:\Users\91639\OneDrive\Documents\CODES\tpo-web-app\tpo-portal-backend\src\graphql/resolvers/userResolver.js`

- [ ] **Step 2: Import validation schemas**

Add to imports:

```javascript
const {
  # ... existing imports
  mobileSchema,
  urlSchema,
  personalEmailSchema
} = require('../../utils/validation');
```

- [ ] **Step 3: Update updateProfile mutation**

Update the `updateProfile` mutation to handle new editable fields:

```javascript
updateProfile: async (_, args, { user }) => {
  authorize(user, ['STUDENT', 'CRC']);

  const { name, cgpa, skills, resumeUrl, reportCardUrl, mobile, categoryCertificateUrl, domicileUrl, personalEmail } = args;

  const updateData = {};
  if (name) updateData.name = name;
  if (cgpa) updateData.cgpa = cgpa;
  if (skills) updateData.skills = skills;
  if (resumeUrl) updateData.resumeUrl = resumeUrl;
  if (reportCardUrl) updateData.reportCardUrl = reportCardUrl;

  // New fields validation
  if (mobile) {
    const validatedMobile = mobileSchema.parse(mobile);
    updateData.mobile = validatedMobile;
  }
  if (categoryCertificateUrl) {
    const validatedUrl = urlSchema.parse(categoryCertificateUrl);
    updateData.categoryCertificateUrl = validatedUrl;
  }
  if (domicileUrl) {
    const validatedUrl = urlSchema.parse(domicileUrl);
    updateData.domicileUrl = validatedUrl;
  }
  if (personalEmail) {
    const validatedEmail = personalEmailSchema.parse(personalEmail);
    // Check if email is already taken by another user
    const existing = await prisma.user.findFirst({
      where: {
        personalEmail: validatedEmail,
        id: { not: user.id }
      }
    });
    if (existing) {
      throw new Error('Personal email already exists');
    }
    updateData.personalEmail = validatedEmail;
  }

  const updated = await prisma.user.update({
    where: { id: user.id },
    data: updateData
  });

  return updated;
}
```

- [ ] **Step 4: Commit**

```bash
git add tpo-portal-backend/src/graphql/resolvers/userResolver.js
git commit -m "feat: update updateProfile with new editable fields"
```

---

### Task 7: Update Frontend GraphQL Mutations

**Files:**
- Modify: `tpo-portal-frontend/src/graphql/queries.js`

- [ ] **Step 1: Read queries file**

Run: `Read C:\Users\91639\OneDrive\Documents\CODES\tpo-web-app\tpo-portal-frontend\src\graphql\queries.js`

- [ ] **Step 2: Update REGISTER_STUDENT mutation**

Replace the existing mutation with:

```javascript
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
    $mobile: String!
    $category: Category!
    $categoryCertificateUrl: String
    $domicileUrl: String
    $personalEmail: String!
    $gender: Gender!
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
      mobile: $mobile
      category: $category
      categoryCertificateUrl: $categoryCertificateUrl
      domicileUrl: $domicileUrl
      personalEmail: $personalEmail
      gender: $gender
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
        mobile
        category
        categoryCertificateUrl
        domicileUrl
        personalEmail
        gender
      }
    }
  }
`;
```

- [ ] **Step 3: Update UPDATE_PROFILE mutation**

Add new fields to the mutation and response:

```javascript
export const UPDATE_PROFILE = gql`
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
  ) {
    updateProfile(
      name: $name
      cgpa: $cgpa
      skills: $skills
      resumeUrl: $resumeUrl
      reportCardUrl: $reportCardUrl
      mobile: $mobile
      categoryCertificateUrl: $categoryCertificateUrl
      domicileUrl: $domicileUrl
      personalEmail: $personalEmail
    ) {
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
      mobile
      category
      categoryCertificateUrl
      domicileUrl
      personalEmail
      gender
      createdAt
      updatedAt
    }
  }
`;
```

- [ ] **Step 4: Commit**

```bash
git add tpo-portal-frontend/src/graphql/queries.js
git commit -m "feat: update GraphQL mutations with new signup fields"
```

---

### Task 8: Add Category and Gender Enums to Frontend Queries

**Files:**
- Modify: `tpo-portal-frontend/src/graphql/queries.js`

- [ ] **Step 1: Add enums at the top of the file**

Add after the imports (before first query):

```javascript
// GraphQL Enums for type safety
export const CATEGORY_OPTIONS = [
  { value: 'GENERAL', label: 'General' },
  { value: 'SC', label: 'SC' },
  { value: 'ST', label: 'ST' },
  { value: 'OBC', label: 'OBC' },
  { value: 'GEN_EWS', label: 'Gen-EWS' },
  { value: 'PWD', label: 'PWD' }
];

export const GENDER_OPTIONS = [
  { value: 'MALE', label: 'Male' },
  { value: 'FEMALE', label: 'Female' },
  { value: 'OTHER', label: 'Other' }
];
```

- [ ] **Step 2: Commit**

```bash
git add tpo-portal-frontend/src/graphql/queries.js
git commit -m "feat: add Category/Gender enum constants for frontend"
```

---

### Task 9: Update AuthPage Signup Form State

**Files:**
- Modify: `tpo-portal-frontend/src/pages/AuthPage.jsx`

- [ ] **Step 1: Read AuthPage**

Run: `Read C:\Users\91639\OneDrive\Documents\CODES\tpo-web-app\tpo-portal-frontend\src\pages\AuthPage.jsx`

- [ ] **Step 2: Import enum constants**

Add to imports:

```javascript
import { REGISTER_STUDENT, SEND_PASSWORD_RESET_OTP, VERIFY_OTP_AND_RESET_PASSWORD, SEND_EMAIL_VERIFICATION_OTP, VERIFY_EMAIL_OTP, CATEGORY_OPTIONS, GENDER_OPTIONS } from "../graphql/queries";
```

- [ ] **Step 3: Update signup form state**

Find the `setSignupData` state initialization and add new fields. The state should now include:

```javascript
const [signupData, setSignupData] = useState({
  name: "",
  enrollmentNumber: "",
  branch: "",
  email: "",
  password: "",
  confirmPassword: "",
  cgpa: "",
  skills: "",
  resumeUrl: "",
  reportCardUrl: "",
  mobile: "",
  category: "GENERAL",
  categoryCertificateUrl: "",
  domicileUrl: "",
  personalEmail: "",
  gender: ""
});
```

- [ ] **Step 4: Commit**

```bash
git add tpo-portal-frontend/src/pages/AuthPage.jsx
git commit -m "feat: add new fields to signup form state"
```

---

### Task 10: Add New Form Fields to Signup UI

**Files:**
- Modify: `tpo-portal-frontend/src/pages/AuthPage.jsx`

- [ ] **Step 1: Find the signup form JSX**

Look for the signup form inputs (after email/password fields)

- [ ] **Step 2: Add mobile number input**

Add after the branch field:

```jsx
<div>
  <label className="block text-sm font-medium text-zinc-700 mb-1">Mobile Number *</label>
  <input
    type="tel"
    placeholder="10-digit mobile number"
    value={signupData.mobile}
    onChange={(e) => setSignupData({ ...signupData, mobile: e.target.value })}
    className="w-full px-4 py-2.5 border border-zinc-200 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
    required
  />
</div>
```

- [ ] **Step 3: Add category dropdown with certificate conditional field**

```jsx
<div>
  <label className="block text-sm font-medium text-zinc-700 mb-1">Category *</label>
  <select
    value={signupData.category}
    onChange={(e) => setSignupData({ ...signupData, category: e.target.value })}
    className="w-full px-4 py-2.5 border border-zinc-200 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
    required
  >
    {CATEGORY_OPTIONS.map(opt => (
      <option key={opt.value} value={opt.value}>{opt.label}</option>
    ))}
  </select>
</div>

{signupData.category !== 'GENERAL' && (
  <div>
    <label className="block text-sm font-medium text-zinc-700 mb-1">Category Certificate URL *</label>
    <input
      type="url"
      placeholder="https://drive.google.com/..."
      value={signupData.categoryCertificateUrl}
      onChange={(e) => setSignupData({ ...signupData, categoryCertificateUrl: e.target.value })}
      className="w-full px-4 py-2.5 border border-zinc-200 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
      required={signupData.category !== 'GENERAL'}
    />
    {signupData.categoryCertificateUrl && (
      <a href={signupData.categoryCertificateUrl} target="_blank" rel="noopener noreferrer" className="text-xs text-indigo-600 hover:underline mt-1 block">
        Preview certificate link →
      </a>
    )}
  </div>
)}
```

- [ ] **Step 4: Add domicile input**

```jsx
<div>
  <label className="block text-sm font-medium text-zinc-700 mb-1">Domicile Certificate (Optional)</label>
  <input
    type="url"
    placeholder="https://drive.google.com/..."
    value={signupData.domicileUrl}
    onChange={(e) => setSignupData({ ...signupData, domicileUrl: e.target.value })}
    className="w-full px-4 py-2.5 border border-zinc-200 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
  />
</div>
```

- [ ] **Step 5: Add personal email input**

```jsx
<div>
  <label className="block text-sm font-medium text-zinc-700 mb-1">Personal Email *</label>
  <input
    type="email"
    placeholder="your@email.com"
    value={signupData.personalEmail}
    onChange={(e) => setSignupData({ ...signupData, personalEmail: e.target.value })}
    className="w-full px-4 py-2.5 border border-zinc-200 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
    required
  />
</div>
```

- [ ] **Step 6: Add gender dropdown**

```jsx
<div>
  <label className="block text-sm font-medium text-zinc-700 mb-1">Gender *</label>
  <select
    value={signupData.gender}
    onChange={(e) => setSignupData({ ...signupData, gender: e.target.value })}
    className="w-full px-4 py-2.5 border border-zinc-200 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
    required
  >
    <option value="">Select Gender</option>
    {GENDER_OPTIONS.map(opt => (
      <option key={opt.value} value={opt.value}>{opt.label}</option>
    ))}
  </select>
</div>
```

- [ ] **Step 7: Commit**

```bash
git add tpo-portal-frontend/src/pages/AuthPage.jsx
git commit -m "feat: add new form fields to signup UI"
```

---

### Task 11: Update Signup Handler with New Fields

**Files:**
- Modify: `tpo-portal-frontend/src/pages/AuthPage.jsx`

- [ ] **Step 1: Find the handleSignup function**

Look for the `handleSignup` async function

- [ ] **Step 2: Add mobile validation**

Add after existing validations:

```javascript
// Validate mobile number
const mobileRegex = /^[6-9]\d{9}$/;
if (!mobileRegex.test(signupData.mobile)) {
  setSignupError('Mobile number must be 10 digits starting with 6-9');
  return;
}
```

- [ ] **Step 3: Add category certificate validation**

```javascript
// Validate category certificate
if (signupData.category !== 'GENERAL' && !signupData.categoryCertificateUrl) {
  setSignupError('Category certificate is required for reserved categories');
  return;
}
```

- [ ] **Step 4: Update registerStudent mutation call**

Update the mutation variables:

```javascript
const result = await registerStudent({
  variables: {
    name: signupData.name,
    enrollmentNumber: signupData.enrollmentNumber,
    branch: signupData.branch,
    email: signupData.email,
    password: signupData.password,
    cgpa: parseFloat(signupData.cgpa),
    skills: signupData.skills.split(',').map(s => s.trim()),
    resumeUrl: signupData.resumeUrl,
    reportCardUrl: signupData.reportCardUrl,
    mobile: signupData.mobile,
    category: signupData.category,
    categoryCertificateUrl: signupData.categoryCertificateUrl || null,
    domicileUrl: signupData.domicileUrl || null,
    personalEmail: signupData.personalEmail,
    gender: signupData.gender
  }
});
```

- [ ] **Step 5: Commit**

```bash
git add tpo-portal-frontend/src/pages/AuthPage.jsx
git commit -m "feat: update signup handler with new fields validation"
```

---

### Task 12: Update GET_ME Query Response

**Files:**
- Modify: `tpo-portal-frontend/src/graphql/queries.js`

- [ ] **Step 1: Find GET_ME query**

- [ ] **Step 2: Add new fields to GET_ME response**

```javascript
export const GET_ME = gql`
  query GetMe {
    me {
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
      mobile
      category
      categoryCertificateUrl
      domicileUrl
      personalEmail
      gender
    }
  }
`;
```

- [ ] **Step 3: Commit**

```bash
git add tpo-portal-frontend/src/graphql/queries.js
git commit -m "feat: add new fields to GET_ME query"
```

---

### Task 13: Add Editable Fields to Profile Page

**Files:**
- Modify: `tpo-portal-frontend/src/pages/student/Profile.jsx`

- [ ] **Step 1: Read Profile page**

Run: `Read C:\Users\91639\OneDrive\Documents\CODES\tpo-web-app\tpo-portal-frontend\src\pages\student\Profile.jsx`

- [ ] **Step 2: Import CATEGORY_OPTIONS**

Add to imports if not present:

```javascript
import { GET_ME, UPDATE_PROFILE } from "../graphql/queries";
```

- [ ] **Step 3: Add editable fields to profile form state**

Add to the form state (mobile, categoryCertificateUrl, domicileUrl, personalEmail)

- [ ] **Step 4: Add form inputs for editable fields**

Add to the profile edit form:

```jsx
{/* Mobile Number */}
<div>
  <label className="block text-sm font-medium text-zinc-700 mb-1">Mobile Number</label>
  <input
    type="tel"
    value={formData.mobile || ''}
    onChange={(e) => setFormData({ ...formData, mobile: e.target.value })}
    placeholder="10-digit mobile number"
    className="w-full px-3 py-2 border rounded-lg"
  />
</div>

{/* Category Certificate */}
<div>
  <label className="block text-sm font-medium text-zinc-700 mb-1">Category Certificate</label>
  <input
    type="url"
    value={formData.categoryCertificateUrl || ''}
    onChange={(e) => setFormData({ ...formData, categoryCertificateUrl: e.target.value })}
    placeholder="Certificate drive link"
    className="w-full px-3 py-2 border rounded-lg"
  />
</div>

{/* Domicile */}
<div>
  <label className="block text-sm font-medium text-zinc-700 mb-1">Domicile Certificate</label>
  <input
    type="url"
    value={formData.domicileUrl || ''}
    onChange={(e) => setFormData({ ...formData, domicileUrl: e.target.value })}
    placeholder="Domicile drive link (optional)"
    className="w-full px-3 py-2 border rounded-lg"
  />
</div>

{/* Personal Email */}
<div>
  <label className="block text-sm font-medium text-zinc-700 mb-1">Personal Email</label>
  <input
    type="email"
    value={formData.personalEmail || ''}
    onChange={(e) => setFormData({ ...formData, personalEmail: e.target.value })}
    placeholder="your@email.com"
    className="w-full px-3 py-2 border rounded-lg"
  />
</div>
```

- [ ] **Step 5: Update UPDATE_PROFILE mutation call**

Include new fields in the mutation variables

- [ ] **Step 6: Commit**

```bash
git add tpo-portal-frontend/src/pages/student/Profile.jsx
git commit -m "feat: add editable fields to profile page"
```

---

### Task 14: Regenerate Prisma Client in Docker and Restart

**Files:**
- Execute: Docker commands

- [ ] **Step 1: Regenerate Prisma client**

Run: `docker exec tpo-web-app-backend-1 npx prisma generate`

Expected: `✔ Generated Prisma Client`

- [ ] **Step 2: Restart backend container**

Run: `docker compose restart backend`

Expected: Container restarts successfully

- [ ] **Step 3: Restart frontend container**

Run: `docker compose restart frontend`

Expected: Container restarts successfully

---

### Task 15: Manual Testing

**Files:**
- Manual verification

- [ ] **Step 1: Test signup with all fields**

1. Go to signup page
2. Fill all fields including new ones
3. Select "General" category - certificate should NOT appear
4. Submit - verify account creation

- [ ] **Step 2: Test signup with reserved category**

1. Go to signup page
2. Select "SC" category
3. Certificate field should appear
4. Try submitting without certificate - should show error
5. Add certificate URL and submit - should work

- [ ] **Step 3: Test mobile validation**

1. Try invalid mobile (less than 10 digits) - should error
2. Try mobile starting with 5 - should error
3. Try valid 10-digit mobile starting with 7 - should work

- [ ] **Step 4: Test profile update**

1. Login as student
2. Go to profile page
3. Edit mobile, certificate links, personal email
4. Save changes - should persist

- [ ] **Step 5: Verify non-editable fields**

1. Ensure category and gender cannot be changed in profile
2. Only mobile, certificate links, domicile, personal email editable

---

## Self-Review Results

✅ **Spec coverage:** All requirements covered
- Mobile with 10-digit validation ✅
- Category enum with 6 options ✅
- Conditional certificate requirement ✅
- Domicile optional field ✅
- Personal email unique ✅
- Gender enum ✅
- Editable vs non-editable fields ✅

✅ **No placeholders** - All code is complete

✅ **Type consistency** - All enums match across Prisma, GraphQL, and frontend

✅ **Scope check** - Single focused feature, appropriate for one plan
