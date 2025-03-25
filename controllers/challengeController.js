const Challenge = require("../models/Challenge");
const User = require("../models/User");

const challengeController = {
    createChallenge: async (req, res) => {
        try {
            const { title, description, coinAward, coinFee, startDate, endDate, imageFile, lessons } = req.body;

            if (!title || !coinAward || !coinFee || !startDate || !endDate || !imageFile || !Array.isArray(lessons) || lessons.length === 0) {
                return res.status(400).json({
                    message: "All fields are required: title, award coin, fee coin, start date, end date, imageFile, and lessons."
                });
            }

            // Validate startDate and endDate
            const start = new Date(startDate);
            const end = new Date(endDate);
            if (isNaN(start.getTime()) || isNaN(end.getTime())) {
                return res.status(400).json({ message: "Invalid date format." });
            }
            if (end < start) {
                return res.status(400).json({ message: "End date must be after or equal to start date." });
            }

            // Validate coinAward and coinFee (ensure they are non-negative)
            if (coinAward < 0 || coinFee < 0) {
                return res.status(400).json({ message: "Award coin fee coin must be 0 or greater." });
            }

            for (const lesson of lessons) {
                if (!lesson.id || !lesson.title) {
                    return res.status(400).json({ message: "Each lesson must have id and title." });
                }
            }

            const userId = req.user?.id;
            if (!userId) {
                return res.status(401).json({ message: "Unauthorized: No creator specified." });
            }

            const user = await User.findById(userId).select("username");
            if (!user) return res.status(404).json({ message: "User not found" });

            const newChallenge = await Challenge.create({
                title,
                description,
                coinAward,
                coinFee,
                imageFile,
                creator: userId,
                startDate: start,
                endDate: end,
                lessons,
                participantsCount: 0,
                isCompleted: false,
                completedUsersCount: 0,
                totalCompletionTime: 0,
                averageScore: 0,
                averageAccuracy: 0
            });

            res.status(201).json({ message: "Challenge created successfully.", challenge: newChallenge });
        } catch (err) {
            console.error("Create new challenge error:", err);
            res.status(500).json({ message: "Internal Server Error" });
        }
    },


}

module.exports = challengeController;