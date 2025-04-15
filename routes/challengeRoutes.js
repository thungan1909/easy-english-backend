const express = require("express");
const router = express.Router();
const multer = require("multer");

const challengeController = require("../controllers/challengeController");
const authMiddleware = require("../middlewares/authMiddleware");

const storage = multer.memoryStorage();
const upload = multer({ storage });

router.post(
  "/create",
  upload.fields([{ name: "imageFile" }]),
  authMiddleware,
  challengeController.createChallenge
);
router.put(
  "/update/:id",
  upload.fields([{ name: "imageFile" }, { name: "audioFile" }]),
  authMiddleware,
  challengeController.updateChallenge
);

router.delete(
  "/delete/:id",
  authMiddleware,
  challengeController.deleteChallenge
);
router.get("/:id", challengeController.getChallengeById);
router.get("/list/inquiry", challengeController.getListChallenge);
router.get("/get-by-lesson/:id", challengeController.getChallengeByLessonId);
router.put("/list/update", challengeController.updateChallengesMutation);

module.exports = router;
