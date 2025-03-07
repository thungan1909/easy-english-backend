const lessonController = require("../controllers/lessonController");
const router = require("express").Router();
const authMiddleware = require("../middlewares/authMiddleware");

router.post("/create", authMiddleware, lessonController.createLesson)
router.get("/list/inquiry", lessonController.getListLesson)

module.exports = router;