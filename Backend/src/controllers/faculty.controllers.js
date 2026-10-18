const mongoose = require('mongoose');
const User = require('../models/user.models');
const StudentProfile = require('../models/studentProfile.models');
const FacultyProfile = require('../models/facultyProfile.models');
const Achievement = require('../models/achievement.models');
const { getImageKitClient } = require('../services/imagekit.services');
const { withSignedCertificateUrl } = require('../services/certificate.services');

const categories = ['Hackathon', 'Internship', 'Certification', 'Workshop', 'Competition', 'Extracurricular', 'Project', 'Other'];

const pagination = (query) => {
  const requestedPage = Number.parseInt(query.page, 10);
  const requestedLimit = Number.parseInt(query.limit, 10);
  const page = Number.isInteger(requestedPage) && requestedPage > 0 ? requestedPage : 1;
  const limit = Number.isInteger(requestedLimit) && requestedLimit > 0 ? Math.min(requestedLimit, 100) : 20;
  return { page, limit, skip: (page - 1) * limit };
};

const safeRegex = (value) => new RegExp(value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'i');

const makeStudentPipeline = (query = {}) => {
  const pipeline = [
    { $match: { role: 'student' } },
    {
      $lookup: {
        from: StudentProfile.collection.name,
        localField: '_id',
        foreignField: 'userId',
        as: 'profile'
      }
    },
    { $unwind: { path: '$profile', preserveNullAndEmptyArrays: true } },
    {
      $lookup: {
        from: Achievement.collection.name,
        let: { studentId: '$_id' },
        pipeline: [
          {
            $match: {
              $expr: { $eq: ['$user', '$$studentId'] },
              $or: [{ ownerRole: 'student' }, { ownerRole: { $exists: false } }]
            }
          },
          {
            $group: {
              _id: null,
              total: { $sum: 1 },
              verified: { $sum: { $cond: [{ $eq: ['$verificationStatus', 'verified'] }, 1, 0] } }
            }
          }
        ],
        as: 'achievementStats'
      }
    },
    {
      $addFields: {
        fullName: { $ifNull: ['$profile.fullName', '$fullName'] },
        certificateCount: { $ifNull: [{ $arrayElemAt: ['$achievementStats.total', 0] }, 0] },
        verifiedCertificateCount: { $ifNull: [{ $arrayElemAt: ['$achievementStats.verified', 0] }, 0] }
      }
    }
  ];

  const filters = {};
  for (const field of ['department', 'branch', 'section', 'currentAcademicYear']) {
    if (typeof query[field] === 'string' && query[field].trim()) {
      filters[`profile.${field}`] = query[field].trim();
    }
  }
  if (query.semester !== undefined && query.semester !== '') {
    const semester = Number(query.semester);
    if (!Number.isInteger(semester) || semester < 1 || semester > 12) {
      filters['profile.currentSemester'] = -1;
    } else {
      filters['profile.currentSemester'] = semester;
    }
  }
  if (typeof query.search === 'string' && query.search.trim()) {
    const match = safeRegex(query.search.trim());
    filters.$or = [
      { username: match },
      { email: match },
      { fullName: match },
      { 'profile.rollNumber': match }
    ];
  }
  if (Object.keys(filters).length) pipeline.push({ $match: filters });
  return pipeline;
};

