const mongoose = require("mongoose");

const lessonSchema = new mongoose.Schema(
    {
        title: { type: String, required: true },
        code: { type: String, required: true },
        content: { type: String, required: true },
        description: { type: String },
        words: { type: [String], required: true },
        audioFile: { type: String, required: false }, // Optional, can be uploaded later
        imageFile: { type: String, required: false }, // Optional, can be uploaded later
        creator: { type: mongoose.Schema.Types.ObjectId, ref: "User" }, // If creator refers to a User
        source: { type: String, required: true },
        view: { type: Number, default: 0 }, // Default value
        provider: { type: String },
    },
    { timestamps: true }
);


module.exports = mongoose.model("Lesson", lessonSchema);
