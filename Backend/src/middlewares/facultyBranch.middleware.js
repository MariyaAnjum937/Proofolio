const FacultyProfile = require('../models/facultyProfile.models');
const { canAccessBranch } = require('../services/branch.services');

const requireFacultyBranch = async (req, res, next) => {
  try {
    const profile = await FacultyProfile.findOne({ userId: req.user._id }).select('branch').lean();
    const branch = typeof profile?.branch === 'string' ? profile.branch.trim() : '';

    if (!canAccessBranch(branch, branch)) {
      return res.status(403).json({
        message: 'Your faculty branch assignment is missing or invalid. Contact an administrator.'
      });
    }

    req.facultyBranch = branch;
    return next();
  } catch (error) {
    console.error('Failed to verify faculty branch assignment:', error);
    return res.status(500).json({ message: 'Failed to verify faculty branch assignment.' });
  }
};

module.exports = requireFacultyBranch;
