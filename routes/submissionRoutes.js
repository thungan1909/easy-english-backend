const express = require("express");
const router = express.Router();

const submissionController = require("../controllers/submissionController");
const authMiddleware = require("../middlewares/authMiddleware");

router.post("/listen/submit", authMiddleware, submissionController.listenLesson);
router.get("/result/:id", authMiddleware, submissionController.getLessonResult);
router.post("/listen/compare", submissionController.compareLesson);
router.get("/top-score/:id", submissionController.getTopScores)
module.exports = router;