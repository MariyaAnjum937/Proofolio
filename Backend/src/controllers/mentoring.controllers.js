const mongoose = require('mongoose');
const crypto = require('crypto');
const User = require('../models/user.models');
const StudentProfile = require('../models/studentProfile.models');
const FacultyProfile = require('../models/facultyProfile.models');
const MentoringAssignment = require('../models/mentoringAssignment.models');
const MentoringSession = require('../models/mentoringSession.models');
const Notification = require('../models/notification.models');
const { validMeetingUrl, toStudentSession } = require('../services/mentoring.service');

const REPORT_FIELDS = [
  'topicsDiscussed',
  'academicProgress',
  'careerGuidance',
  'achievementsProgress',
  'challenges',
  'recommendations',
  'nextSteps',
  'shortTermGoals',
  'longTermGoals',
  'developmentActivities',
  'followUpPlan'
];
const SESSION_TYPES = ['in_person', 'online', 'other'];
const SESSION_STATUSES = ['scheduled', 'completed', 'cancelled', 'rescheduled'];
const ACTION_STATUSES = ['pending', 'in_progress', 'completed'];
const SESSION_TEXT_LIMITS = { title: 200, meetingUrl: 2048, location: 500, agenda: 5000, initialNotes: 10000 };
const safeFailure = (res, message, error) => {
  console.error(message, error);
  return res.status(500).json({ message });
};

const notify = (recipient, type, title, message, references = {}) => {
  const notification = { recipient, type, title, message, ...references };
  if (!notification.eventKey) return Notification.create(notification);
  return Notification.findOneAndUpdate(
    { recipient, eventKey: notification.eventKey },
    { $setOnInsert: notification },
    { upsert: true, returnDocument: 'after', setDefaultsOnInsert: true }
  ).catch((error) => {
    if (error.code !== 11000) throw error;
    return Notification.findOne({ recipient, eventKey: notification.eventKey });
  });
};

const eventKeyFor = (prefix, value) => (
  `${prefix}:${crypto.createHash('sha256').update(value).digest('hex')}`
);

const parseDate = (value) => {
  if (typeof value !== 'string' && !(value instanceof Date)) return null;
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? null : date;
};

const pagination = (query) => {
  const requestedPage = Number.parseInt(query.page, 10);
  const requestedLimit = Number.parseInt(query.limit, 10);
  const page = Number.isInteger(requestedPage) && requestedPage > 0 ? requestedPage : 1;
  const limit = Number.isInteger(requestedLimit) && requestedLimit > 0 ? Math.min(requestedLimit, 100) : 20;
  return { page, limit, skip: (page - 1) * limit };
};

const validObjectId = (value) => (
  typeof value === 'string' && mongoose.isObjectIdOrHexString(value)
);

const requireActiveAssignment = async (facultyId, studentId) => {
  return MentoringAssignment.findOne({ faculty: facultyId, student: studentId, status: 'active' });
};

const requireSessionAccess = async (sessionId, facultyId, requireActive = false) => {
  if (!validObjectId(sessionId)) {
    return { error: { status: 400, message: 'Invalid mentoring session ID.' } };
  }
  const session = await MentoringSession.findOne({ _id: sessionId, faculty: facultyId });
  if (!session) return { error: { status: 404, message: 'Mentoring session not found.' } };

  const assignmentQuery = {
    _id: session.assignment,
    faculty: facultyId,
    student: session.student
  };
  if (requireActive) assignmentQuery.status = 'active';
  const assignment = await MentoringAssignment.findOne(assignmentQuery);
  if (!assignment) return { error: { status: 403, message: "You are not assigned to manage this student's mentoring records." } };
  return { session, assignment };
};

const findFacultySessionConflicts = (facultyId, scheduledAt, endsAt, excludeSessionId) => {
  const assumedEnd = endsAt || new Date(scheduledAt.getTime() + 60 * 60 * 1000);
  return MentoringSession.find({
    faculty: facultyId,
    ...(excludeSessionId ? { _id: { $ne: excludeSessionId } } : {}),
    status: { $in: ['scheduled', 'rescheduled'] },
    scheduledAt: { $lt: assumedEnd },
    $or: [
      { endsAt: { $gt: scheduledAt } },
      { endsAt: null, scheduledAt: { $gt: new Date(scheduledAt.getTime() - 60 * 60 * 1000) } }
    ]
  }).select('_id title scheduledAt endsAt').lean();
};

const formatConflicts = (conflicts) => conflicts.map((conflict) => ({
  id: conflict._id,
  title: conflict.title,
  scheduledAt: conflict.scheduledAt,
  endsAt: conflict.endsAt
}));

const populatedSession = (query) => query
  .populate('student', 'username email fullName')
  .populate('faculty', 'username email fullName');

