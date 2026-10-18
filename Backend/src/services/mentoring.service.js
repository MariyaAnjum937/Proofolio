const validMeetingUrl = (value) => {
  if (typeof value !== 'string' || value.length > 2048) return false;
  try {
    const url = new URL(value);
    return ['https:', 'http:'].includes(url.protocol) && Boolean(url.hostname);
  } catch {
    return false;
  }
};

const toStudentSession = (session) => ({
  _id: session._id,
  title: session.title,
  scheduledAt: session.scheduledAt,
  endsAt: session.endsAt,
  type: session.type,
  meetingUrl: session.meetingUrl,
  location: session.location,
  agenda: session.agenda,
  sharedSummary: session.sharedSummary,
  status: session.status,
  completedAt: session.completedAt,
  cancelledAt: session.cancelledAt,
  followUpAt: session.followUpAt,
  faculty: session.faculty,
  goals: (session.goals || []).filter((goal) => goal.shareWithStudent),
  actionItems: (session.actionItems || []).filter((item) => item.shareWithStudent)
});

module.exports = { validMeetingUrl, toStudentSession };
