const mongoose = require('mongoose');

const facultyProfileSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Users',
      required: true,
      unique: true,
      index: true
    },
    fullName: {
      type: String,
      required: true,
      trim: true
    },
    phone: {
      type: String,
      default: '',
      trim: true
    },
    institution: {
      type: String,
      required: true,
      trim: true
    },
    employeeId: {
      type: String,
      required: true,
      trim: true,
      uppercase: true
    },
    department: {
      type: String,
      required: true,
      trim: true
    },
    branch: {
      type: String,
      default: '',
      trim: true
    },
    designation: {
      type: String,
      required: true,
      trim: true
    },
    specialization: {
      type: String,
      default: '',
      trim: true
    },
    experienceYears: {
      type: Number,
      default: 0,
      min: 0
    }
  },
  { timestamps: true }
);

facultyProfileSchema.index({ institution: 1, employeeId: 1 }, { unique: true });

const FacultyProfile = mongoose.model('FacultyProfile', facultyProfileSchema);

module.exports = FacultyProfile;
