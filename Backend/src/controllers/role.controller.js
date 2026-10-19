const mongoose = require('mongoose');
const User = require('../models/user.models');
const StudentProfile = require('../models/studentProfile.models');
const FacultyProfile = require('../models/facultyProfile.models');
const Achievement = require('../models/achievement.models');
const { withSignedCertificateUrl } = require('../services/certificate.services');
const { BRANCHES, isValidBranch } = require('../services/branch.services');
const CERTIFICATE_CATEGORIES = ['Hackathon', 'Internship', 'Certification', 'Workshop', 'Competition', 'Extracurricular', 'Project', 'Other'];

const studentRole = (req, res) => {
    res.status(201).json({ message: 'welcome student' });
};

const facultyRole = (req, res) => {
    res.status(201).json({ message: 'welcome faculty' });
};

const adminRole = (req, res) => {
    res.status(201).json({ message: 'welcome admin' });
};

const escapeRegex = (value) => value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

const getPagination = (query) => {
    const requestedPage = Number.parseInt(query.page, 10);
    const requestedLimit = Number.parseInt(query.limit, 10);
    const page = Number.isInteger(requestedPage) && requestedPage > 0 ? requestedPage : 1;
    const limit = Number.isInteger(requestedLimit) && requestedLimit > 0
        ? Math.min(requestedLimit, 100)
        : 20;

    return { page, limit, skip: (page - 1) * limit };
};

const getStudentDirectoryPipeline = (query) => {
    const certificateMatch = {
        $expr: { $eq: ['$user', '$$studentId'] },
        $or: [{ ownerRole: 'student' }, { ownerRole: { $exists: false } }]
    };
    if (['pending', 'verified', 'rejected'].includes(query.certificateStatus)) {
        certificateMatch.verificationStatus = query.certificateStatus;
    }
    if (CERTIFICATE_CATEGORIES.includes(query.certificateType)) {
        certificateMatch.type = query.certificateType;
    }
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
                    { $match: certificateMatch },
                    { $count: 'count' }
                ],
                as: 'achievementCount'
            }
        },
        {
            $addFields: {
                certificateCount: {
                    $ifNull: [{ $arrayElemAt: ['$achievementCount.count', 0] }, 0]
                },
                fullName: { $ifNull: ['$profile.fullName', '$fullName'] }
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
        if (Number.isInteger(semester) && semester > 0) {
            filters['profile.currentSemester'] = semester;
        }
    }

    if (typeof query.search === 'string' && query.search.trim()) {
        const search = new RegExp(escapeRegex(query.search.trim()), 'i');
        filters.$or = [
            { username: search },
            { email: search },
            { fullName: search },
            { 'profile.rollNumber': search }
        ];
    }

    if (query.certificateStatus || query.certificateType) {
        filters.certificateCount = { $gt: 0 };
    }

    if (Object.keys(filters).length) {
        pipeline.push({ $match: filters });
    }

    return pipeline;
};

