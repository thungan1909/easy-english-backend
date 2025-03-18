const express = require("express");
const router = express.Router();

const submissionController = require("../controllers/submissionController");
const authMiddleware = require("../middlewares/authMiddleware");

router.post("/listen/submit", authMiddleware, submissionController.listenLesson);
module.exports = router;