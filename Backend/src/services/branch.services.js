const BRANCHES = Object.freeze([
  'CSE',
  'CSM',
  'CSD',
  'CSC',
  'CSE IoT',
  'Civil',
  'Mechanical',
  'ECE'
]);

const isValidBranch = (branch) => typeof branch === 'string' && BRANCHES.includes(branch.trim());
const canAccessBranch = (assignedBranch, studentBranch) => (
  isValidBranch(assignedBranch) &&
  typeof studentBranch === 'string' &&
  assignedBranch.trim() === studentBranch
);

module.exports = { BRANCHES, isValidBranch, canAccessBranch };
