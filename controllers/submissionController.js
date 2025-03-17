const Lesson = require("../models/Lesson");
const Submission = require("../models/Submission");

const submissionController = {

    listenLesson: async (req, res) => {
        try {
            const { lessonId, result_array, user_array } = req.body

            const userId = req.user.id; // Assuming authentication middleware provides `req.user`

            // Validate input
            if (!lessonId || !user_array.length || !result_array.length) {
                return res.status(400).json({ message: "Invalid input data" });
            }

            // Find the lesson by ID
            const lesson = await Lesson.findById(lessonId);
            if (!lesson) {
                return res.status(404).json({ message: "Lesson not found" });
            }

            // Ensure arrays have the same length
            if (user_array.length !== result_array.length) {
                return res.status(400).json({ message: "Arrays length mismatch" });
            }

            // Compare only blank words that the user filled in
            let correctCount = 0;
            let filledBlankCount = 0;

            for (let i = 0; i < result_array.length; i++) {
                const userWord = user_array[i].trim().toLowerCase();
                const correctWord = result_array[i].trim().toLowerCase();

                if (result_array[i] === "_____") {
                    // This was originally a blank space
                    if (userWord !== "_____") {
                        filledBlankCount++; // Count words the user filled in
                        if (userWord === correctWord) {
                            correctCount++; // Count correct answers only for blanks
                        }
                    }
                }
            }

            // Calculate accuracy only for filled blanks
            const accuracy = filledBlankCount > 0 ? ((correctCount / filledBlankCount) * 100).toFixed(2) : "0.00";
            // Save submission to the database
            const newSubmission = new Submission({
                user: userId,
                lesson: lessonId,
                user_text,
                user_array,
                result_text,
                result_array,
                correct_answers: correctCount,
                total_filled_blanks: filledBlankCount,
                accuracy,
            });

            await newSubmission.save();

            return res.status(200).json({
                message: "Submission received successfully",
                accuracy: `${accuracy}%`,
                correctAnswers: correctCount,
                totalFilledBlanks: filledBlankCount,
            });
        } catch (err) {
            console.error("Error in listenLesson:", err);
            return res.status(500).json({ message: "Internal server error" });
        }
    }
}

module.exports = submissionController;