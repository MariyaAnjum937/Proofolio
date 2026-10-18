const mongoose = require('mongoose');

const actionItemSchema = new mongoose.Schema(
  {
    description: {
      type: String,
      required: true,
      trim: true,
      maxlength: 1000
    },
    responsible: {
      type: String,
      enum: ['student', 'faculty'],
      required: true
    },
    dueAt: {
      type: Date,
      default: null
    },
    status: {
      type: String,
      enum: ['pending', 'in_progress', 'completed'],
      default: 'pending'
    },
    shareWithStudent: {
      type: Boolean,
      default: false
    },
    completedAt: {
      type: Date,
      default: null
    }
  },
  { timestamps: true }
);

const mentoringGoalSchema = new mongoose.Schema(
  {
    title: { type: String, required: true, trim: true, maxlength: 200 },
    timeframe: { type: String, enum: ['short_term', 'long_term'], default: 'short_term' },
    description: { type: String, default: '', trim: true, maxlength: 5000 },
    targetDate: { type: Date, default: null },
    status: { type: String, enum: ['pending', 'in_progress', 'completed'], default: 'pending' },
    progressNotes: { type: String, default: '', trim: true, maxlength: 5000 },
    completedAt: { type: Date, default: null },
    shareWithStudent: { type: Boolean, default: false }
  },
  { timestamps: true }
);

const scheduleHistorySchema = new mongoose.Schema(
  {
    scheduledAt: { type: Date, required: true },
    endsAt: { type: Date, default: null },
    status: { type: String, required: true },
    changedAt: { type: Date, default: Date.now }
  },
  { _id: false }
);

const mentoringSessionSchema = new mongoose.Schema(
  {
    student: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Users',
      required: true,
      index: true
    },
    faculty: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Users',
      required: true,
      index: true
    },
    assignment: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'MentoringAssignment',
      required: true
    },
    title: {
      type: String,
      required: true,
      trim: true,
      maxlength: 200
    },
    scheduledAt: {
      type: Date,
      required: true
    },
    endsAt: {
      type: Date,
      default: null
    },
    type: {
      type: String,
      enum: ['in_person', 'online', 'other'],
      default: 'other'
    },
    meetingUrl: {
      type: String,
      default: '',
      trim: true,
      maxlength: 2048
    },
    location: {
      type: String,
      default: '',
      trim: true,
      maxlength: 500
    },
    sharedSummary: {
      type: String,
      default: '',
      trim: true,
      maxlength: 10000
    },
    agenda: {
      type: String,
      default: '',
      trim: true,
      maxlength: 5000
    },
    initialNotes: {
      type: String,
      default: '',
      trim: true,
      maxlength: 10000
    },
    status: {
      type: String,
      enum: ['scheduled', 'completed', 'cancelled', 'rescheduled'],
      default: 'scheduled',
      required: true
    },
    scheduleHistory: {
      type: [scheduleHistorySchema],
      default: []
    },
    report: {
      topicsDiscussed: { type: String, default: '', trim: true, maxlength: 10000 },
      academicProgress: { type: String, default: '', trim: true, maxlength: 10000 },
      careerGuidance: { type: String, default: '', trim: true, maxlength: 10000 },
      achievementsProgress: { type: String, default: '', trim: true, maxlength: 10000 },
      challenges: { type: String, default: '', trim: true, maxlength: 10000 },
      recommendations: { type: String, default: '', trim: true, maxlength: 10000 },
      nextSteps: { type: String, default: '', trim: true, maxlength: 10000 },
      shortTermGoals: { type: String, default: '', trim: true, maxlength: 10000 },
      longTermGoals: { type: String, default: '', trim: true, maxlength: 10000 },
      developmentActivities: { type: String, default: '', trim: true, maxlength: 10000 },
      followUpPlan: { type: String, default: '', trim: true, maxlength: 10000 }
    },
    goals: {
      type: [mentoringGoalSchema],
      default: []
    },
    actionItems: {
      type: [actionItemSchema],
      default: []
    },
    followUpAt: {
      type: Date,
      default: null
    },
    completedAt: {
      type: Date,
      default: null
    },
    cancelledAt: {
      type: Date,
      default: null
    }
  },
  { timestamps: true }
);

mentoringSessionSchema.index({ student: 1, scheduledAt: -1 });
mentoringSessionSchema.index({ faculty: 1, scheduledAt: -1, status: 1 });
mentoringSessionSchema.index({ faculty: 1, followUpAt: 1, status: 1 });

module.exports = mongoose.model('MentoringSession', mentoringSessionSchema);
