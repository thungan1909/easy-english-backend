const Challenge = require("../models/Challenge");
const User = require("../models/User");
const mongoose = require("mongoose");

const challengeController = {
    getListChallenge: async (req, res) => {
        try {
            const lessons = await Challenge.find().populate("creator", "username");
            res.status(200).json(lessons);
        } catch (err) {
            console.error("Error fetching lessons:", err);
            res.status(500).json({ message: "Internal Server Error" });
        }
    },

    getChallengeById: async (req, res) => {
        try {
            const { id } = req.params;

            if (!mongoose.Types.ObjectId.isValid(id)) {
                return res.status(400).json({ message: "Invalid Challenge ID." });
            }

            // const challenge = await Challenge.findById(id).populate("creator", "username").populate({
            //     path: "lessons.id",
            //     model: "Lesson", // Ensure this matches your Lesson model name
            // });
            const challenge = await Challenge.findById(id)
                .populate("creator", "username")
                .populate("lessons"); // Automatically fetch full lesson details

            if (!challenge) {
                return res.status(404).json({ message: "Challenge not found." });
            }
            res.status(200).json(challenge);

            // Format response to include full lesson details
            // const formattedChallenge = {
            //     ...challenge.toObject(),
            //     lessons: challenge.lessons.map((lesson) => ({
            //         id: lesson.id._id, // Extract ObjectId
            //         title: lesson.id.title, // Extract full title
            //         description: lesson.id.description, // Include other lesson details
            //         podcastUrl: lesson.id.podcastUrl, // If lessons have podcast URLs
            //         duration: lesson.id.duration, // Example additional field
            //     })),
            // };

            // res.status(200).json(formattedChallenge);
        } catch (err) {
            console.error("Error fetching Challenge by ID:", err);
            res.status(500).json({ message: "Internal Server Error" });
        }
    },

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
            // Convert timeLeft to hours (optional: you can use days/minutes as needed)
            const timeLeft = Math.floor((end - start) / (1000 * 60 * 60)); // Convert to hours

            // Validate coinAward and coinFee (ensure they are non-negative)
            if (coinAward < 0 || coinFee < 0) {
                return res.status(400).json({ message: "Award coin fee coin must be 0 or greater." });
            }

            const lessonIds = lessons.map(lesson => lesson.id);

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
                timeLeft, // Store calculated time left (in hours)
                startDate: start,
                endDate: end,
                lessons: lessonIds, // ✅ Store only lesson IDs
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