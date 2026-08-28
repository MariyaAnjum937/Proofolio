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

module.exports = {
    postAchievement,
    displayAchievements
};

