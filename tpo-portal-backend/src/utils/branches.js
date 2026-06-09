const z = require('zod');

const BRANCH_ENUM = Object.freeze({
  CHEMICAL: 'Chemical Engineering',
  CIVIL: 'Civil Engineering',
  CSE: 'Computer Science and Engineering',
  ELECTRICAL: 'Electrical Engineering',
  ECE: 'Electronics and Communication Engineering',
  IT: 'Information Technology',
  MECHANICAL: 'Mechanical Engineering',
  MME: 'Metallurgical and Materials Engineering'
});

const BRANCHES = Object.freeze(Object.values(BRANCH_ENUM));

function normalizeBranchName(value) {
  const normalized = String(value || '')
    .replace(/&/g, 'and')
    .replace(/\s+/g, ' ')
    .trim()
    .toLowerCase();

  return BRANCHES.find((branch) => branch.toLowerCase() === normalized) || null;
}

const branchSchema = z
  .string()
  .transform((value) => normalizeBranchName(value))
  .refine(Boolean, 'Invalid branch');

module.exports = {
  BRANCH_ENUM,
  BRANCHES,
  normalizeBranchName,
  branchSchema
};
