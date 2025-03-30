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

      const challenge = await Challenge.findById(id).populate(
        "creator",
        "username"
      );

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
      const {
        title,
        description,
        coinAward,
        coinFee,
        startDate,
        endDate,
        imageFile,
        lessons,
      } = req.body;

      if (
        !title ||
        !coinAward ||
        !coinFee ||
        !startDate ||
        !endDate ||
        !imageFile ||
        !Array.isArray(lessons) ||
        lessons.length === 0
      ) {
        return res.status(400).json({
          message:
            "All fields are required: title, award coin, fee coin, start date, end date, imageFile, and lessons.",
        });
      }

      const start = new Date(startDate);
      const end = new Date(endDate);
      if (isNaN(start.getTime()) || isNaN(end.getTime())) {
        return res.status(400).json({ message: "Invalid date format." });
      }
      if (end < start) {
        return res
          .status(400)
          .json({ message: "End date must be after or equal to start date." });
      }
      const timeLeft = Math.floor((end - start) / (1000 * 60 * 60));

      if (coinAward < 0 || coinFee < 0) {
        return res
          .status(400)
          .json({ message: "Award coin fee coin must be 0 or greater." });
      }

      const lessonIds = lessons.map((lesson) => lesson.id);

      const userId = req.user?.id;
      if (!userId) {
        return res
          .status(401)
          .json({ message: "Unauthorized: No creator specified." });
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
        completedUsersCount: 0,
        totalCompletionTime: 0,
        averageScore: 0,
        averageAccuracy: 0,
      });

      res.status(201).json({
        message: "Challenge created successfully.",
        challenge: newChallenge,
      });
    } catch (err) {
      console.error("Create new challenge error:", err);
      res.status(500).json({ message: "Internal Server Error" });
    }
  },

  updateChallengesMutation: async (req, res) => {
    try {
      let challenges = req.body;

      if (typeof challenges === "object" && !Array.isArray(challenges)) {
        challenges = Object.values(challenges).filter(
          (item) => typeof item === "object" && item._id
        );
      }

      if (!Array.isArray(challenges) || challenges.length === 0) {
        return res.status(400).json({
          message:
            "Invalid data format. Expected a non-empty array of challenges.",
        });
      }

      const bulkOperations = [];

      for (const challenge of challenges) {
        if (!challengeController.isValidObjectId(challenge._id)) continue;
        challenge._id = new mongoose.Types.ObjectId(challenge._id);

        if (Array.isArray(challenge.participants)) {
          for (const participant of challenge.participants) {
            if (
              !participant.userId ||
              !challengeController.isValidObjectId(participant.userId)
            )
              continue;
            participant.userId = new mongoose.Types.ObjectId(
              participant.userId
            );

            // 🔹 Ensure participant exists first
            bulkOperations.push({
              updateOne: {
                filter: {
                  _id: challenge._id,
                  "participants.userId": { $ne: participant.userId },
                },
                update: {
                  $push: {
                    participants: {
                      userId: participant.userId,
                      totalScore: participant.totalScore || 0,
                      averageAccuracy: participant.averageAccuracy || 0,
                      lessonResults: [],
                    },
                  },
                },
              },
            });

            if (Array.isArray(participant.lessonResults)) {
              for (const result of participant.lessonResults) {
                if (!challengeController.isValidObjectId(result.lessonId))
                  continue;

                result.lessonId = new mongoose.Types.ObjectId(result.lessonId);
                result.submissionId = challengeController.isValidObjectId(
                  result.submissionId
                )
                  ? new mongoose.Types.ObjectId(result.submissionId)
                  : null;

                // 🔹 Ensure lessonResult exists before updating
                bulkOperations.push({
                  updateOne: {
                    filter: {
                      _id: challenge._id,
                      "participants.userId": participant.userId,
                    },
                    update: {
                      $addToSet: {
                        "participants.$.lessonResults": result,
                      },
                    },
                  },
                });

                // 🔹 Update existing lesson result (fixing the positional operator issue)
                bulkOperations.push({
                  updateOne: {
                    filter: {
                      _id: challenge._id,
                      "participants.userId": participant.userId,
                      "participants.lessonResults.lessonId": result.lessonId,
                    },
                    update: {
                      $set: {
                        "participants.$.lessonResults.$[elem]": result,
                      },
                    },
                    arrayFilters: [{ "elem.lessonId": result.lessonId }],
                  },
                });
              }
            }

            // 🔹 Update participant stats (totalScore & averageAccuracy)
            const totalAccuracyPerParticipant =
              participant.lessonResults?.reduce(
                (sum, result) => sum + (result.accuracy || 0),
                0
              ) || 0;

            participant.averageAccuracy =
              participant.lessonResults?.length > 0
                ? totalAccuracyPerParticipant / participant.lessonResults.length
                : 0;

            bulkOperations.push({
              updateOne: {
                filter: {
                  _id: challenge._id,
                  "participants.userId": participant.userId,
                },
                update: {
                  $set: {
                    "participants.$.totalScore": participant.totalScore || 0,
                    "participants.$.totalAccuracy":
                      totalAccuracyPerParticipant || 0,
                    "participants.$.averageScore":
                      totalAccuracyPerParticipant || 0,
                    "participants.$.averageAccuracy":
                      participant.averageAccuracy,
                  },
                },
              },
            });

            // 🔹 Update challenge-level stats
            const participantCount = challenge.participants.length || 1;
            const totalScore = challenge.participants.reduce(
              (sum, p) => sum + (p.totalScore || 0),
              0
            );
            const totalAccuracy = challenge.participants.reduce(
              (sum, p) => sum + (p.totalScore || 0),
              0
            );
            // Tính tổng số lần submission (tổng số bài đã nộp của tất cả participants)
            const totalSubmissions = challenge.participants.reduce(
              (sum, p) => sum + (p.lessonResults?.length || 0),
              0
            );
            console.log("totalSubmissions", totalSubmissions);
            console.log(participantCount, totalScore, totalAccuracy, "total");

            const averageScore =
              totalSubmissions > 0 ? totalScore / totalSubmissions : 0;
            const averageAccuracy =
              totalSubmissions > 0 ? totalAccuracy / totalSubmissions : 0;

            console.log(
              averageScore,
              "averageScore",
              averageAccuracy,
              "averageAccuracy"
            );
            bulkOperations.push({
              updateOne: {
                filter: { _id: challenge._id },
                update: {
                  $set: {
                    averageScore: averageScore,
                    averageAccuracy: averageAccuracy,
                  },
                },
              },
            });
          }
        }
      }

      if (bulkOperations.length > 0) {
        await Challenge.bulkWrite(bulkOperations);
      }

      res.status(200).json({ message: "Challenges updated successfully!" });
    } catch (error) {
      console.error("Error updating challenges:", error);
      res.status(500).json({ message: "Internal Server Error" });
    }
  },
};

module.exports = challengeController;
