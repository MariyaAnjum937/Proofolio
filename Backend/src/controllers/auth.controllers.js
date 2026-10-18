const userModel = require('../models/user.models');
const StudentProfile = require('../models/studentProfile.models');
const FacultyProfile = require('../models/facultyProfile.models');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

const normalizeEmail = (value = '') => String(value).trim().toLowerCase();
const normalizeUsername = (value = '') => String(value).trim();

const isProduction = process.env.NODE_ENV === 'production' || process.env.RENDER === 'true';

const cookieOptions = {
  httpOnly: true,
  secure: isProduction,
  sameSite: isProduction ? 'none' : 'lax'
};

const sanitizeUser = (user) => ({
  _id: user._id,
  username: user.username,
  email: user.email,
  fullName: user.fullName || '',
  phone: user.phone || '',
  role: user.role,
  status: user.status || 'approved'
});

const isFacultyActive = (user) => user && user.role === 'faculty' && user.status === 'approved';
const isAdminActive = (user) => user && user.role === 'admin' && user.status === 'approved';

function validateStudentPayload(payload) {
  const required = [
    'fullName',
    'username',
    'email',
    'password',
    'institution',
    'degree',
    'department',
    'branch',
    'rollNumber',
    'admissionYear',
    'graduationYear',
    'currentAcademicYear',
    'currentSemester'
  ];

  for (const field of required) {
    if (payload[field] === undefined || payload[field] === null || String(payload[field]).trim() === '') {
      return `${field} is required.`;
    }
  }

  if (String(payload.password).length < 6) {
    return 'Password must be at least 6 characters long.';
  }

  if (payload.confirmPassword && String(payload.password) !== String(payload.confirmPassword)) {
    return 'Passwords do not match.';
  }

  const currentSemester = Number(payload.currentSemester);
  if (Number.isNaN(currentSemester) || currentSemester < 1 || currentSemester > 12) {
    return 'Current semester must be a valid number between 1 and 12.';
  }

  const admissionYear = Number(payload.admissionYear);
  const graduationYear = Number(payload.graduationYear);
  if (Number.isNaN(admissionYear) || Number.isNaN(graduationYear)) {
    return 'Admission and graduation years must be valid numbers.';
  }

  if (payload.cgpa !== undefined && payload.cgpa !== null && payload.cgpa !== '') {
    const cgpa = Number(payload.cgpa);
    if (Number.isNaN(cgpa) || cgpa < 0 || cgpa > 10) {
      return 'CGPA must be a number between 0 and 10.';
    }
  }

  return null;
}

function validateFacultyPayload(payload) {
  const required = ['fullName', 'username', 'email', 'password', 'institution', 'employeeId', 'department', 'designation'];
  for (const field of required) {
    if (payload[field] === undefined || payload[field] === null || String(payload[field]).trim() === '') {
      return `${field} is required.`;
    }
  }

  if (String(payload.password).length < 6) {
    return 'Password must be at least 6 characters long.';
  }

  return null;
}

async function registerUser(req, res) {
  const body = req.body || {};
  const username = normalizeUsername(body.username);
  const email = normalizeEmail(body.email);
  const password = String(body.password || '');

  if (!username || !email || !password) {
    return res.status(400).json({ message: 'Username, email and password are required.' });
  }

  if (password.length < 6) {
    return res.status(400).json({ message: 'Password must be at least 6 characters long.' });
  }

  const existingUser = await userModel.findOne({ $or: [{ username }, { email }] });
  if (existingUser) {
    return res.status(409).json({ message: 'A user with this username or email already exists.' });
  }

  const hashedPassword = await bcrypt.hash(password, 10);

  try {
    const user = await userModel.create({
      username,
      email,
      password: hashedPassword,
      fullName: String(body.fullName || '').trim(),
      phone: String(body.phone || '').trim(),
      role: 'student',
      status: 'approved'
    });

    return res.status(201).json({
      message: 'User created successfully.',
      user: sanitizeUser(user)
    });
  } catch (error) {
    return res.status(500).json({ message: 'Failed to register user.', error: error.message });
  }
}

