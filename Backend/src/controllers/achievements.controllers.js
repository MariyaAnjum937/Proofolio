
const achModel = require('../models/achievement.models');
const imagekit = require("../services/imagekit.services");


// CREATE ACHIEVEMENT
const postAchievement = async (req, res) => {
    try {

        const {
            title,
            type,
            organization,
            date,
            description,
            position
        } = req.body;

        let certificateUrl = null;

        if (req.file) {

            const result = await imagekit.files.upload({
                file: req.file.buffer.toString("base64"),
                fileName: req.file.originalname,
                folder: "/proofolio/certificates"
            });

            certificateUrl = result.url;
        }

        const achievement = await achModel.create({
            title,
            type,
            organization,
            date,
            description,
            position,
            certificateUrl,
            user: req.user.id
        });

        res.status(201).json({
            message: "Achievement created successfully",
            achievement
        });

    } catch (error) {

        console.error(error);

        res.status(500).json({
            message: "Failed to create achievement",
            error: error.message
        });
    }
};


// GET ALL ACHIEVEMENTS OF LOGGED-IN USER
const displayAchievements = async (req, res) => {
    try {

        const achievements = await achModel.find({
            user: req.user.id
        });

        res.status(200).json({
            message: "Achievements fetched successfully",
            achievements
        });

    } catch (error) {

        res.status(500).json({
            message: "Failed to fetch achievements",
            error: error.message
        });
    }
};


// DELETE ACHIEVEMENT
const deleteAchievement = async (req, res) => {
    try {

        const { id } = req.params;

        const achievement = await achModel.findOne({
            _id: id,
            user: req.user.id
        });

        if (!achievement) {
            return res.status(404).json({
                message: "Achievement not found or you are not authorized to delete it"
            });
        }

        await achModel.findByIdAndDelete(id);

        res.status(200).json({
            message: "Achievement deleted successfully"
        });

    } catch (error) {

        console.error(error);

        res.status(500).json({
            message: "Failed to delete achievement"
        });
    }
};


// GET PENDING ACHIEVEMENTS FOR FACULTY
const getPendingAchievements = async (req, res) => {
    try {

        const achievements = await achModel
            .find({
                verificationStatus: "pending"
            })
            .populate("user", "username email");

        res.status(200).json({
            message: "Pending achievements fetched successfully",
            achievements
        });

    } catch (error) {

        console.error(error);

        res.status(500).json({
            message: "Failed to fetch pending achievements",
            error: error.message
        });
    }
};


// VERIFY ACHIEVEMENT
const verifyAchievement = async (req, res) => {
    try {

        const { id } = req.params;

        const achievement = await achModel.findById(id);

        if (!achievement) {
            return res.status(404).json({
                message: "Achievement not found"
            });
        }

        if (achievement.verificationStatus === "verified") {
            return res.status(400).json({
                message: "Achievement is already verified"
            });
        }

        if (achievement.verificationStatus === "rejected") {
            return res.status(400).json({
                message: "Achievement is already rejected"
            });
        }

        achievement.verificationStatus = "verified";
        achievement.verifiedBy = req.user.id;
        achievement.verifiedAt = new Date();

        await achievement.save();

        res.status(200).json({
            message: "Achievement verified successfully",
            achievement
        });

    } catch (error) {

        console.error(error);

        res.status(500).json({
            message: "Failed to verify achievement",
            error: error.message
        });
    }
};

const rejectAchievement = async (req, res) => {
    try {

        const { id } = req.params;

        const achievement = await achModel.findById(id);

        if (!achievement) {
            return res.status(404).json({
                message: "Achievement not found"
            });
        }

        if (achievement.verificationStatus === "verified") {
            return res.status(400).json({
                message: "Achievement is already verified"
            });
        }

        if (achievement.verificationStatus === "rejected") {
            return res.status(400).json({
                message: "Achievement is already rejected"
            });
        }

        achievement.verificationStatus = "rejected";
        achievement.verifiedBy = req.user.id;
        achievement.verifiedAt = new Date();

        await achievement.save();

        res.status(200).json({
            message: "Achievement rejected successfully",
            achievement
        });

    } catch (error) {

        console.error(error);

        res.status(500).json({
            message: "Failed to reject achievement",
            error: error.message
        });
    }
};


module.exports = {
    postAchievement,
    displayAchievements,
    deleteAchievement,
    getPendingAchievements,
    verifyAchievement,
    rejectAchievement
};

