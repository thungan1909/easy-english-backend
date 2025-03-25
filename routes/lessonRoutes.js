const express = require("express");
const router = express.Router();
const multer = require("multer");

const lessonController = require("../controllers/lessonController");
const authMiddleware = require("../middlewares/authMiddleware");

const storage = multer.memoryStorage();
const upload = multer({ storage });

router.post("/create",
    upload.fields([{ name: "imageFile" }, { name: "audioFile" }]), authMiddleware,
    lessonController.createLesson
);

router.put("/edit/:id",
    upload.fields([{ name: "imageFile" }, { name: "audioFile" }]), authMiddleware,
    lessonController.editLesson
);

router.delete("/delete/:id",
    authMiddleware,
    lessonController.deleteLesson
);

router.get("/list/inquiry", lessonController.getListLesson);
router.get("/:id", lessonController.getLessonById);

module.exports = router;
