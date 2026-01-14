const Lesson = require("../models/Lesson");
const Submission = require("../models/Submission");
const User = require("../models/User");
const mongoose = require("mongoose");

const submissionController = {
  calculateScore: (totalFilledBlanks, blankCount, correctAnswers) => {
    if (totalFilledBlanks === 0 || blankCount === 0) return 0;

    const difficultyFactor = blankCount * 2;
    let score = (correctAnswers / blankCount) * difficultyFactor;

    return Math.round(score);
  },

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

    const accuracy =
      blankCount > 0
        ? Number(((correctCount / blankCount) * 100).toFixed(2))
        : 0;

    return {
      accuracy: accuracy,
      blankCount,
      correctAnswers: correctCount,
      totalFilledBlanks: filledBlankCount,
    };
  },

  compareLesson: async (req, res) => {
    try {
      const { lessonId, original_array, result_array, user_array } = req.body;

      if (
        !lessonId ||
        ![original_array, result_array, user_array].every(
          (arr) => Array.isArray(arr) && arr.length
        )
      ) {
        return res.status(400).json({ message: "Invalid input data" });
      }

      const lesson = await Lesson.findById(lessonId);
      if (!lesson) {
        return res.status(404).json({ message: "Lesson not found" });
      }

      if (
        ![user_array, result_array, original_array].every(
          (arr) => arr.length === result_array.length
        )
      ) {
        return res.status(400).json({ message: "Arrays length mismatch" });
      }

      accuracyResult = submissionController.calculateAccuracy(
        original_array,
        result_array,
        user_array
      );
      score = submissionController.calculateScore(
        accuracyResult.totalFilledBlanks,
        accuracyResult.blankCount,
        accuracyResult.correctAnswers
      );

      return res.status(200).json({
        accuracy: accuracyResult.accuracy,
        blankCount: accuracyResult.blankCount,
        correctAnswers: accuracyResult.correctAnswers,
        totalFilledBlanks: accuracyResult.totalFilledBlanks,
        score,
      });
    } catch (err) {
      return res.status(500).json({ message: "Internal server error" });
    }
  },

  listenLesson: async (req, res) => {
    try {
      const { lessonId, original_array, result_array, user_array } = req.body;
      const userId = req.user.id;

      if (
        !lessonId ||
        ![original_array, result_array, user_array].every(
          (arr) => Array.isArray(arr) && arr.length
        )
      ) {
        return res.status(400).json({ message: "Invalid input data" });
      }
      if (
        ![user_array, result_array, original_array].every(
          (arr) => arr.length === result_array.length
        )
      ) {
        return res.status(400).json({ message: "Arrays length mismatch" });
      }

      const lesson = await Lesson.findById(lessonId);
      if (!lesson) {
        return res.status(404).json({ message: "Lesson not found" });
      }

      const result = submissionController.calculateAccuracy(
        original_array,
        result_array,
        user_array
      );

      const score = submissionController.calculateScore(
        result.totalFilledBlanks,
        result.blankCount,
        result.correctAnswers
      );

      const now = new Date();
      const startOfWeek = new Date(now);

      const existingSubmission = await Submission.findOne({ userId, lessonId });
      if (existingSubmission) {
        // Update existing submission
        await Submission.updateOne(
          { _id: existingSubmission._id },
          {
            original_array,
            user_array,
            result_array,
            correct_answers: result.correctAnswers,
            total_filled_blanks: result.totalFilledBlanks,
            accuracy: result.accuracy,
            score,
            submittedAt: now,
          }
        );
      } else {
        // Create new submission
        await Submission.create({
          userId,
          lessonId,
          original_array,
          user_array,
          result_array,
          correct_answers: result.correctAnswers,
          total_filled_blanks: result.totalFilledBlanks,
          accuracy: result.accuracy,
          score,
          submittedAt: now,
        });
      }
      // const submissionResponse = {
      //   userId,
      //   lessonId,
      //   original_array,
      //   user_array,
      //   result_array,
      //   correct_answers: result.correctAnswers,
      //   total_filled_blanks: result.totalFilledBlanks,
      //   accuracy: result.accuracy,
      //   score,
      // };
      // const submissionPromise = Submission.create(submissionResponse);

      // const lessonUpdatePromise = Lesson.findByIdAndUpdate(
      //   lessonId,
      //   {
      //     $inc: { listenCount: 1 },
      //     $addToSet: { listenedBy: userId },
      //     $push: {
      //       topScores: {
      //         $each: [
      //           {
      //             user: userId,
      //             score,
      //             accuracy: result.accuracy,
      //             submittedAt: now,
      //           },
      //         ],
      //         $position: 0,
      //       },
      //     },
      //   },
      //   { new: true }
      // );

      const lessonUpdatePromise = Lesson.findByIdAndUpdate(
        lessonId,
        {
          $inc: { listenCount: 1 },
          $addToSet: { listenedBy: userId },
        },
        { new: true }
      ).then(async (updatedLesson) => {
        // Remove old topScore of this user
        updatedLesson.topScores = updatedLesson.topScores.filter(
          (entry) => entry.user.toString() !== userId.toString()
        );

        // Add updated score at the top
        updatedLesson.topScores.unshift({
          user: userId,
          score,
          accuracy: result.accuracy,
          submittedAt: now,
        });

        // Save the updated lesson
        return await updatedLesson.save();
      });

      const userUpdatePromise = User.bulkWrite([
        {
          updateOne: {
            filter: { _id: userId, "weeklyScores.weekStart": startOfWeek },
            update: {
              $inc: { "weeklyScores.$.score": score, totalScore: score },
            },
          },
        },
        {
          updateOne: {
            filter: {
              _id: userId,
              "weeklyScores.weekStart": { $ne: startOfWeek },
            },
            update: {
              $push: { weeklyScores: { weekStart: startOfWeek, score } },
              $inc: { totalScore: score },
            },
          },
        },
        {
          updateOne: {
            filter: { _id: userId, "listenedLessons.lesson": lessonId },
            update: { $set: { "listenedLessons.$.listenedAt": now } },
          },
        },
        {
          updateOne: {
            filter: {
              _id: userId,
              "listenedLessons.lesson": { $ne: lessonId },
            },
            update: {
              $push: { listenedLessons: { lesson: lessonId, listenedAt: now } },
            },
          },
        },
      ]);

      await Promise.all([
        // submissionPromise,
        lessonUpdatePromise,
        userUpdatePromise,
      ]);

      return res.status(200).json({
        message: "Submission received successfully",
        userId,
        lessonId,
        original_array,
        user_array,
        result_array,
        correct_answers: result.correctAnswers,
        total_filled_blanks: result.totalFilledBlanks,
        accuracy: result.accuracy,
        score,
      });
    } catch (err) {
      console.error("Error in listen Lesson:", err);
      return res.status(500).json({ message: "Internal server error" });
    }
  },

  getTopScores: async (req, res) => {
    try {
      const { id: lessonId } = req.params;

      if (!mongoose.Types.ObjectId.isValid(lessonId)) {
        return res.status(400).json({ message: "Invalid lesson ID." });
      }

      const lesson = await Lesson.findById(lessonId).populate(
        "topScores.user",
        "username fullName avatarUrl"
      );

      if (!lesson) {
        return res.status(404).json({ message: "Lesson not found" });
      }

      return res.status(200).json({ topScores: lesson.topScores });
    } catch (err) {
      console.error("Error fetching top scores:", err);
      return res.status(500).json({ message: "Internal server error" });
    }
  },

  getLessonResult: async (req, res) => {
    try {
      const { id: lessonId } = req.params;
      const userId = req.user?.id;

      if (!mongoose.Types.ObjectId.isValid(lessonId)) {
        return res.status(400).json({ message: "Invalid lesson ID." });
      }
      if (!mongoose.Types.ObjectId.isValid(userId)) {
        return res.status(400).json({ message: "Invalid user ID." });
      }

      const submission = await Submission.findOne({ lessonId, userId })
        .populate("userId", "username email")
        .populate("lessonId", "title")
        .sort({ createdAt: -1 })
        .lean();

      if (!submission) {
        return res.status(200).json({ submission: null });
      }

      const formattedSubmission = {
        ...submission,
        user: submission.userId,
        lesson: submission.lessonId,
      };
      delete formattedSubmission.userId;
      delete formattedSubmission.lessonId;

      return res.status(200).json({ submission: formattedSubmission });
    } catch (err) {
      res.status(500).json({ message: "Internal Server Error" });
    }
  },

};

module.exports = submissionController;
