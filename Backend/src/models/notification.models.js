const mongoose = require('mongoose');

const notificationSchema = new mongoose.Schema(
  {
    recipient: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Users',
      required: true,
      index: true
    },
    type: {
      type: String,
      enum: ['mentoring_relationship', 'mentoring_session', 'mentoring_goal', 'mentoring_action'],
      required: true
    },
    title: { type: String, required: true, trim: true, maxlength: 200 },
    message: { type: String, required: true, trim: true, maxlength: 3000 },
    eventKey: { type: String, trim: true, maxlength: 300 },
    session: { type: mongoose.Schema.Types.ObjectId, ref: 'MentoringSession', default: null },
    assignment: { type: mongoose.Schema.Types.ObjectId, ref: 'MentoringAssignment', default: null },
    readAt: { type: Date, default: null }
  },
  { timestamps: true }
);

notificationSchema.index({ recipient: 1, createdAt: -1 });
notificationSchema.index(
  { recipient: 1, eventKey: 1 },
  { unique: true, partialFilterExpression: { eventKey: { $exists: true } } }
);

module.exports = mongoose.model('Notification', notificationSchema);
