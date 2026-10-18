
const achModel = require('../models/achievement.models');
const { getImageKitClient } = require('../services/imagekit.services');
const { withSignedCertificateUrl } = require('../services/certificate.services');


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

        if (!req.file || !title || !type || !organization || !date || !description) {
            return res.status(400).json({
                message: "Title, category, organization, date, description and a certificate file are required."
            });
        }

        const issueDate = new Date(date);
        if (Number.isNaN(issueDate.getTime())) {
            return res.status(400).json({ message: "A valid certificate date is required." });
        }

        const imagekit = getImageKitClient();

        const uploadResult = await imagekit.files.upload({
            file: req.file.buffer.toString("base64"),
            fileName: req.file.originalname,
            folder: "/proofolio/certificates/students",
            isPrivateFile: true
        });

        if (!uploadResult.url) {
            return res.status(502).json({ message: "Certificate file upload failed." });
        }

        const achievement = await achModel.create({
            title,
            type,
            organization,
            date: issueDate,
            description,
            position,
            certificateUrl: uploadResult.url,
            certificateFileId: uploadResult.fileId || "",
            certificateFilePath: uploadResult.filePath || "",
            user: req.user.id,
            ownerRole: "student"
        });

        res.status(201).json({
            message: "Achievement created successfully",
            achievement: withSignedCertificateUrl(achievement)
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

        const achievements = await achModel.find({ user: req.user.id });

        res.status(200).json({
            message: "Achievements fetched successfully",
            achievements: achievements.map((achievement) => withSignedCertificateUrl(achievement))
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
                verificationStatus: "pending",
                $or: [{ ownerRole: "student" }, { ownerRole: { $exists: false } }]
            })
            .populate("user", "username email");

        res.status(200).json({
            message: "Pending achievements fetched successfully",
            achievements: achievements.map((achievement) => withSignedCertificateUrl(achievement))
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

        if (achievement.ownerRole === "faculty" || String(achievement.user) === String(req.user.id)) {
            return res.status(403).json({
                message: "Faculty may only review student-submitted certificates."
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
            achievement: withSignedCertificateUrl(achievement)
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
        const requestBody = req.body || {};
        const rejectionRemark = typeof requestBody.rejectionRemark === "string"
            ? requestBody.rejectionRemark.trim()
            : "";

        if (!rejectionRemark) {
            return res.status(400).json({
                message: "A rejection remark is required."
            });
        }

        const achievement = await achModel.findById(id);

        if (!achievement) {
            return res.status(404).json({
                message: "Achievement not found"
            });
        }

        if (achievement.ownerRole === "faculty" || String(achievement.user) === String(req.user.id)) {
            return res.status(403).json({
                message: "Faculty may only review student-submitted certificates."
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
        achievement.rejectionRemark = rejectionRemark;
        achievement.verifiedBy = req.user.id;
        achievement.verifiedAt = new Date();

        await achievement.save();

        res.status(200).json({
            message: "Achievement rejected successfully",
            achievement: withSignedCertificateUrl(achievement)
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