const getAdminOverview = async (req, res) => {
    try {
        const [
            totalStudents,
            approvedFaculty,
            pendingFacultyApprovals,
            recentStudents,
            achievementStats
        ] = await Promise.all([
            User.countDocuments({ role: 'student' }),
            User.countDocuments({ role: 'faculty', status: { $nin: ['pending', 'rejected'] } }),
            User.countDocuments({ role: 'faculty', status: 'pending' }),
            User.find({ role: 'student' })
                .select('username fullName email createdAt')
                .sort({ createdAt: -1 })
                .limit(5)
                .lean(),
            Achievement.aggregate([
                {
                    $lookup: {
                        from: User.collection.name,
                        localField: 'user',
                        foreignField: '_id',
                        as: 'owner'
                    }
                },
                { $unwind: '$owner' },
                {
                    $group: {
                        _id: null,
                        totalCertificates: { $sum: 1 },
                        facultyCertificates: {
                            $sum: { $cond: [{ $eq: ['$owner.role', 'faculty'] }, 1, 0] }
                        },
                        approvedCertificates: {
                            $sum: {
                                $cond: [
                                    { $and: [{ $eq: ['$owner.role', 'student'] }, { $eq: ['$verificationStatus', 'verified'] }] },
                                    1,
                                    0
                                ]
                            }
                        },
                        pendingCertificateReviews: {
                            $sum: {
                                $cond: [
                                    { $and: [{ $eq: ['$owner.role', 'student'] }, { $eq: ['$verificationStatus', 'pending'] }] },
                                    1,
                                    0
                                ]
                            }
                        },
                        rejectedCertificates: {
                            $sum: {
                                $cond: [
                                    { $and: [{ $eq: ['$owner.role', 'student'] }, { $eq: ['$verificationStatus', 'rejected'] }] },
                                    1,
                                    0
                                ]
                            }
                        }
                    }
                }
            ])
        ]);

        const certificateStats = achievementStats[0] || {
            totalCertificates: 0,
            facultyCertificates: 0,
            approvedCertificates: 0,
            pendingCertificateReviews: 0,
            rejectedCertificates: 0
        };

        return res.status(200).json({
            message: 'Admin overview fetched successfully.',
            stats: {
                totalStudents,
                approvedFaculty,
                totalCertificates: certificateStats.totalCertificates,
                facultyCertificates: certificateStats.facultyCertificates,
                approvedCertificates: certificateStats.approvedCertificates,
                pendingFacultyApprovals,
                pendingCertificateReviews: certificateStats.pendingCertificateReviews,
                rejectedCertificates: certificateStats.rejectedCertificates
            },
            recentStudents
        });
    } catch (error) {
        return res.status(500).json({
            message: 'Failed to fetch admin overview.',
            error: error.message
        });
    }
};

