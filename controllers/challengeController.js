const Challenge = require("../models/Challenge");
const User = require("../models/User");
const mongoose = require("mongoose");

const challengeController = {
    isValidObjectId: (id) => {
        return typeof id === "string" && mongoose.Types.ObjectId.isValid(id);
    },
    getChallengeById: async (req, res) => {
        try {
            const { id } = req.params;

            if (!mongoose.Types.ObjectId.isValid(id)) {
                return res.status(400).json({ message: "Invalid challenge ID." });
            }

            const challenge = await Challenge.findById(id).populate("creator", "username");

            if (!challenge) {
                return res.status(404).json({ message: "Challenge not found." });
            }

            res.status(200).json(challenge);
        } catch (err) {
            console.error("Error fetching challenge by ID:", err);
            res.status(500).json({ message: "Internal Server Error" });
        }
    },
    getListChallenge: async (req, res) => {
        try {
            const lessons = await Challenge.find().populate("creator", "username");
            res.status(200).json(lessons);
        } catch (err) {
            console.error("Error fetching lessons:", err);
            res.status(500).json({ message: "Internal Server Error" });
        }
    },

    getChallengeByLessonId: async (req, res) => {
        try {
            const { id } = req.params;

            if (!mongoose.Types.ObjectId.isValid(id)) {
                return res.status(400).json({ message: "Invalid Lesson ID." });
            }
            const lessonObjectId = new mongoose.Types.ObjectId(id);

            const challenges = await Challenge.find({ lessons: lessonObjectId })
                .populate("creator", "username")
                .populate("lessons");


            if (!challenges || challenges.length === 0) {
                return res.status(200).json({
                    message: "No challenge found for this lesson.",
                    exists: false,
                });
            }

            res.status(200).json({ exists: challenges.length > 0, challenges });
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

            const start = new Date(startDate);
            const end = new Date(endDate);
            if (isNaN(start.getTime()) || isNaN(end.getTime())) {
                return res.status(400).json({ message: "Invalid date format." });
            }
            if (end < start) {
                return res.status(400).json({ message: "End date must be after or equal to start date." });
            }
            const timeLeft = Math.floor((end - start) / (1000 * 60 * 60));

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
                timeLeft,
                startDate: start,
                endDate: end,
                lessons: lessonIds,
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
    updateChallengesMutation: async (req, res) => {
        try {
            let challenges = req.body;

            if (typeof challenges === "object" && !Array.isArray(challenges)) {
                challenges = Object.values(challenges).filter(item => typeof item === "object" && item._id);
            }

            if (!Array.isArray(challenges) || challenges.length === 0) {
                return res.status(400).json({ message: "Invalid data format. Expected a non-empty array of challenges." });
            }

            // Convert ObjectId fields
            challenges.forEach((challenge) => {
                if (challengeController.isValidObjectId(challenge._id)) {
                    challenge._id = new mongoose.Types.ObjectId(challenge._id);
                }

                if (challenge.participants) {
                    challenge.participants.forEach((participant) => {
                        if (participant.userId && typeof participant.userId === "string" && challengeController.isValidObjectId(participant.userId)) {
                            participant.userId = new mongoose.Types.ObjectId(participant.userId);
                        }

                        if (participant.lessonResults) {
                            if (Array.isArray(participant.lessonResults)) {
                                participant.lessonResults = participant.lessonResults
                                    .filter((result) => challengeController.isValidObjectId(result))
                                    .map((result) => new mongoose.Types.ObjectId(result));
                            } else if (challengeController.isValidObjectId(participant.lessonResults)) {
                                participant.lessonResults = new mongoose.Types.ObjectId(participant.lessonResults);
                            }
                        }
                    });
                }
            });

            const bulkOperations = [];

            challenges.forEach((challenge) => {
                challenge.participants.forEach((participant) => {
                    bulkOperations.push({
                        updateOne: {
                            filter: {
                                _id: challenge._id,
                                "participants.userId": participant.userId
                            },
                            update: {
                                $push: { "participants.$.lessonResults": { $each: participant.lessonResults || [] } },
                                $set: {
                                    "participants.$.totalScore": participant.totalScore,
                                    "participants.$.averageAccuracy": {
                                        $divide: [
                                            { $sum: "$participants.lessonResults.accuracy" }, // Tổng accuracy
                                            { $size: "$participants.lessonResults" } // Số bài đã làm
                                        ]
                                    }
                                }
                            }
                        }
                    });

                });
            });

            await Challenge.bulkWrite(bulkOperations);

            res.status(200).json({ message: "Challenges updated successfully!" });
        } catch (error) {
            console.error("Error updating challenges:", error);
            res.status(500).json({ message: "Internal Server Error" });
        }
    }

    getChallengesByLessonId: async (req, res) => {
        try {
            const { id } = req.params;
            if (!mongoose.Types.ObjectId.isValid(id)) {
                return res.status(400).json({ message: "Invalid Lesson ID." });
            }
    
            const challenges = await Challenge.find({ lessons: id })
                .populate("creator", "username")
                .populate("lessons");
    
            if (!challenges.length) {
                return res.status(404).json({ message: "No challenges found for this lesson." });
            }
    
            res.status(200).json(challenges);
        } catch (err) {
            console.error("Error fetching Challenges by Lesson ID:", err);
            res.status(500).json({ message: "Internal Server Error" });
        }
    },
    


}

module.exports = challengeController;