const searchStudents = async (req, res) => {
  try {
    const { page, limit, skip } = pagination(req.query);
    const facultyProfile = await FacultyProfile.findOne({ userId: req.user._id }).select('institution').lean();
    if (!facultyProfile?.institution) {
      return res.status(403).json({ message: 'Complete your faculty institution profile before searching for mentees.' });
    }
    const profileQuery = {};
    profileQuery.institution = facultyProfile.institution;
    for (const field of ['department', 'branch', 'section', 'currentAcademicYear']) {
      if (typeof req.query[field] === 'string' && req.query[field].trim()) {
        profileQuery[field] = req.query[field].trim();
      }
    }
    if (req.query.semester !== undefined && req.query.semester !== '') {
      const semester = Number(req.query.semester);
      if (!Number.isInteger(semester) || semester < 1 || semester > 12) {
        return res.status(400).json({ message: 'Semester must be a number between 1 and 12.' });
      }
      profileQuery.currentSemester = semester;
    }

    const regex = typeof req.query.search === 'string' && req.query.search.trim()
      ? new RegExp(req.query.search.trim().replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'i')
      : null;
    const profileIds = await StudentProfile.distinct('userId', profileQuery);
    const profileMatchIds = regex
      ? await StudentProfile.distinct('userId', {
        ...profileQuery,
        $or: [{ fullName: regex }, { rollNumber: regex }]
      })
      : [];
    const userQuery = {
      role: 'student',
      _id: { $in: profileIds },
      ...(regex ? { $or: [{ username: regex }, { email: regex }, { fullName: regex }, { _id: { $in: profileMatchIds } }] } : {})
    };
    const [total, students, profiles, relationships, departments, branches, sections, academicYears, semesters] = await Promise.all([
      User.countDocuments(userQuery),
      User.find(userQuery).select('_id username email fullName').sort({ fullName: 1, _id: 1 }).skip(skip).limit(limit).lean(),
      StudentProfile.find({ userId: { $in: profileIds } }).lean(),
      MentoringAssignment.find({ faculty: req.user._id, status: 'active' }).select('student assignedAt').lean(),
      StudentProfile.distinct('department', profileQuery),
      StudentProfile.distinct('branch', profileQuery),
      StudentProfile.distinct('section', profileQuery),
      StudentProfile.distinct('currentAcademicYear', profileQuery),
      StudentProfile.distinct('currentSemester', profileQuery)
    ]);
    const profileMap = new Map(profiles.map((profile) => [String(profile.userId), profile]));
    const relationshipMap = new Map(relationships.map((relationship) => [String(relationship.student), relationship]));
    return res.status(200).json({
      students: students.map((student) => ({
        ...student,
        profile: profileMap.get(String(student._id)) || null,
        relationship: relationshipMap.get(String(student._id)) || null
      })),
      pagination: { page, limit, total, totalPages: Math.ceil(total / limit) },
      filters: {
        departments: departments.filter(Boolean).sort(),
        branches: branches.filter(Boolean).sort(),
        sections: sections.filter(Boolean).sort(),
        academicYears: academicYears.filter(Boolean).sort(),
        semesters: semesters.filter(Number.isFinite).sort((a, b) => a - b)
      }
    });
  } catch (error) {
    return safeFailure(res, 'Failed to search eligible students.', error);
  }
};

const startMentoring = async (req, res) => {
  try {
    const { studentId } = req.params;
    if (!validObjectId(studentId)) return res.status(400).json({ message: 'Invalid student ID.' });
    const [student, facultyProfile, studentProfile] = await Promise.all([
      User.findOne({ _id: studentId, role: 'student' }).select('_id fullName username'),
      FacultyProfile.findOne({ userId: req.user._id }).select('institution'),
      StudentProfile.findOne({ userId: studentId }).select('institution')
    ]);
    if (!facultyProfile?.institution) {
      return res.status(403).json({ message: 'Complete your faculty institution profile before starting mentoring.' });
    }
    if (!student || !studentProfile) return res.status(404).json({ message: 'Eligible student not found.' });
    if (facultyProfile?.institution && studentProfile.institution !== facultyProfile.institution) {
      return res.status(404).json({ message: 'Eligible student not found.' });
    }
    let assignment = await requireActiveAssignment(req.user._id, studentId);
    if (assignment) return res.status(409).json({ message: 'You are already mentoring this student.' });
    assignment = await MentoringAssignment.create({
      student: studentId,
      faculty: req.user._id,
      status: 'active',
      assignedAt: new Date()
    });
    await notify(
      studentId,
      'mentoring_relationship',
      'A faculty member started mentoring you',
      `${req.user.fullName || req.user.username} is now one of your faculty mentors.`,
      { assignment: assignment._id, eventKey: `relationship:${assignment._id}:started` }
    );
    return res.status(201).json({ message: 'Mentoring relationship started.', assignment });
  } catch (error) {
    if (error.code === 11000) return res.status(409).json({ message: 'You are already mentoring this student.' });
    return safeFailure(res, 'Failed to start mentoring relationship.', error);
  }
};

const endMentoring = async (req, res) => {
  try {
    const { studentId } = req.params;
    if (!validObjectId(studentId)) return res.status(400).json({ message: 'Invalid student ID.' });
    const assignment = await MentoringAssignment.findOneAndUpdate(
      { student: studentId, faculty: req.user._id, status: 'active' },
      { $set: { status: 'ended', endedAt: new Date() } },
      { returnDocument: 'after' }
    );
    if (!assignment) return res.status(404).json({ message: 'Active mentoring relationship not found.' });
    await notify(
      assignment.student,
      'mentoring_relationship',
      'Mentoring relationship ended',
      `${req.user.fullName || req.user.username} has ended the mentoring relationship. Past session records remain available.`,
      { assignment: assignment._id, eventKey: `relationship:${assignment._id}:ended` }
    );
    return res.status(200).json({ message: 'Mentoring relationship ended. Session history has been preserved.', assignment });
  } catch (error) {
    return safeFailure(res, 'Failed to end mentoring relationship.', error);
  }
};

