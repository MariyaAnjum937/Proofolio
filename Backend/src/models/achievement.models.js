const mongoose = require("mongoose");

const achievementSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: true,
      trim: true
    },

    type: {
      type: String,
      required: true,
      enum: [
        "Hackathon",
        "Internship",
        "Certification",
        "Workshop",
        "Competition",
        "Extracurricular",
        "Project",
        "Other"
      ]
    },

    organization: {
      type: String,
      required: true,
      trim: true
    },

    date: {
      type: Date,
      required: true
    },

    description: {
      type: String,
      default: "",
      trim: true
    },

    position: {
      type: String,
      trim: true
    },

    certificateUrl: {
      type: String,
      required: true
    },

    certificateFileId: {
      type: String,
      default: ""
    },

    certificateFilePath: {
      type: String,
      default: ""
    },

    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Users",
      required: true
    },

    ownerRole: {
      type: String,
      enum: ["student", "faculty"],
      default: "student",
      index: true
    },

    expiresAt: {
      type: Date,
      default: null
    },

    verificationStatus: {
      type: String,
      enum: ["pending", "verified", "rejected"],
      default: "pending"
    },

    rejectionRemark: {
      type: String,
      trim: true,
      default: ""
    },

    verifiedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Users",
      default: null
    },

    verifiedAt: {
      type: Date,
      default: null
    }
  },
  {
    timestamps: true
  }
);

achievementSchema.index({ user: 1, ownerRole: 1, createdAt: -1 });
achievementSchema.index({ verificationStatus: 1, ownerRole: 1 });

const achModel = mongoose.model("achievements", achievementSchema);

module.exports = achModel;