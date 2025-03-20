const mongoose = require("mongoose");

const submissionSchema = new mongoose.Schema(
    {
        user: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
        lesson: { type: mongoose.Schema.Types.ObjectId, ref: "Lesson", required: true },
        original_array: { type: [String], required: true },
        user_array: { type: [String], required: true },
        result_array: { type: [String], required: true },
        correct_answers: { type: Number, required: true },
        total_filled_blanks: { type: Number, required: true },
        accuracy: { type: Number, required: true },
        submittedAt: { type: Date, default: Date.now },
        score: { type: Number, required: true },

    },
    { timestamps: true }
);

module.exports = mongoose.model("Submission", submissionSchema);
