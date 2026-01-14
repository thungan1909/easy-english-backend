const mongoose = require("mongoose");

// Define weekly score schema
const weeklyScoreSchema = new mongoose.Schema({
  weekStart: { type: Date, required: true },
  score: { type: Number, default: 0 },
});

// Define user schema
const userSchema = new mongoose.Schema(
  {
    username: { type: String, required: true, unique: true, trim: true },
    fullName: { type: String, trim: true },
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
    },
    password: { type: String, required: true },
    phoneNumber: { type: String },
    avatarUrl: { type: String, default: "" },
    birthDate: { type: Date },
    gender: { type: String },
    city: { type: String },
    district: { type: String },
    ward: { type: String },
    detailAddress: { type: String },
    university: { type: String },
    major: { type: String },

    streak: { type: Number, default: 0 },
    lastStreakDate: { type: Date, default: null },

    // AUTHENTICATION
    isVerified: { type: Boolean, default: false },
    verificationCode: { type: String },
    verificationExpires: { type: Date }, // code validity (10 min)
    lastVerificationSent: { type: Date }, // resend cooldown (1 min)
    resetCode: { type: String },
    resetCodeExpires: { type: Date },
    isConfirmResetCode: { type: Boolean, default: false },

    // LESSON HISTORY
    listenedLessons: [
      {
        lesson: { type: mongoose.Schema.Types.ObjectId, ref: "Lesson" },
        listenedAt: { type: Date, default: Date.now },
      },
    ],

    // SCORE SYSTEM
    totalScore: { type: Number, default: 0 },
    weeklyScores: { type: [weeklyScoreSchema], default: [] },
  },
  { timestamps: true }
);

module.exports = mongoose.model("User", userSchema);
