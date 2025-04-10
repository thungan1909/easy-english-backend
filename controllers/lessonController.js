const Lesson = require("../models/Lesson");
const User = require("../models/User");
const Submission = require("../models/Submission");

const mongoose = require("mongoose");

const lessonController = {
  generateLessonCode: async () => {
    const lastLesson = await Lesson.findOne().sort({ createdAt: -1 });
    const index = lastLesson
      ? parseInt(lastLesson.code.replace("ES", ""), 10) + 1
      : 0;
    return `ES${index}`;
  },

  createLesson: async (req, res) => {
    try {
      const {
        title,
        content,
        wordsWithHint,
        wordsWithoutHint,
        description,
        source,
        imageFile,
        audioFile,
      } = req.body;

      if (!title || !content || !wordsWithoutHint || !wordsWithHint) {
        return res
          .status(400)
          .json({ message: "Title, content, and words are required." });
      }

      const userId = req.user?.id;
      if (!userId) {
        return res
          .status(401)
          .json({ message: "Unauthorized: No creator specified." });
      }

      const user = await User.findById(userId).select("username");
      if (!user) return res.status(404).json({ message: "User not found" });

      const code = await lessonController.generateLessonCode();

      const newLesson = await Lesson.create({
        title,
        content,
        description,
        wordsWithHint,
        wordsWithoutHint,
        imageFile,
        audioFile,
        creator: userId,
        source,
        code,
        view: 0,
      });

      res
        .status(201)
        .json({ message: "Lesson created successfully.", lesson: newLesson });
    } catch (err) {
      console.error("Create new lesson Error:", err);
      res.status(500).json({ message: "Internal Server Error" });
    }
  },

  updateLesson: async (req, res) => {
    try {
      const { id } = req.params;

      const {
        title,
        content,
        wordsWithHint,
        wordsWithoutHint,
        description,
        source,
        imageFile,
        audioFile,
      } = req.body;

      if (!title || !content || !wordsWithoutHint || !wordsWithHint) {
        return res
          .status(400)
          .json({ message: "Title, content, and words are required." });
      }

      const userId = req.user?.id;
      if (!userId) {
        return res
          .status(401)
          .json({ message: "Unauthorized: No creator specified." });
      }

      const user = await User.findById(userId).select("username");
      if (!user) return res.status(404).json({ message: "User not found" });

      const updatedLesson = await Lesson.findByIdAndUpdate(
        id,
        {
          title,
          content,
          description,
          wordsWithHint,
          wordsWithoutHint,
          imageFile,
          audioFile,
          source,
        },
        { new: true }
      );

      if (!updatedLesson) {
        return res.status(404).json({ message: "Lesson not found." });
      }

      res.status(200).json({
        message: "Lesson updated successfully.",
        lesson: updatedLesson,
      });
    } catch (err) {
      console.error("Edit lesson Error:", err);
      res.status(500).json({ message: "Internal Server Error" });
    }
  },

  deleteLesson: async (req, res) => {
    try {
      const { id } = req.params;

      if (!id) {
        return res.status(400).json({ message: "Lesson ID is required." });
      }

      const lesson = await Lesson.findById(id);
      if (!lesson) {
        return res.status(404).json({ message: "Lesson not found." });
      }

      const userId = req.user?.id;
      if (!userId) {
        return res
          .status(401)
          .json({ message: "Unauthorized: No user specified." });
      }

      if (lesson.creator.toString() !== userId) {
        return res.status(403).json({
          message:
            "Forbidden: You do not have permission to delete this lesson.",
        });
      }

      await Lesson.findByIdAndDelete(id);

      res.status(200).json({ message: "Lesson deleted successfully." });
    } catch (err) {
      console.error("Delete lesson Error:", err);
      res.status(500).json({ message: "Internal Server Error" });
    }
  },

  getListLesson: async (req, res) => {
    try {
      const lessons = await Lesson.find().populate("creator", "username");
      res.status(200).json(lessons);
    } catch (err) {
      console.error("Error fetching lessons:", err);
      res.status(500).json({ message: "Internal Server Error" });
    }
  },

  getLessonById: async (req, res) => {
    try {
      const { id } = req.params;

      if (!mongoose.Types.ObjectId.isValid(id)) {
        return res.status(400).json({ message: "Invalid lesson ID." });
      }

      const lesson = await Lesson.findById(id).populate("creator", "username");

      if (!lesson) {
        return res.status(404).json({ message: "Lesson not found." });
      }

      res.status(200).json(lesson);
    } catch (err) {
      console.error("Error fetching lesson by ID:", err);
      res.status(500).json({ message: "Internal Server Error" });
    }
  },

  getLessonsBatch: async (req, res) => {
    try {
      const { ids } = req.query;

      const userId = req.user?.id;
      if (!userId) {
        return res
          .status(401)
          .json({ message: "Unauthorized: No user specified." });
      }

      if (!ids) {
        return res.status(400).json({ message: "Missing 'ids' parameter" });
      }

      const lessonIds = ids
        .split(",")
        .filter((id) => mongoose.Types.ObjectId.isValid(id));

      if (lessonIds.length === 0) {
        return res.status(400).json({ message: "Invalid lesson IDs." });
      }

      const lessons = await Lesson.find({ _id: { $in: lessonIds } })
        .select("title")
        .lean();

      const submissions = await Submission.find({
        lessonId: { $in: lessonIds },
        userId,
      }).populate("lessonId", "title");

      const lessonsWithResults = lessons.map((lesson) => {
        const userSubmission = submissions.find(
          (sub) => sub.lessonId?._id.toString() === lesson._id.toString()
        );

        return {
          lessonId: lesson._id,
          title: lesson.title,
          userSubmission,
        };
      });

      return res.status(200).json(lessonsWithResults);
    } catch (err) {
      console.error("Error fetching lessons:", err);
      return res.status(500).json({ message: "Internal Server Error" });
    }
  },
};

module.exports = lessonController;
