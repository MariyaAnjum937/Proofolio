const mongoose = require('mongoose');

const mentoringAssignmentSchema = new mongoose.Schema(
  {
    student: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Users',
      required: true
    },
    faculty: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Users',
      required: true
    },
    status: {
      type: String,
      enum: ['active', 'ended'],
      default: 'active',
      required: true
    },
    assignedAt: {
      type: Date,
      default: Date.now,
      required: true
    },
    endedAt: {
      type: Date,
      default: null
    }
  },
  { timestamps: true }
);

mentoringAssignmentSchema.index(
  { faculty: 1, student: 1, status: 1 },
  { unique: true, partialFilterExpression: { status: 'active' } }
);
mentoringAssignmentSchema.index({ faculty: 1, status: 1, assignedAt: -1 });

module.exports = mongoose.model('MentoringAssignment', mentoringAssignmentSchema);
