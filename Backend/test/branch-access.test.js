const test = require('node:test');
const assert = require('node:assert/strict');
const FacultyProfile = require('../src/models/facultyProfile.models');
const StudentProfile = require('../src/models/studentProfile.models');
const User = require('../src/models/user.models');
const Achievement = require('../src/models/achievement.models');
const MentoringAssignment = require('../src/models/mentoringAssignment.models');
const requireFacultyBranch = require('../src/middlewares/facultyBranch.middleware');
const achievementController = require('../src/controllers/achievements.controllers');
const mentoringController = require('../src/controllers/mentoring.controllers');
const { BRANCHES, canAccessBranch, isValidBranch } = require('../src/services/branch.services');

test('branch access accepts only matching configured branches', () => {
  assert.deepEqual(BRANCHES, ['CSE', 'CSM', 'CSD', 'CSC', 'CSE IoT', 'Civil', 'Mechanical', 'ECE']);
  for (const branch of BRANCHES) {
    assert.equal(isValidBranch(branch), true);
    assert.equal(canAccessBranch(branch, branch), true);
    assert.equal(canAccessBranch(branch, BRANCHES.find((candidate) => candidate !== branch)), false);
  }
  assert.equal(isValidBranch(''), false);
  assert.equal(canAccessBranch('', 'CSE'), false);
  assert.equal(canAccessBranch('CSE', undefined), false);
});

test('faculty branch middleware denies missing or unsupported assignments', async () => {
  const originalFindOne = FacultyProfile.findOne;
  const assignments = [null, { branch: 'Unknown' }, { branch: '' }];

  try {
    for (const profile of assignments) {
      FacultyProfile.findOne = () => ({
        select: () => ({ lean: async () => profile })
      });

      const response = {
        statusCode: null,
        body: null,
        status(code) {
          this.statusCode = code;
          return this;
        },
        json(body) {
          this.body = body;
          return this;
        }
      };
      let calledNext = false;
      await requireFacultyBranch({ user: { _id: 'faculty-id' } }, response, () => { calledNext = true; });

      assert.equal(response.statusCode, 403);
      assert.match(response.body.message, /branch assignment is missing or invalid/);
      assert.equal(calledNext, false);
    }
  } finally {
    FacultyProfile.findOne = originalFindOne;
  }
});

test('certificate review accepts same-branch students and denies other or unassigned branches', async () => {
  const originals = {
    achievementFindById: Achievement.findById,
    userFindOne: User.findOne,
    studentProfileFindOne: StudentProfile.findOne
  };

  const response = () => ({
    statusCode: null,
    body: null,
    status(code) {
      this.statusCode = code;
      return this;
    },
    json(body) {
      this.body = body;
      return this;
    }
  });

  try {
    const profileQuery = (profile) => ({
      select() { return this; },
      lean: async () => profile
    });
    User.findOne = () => profileQuery({ _id: '507f1f77bcf86cd799439012' });
    StudentProfile.findOne = () => profileQuery({ branch: 'CSM' });

    let saved = false;
    const sameBranchAchievement = {
      _id: '507f1f77bcf86cd799439013',
      user: '507f1f77bcf86cd799439012',
      ownerRole: 'student',
      verificationStatus: 'pending',
      save: async function save() { saved = true; }
    };
    Achievement.findById = async () => sameBranchAchievement;

    const approvedResponse = response();
    await achievementController.verifyAchievement({
      params: { id: sameBranchAchievement._id },
      user: { id: '507f1f77bcf86cd799439014' },
      facultyBranch: 'CSM'
    }, approvedResponse);
    assert.equal(approvedResponse.statusCode, 200);
    assert.equal(sameBranchAchievement.verificationStatus, 'verified');
    assert.equal(saved, true);

    for (const branch of ['CSE', '']) {
      saved = false;
      const crossBranchAchievement = {
        _id: '507f1f77bcf86cd799439015',
        user: '507f1f77bcf86cd799439012',
        ownerRole: 'student',
        verificationStatus: 'pending',
        save: async function save() { saved = true; }
      };
      Achievement.findById = async () => crossBranchAchievement;
      const deniedResponse = response();
      await achievementController.verifyAchievement({
        params: { id: crossBranchAchievement._id },
        user: { id: '507f1f77bcf86cd799439014' },
        facultyBranch: branch
      }, deniedResponse);
      assert.equal(deniedResponse.statusCode, 403);
      assert.equal(crossBranchAchievement.verificationStatus, 'pending');
      assert.equal(saved, false);
    }

    const rejectedResponse = response();
    await achievementController.rejectAchievement({
      params: { id: '507f1f77bcf86cd799439016' },
      body: { rejectionRemark: 'Out of branch' },
      user: { id: '507f1f77bcf86cd799439014' },
      facultyBranch: 'CSE'
    }, rejectedResponse);
    assert.equal(rejectedResponse.statusCode, 403);
    assert.equal(saved, false);
  } finally {
    Achievement.findById = originals.achievementFindById;
    User.findOne = originals.userFindOne;
    StudentProfile.findOne = originals.studentProfileFindOne;
  }
});

test('faculty cannot start mentoring outside their assigned branch', async () => {
  const originals = {
    userFindOne: User.findOne,
    facultyProfileFindOne: FacultyProfile.findOne,
    studentProfileFindOne: StudentProfile.findOne,
    assignmentCreate: MentoringAssignment.create
  };
  let requestedProfileQuery;
  let assignmentCreated = false;
  const response = {
    statusCode: null,
    body: null,
    status(code) {
      this.statusCode = code;
      return this;
    },
    json(body) {
      this.body = body;
      return this;
    }
  };

  try {
    User.findOne = () => ({ select: async () => ({ _id: '507f1f77bcf86cd799439012' }) });
    FacultyProfile.findOne = () => ({ select: async () => ({ institution: 'Example Institute' }) });
    StudentProfile.findOne = (query) => {
      requestedProfileQuery = query;
      return { select: async () => null };
    };
    MentoringAssignment.create = async () => {
      assignmentCreated = true;
      throw new Error('Cross-branch assignment must not be created.');
    };

    await mentoringController.startMentoring({
      params: { studentId: '507f1f77bcf86cd799439012' },
      user: { _id: '507f1f77bcf86cd799439014', fullName: 'Faculty' },
      facultyBranch: 'CSM'
    }, response);

    assert.deepEqual(requestedProfileQuery, {
      userId: '507f1f77bcf86cd799439012',
      branch: 'CSM'
    });
    assert.equal(response.statusCode, 404);
    assert.equal(assignmentCreated, false);
  } finally {
    User.findOne = originals.userFindOne;
    FacultyProfile.findOne = originals.facultyProfileFindOne;
    StudentProfile.findOne = originals.studentProfileFindOne;
    MentoringAssignment.create = originals.assignmentCreate;
  }
});