const getAssignedStudents = async (req, res) => {
  try {
    const { page, limit, skip } = pagination(req.query);
    const assignments = await MentoringAssignment.find({ faculty: req.user._id, status: 'active' })
      .select('student assignedAt')
      .lean();
    const studentIds = assignments.map((assignment) => assignment.student);
    const query = { _id: { $in: studentIds }, role: 'student' };

    if (typeof req.query.search === 'string' && req.query.search.trim()) {
      const search = req.query.search.trim().replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
      const matcher = new RegExp(search, 'i');
      const profileMatches = await StudentProfile.find({ $or: [{ fullName: matcher }, { rollNumber: matcher }] }).distinct('userId');
      query.$or = [{ username: matcher }, { email: matcher }, { fullName: matcher }, { _id: { $in: profileMatches } }];
    }

    const profiles = await StudentProfile.find({
      userId: { $in: studentIds },
      ...Object.fromEntries(['department', 'branch', 'section', 'currentAcademicYear'].filter((field) =>
        typeof req.query[field] === 'string' && req.query[field].trim()
      ).map((field) => [field, req.query[field].trim()]))
    }).select('userId');
    if (['department', 'branch', 'section', 'currentAcademicYear'].some((field) => req.query[field])) {
      query._id = { $in: profiles.map((profile) => profile.userId) };
    }
    if (req.query.semester !== undefined && req.query.semester !== '') {
      const semester = Number(req.query.semester);
      const semesterProfiles = Number.isInteger(semester) && semester > 0
        ? await StudentProfile.find({ userId: query._id, currentSemester: semester }).select('userId')
        : [];
      query._id = { $in: semesterProfiles.map((profile) => profile.userId) };
    }

    const [total, students] = await Promise.all([
      User.countDocuments(query),
      User.find(query).select('_id username email fullName createdAt').sort({ fullName: 1, _id: 1 }).skip(skip).limit(limit).lean()
    ]);
    const pageStudentIds = students.map((student) => student._id);
    const [studentProfiles, sessionSummaries, departments, branches, sections, academicYears, semesters] = await Promise.all([
      StudentProfile.find({ userId: { $in: pageStudentIds } }).lean(),
      MentoringSession.aggregate([
        { $match: { faculty: req.user._id, student: { $in: pageStudentIds } } },
        {
          $group: {
            _id: '$student',
            sessionCount: { $sum: 1 },
            completedCount: { $sum: { $cond: [{ $eq: ['$status', 'completed'] }, 1, 0] } },
            pendingActionItems: {
              $sum: {
                $size: {
                  $filter: {
                    input: { $ifNull: ['$actionItems', []] },
                    as: 'item',
                    cond: { $ne: ['$$item.status', 'completed'] }
                  }
                }
              }
            },
            lastSessionAt: {
              $max: { $cond: [{ $eq: ['$status', 'completed'] }, '$scheduledAt', null] }
            },
            nextSession: {
              $min: {
                $cond: [
                  { $and: [{ $in: ['$status', ['scheduled', 'rescheduled']] }, { $gte: ['$scheduledAt', new Date()] }] },
                  '$scheduledAt',
                  new Date('9999-12-31T23:59:59.999Z')
                ]
              }
            }
          }
        }
      ]),
      StudentProfile.distinct('department', { userId: { $in: studentIds } }),
      StudentProfile.distinct('branch', { userId: { $in: studentIds } }),
      StudentProfile.distinct('section', { userId: { $in: studentIds } }),
      StudentProfile.distinct('currentAcademicYear', { userId: { $in: studentIds } }),
      StudentProfile.distinct('currentSemester', { userId: { $in: studentIds } })
    ]);

    const assignmentDateMap = new Map(assignments.map((assignment) => [String(assignment.student), assignment.assignedAt]));
    const profileMap = new Map(studentProfiles.map((profile) => [String(profile.userId), profile]));
    const sessionMap = new Map(sessionSummaries.map((summary) => [String(summary._id), summary]));
    const assignedStudents = students.map((student) => {
      const mentoring = sessionMap.get(String(student._id));
      return {
        ...student,
        profile: profileMap.get(String(student._id)) || null,
        assignedAt: assignmentDateMap.get(String(student._id)),
        mentoring: mentoring
          ? { ...mentoring, nextSession: mentoring.nextSession?.getTime() < 253402300799999 ? mentoring.nextSession : null }
          : { completedCount: 0, lastSessionAt: null, nextSession: null }
      };
    });

    return res.status(200).json({
      students: assignedStudents,
      pagination: { page, limit, total, totalPages: Math.ceil(total / limit) },
      filters: {
        departments: departments.filter(Boolean).sort(),
        branches: branches.filter(Boolean).sort(),
        sections: sections.filter(Boolean).sort(),
        academicYears: academicYears.filter(Boolean).sort(),
        semesters: semesters.filter(Number.isFinite).sort((a, b) => a - b)
      }
    });
  } catch (error) {
    return safeFailure(res, 'Failed to load assigned students.', error);
  }
};

const getStudentMentoringProfile = async (req, res) => {
  try {
    const { studentId } = req.params;
    if (!validObjectId(studentId)) return res.status(400).json({ message: 'Invalid student ID.' });
    const assignment = await requireActiveAssignment(req.user._id, studentId);
    if (!assignment) return res.status(403).json({ message: 'This student is not currently assigned to you.' });

    const student = await User.findOne({ _id: studentId, role: 'student' })
      .select('_id username email fullName phone')
      .lean();
    if (!student) return res.status(404).json({ message: 'Student not found.' });
    const [profile, sessions] = await Promise.all([
      StudentProfile.findOne({ userId: studentId }).lean(),
      MentoringSession.find({ assignment: assignment._id, faculty: req.user._id, student: studentId }).sort({ scheduledAt: -1 }).lean()
    ]);
    const now = new Date();
    const actionItems = sessions.flatMap((session) => session.actionItems.map((item) => ({
      ...(item.toObject?.() || item),
      sessionId: session._id,
      sessionTitle: session.title,
      sessionDate: session.scheduledAt
    })));
    const upcomingSessions = sessions.filter((session) =>
      ['scheduled', 'rescheduled'].includes(session.status) && session.scheduledAt >= now
    );
    const followUps = sessions.filter((session) => session.followUpAt && session.status !== 'cancelled');
    const completedSessions = sessions.filter((session) => session.status === 'completed');
    const outstandingActionItems = actionItems.filter((item) => item.status !== 'completed');

    return res.status(200).json({
      student: { ...student, profile, assignedAt: assignment.assignedAt },
      summary: {
        totalSessions: sessions.length,
        completedSessions: completedSessions.length,
        upcomingSessions: upcomingSessions.length,
        upcomingSessionDetails: upcomingSessions,
        mostRecentSession: completedSessions[0] || null,
        outstandingActionItems,
        overdueFollowUps: followUps.filter((session) => session.followUpAt < now),
        upcomingFollowUps: followUps.filter((session) => session.followUpAt >= now),
        currentGoals: sessions.find((session) => session.report?.shortTermGoals || session.report?.longTermGoals)?.report || null
      }
    });
  } catch (error) {
    return safeFailure(res, 'Failed to load mentoring profile.', error);
  }
};

