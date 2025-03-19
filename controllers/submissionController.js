const Lesson = require("../models/Lesson");
const Submission = require("../models/Submission");
const User = require("../models/User");
const mongoose = require("mongoose");

const submissionController = {
    calculateAccuracy: (originalArray, resultArray, userArray) => {
        let correctCount = 0;
        let filledBlankCount = 0;
        let blankCount = 0;

        const normalize = (word) => (word ? word.trim().toLowerCase() : "_____");

        for (let i = 0; i < resultArray.length; i++) {
            const userWord = normalize(userArray[i]);
            const correctWord = normalize(resultArray[i]);

            if (!originalArray[i]?.trim()) {
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

        return {
            accuracy: `${accuracy}%`,
            blankCount,
            correctAnswers: correctCount,
            totalFilledBlanks: filledBlankCount,
        };

    },
    compareLesson: async (req, res) => {
        try {
            const { lessonId, original_array, result_array, user_array } = req.body


            if (!lessonId || ![original_array, result_array, user_array].every(arr => Array.isArray(arr) && arr.length)) {
                return res.status(400).json({ message: "Invalid input data" });
            }

            const lesson = await Lesson.findById(lessonId);
            if (!lesson) {
                return res.status(404).json({ message: "Lesson not found" });
            }

            if (![user_array, result_array, original_array].every(arr => arr.length === result_array.length)) {
                return res.status(400).json({ message: "Arrays length mismatch" });
            }

            accuracyResult = submissionController.calculateAccuracy(original_array, result_array, user_array);
            return res.status(200).json(accuracyResult);
        } catch (err) {
            console.error("Error in listen Lesson:", err);
            return res.status(500).json({ message: "Internal server error" });
        }
    },
    listenLesson: async (req, res) => {
        try {
            const { lessonId, original_array, result_array, user_array } = req.body
            const userId = req.user.id;


            if (!lessonId || ![original_array, result_array, user_array].every(arr => Array.isArray(arr) && arr.length)) {
                return res.status(400).json({ message: "Invalid input data" });
            }

            const lesson = await Lesson.findById(lessonId);
            if (!lesson) {
                return res.status(404).json({ message: "Lesson not found" });
            }

            if (![user_array, result_array, original_array].every(arr => arr.length === result_array.length)) {
                return res.status(400).json({ message: "Arrays length mismatch" });
            }


            const result = submissionController.calculateAccuracy(original_array, result_array, user_array);


            const newSubmission = new Submission({
                user: userId,
                lesson: lessonId,
                original_array,
                user_array,
                result_array,
                correct_answers: result.correctAnswers,
                total_filled_blanks: result.totalFilledBlanks,
                accuracy: result.accuracy,
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
                ...result,
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

            return res.status(200).json(submissions[0]);
        } catch (err) {
            res.status(500).json({ message: "Internal Server Error" });
        }
    },
}

module.exports = submissionController;