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
      required: true,
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

    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true
    }
  },
  {
    timestamps: true
  }
);

const achModel = mongoose.model("achievements", achievementSchema);

module.exports = achModel;