const getStudentSessions = async (req, res) => {
  try {
    const { studentId } = req.params;
    if (!validObjectId(studentId)) return res.status(400).json({ message: 'Invalid student ID.' });
    const assignment = await requireActiveAssignment(req.user._id, studentId);
    if (!assignment) return res.status(403).json({ message: 'This student is not currently assigned to you.' });
    const { page, limit, skip } = pagination(req.query);
    const query = { student: studentId, faculty: req.user._id, assignment: assignment._id };
    if (SESSION_STATUSES.includes(req.query.status)) query.status = req.query.status;
    const dateQuery = {};
    if (req.query.dateFrom) {
      const from = parseDate(req.query.dateFrom);
      if (!from) return res.status(400).json({ message: 'Invalid start date filter.' });
      dateQuery.$gte = from;
    }
    if (req.query.dateTo) {
      const to = parseDate(req.query.dateTo);
      if (!to) return res.status(400).json({ message: 'Invalid end date filter.' });
      to.setHours(23, 59, 59, 999);
      dateQuery.$lte = to;
    }
    if (dateQuery.$gte && dateQuery.$lte && dateQuery.$gte > dateQuery.$lte) {
      return res.status(400).json({ message: 'Start date must be before end date.' });
    }
    if (Object.keys(dateQuery).length) query.scheduledAt = dateQuery;
    const [total, sessions] = await Promise.all([
      MentoringSession.countDocuments(query),
      populatedSession(MentoringSession.find(query).sort({ scheduledAt: -1 }).skip(skip).limit(limit)).lean()
    ]);
    return res.status(200).json({
      sessions,
      pagination: { page, limit, total, totalPages: Math.ceil(total / limit) }
    });
  } catch (error) {
    return safeFailure(res, 'Failed to load mentoring history.', error);
  }
};

const getPreviousAssignmentSessions = async (req, res) => {
  try {
    const { page, limit, skip } = pagination(req.query);
    const endedAssignments = await MentoringAssignment.find({ faculty: req.user._id, status: 'ended' })
      .select('_id student assignedAt endedAt')
      .lean();
    const assignmentIds = endedAssignments.map((assignment) => assignment._id);
    const query = { faculty: req.user._id, assignment: { $in: assignmentIds } };
    const [total, sessions] = await Promise.all([
      MentoringSession.countDocuments(query),
      populatedSession(MentoringSession.find(query).sort({ scheduledAt: -1 }).skip(skip).limit(limit)).lean()
    ]);
    const assignmentMap = new Map(endedAssignments.map((assignment) => [String(assignment._id), assignment]));
    return res.status(200).json({
      sessions: sessions.map((session) => ({
        ...session,
        endedAssignmentAt: assignmentMap.get(String(session.assignment))?.endedAt || null
      })),
      pagination: { page, limit, total, totalPages: Math.ceil(total / limit) }
    });
  } catch (error) {
    return safeFailure(res, 'Failed to load past mentoring sessions.', error);
  }
};

const createSession = async (req, res) => {
  try {
    const { studentId, title, scheduledAt, endsAt, type, meetingUrl, location, agenda, initialNotes } = req.body || {};
    if (!validObjectId(studentId)) return res.status(400).json({ message: 'A valid student ID is required.' });
    if (typeof title !== 'string' || !title.trim()) return res.status(400).json({ message: 'Session title is required.' });
    if (title.trim().length > SESSION_TEXT_LIMITS.title) return res.status(400).json({ message: 'Session title must be 200 characters or fewer.' });
    for (const [field, maxLength] of Object.entries(SESSION_TEXT_LIMITS)) {
      const value = req.body?.[field];
      if (field !== 'title' && value !== undefined && value !== null && (typeof value !== 'string' || value.trim().length > maxLength)) {
        return res.status(400).json({ message: `${field} must be text with at most ${maxLength} characters.` });
      }
    }
    const startDate = parseDate(scheduledAt);
    if (!startDate) return res.status(400).json({ message: 'Provide a valid session date and time.' });
    const endDate = parseDate(endsAt);
    if (!endDate) return res.status(400).json({ message: 'A valid session end date and time is required.' });
    if (endDate <= startDate) return res.status(400).json({ message: 'Session end time must be after its start time.' });
    if (!SESSION_TYPES.includes(type)) return res.status(400).json({ message: 'A valid session type is required.' });
    if (typeof agenda !== 'string' || !agenda.trim()) {
      return res.status(400).json({ message: 'An agenda or session purpose is required.' });
    }
    const sessionType = type;
    if (sessionType === 'online' && !validMeetingUrl(meetingUrl)) {
      return res.status(400).json({ message: 'A valid HTTP or HTTPS meeting URL is required for online sessions.' });
    }
    if (sessionType === 'in_person' && (typeof location !== 'string' || !location.trim())) {
      return res.status(400).json({ message: 'A location is required for in-person sessions.' });
    }

    const assignment = await requireActiveAssignment(req.user._id, studentId);
    if (!assignment) return res.status(403).json({ message: 'This student is not currently assigned to you.' });
    const studentExists = await User.exists({ _id: studentId, role: 'student' });
    if (!studentExists) return res.status(404).json({ message: 'Student not found.' });

    const session = await MentoringSession.create({
      student: studentId,
      faculty: req.user._id,
      assignment: assignment._id,
      title: title.trim(),
      scheduledAt: startDate,
      endsAt: endDate,
      type: sessionType,
      meetingUrl: sessionType === 'online' ? meetingUrl.trim() : '',
      location: String(location || '').trim(),
      agenda: String(agenda || '').trim(),
      initialNotes: String(initialNotes || '').trim(),
      status: 'scheduled'
    });
    const conflicts = await findFacultySessionConflicts(req.user._id, startDate, endDate, session._id);
    const where = session.type === 'online' ? session.meetingUrl : session.location;
    await notify(
      studentId,
      'mentoring_session',
      'Mentoring session scheduled',
      `${req.user.fullName || req.user.username} scheduled "${session.title}" for ${session.scheduledAt.toISOString()} (${session.type.replace('_', ' ')}${where ? `: ${where}` : ''}).`,
      { session: session._id, eventKey: `session:${session._id}:scheduled` }
    );
    return res.status(201).json({
      message: 'Mentoring session scheduled.',
      session,
      conflicts: formatConflicts(conflicts)
    });
  } catch (error) {
    return safeFailure(res, 'Failed to schedule mentoring session.', error);
  }
};

