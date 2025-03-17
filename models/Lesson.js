const mongoose = require("mongoose");

const lessonSchema = new mongoose.Schema(
    {
        title: { type: String, required: true },
        code: { type: String, required: true },
        content: { type: String, required: true },
        description: { type: String },
        wordsWithHint: { type: [String], required: true },
        wordsWithoutHint: { type: [String], required: true },
        audioFile: { type: String, required: false },
        imageFile: { type: String, required: false },
        creator: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
        source: { type: String },
        view: { type: Number, default: 0 },

        submissions: [
            {
                userId: { type: mongoose.Schema.Types.ObjectId, ref: "User" }, // Who submitted
                user_text: { type: String, required: true }, // Full user input as text
                user_array: { type: [String], required: true }, // User input split into words
                accuracy: { type: Number, required: true }, // Accuracy percentage
                submittedAt: { type: Date, default: Date.now }, // Timestamp
            },
        ],
    },
    { timestamps: true }
);


module.exports = mongoose.model("Lesson", lessonSchema);
