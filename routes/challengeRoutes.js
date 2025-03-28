const express = require("express");
const router = express.Router();
const multer = require("multer");

const challengeController = require("../controllers/challengeController");
const authMiddleware = require("../middlewares/authMiddleware");

const storage = multer.memoryStorage();
const upload = multer({ storage });

router.post("/create",
    upload.fields([{ name: "imageFile" }]), authMiddleware,
    challengeController.createChallenge
);
router.get("/:id", challengeController.getChallengeById);
<<<<<<< HEAD
router.get("/list/inquiry", challengeController.getListChallenge);
router.get("/get-by-lesson/:id", challengeController.getChallengeByLessonId);
router.put("/list/update", challengeController.updateChallengesMutation)
=======
router.get("/get-by-lesson/:id", challengeController.getChallengesByLessonId);
>>>>>>> e75fd1e69facd542a7c18b16cc19e021a72dc38e

module.exports = router;