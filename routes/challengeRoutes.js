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

router.get("/list/inquiry", challengeController.getListChallenge);
router.get("/:id", challengeController.getChallengeById);

module.exports = router;