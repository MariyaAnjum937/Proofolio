const mongoose = require('mongoose');

const studentProfileSchema = new mongoose.Schema(
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
    degree: {
      type: String,
      required: true,
      trim: true
    },
    department: {
      type: String,
      required: true,
      trim: true
    },
    branch: {
      type: String,
      required: true,
      trim: true
    },
    rollNumber: {
      type: String,
      required: true,
      trim: true,
      uppercase: true
    },
    admissionYear: {
      type: Number,
      required: true,
      min: 2000,
      max: 2100
    },
    graduationYear: {
      type: Number,
      required: true,
      min: 2000,
      max: 2100
    },
    currentAcademicYear: {
      type: String,
      required: true,
      trim: true
    },
    currentSemester: {
      type: Number,
      required: true,
      min: 1,
      max: 12
    },
    section: {
      type: String,
      default: '',
      trim: true
    },
    cgpa: {
      type: Number,
      min: 0,
      max: 10,
      default: null
    }
  },
  { timestamps: true }
);

studentProfileSchema.index({ institution: 1, rollNumber: 1 }, { unique: true });

const StudentProfile = mongoose.model('StudentProfile', studentProfileSchema);

module.exports = StudentProfile;
