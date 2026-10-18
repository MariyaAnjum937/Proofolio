const test = require('node:test');
const assert = require('node:assert/strict');
const { validMeetingUrl, toStudentSession } = require('../src/services/mentoring.service');
const MentoringAssignment = require('../src/models/mentoringAssignment.models');

test('accepts HTTP and HTTPS meeting links', () => {
  assert.equal(validMeetingUrl('https://meet.google.com/abc-defg-hij'), true);
  assert.equal(validMeetingUrl('https://zoom.us/j/123456789'), true);
  assert.equal(validMeetingUrl('https://teams.microsoft.com/l/meetup'), true);
  assert.equal(validMeetingUrl('http://example.edu/meeting'), true);
});

test('rejects malformed and non-web meeting links', () => {
  assert.equal(validMeetingUrl('javascript:alert(1)'), false);
  assert.equal(validMeetingUrl('file:///etc/passwd'), false);
  assert.equal(validMeetingUrl('https://'), false);
  assert.equal(validMeetingUrl('not a URL'), false);
  assert.equal(validMeetingUrl(null), false);
  assert.equal(validMeetingUrl(`https://${'a'.repeat(2040)}.com`), false);
});

test('student session projection contains only student-visible mentoring data', () => {
  const projected = toStudentSession({
    _id: 'session-id',
    title: 'Career planning',
    scheduledAt: new Date('2026-10-19T09:00:00.000Z'),
    type: 'online',
    meetingUrl: 'https://meet.google.com/abc-defg-hij',
    sharedSummary: 'Discussed internship plans.',
    initialNotes: 'Confidential faculty preparation.',
    report: { challenges: 'Private report field.' },
    scheduleHistory: [{ scheduledAt: new Date('2026-10-18T09:00:00.000Z') }],
    goals: [
      { title: 'Apply for internship', shareWithStudent: true },
      { title: 'Private faculty evaluation', shareWithStudent: false }
    ],
    actionItems: [
      { description: 'Update CV', responsible: 'student', shareWithStudent: true },
      { description: 'Discuss internally', responsible: 'faculty', shareWithStudent: false }
    ]
  });

  assert.equal(projected.sharedSummary, 'Discussed internship plans.');
  assert.deepEqual(projected.goals.map((goal) => goal.title), ['Apply for internship']);
  assert.deepEqual(projected.actionItems.map((item) => item.description), ['Update CV']);
  assert.equal(Object.hasOwn(projected, 'initialNotes'), false);
  assert.equal(Object.hasOwn(projected, 'report'), false);
  assert.equal(Object.hasOwn(projected, 'scheduleHistory'), false);
});

test('active mentoring relationships are unique per faculty-student pair', () => {
  const indexes = MentoringAssignment.schema.indexes();
  assert.ok(indexes.some(([keys, options]) => (
    keys.faculty === 1 &&
    keys.student === 1 &&
    keys.status === 1 &&
    options.unique === true &&
    options.partialFilterExpression?.status === 'active'
  )));
  assert.equal(indexes.some(([keys, options]) => (
    keys.student === 1 &&
    keys.status === 1 &&
    keys.faculty === undefined &&
    options.unique === true
  )), false);
});