const listStudents = async (req, res) => {
  try {
    const { page, limit, skip } = pagination(req.query);
    const pipeline = makeStudentPipeline(req.query);
    const [totalResult, students, departments, branches, sections, academicYears, semesters] = await Promise.all([
      User.aggregate([...pipeline, { $count: 'total' }]),
      User.aggregate([
        ...pipeline,
        { $sort: { fullName: 1, _id: 1 } },
        { $skip: skip },
        { $limit: limit },
        {
          $project: {
            _id: 1,
            username: 1,
            email: 1,
            fullName: 1,
            createdAt: 1,
            profile: 1,
            certificateCount: 1,
            verifiedCertificateCount: 1
          }
        }
      ]),
      StudentProfile.distinct('department'),
      StudentProfile.distinct('branch'),
      StudentProfile.distinct('section'),
      StudentProfile.distinct('currentAcademicYear'),
      StudentProfile.distinct('currentSemester')
    ]);
    const total = totalResult[0]?.total || 0;
    return res.status(200).json({
      students,
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
    return res.status(500).json({ message: 'Failed to fetch students.', error: error.message });
  }
};

const getStudentDetails = async (req, res) => {
  try {
    const { studentId } = req.params;
    if (!mongoose.isValidObjectId(studentId)) {
      return res.status(400).json({ message: 'Invalid student ID.' });
    }
    const student = await User.findOne({ _id: studentId, role: 'student' })
      .select('_id username email fullName phone createdAt')
      .lean();
    if (!student) return res.status(404).json({ message: 'Student not found.' });

    const [profile, summary] = await Promise.all([
      StudentProfile.findOne({ userId: student._id }).lean(),
      Achievement.aggregate([
        {
          $match: {
            user: student._id,
            $or: [{ ownerRole: 'student' }, { ownerRole: { $exists: false } }]
          }
        },
        {
          $group: {
            _id: null,
            total: { $sum: 1 },
            verified: { $sum: { $cond: [{ $eq: ['$verificationStatus', 'verified'] }, 1, 0] } },
            pending: { $sum: { $cond: [{ $eq: ['$verificationStatus', 'pending'] }, 1, 0] } },
            rejected: { $sum: { $cond: [{ $eq: ['$verificationStatus', 'rejected'] }, 1, 0] } }
          }
        }
      ])
    ]);

    return res.status(200).json({
      student: {
        ...student,
        profile,
        achievementSummary: summary[0] || { total: 0, verified: 0, pending: 0, rejected: 0 }
      }
    });
  } catch (error) {
    return res.status(500).json({ message: 'Failed to fetch student profile.', error: error.message });
  }
};

const getStudentCertificates = async (req, res) => {
  try {
    const { page, limit, skip } = pagination(req.query);
    const requestedStudentId = req.params.studentId || req.query.studentId;
    const pipeline = [
      { $match: { $or: [{ ownerRole: 'student' }, { ownerRole: { $exists: false } }] } },
      {
        $lookup: {
          from: User.collection.name,
          localField: 'user',
          foreignField: '_id',
          as: 'student'
        }
      },
      { $unwind: '$student' },
      { $match: { 'student.role': 'student' } },
      {
        $lookup: {
          from: StudentProfile.collection.name,
          localField: 'user',
          foreignField: 'userId',
          as: 'profile'
        }
      },
      { $unwind: { path: '$profile', preserveNullAndEmptyArrays: true } }
    ];

    if (requestedStudentId) {
      if (!mongoose.isValidObjectId(requestedStudentId)) {
        return res.status(400).json({ message: 'Invalid student ID.' });
      }
      const studentExists = await User.exists({ _id: requestedStudentId, role: 'student' });
      if (!studentExists) return res.status(404).json({ message: 'Student not found.' });
      pipeline.push({ $match: { user: new mongoose.Types.ObjectId(requestedStudentId) } });
    }
    if (typeof req.query.search === 'string' && req.query.search.trim()) {
      const match = safeRegex(req.query.search.trim());
      pipeline.push({
        $match: {
          $or: [
            { title: match },
            { type: match },
            { organization: match },
            { 'student.fullName': match },
            { 'student.username': match },
            { 'student.email': match },
            { 'profile.fullName': match },
            { 'profile.rollNumber': match }
          ]
        }
      });
    }
    const filters = {};
    if (typeof req.query.department === 'string' && req.query.department.trim()) filters['profile.department'] = req.query.department.trim();
    if (typeof req.query.type === 'string' && categories.includes(req.query.type)) filters.type = req.query.type;
    if (['pending', 'verified', 'rejected'].includes(req.query.status)) filters.verificationStatus = req.query.status;
    if (typeof req.query.academicYear === 'string' && req.query.academicYear.trim()) filters['profile.currentAcademicYear'] = req.query.academicYear.trim();
    if (Object.keys(filters).length) pipeline.push({ $match: filters });

    const [totalResult, records] = await Promise.all([
      Achievement.aggregate([...pipeline, { $count: 'total' }]),
      Achievement.aggregate([
        ...pipeline,
        { $sort: { createdAt: -1, _id: -1 } },
        { $skip: skip },
        { $limit: limit },
        {
          $project: {
            _id: 1,
            title: 1,
            type: 1,
            organization: 1,
            date: 1,
            createdAt: 1,
            verificationStatus: 1,
            rejectionRemark: 1,
            verifiedBy: 1,
            verifiedAt: 1,
            certificateUrl: 1,
            certificateFilePath: 1,
            student: { _id: '$student._id', username: '$student.username', fullName: '$student.fullName', email: '$student.email' },
            profile: { fullName: '$profile.fullName', rollNumber: '$profile.rollNumber', department: '$profile.department', branch: '$profile.branch' }
          }
        }
      ])
    ]);
    const total = totalResult[0]?.total || 0;
    const certificates = records.map((record) => withSignedCertificateUrl(record));
    return res.status(200).json({
      certificates,
      pagination: { page, limit, total, totalPages: Math.ceil(total / limit) }
    });
  } catch (error) {
    return res.status(500).json({ message: 'Failed to fetch student certificates.', error: error.message });
  }
};

const getStudentCertificate = async (req, res) => {
  try {
    const { certificateId } = req.params;
    if (!mongoose.isValidObjectId(certificateId)) return res.status(400).json({ message: 'Invalid certificate ID.' });
    const certificate = await Achievement.findOne({
      _id: certificateId,
      $or: [{ ownerRole: 'student' }, { ownerRole: { $exists: false } }]
    })
      .populate('user', 'username email fullName role')
      .lean();
    if (!certificate || certificate.user?.role !== 'student') return res.status(404).json({ message: 'Student certificate not found.' });
    const profile = await StudentProfile.findOne({ userId: certificate.user._id }).lean();
    return res.status(200).json({
      certificate: withSignedCertificateUrl({ ...certificate, profile })
    });
  } catch (error) {
    return res.status(500).json({ message: 'Failed to fetch certificate.', error: error.message });
  }
};

const getMyProfile = async (req, res) => {
  try {
    const profile = await FacultyProfile.findOne({ userId: req.user._id }).lean();
    return res.status(200).json({
      user: {
        _id: req.user._id,
        username: req.user.username,
        email: req.user.email,
        fullName: req.user.fullName,
        phone: req.user.phone,
        status: req.user.status
      },
      profile
    });
  } catch (error) {
    return res.status(500).json({ message: 'Failed to fetch faculty profile.', error: error.message });
  }
};

const getMyCertificates = async (req, res) => {
  try {
    const certificates = await Achievement.find({ user: req.user._id, ownerRole: 'faculty' })
      .sort({ createdAt: -1 })
      .lean();
    return res.status(200).json({ certificates: certificates.map((record) => withSignedCertificateUrl(record)) });
  } catch (error) {
    return res.status(500).json({ message: 'Failed to fetch your certificates.', error: error.message });
  }
};

const createMyCertificate = async (req, res) => {
  try {
    const { title, type, organization, date, expiresAt, description } = req.body || {};
    if (!req.file || !title?.trim() || !categories.includes(type) || !organization?.trim() || !date) {
      return res.status(400).json({ message: 'Title, category, organization, issue date, and certificate file are required.' });
    }
    const issueDate = new Date(date);
    const expiryDate = expiresAt ? new Date(expiresAt) : null;
    if (Number.isNaN(issueDate.getTime()) || (expiresAt && Number.isNaN(expiryDate.getTime()))) {
      return res.status(400).json({ message: 'Provide valid issue and expiry dates.' });
    }
    if (expiryDate && expiryDate < issueDate) {
      return res.status(400).json({ message: 'Expiry date must be on or after the issue date.' });
    }

    const imagekit = getImageKitClient();
    const upload = await imagekit.files.upload({
      file: req.file.buffer.toString('base64'),
      fileName: req.file.originalname,
      folder: '/proofolio/certificates/faculty',
      isPrivateFile: true
    });
    if (!upload.url) return res.status(502).json({ message: 'Certificate file upload failed.' });

    const certificate = await Achievement.create({
      title: title.trim(),
      type,
      organization: organization.trim(),
      date: issueDate,
      expiresAt: expiryDate,
      description: String(description || '').trim(),
      certificateUrl: upload.url,
      certificateFileId: upload.fileId || '',
      certificateFilePath: upload.filePath || '',
      user: req.user._id,
      ownerRole: 'faculty',
      verificationStatus: 'pending'
    });
    return res.status(201).json({
      message: 'Professional certificate uploaded. It is not verified.',
      certificate: withSignedCertificateUrl(certificate)
    });
  } catch (error) {
    return res.status(500).json({ message: 'Failed to upload professional certificate.', error: error.message });
  }
};

const updateMyCertificate = async (req, res) => {
  try {
    const { certificateId } = req.params;
    if (!mongoose.isValidObjectId(certificateId)) return res.status(400).json({ message: 'Invalid certificate ID.' });

    const fields = ['title', 'type', 'organization', 'date', 'expiresAt', 'description'];
    const updates = {};
    for (const field of fields) {
      if (req.body?.[field] === undefined) continue;
      if (field === 'title' || field === 'organization' || field === 'description') {
        updates[field] = String(req.body[field]).trim();
      } else if (field === 'type') {
        if (!categories.includes(req.body.type)) return res.status(400).json({ message: 'Invalid certificate category.' });
        updates.type = req.body.type;
      } else if (field === 'date' || field === 'expiresAt') {
        if (field === 'expiresAt' && (req.body.expiresAt === '' || req.body.expiresAt === null)) {
          updates.expiresAt = null;
        } else {
          const date = new Date(req.body[field]);
          if (Number.isNaN(date.getTime())) return res.status(400).json({ message: `Invalid ${field} value.` });
          updates[field] = date;
        }
      }
    }
    const protectedFields = ['user', 'ownerRole', 'verificationStatus', 'verifiedBy', 'verifiedAt', 'certificateUrl', 'certificateFileId', 'certificateFilePath'];
    if (protectedFields.some((field) => req.body?.[field] !== undefined)) {
      return res.status(403).json({ message: 'Ownership, file, and verification fields cannot be modified.' });
    }
    if (Object.keys(updates).length === 0) return res.status(400).json({ message: 'No editable certificate details were provided.' });
    if (updates.title === '' || updates.organization === '') return res.status(400).json({ message: 'Title and organization cannot be empty.' });

    const certificate = await Achievement.findOne({ _id: certificateId, user: req.user._id, ownerRole: 'faculty' });
    if (!certificate) return res.status(404).json({ message: 'Your certificate was not found.' });
    const nextDate = updates.date || certificate.date;
    const nextExpiry = Object.prototype.hasOwnProperty.call(updates, 'expiresAt') ? updates.expiresAt : certificate.expiresAt;
    if (nextExpiry && nextExpiry < nextDate) {
      return res.status(400).json({ message: 'Expiry date must be on or after the issue date.' });
    }
    Object.assign(certificate, updates);
    await certificate.save();
    return res.status(200).json({
      message: 'Certificate details updated.',
      certificate: withSignedCertificateUrl(certificate)
    });
  } catch (error) {
    return res.status(500).json({ message: 'Failed to update certificate.', error: error.message });
  }
};

module.exports = {
  listStudents,
  getStudentDetails,
  getStudentCertificates,
  getStudentCertificate,
  getMyProfile,
  getMyCertificates,
  createMyCertificate,
  updateMyCertificate
};