const getSession = async (req, res) => {
  try {
    const access = await requireSessionAccess(req.params.sessionId, req.user._id);
    if (access.error) return res.status(access.error.status).json({ message: access.error.message });
    const session = await populatedSession(MentoringSession.findById(access.session._id)).lean();
    return res.status(200).json({ session: { ...session, canManage: access.assignment.status === 'active' } });
  } catch (error) {
    return safeFailure(res, 'Failed to fetch mentoring session.', error);
  }
};

const updateSession = async (req, res) => {
  try {
    const access = await requireSessionAccess(req.params.sessionId, req.user._id, true);
    if (access.error) return res.status(access.error.status).json({ message: access.error.message });
    const session = access.session;
    const previousScheduleDetails = {
      type: session.type,
      meetingUrl: session.meetingUrl,
      location: session.location
    };
    if (!['scheduled', 'rescheduled'].includes(session.status)) {
      return res.status(409).json({ message: 'Only scheduled sessions can be rescheduled.' });
    }
    const updates = req.body || {};
    if (updates.studentId !== undefined || updates.student !== undefined || updates.faculty !== undefined || updates.status === 'completed') {
      return res.status(400).json({ message: 'Student, faculty, and completion status cannot be changed through this endpoint.' });
    }

    const nextScheduledAt = updates.scheduledAt !== undefined ? parseDate(updates.scheduledAt) : session.scheduledAt;
    if (!nextScheduledAt) return res.status(400).json({ message: 'Provide a valid session date and time.' });
    const nextEndsAt = updates.endsAt !== undefined
      ? parseDate(updates.endsAt)
      : session.endsAt;
    if (!nextEndsAt) return res.status(400).json({ message: 'A valid session end date and time is required.' });
    if (nextEndsAt && nextEndsAt <= nextScheduledAt) return res.status(400).json({ message: 'Session end time must be after its start time.' });
    if (updates.type !== undefined && !SESSION_TYPES.includes(updates.type)) return res.status(400).json({ message: 'Invalid session type.' });
    const nextType = updates.type === undefined ? session.type : updates.type;
    const nextMeetingUrl = updates.meetingUrl === undefined ? session.meetingUrl : updates.meetingUrl;
    const nextLocation = updates.location === undefined ? session.location : updates.location;
    if (nextType === 'online' && !validMeetingUrl(nextMeetingUrl)) {
      return res.status(400).json({ message: 'A valid HTTP or HTTPS meeting URL is required for online sessions.' });
    }
    if (nextType === 'in_person' && (typeof nextLocation !== 'string' || !nextLocation.trim())) {
      return res.status(400).json({ message: 'A location is required for in-person sessions.' });
    }

    const scheduleChanged =
      nextScheduledAt.getTime() !== session.scheduledAt.getTime() ||
      (nextEndsAt?.getTime() || null) !== (session.endsAt?.getTime() || null);
    if (scheduleChanged) {
      session.scheduleHistory.push({
        scheduledAt: session.scheduledAt,
        endsAt: session.endsAt,
        status: session.status,
        changedAt: new Date()
      });
      session.status = 'rescheduled';
      session.scheduledAt = nextScheduledAt;
      session.endsAt = nextEndsAt;
    }
    for (const field of ['title', 'meetingUrl', 'location', 'agenda', 'initialNotes']) {
      if (updates[field] !== undefined) {
        if (
          typeof updates[field] !== 'string' ||
          (field === 'title' && !updates[field].trim()) ||
          updates[field].trim().length > SESSION_TEXT_LIMITS[field]
        ) {
          return res.status(400).json({ message: `Provide a valid ${field}.` });
        }
        session[field] = updates[field].trim();
      }
    }
    if (updates.type !== undefined) session.type = updates.type;
    session.type = nextType;
    session.meetingUrl = nextType === 'online' ? nextMeetingUrl.trim() : '';
    if (updates.location !== undefined) session.location = updates.location.trim();
    await session.save();
    let conflicts = [];
    if (scheduleChanged) {
      conflicts = await findFacultySessionConflicts(req.user._id, session.scheduledAt, session.endsAt, session._id);
    }
    const locationChanged =
      (updates.type !== undefined && updates.type !== previousScheduleDetails.type) ||
      (updates.meetingUrl !== undefined && updates.meetingUrl !== previousScheduleDetails.meetingUrl) ||
      (updates.location !== undefined && updates.location !== previousScheduleDetails.location);
    if (scheduleChanged || locationChanged) {
      const where = session.type === 'online' ? session.meetingUrl : session.location;
      await notify(
        session.student,
        'mentoring_session',
        scheduleChanged ? 'Mentoring session rescheduled' : 'Mentoring session details updated',
        `${req.user.fullName || req.user.username} ${scheduleChanged ? 'rescheduled' : 'updated'} "${session.title}" for ${session.scheduledAt.toISOString()} (${session.type.replace('_', ' ')}${where ? `: ${where}` : ''}).`,
        {
          session: session._id,
          eventKey: eventKeyFor(
            `session:${session._id}:update`,
            `${session.scheduledAt.toISOString()}|${session.endsAt?.toISOString() || ''}|${session.type}|${session.meetingUrl}|${session.location}`
          )
        }
      );
    }
    return res.status(200).json({ message: 'Mentoring session updated.', session, conflicts: formatConflicts(conflicts) });
  } catch (error) {
    return safeFailure(res, 'Failed to update mentoring session.', error);
  }
};

