const Lesson = require("../models/Lesson");
const Submission = require("../models/Submission");
const User = require("../models/User");
const mongoose = require("mongoose");

const submissionController = {
    listenLesson: async (req, res) => {
        try {
            const { lessonId, original_array, result_array, user_array } = req.body
            const userId = req.user.id;

            if (
                !lessonId ||
                !Array.isArray(original_array) || !original_array.length ||
                !Array.isArray(result_array) || !result_array.length ||
                !Array.isArray(user_array) || !user_array.length
            ) {
                return res.status(400).json({ message: "Invalid input data" });
            }

            const lesson = await Lesson.findById(lessonId);
            if (!lesson) {
                return res.status(404).json({ message: "Lesson not found" });
            }

            if (user_array.length !== result_array.length || original_array.length !== result_array.length) {
                return res.status(400).json({ message: "Arrays length mismatch" });
            }

            let correctCount = 0;
            let filledBlankCount = 0;
            let blankCount = 0;

            const normalize = (word) => (word ? word.trim().toLowerCase() : "_____");

            for (let i = 0; i < result_array.length; i++) {
                const userWord = normalize(user_array[i]);
                const correctWord = normalize(result_array[i]);

                if (!original_array[i]?.trim()) {
                    blankCount++;
                    if (userWord !== "_____") {
                        filledBlankCount++;
                        if (userWord === correctWord) {
                            correctCount++;
                        }
                    }
                }
            }

            const accuracy = blankCount > 0 ? ((correctCount / blankCount) * 100).toFixed(2) : "0.00";

            const newSubmission = new Submission({
                user: userId,
                lesson: lessonId,
                original_array,
                user_array,
                result_array,
                correct_answers: correctCount,
                total_filled_blanks: filledBlankCount,
                accuracy,
            });

            await newSubmission.save();

            await Lesson.findByIdAndUpdate(
                lessonId,
                {
                    $inc: { listenCount: 1 },
                    $addToSet: { listenedBy: userId }
                },
                { new: true }
            );

            await User.findByIdAndUpdate(
                userId,
                {
                    $addToSet: { listenedLessons: { lesson: lessonId, listenedAt: new Date() } }
                },
                { new: true }
            );


            return res.status(200).json({
                message: "Submission received successfully",
                accuracy: `${accuracy}%`,
                blankCount,
                correctAnswers: correctCount,
                totalFilledBlanks: filledBlankCount,
            });
        } catch (err) {
            console.error("Error in listen Lesson:", err);
            return res.status(500).json({ message: "Internal server error" });
        }
    },

    getLessonResult: async (req, res) => {
        try {
            const { lessonId } = req.query;
            const userId = req.user?.id;

            if (!mongoose.Types.ObjectId.isValid(lessonId)) {
                return res.status(400).json({ message: "Invalid lesson ID." });
            }
            if (!mongoose.Types.ObjectId.isValid(userId)) {
                return res.status(400).json({ message: "Invalid user ID." });
            }

            const submissions = await Submission.find({
                lesson: lessonId,
                user: userId
            }).populate("user", "name email");

            if (!submissions.length) {
                return res.status(404).json({ message: "No submissions found for this lesson." });
            }

            return res.status(200).json({ submissions });
        } catch (err) {
            res.status(500).json({ message: "Internal Server Error" });
        }
    },
}

module.exports = submissionController;