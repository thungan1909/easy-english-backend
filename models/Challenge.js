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
        isCompleted: {
            type: Boolean,
            default: false,
        },
        participantsCount: {
            type: Number,
            default: 0,
            min: 0,
        },
        lessons: [
            {
                id: {
                    type: mongoose.Schema.Types.ObjectId,
                    ref: "Lesson",
                    required: true,
                },
                title: { type: String, required: true },
            }
        ],
        participants: [
            {
                userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
                username: { type: String, required: true },
                joinedAt: { type: Date, default: Date.now },
                completedAt: { type: Date, default: null },
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
        completedUsersCount: {
            type: Number,
            default: 0,
        },
        totalCompletionTime: {
            type: Number,
            default: 0,
        },
        createdAt: {
            type: Date,
            default: Date.now,
        },
    },
    { timestamps: true }
);

const Challenge = mongoose.model("Challenge", ChallengeSchema);

module.exports = Challenge;