const updateSessionReport = async (req, res) => {
  try {
    const access = await requireSessionAccess(req.params.sessionId, req.user._id, true);
    if (access.error) return res.status(access.error.status).json({ message: access.error.message });
    const session = access.session;
    if (session.status === 'cancelled') return res.status(409).json({ message: 'Cancelled sessions cannot receive reports.' });
    const body = req.body || {};
    for (const field of REPORT_FIELDS) {
      if (body[field] !== undefined) {
        if (typeof body[field] !== 'string' || body[field].trim().length > 10000) {
          return res.status(400).json({ message: `${field} must be text with at most 10000 characters.` });
        }
        session.report[field] = body[field].trim();
      }
    }
    if (body.sharedSummary !== undefined) {
      if (typeof body.sharedSummary !== 'string' || body.sharedSummary.trim().length > 10000) {
        return res.status(400).json({ message: 'Shared summary must be text with at most 10000 characters.' });
      }
      session.sharedSummary = body.sharedSummary.trim();
    }
    if (body.followUpAt !== undefined) {
      if (body.followUpAt === null || body.followUpAt === '') session.followUpAt = null;
      else {
        const followUpAt = parseDate(body.followUpAt);
        if (!followUpAt) return res.status(400).json({ message: 'Provide a valid follow-up date.' });
        session.followUpAt = followUpAt;
      }
    }
    if (body.actionItems !== undefined) {
      if (!Array.isArray(body.actionItems)) return res.status(400).json({ message: 'Action items must be provided as a list.' });
      const createdActionItems = [];
      for (const item of body.actionItems) {
        if (!item || typeof item.description !== 'string' || !item.description.trim() || item.description.trim().length > 1000) {
          return res.status(400).json({ message: 'Each action item needs a description of 1000 characters or fewer.' });
        }
        if (!['student', 'faculty'].includes(item.responsible)) return res.status(400).json({ message: 'Action item responsibility must be student or faculty.' });
        const dueAt = item.dueAt ? parseDate(item.dueAt) : null;
        if (item.dueAt && !dueAt) return res.status(400).json({ message: 'Action item due date is invalid.' });
        if (item.shareWithStudent !== undefined && typeof item.shareWithStudent !== 'boolean') {
          return res.status(400).json({ message: 'Action item sharing selection must be a boolean.' });
        }
        const actionItem = session.actionItems.create({
          description: item.description.trim(),
          responsible: item.responsible,
          dueAt,
          status: 'pending',
          shareWithStudent: item.shareWithStudent === true
        });
        session.actionItems.push(actionItem);
        createdActionItems.push(actionItem);
      }
      body.createdActionItems = createdActionItems.filter((item) => item.shareWithStudent);
    }

    if (body.confirmComplete === true) {
      if (session.status === 'completed') return res.status(409).json({ message: 'This session is already completed.' });
      if (session.scheduledAt > new Date()) {
        return res.status(409).json({ message: 'A session cannot be completed before its scheduled start time.' });
      }
      session.status = 'completed';
      session.completedAt = new Date();
    } else if (body.confirmComplete !== undefined && body.confirmComplete !== false) {
      return res.status(400).json({ message: 'Confirm completion explicitly to complete this session.' });
    }

    await session.save();
    if (body.createdActionItems?.length) {
      await Promise.all(body.createdActionItems.map((item) => notify(
        session.student,
        'mentoring_action',
        'New mentoring action item',
        `${req.user.fullName || req.user.username} shared an action item from "${session.title}".`,
        { session: session._id, eventKey: `session:${session._id}:action:${item._id}:shared` }
      )));
    }
    if (body.confirmComplete === true) {
      const where = session.type === 'online' ? session.meetingUrl : session.location;
      await notify(
        session.student,
        'mentoring_session',
        'Mentoring session completed',
        `${req.user.fullName || req.user.username} marked "${session.title}" as completed. Session: ${session.scheduledAt.toISOString()} (${session.type.replace('_', ' ')}${where ? `: ${where}` : ''}).`,
        { session: session._id, eventKey: `session:${session._id}:completed` }
      );
    }
    return res.status(200).json({ message: body.confirmComplete ? 'Session report saved and session completed.' : 'Session report saved.', session });
  } catch (error) {
    return safeFailure(res, 'Failed to save mentoring report.', error);
  }
};

const cancelSession = async (req, res) => {
  try {
    const access = await requireSessionAccess(req.params.sessionId, req.user._id, true);
    if (access.error) return res.status(access.error.status).json({ message: access.error.message });
    const session = access.session;
    if (!['scheduled', 'rescheduled'].includes(session.status)) {
      return res.status(409).json({ message: 'Only upcoming sessions can be cancelled.' });
    }
    session.scheduleHistory.push({
      scheduledAt: session.scheduledAt,
      endsAt: session.endsAt,
      status: session.status,
      changedAt: new Date()
    });
    session.status = 'cancelled';
    session.cancelledAt = new Date();
    await session.save();
    await notify(
      session.student,
      'mentoring_session',
      'Mentoring session cancelled',
      `${req.user.fullName || req.user.username} cancelled "${session.title}" scheduled for ${session.scheduledAt.toISOString()} (${session.type.replace('_', ' ')}${session.type === 'online' ? `: ${session.meetingUrl}` : session.location ? `: ${session.location}` : ''}).`,
      { session: session._id, eventKey: `session:${session._id}:cancelled` }
    );
    return res.status(200).json({ message: 'Mentoring session cancelled.', session });
  } catch (error) {
    return safeFailure(res, 'Failed to cancel mentoring session.', error);
  }
};

