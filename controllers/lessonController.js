const Lesson = require("../models/Lesson");

const lessonController = {
    createLesson: async (req, res) => {
        try {
            const { title, content, words, audioFile, creator, source } = req.body;

            if (!title || !content || !words || !audioFile || !source) {
                return res.status(400).json({ message: "All fields are required." });
            }

            const newLesson = await Lesson.create({
                title,
                content,
                words,
                audioFile,
                creator,
                source,
            });

            res.status(201).json({ message: "Lesson created successfully.", lesson: newLesson });
        } catch (err) {
            console.error("Create new lesson Error:", err);
            res.status(500).json({ message: "Internal Server Error" });
        }
    },
}

module.exports = lessonController;