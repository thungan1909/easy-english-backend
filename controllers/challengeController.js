const Challenge = require("../models/Challenge");
const Submission = require("../models/Submission");
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

      const challenge = await Challenge.findById(id)
        .populate("creator", "username")
        .populate("participants.userId", "username fullName")
        .lean();

      if (!challenge) {
        return res.status(404).json({ message: "Challenge not found." });
      }

      challenge.participants = challenge.participants.map(
        ({ userId, ...rest }) => ({
          userId: userId._id,
          username: userId.username,
          fullName: userId.fullName,
          ...rest,
        })
      );

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

      const userId = req.user?.id;
      if (!userId) {
        return res
          .status(401)
          .json({ message: "Unauthorized: No creator specified." });
      }

      const user = await User.findById(userId).select("username");
      if (!user) return res.status(404).json({ message: "User not found" });

      const submissions = await Submission.find({
        lessonId: { $in: lessons },
      });

      let totalScore = 0;
      let totalAccuracy = 0;
      let totalSubmission = submissions.length;

      const userSubmissions = {};

      submissions.forEach((submission) => {
        const { userId, lessonId, score, accuracy } = submission;
        if (!userSubmissions[userId]) {
          userSubmissions[userId] = {
            totalScore: 0,
            totalAccuracy: 0,
            lessonResults: [],
            submissionCount: 0,
          };
        }
        userSubmissions[userId].totalScore += score;
        userSubmissions[userId].totalAccuracy += accuracy;
        userSubmissions[userId].submissionCount += 1;
        userSubmissions[userId].lessonResults.push({
          lessonId,
          score,
          accuracy,
        });
      });

      const participants = Object.entries(userSubmissions).map(
        ([userId, data]) => {
          const lessonCount = data.lessonResults.length;
          const averageScore =
            lessonCount > 0 ? data.totalScore / lessonCount : 0;
          const averageAccuracy =
            lessonCount > 0 ? data.totalAccuracy / lessonCount : 0;

          totalScore += data.totalScore;
          totalAccuracy += data.totalAccuracy;

          return {
            userId,
            totalScore: data.totalScore,
            totalAccuracy: data.totalAccuracy,
            averageScore,
            averageAccuracy,
            totalSubmission: data.submissionCount,
            lessonResults: data.lessonResults,
          };
        }
      );

      const averageScore =
        totalSubmission > 0 ? totalScore / totalSubmission : 0;
      const averageAccuracy =
        totalSubmission > 0 ? totalAccuracy / totalSubmission : 0;

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
        lessons,
        participants,
        totalScore,
        totalAccuracy,
        totalSubmission,
        averageScore,
        averageAccuracy,
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

  updateChalllenge: async (req, res) => {
    try {
      const { id } = req.params;
      let {
        title,
        description,
        coinAward,
        coinFee,
        imageFile,
        startDate,
        endDate,
        timeLeft,
        lessons,
        participants,
        averageScore,
        averafeAccuracy,
        totalScore,
        totalSubmission,
      } = req.body;

      const userId = req.user?.id;
      if (!userId) {
        return res
          .status(401)
          .json({ message: "Unauthorized: No creator specified." });
      }

      const user = await User.findById(userId).select("username");
      if (!user) return res.status(404).json({ message: "User not found" });

      const updatedChallenge = await Challenge.findByIdAndUpdate(
        id,
        {
          title,
          description,
          coinAward,
          coinFee,
          imageFile,
          startDate,
          endDate,
          timeLeft,
          lessons,
          participants,
          averageScore,
          averafeAccuracy,
          totalScore,
          totalSubmission,
        },
        {
          new: true,
        }
      );

      if (!updatedChallenge) {
        return res.status(404).json({ message: "Challenge not found." });
      }
      res.status(200).json({
        message: "Challenge updated successfully.",
        challenge: updatedChallenge,
      });
    } catch (err) {
      console.error("Challenge updated Error:", err);
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
                      totalAccuracy: participant.totalAccuracy || 0,
                      averageScore: participant.averageScore || 0,
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

            const totalScorePerParticipant =
              participant.lessonResults?.reduce(
                (sum, result) => sum + (result.score || 0),
                0
              ) || 0;

            participant.totalAccuracy =
              participant.lessonResults?.reduce(
                (sum, result) => sum + (result.accuracy || 0),
                0
              ) || 0;

            participant.averageScore =
              participant.lessonResults?.length > 0
                ? totalScorePerParticipant / participant.lessonResults.length
                : 0;

            participant.averageAccuracy =
              participant.lessonResults?.length > 0
                ? participant.totalAccuracy / participant.lessonResults.length
                : 0;

            bulkOperations.push({
              updateOne: {
                filter: {
                  _id: challenge._id,
                  "participants.userId": participant.userId,
                },
                update: {
                  $set: {
                    "participants.$.totalScore": totalScorePerParticipant,
                    "participants.$.totalAccuracy": participant.totalAccuracy,
                    "participants.$.averageScore": participant.averageScore,
                    "participants.$.averageAccuracy":
                      participant.averageAccuracy,
                  },
                },
              },
            });

            const totalScore = challenge.participants.reduce(
              (sum, p) => sum + (p.totalScore || 0),
              0
            );

            const totalAccuracy = challenge.participants.reduce(
              (sum, p) => sum + (p.totalAccuracy || 0),
              0
            );
            const totalSubmission = challenge.participants.reduce(
              (sum, p) => sum + (p.lessonResults?.length || 0),
              0
            );

            const averageScore =
              totalSubmission > 0 ? totalScore / totalSubmission : 0;
            const averageAccuracy =
              totalSubmission > 0 ? totalAccuracy / totalSubmission : 0;

            bulkOperations.push({
              updateOne: {
                filter: { _id: challenge._id },
                update: {
                  $set: {
                    totalScore,
                    totalAccuracy,
                    totalSubmission,
                    averageScore,
                    averageAccuracy,
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