const getAdminStudents = async (req, res) => {
    try {
        if (req.query.certificateStatus && !['pending', 'verified', 'rejected'].includes(req.query.certificateStatus)) {
            return res.status(400).json({ message: 'Invalid certificate status.' });
        }
        if (req.query.certificateType && !CERTIFICATE_CATEGORIES.includes(req.query.certificateType)) {
            return res.status(400).json({ message: 'Invalid certificate category.' });
        }
        const { page, limit, skip } = getPagination(req.query);
        const sortFields = {
            name: 'fullName',
            rollNumber: 'profile.rollNumber',
            department: 'profile.department',
            createdAt: 'createdAt'
        };
        const sortField = sortFields[req.query.sortBy] || 'fullName';
        const sortOrder = req.query.sortOrder === 'desc' ? -1 : 1;
        const pipeline = getStudentDirectoryPipeline(req.query);

        const [countResult, students, departments, branches, sections, academicYears, semesters] = await Promise.all([
            User.aggregate([...pipeline, { $count: 'total' }]),
            User.aggregate([
                ...pipeline,
                { $sort: { [sortField]: sortOrder, _id: 1 } },
                { $skip: skip },
                { $limit: limit },
                {
                    $project: {
                        _id: 1,
                        username: 1,
                        email: 1,
                        fullName: 1,
                        phone: 1,
                        createdAt: 1,
                        profile: 1,
                        certificateCount: 1
                    }
                }
            ]),
            StudentProfile.distinct('department'),
            StudentProfile.distinct('branch'),
            StudentProfile.distinct('section'),
            StudentProfile.distinct('currentAcademicYear'),
            StudentProfile.distinct('currentSemester')
        ]);

        const total = countResult[0]?.total || 0;

        return res.status(200).json({
            message: 'Students fetched successfully.',
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

const getAdminFaculty = async (req, res) => {
    try {
        const { page, limit, skip } = getPagination(req.query);
        const pipeline = [
            { $match: { role: 'faculty' } },
            {
                $lookup: {
                    from: FacultyProfile.collection.name,
                    localField: '_id',
                    foreignField: 'userId',
                    as: 'profile'
                }
            },
            { $unwind: { path: '$profile', preserveNullAndEmptyArrays: true } }
        ];

        if (typeof req.query.branch === 'string' && req.query.branch.trim()) {
            if (!isValidBranch(req.query.branch)) {
                return res.status(400).json({ message: 'Select a valid faculty branch.' });
            }
            pipeline.push({ $match: { 'profile.branch': req.query.branch.trim() } });
        }

        if (typeof req.query.search === 'string' && req.query.search.trim()) {
            const search = new RegExp(escapeRegex(req.query.search.trim()), 'i');
            pipeline.push({
                $match: {
                    $or: [
                        { username: search },
                        { email: search },
                        { fullName: search },
                        { 'profile.fullName': search },
                        { 'profile.employeeId': search },
                        { 'profile.department': search },
                        { 'profile.designation': search }
                    ]
                }
            });
        }

        const [countResult, faculty] = await Promise.all([
            User.aggregate([...pipeline, { $count: 'total' }]),
            User.aggregate([
                ...pipeline,
                { $sort: { 'profile.fullName': 1, _id: 1 } },
                { $skip: skip },
                { $limit: limit },
                {
                    $project: {
                        _id: 1,
                        username: 1,
                        email: 1,
                        fullName: 1,
                        status: 1,
                        profile: {
                            fullName: '$profile.fullName',
                            institution: '$profile.institution',
                            employeeId: '$profile.employeeId',
                            department: '$profile.department',
                            branch: '$profile.branch',
                            designation: '$profile.designation',
                            specialization: '$profile.specialization',
                            experienceYears: '$profile.experienceYears'
                        }
                    }
                }
            ])
        ]);
        const total = countResult[0]?.total || 0;
        return res.status(200).json({
            message: 'Faculty directory fetched successfully.',
            faculty,
            branches: BRANCHES,
            pagination: { page, limit, total, totalPages: Math.ceil(total / limit) }
        });
    } catch (error) {
        return res.status(500).json({ message: 'Failed to fetch faculty directory.', error: error.message });
    }
};

const updateFacultyBranch = async (req, res) => {
    try {
        const { id } = req.params;
        const { branch } = req.body || {};
        if (!mongoose.isValidObjectId(id)) {
            return res.status(400).json({ message: 'Invalid faculty ID.' });
        }
        if (branch !== '' && branch !== null && !isValidBranch(branch)) {
            return res.status(400).json({ message: 'Select a valid faculty branch or clear the assignment.' });
        }

        const faculty = await User.findOne({ _id: id, role: 'faculty' }).select('_id');
        if (!faculty) return res.status(404).json({ message: 'Faculty member not found.' });

        const profile = await FacultyProfile.findOneAndUpdate(
            { userId: faculty._id },
            { $set: { branch: branch || '' } },
            { returnDocument: 'after', runValidators: true }
        ).select('fullName branch department designation');
        if (!profile) return res.status(404).json({ message: 'Faculty profile not found.' });

        return res.status(200).json({
            message: profile.branch
                ? `Faculty branch assigned to ${profile.branch}.`
                : 'Faculty branch assignment cleared.',
            profile
        });
    } catch (error) {
        return res.status(500).json({ message: 'Failed to update faculty branch.', error: error.message });
    }
};

const getAdminStudentDetails = async (req, res) => {
    try {
        const { id } = req.params;
        if (!mongoose.isValidObjectId(id)) {
            return res.status(400).json({ message: 'Invalid student ID.' });
        }

        const student = await User.findOne({ _id: id, role: 'student' })
            .select('_id username email fullName phone role status createdAt')
            .lean();

        if (!student) {
            return res.status(404).json({ message: 'Student not found.' });
        }

        const [profile, counts] = await Promise.all([
            StudentProfile.findOne({ userId: student._id }).lean(),
            Achievement.aggregate([
                { $match: { user: student._id } },
                {
                    $group: {
                        _id: null,
                        total: { $sum: 1 },
                        approved: { $sum: { $cond: [{ $eq: ['$verificationStatus', 'verified'] }, 1, 0] } },
                        pending: { $sum: { $cond: [{ $eq: ['$verificationStatus', 'pending'] }, 1, 0] } },
                        rejected: { $sum: { $cond: [{ $eq: ['$verificationStatus', 'rejected'] }, 1, 0] } }
                    }
                }
            ])
        ]);

        return res.status(200).json({
            message: 'Student details fetched successfully.',
            student: {
                ...student,
                profile,
                achievementSummary: counts[0] || { total: 0, approved: 0, pending: 0, rejected: 0 }
            }
        });
    } catch (error) {
        return res.status(500).json({ message: 'Failed to fetch student details.', error: error.message });
    }
};

const getAdminCertificates = async (req, res) => {
    try {
        const { page, limit, skip } = getPagination(req.query);
        const pipeline = [
            {
                $lookup: {
                    from: User.collection.name,
                    localField: 'user',
                    foreignField: '_id',
                    as: 'owner'
                }
            },
            { $unwind: '$owner' },
            { $match: { 'owner.role': { $in: ['student', 'faculty'] } } },
            {
                $addFields: {
                    certificateOwnerRole: { $ifNull: ['$ownerRole', '$owner.role'] }
                }
            },
            {
                $lookup: {
                    from: StudentProfile.collection.name,
                    localField: 'user',
                    foreignField: 'userId',
                    as: 'studentProfile'
                }
            },
            {
                $lookup: {
                    from: FacultyProfile.collection.name,
                    localField: 'user',
                    foreignField: 'userId',
                    as: 'facultyProfile'
                }
            },
            {
                $addFields: {
                    ownerProfile: {
                        $cond: [
                            { $eq: ['$certificateOwnerRole', 'faculty'] },
                            { $arrayElemAt: ['$facultyProfile', 0] },
                            { $arrayElemAt: ['$studentProfile', 0] }
                        ]
                    }
                }
            }
        ];

        const requestedOwnerRole = req.query.ownerRole;
        if (requestedOwnerRole && !['student', 'faculty'].includes(requestedOwnerRole)) {
            return res.status(400).json({ message: 'Owner role must be student or faculty.' });
        }
        if (requestedOwnerRole) {
            pipeline.push({ $match: { certificateOwnerRole: requestedOwnerRole } });
        }

        const search = typeof req.query.search === 'string' ? req.query.search.trim() : '';
        if (search) {
            const expression = new RegExp(escapeRegex(search), 'i');
            pipeline.push({
                $match: {
                    $or: [
                        { title: expression },
                        { type: expression },
                        { organization: expression },
                        { 'owner.username': expression },
                        { 'owner.fullName': expression },
                        { 'owner.email': expression },
                        { 'ownerProfile.fullName': expression },
                        { 'ownerProfile.rollNumber': expression },
                        { 'ownerProfile.employeeId': expression }
                    ]
                }
            });
        }

        const filters = {};
        if (typeof req.query.department === 'string' && req.query.department.trim()) {
            filters['ownerProfile.department'] = req.query.department.trim();
        }
        if (typeof req.query.branch === 'string' && req.query.branch.trim()) {
            filters['ownerProfile.branch'] = req.query.branch.trim();
        }
        if (typeof req.query.type === 'string' && req.query.type.trim()) {
            filters.type = req.query.type.trim();
        }
        if (req.query.status && !['pending', 'verified', 'rejected'].includes(req.query.status)) {
            return res.status(400).json({ message: 'Invalid certificate status.' });
        }
        if (['pending', 'verified', 'rejected'].includes(req.query.status)) {
            filters.verificationStatus = req.query.status;
        }
        if (req.query.studentId) {
            if (!mongoose.isValidObjectId(req.query.studentId)) {
                return res.status(400).json({ message: 'Invalid student ID.' });
            }
            filters.user = new mongoose.Types.ObjectId(req.query.studentId);
        }

        const dateRange = {};
        if (req.query.dateFrom && Number.isNaN(Date.parse(req.query.dateFrom))) {
            return res.status(400).json({ message: 'Invalid submission start date.' });
        }
        if (req.query.dateTo && Number.isNaN(Date.parse(req.query.dateTo))) {
            return res.status(400).json({ message: 'Invalid submission end date.' });
        }
        if (req.query.dateFrom) {
            dateRange.$gte = new Date(req.query.dateFrom);
        }
        if (req.query.dateTo) {
            const endDate = new Date(req.query.dateTo);
            endDate.setHours(23, 59, 59, 999);
            dateRange.$lte = endDate;
        }
        if (dateRange.$gte && dateRange.$lte && dateRange.$gte > dateRange.$lte) {
            return res.status(400).json({ message: 'Submission start date must be before the end date.' });
        }
        if (Object.keys(dateRange).length) {
            filters.createdAt = dateRange;
        }
        if (Object.keys(filters).length) {
            pipeline.push({ $match: filters });
        }

        const sortBy = req.query.sortOrder === 'asc' ? 1 : -1;
        const [countResult, certificates, statusResults] = await Promise.all([
            Achievement.aggregate([...pipeline, { $count: 'total' }]),
            Achievement.aggregate([
                ...pipeline,
                { $sort: { createdAt: sortBy, _id: sortBy } },
                { $skip: skip },
                { $limit: limit },
                {
                    $project: {
                        _id: 1,
                        title: 1,
                        type: 1,
                        organization: 1,
                        date: 1,
                        certificateUrl: 1,
                        certificateFilePath: 1,
                        verificationStatus: 1,
                        createdAt: 1,
                        rejectionRemark: 1,
                        expiresAt: 1,
                        ownerRole: '$certificateOwnerRole',
                        owner: {
                            _id: '$owner._id',
                            username: '$owner.username',
                            fullName: '$owner.fullName',
                            email: '$owner.email',
                            role: '$owner.role'
                        },
                        profile: {
                            fullName: '$ownerProfile.fullName',
                            rollNumber: '$ownerProfile.rollNumber',
                            department: '$ownerProfile.department',
                            designation: '$ownerProfile.designation',
                            employeeId: '$ownerProfile.employeeId',
                            branch: '$ownerProfile.branch',
                            institution: '$ownerProfile.institution'
                        }
                    }
                }
            ]),
            Achievement.aggregate([
                ...pipeline,
                { $group: { _id: '$verificationStatus', count: { $sum: 1 } } }
            ])
        ]);

        const total = countResult[0]?.total || 0;
        const statusCounts = statusResults.reduce((counts, result) => {
            counts[result._id || 'pending'] = result.count;
            return counts;
        }, { pending: 0, verified: 0, rejected: 0 });
        return res.status(200).json({
            message: 'Certificates fetched successfully.',
            certificates: certificates.map((certificate) => withSignedCertificateUrl(certificate)),
            statusCounts,
            pagination: { page, limit, total, totalPages: Math.ceil(total / limit) }
        });
    } catch (error) {
        return res.status(500).json({ message: 'Failed to fetch certificates.', error: error.message });
    }
};

const getAdminStudentCertificates = (req, res) => getAdminCertificates({
    ...req,
    query: { ...req.query, ownerRole: 'student' }
}, res);

const getAdminFacultyCertificates = (req, res) => getAdminCertificates({
    ...req,
    query: { ...req.query, ownerRole: 'faculty' }
}, res);

module.exports = {
    studentRole,
    facultyRole,
    adminRole,
    getAdminOverview,
    getAdminStudents,
    getAdminFaculty,
    updateFacultyBranch,
    getAdminStudentDetails,
    getAdminCertificates,
    getAdminStudentCertificates,
    getAdminFacultyCertificates
};