const updateActionItem = async (req, res) => {
  try {
    const access = await requireSessionAccess(req.params.sessionId, req.user._id, true);
    if (access.error) return res.status(access.error.status).json({ message: access.error.message });
    const session = access.session;
    if (!validObjectId(req.params.actionItemId)) return res.status(400).json({ message: 'Invalid action item ID.' });
    const action = session.actionItems.id(req.params.actionItemId);
    if (!action) return res.status(404).json({ message: 'Action item not found.' });
    const body = req.body || {};
    const wasShared = action.shareWithStudent;
    if (body.status !== undefined && !ACTION_STATUSES.includes(body.status)) return res.status(400).json({ message: 'Invalid action item status.' });
    if (body.description !== undefined) {
      if (typeof body.description !== 'string' || !body.description.trim() || body.description.trim().length > 1000) {
        return res.status(400).json({ message: 'Action item description is required and must be 1000 characters or fewer.' });
      }
      action.description = body.description.trim();
    }
    if (body.responsible !== undefined) {
      if (!['student', 'faculty'].includes(body.responsible)) return res.status(400).json({ message: 'Responsible party must be student or faculty.' });
      action.responsible = body.responsible;
    }
    if (body.dueAt !== undefined) {
      if (body.dueAt === null || body.dueAt === '') action.dueAt = null;
      else {
        const dueAt = parseDate(body.dueAt);
        if (!dueAt) return res.status(400).json({ message: 'Action item due date is invalid.' });
        action.dueAt = dueAt;
      }
    }
    if (body.status !== undefined) {
      action.status = body.status;
      action.completedAt = body.status === 'completed' ? action.completedAt || new Date() : null;
    }
    if (body.shareWithStudent !== undefined) {
      if (typeof body.shareWithStudent !== 'boolean') return res.status(400).json({ message: 'shareWithStudent must be a boolean.' });
      action.shareWithStudent = body.shareWithStudent;
    }
    await session.save();
    if (!wasShared && action.shareWithStudent) {
      await notify(
        session.student,
        'mentoring_action',
        'Mentoring action item shared',
        `${req.user.fullName || req.user.username} shared an action item from "${session.title}".`,
        { session: session._id, eventKey: `session:${session._id}:action:${action._id}:shared` }
      );
    }
    return res.status(200).json({ message: 'Action item updated.', session });
  } catch (error) {
    return safeFailure(res, 'Failed to update action item.', error);
  }
};

const createGoal = async (req, res) => {
  try {
    const access = await requireSessionAccess(req.params.sessionId, req.user._id, true);
    if (access.error) return res.status(access.error.status).json({ message: access.error.message });
    const { title, description = '', targetDate = null, timeframe = 'short_term', shareWithStudent = false } = req.body || {};
    if (typeof title !== 'string' || !title.trim() || title.trim().length > 200) {
      return res.status(400).json({ message: 'Goal title is required and must be 200 characters or fewer.' });
    }
    if (typeof description !== 'string' || description.length > 5000 || typeof shareWithStudent !== 'boolean') {
      return res.status(400).json({ message: 'Goal description or sharing selection is invalid.' });
    }
    if (!['short_term', 'long_term'].includes(timeframe)) {
      return res.status(400).json({ message: 'Goal timeframe must be short-term or long-term.' });
    }
    const parsedTarget = targetDate ? parseDate(targetDate) : null;
    if (targetDate && !parsedTarget) return res.status(400).json({ message: 'Goal target date is invalid.' });
    const goal = access.session.goals.create({
      title: title.trim(),
      timeframe,
      description: description.trim(),
      targetDate: parsedTarget,
      shareWithStudent
    });
    access.session.goals.push(goal);
    await access.session.save();
    if (shareWithStudent) {
      await notify(
        access.session.student,
        'mentoring_goal',
        'New mentoring goal shared',
        `${req.user.fullName || req.user.username} shared a goal from "${access.session.title}".`,
        { session: access.session._id, eventKey: `session:${access.session._id}:goal:${goal._id}:shared` }
      );
    }
    return res.status(201).json({ message: 'Mentoring goal created.', goal });
  } catch (error) {
    return safeFailure(res, 'Failed to create mentoring goal.', error);
  }
};

const updateGoal = async (req, res) => {
  try {
    const access = await requireSessionAccess(req.params.sessionId, req.user._id, true);
    if (access.error) return res.status(access.error.status).json({ message: access.error.message });
    if (!validObjectId(req.params.goalId)) return res.status(400).json({ message: 'Invalid goal ID.' });
    const goal = access.session.goals.id(req.params.goalId);
    if (!goal) return res.status(404).json({ message: 'Goal not found.' });
    const wasShared = goal.shareWithStudent;
    const body = req.body || {};
    for (const field of ['title', 'description', 'progressNotes', 'timeframe']) {
      if (body[field] !== undefined) {
        const max = field === 'title' ? 200 : 5000;
        const invalidTimeframe = field === 'timeframe' && !['short_term', 'long_term'].includes(body[field]);
        if (typeof body[field] !== 'string' || invalidTimeframe || (field === 'title' && !body[field].trim()) || (field !== 'timeframe' && body[field].length > max)) {
          return res.status(400).json({ message: `Provide a valid goal ${field}.` });
        }
        goal[field] = field === 'timeframe' ? body[field] : body[field].trim();
      }
    }
    if (body.targetDate !== undefined) {
      if (!body.targetDate) goal.targetDate = null;
      else {
        const targetDate = parseDate(body.targetDate);
        if (!targetDate) return res.status(400).json({ message: 'Goal target date is invalid.' });
        goal.targetDate = targetDate;
      }
    }
    if (body.status !== undefined) {
      if (!ACTION_STATUSES.includes(body.status)) return res.status(400).json({ message: 'Invalid goal status.' });
      goal.status = body.status;
      goal.completedAt = body.status === 'completed' ? goal.completedAt || new Date() : null;
    }
    if (body.shareWithStudent !== undefined) {
      if (typeof body.shareWithStudent !== 'boolean') return res.status(400).json({ message: 'shareWithStudent must be a boolean.' });
      goal.shareWithStudent = body.shareWithStudent;
    }
    await access.session.save();
    if (!wasShared && goal.shareWithStudent) {
      await notify(
        access.session.student,
        'mentoring_goal',
        'Mentoring goal shared',
        `${req.user.fullName || req.user.username} shared a goal from "${access.session.title}".`,
        { session: access.session._id, eventKey: `session:${access.session._id}:goal:${goal._id}:shared` }
      );
    }
    return res.status(200).json({ message: 'Mentoring goal updated.', goal });
  } catch (error) {
    return safeFailure(res, 'Failed to update mentoring goal.', error);
  }
};