async function registerStudent(req, res) {
  const payload = req.body || {};
  const validationError = validateStudentPayload(payload);
  if (validationError) {
    return res.status(400).json({ message: validationError });
  }

  const username = normalizeUsername(payload.username);
  const email = normalizeEmail(payload.email);
  const password = String(payload.password);

  try {
    const userExists = await userModel.findOne({ $or: [{ username }, { email }] });
    if (userExists) {
      return res.status(409).json({ message: 'Username or email is already in use.' });
    }

    const existingRoll = await StudentProfile.findOne({
      institution: String(payload.institution).trim(),
      rollNumber: String(payload.rollNumber).trim().toUpperCase()
    });

    if (existingRoll) {
      return res.status(409).json({ message: 'A student with this roll number already exists in the same institution.' });
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    const user = await userModel.create({
      username,
      email,
      password: hashedPassword,
      fullName: String(payload.fullName).trim(),
      phone: String(payload.phone || '').trim(),
      role: 'student',
      status: 'approved'
    });

    const profileData = {
      userId: user._id,
      fullName: String(payload.fullName).trim(),
      phone: String(payload.phone || '').trim(),
      institution: String(payload.institution).trim(),
      degree: String(payload.degree).trim(),
      department: String(payload.department).trim(),
      branch: String(payload.branch).trim(),
      rollNumber: String(payload.rollNumber).trim().toUpperCase(),
      admissionYear: Number(payload.admissionYear),
      graduationYear: Number(payload.graduationYear),
      currentAcademicYear: String(payload.currentAcademicYear).trim(),
      currentSemester: Number(payload.currentSemester),
      section: String(payload.section || '').trim(),
      cgpa: payload.cgpa === undefined || payload.cgpa === null || payload.cgpa === '' ? null : Number(payload.cgpa)
    };

    const profile = await StudentProfile.create(profileData);

    return res.status(201).json({
      message: 'Student registered successfully.',
      user: sanitizeUser(user),
      profile: {
        ...profile.toObject(),
        userId: String(profile.userId)
      }
    });
  } catch (error) {
    if (error && error.code === 11000) {
      return res.status(409).json({ message: 'Duplicate student record detected.' });
    }
    return res.status(500).json({ message: 'Failed to create student account.', error: error.message });
  }
}

async function registerFaculty(req, res) {
  const payload = req.body || {};
  const validationError = validateFacultyPayload(payload);
  if (validationError) {
    return res.status(400).json({ message: validationError });
  }

  const username = normalizeUsername(payload.username);
  const email = normalizeEmail(payload.email);

  try {
    const userExists = await userModel.findOne({ $or: [{ username }, { email }] });
    if (userExists) {
      return res.status(409).json({ message: 'Username or email is already in use.' });
    }

    const facultyExists = await FacultyProfile.findOne({
      institution: String(payload.institution).trim(),
      employeeId: String(payload.employeeId).trim().toUpperCase()
    });

    if (facultyExists) {
      return res.status(409).json({ message: 'A faculty member with this employee ID already exists in the same institution.' });
    }

    const hashedPassword = await bcrypt.hash(String(payload.password), 10);
    const user = await userModel.create({
      username,
      email,
      password: hashedPassword,
      fullName: String(payload.fullName).trim(),
      phone: String(payload.phone || '').trim(),
      role: 'faculty',
      status: 'pending'
    });

    const profile = await FacultyProfile.create({
      userId: user._id,
      fullName: String(payload.fullName).trim(),
      phone: String(payload.phone || '').trim(),
      institution: String(payload.institution).trim(),
      employeeId: String(payload.employeeId).trim().toUpperCase(),
      department: String(payload.department).trim(),
      designation: String(payload.designation).trim(),
      specialization: String(payload.specialization || '').trim(),
      experienceYears: Number(payload.experienceYears || 0)
    });

    return res.status(201).json({
      message: 'Faculty registration submitted successfully. Your account is pending administrator approval.',
      user: sanitizeUser(user),
      profile: {
        ...profile.toObject(),
        userId: String(profile.userId)
      }
    });
  } catch (error) {
    if (error && error.code === 11000) {
      return res.status(409).json({ message: 'Duplicate faculty record detected.' });
    }
    return res.status(500).json({ message: 'Failed to create faculty account.', error: error.message });
  }
}

async function registerAdmin(req, res) {
  const body = req.body || {};
  const secret = process.env.ADMIN_REGISTRATION_SECRET || '';
  const providedSecret = String(body.adminSecret || body.registrationSecret || '');

  if (!secret || providedSecret !== secret) {
    return res.status(403).json({ message: 'Admin registration is not available publicly.' });
  }

  const username = normalizeUsername(body.username);
  const email = normalizeEmail(body.email);
  const password = String(body.password || '');

  if (!username || !email || !password) {
    return res.status(400).json({ message: 'Username, email and password are required.' });
  }

  if (password.length < 6) {
    return res.status(400).json({ message: 'Password must be at least 6 characters long.' });
  }

  const existingAdmin = await userModel.findOne({ role: 'admin' });
  if (existingAdmin) {
    return res.status(409).json({ message: 'An administrator account already exists.' });
  }

  const existingUser = await userModel.findOne({ $or: [{ username }, { email }] });
  if (existingUser) {
    return res.status(409).json({ message: 'Username or email is already in use.' });
  }

  const hashedPassword = await bcrypt.hash(password, 10);
  const user = await userModel.create({
    username,
    email,
    password: hashedPassword,
    fullName: String(body.fullName || '').trim(),
    phone: String(body.phone || '').trim(),
    role: 'admin',
    status: 'approved'
  });

  return res.status(201).json({
    message: 'Admin account created successfully.',
    user: sanitizeUser(user)
  });
}

async function loginUser(req, res) {
  const email = normalizeEmail(req.body.email);
  const password = String(req.body.password || '');

  const userExists = await userModel.findOne({ email });

  if (!userExists) {
    return res.status(401).json({ message: 'No user found.' });
  }

  const isMatch = await bcrypt.compare(password, userExists.password);
  if (!isMatch) {
    return res.status(401).json({ message: 'Invalid credentials.' });
  }

  if (userExists.role === 'faculty' && ['pending', 'rejected'].includes(userExists.status)) {
    return res.status(403).json({ message: 'Your faculty account is pending approval.' });
  }

  if (userExists.role === 'admin' && ['pending', 'rejected'].includes(userExists.status)) {
    return res.status(403).json({ message: 'Your admin account is not active.' });
  }

  const token = jwt.sign({ id: userExists._id, role: userExists.role, status: userExists.status }, process.env.JWT_SECRET);
  res.cookie('token', token, cookieOptions);

  return res.status(200).json({
    message: 'Login successful.',
    user: sanitizeUser(userExists)
  });
}

async function logoutUser(req, res) {
  res.clearCookie('token', cookieOptions);
  return res.status(200).json({ message: 'Logout successful.' });
}

async function getStudentProfile(req, res) {
  const student = await userModel.findById(req.user.id).select('-password');
  if (!student) {
    return res.status(404).json({ message: 'Student not found.' });
  }

  const profile = await StudentProfile.findOne({ userId: req.user.id }).lean();

  if (!profile) {
    return res.status(404).json({ message: 'Student profile not found.' });
  }

  return res.status(200).json({
    message: 'Profile fetched successfully.',
    user: sanitizeUser(student),
    profile: {
      ...profile,
      userId: String(profile.userId)
    }
  });
}

async function updateStudentProfile(req, res) {
  try {
    const allowedFields = [
      'fullName',
      'phone',
      'institution',
      'degree',
      'department',
      'branch',
      'rollNumber',
      'admissionYear',
      'graduationYear',
      'currentAcademicYear',
      'currentSemester',
      'section',
      'cgpa'
    ];

    const payload = req.body || {};
    const profilePayload = {};
    const userPayload = {};

    for (const field of allowedFields) {
      if (payload[field] === undefined) continue;

      if (field === 'fullName') {
        const value = String(payload[field]).trim();
        if (!value) return res.status(400).json({ message: 'Full name is required.' });
        userPayload.fullName = value;
        profilePayload.fullName = value;
      } else if (field === 'phone') {
        userPayload.phone = String(payload[field]).trim();
        profilePayload.phone = String(payload[field]).trim();
      } else if (field === 'institution') {
        profilePayload.institution = String(payload[field]).trim();
      } else if (field === 'degree') {
        profilePayload.degree = String(payload[field]).trim();
      } else if (field === 'department') {
        profilePayload.department = String(payload[field]).trim();
      } else if (field === 'branch') {
        profilePayload.branch = String(payload[field]).trim();
      } else if (field === 'rollNumber') {
        profilePayload.rollNumber = String(payload[field]).trim().toUpperCase();
      } else if (field === 'admissionYear') {
        const value = Number(payload[field]);
        if (Number.isNaN(value)) return res.status(400).json({ message: 'Admission year must be a valid number.' });
        profilePayload.admissionYear = value;
      } else if (field === 'graduationYear') {
        const value = Number(payload[field]);
        if (Number.isNaN(value)) return res.status(400).json({ message: 'Graduation year must be a valid number.' });
        profilePayload.graduationYear = value;
      } else if (field === 'currentAcademicYear') {
        profilePayload.currentAcademicYear = String(payload[field]).trim();
      } else if (field === 'currentSemester') {
        const value = Number(payload[field]);
        if (Number.isNaN(value) || value < 1 || value > 12) {
          return res.status(400).json({ message: 'Current semester must be a valid number between 1 and 12.' });
        }
        profilePayload.currentSemester = value;
      } else if (field === 'section') {
        profilePayload.section = String(payload[field]).trim();
      } else if (field === 'cgpa') {
        if (payload[field] === null || payload[field] === '') {
          profilePayload.cgpa = null;
        } else {
          const value = Number(payload[field]);
          if (Number.isNaN(value) || value < 0 || value > 10) {
            return res.status(400).json({ message: 'CGPA must be a number between 0 and 10.' });
          }
          profilePayload.cgpa = value;
        }
      }
    }

    if (payload.role || payload.status || payload.password || payload.username || payload.email) {
      return res.status(403).json({ message: 'Protected fields cannot be modified through this endpoint.' });
    }

    if (Object.keys(userPayload).length) {
      await userModel.findByIdAndUpdate(req.user.id, { $set: userPayload });
    }

    if (!Object.keys(profilePayload).length) {
      return res.status(400).json({ message: 'No valid profile changes were provided.' });
    }

    const currentProfile = await StudentProfile.findOne({ userId: req.user.id });
    if (!currentProfile) {
      return res.status(404).json({ message: 'Student profile not found.' });
    }

    if (profilePayload.rollNumber && profilePayload.institution && currentProfile.rollNumber !== profilePayload.rollNumber) {
      const duplicate = await StudentProfile.findOne({
        institution: profilePayload.institution || currentProfile.institution,
        rollNumber: profilePayload.rollNumber,
        userId: { $ne: req.user.id }
      });

      if (duplicate) {
        return res.status(409).json({ message: 'A student with this roll number already exists in the same institution.' });
      }
    }

    const updatedProfile = await StudentProfile.findOneAndUpdate(
      { userId: req.user.id },
      { $set: profilePayload },
      { returnDocument: 'after', runValidators: true }
    );

    const student = await userModel.findById(req.user.id).select('-password');
    return res.status(200).json({
      message: 'Profile updated successfully.',
      user: sanitizeUser(student),
      profile: {
        ...updatedProfile.toObject(),
        userId: String(updatedProfile.userId)
      }
    });
  } catch (error) {
    if (error && error.code === 11000) {
      return res.status(409).json({ message: 'A student with this roll number already exists in the same institution.' });
    }
    return res.status(500).json({ message: 'Failed to update profile.', error: error.message });
  }
}

async function getPendingFaculty(req, res) {
  const pending = await userModel.find({ role: 'faculty', status: 'pending' })
    .select('-password')
    .sort({ createdAt: 1 })
    .lean();
  const profiles = await FacultyProfile.find({ userId: { $in: pending.map((user) => user._id) } }).lean();
  const profileMap = new Map(profiles.map((profile) => [String(profile.userId), profile]));

  const pendingFaculty = pending.map((user) => ({
    ...user,
    profile: profileMap.get(String(user._id)) || null
  }));

  return res.status(200).json({ message: 'Pending faculty fetched successfully.', pendingFaculty });
}

async function approveFaculty(req, res) {
  const { id } = req.params;
  const user = await userModel.findById(id);

  if (!user || user.role !== 'faculty') {
    return res.status(404).json({ message: 'Faculty account not found.' });
  }

  user.status = 'approved';
  await user.save();

  return res.status(200).json({
    message: 'Faculty account approved successfully.',
    user: sanitizeUser(user)
  });
}

async function rejectFaculty(req, res) {
  const { id } = req.params;
  const { reason } = req.body || {};
  const user = await userModel.findById(id);

  if (!user || user.role !== 'faculty') {
    return res.status(404).json({ message: 'Faculty account not found.' });
  }

  user.status = 'rejected';
  await user.save();

  return res.status(200).json({
    message: reason ? `Faculty account rejected: ${reason}` : 'Faculty account rejected successfully.',
    user: sanitizeUser(user)
  });
}

module.exports = {
  registerUser,
  registerStudent,
  registerFaculty,
  registerAdmin,
  loginUser,
  logoutUser,
  getStudentProfile,
  updateStudentProfile,
  getPendingFaculty,
  approveFaculty,
  rejectFaculty,
  sanitizeUser,
  isFacultyActive,
  isAdminActive
};