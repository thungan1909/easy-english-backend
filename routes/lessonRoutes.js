const express = require("express");
const router = express.Router();
const multer = require("multer");
const path = require("path");

const lessonController = require("../controllers/lessonController");
const authMiddleware = require("../middlewares/authMiddleware");

// ⚡ Configure Multer storage
const storage = multer.memoryStorage(); // Stores files in memory (use diskStorage if needed)
const upload = multer({ storage });

// ✅ Fix: Use `upload.fields` AFTER defining `upload`
router.post("/create",
    upload.fields([{ name: "imageFile" }, { name: "audioFile" }]), authMiddleware,
    lessonController.createLesson
);

router.get("/list/inquiry", lessonController.getListLesson);
router.get("/:id", lessonController.getLessonById);

module.exports = router;
