const lessonController = require("../controllers/lessonController");
const router = require("express").Router();

router.post("/create", lessonController.createLesson)

module.exports = router;