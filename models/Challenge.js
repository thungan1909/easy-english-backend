const mongoose = require("mongoose");

const ChallengeSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: true,
      trim: true,
      maxlength: 100,
    },
    description: {
      type: String,
      trim: true,
      maxlength: 4000,
    },
    coinAward: {
      type: Number,
      required: true,
      min: 0,
    },
    coinFee: {
      type: Number,
      required: true,
      min: 0,
    },
    imageFile: {
      type: String,
      required: true,
    },
    creator: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    startDate: {
      type: Date,
      required: true,
    },
    endDate: {
      type: Date,
      required: true,
      validate: {
        validator: function (value) {
          return !this.startDate || value >= this.startDate;
        },
        message: "End date must be after or equal to start date",
      },
    },
    timeLeft: {
      type: Number,
      required: true,
      min: 0,
    },
    lessons: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Lesson",
        required: true,
      },
    ],
    participants: [
      {
        userId: {
          type: mongoose.Schema.Types.ObjectId,
          ref: "User",
          required: true,
        },
        totalScore: { type: Number, default: 0 },
        totalAccuracy: { type: Number, default: 0 },
        averageScore: { type: Number, default: 0 },
        averageAccuracy: { type: Number, default: 0 },
        lessonResults: [
          {
            submissionId: {
              type: mongoose.Schema.Types.ObjectId,
              ref: "Submission",
            },
            lessonId: { type: mongoose.Schema.Types.ObjectId, ref: "Lesson" },
            score: { type: Number },
            accuracy: { type: Number },
          },
        ],
      },
    ],
    averageScore: {
      type: Number,
      default: 0,
    },
    averageAccuracy: {
      type: Number,
      default: 0,
    },
    totalScore: {
      type: Number,
      default: 0,
    },
    totalAccuracy: {
      type: Number,
      default: 0,
    },
    totalSubmission: {
      type: Number,
      default: 0,
    },
  },
  { timestamps: true }
);

const Challenge = mongoose.model("Challenge", ChallengeSchema);

module.exports = Challenge;
