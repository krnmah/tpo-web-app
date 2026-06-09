export const BRANCH_ENUM = Object.freeze({
  CHEMICAL: "Chemical Engineering",
  CIVIL: "Civil Engineering",
  CSE: "Computer Science and Engineering",
  ELECTRICAL: "Electrical Engineering",
  ECE: "Electronics and Communication Engineering",
  IT: "Information Technology",
  MECHANICAL: "Mechanical Engineering",
  MME: "Metallurgical and Materials Engineering"
});

export const BRANCHES = Object.freeze(Object.values(BRANCH_ENUM));

export function normalizeBranchName(value) {
  const normalized = String(value || "")
    .replace(/&/g, "and")
    .replace(/\s+/g, " ")
    .trim()
    .toLowerCase();

  return BRANCHES.find((branch) => branch.toLowerCase() === normalized) || "";
}
