const bcrypt = require('bcryptjs');
const User = require('../models/user.models');
const Achievement = require('../models/achievement.models');

const studentRole = (req, res) => {
    res.status(201).json({
        message: 'welcome student'
    });
};

const facultyRole = (req, res) => {
    res.status(201).json({
        message: 'welcome faculty'
    });
};

const adminRole = (req, res) => {
    res.status(201).json({
        message: 'welcome admin'
    });
};

const getAllUsers = async (req, res) => {
    try {
        const users = await User.find({}).select('-password').sort({ createdAt: -1 });
        return res.status(200).json({
            message: 'Users fetched successfully',
            users
        });
    } catch (error) {
        return res.status(500).json({
            message: 'Failed to fetch users',
            error: error.message
        });
    }
};

const getAdminOverview = async (req, res) => {
    try {
        const users = await User.find({}).select('-password').sort({ createdAt: -1 });

        const totalStudents = await User.countDocuments({ role: 'student' });
        const totalFaculty = await User.countDocuments({ role: 'faculty' });
        const totalAdmins = await User.countDocuments({ role: 'admin' });

        const totalAchievements = await Achievement.countDocuments();
        const pendingAchievements = await Achievement.countDocuments({ verificationStatus: 'pending' });
        const verifiedAchievements = await Achievement.countDocuments({ verificationStatus: 'verified' });
        const rejectedAchievements = await Achievement.countDocuments({ verificationStatus: 'rejected' });

        return res.status(200).json({
            message: 'Admin overview fetched successfully',
            users,
            stats: {
                totalStudents,
                totalFaculty,
                totalAdmins,
                totalAchievements,
                pendingAchievements,
                verifiedAchievements,
                rejectedAchievements
            }
        });
    } catch (error) {
        return res.status(500).json({
            message: 'Failed to fetch admin overview',
            error: error.message
        });
    }
};

const createUserByAdmin = async (req, res) => {
    try {
        const { username, email, password, role } = req.body;

        if (!username || !email || !password) {
            return res.status(400).json({
                message: 'Username, email and password are required.'
            });
        }

        const allowedRoles = ['student', 'faculty', 'admin'];
        const userRole = allowedRoles.includes(role) ? role : 'student';

        const existingUser = await User.findOne({
            $or: [{ username }, { email }]
        });

        if (existingUser) {
            return res.status(409).json({
                message: 'A user with this username or email already exists.'
            });
        }

        const hashedPassword = await bcrypt.hash(password, 10);
        const user = await User.create({
            username,
            email,
            password: hashedPassword,
            role: userRole
        });

        return res.status(201).json({
            message: 'User created successfully',
            user: {
                _id: user._id,
                username: user.username,
                email: user.email,
                role: user.role
            }
        });
    } catch (error) {
        return res.status(500).json({
            message: 'Failed to create user',
            error: error.message
        });
    }
};

const updateUserRoleByAdmin = async (req, res) => {
    try {
        const { id } = req.params;
        const { role } = req.body;

        if (!['student', 'faculty', 'admin'].includes(role)) {
            return res.status(400).json({
                message: 'Invalid role provided.'
            });
        }

        if (req.user.id === id) {
            return res.status(400).json({
                message: 'You cannot change your own role from here.'
            });
        }

        const user = await User.findById(id);

        if (!user) {
            return res.status(404).json({
                message: 'User not found.'
            });
        }

        user.role = role;
        await user.save();

        return res.status(200).json({
            message: 'User role updated successfully',
            user: {
                _id: user._id,
                username: user.username,
                email: user.email,
                role: user.role
            }
        });
    } catch (error) {
        return res.status(500).json({
            message: 'Failed to update user role',
            error: error.message
        });
    }
};

const deleteUserByAdmin = async (req, res) => {
    try {
        const { id } = req.params;

        if (req.user.id === id) {
            return res.status(400).json({
                message: 'You cannot delete your own admin account.'
            });
        }

        const user = await User.findById(id);

        if (!user) {
            return res.status(404).json({
                message: 'User not found.'
            });
        }

        await User.findByIdAndDelete(id);

        return res.status(200).json({
            message: 'User deleted successfully'
        });
    } catch (error) {
        return res.status(500).json({
            message: 'Failed to delete user',
            error: error.message
        });
    }
};

module.exports = {
    studentRole,
    facultyRole,
    adminRole,
    getAllUsers,
    getAdminOverview,
    createUserByAdmin,
    updateUserRoleByAdmin,
    deleteUserByAdmin
};