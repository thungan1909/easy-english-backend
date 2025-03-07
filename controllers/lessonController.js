const Lesson = require("../models/Lesson");
const User = require("../models/User");
const lessonController = {
    createLesson: async (req, res) => {
        try {
            const { title, content, words, description, imageFile, audioFile, source } = req.body;

            if (!title || !content || !words || !audioFile || !imageFile || !source) {
                return res.status(400).json({ message: "All fields are required." });
            }

            const userId = req.user?.id;
            if (!userId) {
                return res.status(401).json({ message: "Unauthorized: No creator specified." });
            }

            const username = await User.findById(userId).select("-username");
            if (!username) return res.status(404).json({ message: "User not found" });

            const newLesson = await Lesson.create({
                title,
                content, description, imageFile,
                words,
                audioFile,
                creator: username,
                source,
            });

            res.status(201).json({ message: "Lesson created successfully.", lesson: newLesson });
        } catch (err) {
            console.error("Create new lesson Error:", err);
            res.status(500).json({ message: "Internal Server Error" });
        }
    },

    getListLesson: async (req, res) => {
        try {
            const lessons = await Lesson.find();
            res.status(200).json(lessons);
        } catch (err) {
            console.error("Error fetching lessons:", err);
            res.status(500).json({ message: "Internal Server Error" });
        }
    },
}

module.exports = lessonController;