const getStudentMentors = async (req, res) => {
  try {
    const assignments = await MentoringAssignment.find({ student: req.user._id, status: 'active' })
      .select('faculty assignedAt')
      .populate('faculty', 'username fullName email')
      .sort({ assignedAt: -1 })
      .lean();
    const facultyIds = assignments.map((assignment) => assignment.faculty?._id).filter(Boolean);
    const profiles = await FacultyProfile.find({ userId: { $in: facultyIds } })
      .select('userId fullName department designation specialization')
      .lean();
    const profileMap = new Map(profiles.map((profile) => [String(profile.userId), profile]));
    return res.status(200).json({
      mentors: assignments.map((assignment) => ({
        ...assignment,
        faculty: assignment.faculty
          ? { ...assignment.faculty, profile: profileMap.get(String(assignment.faculty._id)) || null }
          : null
      }))
    });
  } catch (error) {
    return safeFailure(res, 'Failed to load mentors.', error);
  }
};

const getOwnStudentSessions = async (req, res) => {
  try {
    const sessions = await MentoringSession.find({ student: req.user._id })
      .populate('faculty', 'username fullName')
      .sort({ scheduledAt: -1 })
      .lean();
    return res.status(200).json({ sessions: sessions.map(toStudentSession) });
  } catch (error) {
    return safeFailure(res, 'Failed to load mentoring sessions.', error);
  }
};

const updateStudentActionItem = async (req, res) => {
  try {
    if (!validObjectId(req.params.sessionId) || !validObjectId(req.params.actionItemId)) {
      return res.status(400).json({ message: 'Invalid session or action item ID.' });
    }
    const session = await MentoringSession.findOne({ _id: req.params.sessionId, student: req.user._id });
    if (!session) return res.status(404).json({ message: 'Mentoring session not found.' });
    const action = session.actionItems.id(req.params.actionItemId);
    if (!action || !action.shareWithStudent || action.responsible !== 'student') {
      return res.status(404).json({ message: 'Student action item not found.' });
    }
    const { status } = req.body || {};
    if (!['in_progress', 'completed'].includes(status)) {
      return res.status(400).json({ message: 'Student action items may be marked in progress or completed.' });
    }
    if (action.status === 'completed' && status !== 'completed') {
      return res.status(409).json({ message: 'Completed action items cannot be reopened by a student.' });
    }
    action.status = status;
    action.completedAt = status === 'completed' ? action.completedAt || new Date() : null;
    await session.save();
    await notify(
      session.faculty,
      'mentoring_action',
      'Student updated a mentoring action item',
      `${req.user.fullName || req.user.username} marked "${action.description}" ${status.replace('_', ' ')} in "${session.title}".`,
      { session: session._id, eventKey: `session:${session._id}:action:${action._id}:student-${status}` }
    );
    return res.status(200).json({ message: 'Action item status updated.', session: toStudentSession(session) });
  } catch (error) {
    return safeFailure(res, 'Failed to update action item.', error);
  }
};

const listNotifications = async (req, res) => {
  try {
    const { page, limit, skip } = pagination(req.query);
    const [notifications, unreadCount, total] = await Promise.all([
      Notification.find({ recipient: req.user._id }).sort({ createdAt: -1 }).skip(skip).limit(limit).lean(),
      Notification.countDocuments({ recipient: req.user._id, readAt: null }),
      Notification.countDocuments({ recipient: req.user._id })
    ]);
    return res.status(200).json({
      notifications,
      unreadCount,
      pagination: { page, limit, total, totalPages: Math.ceil(total / limit) }
    });
  } catch (error) {
    return safeFailure(res, 'Failed to load notifications.', error);
  }
};

const markNotificationRead = async (req, res) => {
  try {
    if (!validObjectId(req.params.notificationId)) return res.status(400).json({ message: 'Invalid notification ID.' });
    const notification = await Notification.findOneAndUpdate(
      { _id: req.params.notificationId, recipient: req.user._id, readAt: null },
      { $set: { readAt: new Date() } },
      { returnDocument: 'after' }
    );
    if (!notification) {
      const exists = await Notification.exists({ _id: req.params.notificationId, recipient: req.user._id });
      return exists
        ? res.status(200).json({ message: 'Notification already read.' })
        : res.status(404).json({ message: 'Notification not found.' });
    }
    return res.status(200).json({ message: 'Notification marked as read.', notification });
  } catch (error) {
    return safeFailure(res, 'Failed to mark notification as read.', error);
  }
};

module.exports = {
  searchStudents,
  startMentoring,
  endMentoring,
  getAssignedStudents,
  getStudentMentoringProfile,
  getOwnStudentSessions,
  getPreviousAssignmentSessions,
  createSession,
  getSession,
  updateSession,
  updateSessionReport,
  cancelSession,
  updateActionItem,
  createGoal,
  updateGoal,
  getStudentMentors,
  getStudentSessions,
  updateStudentActionItem,
  listNotifications,
  markNotificationRead
};
