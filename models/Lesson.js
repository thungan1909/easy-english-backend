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
        listenCount: { type: Number, default: 0 },
        listenedBy: [{ type: mongoose.Schema.Types.ObjectId, ref: "User" }]
    },
    { timestamps: true }
);


module.exports = mongoose.model("Lesson", lessonSchema);
